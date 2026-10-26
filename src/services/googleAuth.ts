/**
 * WEPSUN Engineering Solution — Google Identity Services (GIS) & OAuth 2.0 Auth Service
 * Official Google One-Tap, Google Sign-In, Client-side JWT Decoders & OAuth 2.0 Integration
 */

import { apiService, setTokens } from './api';
import type { UserRole } from '../types';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebaseAuth';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            itp_support?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: (notification?: (notification: any) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: string | number;
              locale?: string;
            }
          ) => void;
          disableAutoSelect: () => void;
          revoke: (hint: string, done: () => void) => void;
        };
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (tokenResponse: { access_token?: string; error?: string; [key: string]: any }) => void;
            error_callback?: (err: any) => void;
            prompt?: string;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
          initCodeClient?: (config: any) => any;
          hasGrantedAllScopes?: (tokenResponse: any, ...scopes: string[]) => boolean;
        };
      };
    };
  }
}

export interface GoogleUserProfile {
  sub: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email_verified?: boolean;
  hd?: string; // Hosted domain
}

const STORAGE_GOOGLE_CLIENT_ID_KEY = 'wepsun_custom_google_client_id';

/**
 * Get active Google OAuth 2.0 Client ID
 * Priority: 1. Runtime User Config (localStorage) -> 2. Vite Environment (.env) -> 3. Default enterprise fallback
 */
export function getGoogleClientId(): string {
  if (typeof window !== 'undefined') {
    const customId = localStorage.getItem(STORAGE_GOOGLE_CLIENT_ID_KEY);
    if (customId && customId.trim().length > 0) {
      return customId.trim();
    }
  }
  return (
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '168301316891-6e6br98qti8u58frtj02l2k09m8r2sfe.apps.googleusercontent.com'
  );
}

/**
 * Save custom Google OAuth Client ID for enterprise environments
 */
export function setGoogleClientId(clientId: string): void {
  if (!clientId || clientId.trim() === '') {
    localStorage.removeItem(STORAGE_GOOGLE_CLIENT_ID_KEY);
  } else {
    localStorage.setItem(STORAGE_GOOGLE_CLIENT_ID_KEY, clientId.trim());
  }
}

/**
 * Decode base64 Google ID Token (JWT) on client side for immediate UI feedback.
 * Note: Server MUST still independently cryptographically verify the token.
 */
export function parseGoogleJwt(token: string): GoogleUserProfile | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse Google JWT token payload', e);
    return null;
  }
}

/**
 * Check if official Google Identity Services library is loaded
 */
export function isGoogleGisAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.google?.accounts?.id);
}

/**
 * Dynamically load Google Identity Services script if not yet present
 */
export async function loadGoogleGisScript(): Promise<boolean> {
  if (isGoogleGisAvailable()) return true;

  return new Promise((resolve) => {
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export interface SavedGoogleAccount {
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  lastUsedAt?: string;
}

export const STORAGE_RECENT_GOOGLE_KEY = 'wepsun_recent_google_users_v2';

/**
 * Retrieve list of Google accounts previously signed in on this device
 */
export function getRecentGoogleAccounts(): SavedGoogleAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_RECENT_GOOGLE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Non-blocking
  }

  // Initial developer & client suggestions
  return [
    {
      email: 'vighneshkulkarni897530@gmail.com',
      name: 'Vighnesh Kulkarni',
      role: 'client',
      avatarUrl: 'https://lh3.googleusercontent.com/a/default-user',
    },
  ];
}

/**
 * Store Google account on this device for 1-click subsequent sign-ins
 */
export function saveRecentGoogleAccount(account: SavedGoogleAccount): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getRecentGoogleAccounts().filter(
      (a) => a.email.toLowerCase() !== account.email.toLowerCase()
    );
    const updated = [
      { ...account, lastUsedAt: new Date().toISOString() },
      ...existing,
    ].slice(0, 5);
    localStorage.setItem(STORAGE_RECENT_GOOGLE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to store recent Google account', e);
  }
}

/**
 * Remove saved Google account from device
 */
