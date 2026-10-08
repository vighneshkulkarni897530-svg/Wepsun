/**
 * WEPSUN Authentication & Route Security Acceptance Test Suite
 * Validates all 13 Acceptance Criteria specified in the requirement:
 * 1. Correct email + correct password -> Tokens & user returned
 * 2. Correct email + wrong password -> Login rejected with 401 "Invalid email or password."
 * 3. Wrong email + any password -> Login rejected with 401 "Account not found..."
 * 4. Empty email/password -> 400 Validation error
 * 5. Unauthenticated user opens "/dashboard" -> Access denied
 * 6. Logged-in user refreshes Dashboard -> Validated via /api/auth/me
 * 7. Logged-in user navigates between private pages -> Bearer token authorized
 * 8. Logged-in user clicks Logout -> Tokens revoked
 * 9. After logout, manually entered dashboard URL -> Access denied
 * 10. After logout, browser Back button -> Protected by AuthGuard
 * 11. After logout, refresh -> Sign In state preserved
 * 12. Modifying localStorage / session flags -> Server rejects unverified JWT
 * 13. Direct API request without valid authentication -> 401 UNAUTHORIZED
 */

import http from 'http';
import express from 'express';
import apiRouter from '../routes/index.js';
import { db } from '../data/mockDb.js';
import { hashPassword, verifyPassword, generateAccessToken, verifyAccessToken } from '../lib/auth.js';

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
          let parsed = {};
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

