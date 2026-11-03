import fs from 'fs';
import path from 'path';

const authFilePath = path.resolve('backend/src/lib/auth.ts');
let content = fs.readFileSync(authFilePath, 'utf8');

// Add helper functions for dedicated encrypted rotation payload
const encryptionHelpers = `
/**
 * Derive AES-256 key strictly from the caller's raw refresh token and server secret.
 * Preimage resistance ensures that database readers possessing only SHA-256 tokenHash
 * cannot derive this encryption key.
 */
function deriveRotationKey(rawRefreshToken: string): Buffer {
  return crypto
    .createHmac('sha256', JWT_ACCESS_SECRET)
    .update(\`wepsun-session-rotation-recovery-key:\${rawRefreshToken}\`)
    .digest();
}

/**
 * Encrypt rotated tokens with AES-256-GCM.
 * Only an authentic caller presenting the exact raw refresh token can decrypt this payload.
 */
function encryptRotationPayload(tokens: AuthTokens, rawRefreshToken: string): string {
  const key = deriveRotationKey(rawRefreshToken);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(JSON.stringify(tokens), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return \`\${iv.toString('hex')}:\${tag.toString('hex')}:\${encrypted}\`;
}

/**
 * Decrypt rotated tokens using key derived from caller's raw refresh token.
 */
function decryptRotationPayload(encryptedPayload: string, rawRefreshToken: string): AuthTokens | null {
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) return null;
    const [ivHex, tagHex, ciphertext] = parts;
    const key = deriveRotationKey(rawRefreshToken);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

/**
 * Purge any legacy JSON credentials inadvertently stored in userAgent
 */
export async function scrubLegacyUserAgentCredentials(): Promise<number> {
  try {
    const res = await prisma.$executeRawUnsafe(
      'UPDATE user_sessions SET "userAgent" = NULL WHERE "userAgent" LIKE \\'{%\\''
    );
    return Number(res) || 0;
  } catch {
    return 0;
  }
}
`;

// Replace activeRotations and rotateSession + revokeSessionByToken
const targetRegex = /\/\/ Active in-flight refresh rotations deduplication map[\s\S]*?export async function revokeAllUserSessions/;

