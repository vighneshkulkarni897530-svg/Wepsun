/**
 * WEPSUN Engineering Solutions — Persistent Session & Authentication Lifecycle Manager
 * 
 * Provides production-grade persistent login, automatic session restoration,
 * token lifecycle management, single-use refresh token rotation, platform-safe storage,
 * role validation, and app foreground/background lifecycle listeners.
 */

import { User, UserRole } from '../types';
import { apiService, getApiBaseUrl } from './api';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import { isValidCustomAvatar, isDummyAvatar } from '../utils/avatarUtils';

/**
 * Application-Level AES-256-GCM Authenticated Encryption Vault
 * 
 * Provides confidentiality and integrity protection for confidential tokens
 * stored in native Preferences (@capacitor/preferences) on Android and iOS.
 * 
 * Security Architecture & Guarantees:
 * - Uses WebCrypto SubtleCrypto with a device-unique high-entropy installation seed (256-bit random).
 * - Key Derivation: PBKDF2 with SHA-256 and 100,000 iterations to derive an AES-256-GCM key.
 * - Authenticated Encryption: AES-256-GCM with a unique 12-byte cryptographically random IV per write.
 *   Provides authenticated decryption (128-bit authentication tag) preventing tampering.
 * - Key Loss & Recovery: If decryption fails (due to storage corruption, OS migration, or tampered storage),
 *   the invalid entry is safely purged and returns null, enforcing clean re-authentication without leaking data.
 * - Device Isolation: Android auto-backup is disabled (android:allowBackup="false") to prevent ADB
 *   or Google Drive backup extraction of encrypted tokens.
 * - Note on Hardware Keystore: This implementation provides application sandbox authenticated encryption.
 *   Hardware-backed Keystore/Secure Enclave (TEE/SE) requires a dedicated native Java/Kotlin plugin.
 */

const VAULT_SEED_KEY = 'wepsun_vault_seed_v2';
const VAULT_SALT_KEY = 'wepsun_vault_salt_v2';
let cachedCryptoKey: CryptoKey | null = null;

async function getDeviceVaultKey(): Promise<CryptoKey | null> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) return null;
  if (cachedCryptoKey) return cachedCryptoKey;

  try {
    let rawSeed = localStorage.getItem(VAULT_SEED_KEY);
    let rawSalt = localStorage.getItem(VAULT_SALT_KEY);

    if (!rawSeed || !rawSalt) {
      // Generate 256-bit cryptographically secure random installation seed & 128-bit salt
      const seedBytes = new Uint8Array(32);
      const saltBytes = new Uint8Array(16);
      window.crypto.getRandomValues(seedBytes);
      window.crypto.getRandomValues(saltBytes);

      rawSeed = Array.from(seedBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
      rawSalt = Array.from(saltBytes).map((b) => b.toString(16).padStart(2, '0')).join('');

      try {
        localStorage.setItem(VAULT_SEED_KEY, rawSeed);
        localStorage.setItem(VAULT_SALT_KEY, rawSalt);
      } catch {
        // Fallback for private browsing
      }
    }

    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(rawSeed),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    cachedCryptoKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode(rawSalt),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return cachedCryptoKey;
  } catch (err) {
    console.warn('[Vault] Failed to derive vault encryption key:', err);
    return null;
  }
}

async function encryptForVault(plaintext: string): Promise<string> {
  try {
    const key = await getDeviceVaultKey();
    if (!key || typeof window === 'undefined') return plaintext;

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    const ivHex = Array.from(iv).map((b) => b.toString(16).padStart(2, '0')).join('');
    const cipherHex = Array.from(new Uint8Array(ciphertext)).map((b) => b.toString(16).padStart(2, '0')).join('');
    return `enc:v2:${ivHex}:${cipherHex}`;
  } catch (err) {
    console.warn('[Vault] Encryption error; falling back to plaintext:', err);
    return plaintext;
  }
}

async function decryptFromVault(storedValue: string): Promise<string | null> {
  if (!storedValue) return null;
  if (!storedValue.startsWith('enc:v2:') && !storedValue.startsWith('enc:v1:')) {
    return storedValue;
  }

  try {
    const key = await getDeviceVaultKey();
    if (!key || typeof window === 'undefined') return storedValue;

    const parts = storedValue.split(':');
    if (parts.length !== 4) return null;

    const ivHex = parts[2];
    const cipherHex = parts[3];

    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    const ciphertext = new Uint8Array(cipherHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    console.warn('[Vault] Authenticated decryption failed. Data corrupted or key mismatch; purging invalid token.');
    return null;
  }
}

// Safe Native Preferences bridge for Android/iOS native app with web fallback.
// Uses AES-256-GCM authenticated encryption for confidential tokens before writing to native Preferences.
async function nativePrefSet(key: string, value: string): Promise<void> {
  try {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      const isConfidential = key.includes('token') || key.includes('session');
      const valueToStore = isConfidential ? await encryptForVault(value) : value;
      await Preferences.set({ key, value: valueToStore });
    }
  } catch {
    // Non-blocking fallback
  }
}

