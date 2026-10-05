/**
 * WEPSUN Engineering Solution — Official Google OAuth 2.0 & GIS Token Verifier
 * Cryptographically validates Google ID tokens using Google's official OAuth2Client SDK
 * and verifies claims: signature, aud, iss, exp, sub, email, and email_verified.
 */

import { OAuth2Client } from 'google-auth-library';

export interface VerifiedGoogleUser {
  googleId: string; // Google stable unique sub claim
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
  hostedDomain?: string;
}

/**
 * Returns allowed Google Client IDs configured via environment variables.
 */
export function getAllowedGoogleClientIds(): string[] {
  const envIds = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    process.env.VITE_GOOGLE_CLIENT_ID,
  ].filter(Boolean) as string[];

  // Fallback default enterprise development client IDs if no custom env is set
  const defaultFallbackIds = [
    '168301316891-6e6br98qti8u58frtj02l2k09m8r2sfe.apps.googleusercontent.com',
    '168301316891-27lc22uta0efj28sr1pi50jb6gjkpgah.apps.googleusercontent.com',
  ];

  return Array.from(new Set([...envIds, ...defaultFallbackIds]));
}

// Singleton OAuth2Client instance for cached certs and performance
const googleOAuth2Client = new OAuth2Client();

/**
 * Cryptographically verify Google ID Token (JWT) using official Google Auth Library.
 * Validates RSA signature with Google's public JWK certificates, audience (aud),
 * issuer (iss), expiration (exp), subject identifier (sub), email, and email_verified.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleUser> {
  if (!idToken || typeof idToken !== 'string' || idToken.trim().length === 0) {
    throw new Error('Google ID Token credential is required.');
  }

  const cleanToken = idToken.trim();
  const allowedAudiences = getAllowedGoogleClientIds();

  try {
    // 1. Official cryptographic signature & audience verification via Google Auth Library
    const ticket = await googleOAuth2Client.verifyIdToken({
      idToken: cleanToken,
      audience: allowedAudiences.length === 1 ? allowedAudiences[0] : allowedAudiences,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid or empty Google token payload.');
    }

    // 2. Strict Subject (sub) validation - Stable Google Account Identifier
    if (!payload.sub || typeof payload.sub !== 'string' || payload.sub.trim().length === 0) {
      throw new Error('Google identity token missing stable sub identifier.');
    }

    // 3. Email presence and email verification check
    if (!payload.email || typeof payload.email !== 'string') {
      throw new Error('Google account did not provide a valid email address.');
    }

    if (!payload.email_verified) {
      throw new Error('Google account email is not verified by Google. Unverified accounts are not permitted.');
    }

    // 4. Issuer check
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (payload.iss && !validIssuers.includes(payload.iss)) {
      throw new Error(`Invalid Google token issuer: ${payload.iss}`);
    }

    return {
      googleId: payload.sub.trim(),
      email: payload.email.toLowerCase().trim(),
      name: payload.name || payload.given_name || payload.email.split('@')[0],
      picture: payload.picture,
      emailVerified: true,
      hostedDomain: payload.hd,
    };
  } catch (error: any) {
    // If the error is already a descriptive error we threw, rethrow it
    if (
      error.message &&
      (error.message.includes('not verified') ||
        error.message.includes('missing stable sub') ||
        error.message.includes('required') ||
        error.message.includes('Invalid Google token issuer'))
    ) {
      throw error;
    }

    // Otherwise format standard verification error message
    console.warn('[GoogleAuthLib] ID Token verification failed:', error.message);
    throw new Error(error.message || 'Invalid or expired Google authentication credential.');
  }
}

/**
 * Verify Google OAuth 2.0 Access Token via Google UserInfo API endpoint
 */
export async function verifyGoogleAccessToken(accessToken: string): Promise<VerifiedGoogleUser> {
  if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length === 0) {
    throw new Error('Google Access Token is required.');
  }

  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken.trim()}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to verify Google access token with UserInfo endpoint.');
  }

  const data: any = await response.json();
  if (!data.sub) {
    throw new Error('Google profile did not contain a valid sub identifier.');
  }

  if (!data.email) {
    throw new Error('Google profile did not contain an email address.');
  }

  if (data.email_verified === false || data.email_verified === 'false') {
    throw new Error('Google account email is unverified.');
  }

  return {
    googleId: data.sub,
    email: data.email.toLowerCase().trim(),
    name: data.name || data.given_name || data.email.split('@')[0],
    picture: data.picture,
    emailVerified: Boolean(data.email_verified),
    hostedDomain: data.hd,
  };
}
