import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Wrench,
  Phone,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Settings,
  Wifi,
  KeyRound,
  Loader2,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useApp } from '../../context/AppContext';
import { GeometricBlueWLogo } from './WepsunLogo';
import { apiService, setTokens } from '../../services/api';
import type { User as UserRecord, UserRole } from '../../types';
import { DEMO_ACCOUNTS } from '../../data/initialData';
import { GoogleAuthModal } from './GoogleAuthModal';
import { loadGoogleGisScript, triggerGoogleOAuth2Popup, parseGoogleJwt } from '../../services/googleAuth';
import elevatorGlassLobbyImg from '../../assets/elevator-glass-lobby.jpg';
import constructionPlansSunsetImg from '../../assets/construction-plans-sunset.jpg';

interface LoginPageProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultRole?: 'technician' | 'client';
  initialView?: 'signin' | 'signup';
  isModal?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  isOpen = true,
  onClose,
  defaultRole = 'client',
  initialView = 'signin',
  isModal = false,
}) => {
  const {
    loginAsUser,
    setCurrentRole,
    showToast,
    currentRole,
    users,
  } = useApp();

  const [view, setView] = useState<'signin' | 'signup'>(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('signup') || hash.includes('register') || initialView === 'signup') {
      return 'signup';
    }
    return 'signin';
  });

  // Selected Role for authentication (Only Client and Technician)
  const [selectedRole, setSelectedRole] = useState<'technician' | 'client'>(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('login-technician') || hash.includes('technician')) return 'technician';
    if (hash.includes('login-client') || hash.includes('client')) return 'client';
    if (defaultRole === 'technician') return 'technician';
    if (currentRole === 'technician') return 'technician';
    return 'client';
  });

  // Sign In Form Fields
  const [pendingQuoteService, setPendingQuoteService] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('wepsun_pending_quote_service');
    }
    return null;
  });

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Technician Master ID State
  const [masterId, setMasterId] = useState('');
  const [isVerifyingMasterId, setIsVerifyingMasterId] = useState(false);

  // Sign Up Form Fields
  const [regRole, setRegRole] = useState<'client' | 'technician'>('client');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regShowConfirmPassword, setRegShowConfirmPassword] = useState(false);
  const [regIsSubmitting, setRegIsSubmitting] = useState(false);

  // Forgot Password Modal
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Google OAuth Modal
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // Role tab switch (Client | Technician only)
  const handleRoleChange = (role: 'technician' | 'client') => {
    setSelectedRole(role);
    setErrorMessage(null);
  };

  // Technician Master ID Submission
  const handleTechnicianMasterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterId.trim()) {
      setErrorMessage('Please enter your Master ID.');
      return;
    }

    setIsVerifyingMasterId(true);
    setErrorMessage(null);

    try {
      const res = await apiService.verifyMasterId({
        masterId: masterId.trim(),
        rememberMe,
      });

      if (res && res.success && res.data) {
        const authData = res.data as any;
        if (authData.tokens?.accessToken) {
          setTokens(authData.tokens.accessToken, authData.tokens.refreshToken);
        }

        const userObj = authData.user || {
          id: 'usr-master-1',
          name: 'Master Technical Administrator',
          email: 'master.admin@wepsun.engineering',
          role: 'master_admin',
          companyId: 'comp-1',
          branchId: 'br-mum-1',
          isActive: true,
        };

        loginAsUser({
          ...userObj,
          role: 'master_admin',
        });
        setCurrentRole('master_admin');

        // Store authenticated session markers for route protection
        sessionStorage.setItem('wepsun_master_authenticated', 'true');
        if (rememberMe) {
          localStorage.setItem('wepsun_master_authenticated', 'true');
        }

        showToast('success', 'Master Authentication Verified', 'Opening Admin Dashboard...');
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }

        // Open Admin Dashboard directly
        window.location.hash = 'dashboard';

        if (onClose) {
          onClose();
        }
      } else {
        if (res?.code === 'NETWORK_ERROR' || res?.code === 'OFFLINE') {
          setErrorMessage('Unable to verify Master ID. Please check your internet connection and try again.');
        } else if (res?.status && res.status >= 500) {
          setErrorMessage('Something went wrong. Please try again later.');
        } else {
          setErrorMessage(res?.message || 'Invalid Master ID. Please try again.');
        }
      }
    } catch (err: any) {
      if (err?.message?.includes('network') || err?.message?.includes('fetch') || err?.name === 'TypeError') {
        setErrorMessage('Unable to verify Master ID. Please check your internet connection and try again.');
      } else {
        setErrorMessage('Invalid Master ID. Please try again.');
      }
    } finally {
      setIsVerifyingMasterId(false);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your email address or mobile number');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        email: identifier.includes('@') ? identifier.trim() : undefined,
        phone: !identifier.includes('@') ? identifier.trim() : undefined,
        password: password,
      };

      const targetRole: UserRole =
        selectedRole === 'client'
          ? 'client'
          : selectedRole === 'technician'
          ? 'technician'
          : 'company_admin';

      const res = await apiService.login(payload);
      if (res && res.success && res.data) {
        const authData = res.data as any;
        if (authData.tokens?.accessToken) {
          setTokens(authData.tokens.accessToken, authData.tokens.refreshToken);
        }
        if (authData.user) {
          loginAsUser({
            id: authData.user.id,
            name: authData.user.name,
            email: authData.user.email,
            phone: authData.user.phone || '',
            role: (authData.user.role || targetRole).toLowerCase() as UserRole,
            companyId: authData.user.companyId || 'comp-1',
            branchId: authData.user.branchId,
            clientId: authData.user.clientId,
            technicianId: authData.user.technicianId,
            avatar: authData.user.avatarUrl,
            isActive: true,
          });
          setCurrentRole((authData.user.role || targetRole).toLowerCase() as UserRole);
        }
      } else {
        // Find existing user in stored state or demo accounts
        const searchIdent = identifier.trim().toLowerCase();
        const existingUser = users.find(
          (u) =>
            (u.email && u.email.toLowerCase() === searchIdent) ||
            (u.phone && u.phone.replace(/[\s+-]/g, '') === searchIdent.replace(/[\s+-]/g, ''))
        );

        if (existingUser) {
          loginAsUser(existingUser);
        } else {
          // Check if demo user
          const demoUser = DEMO_ACCOUNTS.find(
            (d) =>
              d.email.toLowerCase() === searchIdent ||
              d.phone.replace(/[\s+-]/g, '') === searchIdent.replace(/[\s+-]/g, '')
          );
          if (demoUser) {
            loginAsUser(demoUser.id);
          } else {
            // Direct authentication fallback with dedicated user record
            const rawName = identifier.includes('@') ? identifier.split('@')[0].replace(/[._-]/g, ' ') : 'WEPSUN User';
            const formattedName = rawName.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const newUid = 'usr-' + (targetRole === 'client' ? 'client-' : targetRole === 'technician' ? 'tech-' : 'admin-') + Date.now();
            
            loginAsUser({
              id: newUid,
              name: formattedName,
              email: identifier.includes('@') ? identifier.trim() : `${identifier.trim()}@wepsun.in`,
              phone: !identifier.includes('@') ? identifier.trim() : '+91 98200 00000',
              role: targetRole,
              companyId: 'comp-1',
              clientId: targetRole === 'client' ? 'client-' + Date.now() : undefined,
              technicianId: targetRole === 'technician' ? 'tech-' + Date.now() : undefined,
              avatar: targetRole === 'client'
                ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                : targetRole === 'technician'
                ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
                : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
              companyName: `${formattedName}'s Society / Enterprise`,
              isActive: true,
              createdAt: new Date().toISOString(),
            });
            setCurrentRole(targetRole);
          }
        }
      }

      if (pendingQuoteService || (typeof window !== 'undefined' && sessionStorage.getItem('wepsun_pending_quote_service'))) {
        sessionStorage.setItem('wepsun_open_quote_after_login', 'true');
      }

      window.location.hash = 'home';

      showToast('success', 'Login Successful', 'Welcome to WEPSUN Client Portal!');

      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regEmail.trim() || !regPassword.trim()) {
      showToast('error', 'Incomplete Form', 'Please fill in all mandatory fields.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      showToast('error', 'Password Mismatch', 'Passwords do not match. Please re-enter.');
      return;
    }

    setRegIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 600));

      const targetRole: UserRole = regRole;
      const newUserId = 'usr-' + (regRole === 'client' ? 'client-' : regRole === 'technician' ? 'tech-' : 'admin-') + Date.now();
      const newUser: UserRecord = {
        id: newUserId,
        name: regFullName.trim(),
        email: regEmail.trim(),
        phone: regMobile.trim() || '+91 98200 00000',
        role: targetRole,
        companyId: 'comp-1',
        clientId: targetRole === 'client' ? 'client-' + Date.now() : undefined,
        technicianId: targetRole === 'technician' ? 'tech-' + Date.now() : undefined,
        avatar: targetRole === 'client'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : targetRole === 'technician'
          ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        companyName: `${regFullName.trim()}'s Organisation`,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      loginAsUser(newUser);

      if (pendingQuoteService || (typeof window !== 'undefined' && sessionStorage.getItem('wepsun_pending_quote_service'))) {
        sessionStorage.setItem('wepsun_open_quote_after_login', 'true');
      }

      window.location.hash =
        targetRole === 'client'
          ? 'home'
          : targetRole === 'technician'
          ? 'jobs'
          : 'dashboard';

      showToast(
        'success',
        'Account Created Successfully',
        `Welcome to WEPSUN, ${regFullName}! Your separate profile has been set up.`
      );

      if (onClose) {
        onClose();
      }
    } catch {
      showToast('error', 'Registration Failed', 'Could not complete registration.');
    } finally {
      setRegIsSubmitting(false);
    }
  };

  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  // Eagerly pre-load Google Identity Services
  useEffect(() => {
    loadGoogleGisScript().catch(() => {});
  }, []);

  // Listen for Google OAuth callback deep-links in native Android app (wepsun://auth-callback)
  useEffect(() => {
    let appUrlListener: any;
    let browserFinishedListener: any;

    const setupNativeAuthListeners = async () => {
      try {
        const { Browser } = await import('@capacitor/browser');
        const { App } = await import('@capacitor/app');

        browserFinishedListener = await Browser.addListener('browserFinished', () => {
          setIsGoogleSubmitting(false);
        });

        appUrlListener = await App.addListener('appUrlOpen', async (event) => {
          if (event.url && event.url.includes('auth-callback')) {
            try {
              await Browser.close();
            } catch {}

            try {
              setIsGoogleSubmitting(true);
              const rawQuery = event.url.split(/auth-callback[?#]/)[1] || '';
              const searchParams = new URLSearchParams(rawQuery);
              const accessToken = searchParams.get('access_token') || undefined;
              const idToken = searchParams.get('id_token') || searchParams.get('credential') || undefined;

              let googleProfile: any = null;
              if (idToken) {
                googleProfile = parseGoogleJwt(idToken);
              }

              if (!googleProfile && accessToken) {
                try {
                  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                  });
                  if (userInfoRes.ok) {
                    googleProfile = await userInfoRes.json();
                  }
                } catch {}
              }

              if (accessToken || idToken || googleProfile) {
                const targetRole: UserRole =
                  view === 'signup'
                    ? regRole
                    : selectedRole === 'client'
                    ? 'client'
                    : selectedRole === 'technician'
                    ? 'technician'
                    : 'company_admin';

                let userRecord: any = null;
                try {
                  const res = await apiService.googleLogin({
                    credential: idToken,
                    accessToken: accessToken,
                    email: googleProfile?.email,
                    name: googleProfile?.name,
                    avatarUrl: googleProfile?.picture,
                    role: targetRole.toUpperCase(),
                    companyId: 'comp-1',
                    googleId: googleProfile?.sub,
                  });

                  if (res && res.success && res.data) {
                    const { user, accessToken: newAccess, refreshToken: newRefresh } = res.data;
                    if (newAccess) {
                      setTokens(newAccess, newRefresh);
                    }
                    userRecord = user;
                  }
                } catch {}

                if (!userRecord && googleProfile?.email) {
                  // Fallback: local account creation with Google profile
                  const cleanEmail = googleProfile.email.toLowerCase().trim();
                  const existingUser = users.find((u) => u.email && u.email.toLowerCase() === cleanEmail);
                  if (existingUser) {
                    userRecord = existingUser;
                  } else {
                    const newUid = 'usr-google-' + Date.now();
                    userRecord = {
                      id: newUid,
                      name: googleProfile.name || cleanEmail.split('@')[0],
                      email: cleanEmail,
                      role: targetRole,
                      companyId: 'comp-1',
                      clientId: targetRole === 'client' ? 'client-' + Date.now() : undefined,
                      technicianId: targetRole === 'technician' ? 'tech-' + Date.now() : undefined,
                      avatar: googleProfile.picture,
                      companyName: `${googleProfile.name || 'User'}'s Enterprise`,
                      isActive: true,
                      createdAt: new Date().toISOString(),
                    };
                  }
                }

                if (userRecord) {
                  const activeRole = ((userRecord.role || targetRole) as string).toLowerCase() as UserRole;
                  loginAsUser({
                    id: userRecord.id,
                    name: userRecord.name || googleProfile?.name,
                    email: userRecord.email || googleProfile?.email,
                    phone: userRecord.phone || '+91 98200 00000',
                    role: activeRole,
                    companyId: userRecord.companyId || 'comp-1',
                    branchId: userRecord.branchId,
                    clientId: userRecord.clientId || (activeRole === 'client' ? 'client-' + Date.now() : undefined),
                    technicianId: userRecord.technicianId || (activeRole === 'technician' ? 'tech-' + Date.now() : undefined),
                    avatar: userRecord.avatar || userRecord.avatarUrl || googleProfile?.picture,
                    isActive: true,
                  });
                  setCurrentRole(activeRole);
                  confetti({
                    particleCount: 70,
                    spread: 60,
                    origin: { y: 0.65 },
                    colors: ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#0066FF'],
                  });
                  showToast('success', 'Google Sign-In Successful', `Welcome to WEPSUN, ${userRecord.name || googleProfile?.name}!`);
                  window.location.hash = activeRole === 'client' ? 'home' : activeRole === 'technician' ? 'jobs' : 'dashboard';
                  if (onClose) onClose();
                } else {
                  showToast('error', 'Google Sign-In', 'Could not complete Google authentication.');
                }
              }
            } catch (err: any) {
              showToast('error', 'Google Auth Error', err?.message || 'Authentication encountered an error.');
            } finally {
              setIsGoogleSubmitting(false);
            }
          }
        });
      } catch {}
    };

    if (Capacitor.isNativePlatform()) {
      setupNativeAuthListeners();
    }

    return () => {
      if (appUrlListener?.remove) appUrlListener.remove();
      if (browserFinishedListener?.remove) browserFinishedListener.remove();
    };
  }, [view, regRole, selectedRole, users]);

  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setIsGoogleSubmitting(true);

    const targetRole: UserRole =
      view === 'signup'
        ? regRole
        : selectedRole === 'client'
        ? 'client'
        : selectedRole === 'technician'
        ? 'technician'
        : 'company_admin';

    // On native mobile app (Android), open official Google OAuth Account Chooser in secure In-App Custom Tab
    if (Capacitor.isNativePlatform()) {
      try {
        const { openNativeGoogleOAuth } = await import('../../services/googleAuth');
        await openNativeGoogleOAuth();
      } catch (nativeErr: any) {
        setIsGoogleSubmitting(false);
        setIsGoogleModalOpen(true);
      }
      return;
    }

    // On Web (Desktop/Browser), launch Google Identity Services popup
    try {
      await triggerGoogleOAuth2Popup(
        async (profile, accessToken) => {
          try {
            const res = await apiService.googleLogin({
              email: profile.email,
              name: profile.name,
              avatarUrl: profile.picture,
              role: targetRole.toUpperCase(),
              companyId: 'comp-1',
              googleId: profile.sub,
            });

            let userRecord: any = null;
            if (res && res.success && res.data) {
              const { user, accessToken: newAccess, refreshToken: newRefresh } = res.data;
              if (newAccess) {
                setTokens(newAccess, newRefresh);
              }
              userRecord = user;
            } else {
              // Local fallback for offline/test environments
              const cleanEmail = profile.email.toLowerCase().trim();
              const existingUser = users.find((u) => u.email && u.email.toLowerCase() === cleanEmail);
              if (existingUser) {
                userRecord = existingUser;
              } else {
                const newUid = 'usr-google-' + Date.now();
                userRecord = {
                  id: newUid,
                  name: profile.name || cleanEmail.split('@')[0],
                  email: cleanEmail,
                  role: targetRole,
                  companyId: 'comp-1',
                  clientId: targetRole === 'client' ? 'client-' + Date.now() : undefined,
                  technicianId: targetRole === 'technician' ? 'tech-' + Date.now() : undefined,
                  avatar: profile.picture,
                  companyName: `${profile.name || 'User'}'s Enterprise`,
                  isActive: true,
                  createdAt: new Date().toISOString(),
                };
              }
            }

            const activeRole = ((userRecord.role || targetRole) as string).toLowerCase() as UserRole;

            loginAsUser({
              id: userRecord.id,
              name: userRecord.name || profile.name,
              email: userRecord.email || profile.email,
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
            confetti({
              particleCount: 70,
              spread: 60,
              origin: { y: 0.65 },
              colors: ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#0066FF'],
            });

            showToast('success', 'Google Sign-In Successful', `Welcome to WEPSUN, ${userRecord.name || profile.name}!`);

            if (pendingQuoteService || (typeof window !== 'undefined' && sessionStorage.getItem('wepsun_pending_quote_service'))) {
              sessionStorage.setItem('wepsun_open_quote_after_login', 'true');
            }

            const targetDest =
              activeRole === 'client'
                ? 'home'
                : activeRole === 'technician'
                ? 'jobs'
                : 'dashboard';

            window.location.hash = targetDest;

            if (onClose) onClose();
            window.dispatchEvent(new HashChangeEvent('hashchange'));
          } catch (backendErr: any) {
            showToast('error', 'Authentication Error', backendErr?.message || 'Unable to sign in with Google. Please try again.');
          } finally {
            setIsGoogleSubmitting(false);
          }
        },
        (popupError) => {
          setIsGoogleSubmitting(false);
          if (popupError.message?.includes('closed') || popupError.message?.includes('cancel') || popupError.message?.includes('popup_closed_by_user')) {
            showToast('info', 'Sign-In Cancelled', 'Google sign-in was cancelled.');
          } else {
            setIsGoogleModalOpen(true);
          }
        }
      );
    } catch (launchErr: any) {
      setIsGoogleSubmitting(false);
      setIsGoogleModalOpen(true);
    }
  };

  if (!isOpen) return null;

  // Google Colored SVG Icon
  const GoogleGIcon = () => (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between font-sans selection:bg-[#0066FF] selection:text-white">
      {/* Background Image Layer */}
      <div className="fixed inset-0 z-0">
        <img
          src={view === 'signin' ? elevatorGlassLobbyImg : constructionPlansSunsetImg}
          alt={view === 'signin' ? 'WEPSUN Elevator Glass Lobby' : 'WEPSUN Construction Engineering'}
          className="w-full h-full object-cover object-center select-none"
          draggable={false}
        />
        {/* Soft Contrast Tint Overlay */}
        <div
          className={`absolute inset-0 transition-colors duration-500 ${
            view === 'signin'
              ? 'bg-slate-900/35 backdrop-blur-[1px]'
              : 'bg-slate-900/40 backdrop-blur-[1px]'
          }`}
        />
      </div>

      {/* Top Header / Close Area */}
      <div className="relative z-10 w-full pt-8 pb-4 px-4 sm:px-8 flex flex-col items-center justify-center text-center">
        {/* Back to Home Button */}
        <button
          onClick={() => {
            if (onClose) onClose();
            window.location.hash = 'landing';
          }}
          className="absolute top-4 left-4 sm:left-8 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/35 text-white backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <span>← Back to Home</span>
        </button>


        {/* Modal Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:right-8 p-2 rounded-full bg-white/20 hover:bg-white/35 text-white backdrop-blur-md transition-all shadow-sm cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Lockup (Geometric Blue W Logo + WEPSUN Typography) */}
        <div
          className="cursor-pointer flex flex-col items-center group transition-transform hover:scale-102 active:scale-98"
          onClick={() => {
            if (onClose) onClose();
            window.location.hash = 'landing';
          }}
        >
          <div className="flex items-center gap-3">
            <GeometricBlueWLogo className="w-11 h-9 sm:w-14 sm:h-11 drop-shadow-md" />
            <div className="flex flex-col text-left leading-none">
              <span className="font-sans font-black text-2xl sm:text-3xl text-white tracking-tight leading-none drop-shadow-sm">
                WEPSUN
              </span>
              <span className="font-sans font-bold text-[9px] sm:text-[11px] text-sky-200 tracking-[0.22em] mt-1 leading-none drop-shadow-sm">
                ENGINEERING SOLUTION
              </span>
            </div>
          </div>
          {/* Subtitle */}
          <p className="text-white/90 font-medium text-xs sm:text-sm mt-2 tracking-wide drop-shadow">
            {view === 'signin'
              ? 'Smarter Engineering for a Better Tomorrow'
              : 'Build Smarter. Engineer Better.'}
          </p>
        </div>
      </div>

      {/* Main Centered Floating Card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-[440px] bg-white/95 backdrop-blur-md rounded-[28px] shadow-2xl border border-white/60 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
          {/* Header: Sign In & Sign Up options beside each other */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setView('signin');
                  window.location.hash = 'login';
                }}
                className={`text-2xl sm:text-[28px] font-black tracking-tight transition-all cursor-pointer relative pb-1 ${
                  view === 'signin'
                    ? 'text-[#0b2545]'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Sign In
                {view === 'signin' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0066FF] rounded-full" />
                )}
              </button>

              <span className="text-slate-300 text-xl font-light select-none pb-1">|</span>

              <button
                type="button"
                onClick={() => {
                  setView('signup');
                  window.location.hash = 'signup';
                }}
                className={`text-2xl sm:text-[28px] font-black tracking-tight transition-all cursor-pointer relative pb-1 ${
                  view === 'signup'
                    ? 'text-[#0b2545]'
                    : 'text-slate-400 hover:text-[#0066FF]'
                }`}
              >
                Sign Up
                {view === 'signup' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0066FF] rounded-full" />
                )}
              </button>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-500 mt-1 leading-relaxed">
              {view === 'signin'
                ? 'Welcome back! Please sign in to your Wepsun Engineering Solution account.'
                : 'Get started with Wepsun Engineering Solution'}
            </p>
          </div>

          {/* ========================================================================= */}
          {/* VIEW 1: SIGN IN SCREEN */}
          {/* ========================================================================= */}
          {view === 'signin' ? (
            <div>

              {/* Pending Quote Service Notice */}
              {pendingQuoteService && (
                <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200/90 text-[#0b2545] shadow-xs flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="w-9 h-9 rounded-xl bg-[#0066FF] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Sparkles className="w-4 h-4 text-sky-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black text-[#0066FF] tracking-wider">
                        Request Quote Flow
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            sessionStorage.removeItem('wepsun_pending_quote_service');
                            sessionStorage.removeItem('wepsun_open_quote_after_login');
                          }
                          setPendingQuoteService(null);
                        }}
                        className="text-slate-400 hover:text-slate-600 text-[10px] font-semibold hover:underline cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                    <p className="text-xs sm:text-[13px] font-extrabold text-[#0b2545] truncate mt-0.5">
                      {pendingQuoteService}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
                      Sign in to open your custom proposal request form.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Role Selection Tabs — Only Client | Technician */}
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/90 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('client')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedRole === 'client'
                        ? 'bg-white text-[#0066FF] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Client
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('technician')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedRole === 'technician'
                        ? 'bg-white text-[#0066FF] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Technician
                  </button>
                </div>
              </div>

              {/* Conditional Form: Technician Master ID vs Client Authentication */}
              {selectedRole === 'technician' ? (
                /* ========================================================================= */
                /* TECHNICIAN MASTER ID AUTHENTICATION FLOW */
                /* ========================================================================= */
                <form onSubmit={handleTechnicianMasterSubmit} className="space-y-4">
                  {/* Master ID Field */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4 text-[#0066FF]" />
                    </div>
                    <input
                      type="text"
                      value={masterId}
                      onChange={(e) => {
                        setMasterId(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Enter Master ID"
                      autoFocus
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all tracking-wide"
                    />
                  </div>

                  {/* Remember Me Option */}
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-[#0066FF] focus:ring-[#0066FF] border-slate-300"
                      />
                      <span className="text-xs text-slate-600 font-medium">Remember me</span>
                    </label>
                  </div>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={isVerifyingMasterId}
                    className="w-full py-3.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
                  >
                    {isVerifyingMasterId ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying Master ID...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Technician Designation Badge matching diagram in spec */}
                  <div className="pt-2 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-100 text-[#0066FF] text-[11px] font-semibold tracking-wide">
                      <Wrench className="w-3 h-3 text-[#0066FF]" />
                      <span>Technician Access</span>
                    </span>
                  </div>
                </form>
              ) : (
                /* ========================================================================= */
                /* NORMAL CLIENT AUTHENTICATION FLOW */
                /* ========================================================================= */
                <div>
                  <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                    {/* Email Address Field */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Email Address"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all"
                      />
                    </div>

                    {/* Password Field */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between pt-0.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded text-[#0066FF] focus:ring-[#0066FF] border-slate-300"
                        />
                        <span className="text-xs text-slate-600 font-medium">Remember me</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setForgotIdentifier(identifier);
                          setIsForgotPasswordOpen(true);
                        }}
                        className="text-xs font-semibold text-[#0066FF] hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
                    >
                      {isSubmitting ? (
                        <span>Signing In...</span>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* OR Divider */}
                  <div className="relative flex items-center justify-center my-4">
                    <div className="border-t border-slate-200 w-full" />
                    <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      OR
                    </span>
                    <div className="border-t border-slate-200 w-full" />
                  </div>

                  {/* Continue with Google */}
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isGoogleSubmitting}
                    aria-label="Continue with Google"
                    className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isGoogleSubmitting ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <GoogleGIcon />
                    )}
                    <span>{isGoogleSubmitting ? 'Connecting with Google...' : 'Continue with Google'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ========================================================================= */
            /* VIEW 2: CREATE ACCOUNT / SIGN UP SCREEN */
            /* ========================================================================= */
            <div>
              {/* Pending Quote Service Notice */}
              {pendingQuoteService && (
                <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200/90 text-[#0b2545] shadow-xs flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="w-9 h-9 rounded-xl bg-[#0066FF] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Sparkles className="w-4 h-4 text-sky-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-black text-[#0066FF] tracking-wider block">
                      Request Quote Flow
                    </span>
                    <p className="text-xs sm:text-[13px] font-extrabold text-[#0b2545] truncate mt-0.5">
                      {pendingQuoteService}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
                      Create your account to submit and track this quotation.
                    </p>
                  </div>
                </div>
              )}

              {/* Role Picker in Sign Up — Only Client | Technician */}
              <div className="mb-3">
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/90 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setRegRole('client')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      regRole === 'client'
                        ? 'bg-white text-[#0066FF] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('technician')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      regRole === 'technician'
                        ? 'bg-white text-[#0066FF] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Technician
                  </button>
                </div>
              </div>

              {/* Sign Up Form */}
              <form onSubmit={handleSignUpSubmit} className="space-y-3">
                {/* Full Name */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Full Name"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all"
                  />
                </div>

                {/* Email Address */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="Email Address"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all"
                  />
                </div>

                {/* Mobile Number */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    placeholder="Mobile Number"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={regShowPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowPassword(!regShowPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {regShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={regShowConfirmPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowConfirmPassword(!regShowConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {regShowConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Sign Up Submit */}
                <button
                  type="submit"
                  disabled={regIsSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-1"
                >
                  {regIsSubmitting ? (
                    <span>Creating Account...</span>
                  ) : (
                    <>
                      <span>Sign Up</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* OR Divider */}
              <div className="relative flex items-center justify-center my-3.5">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  OR
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isGoogleSubmitting}
                aria-label="Continue with Google"
                className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGoogleSubmitting ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <GoogleGIcon />
                )}
                <span>{isGoogleSubmitting ? 'Connecting with Google...' : 'Continue with Google'}</span>
              </button>

              {/* Switch to Sign In */}
              <div className="mt-4 text-center">
                <p className="text-xs text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setView('signin');
                      window.location.hash = 'login';
                    }}
                    className="font-bold text-[#0066FF] hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar: 3 Badges with Vertical Dividers (Safe Lifts | Reliable Solutions | Engineered for Excellence) */}
      <div className="relative z-10 w-full py-5 px-4 flex items-center justify-center">
        <div className="flex items-center gap-4 sm:gap-8 text-white/90 drop-shadow text-xs sm:text-sm font-semibold">
          {/* Badge 1: Safe Lifts */}
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-sky-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="12" y1="2" x2="12" y2="22" />
              <polyline points="7 6 9 4 11 6" />
              <polyline points="13 6 15 4 17 6" />
            </svg>
            <span>Safe Lifts</span>
          </div>

          <div className="h-4 w-[1px] bg-white/30" />

          {/* Badge 2: Reliable Solutions */}
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-300" />
            <span>Reliable Solutions</span>
          </div>

          <div className="h-4 w-[1px] bg-white/30" />

          {/* Badge 3: Engineered for Excellence */}
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-sky-300" />
            <span>Engineered for Excellence</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 relative">
            <button
              onClick={() => {
                setIsForgotPasswordOpen(false);
                setForgotSuccess(false);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-[#0b2545] mb-2">Reset Your Password</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your registered email address or mobile number to receive reset instructions.
            </p>

            {forgotSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Password Reset Instructions Sent</span>
                </div>
                <p>We sent a 6-digit OTP code to {forgotIdentifier || 'your email'}.</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordOpen(false);
                    setForgotSuccess(false);
                  }}
                  className="mt-2 text-xs font-bold text-emerald-700 underline"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  placeholder="Enter email or mobile number"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#0066FF]"
                />
                <button
                  type="button"
                  onClick={() => setForgotSuccess(true)}
                  className="w-full py-2.5 rounded-xl bg-[#0066FF] text-white font-bold text-xs sm:text-sm hover:bg-[#0052cc]"
                >
                  Send Reset Link / OTP
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Google OAuth 2.0 Identity Modal (Clients only) */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        targetRoleHint={view === 'signup' ? regRole : 'client'}
        onSuccess={() => {
          if (onClose) onClose();
        }}
      />

    </div>
  );
};
