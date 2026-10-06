/**
 * WEPSUN Engineering Solutions — OTP System Functional Test Suite
 * Tests OTP generation, HTML email templating, happy paths, rate limits, attempt limits, and resets.
 */

import {
  generateSecureOtp,
  generateOtpEmailHtml,
  sendEmailOtp,
  verifyEmailOtp,
} from '../lib/emailOtpService.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`, detail || '');
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING WEPSUN OTP SYSTEM FUNCTION TEST SUITE');
  console.log('======================================================\n');

  // Test 1: Generate Secure 6-Digit OTP
  console.log('Test Group 1: OTP Cryptographic Generator');
  const sampleOtps = Array.from({ length: 10 }, () => generateSecureOtp());
  const allSixDigits = sampleOtps.every((code) => /^\d{6}$/.test(code));
  const uniqueCount = new Set(sampleOtps).size;
  assert(allSixDigits, 'All generated OTPs are exactly 6 numerical digits', sampleOtps);
  assert(uniqueCount >= 9, 'Generated OTPs have high cryptographic entropy and uniqueness');

  // Test 2: HTML Email Template Generation
  console.log('\nTest Group 2: Branded HTML Email Template');
  const sampleHtml = generateOtpEmailHtml({
    name: 'Rajesh Sharma',
    otp: '582914',
    type: 'signup',
    expiryMinutes: 10,
  });
  assert(sampleHtml.includes('WEPSUN'), 'HTML template contains WEPSUN brand header');
  assert(sampleHtml.includes('582914'), 'HTML template displays the exact 6-digit OTP code');
  assert(sampleHtml.includes('Rajesh Sharma'), 'HTML template addresses user by name');
  assert(sampleHtml.includes('10 minutes'), 'HTML template states 10-minute expiry window');
  assert(sampleHtml.includes('Security Notice'), 'HTML template includes anti-phishing security notice');

  // Test 3: Send Sign-Up OTP
  console.log('\nTest Group 3: Send Sign-Up OTP Workflow');
  const testEmail1 = `test.user.${Date.now()}@wepsun-demo.com`;
  const sendRes = await sendEmailOtp({
    email: testEmail1,
    name: 'Test Engineer',
    type: 'signup',
    userData: { role: 'CLIENT', phone: '+91 98765 43210' },
  });
  assert(sendRes.success === true, 'sendEmailOtp returned success=true');
  assert(typeof sendRes.devOtp === 'string' && sendRes.devOtp.length === 6, 'sendEmailOtp returned 6-digit devOtp for testing');
  assert(sendRes.expiresIn === 600, 'sendEmailOtp returned 600 seconds (10 mins) expiry window');

  // Test 4: Rate Limiting / Resend Cooldown
  console.log('\nTest Group 4: Resend Rate-Limiting & Cooldown');
  const immediateResend = await sendEmailOtp({
    email: testEmail1,
    name: 'Test Engineer',
    type: 'signup',
  });
  assert(immediateResend.success === false, 'Immediate resend within 60s cooldown is blocked');
  assert(immediateResend.code === 'RATE_LIMITED', 'Immediate resend returns code RATE_LIMITED');

  // Test 5: Verify Invalid OTP & Attempt Tracking
  console.log('\nTest Group 5: Incorrect OTP Handling & Attempt Tracking');
  const badVerify1 = verifyEmailOtp({
    email: testEmail1,
    otp: '000000',
    type: 'signup',
  });
  assert(badVerify1.success === false, 'Incorrect OTP returns success=false');
  assert(badVerify1.code === 'INVALID_OTP', 'Incorrect OTP returns code INVALID_OTP');
  assert(badVerify1.remainingAttempts === 4, 'Remaining attempts decremented to 4');

  // Test 6: Brute-Force Lockout (5 failed attempts)
  console.log('\nTest Group 6: Brute-Force Protection (Max 5 Failed Attempts)');
  const bruteEmail = `brute.test.${Date.now()}@wepsun-demo.com`;
  const bruteSend = await sendEmailOtp({ email: bruteEmail, type: 'signup' });
  
  // 5 wrong attempts
  verifyEmailOtp({ email: bruteEmail, otp: '111111', type: 'signup' }); // att 1 (rem 4)
  verifyEmailOtp({ email: bruteEmail, otp: '222222', type: 'signup' }); // att 2 (rem 3)
  verifyEmailOtp({ email: bruteEmail, otp: '333333', type: 'signup' }); // att 3 (rem 2)
  verifyEmailOtp({ email: bruteEmail, otp: '444444', type: 'signup' }); // att 4 (rem 1)
  const lastWrong = verifyEmailOtp({ email: bruteEmail, otp: '555555', type: 'signup' }); // att 5 (rem 0)
  assert(lastWrong.remainingAttempts === 0, 'Fifth wrong attempt reduces remaining attempts to 0');

  const lockedAttempt = verifyEmailOtp({
    email: bruteEmail,
    otp: bruteSend.devOtp || '999999',
    type: 'signup',
  });
  assert(lockedAttempt.success === false, 'Subsequent attempt on locked record is rejected');
  assert(lockedAttempt.code === 'MAX_ATTEMPTS_EXCEEDED', 'Returns code MAX_ATTEMPTS_EXCEEDED');

  // Test 7: Happy Path Verification
  console.log('\nTest Group 7: Successful OTP Verification (Happy Path)');
  const validEmail = `happy.path.${Date.now()}@wepsun-demo.com`;
  const validSend = await sendEmailOtp({
    email: validEmail,
    name: 'Ananya Verma',
    type: 'signup',
    userData: { role: 'TECHNICIAN' },
  });
  const validVerify = verifyEmailOtp({
    email: validEmail,
    otp: validSend.devOtp!,
    type: 'signup',
  });
  assert(validVerify.success === true, 'Correct OTP verification returned success=true');
  assert(validVerify.userData?.role === 'TECHNICIAN', 'Saved userData retrieved correctly upon verification');

  // Test 8: Re-use Prevention (Single-Use Token)
  console.log('\nTest Group 8: Single-Use Token Protection (No Re-play)');
  const replayVerify = verifyEmailOtp({
    email: validEmail,
    otp: validSend.devOtp!,
    type: 'signup',
  });
  assert(replayVerify.success === false, 'Replaying previously verified OTP fails');
  assert(replayVerify.code === 'OTP_NOT_FOUND', 'Consumed OTP returns OTP_NOT_FOUND');

  // Test 9: Forgot Password OTP Flow
  console.log('\nTest Group 9: Forgot Password OTP Flow');
  const forgotEmail = `forgot.test.${Date.now()}@wepsun-demo.com`;
  const forgotSend = await sendEmailOtp({
    email: forgotEmail,
    name: 'Vikram Mehta',
    type: 'forgot_password',
  });
  assert(forgotSend.success === true, 'Forgot Password OTP sent successfully');
  
  const forgotVerify = verifyEmailOtp({
    email: forgotEmail,
    otp: forgotSend.devOtp!,
    type: 'forgot_password',
  });
  assert(forgotVerify.success === true, 'Forgot Password OTP verified successfully');

  // Final Summary
  console.log('\n======================================================');
  console.log(`🏁 TEST RESULTS: Passed: ${passed} | Failed: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL OTP SYSTEM FUNCTIONS OPERATING AT 100% RELIABILITY!');
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
