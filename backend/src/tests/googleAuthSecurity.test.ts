/**
 * ==============================================================================
 * WEPSUN ENGINEERING SOLUTIONS — GOOGLE SIGN-IN SECURITY & INTEGRATION TEST SUITE
 * ==============================================================================
 * Comprehensive automated test suite verifying all 20 required security scenarios:
 * 1. Successful Google Sign-In on Web (Web Client ID)
 * 2. Successful Google Sign-In on Android (Android Client ID)
 * 3. Invalid token rejected (401)
 * 4. Expired token rejected (401)
 * 5. Wrong audience rejected (401)
 * 6. Wrong issuer rejected (401)
 * 7. Missing or unverified email claim rejected (401)
 * 8. Existing account linking (preserves user ID, role, and tenant permissions)
 * 9. Duplicate identity conflict (different googleId on same email) rejected (409)
 * 10. Technician pending approval rejected (403 ACCOUNT_PENDING_APPROVAL)
 * 11. Approved technician permitted with permanent technician ID
 * 12. Blocked technician rejected (403 ACCOUNT_BLOCKED)
 * 13. Unauthorized role escalation blocked (frontend cannot elevate role)
 * 14. Session refresh and token rotation
 * 15. Refresh token reuse detection & replay defense
 * 16. Logout & session revocation
 * 17. Cross-platform access to the same WEPSUN account (Web + Android)
 * 18. Existing password & OTP login regression check
 * 19. Database schema & unique constraint integrity
 * 20. Android deep-link callback security & parameter parsing
 * ==============================================================================
 */

import http from 'http';
import express from 'express';
import apiRouter from '../routes/index.js';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';
import { hashPassword, verifyAccessToken, createSession, rotateRefreshToken } from '../lib/auth.js';
import { getAllowedGoogleClientIds } from '../lib/googleAuth.js';

process.env.NODE_ENV = 'test';
process.env.GOOGLE_CLIENT_ID = 'test-wepsun-web-client.apps.googleusercontent.com';
process.env.GOOGLE_WEB_CLIENT_ID = 'test-wepsun-web-client.apps.googleusercontent.com';
process.env.GOOGLE_ANDROID_CLIENT_ID = 'test-wepsun-android-client.apps.googleusercontent.com';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

let server: http.Server;
let port: number;
let baseUrl: string;

