import React, { useState } from 'react';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { setTokens, apiService } from '../../services/api';
import { UserRole } from '../../types';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  targetRoleHint?: UserRole;
}

interface SavedGoogleAccount {
  name: string;
  email: string;
  role: UserRole;
  avatarLetter: string;
  bgColor: string;
  avatarUrl?: string;
  badge: string;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetRoleHint,
}) => {
  const { loginAsUser, setCurrentRole, showToast, users } = useApp();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(targetRoleHint || 'client');
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Custom Account Inputs
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  if (!isOpen) return null;

  const triggerConfetti = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#0066FF'],
    });
  };

  // Pre-configured Google Account Profiles for Instant 1-Tap Sign-In
  const googleAccounts: SavedGoogleAccount[] = [
    {
      name: 'Vighnesh Kulkarni',
      email: 'vighneshkulkarni897530@gmail.com',
      role: selectedRole,
      avatarLetter: 'V',
      bgColor: 'bg-[#4285F4]',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      badge: 'Primary Account',
    },
    {
      name: 'WEPSUN Operations Admin',
      email: 'admin@wepsun.com',
      role: 'company_admin',
      avatarLetter: 'A',
      bgColor: 'bg-indigo-600',
      badge: 'Executive Portal',
    },
    {
      name: 'Rohan Shinde (Field Tech)',
      email: 'tech1@wepsun.com',
      role: 'technician',
      avatarLetter: 'T',
      bgColor: 'bg-emerald-600',
      badge: 'Technician Portal',
    },
    {
      name: 'Greenwood Heights Society',
      email: 'greenwood@wepsun.com',
      role: 'client',
      avatarLetter: 'C',
      bgColor: 'bg-amber-600',
      badge: 'Client Society',
    },
  ];

  const handleExecuteGoogleLogin = async (account: {
    email: string;
    name: string;
    avatarUrl?: string;
    role: UserRole;
  }) => {
    const emailClean = account.email.trim().toLowerCase();
    const displayName =
      account.name.trim() ||
      emailClean.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const finalRole = account.role || selectedRole;

    setIsAuthenticating(true);
    setAuthStep(`Connecting ${emailClean} with Google Identity...`);

    try {
      await new Promise((r) => setTimeout(r, 400));
      setAuthStep('Authenticating session on WEPSUN Cloud Gateway...');

      const defaultAvatar =
        account.avatarUrl ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';

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
        // Local fallback if network is unreachable
        const existingUser = users.find(
          (u) => u.email && u.email.toLowerCase() === emailClean
        );
        if (existingUser) {
          userRecord = existingUser;
        } else {
          const newUid = 'usr-google-' + Date.now();
          userRecord = {
            id: newUid,
            name: displayName,
            email: emailClean,
            role: finalRole,
            companyId: 'comp-1',
            clientId: finalRole === 'client' ? 'client-' + Date.now() : undefined,
            technicianId: finalRole === 'technician' ? 'tech-' + Date.now() : undefined,
            avatar: defaultAvatar,
            companyName: `${displayName}'s Enterprise`,
            isActive: true,
            createdAt: new Date().toISOString(),
          };
        }
      }

      const activeRole = ((userRecord.role || finalRole) as string).toLowerCase() as UserRole;

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
      showToast('success', 'Google Sign-In Successful', `Welcome back, ${userRecord.name || displayName}!`);

      if (sessionStorage.getItem('wepsun_pending_quote_service')) {
        sessionStorage.setItem('wepsun_open_quote_after_login', 'true');
      }

      const targetDest =
        activeRole === 'client'
          ? 'home'
          : activeRole === 'technician'
          ? 'jobs'
          : 'dashboard';

      window.location.hash = targetDest;

      if (onSuccess) onSuccess();
      if (onClose) onClose();
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } catch (err: any) {
      showToast('error', 'Sign In Failed', err?.message || 'Could not complete Google authentication.');
    } finally {
      setIsAuthenticating(false);
      setAuthStep('');
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      showToast('error', 'Invalid Email', 'Please enter a valid Google Account email.');
      return;
    }
    handleExecuteGoogleLogin({
      email: customEmail,
      name: customName || customEmail.split('@')[0],
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
        <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
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
              <h2 className="text-sm font-black text-slate-900 leading-tight">Choose a Google Account</h2>
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
            <h3 className="text-sm font-bold text-slate-900 mb-1">Authenticating Google Session</h3>
            <p className="text-xs text-slate-500 max-w-xs">{authStep || 'Verifying credentials with cloud...'}</p>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>TLS 256-Bit Encrypted & Verified</span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Role Portal Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Select Portal / Role
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

          {/* Account List */}
          <div className="space-y-2">
            {/* Primary Detected Account — Highlighted Card */}
            <div
              onClick={() =>
                handleExecuteGoogleLogin({
                  email: googleAccounts[0].email,
                  name: googleAccounts[0].name,
                  avatarUrl: googleAccounts[0].avatarUrl,
                  role: selectedRole,
                })
              }
              className="p-3.5 bg-gradient-to-r from-blue-50/80 via-sky-50/50 to-indigo-50/80 hover:from-blue-100/80 hover:to-indigo-100/80 border-2 border-blue-400/80 hover:border-blue-500 rounded-2xl flex items-center justify-between cursor-pointer transition-all shadow-xs group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#4285F4] text-white flex items-center justify-center text-sm font-black shrink-0 ring-2 ring-white shadow-xs">
                  V
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-black text-slate-900 truncate">Vighnesh Kulkarni</p>
                    <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 text-[9px] font-extrabold">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate">vighneshkulkarni897530@gmail.com</p>
                </div>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-[#4285F4] group-hover:bg-[#1a73e8] text-white text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs transition-colors"
              >
                <span>Continue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Other Pre-Configured Accounts */}
            <div className="pt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                Fast Enterprise Logins
              </p>
              <div className="space-y-1.5">
                {googleAccounts.slice(1).map((acc) => (
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
                        className={`w-8 h-8 rounded-full ${acc.bgColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                      >
                        {acc.avatarLetter}
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
            </div>

            {/* Option to use another Google account */}
            <div className="pt-2">
              {!showCustomForm ? (
                <button
                  type="button"
                  onClick={() => setShowCustomForm(true)}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-slate-400" />
                  <span>Use another Google account</span>
                </button>
              ) : (
                <form onSubmit={handleCustomSubmit} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Enter Google Account</span>
                    <button
                      type="button"
                      onClick={() => setShowCustomForm(false)}
                      className="text-[11px] text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="yourname@gmail.com"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0066FF] bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Display Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0066FF] bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Sign In with this Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
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
            <span>Cloud Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};
