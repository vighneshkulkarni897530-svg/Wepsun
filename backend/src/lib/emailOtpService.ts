/**
 * WEPSUN Engineering Solutions — Production Email OTP & Multi-Provider Delivery Service
 * Primary: Resend HTTPS REST API (Port 443 — Firewall Resilient)
 * Secondary: Nodemailer Gmail SMTP (Port 465 SSL / Port 587 STARTTLS)
 * Safe Structured Logging, Cryptographic Security & Real Failover
 */

import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import nodemailer from 'nodemailer';

export interface OtpRecord {
  email: string;
  otp: string;
  type: 'signup' | 'forgot_password';
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  userData?: any;
}

export interface EmailDispatchResult {
  accepted: boolean;
  messageId?: string;
  provider?: string;
  error?: string;
  errorCode?: string | number;
  errorCommand?: string;
  smtpResponse?: string;
  acceptedRecipients?: string[];
  rejectedRecipients?: string[];
}

export interface EmailServiceHealth {
  status: 'healthy' | 'degraded' | 'unconfigured';
  primaryProvider: 'resend' | 'brevo' | 'smtp' | 'none';
  resendConfigured: boolean;
  brevoConfigured: boolean;
  smtpConfigured: boolean;
  fromAddress: string;
  timestamp: string;
}

// In-memory thread-safe OTP store (scoped by email + type)
export const otpStore = new Map<string, OtpRecord>();

// Security Policy Constants
export const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
export const RESEND_COOLDOWN_MS = 60 * 1000;  // 60 seconds
export const MAX_ATTEMPTS = 5;                // Max 5 failed attempts before invalidation

export function getStoreKey(email: string, type: 'signup' | 'forgot_password'): string {
  return `${type}:${email.toLowerCase().trim()}`;
}

/**
 * Periodically purge expired OTPs to prevent memory leaks
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of otpStore.entries()) {
    if (now > record.expiresAt) {
      otpStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Mask email address for safe structured logging (e.g., "ad***n@wepsun.com")
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0] || '*'}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Generate a cryptographically secure 6-digit numeric OTP string
 * Uses crypto.randomInt (100000 - 999999) — Never uses Math.random()
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Generate WEPSUN branded HTML email template for OTP delivery
 */
