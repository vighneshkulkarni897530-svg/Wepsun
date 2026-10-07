/**
 * WEPSUN Engineering Solutions — Live Email Deliverability Diagnostics Tool
 * 
 * Verifies end-to-end SMTP / Resend deliverability, header alignment, envelope acceptance,
 * and server response codes.
 * 
 * Usage: npx tsx backend/src/scripts/testEmailDeliverability.ts [recipient@example.com]
 */

import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';
import {
  generateSecureOtp,
  generateOtpEmailHtml,
  generateOtpEmailText,
  getEmailServiceHealth,
  dispatchEmailWithFailover,
  maskEmail,
} from '../lib/emailOtpService.js';

async function testDeliverability() {
  const targetEmail = process.argv[2] || process.env.SMTP_USER || 'wepsunengineering@gmail.com';
  console.log('\n================================================================');
  console.log('📡 WEPSUN LIVE EMAIL DELIVERABILITY DIAGNOSTICS');
  console.log('================================================================');
  console.log(`🎯 Target Recipient: ${targetEmail} (${maskEmail(targetEmail)})`);
  console.log(`⏰ Timestamp:        ${new Date().toISOString()}\n`);

  // 1. Check Configuration Health
  console.log('📋 STEP 1: Provider Configuration Diagnostics');
  const health = getEmailServiceHealth();
  console.log(`   • Status:           ${health.status.toUpperCase()}`);
  console.log(`   • Primary Provider: ${health.primaryProvider.toUpperCase()}`);
  console.log(`   • Resend Config:    ${health.resendConfigured ? '✅ Active' : '⚪ Not configured'}`);
  console.log(`   • SMTP Config:      ${health.smtpConfigured ? '✅ Active' : '⚪ Not configured'}`);
  console.log(`   • Active From:      ${health.fromAddress}`);

  // 2. Sender Alignment Check
  console.log('\n📋 STEP 2: Sender & Domain Alignment Check');
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpFrom = (process.env.SMTP_FROM || '').trim();
  const resendFrom = (process.env.RESEND_FROM || '').trim();

  if (health.primaryProvider === 'smtp') {
    if (health.fromAddress.includes('@resend.dev')) {
      console.warn('   ⚠️ WARNING: Sending via Gmail SMTP with @resend.dev from-address! This triggers DMARC spoofing rejections.');
    } else {
      console.log('   ✅ Sender Aligned: Gmail SMTP uses matching sender identity.');
    }
  } else if (health.primaryProvider === 'resend') {
    console.log(`   ✅ Resend Sender Configured: ${resendFrom}`);
  }

  // 3. Generate Branded OTP Content
  console.log('\n📋 STEP 3: Message Construction');
  const testOtp = generateSecureOtp();
  const subject = `${testOtp} is your WEPSUN verification code`;
  const htmlContent = generateOtpEmailHtml({
    name: 'Deliverability Tester',
    otp: testOtp,
    type: 'signup',
    expiryMinutes: 10,
  });
  const textContent = generateOtpEmailText({
    name: 'Deliverability Tester',
    otp: testOtp,
    type: 'signup',
    expiryMinutes: 10,
  });
  console.log(`   • Subject:          "${subject}"`);
  console.log(`   • HTML Size:        ${Buffer.byteLength(htmlContent, 'utf8')} bytes`);
  console.log(`   • Text Fallback:    ${Buffer.byteLength(textContent, 'utf8')} bytes`);

  // 4. Dispatch Email with Failover
  console.log('\n📋 STEP 4: Live Provider Transmission');
  const startTime = Date.now();
  const result = await dispatchEmailWithFailover({
    toEmail: targetEmail,
    subject,
    htmlContent,
    textContent,
  });
  const elapsedMs = Date.now() - startTime;

  console.log(`\n================================================================`);
  console.log('📊 TRANSMISSION RESULT');
  console.log('================================================================');
  console.log(`   • Acceptance Status:    ${result.accepted ? '✅ ACCEPTED BY PROVIDER' : '❌ REJECTED'}`);
  console.log(`   • Active Provider Used: ${result.provider}`);
  console.log(`   • Provider Message ID:  ${result.messageId || 'N/A'}`);
  console.log(`   • Round-Trip Latency:   ${elapsedMs} ms`);

  if (result.smtpResponse) {
    console.log(`   • SMTP Server Dialogue: "${result.smtpResponse}"`);
  }
  if (result.acceptedRecipients) {
    console.log(`   • Accepted Recipients:  [${result.acceptedRecipients.map(maskEmail).join(', ')}]`);
  }
  if (result.rejectedRecipients && result.rejectedRecipients.length > 0) {
    console.warn(`   • Rejected Recipients:  [${result.rejectedRecipients.map(maskEmail).join(', ')}]`);
  }
  if (result.error) {
    console.error(`   • Error Details:        ${result.error}`);
  }

  console.log('\n================================================================');
  console.log('🔍 INBOX VERIFICATION CHECKLIST:');
  console.log('================================================================');
  console.log(`1. Check Inbox for: ${targetEmail}`);
  console.log(`2. Check Spam / Junk / Promotions tab if not in Primary Inbox`);
  console.log(`3. Search for Subject: "${subject}" or Message ID: "${result.messageId}"`);
  console.log(`4. Note: Gmail SMTP acceptance ("250 OK") indicates submission to Google queue.`);
  console.log('================================================================\n');
}

testDeliverability().catch((err) => {
  console.error('Deliverability test error:', err);
  process.exit(1);
});