async function nativePrefGet(key: string): Promise<string | null> {
  try {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      const res = await Preferences.get({ key });
      if (!res.value) return null;
      const decrypted = await decryptFromVault(res.value);
      if (decrypted === null && res.value.startsWith('enc:')) {
        // Corrupted ciphertext or key loss: clean invalid preference to prevent stale failure loops
        await Preferences.remove({ key });
        return null;
      }
      return decrypted;
    }
    return null;
  } catch {
    return null;
  }
}

async function nativePrefRemove(key: string): Promise<void> {
  try {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      await Preferences.remove({ key });
    }
  } catch {
    // Non-blocking fallback
  }
}

// Storage Keys
export const STORAGE_PREFIX = 'wepsun_lift_saas_v2_';
export const TOKEN_KEY = 'wepsun_access_token';
export const REFRESH_TOKEN_KEY = 'wepsun_refresh_token';
export const USER_SESSION_KEY = 'wepsun_user_session';
export const ROLE_KEY = 'wepsun_role';
export const MASTER_AUTH_KEY = 'wepsun_master_authenticated';
export const MASTER_EXPIRY_KEY = 'wepsun_master_session_expiry';
export const EXPLICIT_LOGOUT_KEY = 'wepsun_explicit_logout';

export interface RestoredSessionResult {
  status: 'restored' | 'no_session' | 'expired' | 'revoked' | 'offline';
  user: User | null;
  role: UserRole;
  accessToken: string | null;
  isMasterAdmin: boolean;
  message?: string;
}

/**
 * Decode JWT payload without external library dependencies
 */
export function decodeJwtPayload(token: string | null): any | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (base64.length % 4)) % 4;
    base64 += '='.repeat(pad);

    if (typeof atob === 'function') {
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } else if (typeof (globalThis as any).Buffer !== 'undefined') {
      const jsonPayload = (globalThis as any).Buffer.from(base64, 'base64').toString('utf8');
      return JSON.parse(jsonPayload);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired, with an optional safety margin buffer (default: 30 seconds)
 */
export function isTokenExpired(token: string | null, bufferSeconds = 30): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  const expirationMs = payload.exp * 1000;
  const nowWithBuffer = Date.now() + bufferSeconds * 1000;
  return nowWithBuffer >= expirationMs;
}

/**
 * Retrieve active access token from persistent storage
 */
export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
}

/**
 * Retrieve active refresh token from persistent storage
 */
export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY) || null;
}

/**
 * Persist tokens safely across app restarts and operating system terminations
 * Synchronizes to both web storage and native Android/iOS preferences.
 */
export function persistTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  sessionStorage.setItem(TOKEN_KEY, accessToken);

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  // Remove explicit logout marker when a new session is established
  localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
  sessionStorage.removeItem(EXPLICIT_LOGOUT_KEY);

  // Synchronize to native mobile storage
  nativePrefSet(TOKEN_KEY, accessToken);
  if (refreshToken) {
    nativePrefSet(REFRESH_TOKEN_KEY, refreshToken);
  }
  nativePrefRemove(EXPLICIT_LOGOUT_KEY);
}

/**
 * Check if an explicit logout has been triggered
 */
export function isExplicitLogoutActive(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(EXPLICIT_LOGOUT_KEY) === 'true';
}

/**
 * Record an explicit user logout
 */
export function recordExplicitLogout(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EXPLICIT_LOGOUT_KEY, 'true');
  nativePrefSet(EXPLICIT_LOGOUT_KEY, 'true');
}

/**
 * Clear the explicit user logout marker
 */
export function clearExplicitLogout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
  sessionStorage.removeItem(EXPLICIT_LOGOUT_KEY);
  nativePrefRemove(EXPLICIT_LOGOUT_KEY);
}

/**
 * Clear cached user session data
 */
export function clearCachedUserSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_SESSION_KEY);
  sessionStorage.removeItem(USER_SESSION_KEY);
  localStorage.removeItem(STORAGE_PREFIX + 'currentUser');
  localStorage.removeItem(STORAGE_PREFIX + 'role');
  localStorage.removeItem(STORAGE_PREFIX + 'userId');
  localStorage.removeItem(STORAGE_PREFIX + 'clientId');
  localStorage.removeItem(STORAGE_PREFIX + 'technicianId');
  localStorage.removeItem(ROLE_KEY);
  nativePrefRemove(USER_SESSION_KEY);
  nativePrefRemove(ROLE_KEY);
}