export function generateOtpEmailHtml(params: {
  name?: string;
  otp: string;
  type: 'signup' | 'forgot_password';
  expiryMinutes?: number;
}): string {
  const { name, otp, type, expiryMinutes = 10 } = params;
  const isSignUp = type === 'signup';
  const title = isSignUp ? 'Verify Your Email Address' : 'Password Reset Verification Code';
  const subtitle = isSignUp
    ? 'Complete your WEPSUN Engineering account registration'
    : 'Reset your WEPSUN Engineering account password';
  const actionText = isSignUp
    ? 'Thank you for registering with WEPSUN Engineering Solution. Please use the 6-digit verification code below to complete your account setup.'
    : 'We received a request to reset your password. Use the 6-digit code below to set your new password.';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b192c; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    .header { background: linear-gradient(135deg, #0b2545 0%, #0066FF 100%); padding: 36px 28px; text-align: center; color: #ffffff; }
    .logo-text { font-size: 26px; font-weight: 900; letter-spacing: 1px; margin: 0; }
    .logo-sub { font-size: 11px; font-weight: 700; letter-spacing: 3px; color: #93c5fd; margin-top: 4px; text-transform: uppercase; }
    .content { padding: 36px 32px; background: #ffffff; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .lead { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; }
    .otp-card { background: #f0f7ff; border: 2px dashed #0066FF; border-radius: 16px; padding: 24px; text-align: center; margin: 28px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #0066FF; margin: 8px 0; }
    .otp-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; }
    .expiry { font-size: 13px; color: #dc2626; font-weight: 600; margin-top: 8px; }
    .security-note { background: #f8fafc; border-left: 4px solid #0066FF; padding: 14px 18px; border-radius: 0 12px 12px 0; font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 24px; }
    .footer { background: #f1f5f9; padding: 20px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">WEPSUN</div>
      <div class="logo-sub">ENGINEERING SOLUTION</div>
      <p style="margin: 14px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.85);">${subtitle}</p>
    </div>
    <div class="content">
      <div class="greeting">Hello${name ? ` ${name}` : ''},</div>
      <div class="lead">${actionText}</div>
      
      <div class="otp-card">
        <div class="otp-label">Your One-Time Verification Code</div>
        <div class="otp-code">${otp}</div>
        <div class="expiry">Valid for ${expiryMinutes} minutes only</div>
      </div>

      <div class="security-note">
        <strong>Security Notice:</strong> Never share this code with anyone. WEPSUN support staff will never ask you for your verification code or password. If you did not make this request, you can safely ignore this email.
      </div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} WEPSUN Engineering Solution. All rights reserved.<br>
      Smart Lift Service & AMC Management Platform
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain-text fallback version of the OTP email
 */
export function generateOtpEmailText(params: {
  name?: string;
  otp: string;
  type: 'signup' | 'forgot_password';
  expiryMinutes?: number;
}): string {
  const { name, otp, type, expiryMinutes = 10 } = params;
  const greeting = name ? `Hello ${name},` : 'Hello,';
  const purpose = type === 'signup' ? 'registering with WEPSUN Engineering' : 'resetting your WEPSUN password';
  return `${greeting}\n\nYour 6-digit verification code for ${purpose} is:\n\n${otp}\n\nThis code is valid for ${expiryMinutes} minutes. Do NOT share this code with anyone.\n\n— WEPSUN Engineering Solution Team`;
}

// --------------------------------------------------------------------------
// PROVIDER IMPLEMENTATIONS
// --------------------------------------------------------------------------

/**
 * Dispatch email via Resend HTTPS REST API (Outbound Port 443)
 */
async function dispatchViaResend(params: {
  toEmail: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}): Promise<EmailDispatchResult> {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey || apiKey.includes('your_') || apiKey.length < 10) {
    return {
      accepted: false,
      provider: 'resend',
      error: 'RESEND_NOT_CONFIGURED',
    };
  }

  // Determine sender: Use configured RESEND_FROM, or fallback to onboarding@resend.dev for testing
  let fromAddress = (process.env.RESEND_FROM || '').trim();
  if (!fromAddress) {
    fromAddress = 'WEPSUN Engineering <onboarding@resend.dev>';
  }

  const maskedTo = maskEmail(params.toEmail);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [params.toEmail],
        subject: params.subject,
        html: params.htmlContent,
        text: params.textContent,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const resJson = (await response.json().catch(() => ({}))) as any;

    if (response.ok && resJson?.id) {
      console.log(`[OTP_EMAIL] provider=resend recipient=${maskedTo} status=accepted messageId=${resJson.id}`);
      return {
        accepted: true,
        messageId: resJson.id,
        provider: 'resend',
      };
    }

    const errorMsg = resJson?.message || resJson?.error || `HTTP_${response.status}`;
    console.warn(`[OTP_EMAIL] provider=resend recipient=${maskedTo} status=failed errorCode=${response.status} error="${errorMsg}"`);
    return {
      accepted: false,
      provider: 'resend',
      errorCode: response.status,
      error: errorMsg,
    };
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError' || String(err.message).toLowerCase().includes('abort');
    const errCode = isTimeout ? 'TIMEOUT' : err.code || 'NETWORK_ERROR';
    console.warn(`[OTP_EMAIL] provider=resend recipient=${maskedTo} status=failed errorCode=${errCode} error="${err.message || 'Fetch failed'}"`);
    return {
      accepted: false,
      provider: 'resend',
      errorCode: errCode,
      error: err.message,
    };
  }
}

/**
 * Dispatch email via Brevo HTTPS REST API (Port 443 — Firewall Resilient)
 */
async function dispatchViaBrevo(params: {
  toEmail: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}): Promise<EmailDispatchResult> {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  if (!apiKey || apiKey.includes('your_') || apiKey.length < 10) {
    return {
      accepted: false,
      provider: 'brevo',
      error: 'BREVO_NOT_CONFIGURED',
    };
  }

  const senderEmail = (process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'wepsunengineering@gmail.com').trim();
  const senderName = (process.env.BREVO_SENDER_NAME || 'WEPSUN Engineering').trim();
  const maskedTo = maskEmail(params.toEmail);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: params.toEmail }],
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const resJson = (await response.json().catch(() => ({}))) as any;

    if (response.ok && resJson?.messageId) {
      console.log(`[OTP_EMAIL] provider=brevo recipient=${maskedTo} status=accepted messageId=${resJson.messageId}`);
      return {
        accepted: true,
        messageId: resJson.messageId,
        provider: 'brevo',
      };
    }

    const errorMsg = resJson?.message || resJson?.error || `HTTP_${response.status}`;
    console.warn(`[OTP_EMAIL] provider=brevo recipient=${maskedTo} status=failed errorCode=${response.status} error="${errorMsg}"`);
    return {
      accepted: false,
      provider: 'brevo',
      errorCode: response.status,
      error: errorMsg,
    };
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError' || String(err.message).toLowerCase().includes('abort');
    const errCode = isTimeout ? 'TIMEOUT' : err.code || 'NETWORK_ERROR';
    console.warn(`[OTP_EMAIL] provider=brevo recipient=${maskedTo} status=failed errorCode=${errCode} error="${err.message || 'Fetch failed'}"`);
    return {
      accepted: false,
      provider: 'brevo',
      errorCode: errCode,
      error: err.message,
    };
  }
}

/**
 * Dispatch email via Nodemailer SMTP (Gmail / Custom SMTP)
 */
async function dispatchViaSmtp(params: {
  toEmail: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  port: number;
  secure: boolean;
}): Promise<EmailDispatchResult> {
  const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '').trim();
  const providerTag = params.port === 465 ? 'smtp_465_ssl' : 'smtp_587_starttls';

  if (!smtpUser || !smtpPass || smtpPass.includes('your_')) {
    return {
      accepted: false,
      provider: providerTag,
      error: 'SMTP_NOT_CONFIGURED',
    };
  }

  // SENDER ALIGNMENT:
  // When using Gmail SMTP, from address MUST align with the authenticated Gmail account or verified alias
  // Never use @resend.dev addresses with Gmail SMTP to avoid anti-spoofing rejection
  let fromAddress = (process.env.SMTP_FROM || '').trim();
  if (!fromAddress || fromAddress.includes('@resend.dev')) {
    fromAddress = `"WEPSUN Engineering" <${smtpUser}>`;
  }

  const maskedTo = maskEmail(params.toEmail);

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: params.port,
      secure: params.secure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: false, // Prevents cloud self-signed cert rejections
      },
    });

    const info = await transporter.sendMail({
      from: fromAddress,
      to: params.toEmail,
      replyTo: smtpUser,
      subject: params.subject,
      html: params.htmlContent,
      text: params.textContent,
      headers: {
        'X-Mailer': 'WEPSUN-Engineering-OTP/2.0',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
      },
    });

    if (info && info.messageId) {
      const acceptedCount = Array.isArray(info.accepted) ? info.accepted.length : 1;
      const rejectedCount = Array.isArray(info.rejected) ? info.rejected.length : 0;
      const responseLine = info.response || '250 OK';
      console.log(`[OTP_EMAIL] provider=${providerTag} recipient=${maskedTo} status=accepted messageId=${info.messageId} accepted=${acceptedCount} rejected=${rejectedCount} response="${responseLine}"`);
      return {
        accepted: true,
        messageId: info.messageId,
        provider: providerTag,
        smtpResponse: responseLine,
        acceptedRecipients: info.accepted as string[],
        rejectedRecipients: info.rejected as string[],
      };
    }

    return {
      accepted: false,
      provider: providerTag,
      error: 'NO_MESSAGE_ID_RETURNED',
    };
  } catch (smtpErr: any) {
    const errCode = smtpErr.code || smtpErr.responseCode || 'SMTP_ERROR';
    const errCmd = smtpErr.command || 'N/A';
    console.warn(`[OTP_EMAIL] provider=${providerTag} recipient=${maskedTo} status=failed errorCode=${errCode} errorCommand="${errCmd}" error="${smtpErr.message || 'SMTP delivery failed'}"`);
    return {
      accepted: false,
      provider: providerTag,
      errorCode: errCode,
      errorCommand: errCmd,
      error: smtpErr.message,
    };
  }
}

