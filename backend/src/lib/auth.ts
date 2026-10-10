/**
 * WEPSUN Engineering Solutions — Core Cryptographic Authentication & Session Manager
 * Production JWT, Password Hashing (bcryptjs), Refresh Token Rotation & Session Management
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from './prisma.js';

// Environment Secrets & Configurations
const JWT_ACCESS_SECRET = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || 'wepsun-production-secure-access-jwt-secret-key-32-chars';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m'; // 15 Minutes
const REFRESH_TOKEN_EXPIRES_DAYS = 7; // 7 Days

export interface JwtUserPayload {
  sub: string; // User ID
  userId?: string;
  email: string;
  role: string;
  companyId: string;
  branchId?: string | null;
  clientId?: string | null;
  technicianId?: string | null;
  tokenVersion?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds (900s = 15m)
}

/**
 * Hash password with bcryptjs (12 salt rounds)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
}

/**
 * Verify plaintext password against bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return await bcrypt.compare(password, hash);
}

/**
 * Generate cryptographically secure signed JWT access token
 */
export function generateAccessToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN as any,
    algorithm: 'HS256',
    issuer: 'wepsun.engineering',
    audience: 'wepsun-platform',
  });
}

/**
 * Verify and decode JWT access token (returns null on expired / invalid signature)
 */
export function verifyAccessToken(token: string): JwtUserPayload | null {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET, {
      issuer: 'wepsun.engineering',
      audience: 'wepsun-platform',
    }) as JwtUserPayload;
  } catch {
    return null;
  }
}

/**
 * Generate cryptographically secure random refresh token string
 */
export function generateRefreshTokenString(): string {
  return crypto.randomBytes(40).toString('hex');
}

export const generateRefreshToken = generateRefreshTokenString;

/**
 * Compute SHA-256 hash of refresh token for safe storage in database
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new user session and store hashed refresh token in database
 */
// Fallback memory store for sessions when running offline or with demo/mock user profiles
const memorySessions = new Map<string, {
  id: string;
  userId: string;
  companyId: string;
  tokenHash: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date | null;
  createdAt: Date;
  lastUsedAt?: Date | null;
}>();

/**
 * Create a new user session and store hashed refresh token in database
 */
export async function createSession(
  userId: string,
  companyId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ refreshToken: string; expiresAt: Date }> {
  const rawRefreshToken = generateRefreshTokenString();
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  const sessionId = 'sess_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // Store in memory cache
  memorySessions.set(tokenHash, {
    id: sessionId,
    userId,
    companyId,
    tokenHash,
    userAgent: userAgent || null,
    ipAddress: ipAddress || null,
    expiresAt,
    isRevoked: false,
    createdAt: new Date(),
    lastUsedAt: new Date(),
  });

  try {
    await Promise.race([
      prisma.userSession.create({
        data: {
          id: sessionId,
          userId,
          companyId,
          tokenHash,
          userAgent: userAgent || null,
          ipAddress: ipAddress || null,
          expiresAt,
          isRevoked: false,
        },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 500)),
    ]);
  } catch {
    // If DB offline, foreign key mismatch (demo profile), or timed out, memorySessions retains active session
  }

  return { refreshToken: rawRefreshToken, expiresAt };
}

/**
 * Validate refresh token and rotate (Single-Use Rotation with Grace Window for Race Conditions)
 */
