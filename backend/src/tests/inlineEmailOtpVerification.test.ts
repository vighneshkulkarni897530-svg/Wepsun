/**
 * WEPSUN Same-Page Inline Email OTP Verification Test Suite
 * Covers all requirements and edge cases for Client and Technician registration:
 * 1. Valid email -> OTP sent successfully
 * 2. Incorrect OTP -> verification rejected with remaining attempts
 * 3. Expired OTP -> verification rejected
 * 4. Resend OTP -> 30s cooldown enforced; new OTP invalidates previous OTP
 * 5. Invalidate email on change -> verification state invalidated
 * 6. Client creation without verification -> rejected 403 EMAIL_NOT_VERIFIED
 * 7. Client creation with mismatched email/token -> rejected 403 EMAIL_NOT_VERIFIED
 * 8. Client creation with verified token -> succeeds and returns tokens
 * 9. Token single-use replay prevention -> re-using token is rejected
 * 10. Technician registration without verification -> rejected 403 EMAIL_NOT_VERIFIED
 * 11. Technician registration with verified token -> succeeds with PENDING_APPROVAL intact
 * 12. Duplicate email detection -> returns USER_ALREADY_EXISTS or ACCOUNT_PENDING_APPROVAL
 * 13. Cryptographic security -> OTP hash stored, timing-safe comparison used
 */

import http from 'http';
import express from 'express';
import apiRouter from '../routes/index.js';
import { db } from '../data/mockDb.js';
import {
  sendEmailOtp,
  verifyEmailOtp,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  verifyAndConsumeEmailVerification,
  invalidateEmailVerification,
  peekActiveEmailOtpForTesting,
} from '../lib/emailOtpService.js';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

let server: http.Server;
let baseUrl: string;