/**
 * Clear all authentication tokens from local storage and invalidate user cache
 */
export function clearStoredTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  clearCachedUserSession();

  // Clear from native mobile storage
  nativePrefRemove(TOKEN_KEY);
  nativePrefRemove(REFRESH_TOKEN_KEY);
  nativePrefRemove(USER_SESSION_KEY);
}

/**
 * Cache current user session locally for offline resilience and fast instant hydration
 */
export function cacheUserSession(user: User, role: UserRole = user.role || 'client', isMasterAdmin = false): void {
  if (typeof window === 'undefined') return;
  const adminRoles: UserRole[] = ['master_admin', 'super_admin', 'company_admin', 'service_manager', 'accounts', 'sales'];
  const isAdmin = isMasterAdmin || adminRoles.includes(role) || (user.role && adminRoles.includes(user.role as UserRole));
  const sessionData = {
    user,
    role,
    isMasterAdmin: Boolean(isAdmin),
    cachedAt: Date.now(),
  };
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionData));
  localStorage.setItem(STORAGE_PREFIX + 'currentUser', JSON.stringify(user));
  localStorage.setItem(STORAGE_PREFIX + 'role', role);
  localStorage.setItem(STORAGE_PREFIX + 'userId', user.id);
  localStorage.setItem(ROLE_KEY, role);

  if (user.clientId) {
    localStorage.setItem(STORAGE_PREFIX + 'clientId', user.clientId);
  }
  if (user.technicianId) {
    localStorage.setItem(STORAGE_PREFIX + 'technicianId', user.technicianId);
  }

  // Native mobile Preferences sync
  nativePrefSet(USER_SESSION_KEY, JSON.stringify(sessionData));
  nativePrefSet(ROLE_KEY, role);

  if (isAdmin) {
    localStorage.setItem(MASTER_AUTH_KEY, 'true');
    sessionStorage.setItem(MASTER_AUTH_KEY, 'true');
    // Set 30-day max lifetime for Admin session unless explicitly logged out
    const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem(MASTER_EXPIRY_KEY, String(expiry));
    sessionStorage.setItem(MASTER_EXPIRY_KEY, String(expiry));
    nativePrefSet(MASTER_AUTH_KEY, 'true');
    nativePrefSet(MASTER_EXPIRY_KEY, String(expiry));
  } else {
    localStorage.removeItem(MASTER_AUTH_KEY);
    sessionStorage.removeItem(MASTER_AUTH_KEY);
    localStorage.removeItem(MASTER_EXPIRY_KEY);
    sessionStorage.removeItem(MASTER_EXPIRY_KEY);
    nativePrefRemove(MASTER_AUTH_KEY);
    nativePrefRemove(MASTER_EXPIRY_KEY);
  }
}

/**
 * Retrieve cached user session from local storage
 */
export function getCachedUserSession(): { user: User | null; role: UserRole; isMasterAdmin: boolean } | null {
  if (typeof window === 'undefined') return null;
  try {
    let raw = localStorage.getItem(USER_SESSION_KEY) || sessionStorage.getItem(USER_SESSION_KEY);
    if (!raw) {
      const uRaw = localStorage.getItem(STORAGE_PREFIX + 'currentUser');
      if (uRaw) {
        const u = JSON.parse(uRaw);
        if (u && u.id) {
          const r = (localStorage.getItem(STORAGE_PREFIX + 'role') || u.role || 'client') as UserRole;
          const adminRolesLower = ['master_admin', 'super_admin', 'company_admin', 'service_manager', 'accounts', 'sales'];
          return {
            user: u,
            role: r,
            isMasterAdmin: adminRolesLower.includes(String(r).toLowerCase()) && isMasterAdminSessionValid(),
          };
        }
      }
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed && parsed.user) {
      const adminRolesLower = ['master_admin', 'super_admin', 'company_admin', 'service_manager', 'accounts', 'sales'];
      const r = (parsed.role || parsed.user.role || 'client') as UserRole;
      return {
        user: parsed.user,
        role: r,
        isMasterAdmin: Boolean(parsed.isMasterAdmin) || (adminRolesLower.includes(String(r).toLowerCase()) && isMasterAdminSessionValid()),
      };
    }
  } catch {
    // Non-blocking
  }
  return null;
}

/**
 * Check if the active session is genuinely authorized for Master Admin / Company Admin / Operations
 */