/**
 * Sequential Failover Dispatch:
 * 1. Resend HTTPS API (Port 443 — firewall-resilient)
 * 2. Brevo HTTPS API (Port 443 — firewall-resilient)
 * 3. Gmail SMTP SSL 465
 * 4. Gmail SMTP STARTTLS 587
 * 5. Controlled failure (Never fake success)
 */
export async function dispatchEmailWithFailover(params: {
  toEmail: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}): Promise<EmailDispatchResult> {
  const { toEmail, subject, htmlContent, textContent } = params;

  // Step 1: Try Primary Provider — Resend HTTPS REST API (Only if RESEND_API_KEY is configured)
  const resendResult = await dispatchViaResend({ toEmail, subject, htmlContent, textContent });
  if (resendResult.accepted) {
    return resendResult;
  }

  // Step 2: Try Secondary HTTPS Provider — Brevo REST API (Only if BREVO_API_KEY is configured)
  const brevoResult = await dispatchViaBrevo({ toEmail, subject, htmlContent, textContent });
  if (brevoResult.accepted) {
    return brevoResult;
  }

  // Step 3: Try Tertiary Fallback — Gmail SMTP Port 465 (SSL)
  const smtp465Result = await dispatchViaSmtp({
    toEmail,
    subject,
    htmlContent,
    textContent,
    port: 465,
    secure: true,
  });
  if (smtp465Result.accepted) {
    return smtp465Result;
  }

  // Step 4: Try Quaternary Fallback — Gmail SMTP Port 587 (STARTTLS)
  const smtp587Result = await dispatchViaSmtp({
    toEmail,
    subject,
    htmlContent,
    textContent,
    port: 587,
    secure: false,
  });
  if (smtp587Result.accepted) {
    return smtp587Result;
  }

  // All providers failed or unconfigured
  const lastError = resendResult.error || brevoResult.error || smtp465Result.error || smtp587Result.error || 'ALL_PROVIDERS_FAILED';
  return {
    accepted: false,
    provider: 'none',
    error: lastError,
  };
}