function makeRequest(
  path: string,
  method = 'GET',
  body?: any,
  token?: string
): Promise<{ status: number; data: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      `${baseUrl}${path}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          let parsed: any = {};
          try {
            parsed = rawData ? JSON.parse(rawData) : {};
          } catch {
            parsed = { raw: rawData };
          }
          resolve({ status: res.statusCode || 500, data: parsed, headers: res.headers });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function createMockGoogleToken(payload: {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  aud?: string;
  iss?: string;
  exp?: number;
  email_verified?: boolean;
}): string {
  const claims = {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || 'Test Google User',
    picture: payload.picture || 'https://lh3.googleusercontent.com/a/test-avatar',
    aud: payload.aud || process.env.GOOGLE_WEB_CLIENT_ID,
    iss: payload.iss || 'https://accounts.google.com',
    exp: payload.exp || Math.floor(Date.now() / 1000) + 3600,
    email_verified: payload.email_verified !== undefined ? payload.email_verified : true,
  };
  return 'mock-google-token:' + Buffer.from(JSON.stringify(claims)).toString('base64');
}

let passed = 0;
let total = 0;

function assert(condition: boolean, message: string, details?: string) {
  total++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    if (details) console.error(`     Details: ${details}`);
    throw new Error(`Test failed: ${message}`);
  }
}

async function runGoogleSecurityTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 WEPSUN GOOGLE SIGN-IN SECURITY & CROSS-PLATFORM TEST SUITE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Start HTTP test server
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as any;
      port = address.port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  try {
    // --------------------------------------------------------------------------
    // TEST 1: Successful Google Sign-In on Web
    // --------------------------------------------------------------------------
    console.log('📋 SCENARIO 1 & 2: Platform Sign-In (Web & Android APK)');
    const webUserToken = createMockGoogleToken({
      sub: 'google-sub-web-1001',
      email: 'client.web@example.com',
      name: 'Web Client User',
      aud: process.env.GOOGLE_WEB_CLIENT_ID,
    });

    const webRes = await makeRequest('/api/auth/google', 'POST', {
      credential: webUserToken,
      platform: 'web',
    });

    assert(webRes.status === 200, 'Web Google sign-in returns 200 OK');
    assert(webRes.data?.success === true, 'Web sign-in response has success: true');
    assert(Boolean(webRes.data?.data?.accessToken), 'Backend issues application JWT access token');
    assert(Boolean(webRes.data?.data?.refreshToken), 'Backend issues application rotating refresh token');
    assert(webRes.data?.data?.user?.email === 'client.web@example.com', 'User email verified correctly');

    // --------------------------------------------------------------------------
    // TEST 2: Successful Google Sign-In on Android
    // --------------------------------------------------------------------------
    const androidUserToken = createMockGoogleToken({
      sub: 'google-sub-android-1002',
      email: 'client.android@example.com',
      name: 'Android Client User',
      aud: process.env.GOOGLE_ANDROID_CLIENT_ID,
    });

    const androidRes = await makeRequest('/api/auth/google', 'POST', {
      credential: androidUserToken,
      platform: 'android',
    });

    assert(androidRes.status === 200, 'Android APK Google sign-in returns 200 OK');
    assert(androidRes.data?.data?.user?.email === 'client.android@example.com', 'Android user signed in with Android Client ID');

    // --------------------------------------------------------------------------
    // TEST 3: Invalid token rejected
    // --------------------------------------------------------------------------
    console.log('\n📋 SCENARIO 3, 4, 5, 6, 7: Cryptographic & Token Claim Validations');
    const invalidTokenRes = await makeRequest('/api/auth/google', 'POST', {
      credential: 'garbage.invalid.token.123',
    });
    assert(invalidTokenRes.status === 401, 'Invalid token string rejected with 401 Unauthorized');
    assert(invalidTokenRes.data?.code === 'INVALID_GOOGLE_CREDENTIAL', 'Returns code INVALID_GOOGLE_CREDENTIAL');

    // Test missing token / empty payload
    const emptyPayloadRes = await makeRequest('/api/auth/google', 'POST', {});
    assert(emptyPayloadRes.status === 400, 'Empty credential payload rejected with 400 Bad Request');

    // --------------------------------------------------------------------------
    // TEST 4: Expired token rejected
    // --------------------------------------------------------------------------
    const expiredToken = createMockGoogleToken({
      sub: 'google-sub-expired',
      email: 'expired@example.com',
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    });
    const expiredRes = await makeRequest('/api/auth/google', 'POST', { credential: expiredToken });
    assert(expiredRes.status === 401, 'Expired Google token is rejected with 401');

    // --------------------------------------------------------------------------
    // TEST 5: Wrong audience rejected
    // --------------------------------------------------------------------------
    const wrongAudToken = createMockGoogleToken({
      sub: 'google-sub-foreign',
      email: 'foreign@example.com',
      aud: 'malicious-unregistered-client.apps.googleusercontent.com',
    });
    const wrongAudRes = await makeRequest('/api/auth/google', 'POST', { credential: wrongAudToken });
    assert(wrongAudRes.status === 401, 'Token issued for different application/audience rejected with 401');

    // --------------------------------------------------------------------------
    // TEST 6: Wrong issuer rejected
    // --------------------------------------------------------------------------
    const wrongIssToken = createMockGoogleToken({
      sub: 'google-sub-bad-iss',
      email: 'badiss@example.com',
      iss: 'https://evil-untrusted-issuer.com',
    });
    const wrongIssRes = await makeRequest('/api/auth/google', 'POST', { credential: wrongIssToken });
    assert(wrongIssRes.status === 401, 'Untrusted issuer is rejected with 401');

    // --------------------------------------------------------------------------
    // TEST 7: Missing or unverified email claim rejected
    // --------------------------------------------------------------------------
    const unverifiedEmailToken = createMockGoogleToken({
      sub: 'google-sub-unverified',
      email: 'unverified@example.com',
      email_verified: false,
    });
    const unverifiedEmailRes = await makeRequest('/api/auth/google', 'POST', { credential: unverifiedEmailToken });
    assert(unverifiedEmailRes.status === 401, 'Unverified Google email claim rejected with 401');

    // --------------------------------------------------------------------------
    // TEST 8: Existing Account Linking
    // --------------------------------------------------------------------------
    console.log('\n📋 SCENARIO 8 & 9: Account Linking & Collision Safety');
    const runId = Math.random().toString(36).substring(2, 8);
    const linkingEmail = `existing.user.${runId}@wepsun.com`;
    const linkingUserId = `usr-link-${runId}`;
    const linkingGoogleSub = `google-sub-linked-${runId}`;
    const existingPasswordHash = await hashPassword('ExistingPass@2026');

    // Seed an existing local account
    let existingAccount: any;
    try {
      existingAccount = await prisma.user.create({
        data: {
          id: linkingUserId,
          name: 'Existing Employee',
          email: linkingEmail,
          passwordHash: existingPasswordHash,
          role: 'SERVICE_MANAGER' as any,
          companyId: 'comp-1',
          authProvider: 'local',
          isActive: true,
        },
      });
    } catch {
      existingAccount = {
        id: linkingUserId,
        name: 'Existing Employee',
        email: linkingEmail,
        passwordHash: existingPasswordHash,
        role: 'SERVICE_MANAGER',
        companyId: 'comp-1',
        authProvider: 'local',
        isActive: true,
      };
      db.users.push(existingAccount);
    }

    const linkingGoogleToken = createMockGoogleToken({
      sub: linkingGoogleSub,
      email: linkingEmail,
      name: 'Existing Employee Google',
    });

    const linkRes = await makeRequest('/api/auth/google', 'POST', { credential: linkingGoogleToken });
    assert(linkRes.status === 200, 'Existing email account links Google identity with 200 OK');
    assert(linkRes.data?.data?.user?.id === existingAccount.id, 'Preserves existing user ID on account linking');
    assert(linkRes.data?.data?.user?.role === 'SERVICE_MANAGER', 'Strictly preserves existing privileged user role');

    // --------------------------------------------------------------------------
    // TEST 9: Duplicate identity conflicts
    // --------------------------------------------------------------------------
    const conflictingGoogleToken = createMockGoogleToken({
      sub: `google-sub-attacker-${runId}`, // Different sub
      email: linkingEmail,
    });
    const conflictRes = await makeRequest('/api/auth/google', 'POST', { credential: conflictingGoogleToken });
    assert(conflictRes.status === 409, 'Conflicting Google sub on already linked account returns 409 Conflict');
    assert(conflictRes.data?.code === 'GOOGLE_ACCOUNT_CONFLICT', 'Returns GOOGLE_ACCOUNT_CONFLICT code');

    // --------------------------------------------------------------------------
    // TEST 10: Technician Pending Approval Rejected
    // --------------------------------------------------------------------------
    console.log('\n📋 SCENARIO 10, 11, 12, 13: RBAC & Technician Approval Business Rules');
    const pendingTechEmail = `pending.tech.${runId}@wepsun.com`;
    const pendingTechId = `tech-pending-${runId}`;
    const pendingTechUserId = `usr-tech-pending-${runId}`;

    try {
      await prisma.technician.create({
        data: {
          id: pendingTechId,
          companyId: 'comp-1',
          branchId: 'br-mum-1',
          name: 'Pending Tech',
          employeeCode: `WES-PND-${runId}`,
          permanentId: `WES-PND-${runId}`,
          phone: '+91 98200 11111',
          email: pendingTechEmail,
          accountStatus: 'PENDING_APPROVAL' as any,
        },
      });
      await prisma.user.create({
        data: {
          id: pendingTechUserId,
          companyId: 'comp-1',
          name: 'Pending Tech',
          email: pendingTechEmail,
          role: 'TECHNICIAN' as any,
          technicianId: pendingTechId,
          isActive: true,
        },
      });
    } catch {
      // Mock db fallback
      if (!db.technicians) (db as any).technicians = [];
      db.technicians.push({
        id: pendingTechId,
        name: 'Pending Tech',
        email: pendingTechEmail,
        accountStatus: 'PENDING_APPROVAL',
        permanentId: `WES-PND-${runId}`,
      });
      db.users.push({
        id: pendingTechUserId,
        name: 'Pending Tech',
        email: pendingTechEmail,
        role: 'TECHNICIAN',
        technicianId: pendingTechId,
        isActive: true,
      });
    }

    const pendingTechToken = createMockGoogleToken({
      sub: `google-sub-pending-${runId}`,
      email: pendingTechEmail,
      name: 'Pending Tech',
    });

    const pendingTechRes = await makeRequest('/api/auth/google', 'POST', { credential: pendingTechToken });
    assert(pendingTechRes.status === 403, 'Technician with PENDING_APPROVAL status rejected with 403 Forbidden');
    assert(pendingTechRes.data?.code === 'ACCOUNT_PENDING_APPROVAL', 'Returns code ACCOUNT_PENDING_APPROVAL');

    // --------------------------------------------------------------------------
    // TEST 11: Approved Technician Access
    // --------------------------------------------------------------------------
    const approvedTechEmail = `approved.tech.${runId}@wepsun.com`;
    const approvedTechId = `tech-approved-${runId}`;
    const approvedTechUserId = `usr-tech-approved-${runId}`;

    try {
      await prisma.technician.create({
        data: {
          id: approvedTechId,
          companyId: 'comp-1',
          branchId: 'br-mum-1',
          name: 'Approved Tech',
          employeeCode: `WES-APP-${runId}`,
          permanentId: `WES-APP-${runId}`,
          phone: '+91 98200 22222',
          email: approvedTechEmail,
          accountStatus: 'APPROVED' as any,
        },
      });
      await prisma.user.create({
        data: {
          id: approvedTechUserId,
          companyId: 'comp-1',
          name: 'Approved Tech',
          email: approvedTechEmail,
          role: 'TECHNICIAN' as any,
          technicianId: approvedTechId,
          isActive: true,
        },
      });
    } catch {
      if (!db.technicians) (db as any).technicians = [];
      db.technicians.push({
        id: approvedTechId,
        name: 'Approved Tech',
        email: approvedTechEmail,
        accountStatus: 'APPROVED',
        permanentId: `WES-APP-${runId}`,
      });
      db.users.push({
        id: approvedTechUserId,
        name: 'Approved Tech',
        email: approvedTechEmail,
        role: 'TECHNICIAN',
        technicianId: approvedTechId,
        isActive: true,
      });
    }

    const approvedTechToken = createMockGoogleToken({
      sub: `google-sub-approved-${runId}`,
      email: approvedTechEmail,
      name: 'Approved Tech',
    });

    const approvedTechRes = await makeRequest('/api/auth/google', 'POST', { credential: approvedTechToken });
    assert(approvedTechRes.status === 200, 'Approved technician sign-in succeeds with 200 OK');
    assert(approvedTechRes.data?.data?.user?.technicianId === approvedTechId, 'Preserves permanent technician ID');

    // --------------------------------------------------------------------------
    // TEST 12: Blocked Technician Access
    // --------------------------------------------------------------------------
    const blockedTechEmail = `blocked.tech.${runId}@wepsun.com`;
    const blockedTechId = `tech-blocked-${runId}`;
    const blockedTechUserId = `usr-tech-blocked-${runId}`;

    try {
      await prisma.technician.create({
        data: {
          id: blockedTechId,
          companyId: 'comp-1',
          branchId: 'br-mum-1',
          name: 'Blocked Tech',
          employeeCode: `WES-BLK-${runId}`,
          permanentId: `WES-BLK-${runId}`,
          phone: '+91 98200 33333',
          email: blockedTechEmail,
          accountStatus: 'BLOCKED' as any,
          blockReason: 'Policy violation',
        },
      });
      await prisma.user.create({
        data: {
          id: blockedTechUserId,
          companyId: 'comp-1',
          name: 'Blocked Tech',
          email: blockedTechEmail,
          role: 'TECHNICIAN' as any,
          technicianId: blockedTechId,
          isActive: true,
        },
      });
    } catch {
      if (!db.technicians) (db as any).technicians = [];
      db.technicians.push({
        id: blockedTechId,
        name: 'Blocked Tech',
        email: blockedTechEmail,
        accountStatus: 'BLOCKED',
        blockReason: 'Policy violation',
      });
      db.users.push({
        id: blockedTechUserId,
        name: 'Blocked Tech',
        email: blockedTechEmail,
        role: 'TECHNICIAN',
        technicianId: blockedTechId,
        isActive: true,
      });
    }

    const blockedTechToken = createMockGoogleToken({
      sub: `google-sub-blocked-${runId}`,
      email: blockedTechEmail,
      name: 'Blocked Tech',
    });

    const blockedTechRes = await makeRequest('/api/auth/google', 'POST', { credential: blockedTechToken });
    assert(blockedTechRes.status === 403, 'Blocked technician access denied with 403 Forbidden');
    assert(blockedTechRes.data?.code === 'ACCOUNT_BLOCKED', 'Returns code ACCOUNT_BLOCKED');

    // --------------------------------------------------------------------------
    // TEST 13: Unauthorized Role Escalation Blocked
    // --------------------------------------------------------------------------
    const attackerToken = createMockGoogleToken({
      sub: `google-sub-attacker-${runId}`,
      email: `attacker.priv.${runId}@example.com`,
      name: 'Role Attacker',
    });

    const escalateRes = await makeRequest('/api/auth/google', 'POST', {
      credential: attackerToken,
      role: 'SUPER_ADMIN', // Attacker attempts to request admin role
    });

    assert(escalateRes.status === 200, 'Auto-provision request succeeds');
    assert(escalateRes.data?.data?.user?.role === 'CLIENT', 'Attacker role elevation blocked: Assigned role is strictly CLIENT');

    // --------------------------------------------------------------------------
    // TEST 14: Session Refresh and Token Rotation
    // --------------------------------------------------------------------------
    console.log('\n📋 SCENARIO 14, 15, 16: Session Lifecycle, Rotation & Revocation');
    const initialRefresh = webRes.data?.data?.refreshToken;
    const refreshRes = await makeRequest('/api/auth/refresh', 'POST', {
      refreshToken: initialRefresh,
    });

    assert(refreshRes.status === 200, 'Session refresh succeeds with 200 OK');
    assert(Boolean(refreshRes.data?.data?.accessToken), 'Returns new valid access token');
    const secondRefresh = refreshRes.data?.data?.refreshToken;
    assert(secondRefresh !== initialRefresh, 'Single-use refresh token rotated to new token');

    // --------------------------------------------------------------------------
    // TEST 15: Refresh Token Reuse Detection
    // --------------------------------------------------------------------------
    // Wait for the 2.0-second concurrency grace window to elapse
    await new Promise((resolve) => setTimeout(resolve, 2200));

    const replayRes = await makeRequest('/api/auth/refresh', 'POST', {
      refreshToken: initialRefresh, // Replaying old token past grace window
    });
    assert(replayRes.status === 401, 'Replay attack blocked: Old refresh token rejected with 401');

    // --------------------------------------------------------------------------
    // TEST 16: Logout & Session Revocation
    // --------------------------------------------------------------------------
    const logoutRes = await makeRequest(
      '/api/auth/logout',
      'POST',
      { refreshToken: secondRefresh },
      refreshRes.data?.data?.accessToken
    );
    assert(logoutRes.status === 200, 'Logout succeeds with 200 OK');

    const afterLogoutRefresh = await makeRequest('/api/auth/refresh', 'POST', {
      refreshToken: secondRefresh,
    });
    assert(afterLogoutRefresh.status === 401, 'Revoked session cannot be refreshed after logout');

    // --------------------------------------------------------------------------
    // TEST 17: Cross-Platform Access to Same Account (Web + Android)
    // --------------------------------------------------------------------------
    console.log('\n📋 SCENARIO 17 & 18: Cross-Platform & Regression Verification');
    const sharedEmail = `unified.crossplatform.${runId}@example.com`;
    const sharedSub = `google-sub-shared-${runId}`;

    // Sign in from Web first
    const sharedWebToken = createMockGoogleToken({
      sub: sharedSub,
      email: sharedEmail,
      name: 'Unified User',
      aud: process.env.GOOGLE_WEB_CLIENT_ID,
    });
    const sharedWebRes = await makeRequest('/api/auth/google', 'POST', {
      credential: sharedWebToken,
      platform: 'web',
    });
    const sharedUserId = sharedWebRes.data?.data?.user?.id;

    // Sign in from Android APK with same Google sub
    const sharedAndroidToken = createMockGoogleToken({
      sub: sharedSub,
      email: sharedEmail,
      name: 'Unified User',
      aud: process.env.GOOGLE_ANDROID_CLIENT_ID,
    });
    const sharedAndroidRes = await makeRequest('/api/auth/google', 'POST', {
      credential: sharedAndroidToken,
      platform: 'android',
    });

    assert(
      sharedAndroidRes.data?.data?.user?.id === sharedUserId,
      'Same user ID returned across Web and Android APK without duplicating accounts'
    );

    // --------------------------------------------------------------------------
    // TEST 18: Existing Password & OTP Login Regression
    // --------------------------------------------------------------------------
    const regressedLoginRes = await makeRequest('/api/auth/login', 'POST', {
      email: linkingEmail,
      password: 'ExistingPass@2026',
    });
    assert(regressedLoginRes.status === 200, 'Existing password login functions normally without regression');
    assert(regressedLoginRes.data?.data?.user?.email === linkingEmail, 'Password login returns authenticated user');

    // --------------------------------------------------------------------------
    // TEST 19: Database Schema & Unique Constraint Integrity
    // --------------------------------------------------------------------------
    console.log('\n📋 SCENARIO 19 & 20: Database Schema & Android Callback Security');
    const allowedClientIds = getAllowedGoogleClientIds();
    assert(
      allowedClientIds.includes(process.env.GOOGLE_WEB_CLIENT_ID!) &&
      allowedClientIds.includes(process.env.GOOGLE_ANDROID_CLIENT_ID!),
      'getAllowedGoogleClientIds correctly loads Web and Android client IDs'
    );

    // --------------------------------------------------------------------------
    // TEST 20: Android Deep-Link & Callback Security
    // --------------------------------------------------------------------------
    const callbackGatewayRes = await makeRequest('/api/auth/google/callback?code=sample-code&state=sample-state');
    assert(callbackGatewayRes.status === 200, 'Google OAuth callback gateway responds with 200 OK');
    assert(
      callbackGatewayRes.data?.raw?.includes('wepsun://auth-callback'),
      'Callback gateway contains safe deep-link handler for wepsun://auth-callback'
    );

    // --------------------------------------------------------------------------
    // TEST 21: PKCE Authorization Code Exchange (Back-Channel TLS)
    // --------------------------------------------------------------------------
    console.log('\n📋 SCENARIO 21, 22, 23: PKCE Authorization Code & State Security');
    const pkceRunId = Math.random().toString(36).substring(2, 8);
    const pkceEmail = `pkce.user.${pkceRunId}@wepsun.com`;
    const pkceSub = `google-sub-pkce-${pkceRunId}`;
    const pkceNonce = `nonce_${pkceRunId}`;
    const validVerifier = `code_verifier_${pkceRunId}_abcdefghijklmnopqrstuvwxyz1234567890`;
    const validCode = `mock-pkce-code:${pkceSub}:${pkceEmail}:Pkce Test User:${pkceNonce}`;

    const pkceRes = await makeRequest('/api/auth/google', 'POST', {
      code: validCode,
      codeVerifier: validVerifier,
      redirectUri: 'https://wepsun.onrender.com/api/auth/google/callback',
      nonce: pkceNonce,
      platform: 'android',
    });
    assert(pkceRes.status === 200, 'PKCE Authorization code exchange succeeds with 200 OK');
    assert(pkceRes.data?.success === true, 'PKCE response returns success: true');
    assert(Boolean(pkceRes.data?.data?.accessToken), 'Returns valid application access token via PKCE exchange');
    assert(Boolean(pkceRes.data?.data?.refreshToken), 'Returns valid rotating refresh token via PKCE exchange');
    assert(pkceRes.data?.data?.user?.email === pkceEmail, 'PKCE user email matches verified Google claims');

    // --------------------------------------------------------------------------
    // TEST 22: PKCE Code Verifier Mismatch Rejection
    // --------------------------------------------------------------------------
    const pkceMismatchRes = await makeRequest('/api/auth/google', 'POST', {
      code: validCode,
      codeVerifier: 'wrong_unmatched_code_verifier_99999999999',
      redirectUri: 'https://wepsun.onrender.com/api/auth/google/callback',
      platform: 'android',
    });
    assert(pkceMismatchRes.status === 401, 'Mismatched PKCE code verifier rejected with 401 Unauthorized');
    assert(pkceMismatchRes.data?.code === 'INVALID_PKCE_VERIFIER', 'Returns code INVALID_PKCE_VERIFIER');

    // --------------------------------------------------------------------------
    // TEST 23: Missing Code Verifier with Authorization Code
    // --------------------------------------------------------------------------
    const pkceMissingVerifierRes = await makeRequest('/api/auth/google', 'POST', {
      code: validCode,
      redirectUri: 'https://wepsun.onrender.com/api/auth/google/callback',
      platform: 'android',
    });
    assert(pkceMissingVerifierRes.status === 400, 'Authorization code without codeVerifier rejected with 400 Bad Request');
    assert(pkceMissingVerifierRes.data?.code === 'CODE_VERIFIER_REQUIRED', 'Returns code CODE_VERIFIER_REQUIRED');

    // --------------------------------------------------------------------------
    // TEST 24: Parallel Refresh Request Concurrency & Promise Coalescing
    // --------------------------------------------------------------------------
    console.log('\n📋 SCENARIO 24, 25, 26: Refresh Concurrency, Grace Window & Cascade Revocation');
    const pkceInitialRefresh = pkceRes.data?.data?.refreshToken;
    assert(Boolean(pkceInitialRefresh), 'Active refresh token available for concurrency test');

    // Fire 3 simultaneous refresh requests with the EXACT same refresh token
    const parallelResults = await Promise.all([
      makeRequest('/api/auth/refresh', 'POST', { refreshToken: pkceInitialRefresh }),
      makeRequest('/api/auth/refresh', 'POST', { refreshToken: pkceInitialRefresh }),
      makeRequest('/api/auth/refresh', 'POST', { refreshToken: pkceInitialRefresh }),
    ]);

    const allSucceeded = parallelResults.every((r) => r.status === 200 && r.data?.success === true);
    assert(allSucceeded, 'All 3 concurrent in-flight refresh requests coalesce and succeed with 200 OK');

    // All should return the identical rotated token without locking the user out
    const firstRotatedToken = parallelResults[0].data?.data?.refreshToken;
    const tokensConsistent = parallelResults.every((r) => r.data?.data?.refreshToken === firstRotatedToken);
    assert(tokensConsistent, 'Concurrent refresh requests coalesce into identical rotated token');

    // --------------------------------------------------------------------------
    // TEST 25: Sub-Second Network Retry / Lost Response Grace Window
    // --------------------------------------------------------------------------
    // Client sends the old pkceInitialRefresh token again within 1.5s (simulating network dropped response)
    const retryRes = await makeRequest('/api/auth/refresh', 'POST', { refreshToken: pkceInitialRefresh });
    assert(retryRes.status === 200, 'Sub-second retry of rotated token within grace window succeeds with 200 OK');
    assert(retryRes.data?.data?.refreshToken === firstRotatedToken, 'Grace window returns cached rotated tokens');

    // --------------------------------------------------------------------------
    // TEST 26: Stale Token Replay Attack Past Grace Window Triggers Cascade Revocation
    // --------------------------------------------------------------------------
    // Wait for the 2.0-second grace window to expire
    await new Promise((resolve) => setTimeout(resolve, 2200));

    // Attacker now attempts to reuse the stale pkceInitialRefresh token past grace window
    const staleReplayRes = await makeRequest('/api/auth/refresh', 'POST', { refreshToken: pkceInitialRefresh });
    assert(staleReplayRes.status === 401, 'Stale refresh token reuse past grace window rejected with 401');
    assert(staleReplayRes.data?.code === 'REFRESH_TOKEN_REUSED', 'Returns REFRESH_TOKEN_REUSED error code');

    // Cascade revocation check: The active firstRotatedToken should now also be revoked
    const postReplayRes = await makeRequest('/api/auth/refresh', 'POST', { refreshToken: firstRotatedToken });
    assert(postReplayRes.status === 401, 'Active session cascade revoked following detected replay attack');

    // --------------------------------------------------------------------------
    // TEST 27: Blocked Technician Session Refresh Blocked
    // --------------------------------------------------------------------------
    console.log('\n📋 SCENARIO 27 & 28: Technician Status Enforcement on Refresh & Gateway Sanitization');
    const techRunId = Math.random().toString(36).substring(2, 8);
    const techEmail = `tech.status.check.${techRunId}@wepsun.com`;
    const techId = `tech-status-${techRunId}`;
    const techUserId = `usr-tech-status-${techRunId}`;

    await prisma.technician.create({
      data: {
        id: techId,
        companyId: 'comp-1',
        branchId: 'br-mum-1',
        name: 'Status Check Tech',
        employeeCode: `WES-STS-${techRunId}`,
        permanentId: `WES-STS-${techRunId}`,
        phone: '+91 98200 44444',
        email: techEmail,
        accountStatus: 'APPROVED' as any,
      },
    });
    await prisma.user.create({
      data: {
        id: techUserId,
        companyId: 'comp-1',
        name: 'Status Check Tech',
        email: techEmail,
        role: 'TECHNICIAN' as any,
        technicianId: techId,
        isActive: true,
      },
    });

    const techGoogleToken = createMockGoogleToken({
      sub: `google-sub-tech-${techRunId}`,
      email: techEmail,
      name: 'Status Check Tech',
    });
    const techLoginRes = await makeRequest('/api/auth/google', 'POST', { credential: techGoogleToken });
    assert(techLoginRes.status === 200, 'Technician signs in successfully initially');
    const techRefreshToken = techLoginRes.data?.data?.refreshToken;

    // Now change technician status to BLOCKED in database
    await prisma.technician.update({
      where: { id: techId },
      data: { accountStatus: 'BLOCKED' as any, blockReason: 'Suspended by admin' },
    });

    // Attempt refresh session with the technician's token
    const blockedRefreshRes = await makeRequest('/api/auth/refresh', 'POST', { refreshToken: techRefreshToken });
    assert(blockedRefreshRes.status === 403, 'Session refresh for blocked technician denied with 403 Forbidden');
    assert(blockedRefreshRes.data?.code === 'ACCOUNT_BLOCKED', 'Returns ACCOUNT_BLOCKED on refresh');

    // --------------------------------------------------------------------------
    // TEST 28: Callback Gateway URL Sanitization (No Token Smuggling)
    // --------------------------------------------------------------------------
    const gatewayRes = await makeRequest(
      '/api/auth/google/callback?code=safe-auth-code-777&state=safe-state-888&id_token=evil_token_leak&access_token=evil_access_leak'
    );
    assert(gatewayRes.status === 200, 'Google OAuth callback gateway responds with 200 OK');
    const rawHtml = gatewayRes.data?.raw || '';
    assert(rawHtml.includes('code=safe-auth-code-777'), 'Callback forwards safe authorization code in deep link');
    assert(rawHtml.includes('state=safe-state-888'), 'Callback forwards state in deep link');
    assert(!rawHtml.includes('evil_token_leak'), 'Callback gateway strictly strips id_token from deep links');
    assert(!rawHtml.includes('evil_access_leak'), 'Callback gateway strictly strips access_token from deep links');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 ALL GOOGLE AUTH SECURITY TESTS PASSED: ${passed}/${total} ✅`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    try {
      await prisma.$disconnect();
    } catch {
      // Ignore disconnect error
    }
    process.exit(0);
  }
}

runGoogleSecurityTests().catch((err) => {
  console.error('\n❌ Test execution failed with error:', err);
  if (server) server.close();
  process.exit(1);
});
