import React, { useState, useEffect, useRef } from 'react';
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
  ArrowLeft,
  ChevronRight,
  Settings,
  KeyRound,
  Loader2,
  MailCheck,
  RefreshCw,
  Shield,
  Key,
  Smartphone,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuthPopup } from '../../hooks/useAuthPopup';
import { GeometricBlueWLogo } from './WepsunLogo';
import { apiService, setTokens } from '../../services/api';
import type { User as UserRecord, UserRole } from '../../types';
import { GoogleAuthModal } from './GoogleAuthModal';
import { loadGoogleGisScript, triggerGoogleSignIn, triggerGoogleOAuth2Popup } from '../../services/googleAuth';
import {
  sendSignupEmailOtp,
  verifySignupEmailOtp,
  sendForgotPasswordEmail,
  verifyForgotPasswordOtpAndReset,
  resendOtp,
} from '../../services/firebaseAuth';
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
  } = useApp();

  const {
    showAccountNotFound,
    showIncorrectPassword,
    showSignInSuccess,
    showInvalidEmail,
    showMissingFields,
    showTooManyAttempts,
    showConnectionProblem,
    showSomethingWentWrong,
    showAccountCreatedSuccess,
    showEmailAlreadyExists,
    showPasswordRequirements,
    showPasswordMismatch,
    showAgreementRequired,
    showRegistrationFailed,
    showCheckInbox,
    showOtpSent,
    showVerificationFailed,
    showVerificationSuccess,
    showPasswordResetSuccess,
    showGoogleConnecting,
    showGoogleCancelled,
    showGoogleFailed,
    showGoogleSuccess,
    showMasterInvalid,
    showMasterSuccess,
    closePopup,
  } = useAuthPopup();

  const [view, setView] = useState<'signin' | 'signup'>(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('signup') || hash.includes('register') || initialView === 'signup') {
      return 'signup';
    }
    return 'signin';
  });

  // Selected Role for authentication: Exactly TWO visible tabs (Client | Technician)
  const [selectedRole, setSelectedRole] = useState<'client' | 'technician'>(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('login-technician') || hash.includes('technician')) return 'technician';
    if (hash.includes('login-client') || hash.includes('client')) return 'client';
    if (defaultRole === 'technician') return 'technician';
    if (currentRole === 'technician') return 'technician';
    return 'client';
  });

  // Technician Portal Mode: Normal Technician Credentials vs Authorized Master ID Entry
  const [techMode, setTechMode] = useState<'standard' | 'master'>('standard');

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

  // Input element refs for precise focus control
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const regFullNameRef = useRef<HTMLInputElement>(null);
  const regEmailInputRef = useRef<HTMLInputElement>(null);
  const regMobileInputRef = useRef<HTMLInputElement>(null);
  const regPasswordInputRef = useRef<HTMLInputElement>(null);
  const regConfirmPasswordInputRef = useRef<HTMLInputElement>(null);
  const termsCheckboxRef = useRef<HTMLInputElement>(null);
  const masterIdInputRef = useRef<HTMLInputElement>(null);
  const masterEmailOtpRef = useRef<HTMLInputElement>(null);
  const masterSmsOtpRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const forgotEmailInputRef = useRef<HTMLInputElement>(null);
  const forgotOtpInputRef = useRef<HTMLInputElement>(null);
  const forgotPasswordInputRef = useRef<HTMLInputElement>(null);
  const forgotConfirmPasswordInputRef = useRef<HTMLInputElement>(null);

  // Master ID Dual-Factor Authentication State (Executive Admin Flow)
  const [masterIdInput, setMasterIdInput] = useState('');
  const [masterStep, setMasterStep] = useState<'id_entry' | 'otp_verify'>('id_entry');
  const [masterChallengeToken, setMasterChallengeToken] = useState<string | null>(null);
  const [masterMaskedEmail, setMasterMaskedEmail] = useState('');
  const [masterMaskedPhone, setMasterMaskedPhone] = useState('');
  const [masterEmailOtp, setMasterEmailOtp] = useState('');
  const [masterSmsOtp, setMasterSmsOtp] = useState('');
  const [masterTimer, setMasterTimer] = useState<number>(60);
  const [canResendMasterOtp, setCanResendMasterOtp] = useState<boolean>(false);
  const [isInitiatingMaster, setIsInitiatingMaster] = useState(false);
  const [isVerifyingMaster, setIsVerifyingMaster] = useState(false);
  const [devMasterOtp, setDevMasterOtp] = useState<{ emailOtp: string; smsOtp: string } | null>(null);

  // Sign Up Form Fields (Client Registration)
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCountryCode, setRegCountryCode] = useState('+91');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regShowConfirmPassword, setRegShowConfirmPassword] = useState(false);
  const [regAgreeTerms, setRegAgreeTerms] = useState(false);
  const [regIsSubmitting, setRegIsSubmitting] = useState(false);

  // Email OTP Verification State for Sign Up
  const [signUpStep, setSignUpStep] = useState<'form' | 'otp'>('form');
  const [otpValue, setOtpValue] = useState<string>('');
  const [otpTimer, setOtpTimer] = useState<number>(60);
  const [canResendOtp, setCanResendOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [devSignupOtp, setDevSignupOtp] = useState<string | null>(null);

  // Forgot Password Modal (Step 1: Request, Step 2: OTP & Reset, Step 3: Success)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp_reset' | 'success'>('email');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtpValue, setForgotOtpValue] = useState<string>('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotShowPassword, setForgotShowPassword] = useState(false);
  const [forgotShowConfirmPassword, setForgotShowConfirmPassword] = useState(false);
  const [forgotTimer, setForgotTimer] = useState<number>(60);
  const [canResendForgotOtp, setCanResendForgotOtp] = useState<boolean>(false);
  const [isSendingForgot, setIsSendingForgot] = useState<boolean>(false);
  const [isResettingPassword, setIsResettingPassword] = useState<boolean>(false);
  const [devForgotOtp, setDevForgotOtp] = useState<string | null>(null);

  // Google OAuth Modal
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  // Pre-load Google Identity Services
  useEffect(() => {
    loadGoogleGisScript().catch(() => {});
  }, []);

  // Role Tab Change: Exactly Client or Technician
  const handleRoleChange = (role: 'client' | 'technician') => {
    setSelectedRole(role);
    setTechMode('standard');
    setMasterStep('id_entry');
  };

  // Sign In Submission Handler
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      showMissingFields({
        message: 'Please enter your email address or mobile number to continue.',
        onOk: () => emailInputRef.current?.focus(),
      });
      return;
    }

    if (!password.trim()) {
      showMissingFields({
        message: 'Please enter your password to continue.',
        onOk: () => passwordInputRef.current?.focus(),
      });
      return;
    }

    // If looks like an email, validate email syntax
    if (cleanIdentifier.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanIdentifier)) {
      showInvalidEmail({
        onOk: () => emailInputRef.current?.focus(),
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        email: cleanIdentifier.includes('@') ? cleanIdentifier : undefined,
        phone: !cleanIdentifier.includes('@') ? cleanIdentifier : undefined,
        password: password,
      };

      const targetRole: UserRole = selectedRole === 'client' ? 'client' : 'technician';

      const res = await apiService.login(payload);
      if (res && res.success && res.data) {
        const authData = res.data as any;
        if (authData.tokens?.accessToken) {
          setTokens(authData.tokens.accessToken, authData.tokens.refreshToken);
        }
        if (authData.user) {
          const userRole = (authData.user.role || targetRole).toLowerCase() as UserRole;
          const finalUser: UserRecord = {
            id: authData.user.id,
            name: authData.user.name,
            email: authData.user.email,
            phone: authData.user.phone || '',
            role: userRole,
            companyId: authData.user.companyId || 'comp-1',
            branchId: authData.user.branchId,
            clientId: authData.user.clientId || (userRole === 'client' ? `client-${authData.user.id.replace(/^usr-/, '')}` : undefined),
            technicianId: authData.user.technicianId || (userRole === 'technician' ? `tech-${authData.user.id.replace(/^usr-/, '')}` : undefined),
            avatar: authData.user.avatarUrl || authData.user.avatar,
            isActive: true,
          };

          loginAsUser(finalUser);
          setCurrentRole(userRole);

          if (pendingQuoteService || (typeof window !== 'undefined' && sessionStorage.getItem('wepsun_pending_quote_service'))) {
            sessionStorage.setItem('wepsun_open_quote_after_login', 'true');
          }

          const activeDest =
            userRole === 'client'
              ? 'home'
              : userRole === 'technician'
              ? 'jobs'
              : 'dashboard';

          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {}

          showSignInSuccess({
            name: finalUser.name,
            role: userRole,
            onContinue: () => {
              window.location.hash = activeDest;
              if (onClose) onClose();
            },
          });
        }
      } else {
        const errorCode = res?.code;
        if (errorCode === 'USER_NOT_FOUND') {
          showAccountNotFound({
            email: cleanIdentifier,
            onCreateAccount: () => {
              setView('signup');
              setRegEmail(cleanIdentifier);
              setSignUpStep('form');
              window.location.hash = 'signup';
              setTimeout(() => regFullNameRef.current?.focus(), 80);
            },
            onTryAgain: () => {
              emailInputRef.current?.focus();
            },
          });
        } else if (errorCode === 'INVALID_CREDENTIALS') {
          showIncorrectPassword({
            onTryAgain: () => {
              passwordInputRef.current?.focus();
            },
            onForgotPassword: () => {
              setForgotIdentifier(cleanIdentifier);
              setIsForgotPasswordOpen(true);
            },
          });
        } else if (errorCode === 'TOO_MANY_ATTEMPTS' || res?.status === 429) {
          showTooManyAttempts({
            waitTimeSeconds: (res as any)?.retryAfter || 60,
            onOk: () => emailInputRef.current?.focus(),
          });
        } else if (errorCode === 'ACCOUNT_DEACTIVATED') {
          showSomethingWentWrong({
            message: 'This account has been deactivated. Please contact WEPSUN Support.',
          });
        } else if (errorCode === 'OFFLINE' || errorCode === 'NETWORK_ERROR' || errorCode === 'TIMEOUT') {
          showConnectionProblem({
            onRetry: () => {
              handleSignInSubmit(e);
            },
            onCancel: () => closePopup(),
          });
        } else {
          showSomethingWentWrong({
            message: res?.message || "We couldn't complete your request right now. Please try again later.",
            onTryAgain: () => emailInputRef.current?.focus(),
          });
        }
      }
    } catch (err: any) {
      showSomethingWentWrong({
        message: err.message || "We couldn't complete your request right now. Please try again later.",
        onTryAgain: () => emailInputRef.current?.focus(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // MASTER ID DUAL-FACTOR AUTHENTICATION (ADMIN ENTRY VIA TECHNICIAN TAB)
  // =========================================================================

  // Step 1: Initiate Master ID 2FA
  const handleInitiateMaster2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInitiatingMaster) return;

    const candidate = masterIdInput.trim();
    if (!candidate) {
      showMissingFields({
        message: 'Please enter an authorized Master ID to continue.',
        onOk: () => masterIdInputRef.current?.focus(),
      });
      return;
    }

    setIsInitiatingMaster(true);

    try {
      const res = await apiService.initiateMaster2FA({ masterId: candidate });
      if (res && res.success && res.data) {
        setMasterChallengeToken(res.data.challengeToken);
        setMasterMaskedEmail(res.data.maskedEmail || 'registered admin email');
        setMasterMaskedPhone(res.data.maskedPhone || 'registered mobile');
        setMasterStep('otp_verify');
        setMasterEmailOtp('');
        setMasterSmsOtp('');
        setMasterTimer(60);
        setCanResendMasterOtp(false);
        if (res.data.devOtp) {
          setDevMasterOtp(res.data.devOtp);
        }

        showOtpSent({
          maskedContact: `${res.data.maskedEmail} and ${res.data.maskedPhone}`,
          onEnterOtp: () => masterEmailOtpRef.current?.focus(),
        });
      } else {
        showMasterInvalid({
          onTryAgain: () => {
            setMasterIdInput('');
            masterIdInputRef.current?.focus();
          },
        });
      }
    } catch (err: any) {
      showMasterInvalid({
        onTryAgain: () => {
          masterIdInputRef.current?.focus();
        },
      });
    } finally {
      setIsInitiatingMaster(false);
    }
  };

  // Step 2: Verify Master Dual-Factor OTPs & Launch Admin Dashboard
  const handleVerifyMaster2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifyingMaster || !masterChallengeToken) return;

    const cleanEmailOtp = masterEmailOtp.replace(/\D/g, '').trim();
    const cleanSmsOtp = masterSmsOtp.replace(/\D/g, '').trim();

    if (cleanEmailOtp.length !== 6) {
      showMissingFields({
        message: 'Please enter the complete 6-digit Email verification code.',
        onOk: () => masterEmailOtpRef.current?.focus(),
      });
      return;
    }

    setIsVerifyingMaster(true);

    try {
      const res = await apiService.verifyMaster2FA({
        challengeToken: masterChallengeToken,
        emailOtp: cleanEmailOtp,
        smsOtp: cleanSmsOtp || undefined,
        rememberMe,
      });

      if (res && res.success && res.data) {
        const authData = res.data as any;
        if (authData.tokens?.accessToken) {
          setTokens(authData.tokens.accessToken, authData.tokens.refreshToken);
        }

        const masterUser: UserRecord = {
          id: authData.user.id,
          name: authData.user.name,
          email: authData.user.email,
          phone: authData.user.phone || '+91 98201 55432',
          role: 'master_admin',
          companyId: authData.user.companyId || 'comp-1',
          branchId: authData.user.branchId,
          avatar: authData.user.avatarUrl || authData.user.avatar,
          isActive: true,
        };

        // Set persistent Master Admin session tokens
        const masterExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
        sessionStorage.setItem('wepsun_master_authenticated', 'true');
        sessionStorage.setItem('wepsun_master_session_expiry', String(masterExpiry));
        sessionStorage.setItem('wepsun_role', 'master_admin');
        sessionStorage.setItem('wepsun_lift_saas_v2_role', 'master_admin');
        sessionStorage.setItem('wepsun_userId', masterUser.id);
        sessionStorage.setItem('wepsun_lift_saas_v2_userId', masterUser.id);

        localStorage.setItem('wepsun_master_authenticated', 'true');
        localStorage.setItem('wepsun_master_session_expiry', String(masterExpiry));
        localStorage.setItem('wepsun_role', 'master_admin');
        localStorage.setItem('wepsun_lift_saas_v2_role', 'master_admin');
        localStorage.setItem('wepsun_userId', masterUser.id);
        localStorage.setItem('wepsun_lift_saas_v2_userId', masterUser.id);
        localStorage.setItem('wepsun_lift_saas_v2_currentUser', JSON.stringify(masterUser));
        localStorage.removeItem('wepsun_explicit_logout');

        loginAsUser(masterUser);
        setCurrentRole('master_admin');

        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#0066FF', '#00C853', '#FFD600', '#6200EA'],
          });
        } catch {}

        showMasterSuccess({
          name: masterUser.name,
          onContinue: () => {
            window.location.hash = 'dashboard';
            if (onClose) onClose();
          },
        });
      } else {
        showVerificationFailed({
          onTryAgain: () => {
            setMasterEmailOtp('');
            setMasterSmsOtp('');
            masterEmailOtpRef.current?.focus();
          },
          onResendCode: () => {
            handleResendMaster2FA();
          },
        });
      }
    } catch (err: any) {
      showVerificationFailed({
        onTryAgain: () => masterEmailOtpRef.current?.focus(),
        onResendCode: () => handleResendMaster2FA(),
      });
    } finally {
      setIsVerifyingMaster(false);
    }
  };

  // Master Resend OTP
  const handleResendMaster2FA = async () => {
    if (!canResendMasterOtp || !masterChallengeToken) return;

    try {
      const res = await apiService.resendMaster2FA({ challengeToken: masterChallengeToken });
      if (res && res.success) {
        setMasterTimer(60);
        setCanResendMasterOtp(false);
        setMasterEmailOtp('');
        setMasterSmsOtp('');
        if (res.data?.devOtp) {
          setDevMasterOtp(res.data.devOtp);
        }
        showOtpSent({
          maskedContact: `${masterMaskedEmail} and ${masterMaskedPhone}`,
          onEnterOtp: () => masterEmailOtpRef.current?.focus(),
        });
      } else {
        showSomethingWentWrong({
          message: res?.message || 'Could not resend Master 2FA codes.',
        });
      }
    } catch (err: any) {
      showSomethingWentWrong({
        message: err?.message || 'Failed to resend code.',
      });
    }
  };

  // Master 2FA Countdown Timer
  useEffect(() => {
    let interval: any;
    if (masterStep === 'otp_verify' && masterTimer > 0) {
      interval = setInterval(() => {
        setMasterTimer((prev) => {
          if (prev <= 1) {
            setCanResendMasterOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [masterStep, masterTimer]);

  // =========================================================================
  // CLIENT REGISTRATION & EMAIL OTP TIMERS
  // =========================================================================

  // Sign Up OTP Countdown Timer
  useEffect(() => {
    let interval: any;
    if (signUpStep === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [signUpStep, otpTimer]);

  // Forgot Password OTP Countdown Timer
  useEffect(() => {
    let interval: any;
    if (isForgotPasswordOpen && forgotStep === 'otp_reset' && forgotTimer > 0) {
      interval = setInterval(() => {
        setForgotTimer((prev) => {
          if (prev <= 1) {
            setCanResendForgotOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isForgotPasswordOpen, forgotStep, forgotTimer]);

  // Step 1: Submit Client Sign Up Details & Request Verification OTP
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regIsSubmitting || isSendingOtp) return;

    const emailClean = regEmail.trim().toLowerCase();
    const nameClean = regFullName.trim();
    const phoneClean = regMobile.trim() ? `${regCountryCode}${regMobile.trim().replace(/^0+/, '')}` : '';

    if (!nameClean) {
      showMissingFields({
        message: 'Please enter your full name to create an account.',
        onOk: () => regFullNameRef.current?.focus(),
      });
      return;
    }

    if (!emailClean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      showInvalidEmail({
        onOk: () => regEmailInputRef.current?.focus(),
      });
      return;
    }

    if (!regPassword || regPassword.length < 8) {
      showPasswordRequirements({
        onOk: () => regPasswordInputRef.current?.focus(),
      });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      showPasswordMismatch({
        onTryAgain: () => regConfirmPasswordInputRef.current?.focus(),
      });
      return;
    }

    if (!regAgreeTerms) {
      showAgreementRequired({
        onOk: () => termsCheckboxRef.current?.focus(),
      });
      return;
    }

    setRegIsSubmitting(true);
    setIsSendingOtp(true);

    try {
      const res = await sendSignupEmailOtp(emailClean, nameClean);

      if (res.success) {
        setSignUpStep('otp');
        setOtpValue('');
        setOtpTimer(60);
        setCanResendOtp(false);
        if (res.devOtp) {
          setDevSignupOtp(res.devOtp);
        }
        showOtpSent({
          maskedContact: emailClean,
          onEnterOtp: () => otpInputRef.current?.focus(),
        });
      } else {
        if (
          res.code === 'EMAIL_EXISTS' ||
          res.message?.toLowerCase().includes('already') ||
          res.message?.toLowerCase().includes('exists')
        ) {
          showEmailAlreadyExists({
            email: emailClean,
            onSignIn: () => {
              setView('signin');
              setIdentifier(emailClean);
              setSignUpStep('form');
              window.location.hash = 'login';
              setTimeout(() => passwordInputRef.current?.focus(), 80);
            },
            onForgotPassword: () => {
              setForgotIdentifier(emailClean);
              setIsForgotPasswordOpen(true);
            },
          });
        } else {
          showRegistrationFailed({
            message: res.message || "We couldn't create your account. Please review your information and try again.",
            onRetry: () => handleSignUpSubmit(e),
          });
        }
      }
    } catch (err: any) {
      showRegistrationFailed({
        message: err?.message || "We couldn't create your account. Please review your information and try again.",
        onRetry: () => handleSignUpSubmit(e),
      });
    } finally {
      setRegIsSubmitting(false);
      setIsSendingOtp(false);
    }
  };

  // Step 2: Verify OTP & Activate Account
  const handleVerifySignupOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify || otpValue).replace(/\D/g, '').trim();
    if (code.length !== 6) {
      showMissingFields({
        message: 'Please enter all 6 digits of the verification code.',
        onOk: () => otpInputRef.current?.focus(),
      });
      return;
    }

    setIsVerifyingOtp(true);

    const emailClean = regEmail.trim().toLowerCase();
    const nameClean = regFullName.trim();
    const phoneClean = regMobile.trim() ? `${regCountryCode}${regMobile.trim().replace(/^0+/, '')}` : '';

    try {
      const res = await verifySignupEmailOtp({
        email: emailClean,
        otp: code,
        fullName: nameClean,
        phone: phoneClean,
        role: 'client',
        password: regPassword,
      });

      if (res.success && res.user) {
        if (res.tokens?.accessToken) {
          setTokens(res.tokens.accessToken, res.tokens.refreshToken);
        }
        const userRole: UserRole = 'client';
        const finalUser: UserRecord = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          phone: res.user.phone || phoneClean,
          role: userRole,
          companyId: res.user.companyId || 'comp-1',
          branchId: res.user.branchId,
          clientId: res.user.clientId || `client-${res.user.id.replace(/^usr-/, '')}`,
          avatar: res.user.avatar || '',
          isActive: true,
        };

        loginAsUser(finalUser);
        setCurrentRole(userRole);

        if (pendingQuoteService || (typeof window !== 'undefined' && sessionStorage.getItem('wepsun_pending_quote_service'))) {
          sessionStorage.setItem('wepsun_open_quote_after_login', 'true');
        }

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}

        showAccountCreatedSuccess({
          onContinue: () => {
            window.location.hash = 'home';
            if (onClose) onClose();
          },
        });
      } else {
        showVerificationFailed({
          onTryAgain: () => {
            setOtpValue('');
            otpInputRef.current?.focus();
          },
          onResendCode: () => {
            handleResendSignupOtp();
          },
        });
      }
    } catch (err: any) {
      showVerificationFailed({
        onTryAgain: () => otpInputRef.current?.focus(),
        onResendCode: () => handleResendSignupOtp(),
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend Sign Up OTP
  const handleResendSignupOtp = async () => {
    if (!canResendOtp) return;
    setIsSendingOtp(true);

    try {
      const res = await resendOtp(regEmail.trim().toLowerCase(), 'signup');
      if (res.success) {
        setOtpValue('');
        setOtpTimer(60);
        setCanResendOtp(false);
        if (res.devOtp) {
          setDevSignupOtp(res.devOtp);
        }
        showOtpSent({
          maskedContact: regEmail.trim(),
          onEnterOtp: () => otpInputRef.current?.focus(),
        });
      } else {
        showSomethingWentWrong({
          message: res.message || 'Failed to resend verification code.',
        });
      }
    } catch (err: any) {
      showSomethingWentWrong({
        message: err?.message || 'Failed to resend verification code.',
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Google OAuth Authentication
  const handleGoogleAuth = async () => {
    if (isGoogleSubmitting) return;
    setIsGoogleSubmitting(true);
    showGoogleConnecting();

    try {
      await triggerGoogleOAuth2Popup(
        async (profile, token) => {
          try {
            const res = await apiService.googleLogin({
              accessToken: token,
              email: profile?.email,
              name: profile?.name,
              avatarUrl: profile?.picture,
              role: 'client',
              companyId: 'comp-1',
              googleId: profile?.sub,
            });

            if (res.success && res.data) {
              const authData = res.data as any;
              if (authData.tokens?.accessToken) {
                setTokens(authData.tokens.accessToken, authData.tokens.refreshToken);
              }

              const finalUser: UserRecord = {
                id: authData.user.id,
                name: authData.user.name,
                email: authData.user.email,
                phone: authData.user.phone || '',
                role: 'client',
                companyId: authData.user.companyId || 'comp-1',
                branchId: authData.user.branchId,
                clientId: authData.user.clientId || `client-${authData.user.id.replace(/^usr-/, '')}`,
                avatar: authData.user.avatarUrl || profile?.picture,
                isActive: true,
              };

              loginAsUser(finalUser);
              setCurrentRole('client');

              try {
                confetti({
                  particleCount: 70,
                  spread: 60,
                  origin: { y: 0.65 },
                });
              } catch {}

              showGoogleSuccess({
                name: finalUser.name,
                onContinue: () => {
                  window.location.hash = 'home';
                  if (onClose) onClose();
                },
              });
            } else {
              showGoogleFailed({
                error: res?.message,
                onRetry: () => handleGoogleAuth(),
              });
            }
          } catch (err: any) {
            showGoogleFailed({
              error: err?.message,
              onRetry: () => handleGoogleAuth(),
            });
          } finally {
            setIsGoogleSubmitting(false);
          }
        },
        (popupError) => {
          setIsGoogleSubmitting(false);
          if (popupError.message?.includes('closed') || popupError.message?.includes('cancel')) {
            showGoogleCancelled({
              onTryAgain: () => handleGoogleAuth(),
            });
          } else {
            showGoogleFailed({
              error: popupError.message,
              onRetry: () => handleGoogleAuth(),
            });
          }
        }
      );
    } catch {
      setIsGoogleSubmitting(false);
      showGoogleCancelled({
        onTryAgain: () => handleGoogleAuth(),
      });
    }
  };

  // Forgot Password Handlers
  const handleSendForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanForgotEmail = forgotIdentifier.trim().toLowerCase();

    if (!cleanForgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanForgotEmail)) {
      showInvalidEmail({
        onOk: () => forgotEmailInputRef.current?.focus(),
      });
      return;
    }

    setIsSendingForgot(true);

    try {
      const res = await sendForgotPasswordEmail(cleanForgotEmail);
      if (res.success) {
        setForgotStep('otp_reset');
        setForgotOtpValue('');
        setForgotTimer(60);
        setCanResendForgotOtp(false);
        if (res.devOtp) setDevForgotOtp(res.devOtp);

        showCheckInbox({
          onOk: () => forgotOtpInputRef.current?.focus(),
        });
      } else {
        showSomethingWentWrong({
          message: res.message || 'Could not dispatch password reset OTP.',
          onTryAgain: () => forgotEmailInputRef.current?.focus(),
        });
      }
    } catch (err: any) {
      showSomethingWentWrong({
        message: err?.message || 'Unable to request password reset.',
        onTryAgain: () => forgotEmailInputRef.current?.focus(),
      });
    } finally {
      setIsSendingForgot(false);
    }
  };

  const handleVerifyForgotOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = forgotOtpValue.replace(/\D/g, '').trim();

    if (enteredOtp.length !== 6) {
      showMissingFields({
        message: 'Please enter the complete 6-digit verification code.',
        onOk: () => forgotOtpInputRef.current?.focus(),
      });
      return;
    }
    if (!forgotNewPassword.trim() || forgotNewPassword.length < 8) {
      showPasswordRequirements({
        onOk: () => forgotPasswordInputRef.current?.focus(),
      });
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      showPasswordMismatch({
        onTryAgain: () => forgotConfirmPasswordInputRef.current?.focus(),
      });
      return;
    }

    setIsResettingPassword(true);

    try {
      const res = await verifyForgotPasswordOtpAndReset(
        forgotIdentifier.trim().toLowerCase(),
        enteredOtp,
        forgotNewPassword
      );

      if (res.success) {
        setForgotStep('success');
        setIdentifier(forgotIdentifier.trim());
        setPassword('');

        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}

        showPasswordResetSuccess({
          onSignIn: () => {
            setIsForgotPasswordOpen(false);
            setForgotStep('email');
            setView('signin');
            setTimeout(() => passwordInputRef.current?.focus(), 80);
          },
        });
      } else {
        showVerificationFailed({
          onTryAgain: () => {
            setForgotOtpValue('');
            forgotOtpInputRef.current?.focus();
          },
          onResendCode: () => {
            handleResendForgotOtp();
          },
        });
      }
    } catch (err: any) {
      showVerificationFailed({
        onTryAgain: () => forgotOtpInputRef.current?.focus(),
        onResendCode: () => handleResendForgotOtp(),
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleResendForgotOtp = async () => {
    if (!canResendForgotOtp) return;
    setIsSendingForgot(true);

    try {
      const res = await resendOtp(forgotIdentifier.trim().toLowerCase(), 'forgot_password');
      if (res.success) {
        setForgotOtpValue('');
        setForgotTimer(60);
        setCanResendForgotOtp(false);
        if (res.devOtp) setDevForgotOtp(res.devOtp);
        showCheckInbox({
          onOk: () => forgotOtpInputRef.current?.focus(),
        });
      } else {
        showSomethingWentWrong({
          message: res.message || 'Failed to resend code.',
        });
      }
    } catch (err: any) {
      showSomethingWentWrong({
        message: err?.message || 'Failed to resend code.',
      });
    } finally {
      setIsSendingForgot(false);
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

      {/* Top Header / Back Button Area */}
      <div className="relative z-10 w-full pt-8 pb-4 px-4 sm:px-8 flex flex-col items-center justify-center text-center">
        <button
          onClick={() => {
            if (onClose) onClose();
            window.location.hash = 'landing';
          }}
          className="absolute top-4 left-4 sm:left-8 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/35 text-white backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <span>← Back to Home</span>
        </button>

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
          
          {/* Top Tabs: Sign In | Sign Up */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setView('signin');
                  setSignUpStep('form');
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
                ? 'Welcome back! Please sign in to your WEPSUN account.'
                : 'Create your WEPSUN client account and verify your email.'}
            </p>
          </div>

          {/* ========================================================================= */}
          {/* VIEW 1: SIGN IN SCREEN */}
          {/* ========================================================================= */}
          {view === 'signin' ? (
            <div>
              {/* Role Selection Tabs — Exactly TWO Options: Client | Technician */}
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

              {/* TECHNICIAN TAB: Standard Technician vs Master Access Mode */}
              {selectedRole === 'technician' && (
                <div className="mb-4">
                  {techMode === 'standard' ? (
                    <div className="p-3 bg-blue-50/60 border border-blue-200/70 rounded-2xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#0066FF]" />
                        <span className="text-xs font-semibold text-slate-700">Authorized Master ID?</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTechMode('master');
                          setMasterStep('id_entry');
                        }}
                        className="text-xs font-bold text-[#0066FF] hover:underline cursor-pointer"
                      >
                        Enter Master ID →
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between gap-2 shadow-md">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold tracking-wide">Master Admin Portal</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTechMode('standard');
                          setMasterStep('id_entry');
                        }}
                        className="text-xs font-medium text-slate-300 hover:text-white hover:underline cursor-pointer"
                      >
                        ← Field Tech Login
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TECHNICIAN TAB: MASTER ID 2FA FLOW */}
              {selectedRole === 'technician' && techMode === 'master' ? (
                <div>
                  {/* Master Step 1: Enter Master ID */}
                  {masterStep === 'id_entry' ? (
                    <form onSubmit={handleInitiateMaster2FA} className="space-y-3.5">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Key className="w-4 h-4" />
                        </div>
                        <input
                          ref={masterIdInputRef}
                          type="password"
                          value={masterIdInput}
                          onChange={(e) => setMasterIdInput(e.target.value)}
                          placeholder="Enter Authorized Master ID"
                          required
                          autoFocus
                          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all"
                        />
                      </div>

                      <p className="text-[11px] text-slate-500 leading-tight">
                        Submitting an authorized Master ID initiates 2-Factor OTP verification sent to pre-registered administrative contact points.
                      </p>

                      <button
                        type="submit"
                        disabled={isInitiatingMaster || !masterIdInput.trim()}
                        className="w-full py-3.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                      >
                        {isInitiatingMaster ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Validating Master ID...</span>
                          </>
                        ) : (
                          <>
                            <span>Authorize & Send Dual-Factor OTP</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* Master Step 2: Dual-Factor (Email + SMS OTP) Verification Screen */
                    <form onSubmit={handleVerifyMaster2FA} className="space-y-3.5 animate-in fade-in duration-200">
                      <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-2xl text-left">
                        <div className="flex items-center gap-2 text-[#0066FF] font-bold text-xs mb-1">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Master Dual-Factor Verification Required</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-tight">
                          Verification codes dispatched to:
                        </p>
                        <div className="mt-1.5 space-y-0.5 text-xs text-slate-800 font-semibold font-mono">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <span>{masterMaskedEmail}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                            <span>{masterMaskedPhone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Email OTP Field */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Email Verification OTP (6 Digits)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            ref={masterEmailOtpRef}
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={masterEmailOtp}
                            onChange={(e) => {
                              setMasterEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                            }}
                            placeholder="Enter 6-digit Email code"
                            required
                            autoFocus
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-mono font-bold tracking-widest text-slate-800 focus:bg-white focus:border-[#0066FF] outline-none"
                          />
                        </div>
                      </div>

                      {/* SMS OTP Field */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          SMS Mobile OTP (6 Digits)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <input
                            ref={masterSmsOtpRef}
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={masterSmsOtp}
                            onChange={(e) => {
                              setMasterSmsOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                            }}
                            placeholder="Enter 6-digit SMS code"
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-mono font-bold tracking-widest text-slate-800 focus:bg-white focus:border-[#0066FF] outline-none"
                          />
                        </div>
                      </div>

                      {/* Resend Cooldown */}
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span>Didn't receive codes?</span>
                        {canResendMasterOtp ? (
                          <button
                            type="button"
                            onClick={handleResendMaster2FA}
                            className="font-bold text-[#0066FF] hover:underline cursor-pointer"
                          >
                            Resend Codes
                          </button>
                        ) : (
                          <span>Resend in <strong className="text-[#0066FF] font-mono">{masterTimer}s</strong></span>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isVerifyingMaster || masterEmailOtp.length !== 6}
                        className="w-full py-3.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                      >
                        {isVerifyingMaster ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Verifying Credentials...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verify & Access Admin Dashboard</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                /* STANDARD SIGN IN FORM (CLIENTS & STANDARD TECHNICIANS) */
                <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                  {/* Email / Identifier Field */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      ref={emailInputRef}
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={selectedRole === 'technician' ? 'Technician Email / Code' : 'Email Address'}
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
                      ref={passwordInputRef}
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
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Continue with Google Option (ONLY on Client tab as per security requirements) */}
              {selectedRole === 'client' && (
                <>
                  <div className="relative flex items-center justify-center my-4">
                    <div className="border-t border-slate-200 w-full" />
                    <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      OR
                    </span>
                    <div className="border-t border-slate-200 w-full" />
                  </div>

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
                </>
              )}
            </div>
          ) : (
            /* ========================================================================= */
            /* VIEW 2: CREATE ACCOUNT / SIGN UP SCREEN (CLIENT REGISTRATION ONLY) */
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
                      Create your client account to submit and track this quotation.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 1: Registration Details Form */}
              {signUpStep === 'form' ? (
                <div>
                  <form onSubmit={handleSignUpSubmit} className="space-y-3">
                    {/* Full Name */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        ref={regFullNameRef}
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
                        ref={regEmailInputRef}
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="Email Address"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all"
                      />
                    </div>

                    {/* Mobile Number with Country Code */}
                    <div className="flex gap-2">
                      <div className="w-20 shrink-0">
                        <select
                          value={regCountryCode}
                          onChange={(e) => setRegCountryCode(e.target.value)}
                          className="w-full py-2.5 px-2 rounded-2xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm font-bold text-slate-700 focus:bg-white focus:border-[#0066FF] outline-none"
                        >
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+971">🇦🇪 +971</option>
                          <option value="+65">🇸🇬 +65</option>
                        </select>
                      </div>
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          ref={regMobileInputRef}
                          type="tel"
                          value={regMobile}
                          onChange={(e) => {
                            setRegMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
                          }}
                          placeholder="Mobile Number"
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        ref={regPasswordInputRef}
                        type={regShowPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Password (minimum 8–12 characters)"
                        required
                        minLength={8}
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
                        ref={regConfirmPasswordInputRef}
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
                        {regShowConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Terms & Privacy Policy Checkbox */}
                    <div className="pt-1">
                      <label className="flex items-start gap-2 cursor-pointer select-none text-left">
                        <input
                          ref={termsCheckboxRef}
                          type="checkbox"
                          checked={regAgreeTerms}
                          onChange={(e) => setRegAgreeTerms(e.target.checked)}
                          required
                          className="w-4 h-4 mt-0.5 rounded text-[#0066FF] focus:ring-[#0066FF] border-slate-300 shrink-0"
                        />
                        <span className="text-[11px] sm:text-xs text-slate-600 leading-snug">
                          I agree to the <a href="#terms" className="text-[#0066FF] font-semibold hover:underline">Terms of Service</a> and <a href="#privacy" className="text-[#0066FF] font-semibold hover:underline">Privacy Policy</a>.
                        </span>
                      </label>
                    </div>

                    {/* Sign Up Submit Button */}
                    <button
                      type="submit"
                      disabled={regIsSubmitting || isSendingOtp || !regAgreeTerms}
                      className="w-full py-3.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-1"
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Sending Verification OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Account & Verify Email</span>
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
                </div>
              ) : (
                /* STEP 2: Interactive 6-Digit Email OTP Verification Screen */
                <div className="animate-in fade-in slide-in-from-right-3 duration-200">
                  <button
                    type="button"
                    onClick={() => {
                      setSignUpStep('form');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0066FF] transition-colors mb-3 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change Details / Email</span>
                  </button>

                  <div className="text-center mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto mb-2 border border-blue-100 shadow-xs">
                      <MailCheck className="w-6 h-6" />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-[#0b2545]">
                      Verify Your Email
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      We sent a 6-digit verification code to:{' '}
                      <strong className="text-slate-800 break-all block mt-0.5 font-bold">{regEmail}</strong>
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2 text-left mb-3 shadow-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Didn't see the email?</strong> Please check your <strong>Spam / Junk / Promotions</strong> folder.
                    </span>
                  </div>

                  {/* 6-Digit Visual OTP Boxes with Single Overlay Input */}
                  <div
                    className="relative my-3 cursor-text"
                    onClick={() => otpInputRef.current?.focus()}
                  >
                    <input
                      ref={otpInputRef}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtpValue(clean);
                        if (clean.length === 6) {
                          handleVerifySignupOtp(clean);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-text"
                      style={{ fontSize: '16px' }}
                      autoFocus
                    />
                    <div className="flex items-center justify-between gap-1.5 sm:gap-2 pointer-events-none">
                      {[0, 1, 2, 3, 4, 5].map((idx) => {
                        const char = otpValue[idx] || '';
                        const isCurrentActive = otpValue.length === idx;
                        return (
                          <div
                            key={idx}
                            className={`w-11 h-12 sm:w-12 sm:h-14 flex items-center justify-center text-lg sm:text-xl font-black rounded-2xl border transition-all ${
                              char
                                ? 'border-[#0066FF] bg-blue-50/40 text-[#0066FF] shadow-xs'
                                : isCurrentActive
                                ? 'border-[#0066FF] bg-white ring-4 ring-[#0066FF]/15 text-slate-800'
                                : 'border-slate-200 bg-slate-50/50 text-slate-400'
                            }`}
                          >
                            {char || (isCurrentActive ? <span className="w-0.5 h-6 bg-[#0066FF] animate-pulse rounded-full" /> : '')}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resend Cooldown Timer */}
                  <div className="flex items-center justify-between text-xs py-1 text-slate-500">
                    <span>Didn't receive code?</span>
                    {canResendOtp ? (
                      <button
                        type="button"
                        onClick={handleResendSignupOtp}
                        disabled={isSendingOtp}
                        className="font-bold text-[#0066FF] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSendingOtp ? 'animate-spin' : ''}`} />
                        <span>Resend OTP</span>
                      </button>
                    ) : (
                      <span className="font-semibold text-slate-600">
                        Resend in <strong className="text-[#0066FF] font-mono">{otpTimer}s</strong>
                      </span>
                    )}
                  </div>

                  {/* Verify & Activate Button */}
                  <button
                    type="button"
                    onClick={() => handleVerifySignupOtp()}
                    disabled={isVerifyingOtp || otpValue.length !== 6}
                    className="w-full py-3.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-3"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying & Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Create Account</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Switch to Sign In */}
              <div className="mt-4 text-center">
                <p className="text-xs text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setView('signin');
                      setSignUpStep('form');
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

      {/* Bottom Trust Badges */}
      <div className="relative z-10 w-full py-5 px-4 flex items-center justify-center">
        <div className="flex items-center gap-4 sm:gap-8 text-white/90 drop-shadow text-xs sm:text-sm font-semibold">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-sky-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="12" y1="2" x2="12" y2="22" />
              <polyline points="7 6 9 4 11 6" />
              <polyline points="13 6 15 4 17 6" />
            </svg>
            <span>Safe Lifts</span>
          </div>
          <div className="h-4 w-[1px] bg-white/30" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-300" />
            <span>Reliable Solutions</span>
          </div>
          <div className="h-4 w-[1px] bg-white/30" />
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-sky-300" />
            <span>Engineered for Excellence</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FORGOT PASSWORD MODAL */}
      {/* ========================================================================= */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[28px] shadow-2xl border border-slate-100 p-6 sm:p-8 relative">
            <button
              onClick={() => {
                setIsForgotPasswordOpen(false);
                setForgotStep('email');
              }}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {forgotStep === 'email' && (
              <div className="animate-in fade-in duration-150">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center mb-3 border border-blue-100 shadow-xs">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#0b2545]">Reset Your Password</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                  Enter your registered email address. We'll send a 6-digit OTP verification code to reset your password.
                </p>

                <form onSubmit={handleSendForgotEmail} className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      ref={forgotEmailInputRef}
                      type="email"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="Enter your registered email"
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingForgot}
                    className="w-full py-3.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isSendingForgot ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Sending Instructions & OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Reset Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {forgotStep === 'otp_reset' && (
              <div className="animate-in fade-in slide-in-from-right-3 duration-200">
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep('email');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0066FF] transition-colors mb-3 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Email</span>
                </button>

                <h3 className="text-xl font-bold text-[#0b2545]">Enter Reset Code</h3>
                <p className="text-xs text-slate-500 mt-1 mb-3">
                  Enter the 6-digit code sent to <strong className="text-slate-800">{forgotIdentifier}</strong> and create your new password.
                </p>

                <form onSubmit={handleVerifyForgotOtpAndReset} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      6-Digit Verification Code
                    </label>
                    <div
                      className="relative my-1 cursor-text"
                      onClick={() => forgotOtpInputRef.current?.focus()}
                    >
                      <input
                        ref={forgotOtpInputRef}
                        type="tel"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={forgotOtpValue}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setForgotOtpValue(clean);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-text"
                        style={{ fontSize: '16px' }}
                        autoFocus
                      />
                      <div className="flex items-center justify-between gap-1.5 sm:gap-2 pointer-events-none">
                        {[0, 1, 2, 3, 4, 5].map((idx) => {
                          const char = forgotOtpValue[idx] || '';
                          const isCurrentActive = forgotOtpValue.length === idx;
                          return (
                            <div
                              key={idx}
                              className={`w-10 h-11 sm:w-11 sm:h-12 flex items-center justify-center text-lg font-black rounded-xl border transition-all ${
                                char
                                  ? 'border-[#0066FF] bg-blue-50/40 text-[#0066FF]'
                                  : isCurrentActive
                                  ? 'border-[#0066FF] bg-white ring-4 ring-[#0066FF]/15 text-slate-800'
                                  : 'border-slate-200 bg-slate-50 text-slate-400'
                              }`}
                            >
                              {char || (isCurrentActive ? <span className="w-0.5 h-5 bg-[#0066FF] animate-pulse rounded-full" /> : '')}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      ref={forgotPasswordInputRef}
                      type={forgotShowPassword ? 'text' : 'password'}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="New Password (min 8 characters)"
                      required
                      minLength={8}
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setForgotShowPassword(!forgotShowPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {forgotShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      ref={forgotConfirmPasswordInputRef}
                      type={forgotShowConfirmPassword ? 'text' : 'password'}
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="Confirm New Password"
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setForgotShowConfirmPassword(!forgotShowConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {forgotShowConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                    <span>Didn't get the code?</span>
                    {canResendForgotOtp ? (
                      <button
                        type="button"
                        onClick={handleResendForgotOtp}
                        disabled={isSendingForgot}
                        className="font-bold text-[#0066FF] hover:underline cursor-pointer"
                      >
                        Resend Code
                      </button>
                    ) : (
                      <span>Resend in <strong className="text-[#0066FF] font-mono">{forgotTimer}s</strong></span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isResettingPassword || forgotOtpValue.length !== 6}
                    className="w-full py-3.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-1"
                  >
                    {isResettingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Reset Password & Complete</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {forgotStep === 'success' && (
              <div className="text-center py-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Password Reset Complete!</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                  Your password has been successfully updated. You can now sign in to your WEPSUN account with your new credentials.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordOpen(false);
                    setForgotStep('email');
                    setView('signin');
                  }}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer"
                >
                  Proceed to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Google OAuth Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        targetRoleHint="client"
        onSuccess={() => {
          if (onClose) onClose();
        }}
      />
    </div>
  );
};
