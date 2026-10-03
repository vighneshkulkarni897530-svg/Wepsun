/**
 * WEPSUN Engineering Solution — Google Identity Services (GIS) & OAuth 2.0 Auth Service
 * Official Google One-Tap, Google Sign-In, Client-side JWT Decoders & OAuth 2.0 Integration
 */

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
  hd?: string; // Hosted domain (e.g., wepsun.com)
  role?: string;
}

const STORAGE_GOOGLE_CLIENT_ID_KEY = 'wepsun_custom_google_client_id';

/**
 * Get active Google OAuth 2.0 Client ID
 * Priority: 1. Runtime User Config (localStorage) -> 2. Vite Environment (.env) -> 3. Default fallback
 */
export function getGoogleClientId(): string {
  const customId = localStorage.getItem(STORAGE_GOOGLE_CLIENT_ID_KEY);
  if (customId && customId.trim().length > 0) {
    return customId.trim();
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
 * Decode base64 Google ID Token (JWT) on client side
 */
export function parseGoogleJwt(token: string): GoogleUserProfile | null {
  try {
    const base64Url = token.split('.')[1];
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

/**
 * Trigger official Google OAuth 2.0 Popup using GIS token client
 */
export async function triggerGoogleOAuth2Popup(
  onSuccess: (profile: GoogleUserProfile, accessToken: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    await loadGoogleGisScript();

    if (!window.google?.accounts?.oauth2) {
      throw new Error('Google Identity Services SDK is not ready.');
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
          try {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
              },
            });
            if (!userInfoRes.ok) {
              throw new Error('Failed to fetch Google profile from UserInfo endpoint.');
            }
            const profile = await userInfoRes.json();
            onSuccess(profile, tokenResponse.access_token);
          } catch (err: any) {
            onError(err);
          }
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