export async function rotateSession(
  rawRefreshToken: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ user: any; tokens: AuthTokens } | null> {
  const incomingHash = hashToken(rawRefreshToken);

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

  // Grace Period Handling: If session was revoked within 30 seconds, treat as concurrent refresh / retry
  if (session.isRevoked) {
    const revokedAtTime = session.revokedAt ? new Date(session.revokedAt).getTime() : 0;
    const isWithinGracePeriod = Date.now() - revokedAtTime < 30000;

    if (isWithinGracePeriod) {
      let resolvedUser = session.user;
      if (!resolvedUser) {
        try {
          resolvedUser = await prisma.user.findUnique({ where: { id: session.userId } });
        } catch {
          resolvedUser = null;
        }
      }
      if (!resolvedUser) {
        const { db } = await import('../data/mockDb.js');
        resolvedUser = db.users.find((u) => u.id === session.userId);
      }

      if (resolvedUser && (resolvedUser.isActive ?? true)) {
        const payload: JwtUserPayload = {
          sub: resolvedUser.id,
          email: resolvedUser.email,
          role: resolvedUser.role,
          companyId: resolvedUser.companyId,
          branchId: resolvedUser.branchId,
          clientId: resolvedUser.clientId,
          technicianId: resolvedUser.technicianId,
          tokenVersion: resolvedUser.tokenVersion || 0,
        };
        const accessToken = generateAccessToken(payload);
        return {
          user: resolvedUser,
          tokens: {
            accessToken,
            refreshToken: rawRefreshToken,
            expiresIn: 900,
          },
        };
      }
    }

    // Outside grace period: True replay attack detected -> Revoke all sessions for that user
    try {
      await revokeAllUserSessions(session.userId);
    } catch {
      // Non-blocking
    }
    return null;
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

  // 1. Revoke the old session with timestamp for grace window tracking
  const revokeTimestamp = new Date();
  try {
    await prisma.userSession.update({
      where: { id: session.id },
      data: { isRevoked: true, revokedAt: revokeTimestamp, lastUsedAt: revokeTimestamp },
    });
  } catch {
    // Non-blocking
  }
  if (memorySessions.has(incomingHash)) {
    const s = memorySessions.get(incomingHash)!;
    s.isRevoked = true;
    s.revokedAt = revokeTimestamp;
    s.lastUsedAt = revokeTimestamp;
  }

  // 2. Issue rotated new refresh token & session
  const newSession = await createSession(user.id, user.companyId, userAgent, ipAddress);

  // 3. Issue new access token
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

  return {
    user,
    tokens: {
      accessToken,
      refreshToken: newSession.refreshToken,
      expiresIn: 900, // 15m in seconds
    },
  };
}

/**
 * Revoke a single active session (Logout current device)
 */
export async function revokeSessionByToken(rawRefreshToken: string): Promise<boolean> {
  const tokenHash = hashToken(rawRefreshToken);
  let revoked = false;

  if (memorySessions.has(tokenHash)) {
    const s = memorySessions.get(tokenHash)!;
    s.isRevoked = true;
    s.revokedAt = new Date();
    revoked = true;
  }

  try {
    const result = await prisma.userSession.updateMany({
      where: { tokenHash, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
    if (result.count > 0) revoked = true;
  } catch {
    // Non-blocking
  }

  return revoked;
}

/**
 * Revoke all active sessions for a user (Logout all devices / Password change)
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
  let count = 0;
  for (const [, s] of memorySessions.entries()) {
    if (s.userId === userId && !s.isRevoked) {
      s.isRevoked = true;
      s.revokedAt = new Date();
      count++;
    }
  }

  try {
    const result = await prisma.userSession.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
    count += result.count;
  } catch {
    // Non-blocking
  }

  return count;
}

/**
 * Generate password reset token
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 Hour

  try {
    await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        isUsed: false,
      },
    });
  } catch {
    // Non-blocking
  }

  return rawToken;
}

/**
 * Verify and consume password reset token
 */
export async function consumePasswordResetToken(rawToken: string): Promise<string | null> {
  const tokenHash = hashToken(rawToken);
  try {
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetRecord || resetRecord.isUsed || resetRecord.expiresAt < new Date()) {
      return null;
    }

    await prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { isUsed: true, usedAt: new Date() },
    });

    return resetRecord.userId;
  } catch {
    return null;
  }
}

export const rotateRefreshToken = rotateSession;
export const revokeSession = revokeSessionByToken;
export type JWTPayload = JwtUserPayload;