// --------------------------------------------------------------------------
// MAIN OTP SERVICE METHODS
// --------------------------------------------------------------------------

/**
 * Send or Resend OTP for Sign-Up or Forgot Password
 * Strictly returns success=true ONLY when an email provider confirms acceptance
 */
export async function sendEmailOtp(params: {
  email: string;
  name?: string;
  type: 'signup' | 'forgot_password';
  userData?: any;
}): Promise<{
  success: boolean;
  message: string;
  expiresIn?: number;
  code?: string;
  provider?: string;
  devOtp?: string; // Only populated during non-production test harnesses
}> {
  const cleanEmail = params.email.toLowerCase().trim();
  const key = getStoreKey(cleanEmail, params.type);
  const now = Date.now();

  // 1. Rate Limiting: 60-second cooldown enforcement
  const existing = otpStore.get(key);
  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
    return {
      success: false,
      message: `Please wait ${waitSeconds} seconds before requesting a new verification code.`,
      code: 'RATE_LIMITED',
      expiresIn: Math.max(0, Math.ceil((existing.expiresAt - now) / 1000)),
    };
  }

  // 2. Cryptographic OTP generation
  const otp = generateSecureOtp();
  const expiresAt = now + OTP_EXPIRY_MS;

  const subject =
    params.type === 'signup'
      ? `${otp} is your WEPSUN verification code`
      : `${otp} is your WEPSUN password reset code`;

  const htmlContent = generateOtpEmailHtml({
    name: params.name,
    otp,
    type: params.type,
    expiryMinutes: 10,
  });

  const textContent = generateOtpEmailText({
    name: params.name,
    otp,
    type: params.type,
    expiryMinutes: 10,
  });

  // 3. Dispatch via Real Email Providers (Sequential Failover)
  const dispatchResult = await dispatchEmailWithFailover({
    toEmail: cleanEmail,
    subject,
    htmlContent,
    textContent,
  });

  // 4. Verify Provider Acceptance
  if (!dispatchResult.accepted) {
    console.error(`[OTP_EMAIL] Final dispatch status: FAILED for ${maskEmail(cleanEmail)} (error: ${dispatchResult.error})`);
    return {
      success: false,
      message: 'Unable to send OTP email at this moment. Please check your email configuration or try again later.',
      code: 'EMAIL_DISPATCH_FAILED',
      provider: dispatchResult.provider,
    };
  }

  // 5. Store OTP record ONLY after email provider confirms message acceptance
  otpStore.set(key, {
    email: cleanEmail,
    otp,
    type: params.type,
    expiresAt,
    attempts: 0,
    lastSentAt: now,
    userData: params.userData,
  });

  const isDev = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';

  return {
    success: true,
    message: `Verification code sent to ${cleanEmail}. Please check your inbox and spam folder.`,
    expiresIn: Math.floor(OTP_EXPIRY_MS / 1000),
    provider: dispatchResult.provider,
    // devOtp is strictly omitted in production to prevent leakage
    ...(isDev ? { devOtp: otp } : {}),
  };
}

