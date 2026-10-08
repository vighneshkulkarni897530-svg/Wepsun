import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { LoginPage } from './LoginPage';
import { GeometricBlueWLogo } from './WepsunLogo';
import { UserRole } from '../../types';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallbackHash?: string;
}

/**
 * Reusable Production Route Guard
 * Enforces cryptographic session verification before rendering any private view.
 * Prevents unauthorized access, flickering, and displays a branded loading screen
 * while verifying the session.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  allowedRoles,
  fallbackHash = 'login',
}) => {
  const { isAuthenticated, isAuthLoading, currentRole, showToast } = useApp();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `#${fallbackHash}`);
        window.location.hash = fallbackHash;
      }
    }
  }, [isAuthenticated, isAuthLoading, fallbackHash]);

  // Loading state while verifying token & session (avoids flickering or dashboard flashes)
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#071325] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <GeometricBlueWLogo className="w-16 h-13 animate-pulse" />
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-slate-300 tracking-wide">
              Verifying secure session...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // If unauthenticated, redirect to Sign In
  if (!isAuthenticated) {
    return <LoginPage isOpen={true} isModal={false} />;
  }

  // Role-Based Access Control (RBAC) Guard
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-600 mb-6">
            Your role (<span className="font-semibold">{currentRole.replace('_', ' ')}</span>) does not have authorization to view this section.
          </p>
          <button
            onClick={() => {
              const target =
                currentRole === 'client'
                  ? 'home'
                  : currentRole === 'technician'
                  ? 'jobs'
                  : 'dashboard';
              window.location.hash = target;
            }}
            className="w-full py-3 px-4 bg-[#0066FF] hover:bg-blue-600 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
          >
            Return to Authorized View
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