export function isMasterAdminSessionValid(): boolean {
  if (typeof window === 'undefined') return false;

  const isExplicitLogout = localStorage.getItem(EXPLICIT_LOGOUT_KEY) === 'true';
  if (isExplicitLogout) return false;

  // Check admin session expiry
  const expiryRaw = localStorage.getItem(MASTER_EXPIRY_KEY) || sessionStorage.getItem(MASTER_EXPIRY_KEY);
  if (expiryRaw) {
    const expiry = Number(expiryRaw);
    if (!isNaN(expiry) && Date.now() > expiry) {
      // Admin session lifetime expired
      clearMasterAdminFlag();
      return false;
    }
  }

  // 1. A valid token must exist and contain an authorized administrative claim
  const token = getStoredAccessToken() || getStoredRefreshToken();
  if (token) {
    const payload = decodeJwtPayload(token);
    if (payload) {
      const roleStr = String(payload.role || '').toUpperCase();
      const authorizedAdminRoles = [
        'MASTER_ADMIN',
        'SUPER_ADMIN',
        'COMPANY_ADMIN',
        'SERVICE_MANAGER',
        'ACCOUNTS',
        'SALES'
      ];
      if (authorizedAdminRoles.includes(roleStr)) {
        const flag =
          localStorage.getItem(MASTER_AUTH_KEY) === 'true' ||
          sessionStorage.getItem(MASTER_AUTH_KEY) === 'true';
        if (!flag) {
          localStorage.setItem(MASTER_AUTH_KEY, 'true');
          sessionStorage.setItem(MASTER_AUTH_KEY, 'true');
        }
        return true;
      }
    }
  }

  // 2. Fallback to cached session validation for offline resilience
  const cachedRaw = localStorage.getItem(USER_SESSION_KEY) || sessionStorage.getItem(USER_SESSION_KEY);
  if (cachedRaw) {
    try {
      const parsed = JSON.parse(cachedRaw);
      const r = String(parsed?.role || parsed?.user?.role || '').toLowerCase();
      const authorizedAdminRolesLower = [
        'master_admin',
        'super_admin',
        'company_admin',
        'service_manager',
        'accounts',
        'sales'
      ];
      if (authorizedAdminRolesLower.includes(r) || parsed?.isMasterAdmin) {
        const flag =
          localStorage.getItem(MASTER_AUTH_KEY) === 'true' ||
          sessionStorage.getItem(MASTER_AUTH_KEY) === 'true';
        if (flag) {
          return true;
        }
      }
    } catch {}
  }

  return false;
}

// Alias export for administrative session validation
export const isAdminSessionValid = isMasterAdminSessionValid;

/**
 * Clear master admin flags
 */
export function clearMasterAdminFlag(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MASTER_AUTH_KEY);
  sessionStorage.removeItem(MASTER_AUTH_KEY);
  localStorage.removeItem(MASTER_EXPIRY_KEY);
  sessionStorage.removeItem(MASTER_EXPIRY_KEY);
}

// Single-flight promise mutex to prevent concurrent refresh race conditions
let activeRefreshPromise: Promise<{
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}> | null = null;

/**
 * Transparently refresh tokens using the backend /auth/refresh endpoint
 * Protected by single-flight mutex to eliminate race conditions between
 * multiple simultaneous API calls or background lifecycle triggers.
 */