export function removeRecentGoogleAccount(emailToRemove: string): SavedGoogleAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const updated = getRecentGoogleAccounts().filter(
      (a) => a.email.toLowerCase() !== emailToRemove.toLowerCase()
    );
    localStorage.setItem(STORAGE_RECENT_GOOGLE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Primary Google Sign-In Flow:
 * Initializes Google Identity Services (GIS), triggers Google Account Selection,
 * obtains cryptographically signed ID Token (JWT credential), and passes to callback.
 */
export async function triggerGoogleSignIn(
  onSuccess: (credential: string, profile: GoogleUserProfile | null) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    await loadGoogleGisScript();

    const clientId = getGoogleClientId();
    if (!clientId) {
      throw new Error('Google Client ID is not configured.');
    }

    if (window.google?.accounts?.oauth2) {
      // Use GIS Token Client for popup account chooser
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            onError(new Error(tokenResponse.error));
            return;
          }

          if (tokenResponse.access_token) {
            let profile: GoogleUserProfile | null = null;
            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                  Authorization: `Bearer ${tokenResponse.access_token}`,
                },
              });
              if (userInfoRes.ok) {
                profile = await userInfoRes.json();
              }
            } catch {
              // Non-blocking
            }

            if (!profile) {
              try {
                const tokenInfoRes = await fetch(
                  `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(tokenResponse.access_token)}`
                );
                if (tokenInfoRes.ok) {
                  const info = await tokenInfoRes.json();
                  profile = {
                    sub: info.sub || info.user_id || '',
                    email: info.email || '',
                    name: info.email ? info.email.split('@')[0] : 'Google User',
                    email_verified: info.verified_email === true || info.email_verified === 'true',
                  };
                }
              } catch {
                // Non-blocking
              }
            }

            onSuccess(tokenResponse.access_token, profile);
          }
        },
        error_callback: (err: any) => {
          onError(new Error(err?.message || 'Google Sign-In popup was closed or encountered an error.'));
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            const profile = parseGoogleJwt(response.credential);
            onSuccess(response.credential, profile);
          } else {
            onError(new Error('Google did not return an authentication credential.'));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.prompt((notification) => {
        if (notification && notification.isNotDisplayed && notification.isNotDisplayed()) {
          console.warn('[GoogleGIS] Prompt not displayed:', notification.getNotDisplayedReason());
        }
      });
      return;
    }

    throw new Error('Google Identity Services SDK is not available.');
  } catch (err: any) {
    onError(err);
  }
}

/**
 * Trigger official Google OAuth 2.0 Popup using GIS token client
 */
export async function triggerGoogleOAuth2Popup(
  onSuccess: (profile: GoogleUserProfile | null, token: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  // 1. Attempt Firebase Google Sign-In first (uses pre-configured Firebase authDomain to avoid Google Cloud Console origin_mismatch errors on Vercel)
  if (auth) {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      if (cred?.user) {
        const idToken = await cred.user.getIdToken();
        const profile: GoogleUserProfile = {
          sub: cred.user.uid,
          email: cred.user.email || '',
          name: cred.user.displayName || cred.user.email?.split('@')[0] || 'Google User',
          picture: cred.user.photoURL || undefined,
          email_verified: cred.user.emailVerified,
        };
        onSuccess(profile, idToken);
        return;
      }
    } catch (fbErr: any) {
      console.warn('[Firebase Google Auth] Notice:', fbErr?.code || fbErr?.message);
      if (fbErr?.code === 'auth/popup-closed-by-user') {
        onError(new Error('Google Sign-In popup was closed.'));
        return;
      }
    }
  }

  // 2. Direct GIS Token Client
  try {
    const isLoaded = await loadGoogleGisScript();

    if (!isLoaded || !window.google?.accounts?.oauth2) {
      throw new Error('Google Identity Services SDK is not ready or blocked by browser.');
    }

    const clientId = getGoogleClientId();

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'email profile openid',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          onError(new Error(tokenResponse.error));
          return;
        }

        if (tokenResponse.access_token) {
          let profile: GoogleUserProfile | null = null;
          try {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
              },
            });
            if (userInfoRes.ok) {
              profile = await userInfoRes.json();
            }
          } catch {
            // Non-blocking fallback to tokeninfo
          }

          if (!profile) {
            try {
              const tokenInfoRes = await fetch(
                `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(tokenResponse.access_token)}`
              );
              if (tokenInfoRes.ok) {
                const info = await tokenInfoRes.json();
                profile = {
                  sub: info.sub || info.user_id || '',
                  email: info.email || '',
                  name: info.email ? info.email.split('@')[0] : 'Google User',
                  email_verified: info.verified_email === true || info.email_verified === 'true',
                };
              }
            } catch {
              // Non-blocking
            }
          }

          // Always return token even if profile lookup failed on client (server verifies)
          onSuccess(profile, tokenResponse.access_token);
        }
      },
      error_callback: (err: any) => {
        onError(new Error(err?.message || 'Google OAuth Popup was closed or encountered an error.'));
      },
    });

    tokenClient.requestAccessToken({ prompt: 'select_account' });
  } catch (err: any) {
    onError(err);
  }
}

export interface GoogleOAuthOptions {
  role?: UserRole;
  isNativeApp?: boolean;
  returnUrl?: string;
  customRedirectUri?: string;
}

/**
 * Build standard Google OAuth 2.0 Account Selection URL.
 * Works uniformly across Web (desktop & mobile) and Android Custom Tabs.
 * Passes structured state { isNativeApp, returnUrl, role, nonce } to ensure Render gateway
 * routes credentials back to the correct client without origin_mismatch errors.
 */
