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

// Safe Native Preferences bridge for Android/iOS native app with web fallback.
// Uses Android SharedPreferences on Android, UserDefaults on iOS, and localStorage on Web.
async function nativePrefSet(key: string, value: string): Promise<void> {
  try {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      await Preferences.set({ key, value });
    }
  } catch {
    // Non-blocking fallback
  }
}

async function nativePrefGet(key: string): Promise<string | null> {
  try {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      const res = await Preferences.get({ key });
      return res.value || null;
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
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
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
  const sessionData = {
    user,
    role,
    isMasterAdmin,
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

  if (isMasterAdmin) {
    localStorage.setItem(MASTER_AUTH_KEY, 'true');
    sessionStorage.setItem(MASTER_AUTH_KEY, 'true');
    // Set 30-day max lifetime for Master Admin session unless explicitly logged out
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
          return {
            user: u,
            role: r,
            isMasterAdmin: r === 'master_admin' && isMasterAdminSessionValid(),
          };
        }
      }
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed && parsed.user) {
      return {
        user: parsed.user,
        role: parsed.role || 'client',
        isMasterAdmin: Boolean(parsed.isMasterAdmin),
      };
    }
  } catch {
    // Non-blocking
  }
  return null;
}

/**
 * Check if the active session is genuinely authorized for Master Admin / Company Admin
 */
export function isMasterAdminSessionValid(): boolean {
  if (typeof window === 'undefined') return false;

  const isExplicitLogout = localStorage.getItem(EXPLICIT_LOGOUT_KEY) === 'true';
  if (isExplicitLogout) return false;

  const flag =
    localStorage.getItem(MASTER_AUTH_KEY) === 'true' ||
    sessionStorage.getItem(MASTER_AUTH_KEY) === 'true';
  if (!flag) return false;

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

  // A valid token must exist and contain an authorized administrative claim
  const token = getStoredAccessToken() || getStoredRefreshToken();
  if (!token) {
    return false;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return false;
  }

  const roleStr = String(payload.role || '').toUpperCase();
  const isAdminRole = roleStr === 'MASTER_ADMIN' || roleStr === 'SUPER_ADMIN' || roleStr === 'COMPANY_ADMIN';
  if (!isAdminRole) {
    return false;
  }

  return true;
}

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
            const fallbackRole: UserRole =
              claims.role?.toLowerCase() === 'technician'
                ? 'technician'
                : claims.role?.toLowerCase() === 'master_admin' && isMasterAdminSessionValid()
                ? 'master_admin'
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

            cacheUserSession(offlineUser, fallbackRole, fallbackRole === 'master_admin');

            return {
              status: 'offline',
              user: offlineUser,
              role: fallbackRole,
              accessToken: accessToken || refreshToken,
              isMasterAdmin: fallbackRole === 'master_admin',
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

      if (rawRole === 'technician') {
        userRole = 'technician';
      } else if (rawRole === 'master_admin' || rawRole === 'company_admin' || rawRole === 'super_admin') {
        userRole = isMasterAdminSessionValid() ? 'master_admin' : 'client';
      } else {
        userRole = 'client';
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
        avatar: serverUser.avatarUrl || serverUser.avatar || '',
        isActive: serverUser.isActive ?? true,
      };

      const isMasterAdmin = userRole === 'master_admin' && isMasterAdminSessionValid();

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
            const userRole: UserRole =
              rawRole === 'technician'
                ? 'technician'
                : rawRole === 'master_admin' || rawRole === 'company_admin'
                ? isMasterAdminSessionValid() ? 'master_admin' : 'client'
                : 'client';

            const verifiedUser: User = {
              id: serverUser.id,
              name: serverUser.name,
              email: serverUser.email,
              phone: serverUser.phone || '',
              role: userRole,
              companyId: serverUser.companyId || 'comp-1',
              branchId: serverUser.branchId,
              clientId: serverUser.clientId,
              technicianId: serverUser.technicianId,
              avatar: serverUser.avatarUrl || serverUser.avatar || '',
              isActive: true,
            };
            const isMasterAdmin = userRole === 'master_admin' && isMasterAdminSessionValid();
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
      const fallbackRole: UserRole =
        claims.role?.toLowerCase() === 'technician'
          ? 'technician'
          : claims.role?.toLowerCase() === 'master_admin' && isMasterAdminSessionValid()
          ? 'master_admin'
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

      cacheUserSession(offlineUser, fallbackRole, fallbackRole === 'master_admin');

      return {
        status: 'offline',
        user: offlineUser,
        role: fallbackRole,
        accessToken: accessToken || refreshToken,
        isMasterAdmin: fallbackRole === 'master_admin',
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

    // Remove user session cache
    localStorage.removeItem(USER_SESSION_KEY);
    localStorage.removeItem(ROLE_KEY);

    // Remove storage-prefix user keys but preserve non-sensitive configs like custom API URL
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith(STORAGE_PREFIX) || key.startsWith('wepsun_')) &&
        key !== 'wepsun_custom_api_url' &&
        key !== 'wepsun_sound_enabled' &&
        key !== 'wepsun_installed' &&
        key !== EXPLICIT_LOGOUT_KEY
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (
        key &&
        (key.startsWith(STORAGE_PREFIX) || key.startsWith('wepsun_')) &&
        key !== 'wepsun_custom_api_url'
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
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

  const handleAppResumed = async () => {
    if (isChecking) return;
    if (typeof window === 'undefined') return;

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