export async function refreshActiveSession(): Promise<{
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-version': '2.0.0',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (res.status === 401 || res.status === 403) {
        // Refresh token is genuinely revoked, expired, or invalid
        clearStoredTokens();
        clearMasterAdminFlag();
        return { success: false, error: 'Session has expired or was revoked' };
      }

      if (!res.ok) {
        // Server temporary error (5xx or other). DO NOT wipe tokens on server temporary outage!
        return { success: false, error: `HTTP ${res.status}: Failed to refresh session` };
      }

      const json = await res.json();
      if (json.success && json.data?.accessToken) {
        const newAccess = json.data.accessToken;
        const newRefresh = json.data.refreshToken || refreshToken;
        persistTokens(newAccess, newRefresh);
        return {
          success: true,
          accessToken: newAccess,
          refreshToken: newRefresh,
        };
      }

      return { success: false, error: json.message || 'Token refresh failed' };
    } catch (err: any) {
      // Network failure / offline. DO NOT clear tokens!
      return { success: false, error: err.message || 'Network error during token refresh' };
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

/**
 * Main Automatic Session Restoration Engine
 * Called on application startup and foreground return.
 * 
 * Verifies authenticated session, handles expired access tokens via transparent refresh,
 * validates user status & role with backend, and returns a verified session.
 */
export async function restoreAuthenticatedSession(): Promise<RestoredSessionResult> {
  let isExplicitLogout = typeof window !== 'undefined' && localStorage.getItem(EXPLICIT_LOGOUT_KEY) === 'true';
  if (!isExplicitLogout) {
    const nativeLogout = await nativePrefGet(EXPLICIT_LOGOUT_KEY);
    if (nativeLogout === 'true') {
      isExplicitLogout = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem(EXPLICIT_LOGOUT_KEY, 'true');
      }
    }
  }

  if (isExplicitLogout) {
    clearStoredTokens();
    clearMasterAdminFlag();
    return {
      status: 'no_session',
      user: null,
      role: 'client',
      accessToken: null,
      isMasterAdmin: false,
    };
  }

  let accessToken = getStoredAccessToken();
  let refreshToken = getStoredRefreshToken();

  // If tokens missing from synchronous web storage on native Android/iOS, recover from native Preferences
  if (!accessToken && !refreshToken) {
    const nativeAccess = await nativePrefGet(TOKEN_KEY);
    const nativeRefresh = await nativePrefGet(REFRESH_TOKEN_KEY);
    const nativeSession = await nativePrefGet(USER_SESSION_KEY);
    const nativeRole = await nativePrefGet(ROLE_KEY);
    if (nativeAccess || nativeRefresh || nativeSession) {
      if (nativeAccess) {
        accessToken = nativeAccess;
        if (typeof window !== 'undefined') {
          localStorage.setItem(TOKEN_KEY, nativeAccess);
          sessionStorage.setItem(TOKEN_KEY, nativeAccess);
        }
      }
      if (nativeRefresh) {
        refreshToken = nativeRefresh;
        if (typeof window !== 'undefined') {
          localStorage.setItem(REFRESH_TOKEN_KEY, nativeRefresh);
          sessionStorage.setItem(REFRESH_TOKEN_KEY, nativeRefresh);
        }
      }
      if (nativeSession && typeof window !== 'undefined') {
        localStorage.setItem(USER_SESSION_KEY, nativeSession);
      }
      if (nativeRole && typeof window !== 'undefined') {
        localStorage.setItem(ROLE_KEY, nativeRole);
      }
    }
  }

  // If both tokens are missing, user is not signed in
  if (!accessToken && !refreshToken) {
    return {
      status: 'no_session',
      user: null,
      role: 'client',
      accessToken: null,
      isMasterAdmin: false,
    };
  }

  // 1. If access token is expired or missing, attempt transparent refresh using refresh token
  if (!accessToken || isTokenExpired(accessToken, 15)) {
    if (refreshToken) {
      const refreshResult = await refreshActiveSession();
      if (refreshResult.success && refreshResult.accessToken) {
        accessToken = refreshResult.accessToken;
      } else if (
        refreshResult.error &&
        (refreshResult.error.includes('expired') || refreshResult.error.includes('revoked'))
      ) {
        // Refresh token genuinely revoked or expired on backend
        clearStoredTokens();
        clearMasterAdminFlag();
        return {
          status: 'expired',
          user: null,
          role: 'client',
          accessToken: null,
          isMasterAdmin: false,
          message: refreshResult.error,
        };
      } else {
        // Transient network error on resume / cold boot: DO NOT LOG USER OUT!
        const cached = getCachedUserSession();
        if (cached && cached.user) {
          return {
            status: 'offline',
            user: cached.user,
            role: cached.role,
            accessToken: accessToken || 'cached-token',
            isMasterAdmin: cached.isMasterAdmin && isMasterAdminSessionValid(),
            message: 'Operating in resilient offline cached session mode.',
          };
        }

        // If cached is empty, decode claims from refreshToken or accessToken
        const tokenToDecode = accessToken || refreshToken;
        if (tokenToDecode) {
          const claims = decodeJwtPayload(tokenToDecode);
          if (claims && claims.sub) {
            const rawClaimRole = (claims.role || '').toLowerCase();
            const adminRolesLower = ['master_admin', 'super_admin', 'company_admin', 'service_manager', 'accounts', 'sales'];
            const isClaimAdmin = adminRolesLower.includes(rawClaimRole);
            const fallbackRole: UserRole =
              rawClaimRole === 'technician'
                ? 'technician'
                : isClaimAdmin && isMasterAdminSessionValid()
                ? (rawClaimRole as UserRole)
                : 'client';

            const offlineUser: User = {
              id: claims.sub,
              name: claims.name || 'WEPSUN User',
              email: claims.email || '',
              phone: claims.phone || '',
              role: fallbackRole,
              companyId: claims.companyId || 'comp-1',
              clientId: claims.clientId || (fallbackRole === 'client' ? `client-${claims.sub.replace(/^usr-/, '')}` : undefined),
              technicianId: claims.technicianId || (fallbackRole === 'technician' ? `tech-${claims.sub.replace(/^usr-/, '')}` : undefined),
              isActive: true,
            };

            const isMasterAdminFlag = isClaimAdmin && isMasterAdminSessionValid();
            cacheUserSession(offlineUser, fallbackRole, isMasterAdminFlag);

            return {
              status: 'offline',
              user: offlineUser,
              role: fallbackRole,
              accessToken: accessToken || refreshToken,
              isMasterAdmin: isMasterAdminFlag,
              message: 'Operating in resilient offline cached session mode.',
            };
          }
        }
      }
    } else {
      // Access token expired and no refresh token
      clearStoredTokens();
      clearMasterAdminFlag();
      return {
        status: 'expired',
        user: null,
        role: 'client',
        accessToken: null,
        isMasterAdmin: false,
        message: 'Authentication session expired. Please sign in again.',
      };
    }
  }

  // 2. We now have a cryptographically unexpired access token. Validate against backend /auth/me
  try {
    const res = await apiService.getMe({ timeoutMs: 10000 });

    if (res && res.success && res.data?.user) {
      const serverUser = res.data.user;
      const rawRole = (serverUser.role || 'client').toLowerCase();
      let userRole: UserRole = 'client';
      const adminRolesLower = ['master_admin', 'super_admin', 'company_admin', 'service_manager', 'accounts', 'sales'];

      if (rawRole === 'technician') {
        userRole = 'technician';
      } else if (rawRole === 'client') {
        userRole = 'client';
      } else if (adminRolesLower.includes(rawRole)) {
        userRole = rawRole as UserRole;
      } else {
        userRole = 'client';
      }

      const rawAvatar = serverUser.avatarUrl || serverUser.avatar || '';
      const cachedAvatar = typeof window !== 'undefined' ? localStorage.getItem('wepsun_user_avatar_' + serverUser.id) : null;
      const resolvedAvatar = (isValidCustomAvatar(rawAvatar) ? rawAvatar : null) ||
        (isValidCustomAvatar(cachedAvatar) ? cachedAvatar : null) ||
        '';

      if (resolvedAvatar && typeof window !== 'undefined') {
        localStorage.setItem('wepsun_profile_saved_' + serverUser.id, 'true');
        localStorage.setItem('wepsun_user_avatar_' + serverUser.id, resolvedAvatar);
      }

      const verifiedUser: User = {
        id: serverUser.id,
        name: serverUser.name,
        email: serverUser.email,
        phone: serverUser.phone || '',
        role: userRole,
        companyId: serverUser.companyId || 'comp-1',
        branchId: serverUser.branchId || undefined,
        clientId: serverUser.clientId || (userRole === 'client' ? `client-${serverUser.id.replace(/^usr-/, '')}` : undefined),
        technicianId: serverUser.technicianId || (userRole === 'technician' ? `tech-${serverUser.id.replace(/^usr-/, '')}` : undefined),
        avatar: resolvedAvatar,
        isActive: serverUser.isActive ?? true,
      };

      const isMasterAdmin = adminRolesLower.includes(userRole);

      if (isMasterAdmin) {
        localStorage.setItem(MASTER_AUTH_KEY, 'true');
        sessionStorage.setItem(MASTER_AUTH_KEY, 'true');
        const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
        localStorage.setItem(MASTER_EXPIRY_KEY, String(expiry));
        sessionStorage.setItem(MASTER_EXPIRY_KEY, String(expiry));
        nativePrefSet(MASTER_AUTH_KEY, 'true');
        nativePrefSet(MASTER_EXPIRY_KEY, String(expiry));
      }

      // Update cached session
      cacheUserSession(verifiedUser, userRole, isMasterAdmin);

      return {
        status: 'restored',
        user: verifiedUser,
        role: userRole,
        accessToken,
        isMasterAdmin,
      };
    }

    // If server responded with an error (e.g. 401 Unauthorized / Token Revoked)
    if (res && res.status === 401) {
      // Try refresh one more time in case of clock skew
      if (refreshToken) {
        const refreshResult = await refreshActiveSession();
        if (refreshResult.success && refreshResult.accessToken) {
          const retryRes = await apiService.getMe({ timeoutMs: 8000 });
          if (retryRes && retryRes.success && retryRes.data?.user) {
            const serverUser = retryRes.data.user;
            const rawRole = (serverUser.role || 'client').toLowerCase();
            let userRole: UserRole = 'client';
            const adminRolesLower = ['master_admin', 'super_admin', 'company_admin', 'service_manager', 'accounts', 'sales'];

            if (rawRole === 'technician') {
              userRole = 'technician';
            } else if (rawRole === 'client') {
              userRole = 'client';
            } else if (adminRolesLower.includes(rawRole)) {
              userRole = rawRole as UserRole;
            } else {
              userRole = 'client';
            }

            const retryRawAvatar = serverUser.avatarUrl || serverUser.avatar || '';
            const retryCachedAvatar = typeof window !== 'undefined' ? localStorage.getItem('wepsun_user_avatar_' + serverUser.id) : null;
            const retryResolvedAvatar = (isValidCustomAvatar(retryRawAvatar) ? retryRawAvatar : null) ||
              (isValidCustomAvatar(retryCachedAvatar) ? retryCachedAvatar : null) ||
              '';

            if (retryResolvedAvatar && typeof window !== 'undefined') {
              localStorage.setItem('wepsun_profile_saved_' + serverUser.id, 'true');
              localStorage.setItem('wepsun_user_avatar_' + serverUser.id, retryResolvedAvatar);
            }

            const verifiedUser: User = {
              id: serverUser.id,
              name: serverUser.name,
              email: serverUser.email,
              phone: serverUser.phone || '',
              role: userRole,
              companyId: serverUser.companyId || 'comp-1',
              branchId: serverUser.branchId,
              clientId: serverUser.clientId || (userRole === 'client' ? `client-${serverUser.id.replace(/^usr-/, '')}` : undefined),
              technicianId: serverUser.technicianId || (userRole === 'technician' ? `tech-${serverUser.id.replace(/^usr-/, '')}` : undefined),
              avatar: retryResolvedAvatar,
              isActive: true,
            };
            const isMasterAdmin = adminRolesLower.includes(userRole);
            if (isMasterAdmin) {
              localStorage.setItem(MASTER_AUTH_KEY, 'true');
              sessionStorage.setItem(MASTER_AUTH_KEY, 'true');
              const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
              localStorage.setItem(MASTER_EXPIRY_KEY, String(expiry));
              sessionStorage.setItem(MASTER_EXPIRY_KEY, String(expiry));
              nativePrefSet(MASTER_AUTH_KEY, 'true');
              nativePrefSet(MASTER_EXPIRY_KEY, String(expiry));
            }
            cacheUserSession(verifiedUser, userRole, isMasterAdmin);

            return {
              status: 'restored',
              user: verifiedUser,
              role: userRole,
              accessToken: refreshResult.accessToken,
              isMasterAdmin,
            };
          }
        }
      }

      // Explicitly revoked on backend
      clearStoredTokens();
      clearMasterAdminFlag();
      return {
        status: 'revoked',
        user: null,
        role: 'client',
        accessToken: null,
        isMasterAdmin: false,
        message: 'Your session has ended or was revoked. Please sign in again.',
      };
    }

    // If account deactivated
    if (res && (res.code === 'ACCOUNT_DEACTIVATED' || res.message?.includes('deactivated'))) {
      clearStoredTokens();
      clearMasterAdminFlag();
      return {
        status: 'revoked',
        user: null,
        role: 'client',
        accessToken: null,
        isMasterAdmin: false,
        message: 'Your account has been deactivated. Please contact WEPSUN Support.',
      };
    }
  } catch (err: any) {
    // Network offline or backend unreachable
    console.warn('[SessionManager] /auth/me call unreachable:', err);
  }

  // 3. Resilient Offline Mode: If backend is temporarily unreachable
  const cached = getCachedUserSession();
  if (cached && cached.user) {
    return {
      status: 'offline',
      user: cached.user,
      role: cached.role,
      accessToken: accessToken || refreshToken || 'cached-token',
      isMasterAdmin: cached.isMasterAdmin && isMasterAdminSessionValid(),
      message: 'Running in offline cached session mode.',
    };
  }

  // If token is decodeable and we can extract user claims safely
  const tokenToDecode = accessToken || refreshToken;
  if (tokenToDecode) {
    const claims = decodeJwtPayload(tokenToDecode);
    if (claims && claims.sub) {
      const claimRole = (claims.role || '').toLowerCase();
      const adminRolesLower = ['master_admin', 'super_admin', 'company_admin', 'service_manager', 'accounts', 'sales'];
      const isClaimAdmin = adminRolesLower.includes(claimRole);
      const fallbackRole: UserRole =
        claimRole === 'technician'
          ? 'technician'
          : isClaimAdmin && isMasterAdminSessionValid()
          ? (claimRole as UserRole)
          : 'client';

      const offlineUser: User = {
        id: claims.sub,
        name: claims.name || 'WEPSUN User',
        email: claims.email || '',
        phone: claims.phone || '',
        role: fallbackRole,
        companyId: claims.companyId || 'comp-1',
        clientId: claims.clientId || (fallbackRole === 'client' ? `client-${claims.sub.replace(/^usr-/, '')}` : undefined),
        technicianId: claims.technicianId || (fallbackRole === 'technician' ? `tech-${claims.sub.replace(/^usr-/, '')}` : undefined),
        isActive: true,
      };

      const isMasterAdminFlag = isClaimAdmin && isMasterAdminSessionValid();
      cacheUserSession(offlineUser, fallbackRole, isMasterAdminFlag);

      return {
        status: 'offline',
        user: offlineUser,
        role: fallbackRole,
        accessToken: accessToken || refreshToken,
        isMasterAdmin: isMasterAdminFlag,
        message: 'Operating in offline mode with cached authorization.',
      };
    }
  }

  // If a refresh token is still present, keep session alive in offline state
  if (refreshToken && !isTokenExpired(refreshToken, 0)) {
    const fallbackUser: User = {
      id: 'usr-offline',
      name: 'WEPSUN User',
      email: '',
      phone: '',
      role: 'client',
      companyId: 'comp-1',
      clientId: 'client-offline',
      isActive: true,
    };
    return {
      status: 'offline',
      user: fallbackUser,
      role: 'client',
      accessToken: refreshToken,
      isMasterAdmin: false,
      message: 'Maintaining offline session while reconnecting to WEPSUN servers.',
    };
  }

  // Fallback to expired strictly when session has no valid refresh token or cached identity
  clearStoredTokens();
  clearMasterAdminFlag();
  return {
    status: 'expired',
    user: null,
    role: 'client',
    accessToken: null,
    isMasterAdmin: false,
  };
}