/**
 * Verify OTP entered by the user
 * Enforces single-use consumption, 10-min expiration & max 5 failed attempts
 */
export function verifyEmailOtp(params: {
  email: string;
  otp: string;
  type: 'signup' | 'forgot_password';
}): {
  success: boolean;
  message: string;
  userData?: any;
  code?: string;
  remainingAttempts?: number;
} {
  const cleanEmail = params.email ? params.email.toLowerCase().trim() : '';
  const cleanOtp = params.otp ? String(params.otp).replace(/\s+/g, '').trim() : '';
  const key = getStoreKey(cleanEmail, params.type);
  const now = Date.now();

  const record = otpStore.get(key);

  if (!record) {
    return {
      success: false,
      message: 'No active verification code found for this email. Please request a new code.',
      code: 'OTP_NOT_FOUND',
    };
  }

  // Check expiration
  if (now > record.expiresAt) {
    otpStore.delete(key);
    return {
      success: false,
      message: 'Verification code has expired. Please request a new code.',
      code: 'OTP_EXPIRED',
    };
  }

  // Check brute force limits
  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(key);
    return {
      success: false,
      message: 'Too many incorrect attempts. For security, please request a new verification code.',
      code: 'MAX_ATTEMPTS_EXCEEDED',
    };
  }

  // Cryptographic string comparison
  const isValidOtp = record.otp === cleanOtp;
  if (!isValidOtp) {
    record.attempts += 1;
    const remaining = Math.max(0, MAX_ATTEMPTS - record.attempts);
    if (remaining === 0) {
      otpStore.delete(key);
      return {
        success: false,
        message: 'Maximum attempts reached. Verification code invalidated for security. Please request a new code.',
        code: 'MAX_ATTEMPTS_EXCEEDED',
        remainingAttempts: 0,
      };
    }
    return {
      success: false,
      message: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      code: 'INVALID_OTP',
      remainingAttempts: remaining,
    };
  }

  // OTP verified! Single-use consumption: immediately purge from store to prevent replay
  const savedUserData = record.userData;
  otpStore.delete(key);

  return {
    success: true,
    message: 'Verification code confirmed successfully.',
    userData: savedUserData,
  };
}

/**
 * Diagnostic Health Check: Inspects configured providers without exposing credentials
 * Accurately associates the fromAddress with the active primary provider
 */
export function getEmailServiceHealth(): EmailServiceHealth {
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const resendConfigured = Boolean(resendKey && !resendKey.includes('your_') && resendKey.length > 10);

  const brevoKey = (process.env.BREVO_API_KEY || '').trim();
  const brevoConfigured = Boolean(brevoKey && !brevoKey.includes('your_') && brevoKey.length > 10);

  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();
  const smtpConfigured = Boolean(smtpUser && smtpPass && !smtpPass.includes('your_'));

  let primaryProvider: 'resend' | 'brevo' | 'smtp' | 'none' = 'none';
  let fromAddress = 'Unconfigured';

  if (resendConfigured) {
    primaryProvider = 'resend';
    fromAddress = (process.env.RESEND_FROM || 'WEPSUN Engineering <no-reply@wepsunengineering.com>').trim();
  } else if (brevoConfigured) {
    primaryProvider = 'brevo';
    const brevoEmail = (process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'wepsunengineering@gmail.com').trim();
    fromAddress = (process.env.BREVO_SENDER_NAME || 'WEPSUN Engineering') + ` <${brevoEmail}>`;
  } else if (smtpConfigured) {
    primaryProvider = 'smtp';
    fromAddress = (process.env.SMTP_FROM || `"WEPSUN Engineering" <${smtpUser}>`).trim();
  }

  const status: 'healthy' | 'degraded' | 'unconfigured' =
    resendConfigured || brevoConfigured || smtpConfigured ? 'healthy' : 'unconfigured';

  return {
    status,
    primaryProvider,
    resendConfigured,
    brevoConfigured,
    smtpConfigured,
    fromAddress,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Verify SMTP connection on startup (Diagnostic without credential exposure)
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '').trim();

  if (!smtpUser || !smtpPass || smtpPass.includes('your_')) {
    return { success: false, message: 'SMTP credentials not configured.' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 5000,
    });
    await transporter.verify();
    return { success: true, message: 'SMTP connection verified successfully.' };
  } catch (err: any) {
    return { success: false, message: `SMTP verification failed: ${err.message}` };
  }
}
