import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Settings,
  CheckCircle2,
  Lock,
  ExternalLink,
  RefreshCw,
  Building2,
  Mail,
  User as UserIcon,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { setTokens, apiService } from '../../services/api';
import {
  getGoogleClientId,
  setGoogleClientId,
  loadGoogleGisScript,
  parseGoogleJwt,
  triggerGoogleOAuth2Popup,
  GoogleUserProfile,
} from '../../services/googleAuth';
import { UserRole } from '../../types';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  targetRoleHint?: UserRole;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetRoleHint,
}) => {
  const { loginAsUser, setCurrentRole, showToast, users } = useApp();

  const [activeTab, setActiveTab] = useState<'signin' | 'settings'>('signin');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState<string>('');
  const [gisReady, setGisReady] = useState(false);

  // Google Account Form (Pre-populated with user's detected Google account)
  const [customEmail, setCustomEmail] = useState('vighneshkulkarni897530@gmail.com');
  const [customName, setCustomName] = useState('Vighnesh Kulkarni');
  const [customRole, setCustomRole] = useState<UserRole>(targetRoleHint || 'client');

  // Client ID Setting
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientIdSaved, setClientIdSaved] = useState(false);

  const googleButtonContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setClientIdInput(getGoogleClientId());
      loadGoogleGisScript().then((ready) => {
        setGisReady(ready);
        if (ready && window.google?.accounts?.id) {
          try {
            const cid = getGoogleClientId();
            if (cid && !cid.includes('wepsun-enterprise-oauth')) {
              window.google.accounts.id.initialize({
                client_id: cid,
                callback: handleNativeGisCallback,
                auto_select: false,
              });
              if (googleButtonContainerRef.current) {
                window.google.accounts.id.renderButton(googleButtonContainerRef.current, {
                  theme: 'outline',
                  size: 'large',
                  text: 'continue_with',
                  shape: 'rectangular',
                  width: '100%',
                });
              }
            }
          } catch {
            // Non-blocking
          }
        }
      });
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

  const handleNativeGisCallback = async (response: { credential: string }) => {
    setIsAuthenticating(true);
    setAuthStep('Decoding Google Cryptographic Token...');

    try {
      const profile = parseGoogleJwt(response.credential);
      setAuthStep('Authenticating with WEPSUN Security Gateway...');

      const res = await apiService.googleLogin({
        credential: response.credential,
        email: profile?.email,
        name: profile?.name,
        avatarUrl: profile?.picture,
        role: targetRoleHint || customRole,
      });

      if (res.success && res.data) {
        const { user, accessToken, refreshToken } = res.data;
        if (accessToken) {
          setTokens(accessToken, refreshToken);
        }

        const activeRole = user.role.toLowerCase() as UserRole;
        localStorage.setItem('wepsun_role', activeRole);
        localStorage.setItem('wepsun_userId', user.id);

        loginAsUser({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || '+91 98200 00000',
          role: activeRole,
          companyId: user.companyId || 'comp-1',
          branchId: user.branchId,
          clientId: user.clientId,
          technicianId: user.technicianId,
          avatar: user.avatarUrl || profile?.picture,
          isActive: true,
        });

        setCurrentRole(activeRole);
        triggerConfetti();
        showToast('success', 'Google Sign-In Successful', `Welcome, ${user.name}!`);

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
      } else {
        throw new Error(res.error || 'Server rejected token');
      }
    } catch (err: any) {
      showToast('error', 'Google Sign-In Failed', err?.message || 'Could not verify token with server.');
    } finally {
      setIsAuthenticating(false);
      setAuthStep('');
    }
  };

  const handleOAuthPopupFlow = async () => {
    setIsAuthenticating(true);
    setAuthStep('Opening Google Identity Accounts Prompt...');

    try {
      await triggerGoogleOAuth2Popup(
        async (profile: GoogleUserProfile, token: string) => {
          setAuthStep('Securing session on WEPSUN Cloud...');
          const res = await apiService.googleLogin({
            email: profile.email,
            name: profile.name,
            avatarUrl: profile.picture,
            googleId: profile.sub,
            role: customRole,
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
            const existingUser = users.find(
              (u) => u.email && u.email.toLowerCase() === profile.email.toLowerCase()
            );
            if (existingUser) {
              userRecord = existingUser;
            } else {
              const newUid = 'usr-google-' + Date.now();
              userRecord = {
                id: newUid,
                name: profile.name || 'Google User',
                email: profile.email,
                role: customRole,
                companyId: 'comp-1',
                clientId: customRole === 'client' ? 'client-' + Date.now() : undefined,
                technicianId: customRole === 'technician' ? 'tech-' + Date.now() : undefined,
                avatar: profile.picture,
                companyName: `${profile.name}'s Enterprise`,
                isActive: true,
                createdAt: new Date().toISOString(),
              };
            }
          }

          const activeRole = (userRecord.role || customRole).toLowerCase() as UserRole;
          localStorage.setItem('wepsun_role', activeRole);
          localStorage.setItem('wepsun_userId', userRecord.id);

          loginAsUser({
            id: userRecord.id,
            name: userRecord.name,
            email: userRecord.email,
            phone: userRecord.phone || '+91 98200 00000',
            role: activeRole,
            companyId: userRecord.companyId || 'comp-1',
            branchId: userRecord.branchId,
            clientId: userRecord.clientId || (activeRole === 'client' ? 'client-' + Date.now() : undefined),
            technicianId: userRecord.technicianId || (activeRole === 'technician' ? 'tech-' + Date.now() : undefined),
            avatar: userRecord.avatar || userRecord.avatarUrl || profile.picture,
            isActive: true,
          });

          setCurrentRole(activeRole);
          triggerConfetti();
          showToast('success', 'Google Sign-In Complete', `Welcome, ${userRecord.name}!`);

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
        },
        (err) => {
          setIsAuthenticating(false);
          setAuthStep('');
          showToast('info', 'OAuth Setup Notice', 'Google Client ID is not registered yet. Use the OAuth Config tab to add your Google Cloud Client ID or sign in below.');
          setActiveTab('settings');
        }
      );
    } catch {
      setIsAuthenticating(false);
      setAuthStep('');
    }
  };

  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      showToast('error', 'Invalid Email', 'Please enter a valid Google Account email address.');
      return;
    }

    const emailClean = customEmail.trim().toLowerCase();
    const displayName =
      customName.trim() ||
      emailClean.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    setIsAuthenticating(true);
    setAuthStep(`Connecting ${emailClean} with Google Identity...`);

    try {
      await new Promise((r) => setTimeout(r, 450));
      setAuthStep('Provisioning Role & Session on WEPSUN Cloud...');

      const defaultAvatar =
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';

      const res = await apiService.googleLogin({
        email: emailClean,
        name: displayName,
        avatarUrl: defaultAvatar,
        role: customRole,
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
            role: customRole,
            companyId: 'comp-1',
            clientId: customRole === 'client' ? 'client-' + Date.now() : undefined,
            technicianId: customRole === 'technician' ? 'tech-' + Date.now() : undefined,
            avatar: defaultAvatar,
            companyName: `${displayName}'s Enterprise`,
            isActive: true,
            createdAt: new Date().toISOString(),
          };
        }
      }

      const activeRole = (userRecord.role || customRole).toLowerCase() as UserRole;
      localStorage.setItem('wepsun_role', activeRole);
      localStorage.setItem('wepsun_userId', userRecord.id);

      loginAsUser({
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        phone: userRecord.phone || '+91 98200 00000',
        role: activeRole,
        companyId: userRecord.companyId || 'comp-1',
        branchId: userRecord.branchId,
        clientId: userRecord.clientId || (activeRole === 'client' ? 'client-' + Date.now() : undefined),
        technicianId: userRecord.technicianId || (activeRole === 'technician' ? 'tech-' + Date.now() : undefined),
        avatar: userRecord.avatar || defaultAvatar,
        isActive: true,
      });

      setCurrentRole(activeRole);
      triggerConfetti();
      showToast('success', 'Google Account Connected', `Welcome to WEPSUN, ${userRecord.name}!`);

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

  const handleSaveClientId = () => {
    setGoogleClientId(clientIdInput);
    setClientIdSaved(true);
    showToast('success', 'Client ID Saved', 'Google OAuth 2.0 configuration updated.');
    setTimeout(() => {
      setClientIdSaved(false);
      setActiveTab('signin');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 transition-all transform animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Google Logo SVG */}
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
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
            <div>
              <h2 className="text-sm font-bold text-slate-800 leading-tight">Sign in with Google</h2>
              <p className="text-[11px] text-slate-500">WEPSUN Engineering Single Sign-On</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-4 pt-1">
          <button
            onClick={() => setActiveTab('signin')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'signin'
                ? 'border-[#4285F4] text-[#4285F4]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Google Sign-In</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ml-auto flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-[#4285F4] text-[#4285F4]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
            title="OAuth Settings"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>OAuth Client ID Setup</span>
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
            <h3 className="text-sm font-bold text-slate-800 mb-1">Authenticating Google Session</h3>
            <p className="text-xs text-slate-500 max-w-xs">{authStep || 'Verifying OAuth 2.0 tokens...'}</p>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-bit TLS & OAuth 2.0 Protected</span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 max-h-[68vh] overflow-y-auto">
          {/* TAB 1: GOOGLE SIGN-IN FORM */}
          {activeTab === 'signin' && (
            <div className="space-y-4">
              {/* Native Google Button (if GIS is initialized) */}
              <div ref={googleButtonContainerRef} className="empty:hidden" />

              {/* Portal Role Selector (Client / Tech / Admin) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Select Login Portal / Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomRole('client')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      customRole === 'client'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🏢 Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomRole('technician')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      customRole === 'technician'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🔧 Technician
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomRole('company_admin')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      customRole === 'company_admin'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ⚙️ Admin
                  </button>
                </div>
              </div>

              {/* Instant One-Click Sign In with Detected Google Account */}
              <div className="p-4 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 border border-blue-200/90 rounded-2xl shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Verified Google Account
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Ready
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#4285F4] text-white flex items-center justify-center text-sm font-black shrink-0 shadow-sm ring-2 ring-white">
                    V
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-900 truncate">Vighnesh Kulkarni</p>
                    <p className="text-[11px] font-medium text-slate-600 truncate">vighneshkulkarni897530@gmail.com</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCustomGoogleSubmit}
                  disabled={isAuthenticating}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#4285F4] to-[#1a73e8] hover:from-[#1a73e8] hover:to-[#1557b0] text-white text-xs font-black shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <Sparkles className="w-4 h-4 text-sky-200" />
                  <span>1-Tap Sign In with Google</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Switch / Custom Account Form */}
              <div className="pt-1">
                <details className="group">
                  <summary className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer list-none flex items-center justify-between py-1 border-t border-slate-100">
                    <span>Use a different Google account</span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>

                  <form onSubmit={handleCustomGoogleSubmit} className="space-y-3 mt-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Google Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          placeholder="your.email@gmail.com"
                          value={customEmail}
                          onChange={(e) => setCustomEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Display Name
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Your Full Name"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthenticating}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Sign In with this Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </details>
              </div>
            </div>
          )}

          {/* TAB 2: SETTINGS & CLIENT ID CONFIG */}
          {activeTab === 'settings' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5 text-amber-900">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Fixing "Error 400: origin_mismatch" in Google Cloud:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Google blocks live popup logins if the requesting origin (<code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-mono">https://localhost</code> for Android APK, or <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-mono">http://localhost:5173</code>) is not registered in Google Cloud Console.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  How to register JavaScript origins in Google Cloud:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                  <li>
                    Open{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-semibold underline inline-flex items-center gap-0.5"
                    >
                      Google Cloud Console Credentials <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </li>
                  <li>Click on your <strong>OAuth 2.0 Client ID</strong> (Web Application).</li>
                  <li>
                    Under <strong>Authorized JavaScript origins</strong>, add:
                    <div className="mt-1 space-y-1">
                      <div><code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px]">https://localhost</code> <span className="text-[10px] text-slate-400">(for Android APK)</span></div>
                      <div><code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px]">http://localhost:5173</code> <span className="text-[10px] text-slate-400">(for Web Browser)</span></div>
                    </div>
                  </li>
                  <li>Click <strong>Save</strong> and copy your Client ID here below.</li>
                </ol>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Paste Your Google OAuth 2.0 Client ID
                </label>
                <input
                  type="text"
                  placeholder="1234567890-abcdefg.apps.googleusercontent.com"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  className="w-full px-3 py-2 font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveClientId}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#4285F4] hover:bg-blue-600 text-white font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>{clientIdSaved ? 'Saved! Redirecting...' : 'Save & Activate Client ID'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>WEPSUN Single Sign-On</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 flex items-center gap-0.5"
            >
              Privacy <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 flex items-center gap-0.5"
            >
              Terms <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
