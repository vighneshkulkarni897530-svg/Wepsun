/**
 * WEPSUN Native Mobile & Desktop Device Bridge
 * Integrates Capacitor native APIs with graceful web browser fallbacks.
 */

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Network, ConnectionStatus } from '@capacitor/network';

export const isNativePlatform = Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform(); // 'web' | 'android' | 'ios'

export async function setSplashStatusBar(): Promise<void> {
  if (isNativePlatform) {
    try {
      await StatusBar.hide();
    } catch {
      try {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
        await StatusBar.setOverlaysWebView({ overlay: true });
      } catch {
        // Non-blocking
      }
    }
  }
}

export async function setAppStatusBar(): Promise<void> {
  if (isNativePlatform) {
    try {
      await StatusBar.show();
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0b2545' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch {
      // Non-blocking
    }
  }
}

export async function initNativeApp(): Promise<void> {
  if (isNativePlatform) {
    try {
      await setSplashStatusBar();
    } catch (e) {
      console.warn('StatusBar init fallback:', e);
    }

    try {
      // Auto-hide native splash screen smoothly after app hydration
      await SplashScreen.hide();
    } catch (e) {
      console.warn('SplashScreen hide fallback:', e);
    }

    try {
      // Android hardware back button handler: prevent logout bypass and handle root dashboards
      CapApp.addListener('backButton', ({ canGoBack }) => {
        const hash = (typeof window !== 'undefined' ? window.location.hash : '')
          .toLowerCase()
          .replace('#', '')
          .split('?')[0];

        const isAuthEntry =
          !hash ||
          hash === 'login' ||
          hash === 'signin' ||
          hash === 'signup' ||
          hash === 'register' ||
          hash === 'landing' ||
          hash.startsWith('login-');

        const isRootDashboard = hash === 'home' || hash === 'jobs' || hash === 'dashboard';

        if (isAuthEntry || isRootDashboard || !canGoBack) {
          // On login/landing screen or top-level dashboard, minimize/exit app cleanly
          CapApp.exitApp();
        } else {
          // On nested views or modals, navigate backwards within the application
          window.history.back();
        }
      });
    } catch (e) {
      console.warn('Back button listener fallback:', e);
    }
  }

  // Register Progressive Web App (PWA) Service Worker for offline & installability
  if ('serviceWorker' in navigator && !isNativePlatform) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[WEPSUN PWA] Service Worker active with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[WEPSUN PWA] Service Worker registration skipped:', err);
        });
    });
  }
}

/**
 * Trigger subtle native vibration/haptic feedback on mobile devices
 */
export async function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
  if (isNativePlatform) {
    try {
      const impact =
        style === 'heavy'
          ? ImpactStyle.Heavy
          : style === 'medium'
          ? ImpactStyle.Medium
          : ImpactStyle.Light;
      await Haptics.impact({ style: impact });
    } catch {
      // Non-blocking fallback
    }
  } else if ('vibrate' in navigator) {
    try {
      navigator.vibrate(style === 'heavy' ? 40 : style === 'medium' ? 25 : 15);
    } catch {
      // Ignore
    }
  }
}

/**
 * Check if the device is currently online
 */
export async function getNetworkStatus(): Promise<{ connected: boolean; connectionType: string }> {
  try {
    const status: ConnectionStatus = await Network.getStatus();
    return {
      connected: status.connected,
      connectionType: status.connectionType,
    };
  } catch {
    return {
      connected: typeof navigator !== 'undefined' ? navigator.onLine : true,
      connectionType: 'unknown',
    };
  }
}

/**
 * Subscribe to network connection state changes (online/offline)
 */
export function subscribeNetworkStatus(callback: (status: { connected: boolean; connectionType: string }) => void) {
  if (isNativePlatform) {
    const handle = Network.addListener('networkStatusChange', (status) => {
      callback({
        connected: status.connected,
        connectionType: status.connectionType,
      });
    });
    return () => {
      handle.then((h) => h.remove());
    };
  } else if (typeof window !== 'undefined') {
    const handleOnline = () => callback({ connected: true, connectionType: 'wifi' });
    const handleOffline = () => callback({ connected: false, connectionType: 'none' });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
  return () => {};
}