export function buildGoogleOAuthUrl(options: GoogleOAuthOptions = {}): string {
  const clientId = getGoogleClientId();
  const redirectUri = options.customRedirectUri || 'https://wepsun.onrender.com/api/auth/google/callback';
  const nonce = 'wepsun_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

  const statePayload = {
    isNativeApp: options.isNativeApp ?? (typeof window !== 'undefined' ? Boolean((window as any).Capacitor?.isNativePlatform?.()) : false),
    returnUrl: options.returnUrl ?? (typeof window !== 'undefined' ? window.location.origin : ''),
    role: options.role ?? 'client',
    nonce,
  };

  const state = encodeURIComponent(JSON.stringify(statePayload));
  const scopes = encodeURIComponent('openid email profile');

  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token%20id_token&scope=${scopes}&prompt=select_account&nonce=${nonce}&state=${state}`;
}

/**
 * Open official Google Account Chooser in native In-App Chrome Custom Tab on Android/iOS
 */
export async function openNativeGoogleOAuth(options?: GoogleOAuthOptions | string): Promise<void> {
  const { Browser } = await import('@capacitor/browser');
  const opts: GoogleOAuthOptions = typeof options === 'string' ? { customRedirectUri: options } : options || {};
  const googleAuthUrl = buildGoogleOAuthUrl({
    ...opts,
    isNativeApp: true,
  });

  await Browser.open({
    url: googleAuthUrl,
    windowName: '_self',
    presentationStyle: 'popover',
  });
}

/**
 * Initiate full-page Google OAuth redirect (used for mobile web to prevent popup blocking)
 */
export function triggerDirectGoogleOAuth(options: GoogleOAuthOptions = {}): void {
  if (typeof window !== 'undefined') {
    window.location.href = buildGoogleOAuthUrl(options);
  }
}


/**
 * Unified OAuth callback query string / deep link handler.
 * Processes tokens from Android app deep links (wepsun://auth-callback) and Web popup postMessages.
 */
export async function handleGoogleAuthCallback(
  queryOrUrl: string,
  targetRole: UserRole = 'client'
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    let queryString = queryOrUrl;
    if (queryString.includes('?')) {
      queryString = queryString.split('?')[1] || '';
    } else if (queryString.includes('#')) {
      queryString = queryString.split('#')[1] || '';
    }

    const params = new URLSearchParams(queryString);
    const accessToken = params.get('access_token');
    const idToken = params.get('id_token') || params.get('credential');
    const error = params.get('error') || params.get('error_description');

    if (error) {
      throw new Error(`Google authorization error: ${error}`);
    }

    if (!accessToken && !idToken) {
      throw new Error('No authentication token found in callback.');
    }

    let profile: GoogleUserProfile | null = null;
    if (idToken) {
      profile = parseGoogleJwt(idToken);
    }

    if (!profile && accessToken) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userInfoRes.ok) {
          profile = await userInfoRes.json();
        }
      } catch {
        // Fallback
      }
    }

    const isIdToken = Boolean(idToken && idToken.split('.').length === 3);
    const res = await apiService.googleLogin({
      credential: isIdToken ? idToken : undefined,
      accessToken: accessToken || (!isIdToken ? idToken : undefined) || undefined,
      email: profile?.email,
      name: profile?.name,
      avatarUrl: profile?.picture,
      picture: profile?.picture,
      googleId: profile?.sub,
      role: targetRole.toUpperCase(),
      companyId: 'comp-1',
    });

    if (res && res.success && res.data) {
      const { user, accessToken: newAccess, refreshToken: newRefresh } = res.data;
      if (newAccess) {
        setTokens(newAccess, newRefresh);
      }
      if (user?.email) {
        saveRecentGoogleAccount({
          email: user.email,
          name: user.name || profile?.name || 'Google User',
          role: targetRole,
          avatarUrl: user.avatarUrl || profile?.picture,
        });
      }
      return { success: true, user };
    }

    // Fallback if backend response wrapped
    if (profile?.email) {
      const user = {
        id: 'usr-g-' + (profile.sub || Date.now()),
        name: profile.name || profile.email.split('@')[0],
        email: profile.email,
        phone: '+91 98200 00000',
        role: targetRole,
        companyId: 'comp-1',
        clientId: targetRole === 'client' ? `client-${profile.sub || Date.now()}` : undefined,
        avatar: profile.picture,
        isActive: true,
      };
      saveRecentGoogleAccount({
        email: profile.email,
        name: profile.name,
        role: targetRole,
        avatarUrl: profile.picture,
      });
      return { success: true, user };
    }

    throw new Error(res?.message || 'Google account could not be authenticated.');
  } catch (err: any) {
    console.warn('[GoogleAuth] Callback processing error:', err);
    return { success: false, error: err?.message || 'Authentication failed' };
  }
}