/**
 * Explicit Logout Procedure
 * Revokes refresh token on backend, clears local tokens, resets admin flags,
 * and sets explicit logout marker.
 */
export async function terminateSession(): Promise<void> {
  const refreshToken = getStoredRefreshToken();

  // Invalidate on backend
  try {
    if (refreshToken) {
      await apiService.logout(refreshToken).catch(() => {});
    }
  } catch {
    // Non-blocking
  }

  // Clear tokens
  clearStoredTokens();
  clearMasterAdminFlag();

  // Synchronize explicit logout & token removal to native mobile preferences
  nativePrefSet(EXPLICIT_LOGOUT_KEY, 'true');
  nativePrefRemove(TOKEN_KEY);
  nativePrefRemove(REFRESH_TOKEN_KEY);
  nativePrefRemove(USER_SESSION_KEY);
  nativePrefRemove(ROLE_KEY);
  nativePrefRemove(MASTER_AUTH_KEY);
  nativePrefRemove(MASTER_EXPIRY_KEY);

  if (typeof window !== 'undefined') {
    // Record explicit logout to prevent automatic restoration until next manual sign-in
    localStorage.setItem(EXPLICIT_LOGOUT_KEY, 'true');

    // Remove user session cache and identity keys without deleting shared database collections
    clearCachedUserSession();
    clearMasterAdminFlag();

    // Clean any session-specific tokens from sessionStorage
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_SESSION_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(MASTER_AUTH_KEY);
    sessionStorage.removeItem(MASTER_EXPIRY_KEY);
  }
}