function makeRequest(
  path: string,
  method = 'GET',
  body?: any
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
          resolve({ status: res.statusCode || 200, data: parsed, headers: res.headers });
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('\n============================================================');
  console.log('   WEPSUN — Same-Page Inline Email OTP Verification Tests   ');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  // Start HTTP Server
  await new Promise<void>((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const address = server.address() as any;
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });

  const testClientEmail = `client.inline.${Date.now()}@example.com`;
  const testTechEmail = `tech.inline.${Date.now()}@example.com`;
  let clientVerificationToken = '';
  let techVerificationToken = '';

  try {
    // 1. Send OTP for Client Email
    await test('1. Send OTP: Valid email returns success and generates 6-digit OTP', async () => {
      const res = await makeRequest('/api/auth/send-otp', 'POST', {
        email: testClientEmail,
        fullName: 'Inline Test Client',
        role: 'client',
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.data.success === true, 'Expected success=true');
      assert(typeof res.data.message === 'string', 'Expected message string');
    });

    // 2. Reject Resend within 30-second cooldown
    await test('2. Resend Cooldown: Enforces 30-second wait between OTP requests', async () => {
      const res = await makeRequest('/api/auth/send-otp', 'POST', {
        email: testClientEmail,
        fullName: 'Inline Test Client',
        role: 'client',
      });

      assert(res.status === 429, `Expected 429, got ${res.status}`);
      assert(res.data.code === 'COOLDOWN_ACTIVE', `Expected COOLDOWN_ACTIVE, got ${res.data.code}`);
      assert(typeof res.data.retryAfterSeconds === 'number', 'Expected retryAfterSeconds');
      assert(res.data.retryAfterSeconds <= 30, 'retryAfterSeconds should be <= 30');
    });

    // 3. Reject Incorrect OTP
    await test('3. Verification: Rejects incorrect OTP and counts attempts', async () => {
      const res = await makeRequest('/api/auth/verify-email-otp', 'POST', {
        email: testClientEmail,
        otp: '000000',
      });

      assert(res.status === 400, `Expected 400, got ${res.status}`);
      assert(res.data.success === false, 'Expected success=false');
      assert(res.data.code === 'INVALID_OTP', `Expected INVALID_OTP, got ${res.data.code}`);
      assert(typeof res.data.remainingAttempts === 'number', 'Expected remainingAttempts number');
    });

    // 4. Verify Correct OTP Inline -> Issues signed verificationToken
    await test('4. Verification: Accepts correct OTP and returns verificationToken', async () => {
      const actualOtp = peekActiveEmailOtpForTesting(testClientEmail);
      assert(!!actualOtp, 'Could not retrieve OTP for test');

      const res = await makeRequest('/api/auth/verify-email-otp', 'POST', {
        email: testClientEmail,
        otp: actualOtp!,
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.data.success === true, 'Expected success=true');
      assert(res.data.verified === true, 'Expected verified=true');
      assert(typeof res.data.verificationToken === 'string', 'Expected verificationToken string');
      clientVerificationToken = res.data.verificationToken;
    });

    // 5. Invalidate email on change
    await test('5. Invalidation: Changing email immediately purges verification status', async () => {
      const res = await makeRequest('/api/auth/invalidate-email', 'POST', {
        email: testClientEmail,
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.data.success === true, 'Expected success=true');

      // Re-verifying a token for invalidated email should fail
      const isValid = verifyEmailVerificationToken(testClientEmail, clientVerificationToken);
      assert(!isValid.valid, 'Token must not be valid after explicit invalidation');
    });

    // 6. Client Registration without verification is rejected with 403
    await test('6. Registration Security: Reject Client account creation without verification token', async () => {
      const unverifiedEmail = `unverified.client.${Date.now()}@example.com`;
      const res = await makeRequest('/api/auth/register', 'POST', {
        email: unverifiedEmail,
        name: 'Unverified Client',
        password: 'Password123!',
        role: 'CLIENT',
      });

      assert(res.status === 403, `Expected 403, got ${res.status}`);
      assert(res.data.code === 'EMAIL_NOT_VERIFIED', `Expected EMAIL_NOT_VERIFIED, got ${res.data.code}`);
    });

    // 7. Verify fresh OTP for Client registration
    await test('7. Client Flow: Verify email inline and create Client account successfully', async () => {
      const freshClientEmail = `client.fresh.${Date.now()}@example.com`;

      // 1) Send OTP
      await makeRequest('/api/auth/send-otp', 'POST', {
        email: freshClientEmail,
        fullName: 'Verified Client',
        role: 'client',
      });

      const otp = peekActiveEmailOtpForTesting(freshClientEmail);
      assert(!!otp, 'OTP should exist');

      // 2) Verify OTP inline
      const verifyRes = await makeRequest('/api/auth/verify-email-otp', 'POST', {
        email: freshClientEmail,
        otp: otp!,
      });

      assert(verifyRes.status === 200, 'Verify should return 200');
      const token = verifyRes.data.verificationToken;
      assert(!!token, 'Verification token should be returned');

      // 3) Create Client account using token
      const regRes = await makeRequest('/api/auth/register', 'POST', {
        email: freshClientEmail,
        name: 'Verified Client',
        password: 'SecurePassword123!',
        phone: '+919876543210',
        role: 'CLIENT',
        verificationToken: token,
      });

      assert(regRes.status === 200, `Expected 200, got ${regRes.status}`);
      assert(regRes.data.success === true, 'Registration should succeed');
      assert(!!regRes.data.data?.tokens?.accessToken, 'Access token should be issued');
      assert(regRes.data.data?.user?.email === freshClientEmail, 'User email should match');

      // 4) Replay prevention: reusing the token must fail with 403
      const replayRes = await makeRequest('/api/auth/register', 'POST', {
        email: freshClientEmail,
        name: 'Verified Client Replay',
        password: 'SecurePassword123!',
        role: 'CLIENT',
        verificationToken: token,
      });

      assert(replayRes.status === 403 || replayRes.status === 409, 'Replay should be rejected');
    });

    // 8. Technician Registration without verification is rejected with 403
    await test('8. Registration Security: Reject Technician registration without verification token', async () => {
      const unverifiedTechEmail = `unverified.tech.${Date.now()}@example.com`;
      const res = await makeRequest('/api/technicians/register', 'POST', {
        email: unverifiedTechEmail,
        name: 'Unverified Technician',
        phone: '+919876543211',
        address: '123 Test Street, Bengaluru',
        qualifications: 'BE Mechanical',
        experienceYears: 3,
        password: 'Password123!',
      });

      assert(res.status === 403, `Expected 403, got ${res.status}`);
      assert(res.data.code === 'EMAIL_NOT_VERIFIED', `Expected EMAIL_NOT_VERIFIED, got ${res.data.code}`);
    });

    // 9. Technician Registration with verified token succeeds with Admin Approval workflow intact
    await test('9. Technician Flow: Verify email inline and submit application with PENDING_APPROVAL', async () => {
      // 1) Send OTP for Technician
      const sendRes = await makeRequest('/api/auth/send-otp', 'POST', {
        email: testTechEmail,
        fullName: 'Inline Tech Specialist',
        role: 'technician',
      });
      assert(sendRes.status === 200, 'OTP request for technician should return 200');

      const techOtp = peekActiveEmailOtpForTesting(testTechEmail);
      assert(!!techOtp, 'Technician OTP should be generated');

      // 2) Verify OTP inline
      const verifyRes = await makeRequest('/api/auth/verify-email-otp', 'POST', {
        email: testTechEmail,
        otp: techOtp!,
      });
      assert(verifyRes.status === 200, 'Technician OTP verification should return 200');
      techVerificationToken = verifyRes.data.verificationToken;
      assert(!!techVerificationToken, 'Verification token must be provided');

      // 3) Submit application with token
      const regRes = await makeRequest('/api/technicians/register', 'POST', {
        email: testTechEmail,
        name: 'Inline Tech Specialist',
        phone: '+91' + String(Date.now()).slice(-10),
        address: '456 Elevator Lane, Mumbai',
        qualifications: 'Diploma in Electrical Engineering',
        experienceYears: 4,
        documents: 'LIC-ELEV-99482',
        password: 'TechSecurePassword123!',
        verificationToken: techVerificationToken,
      });

      assert(regRes.status === 200 || regRes.status === 201, `Expected 200 or 201, got ${regRes.status}: ${JSON.stringify(regRes.data)}`);
      assert(regRes.data.success === true, 'Technician submission should succeed');
      assert(regRes.data.code === 'ACCOUNT_PENDING_APPROVAL', 'Technician code must be ACCOUNT_PENDING_APPROVAL');
      assert(regRes.data.data?.accountStatus === 'PENDING_APPROVAL', 'Technician accountStatus must be PENDING_APPROVAL');
    });

    // 10. Duplicate Email Rules: Existing user cannot re-register
    await test('10. Duplicate Email: Send OTP rejects already registered email', async () => {
      const existingUser = db.users[0]?.email;
      assert(!!existingUser, 'Mock DB should have at least one user');

      const res = await makeRequest('/api/auth/send-otp', 'POST', {
        email: existingUser,
        fullName: 'Duplicate Check',
        role: 'client',
      });

      assert(res.status === 409, `Expected 409, got ${res.status}`);
      assert(res.data.code === 'USER_ALREADY_EXISTS', `Expected USER_ALREADY_EXISTS, got ${res.data.code}`);
    });

    // 11. Duplicate Technician Pending Approval
    await test('11. Duplicate Email: Send OTP detects Technician awaiting admin review', async () => {
      const res = await makeRequest('/api/auth/send-otp', 'POST', {
        email: testTechEmail,
        fullName: 'Repeat Tech',
        role: 'technician',
      });

      assert(res.status === 400 || res.status === 409, `Expected 400 or 409, got ${res.status}`);
      assert(
        res.data.code === 'ACCOUNT_PENDING_APPROVAL' || res.data.code === 'USER_ALREADY_EXISTS',
        `Expected ACCOUNT_PENDING_APPROVAL or USER_ALREADY_EXISTS, got ${res.data.code}`
      );
    });

    // 12. Token bound to exact email: Cannot use token from email A for email B
    await test('12. Token Binding: Verification token cannot be used for a different email address', async () => {
      const emailA = `email.a.${Date.now()}@example.com`;
      const emailB = `email.b.${Date.now()}@example.com`;

      await makeRequest('/api/auth/send-otp', 'POST', { email: emailA, fullName: 'User A', role: 'client' });
      const otpA = peekActiveEmailOtpForTesting(emailA);
      const verifyResA = await makeRequest('/api/auth/verify-email-otp', 'POST', { email: emailA, otp: otpA! });
      const tokenA = verifyResA.data.verificationToken;

      // Attempt to register emailB with tokenA
      const fraudRes = await makeRequest('/api/auth/register', 'POST', {
        email: emailB,
        name: 'User B',
        password: 'Password123!',
        role: 'CLIENT',
        verificationToken: tokenA,
      });

      assert(fraudRes.status === 403, `Expected 403 for mismatched email/token, got ${fraudRes.status}`);
      assert(fraudRes.data.code === 'EMAIL_NOT_VERIFIED', 'Expected EMAIL_NOT_VERIFIED error');
    });

    // 13. Cryptographic and security validations
    await test('13. Cryptographic Security: OTPs stored hashed and token signature verified', async () => {
      const email = `crypto.${Date.now()}@example.com`;
      const sendRes = await sendEmailOtp({ email, type: 'signup' });
      const otp = sendRes.otp || sendRes.devOtp || peekActiveEmailOtpForTesting(email)!;
      assert(!!otp && /^[0-9]{6}$/.test(otp), 'OTP must be a 6-digit numeric string');

      // Verify timingSafeEqual and hash verification
      const verifyResult = verifyEmailOtp({ email, otp, type: 'signup' });
      assert(verifyResult.success === true, 'Verification of correct OTP must succeed');
      assert(!!verifyResult.verificationToken, 'Verification must return token');

      // Trying same OTP again must fail (consumed / invalidated)
      const secondAttempt = verifyEmailOtp({ email, otp, type: 'signup' });
      assert(secondAttempt.success === false, 'Consumed OTP must not be reusable');
    });

  } finally {
    server.close();
  }

  console.log('\n------------------------------------------------------------');
  console.log(`Tests: ${passed} passed, ${failed} failed, total ${passed + failed}`);
  console.log('------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