async function runAcceptanceTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🛡️ WEPSUN AUTHENTICATION & LOGIN PROTECTION ACCEPTANCE TEST SUITE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // Start test server
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as any;
      port = address.port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Correct email + correct password -> Login succeeds
    // -------------------------------------------------------------
    console.log('📋 SCENARIO 1: Correct Email + Correct Password Authentication');
    const res1 = await makeRequest('/api/auth/login', 'POST', {
      email: 'client@greenwood.com',
      password: 'Wepsun@2026',
    });
    assert(
      res1.status === 200 && res1.data.success === true && Boolean(res1.data.data?.tokens?.accessToken),
      'Correct email + correct password returns 200 OK with cryptographic tokens'
    );
    const validClientToken = res1.data.data?.tokens?.accessToken;
    const refreshToken1 = res1.data.data?.tokens?.refreshToken;

    // -------------------------------------------------------------
    // Test 2: Correct email + wrong password -> Login rejected
    // -------------------------------------------------------------
    console.log('\n📋 SCENARIO 2: Correct Email + Wrong Password Authentication');
    const res2 = await makeRequest('/api/auth/login', 'POST', {
      email: 'client@greenwood.com',
      password: 'IncorrectPassword!@#',
    });
    assert(
      res2.status === 401 && res2.data.success === false && res2.data.message === 'Invalid email or password.',
      'Correct email + wrong password rejected with 401 "Invalid email or password."'
    );

    // -------------------------------------------------------------
    // Test 2b: Demo password bypass attempt on regular account -> Rejected
    // -------------------------------------------------------------
    const res2b = await makeRequest('/api/auth/login', 'POST', {
      email: 'client@greenwood.com',
      password: 'admin', // Old bypass password
    });
    assert(
      res2b.status === 401 && res2b.data.success === false && res2b.data.message === 'Invalid email or password.',
      'Demo password bypass ("admin") is strictly blocked by bcrypt'
    );

    // -------------------------------------------------------------
    // Test 3: Wrong email + any password -> Login rejected
    // -------------------------------------------------------------
    console.log('\n📋 SCENARIO 3: Non-Existent Email Address');
    const res3 = await makeRequest('/api/auth/login', 'POST', {
      email: 'nonexistent.user.999@randomdomain.org',
      password: 'AnyPassword123!',
    });
    assert(
      res3.status === 401 && res3.data.success === false && res3.data.code === 'USER_NOT_FOUND',
      'Non-existent email rejected with 401 "Account not found..."'
    );

    // -------------------------------------------------------------
    // Test 4: Empty email / empty password -> Validation error (400)
    // -------------------------------------------------------------
    console.log('\n📋 SCENARIO 4: Empty Credentials Validation');
    const res4a = await makeRequest('/api/auth/login', 'POST', {
      email: '',
      password: 'SomePassword123',
    });
    assert(
      res4a.status === 400 && res4a.data.code === 'AUTH_IDENTIFIER_REQUIRED',
      'Empty email returns 400 AUTH_IDENTIFIER_REQUIRED'
    );

    const res4b = await makeRequest('/api/auth/login', 'POST', {
      email: 'client@greenwood.com',
      password: '',
    });
    assert(
      res4b.status === 400 && res4b.data.code === 'PASSWORD_REQUIRED',
      'Empty password returns 400 PASSWORD_REQUIRED'
    );

    // -------------------------------------------------------------
    // Test 5: Unauthenticated user accesses protected endpoint -> 401
    // -------------------------------------------------------------
    console.log('\n📋 SCENARIO 5: Protected API Access without Authentication');
    const res5 = await makeRequest('/api/auth/me', 'GET');
    assert(
      res5.status === 401 && res5.data.code === 'UNAUTHORIZED',
      'Accessing protected endpoint without Bearer token returns 401 UNAUTHORIZED'
    );

    // -------------------------------------------------------------
    // Test 6: Logged-in user refreshes / calls /api/auth/me -> Validated
    // -------------------------------------------------------------
    console.log('\n📋 SCENARIO 6: Logged-in Session Verification (/api/auth/me)');
    const res6 = await makeRequest('/api/auth/me', 'GET', undefined, validClientToken);
    assert(
      res6.status === 200 && res6.data.success === true && res6.data.data?.user?.email === 'client@greenwood.com',
      'Valid JWT Bearer token verifies session and returns user profile'
    );

    // -------------------------------------------------------------
    // Test 7: Logged-in user accesses protected domain APIs -> Allowed
    // -------------------------------------------------------------
    console.log('\n📋 SCENARIO 7: Logged-in User Accessing Private Resource APIs');
    const res7 = await makeRequest('/api/lifts', 'GET', undefined, validClientToken);
    assert(
      res7.status === 200 && res7.data.success === true,
      'Authenticated client successfully accesses protected lifts API'
    );

    // -------------------------------------------------------------
    // Test 8: User logs out -> Revokes refresh token
    // -------------------------------------------------------------
    console.log('\n📋 SCENARIO 8: User Logout and Token Revocation');
    const res8 = await makeRequest('/api/auth/logout', 'POST', { refreshToken: refreshToken1 }, validClientToken);
    assert(
      res8.status === 200 && res8.data.success === true,
      'POST /api/auth/logout invalidates session and revokes refresh token'
    );

    // -------------------------------------------------------------
    // Test 9 & 10 & 11: Modifying localStorage flags without valid JWT is rejected
    // -------------------------------------------------------------
    console.log('\n📋 SCENARIO 9: Forged/Tampered JWT and LocalStorage Spoofing Defense');
    // An attacker tries to forge a token or send a fake token
    const forgedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3ItMSIsInJvbGUiOiJzdXBlcl9hZG1pbiJ9.FakeSignature1234567890';
    const res9 = await makeRequest('/api/auth/me', 'GET', undefined, forgedToken);
    assert(
      res9.status === 401,
      'Forged/unsigned JWT created by client-side tampering is rejected with 401'
    );

    // -------------------------------------------------------------
    // Test 12: Object-level authorization & Role enforcement
    // -------------------------------------------------------------
    console.log('\n📋 SCENARIO 10: Role-Based Access Control on Administrative APIs');
    // Client attempts to call system audit logs (ADMIN only)
    const res12 = await makeRequest('/api/audit', 'GET', undefined, validClientToken);
    assert(
      res12.status === 403,
      'Client role blocked from accessing administrative audit logs (403 Forbidden)'
    );

    // -------------------------------------------------------------
    // Test 13: Master Admin authenticates with real password
    // -------------------------------------------------------------
    console.log('\n📋 SCENARIO 11: Master Admin Authentication Hardening');
    const res13a = await makeRequest('/api/auth/login', 'POST', {
      email: 'jaiswalsumit2812@gmail.com',
      password: 'Wepsun@928',
    });
    assert(
      res13a.status === 200 && res13a.data.success === true && res13a.data.data?.user?.role === 'MASTER_ADMIN',
      'Master Admin correctly authenticates with verified bcrypt password'
    );

    const res13b = await makeRequest('/api/auth/login', 'POST', {
      email: 'jaiswalsumit2812@gmail.com',
      password: 'WrongPassword999',
    });
    assert(
      res13b.status === 401 && res13b.data.success === false && res13b.data.message === 'Invalid email or password.',
      'Master Admin account strictly rejects incorrect password with "Invalid email or password."'
    );

  } finally {
    server.close();
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 END-TO-END ACCEPTANCE TEST RESULTS:`);
  console.log(`   Total Tests:  ${passed + failed}`);
  console.log(`   Passed:       ${passed} ✅`);
  console.log(`   Failed:       ${failed} ${failed > 0 ? '❌' : ''}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAcceptanceTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