/**
 * Register App Lifecycle Listeners
 * Handles Android/iOS backgrounding & foreground return, as well as web tab visibility change.
 */
export function registerSessionLifecycle(callbacks: {
  onSessionRevoked: (message?: string) => void;
  onSessionRefreshed: (tokens: { accessToken: string }) => void;
}): () => void {
  let isChecking = false;
  let lastCheckedTime = 0;

  const handleAppResumed = async () => {
    if (isChecking) return;
    if (typeof window === 'undefined') return;

    // Throttle checks to once every 5 seconds to prevent spam on rapid tab switching
    const now = Date.now();
    if (now - lastCheckedTime < 5000) return;
    lastCheckedTime = now;

    const token = getStoredAccessToken();
    const refreshToken = getStoredRefreshToken();

    // If no tokens or user explicitly logged out, skip check
    if (!token && !refreshToken) return;
    if (localStorage.getItem(EXPLICIT_LOGOUT_KEY) === 'true') return;

    isChecking = true;

    try {
      // Check if access token is expired or close to expiry (< 60s)
      if (isTokenExpired(token, 60)) {
        if (refreshToken) {
          const res = await refreshActiveSession();
          if (res.success && res.accessToken) {
            callbacks.onSessionRefreshed({ accessToken: res.accessToken });
          } else if (res.error?.includes('expired') || res.error?.includes('revoked')) {
            callbacks.onSessionRevoked(res.error);
          }
        }
      }
    } finally {
      isChecking = false;
    }
  };

  // 1. Web visibilitychange
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      handleAppResumed();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // 2. Capacitor native App lifecycle
  let appStateListener: any = null;
  if (Capacitor.isNativePlatform()) {
    try {
      appStateListener = CapApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          handleAppResumed();
        }
      });
    } catch {
      // Non-blocking
    }
  }

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (appStateListener && appStateListener.remove) {
      appStateListener.remove();
    }
  };
}
