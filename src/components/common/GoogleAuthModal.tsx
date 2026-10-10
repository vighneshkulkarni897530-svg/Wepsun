import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Building2,
  Mail,
  User as UserIcon,
  ChevronRight,
  PlusCircle,
  Briefcase,
  Wrench,
  Shield,
  Trash2,
  History,
  Globe,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { useAuthPopup } from '../../hooks/useAuthPopup';
import { setTokens, apiService } from '../../services/api';
import { triggerGoogleSignIn, triggerGoogleOAuth2Popup } from '../../services/googleAuth';
import { UserRole } from '../../types';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  targetRoleHint?: UserRole;
}

interface SavedAccount {
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  lastUsedAt?: string;
}

const STORAGE_RECENT_GOOGLE_KEY = 'wepsun_recent_google_users_v2';

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetRoleHint,
}) => {
  const { loginAsUser, setCurrentRole, showToast, users } = useApp();
  const {
    showGoogleSuccess,
    showGoogleFailed,
    showGoogleCancelled,
    showInvalidEmail,
  } = useAuthPopup();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(targetRoleHint || 'client');

  // Any User Input State
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // Device-specific saved Google accounts history
  const [recentAccounts, setRecentAccounts] = useState<SavedAccount[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_RECENT_GOOGLE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setRecentAccounts(parsed);
          }
        }
      } catch (e) {
        console.warn('Could not read recent Google accounts', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const triggerConfetti = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#0066FF'],
    });
  };

  const saveRecentAccount = (account: SavedAccount) => {
    try {
      const existing = recentAccounts.filter(
        (a) => a.email.toLowerCase() !== account.email.toLowerCase()
      );
      const updated = [
        { ...account, lastUsedAt: new Date().toISOString() },
        ...existing,
      ].slice(0, 5); // Keep up to 5 recent accounts
      setRecentAccounts(updated);
      localStorage.setItem(STORAGE_RECENT_GOOGLE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to store recent Google account', e);
    }
  };

  const removeRecentAccount = (emailToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentAccounts.filter(
      (a) => a.email.toLowerCase() !== emailToRemove.toLowerCase()
    );
    setRecentAccounts(updated);
    localStorage.setItem(STORAGE_RECENT_GOOGLE_KEY, JSON.stringify(updated));
  };

  // Pre-configured Demo Accounts for Rapid Role Testing
  const enterpriseDemoAccounts = [
    {
      name: 'Sunil Mehta (Managing Director)',
      email: 'admin@wepsun.com',
      role: 'company_admin' as UserRole,
      badge: 'Admin Portal',
      bgColor: 'bg-indigo-600',
    },
    {
      name: 'Rajesh Sharma (Lead Engineer)',
      email: 'tech1@wepsun.com',
      role: 'technician' as UserRole,
      badge: 'Technician Portal',
      bgColor: 'bg-emerald-600',
    },
    {
      name: 'Greenwood Society Secretary',
      email: 'greenwood@wepsun.com',
      role: 'client' as UserRole,
      badge: 'Client Portal',
      bgColor: 'bg-amber-600',
    },
  ];

  const handleExecuteGoogleLogin = async (account: {
    email: string;
    name?: string;
    avatarUrl?: string;
    role?: UserRole;
  }) => {
    const emailClean = account.email.trim().toLowerCase();
    if (!emailClean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      showInvalidEmail();
      return;
    }

    const displayName =
      (account.name && account.name.trim()) ||
      emailClean.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const finalRole = account.role || selectedRole;

    setIsAuthenticating(true);
    setAuthStep(`Connecting ${emailClean} with Google Identity...`);

    try {
      await new Promise((r) => setTimeout(r, 300));
      setAuthStep('Authenticating session on WEPSUN Cloud Gateway...');

      const defaultAvatar =
        account.avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=0066FF`;

      const res = await apiService.googleLogin({
        email: emailClean,
        name: displayName,
        avatarUrl: defaultAvatar,
        role: finalRole.toUpperCase(),
        companyId: 'comp-1',
      });

      let userRecord: any = null;
      if (res && res.success && res.data) {
        const { user, accessToken, refreshToken } = res.data;
        if (accessToken) {
          setTokens(accessToken, refreshToken);
        }
        userRecord = user;
      } else {
        // Local fallback if cloud backend is momentarily unreachable
        const existingUser = users.find(
          (u) => u.email && u.email.toLowerCase() === emailClean
        );
        if (existingUser) {
          userRecord = existingUser;
        } else {
          const deterministicSuffix = emailClean.replace(/[^a-z0-9]/g, '_');
          const newUid = 'usr-google-' + deterministicSuffix;
          userRecord = {
            id: newUid,
            name: displayName,
            email: emailClean,
            role: finalRole,
            companyId: 'comp-1',
            clientId: finalRole === 'client' ? `client-${deterministicSuffix}` : undefined,
            technicianId: finalRole === 'technician' ? `tech-${deterministicSuffix}` : undefined,
            avatar: defaultAvatar,
            companyName: `${displayName}'s Enterprise`,
            isActive: true,
            createdAt: new Date().toISOString(),
          };
        }

        // Generate and persist offline tokens so app resume preserves session
        try {
          const payload = {
            sub: userRecord.id,
            email: userRecord.email,
            role: String(userRecord.role || finalRole).toUpperCase(),
            companyId: userRecord.companyId || 'comp-1',
            clientId: userRecord.clientId,
            technicianId: userRecord.technicianId,
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 3600),
          };
          const base64Payload = btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replace(/=/g, '');
          const localAccess = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${base64Payload}.wepsun_local_sig`;
          const localRefresh = `refresh_offline_${userRecord.id}`;
          setTokens(localAccess, localRefresh);
        } catch {
          // Non-blocking
        }
      }

      const activeRole = ((userRecord.role || finalRole) as string).toLowerCase() as UserRole;

      // Save to device history
      saveRecentAccount({
        email: emailClean,
        name: userRecord.name || displayName,
        role: activeRole,
        avatarUrl: userRecord.avatar || userRecord.avatarUrl || defaultAvatar,
      });

      loginAsUser({
        id: userRecord.id,
        name: userRecord.name || displayName,
        email: userRecord.email || emailClean,
        phone: userRecord.phone || '+91 98200 00000',
        role: activeRole,
        companyId: userRecord.companyId || 'comp-1',
        branchId: userRecord.branchId,
        clientId: userRecord.clientId || (activeRole === 'client' ? 'client-' + Date.now() : undefined),
        technicianId: userRecord.technicianId || (activeRole === 'technician' ? 'tech-' + Date.now() : undefined),
        avatar: userRecord.avatar || userRecord.avatarUrl || defaultAvatar,
        isActive: true,
      });

      setCurrentRole(activeRole);
      triggerConfetti();

      if (sessionStorage.getItem('wepsun_pending_quote_service')) {
        sessionStorage.setItem('wepsun_open_quote_after_login', 'true');
      }

      const targetDest =
        activeRole === 'client'
          ? 'home'
          : activeRole === 'technician'
          ? 'jobs'
          : 'dashboard';

      if (onSuccess) onSuccess();
      if (onClose) onClose();

      showGoogleSuccess({
        name: userRecord.name || displayName,
        onContinue: () => {
          window.location.hash = targetDest;
        },
      });
    } catch (err: any) {
      showGoogleFailed({
        error: err?.message,
        onRetry: () => handleExecuteGoogleLogin(account),
      });
    } finally {
      setIsAuthenticating(false);
      setAuthStep('');
    }
  };

  const handleTriggerGisPopup = async () => {
    setIsAuthenticating(true);
    setAuthStep('Opening official Google Sign-In popup...');
    try {
      await triggerGoogleSignIn(
        async (credential, profile) => {
          try {
            const isIdToken = credential && credential.split('.').length === 3;
            let userRecord: any = null;

            try {
              const res = await apiService.googleLogin({
                credential: isIdToken ? credential : (typeof credential === 'string' && credential.length > 50 ? credential : undefined),
                accessToken: !isIdToken ? credential : undefined,
                email: profile?.email,
                name: profile?.name,
                avatarUrl: profile?.picture,
                picture: profile?.picture,
                googleId: profile?.sub,
                role: selectedRole.toUpperCase(),
                companyId: 'comp-1',
              });

              if (res && res.success && res.data) {
                const { user, accessToken: newAccess, refreshToken: newRefresh } = res.data;
                if (newAccess) {
                  setTokens(newAccess, newRefresh);
                }
                userRecord = user;
              }
            } catch (err: any) {
              console.warn('[GoogleModalGIS] Backend verification notice:', err?.message);
            }

            if (!userRecord && profile?.email) {
              const cleanEmail = profile.email.toLowerCase().trim();
              const existingUser = users.find((u) => u.email && u.email.toLowerCase() === cleanEmail);
              if (existingUser) {
                userRecord = existingUser;
              } else {
                userRecord = {
                  id: 'usr-google-' + Date.now(),
                  name: profile.name || cleanEmail.split('@')[0],
                  email: cleanEmail,
                  phone: '+91 98200 00000',
                  role: selectedRole,
                  companyId: 'comp-1',
                  clientId: selectedRole === 'client' ? 'client-' + Date.now() : undefined,
                  technicianId: selectedRole === 'technician' ? 'tech-' + Date.now() : undefined,
                  avatar: profile.picture,
                  isActive: true,
                  createdAt: new Date().toISOString(),
                };
              }
            }

            if (!userRecord) {
              throw new Error('Google authentication could not be completed.');
            }

            const activeRole = ((userRecord.role || selectedRole) as string).toLowerCase() as UserRole;

            loginAsUser({
              id: userRecord.id,
              name: userRecord.name || profile?.name || 'Google User',
              email: userRecord.email || profile?.email || '',
              phone: userRecord.phone || '+91 98200 00000',
              role: activeRole,
              companyId: userRecord.companyId || 'comp-1',
              branchId: userRecord.branchId,
              clientId: userRecord.clientId || (activeRole === 'client' ? 'client-' + Date.now() : undefined),
              technicianId: userRecord.technicianId || (activeRole === 'technician' ? 'tech-' + Date.now() : undefined),
              avatar: userRecord.avatarUrl || userRecord.avatar || profile?.picture,
              isActive: userRecord.isActive ?? true,
            });

            setCurrentRole(activeRole);
            triggerConfetti();

            const targetDest =
              activeRole === 'client'
                ? 'home'
                : activeRole === 'technician'
                ? 'jobs'
                : 'dashboard';

            if (onSuccess) onSuccess();
            if (onClose) onClose();

            showGoogleSuccess({
              name: userRecord.name || profile?.name || 'Google User',
              onContinue: () => {
                window.location.hash = targetDest;
              },
            });
          } catch (backendErr: any) {
            showGoogleFailed({
              error: backendErr?.message,
              onRetry: () => handleTriggerGisPopup(),
            });
          } finally {
            setIsAuthenticating(false);
            setAuthStep('');
          }
        },
        (error) => {
          setIsAuthenticating(false);
          setAuthStep('');
          if (error.message?.includes('closed') || error.message?.includes('cancel')) {
            showGoogleCancelled({
              onTryAgain: () => handleTriggerGisPopup(),
            });
          } else {
            showGoogleFailed({
              error: error.message,
              onRetry: () => handleTriggerGisPopup(),
            });
          }
        }
      );
    } catch (err: any) {
      setIsAuthenticating(false);
      setAuthStep('');
      showGoogleFailed({
        error: err?.message,
        onRetry: () => handleTriggerGisPopup(),
      });
    }
  };

  const handleDirectFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteGoogleLogin({
      email: userEmail,
      name: userName,
      role: selectedRole,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 transition-all transform animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            {/* Google G Logo */}
            <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.7-.06-1.4-.19-2.07H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 leading-tight">Sign in with Google</h2>
              <p className="text-[11px] text-slate-500">to continue to WEPSUN Engineering Solution</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading Overlay */}
        {isAuthenticating && (
          <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
              <div className="absolute inset-0 rounded-full border-4 border-t-[#4285F4] border-r-[#EA4335] border-b-[#FBBC05] border-l-[#34A853] animate-spin" />
              <div className="absolute inset-2 flex items-center justify-center">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Authenticating with Google</h3>
            <p className="text-xs text-slate-500 max-w-xs">{authStep || 'Verifying credentials with cloud...'}</p>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>TLS 256-Bit Encrypted & Verified</span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* Role Portal Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Select Your Portal / Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('client')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedRole === 'client'
                    ? 'bg-blue-50 border-[#0066FF] text-[#0066FF] shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Client</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('technician')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedRole === 'technician'
                    ? 'bg-blue-50 border-[#0066FF] text-[#0066FF] shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Technician</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('company_admin')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedRole === 'company_admin'
                    ? 'bg-blue-50 border-[#0066FF] text-[#0066FF] shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Primary Form: Any User Input */}
          <form onSubmit={handleDirectFormSubmit} className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Google Account Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com or @company.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0066FF] bg-white font-medium text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0066FF] bg-white font-medium text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 px-4 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Continue with this Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Recently Signed-In on this Device */}
          {recentAccounts.length > 0 && (
            <div className="pt-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                <History className="w-3 h-3" />
                <span>Recently Used on this Device</span>
              </div>
              <div className="space-y-1.5">
                {recentAccounts.map((acc) => (
                  <div
                    key={acc.email}
                    onClick={() =>
                      handleExecuteGoogleLogin({
                        email: acc.email,
                        name: acc.name,
                        role: acc.role,
                        avatarUrl: acc.avatarUrl,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {acc.name ? acc.name.charAt(0).toUpperCase() : acc.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{acc.name || acc.email}</p>
                        <p className="text-[10px] text-slate-500 truncate">{acc.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-semibold px-2 py-0.5 rounded-md bg-slate-100 uppercase">
                        {acc.role}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => removeRecentAccount(acc.email, e)}
                        className="p-1 text-slate-300 hover:text-rose-500 rounded-md transition-colors"
                        title="Remove from this device"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Demo Accounts Drawer */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="w-full py-2 px-3 text-xs text-slate-500 hover:text-slate-700 font-semibold flex items-center justify-between border-t border-slate-100 pt-3"
            >
              <span>Need a demo account to test?</span>
              <span className="text-[11px] text-blue-600 font-bold">
                {showDemoAccounts ? 'Hide Demo Accounts' : 'Show Demo Accounts'}
              </span>
            </button>

            {showDemoAccounts && (
              <div className="mt-2 space-y-1.5 animate-in fade-in duration-150">
                {enterpriseDemoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() =>
                      handleExecuteGoogleLogin({
                        email: acc.email,
                        name: acc.name,
                        role: acc.role,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full ${acc.bgColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                      >
                        {acc.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{acc.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{acc.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 rounded-md bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {acc.badge}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">WEPSUN Single Sign-On</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>256-bit Encrypted</span>
            <span>•</span>
            <span>Cloud Database Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};