const replacement = `// Active in-flight refresh rotations deduplication map (prevents duplicate session creations under parallel bursts)
const activeRotations = new Map<string, Promise<{ user: any; tokens: AuthTokens } | null>>();
${encryptionHelpers}
/**
 * Validate refresh token and rotate (Single-Use Rotation with Grace Window for Race Conditions)
 * Uses dedicated SessionRotation table with AES-256-GCM encrypted recovery tokens.
 * user_sessions.userAgent is NEVER used for credentials.
 */
export async function rotateSession(
  rawRefreshToken: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ user: any; tokens: AuthTokens } | null> {
  const incomingHash = hashToken(rawRefreshToken);

  // 1. Parallel Request Deduplication: Coalesce concurrent in-flight refresh calls
  if (activeRotations.has(incomingHash)) {
    return await activeRotations.get(incomingHash)!;
  }

  const rotationTask = (async () => {
    // Check PostgreSQL first
    let session: any = null;
    try {
      session = await prisma.userSession.findUnique({
        where: { tokenHash: incomingHash },
        include: { user: true },
      });
    } catch {
      session = null;
    }

    if (!session) {
      session = memorySessions.get(incomingHash) || null;
    }

    if (!session) {
      return null;
    }

    // 2. Concurrency & Network Retry Grace Window vs True Replay Defense (Cross-Instance Safe):
    if (session.isRevoked) {
      let rotationRecord: any = null;
      try {
        rotationRecord = await prisma.sessionRotation.findUnique({
          where: { oldTokenHash: incomingHash },
        });
      } catch {
        rotationRecord = null;
      }

      // Explicit logout check: NEVER allow grace window for explicit logout!
      if (rotationRecord?.revocationReason === 'LOGOUT' || session.revocationReason === 'LOGOUT') {
        throw new AuthSecurityError('Session has been revoked due to logout.', 'SESSION_REVOKED', 401);
      }

      const graceLimitMs = getRefreshGraceWindowMs();
      let isWithinGrace = false;
      let recoveredTokens: AuthTokens | null = null;

      if (rotationRecord && rotationRecord.revocationReason === 'ROTATED') {
        const elapsed = Date.now() - new Date(rotationRecord.rotatedAt).getTime();
        if (elapsed <= graceLimitMs) {
          isWithinGrace = true;
          // Decrypt payload using caller's rawRefreshToken (only authentic caller can decrypt!)
          recoveredTokens = decryptRotationPayload(rotationRecord.encryptedPayload, rawRefreshToken);
        }
      }

      // Memory fallback for offline test / mock DB mode
      if (!recoveredTokens && session.rotatedResult && session.revocationReason === 'ROTATED') {
        const revokedAtTime = session.revokedAt ? new Date(session.revokedAt).getTime() : 0;
        if (Date.now() - revokedAtTime <= graceLimitMs) {
          recoveredTokens = session.rotatedResult.tokens;
          isWithinGrace = true;
        }
      }

      if (isWithinGrace && recoveredTokens) {
        let userObj = session.user;
        if (!userObj) {
          try {
            userObj = await prisma.user.findUnique({ where: { id: session.userId } });
          } catch {}
        }
        if (!userObj) {
          const { db } = await import('../data/mockDb.js');
          userObj = db.users.find((u) => u.id === session.userId);
        }
        return {
          user: userObj,
          tokens: recoveredTokens,
        };
      }

      // Outside concurrency window, or replayed without rotation record: TRUE REPLAY ATTACK DETECTED.
      console.warn(\`[Security] Refresh token reuse / replay attack detected for user \${session.userId}. Revoking all sessions.\`);
      try {
        await revokeAllUserSessions(session.userId);
      } catch {
        // Non-blocking
      }
      throw new AuthSecurityError('Refresh token reuse detected. All sessions have been revoked for your security.', 'REFRESH_TOKEN_REUSED', 401);
    }

    // Check expiration
    if (new Date() > session.expiresAt) {
      try {
        await prisma.userSession.update({
          where: { id: session.id },
          data: { isRevoked: true, revokedAt: new Date() },
        });
      } catch {
        // Non-blocking
      }
      if (memorySessions.has(incomingHash)) {
        const s = memorySessions.get(incomingHash)!;
        s.isRevoked = true;
        s.revokedAt = new Date();
      }
      return null;
    }

    let user = session.user;
    if (!user) {
      try {
        user = await prisma.user.findUnique({ where: { id: session.userId } });
      } catch {
        user = null;
      }
    }
    if (!user) {
      const { db } = await import('../data/mockDb.js');
      user = db.users.find((u) => u.id === session.userId);
    }

    if (!user || user.isActive === false) {
      return null;
    }

    // Check if technician is blocked
    if (user.role === 'TECHNICIAN' && user.technicianId) {
      try {
        const tech = await prisma.technician.findUnique({ where: { id: user.technicianId } });
        if (tech && tech.accountStatus === 'BLOCKED') {
          throw new AuthSecurityError('Your technician account has been blocked. Please contact the administrator.', 'ACCOUNT_BLOCKED', 403);
        }
      } catch (err) {
        if (err instanceof AuthSecurityError) throw err;
        if (process.env.NODE_ENV !== 'test' || process.env.TEST_FAIL_CLOSED === 'true') {
          throw new AuthSecurityError('Security verification unavailable. Cannot verify technician account status.', 'AUTH_SERVICE_UNAVAILABLE', 503);
        }
        const { db } = await import('../data/mockDb.js');
        const tech = (db as any).technicians?.find((t: any) => t.id === user.technicianId);
        if (tech && tech.accountStatus === 'BLOCKED') {
          throw new AuthSecurityError('Your technician account has been blocked. Please contact the administrator.', 'ACCOUNT_BLOCKED', 403);
        }
      }
    }

    // ATOMIC DATABASE ROTATION ACROSS INSTANCES:
    // Exactly ONE instance wins the atomic update where isRevoked = false!
    const revokeTimestamp = new Date();
    try {
      const updateResult = await prisma.userSession.updateMany({
        where: {
          id: session.id,
          isRevoked: false,
          tokenHash: incomingHash,
        },
        data: {
          isRevoked: true,
          revokedAt: revokeTimestamp,
          lastUsedAt: revokeTimestamp,
        },
      });

      if (updateResult.count === 0) {
        // Another instance won the race! Await 60ms and recover via sessionRotation table
        await new Promise((r) => setTimeout(r, 60));
        const raceRotation = await prisma.sessionRotation.findUnique({
          where: { oldTokenHash: incomingHash },
        });
        if (raceRotation && raceRotation.revocationReason === 'ROTATED') {
          const recovered = decryptRotationPayload(raceRotation.encryptedPayload, rawRefreshToken);
          if (recovered) {
            return { user, tokens: recovered };
          }
        }
        throw new AuthSecurityError('Refresh token was rotated concurrently.', 'REFRESH_TOKEN_REUSED', 401);
      }
    } catch (err) {
      if (err instanceof AuthSecurityError) throw err;
    }

    // 1. Issue rotated new refresh token & session
    const newSession = await createSession(user.id, user.companyId, userAgent, ipAddress);

    // 2. Issue new access token
    const payload: JwtUserPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      branchId: user.branchId,
      clientId: user.clientId,
      technicianId: user.technicianId,
      tokenVersion: user.tokenVersion || 0,
    };
    const accessToken = generateAccessToken(payload);

    const rotationResult = {
      user,
      tokens: {
        accessToken,
        refreshToken: newSession.refreshToken,
        expiresIn: 900, // 15m in seconds
      },
    };

    // 3. Encrypt rotated credentials using key derived strictly from rawRefreshToken
    const encryptedPayload = encryptRotationPayload(rotationResult.tokens, rawRefreshToken);
    const graceWindowMs = getRefreshGraceWindowMs();

    try {
      await prisma.sessionRotation.upsert({
        where: { oldTokenHash: incomingHash },
        create: {
          oldTokenHash: incomingHash,
          userId: user.id,
          encryptedPayload,
          rotatedAt: revokeTimestamp,
          expiresAt: new Date(Date.now() + graceWindowMs),
          revocationReason: 'ROTATED',
        },
        update: {
          encryptedPayload,
          rotatedAt: revokeTimestamp,
          expiresAt: new Date(Date.now() + graceWindowMs),
          revocationReason: 'ROTATED',
        },
      });
    } catch {
      // Non-blocking
    }

    // 4. Update in-memory session cache for fast single-instance access
    memorySessions.set(incomingHash, {
      ...(memorySessions.get(incomingHash) || session),
      isRevoked: true,
      revokedAt: revokeTimestamp,
      lastUsedAt: revokeTimestamp,
      revocationReason: 'ROTATED',
      rotatedResult: rotationResult,
    });

    return rotationResult;
  })();

  activeRotations.set(incomingHash, rotationTask);
  try {
    return await rotationTask;
  } finally {
    activeRotations.delete(incomingHash);
  }
}

/**
 * Revoke a single active session (Logout current device)
 * Immediately invalidates the token across all instances without grace window.
 */
export async function revokeSessionByToken(rawRefreshToken: string): Promise<boolean> {
  const tokenHash = hashToken(rawRefreshToken);
  let revoked = false;
  const logoutTimestamp = new Date();

  if (memorySessions.has(tokenHash)) {
    const s = memorySessions.get(tokenHash)!;
    s.isRevoked = true;
    s.revokedAt = logoutTimestamp;
    s.revocationReason = 'LOGOUT';
    s.rotatedResult = null;
    revoked = true;
  }

  try {
    const result = await prisma.userSession.updateMany({
      where: { tokenHash, isRevoked: false },
      data: { isRevoked: true, revokedAt: logoutTimestamp },
    });
    if (result.count > 0) revoked = true;

    // Record LOGOUT in session_rotations table so any retry across any instance is immediately rejected
    await prisma.sessionRotation.upsert({
      where: { oldTokenHash: tokenHash },
      create: {
        oldTokenHash: tokenHash,
        userId: 'revoked',
        encryptedPayload: '',
        rotatedAt: logoutTimestamp,
        expiresAt: new Date(logoutTimestamp.getTime() + 60000),
        revocationReason: 'LOGOUT',
      },
      update: {
        encryptedPayload: '',
        revocationReason: 'LOGOUT',
        rotatedAt: logoutTimestamp,
      },
    });
  } catch {
    // Non-blocking
  }

  return revoked;
}

export async function revokeAllUserSessions`;

if (!targetRegex.test(content)) {
  console.error('Target regex did not match!');
  process.exit(1);
}

content = content.replace(targetRegex, replacement);
fs.writeFileSync(authFilePath, content, 'utf8');
console.log('Successfully updated backend/src/lib/auth.ts!');
