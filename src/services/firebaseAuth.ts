/**
 * WEPSUN Engineering Solutions — Authentication & Email OTP Service
 * Interacts with WEPSUN Backend API for secure OTP delivery, Verification,
 * and Password Reset workflows.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  sendPasswordResetEmail,
  Auth,
} from 'firebase/auth';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { apiService, setTokens } from './api';
import type { User as UserRecord, UserRole } from '../types';

// Read Firebase configurations from Vite environment with live production defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA2nh4Z_Prd5tASvbupaa4YwBoS2HsjRN0',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'wepsun-engineering-solut-d3a69.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'wepsun-engineering-solut-d3a69',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'wepsun-engineering-solut-d3a69.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '425617890861',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:425617890861:web:e7f76a5535a5c3b12e62a4',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-0HT7QG7XJF',
};

// Initialize Firebase App singleton safely
let app: FirebaseApp;
let auth: Auth;
let analytics: Analytics | null = null;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);

  // Initialize Analytics if supported in browser environment
  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    }).catch(() => {
      // Analytics not supported in this runtime
    });
  }
} catch (err: any) {
  console.warn('[Firebase Auth] Initialization note:', err?.message);
}

export { app, auth, analytics, firebaseConfig };

export interface SendOtpResponse {
  success: boolean;
  message: string;
  expiresIn?: number;
  code?: string;
  devOtp?: string;
  firebaseEmailSent?: boolean;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  password?: string;
  companyId?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message?: string;
  user?: UserRecord;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn?: number;
  };
  code?: string;
}

/**
 * 1. Send Email OTP for User Registration / Sign-Up
 */
export async function sendSignupEmailOtp(
  email: string,
  fullName: string
): Promise<SendOtpResponse> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const res = await apiService.sendOtp({
      email: cleanEmail,
      name: fullName.trim(),
      type: 'signup',
    });

    if (res.success) {
      return {
        success: true,
        message: res.message || `Verification code sent to ${cleanEmail}. Please check your inbox and spam folder.`,
        expiresIn: (res as any).expiresIn || 600,
        devOtp: (res as any).devOtp,
      };
    } else {
      return {
        success: false,
        message: res.message || res.error || 'Unable to send OTP. Please try again in a moment.',
        code: res.code,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Unable to reach backend verification service. Please check connection.',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * 2. Verify Email OTP & Complete Registration
 */
export async function verifySignupEmailOtp(
  payload: VerifyOtpPayload
): Promise<VerifyOtpResponse> {
  const cleanEmail = payload.email.trim().toLowerCase();
  const cleanOtp = payload.otp.trim();

  try {
    const res = await apiService.verifySignupOtp({
      email: cleanEmail,
      otp: cleanOtp,
      name: payload.fullName.trim(),
      phone: payload.phone?.trim() || '+91 98200 00000',
      role: payload.role.toUpperCase(),
      password: payload.password,
      companyId: payload.companyId || 'comp-1',
    });

    if (res.success && res.data) {
      const authData = res.data;
      if (authData.tokens?.accessToken) {
        setTokens(authData.tokens.accessToken, authData.tokens.refreshToken);
      }

      const userRecord: UserRecord = {
        id: authData.user?.id || 'usr-' + Date.now(),
        name: authData.user?.name || payload.fullName,
        email: authData.user?.email || cleanEmail,
        phone: authData.user?.phone || payload.phone || '+91 98200 00000',
        role: (authData.user?.role || payload.role).toLowerCase() as UserRole,
        companyId: authData.user?.companyId || 'comp-1',
        branchId: authData.user?.branchId,
        clientId: authData.user?.clientId || (payload.role === 'client' ? 'client-' + Date.now() : undefined),
        technicianId: authData.user?.technicianId || (payload.role === 'technician' ? 'tech-' + Date.now() : undefined),
        avatar: authData.user?.avatarUrl || (payload.role === 'client'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'),
        companyName: `${payload.fullName.trim()}'s Organisation`,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      return {
        success: true,
        user: userRecord,
        tokens: authData.tokens,
      };
    } else {
      return {
        success: false,
        message: res.message || res.error || 'Invalid verification code. Please try again.',
        code: res.code,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'OTP verification encountered a network error.',
      code: 'VERIFICATION_FAILED',
    };
  }
}

/**
 * 3. Send Password Reset OTP
 */
export async function sendForgotPasswordEmail(
  email: string
): Promise<SendOtpResponse> {
  const cleanEmail = email.trim().toLowerCase();
  let firebaseSent = false;

  // Attempt optional Firebase Password Reset Link in parallel
  try {
    if (auth && !firebaseConfig.apiKey.includes('Mock')) {
      await sendPasswordResetEmail(auth, cleanEmail);
      firebaseSent = true;
    }
  } catch (fbErr: any) {
    // Non-blocking
  }

  try {
    const res = await apiService.sendForgotPasswordOtp({ email: cleanEmail });

    if (res.success) {
      return {
        success: true,
        message: res.message || `Password reset code sent to ${cleanEmail}. Check spam/junk if not in inbox.`,
        expiresIn: (res as any).expiresIn || 600,
        devOtp: (res as any).devOtp,
        firebaseEmailSent: firebaseSent,
      };
    } else {
      return {
        success: false,
        message: res.message || res.error || 'Unable to send password reset code.',
        code: res.code,
        firebaseEmailSent: firebaseSent,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error while requesting reset code.',
      code: 'NETWORK_ERROR',
      firebaseEmailSent: firebaseSent,
    };
  }
}

/**
 * 4. Verify Password Reset OTP and Update Password
 */
export async function verifyForgotPasswordOtpAndReset(
  email: string,
  otp: string,
  newPassword: string
): Promise<{ success: boolean; message: string; code?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otp.trim();

  try {
    const res = await apiService.verifyForgotPasswordOtp({
      email: cleanEmail,
      otp: cleanOtp,
      newPassword,
    });

    if (res.success) {
      return {
        success: true,
        message: res.message || 'Password has been reset successfully. Please sign in.',
      };
    } else {
      return {
        success: false,
        message: res.message || res.error || 'Failed to reset password. Please check your OTP.',
        code: res.code,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Password reset failed. Please try again.',
      code: 'RESET_FAILED',
    };
  }
}

/**
 * 5. Resend Verification OTP with Rate Limiter
 */
export async function resendOtp(
  email: string,
  type: 'signup' | 'forgot_password'
): Promise<SendOtpResponse> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const res = await apiService.resendOtp({
      email: cleanEmail,
      type,
    });

    if (res.success) {
      return {
        success: true,
        message: res.message || 'New verification code sent. Please check inbox & spam.',
        expiresIn: (res as any).expiresIn || 600,
        devOtp: (res as any).devOtp,
      };
    } else {
      return {
        success: false,
        message: res.message || res.error || 'Failed to resend OTP.',
        code: res.code,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error while resending OTP.',
      code: 'NETWORK_ERROR',
    };
  }
}
