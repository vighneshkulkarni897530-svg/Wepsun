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
  Check,
  MapPin,
  GraduationCap,
  Briefcase,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuthPopup } from '../../hooks/useAuthPopup';
import { GeometricBlueWLogo } from './WepsunLogo';
import { apiService, setTokens, isNativeApp } from '../../services/api';
import type { User as UserRecord, UserRole } from '../../types';
import { GoogleAuthModal } from './GoogleAuthModal';
import {
  loadGoogleGisScript,
  triggerGoogleSignIn,
  triggerGoogleOAuth2Popup,
  openNativeGoogleOAuth,
  buildGoogleOAuthUrl,
  triggerDirectGoogleOAuth,
  saveRecentGoogleAccount,
} from '../../services/googleAuth';
import {
  sendSignupEmailOtp,
  verifyInlineEmailOtp,
  invalidateEmailState,
  verifySignupEmailOtp,
  sendForgotPasswordEmail,
  verifyForgotPasswordOtpAndReset,
  resendOtp,
} from '../../services/firebaseAuth';
import elevatorGlassLobbyImg from '../../assets/elevator-glass-lobby.jpg';
import constructionPlansSunsetImg from '../../assets/construction-plans-sunset.jpg';
import { isValidCustomAvatar } from '../../utils/avatarUtils';
import { cacheUserSession } from '../../services/sessionManager';

interface LoginPageProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultRole?: 'technician' | 'client' | 'admin';
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
    showToast,
    currentRole,
    users,
  } = useApp();

  const {
    showPopup,
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
    closePopup,
  } = useAuthPopup();

  const [view, setView] = useState<'signin' | 'signup'>(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('signup') || hash.includes('register') || initialView === 'signup') {
      return 'signup';
    }
    return 'signin';
  });

  // Selected Role for authentication: Client | Technician
  const [selectedRole, setSelectedRole] = useState<'client' | 'technician'>(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('login-technician') || hash.includes('technician')) return 'technician';
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
  const [submitStatusText, setSubmitStatusText] = useState('Signing In...');

  // Input element refs for precise focus control
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const regFullNameRef = useRef<HTMLInputElement>(null);
  const regEmailInputRef = useRef<HTMLInputElement>(null);
  const regMobileInputRef = useRef<HTMLInputElement>(null);
  const regPasswordInputRef = useRef<HTMLInputElement>(null);
  const regConfirmPasswordInputRef = useRef<HTMLInputElement>(null);
  const termsCheckboxRef = useRef<HTMLInputElement>(null);
  const forgotEmailInputRef = useRef<HTMLInputElement>(null);
  const forgotOtpInputRef = useRef<HTMLInputElement>(null);
  const forgotPasswordInputRef = useRef<HTMLInputElement>(null);
  const forgotConfirmPasswordInputRef = useRef<HTMLInputElement>(null);

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

  // Technician Specific Login & Registration Fields
  const [technicianId, setTechnicianId] = useState('');
  const techIdInputRef = useRef<HTMLInputElement>(null);
  const [techAddress, setTechAddress] = useState('');
  const [techQualifications, setTechQualifications] = useState('');
  const [techExperienceYears, setTechExperienceYears] = useState('2');
  const [techDocuments, setTechDocuments] = useState('');
  const [technicianPendingSuccess, setTechnicianPendingSuccess] = useState(false);

  // Inline Email OTP Verification State for Sign Up (Client & Technician)
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [verifiedEmailAddress, setVerifiedEmailAddress] = useState<string>('');
  const [emailVerificationToken, setEmailVerificationToken] = useState<string>('');
  const [showInlineOtp, setShowInlineOtp] = useState<boolean>(false);
  const [inlineOtpValue, setInlineOtpValue] = useState<string>('');
  const [inlineOtpTimer, setInlineOtpTimer] = useState<number>(30);
  const [canResendInlineOtp, setCanResendInlineOtp] = useState<boolean>(false);
  const [isSendingInlineOtp, setIsSendingInlineOtp] = useState<boolean>(false);
  const [isVerifyingInlineOtp, setIsVerifyingInlineOtp] = useState<boolean>(false);
  const [inlineOtpError, setInlineOtpError] = useState<string | null>(null);
  const [inlineOtpSuccess, setInlineOtpSuccess] = useState<string | null>(null);
  const [devSignupOtp, setDevSignupOtp] = useState<string | null>(null);
  const [verifiedOtpCode, setVerifiedOtpCode] = useState<string>('');
  const [fallbackAuthData, setFallbackAuthData] = useState<any>(null);
  const inlineOtpInputRef = useRef<HTMLInputElement>(null);

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

  // Role Tab Change: Client | Technician
  const handleRoleChange = (role: 'client' | 'technician') => {
    setSelectedRole(role);
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
    setSubmitStatusText('Signing In...');

    const t1 = setTimeout(() => {
      setSubmitStatusText('Connecting to server...');
    }, 2500);
    const t2 = setTimeout(() => {
      setSubmitStatusText('Connecting to cloud...');
    }, 6000);

    try {
      const isMasterCandidate =
        cleanIdentifier.toLowerCase().startsWith('wep-') ||
        cleanIdentifier.toLowerCase().includes('mst-') ||
        cleanIdentifier.toLowerCase().startsWith('mst') ||
        cleanIdentifier.toLowerCase().includes('admin');
      const cleanTechId = technicianId.trim();
      const isCandidateTechId =
        cleanIdentifier.toUpperCase().startsWith('WEPSUN') ||
        cleanIdentifier.toUpperCase().startsWith('WES-TECH-') ||
        cleanIdentifier.toUpperCase().startsWith('TECH-');



      const payload: any = {
        email: cleanIdentifier.includes('@') || isMasterCandidate ? cleanIdentifier : undefined,
        phone: !cleanIdentifier.includes('@') && !isMasterCandidate && !isCandidateTechId ? cleanIdentifier : undefined,
        password: password,
        technicianId: cleanTechId || (isCandidateTechId ? cleanIdentifier : undefined),
        role: selectedRole === 'technician' ? 'technician' : 'client',
      };

      const targetRole: UserRole = selectedRole === 'client' ? 'client' : 'technician';

      const res = await apiService.login(payload);
      if (res && res.success && res.data) {
        const authData = res.data as any;
        const accessToken = authData.tokens?.accessToken || authData.accessToken;
        const refreshToken = authData.tokens?.refreshToken || authData.refreshToken;
        if (accessToken) {
          setTokens(accessToken, refreshToken);
        }
        if (authData.user) {
          const rawRole = (authData.user.role || targetRole).toLowerCase();
          const adminRoles = ['master_admin', 'super_admin', 'company_admin', 'service_manager', 'accounts', 'sales'];
          const isAdmin = adminRoles.includes(rawRole);
          const userRole: UserRole = isAdmin ? (rawRole as UserRole) : rawRole === 'technician' ? 'technician' : 'client';

          if (isAdmin) {
            localStorage.setItem('wepsun_master_authenticated', 'true');
            sessionStorage.setItem('wepsun_master_authenticated', 'true');
            const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
            localStorage.setItem('wepsun_master_session_expiry', String(expiry));
            sessionStorage.setItem('wepsun_master_session_expiry', String(expiry));
            localStorage.setItem('wepsun_role', userRole);
            sessionStorage.setItem('wepsun_role', userRole);
          }

          const rawAvatar = authData.user.avatarUrl || authData.user.avatar || '';
          const cachedAvatar = typeof window !== 'undefined' ? localStorage.getItem('wepsun_user_avatar_' + authData.user.id) : null;
          const resolvedAvatar = (isValidCustomAvatar(rawAvatar) ? rawAvatar : null) ||
            (isValidCustomAvatar(cachedAvatar) ? cachedAvatar : null) ||
            '';

          if (resolvedAvatar && typeof window !== 'undefined') {
            localStorage.setItem('wepsun_profile_saved_' + authData.user.id, 'true');
            localStorage.setItem('wepsun_user_avatar_' + authData.user.id, resolvedAvatar);
          }

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
            avatar: resolvedAvatar,
            isActive: true,
          };

          cacheUserSession(finalUser, userRole, isAdmin);
          loginAsUser(finalUser);

          if (pendingQuoteService || (typeof window !== 'undefined' && sessionStorage.getItem('wepsun_pending_quote_service'))) {
            sessionStorage.setItem('wepsun_open_quote_after_login', 'true');
          }

          const activeDest =
            userRole === 'client'
              ? 'home'
              : userRole === 'technician'
              ? 'jobs'
              : 'dashboard';

          // Immediately update hash so underlying navigation transitions seamlessly
          window.location.hash = activeDest;

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
              setShowInlineOtp(false);
              setIsEmailVerified(false);
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
        } else if (errorCode === 'ACCOUNT_PENDING_APPROVAL') {
          showPopup({
            type: 'warning',
            title: 'Account Awaiting Admin Approval',
            message: res?.message || 'Your technician application is currently under review by the administration. You will receive your permanent technician ID once approved.',
            primaryAction: {
              label: 'Understood',
              variant: 'primary',
              onClick: () => closePopup(),
            },
          });
        } else if (errorCode === 'ACCOUNT_BLOCKED') {
          showPopup({
            type: 'error',
            title: 'Account Blocked',
            message: res?.message || 'Your account has been blocked by the administrator. Please contact WEPSUN Support.',
            primaryAction: {
              label: 'Close',
              variant: 'secondary',
              onClick: () => closePopup(),
            },
          });
        } else if (errorCode === 'ACCOUNT_REJECTED') {
          showPopup({
            type: 'error',
            title: 'Application Not Approved',
            message: res?.message || 'Your technician application was not approved. Please contact the administrator for details.',
            primaryAction: {
              label: 'Close',
              variant: 'secondary',
              onClick: () => closePopup(),
            },
          });
        } else if (errorCode === 'ACCOUNT_SUSPENDED') {
          showPopup({
            type: 'warning',
            title: 'Account Suspended',
            message: res?.message || 'Your account has been temporarily suspended. Please contact the administrator.',
            primaryAction: {
              label: 'Close',
              variant: 'secondary',
              onClick: () => closePopup(),
            },
          });
        } else if (errorCode === 'INVALID_TECHNICIAN_ID') {
          showPopup({
            type: 'login_error',
            title: 'Invalid Technician ID',
            message: res?.message || 'The Technician ID entered does not match our records. Please verify your Permanent ID or Employee Code.',
            primaryAction: {
              label: 'Try Again',
              variant: 'primary',
              onClick: () => {
                closePopup();
                techIdInputRef.current?.focus();
              },
            },
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
            onTryAgain: () => {
              emailInputRef.current?.focus();
            },
          });
        }
      }
    } catch (err: any) {
      showSomethingWentWrong({
        message: err.message || "We couldn't complete your request right now. Please try again later.",
        onTryAgain: () => emailInputRef.current?.focus(),
      });
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setIsSubmitting(false);
      setSubmitStatusText('Signing In...');
    }
  };



  // =========================================================================
  // CLIENT & TECHNICIAN REGISTRATION: INLINE EMAIL OTP VERIFICATION
  // =========================================================================

  // Inline Email OTP Countdown Timer
  useEffect(() => {
    let interval: any;
    if (showInlineOtp && inlineOtpTimer > 0) {
      interval = setInterval(() => {
        setInlineOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResendInlineOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showInlineOtp, inlineOtpTimer]);

  // Trigger Send OTP for Inline Email Verification (Client & Technician)
  const handleTriggerSendEmailOtp = async () => {
    if (isSendingInlineOtp || isVerifyingInlineOtp) return;
    const emailClean = regEmail.trim().toLowerCase();
    if (!emailClean) {
      setInlineOtpError('Please enter your email address to receive the verification OTP.');
      setShowInlineOtp(false);
      regEmailInputRef.current?.focus();
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      setInlineOtpError('Please enter a valid email address (e.g. name@example.com).');
      setShowInlineOtp(false);
      regEmailInputRef.current?.focus();
      return;
    }

    setIsSendingInlineOtp(true);
    setInlineOtpError(null);
    setInlineOtpSuccess(null);

    try {
      const res = await sendSignupEmailOtp(emailClean, regFullName.trim(), selectedRole);

      if (res.success) {
        setShowInlineOtp(true);
        setInlineOtpValue('');
        setInlineOtpTimer(30);
        setCanResendInlineOtp(false);
        setInlineOtpSuccess(res.message || 'OTP sent successfully. Please check your email.');
        if (res.devOtp) {
          setDevSignupOtp(res.devOtp);
        }
        setTimeout(() => inlineOtpInputRef.current?.focus(), 80);
      } else {
        if (
          res.code === 'USER_ALREADY_EXISTS' ||
          res.code === 'EMAIL_EXISTS' ||
          res.message?.toLowerCase().includes('already') ||
          res.message?.toLowerCase().includes('exists')
        ) {
          showEmailAlreadyExists({
            email: emailClean,
            onSignIn: () => {
              setView('signin');
              setIdentifier(emailClean);
              setShowInlineOtp(false);
              window.location.hash = 'login';
              setTimeout(() => passwordInputRef.current?.focus(), 80);
            },
            onForgotPassword: () => {
              setForgotIdentifier(emailClean);
              setIsForgotPasswordOpen(true);
            },
          });
        } else if (res.code === 'ACCOUNT_PENDING_APPROVAL') {
          showPopup({
            type: 'warning',
            title: 'Account Awaiting Admin Approval',
            message: res.message || 'Your technician application with this email is currently awaiting review by the administration.',
            primaryAction: {
              label: 'Understood',
              variant: 'primary',
              onClick: () => closePopup(),
            },
          });
        } else {
          setInlineOtpError(res.message || 'Failed to send verification code. Please try again.');
        }
      }
    } catch (err: any) {
      setInlineOtpError(err?.message || 'Failed to reach verification service. Please try again.');
    } finally {
      setIsSendingInlineOtp(false);
    }
  };

  // Verify Submitted OTP Inline
  const handleVerifyInlineOtp = async (codeToVerify?: string) => {
    if (isVerifyingInlineOtp) return;
    const code = (codeToVerify || inlineOtpValue).replace(/\D/g, '').trim();

    if (code.length !== 6) {
      setInlineOtpError('Please enter all 6 digits of the verification code.');
      inlineOtpInputRef.current?.focus();
      return;
    }

    const emailClean = regEmail.trim().toLowerCase();
    setIsVerifyingInlineOtp(true);
    setInlineOtpError(null);

    try {
      const res = await verifyInlineEmailOtp(emailClean, code, {
        fullName: regFullName.trim(),
        phone: regMobile.trim() ? `${regCountryCode}${regMobile.trim().replace(/^0+/, '')}` : '',
        role: selectedRole,
        password: regPassword,
      });

      if (res.success) {
        setIsEmailVerified(true);
        setVerifiedEmailAddress(emailClean);
        setEmailVerificationToken(res.verificationToken || 'verified-email-token');
        setVerifiedOtpCode(code);
        if (res.authData) {
          setFallbackAuthData(res.authData);
        }
        setShowInlineOtp(false);
        setInlineOtpError(null);
        setInlineOtpSuccess('Email verified successfully!');
      } else {
        setInlineOtpError(res.message || 'Invalid verification code. Please try again.');
        setInlineOtpValue('');
        setTimeout(() => inlineOtpInputRef.current?.focus(), 50);
      }
    } catch (err: any) {
      setInlineOtpError(err?.message || 'Verification service error. Please try again.');
      setTimeout(() => inlineOtpInputRef.current?.focus(), 50);
    } finally {
      setIsVerifyingInlineOtp(false);
    }
  };

  // Resend OTP Inline
  const handleResendInlineOtp = async () => {
    if (!canResendInlineOtp || isSendingInlineOtp) return;
    await handleTriggerSendEmailOtp();
  };

  // Submit Completed Registration Form (Client or Technician)
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regIsSubmitting || isSendingInlineOtp || isVerifyingInlineOtp) return;

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

    // Strict email verification enforcement: User must verify email inline via "Verify Email" button
    if (!isEmailVerified || !emailVerificationToken || emailClean !== verifiedEmailAddress) {
      setInlineOtpError('Please click "Verify Email" beside your email address above to verify your email first.');
      regEmailInputRef.current?.focus();
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

    // Technician Registration with Verified Email & Admin Approval Workflow
    if (selectedRole === 'technician') {
      const mobileDigits = regMobile.replace(/\D/g, '');
      if (mobileDigits.length !== 10) {
        showMissingFields({
          message: 'Please enter a valid 10-digit mobile number for technician registration.',
          onOk: () => regMobileInputRef.current?.focus(),
        });
        return;
      }
      if (!techAddress.trim()) {
        showMissingFields({
          message: 'Please enter your complete address to register as a technician.',
        });
        return;
      }
      if (!techQualifications.trim()) {
        showMissingFields({
          message: 'Please enter your technical qualifications and experience details.',
        });
        return;
      }

      setRegIsSubmitting(true);
      try {
        const regRes = await apiService.registerTechnician({
          name: nameClean,
          email: emailClean,
          phone: phoneClean,
          address: techAddress.trim(),
          qualifications: techQualifications.trim(),
          experienceYears: Number(techExperienceYears) || 0,
          documents: techDocuments.trim() || undefined,
          password: regPassword,
          verificationToken: emailVerificationToken,
          otp: verifiedOtpCode || undefined,
        });

        if (regRes.success) {
          setTechnicianPendingSuccess(true);
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {}
        } else {
          showRegistrationFailed({
            message: regRes.message || 'Failed to submit technician application. Please check your details.',
          });
        }
      } catch (err: any) {
        showRegistrationFailed({
          message: err?.message || 'Error submitting application. Please try again later.',
        });
      } finally {
        setRegIsSubmitting(false);
      }
      return;
    }

    // Client Registration with Verified Email
    // 1. If fallback auth session was already established during OTP verification against live cloud, log in directly
    if (fallbackAuthData && (fallbackAuthData.tokens?.accessToken || fallbackAuthData.accessToken)) {
      const accessToken = fallbackAuthData.tokens?.accessToken || fallbackAuthData.accessToken;
      const refreshToken = fallbackAuthData.tokens?.refreshToken || fallbackAuthData.refreshToken;
      if (accessToken) {
        setTokens(accessToken, refreshToken);
      }

      const userRole: UserRole = 'client';
      const finalUser: UserRecord = {
        id: fallbackAuthData.user?.id || 'usr-' + Date.now(),
        name: fallbackAuthData.user?.name || nameClean,
        email: fallbackAuthData.user?.email || emailClean,
        phone: fallbackAuthData.user?.phone || phoneClean,
        role: userRole,
        companyId: fallbackAuthData.user?.companyId || 'comp-1',
        branchId: fallbackAuthData.user?.branchId,
        clientId: fallbackAuthData.user?.clientId || `client-${(fallbackAuthData.user?.id || 'usr-default').replace(/^usr-/, '')}`,
        avatar: fallbackAuthData.user?.avatarUrl || '',
        isActive: true,
      };

      loginAsUser(finalUser);

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
      return;
    }

    setRegIsSubmitting(true);
    try {
      const res = await apiService.verifySignupOtp({
        email: emailClean,
        otp: verifiedOtpCode || undefined,
        verificationToken: emailVerificationToken,
        name: nameClean,
        phone: phoneClean,
        role: 'CLIENT',
        password: regPassword,
        companyId: 'comp-1',
      });

      if (res.success && res.data) {
        const authData = res.data as any;
        const accessToken = authData.tokens?.accessToken || authData.accessToken;
        const refreshToken = authData.tokens?.refreshToken || authData.refreshToken;
        if (accessToken) {
          setTokens(accessToken, refreshToken);
        }

        const userRole: UserRole = 'client';
        const finalUser: UserRecord = {
          id: authData.user?.id || 'usr-' + Date.now(),
          name: authData.user?.name || nameClean,
          email: authData.user?.email || emailClean,
          phone: authData.user?.phone || phoneClean,
          role: userRole,
          companyId: authData.user?.companyId || 'comp-1',
          branchId: authData.user?.branchId,
          clientId: authData.user?.clientId || `client-${(authData.user?.id || 'usr-default').replace(/^usr-/, '')}`,
          avatar: authData.user?.avatarUrl || '',
          isActive: true,
        };

        loginAsUser(finalUser);

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
        showRegistrationFailed({
          message: res.message || res.error || "We couldn't create your account. Please review your information and try again.",
          onRetry: () => handleSignUpSubmit(e),
        });
      }
    } catch (err: any) {
      showRegistrationFailed({
        message: err?.message || "We couldn't create your account. Please review your information and try again.",
        onRetry: () => handleSignUpSubmit(e),
      });
    } finally {
      setRegIsSubmitting(false);
    }
  };

  // Google OAuth Authentication
  const handleGoogleAuth = async () => {
    if (isGoogleSubmitting) return;

    // 1. Android Native App (Capacitor WebView)
    if (isNativeApp()) {
      setIsGoogleSubmitting(true);
      try {
        // Open native Chrome Custom Tab to avoid Google's 403 disallowed_useragent block in WebViews
        await openNativeGoogleOAuth({ role: selectedRole || 'client' });
      } catch (err: any) {
        console.warn('[GoogleAuthApp] Chrome Custom Tab open notice:', err?.message);
        // Fallback to in-app Google Account Chooser immediately
        setIsGoogleModalOpen(true);
      } finally {
        setIsGoogleSubmitting(false);
      }
      return;
    }

    // 2. Mobile Web Browser (Brave, Chrome Mobile, Safari Mobile)
    // Mobile browsers proactively block window.open popups. Full-page redirect provides a 100% reliable flow without pop-up blocking dialogs.
    const isMobileBrowser = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobileBrowser) {
      await triggerDirectGoogleOAuth({ role: selectedRole || 'client' });
      return;
    }

    // 3. Desktop Web Browser Flow:
    setIsGoogleSubmitting(true);
    showGoogleConnecting({
      onCancel: () => {
        setIsGoogleSubmitting(false);
        closePopup();
      },
      onChooseAccount: () => {
        setIsGoogleSubmitting(false);
        closePopup();
        setIsGoogleModalOpen(true);
      },
    });

    try {
      await triggerGoogleOAuth2Popup(
        async (profile, token) => {
          try {
            const isIdToken = typeof token === 'string' && token.split('.').length === 3;
            const res = await apiService.googleLogin({
              credential: isIdToken ? token : undefined,
              accessToken: !isIdToken ? token : undefined,
              email: profile?.email,
              name: profile?.name,
              avatarUrl: profile?.picture,
              picture: profile?.picture,
              role: 'CLIENT',
              companyId: 'comp-1',
              googleId: profile?.sub,
            });

            if (res.success && res.data) {
              const authData = res.data as any;
              const accessToken = authData.tokens?.accessToken || authData.accessToken;
              const refreshToken = authData.tokens?.refreshToken || authData.refreshToken;
              if (accessToken) {
                setTokens(accessToken, refreshToken);
              }

              const rawGoogleAvatar = authData.user.avatarUrl || profile?.picture || '';
              const cachedGoogleAvatar = typeof window !== 'undefined' ? localStorage.getItem('wepsun_user_avatar_' + authData.user.id) : null;
              const resolvedGoogleAvatar = (isValidCustomAvatar(rawGoogleAvatar) ? rawGoogleAvatar : null) ||
                (isValidCustomAvatar(cachedGoogleAvatar) ? cachedGoogleAvatar : null) ||
                '';

              if (resolvedGoogleAvatar && typeof window !== 'undefined') {
                localStorage.setItem('wepsun_profile_saved_' + authData.user.id, 'true');
                localStorage.setItem('wepsun_user_avatar_' + authData.user.id, resolvedGoogleAvatar);
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
                avatar: resolvedGoogleAvatar,
                isActive: true,
              };

              saveRecentGoogleAccount({
                email: finalUser.email,
                name: finalUser.name,
                role: 'client',
                avatarUrl: resolvedGoogleAvatar,
              });

              loginAsUser(finalUser);

              try {
                confetti({
                  particleCount: 70,
                  spread: 60,
                  origin: { y: 0.65 },
                });
              } catch {}

              window.location.hash = 'home';
              if (onClose) onClose();

              showGoogleSuccess({
                name: finalUser.name,
                onContinue: () => {
                  window.location.hash = 'home';
                  if (onClose) onClose();
                },
              });
            } else {
              closePopup();
              const errorMsg = (res as any)?.message || 'Google sign-in could not be completed.';
              showGoogleFailed({
                error: errorMsg,
                onRetry: () => handleGoogleAuth(),
              });
            }
          } catch (err: any) {
            console.warn('[GoogleAuth] Backend verification notice:', err?.message);
            closePopup();
            showGoogleFailed({
              error: err?.message || 'Google authentication encountered an unexpected error.',
              onRetry: () => handleGoogleAuth(),
            });
          } finally {
            setIsGoogleSubmitting(false);
          }
        },
        (popupError) => {
          setIsGoogleSubmitting(false);
          closePopup();
          if (popupError?.message?.includes('closed')) {
            showGoogleCancelled({
              onTryAgain: () => handleGoogleAuth(),
            });
          } else {
            showGoogleFailed({
              error: popupError?.message || 'Google sign-in popup was blocked or closed.',
              onRetry: () => handleGoogleAuth(),
            });
          }
        }
      );
    } catch (err: any) {
      setIsGoogleSubmitting(false);
      closePopup();
      console.warn('[GoogleAuth] GIS initiation fallback:', err?.message);
      showGoogleFailed({
        error: err?.message || 'Google Identity Services could not be initialized.',
        onRetry: () => handleGoogleAuth(),
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
      <div className="relative z-10 w-full pt-14 sm:pt-8 pb-4 px-4 sm:px-8 flex flex-col items-center justify-center text-center">
        <button
          onClick={() => {
            if (onClose) onClose();
            window.location.hash = 'home';
          }}
          className="absolute top-4 left-4 sm:left-8 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/35 text-white backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer touch-manipulation"
        >
          <span>← Back to Home</span>
        </button>



        {/* Brand Lockup (Geometric Blue W Logo + WEPSUN Typography) */}
        <div
          className="cursor-pointer flex flex-col items-center group transition-transform hover:scale-102 active:scale-98"
          onClick={() => {
            if (onClose) onClose();
            window.location.hash = 'home';
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
      <div className="relative z-10 flex-1 flex items-center justify-center px-3 sm:px-4 py-4 sm:py-6">
        <div className="w-full max-w-[440px] bg-white/95 backdrop-blur-md rounded-[24px] sm:rounded-[28px] shadow-2xl border border-white/60 p-4 sm:p-7 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Top Tabs: Sign In | Sign Up */}
          <div className="mb-5 sm:mb-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setView('signin');
                  setShowInlineOtp(false);
                  window.location.hash = 'login';
                }}
                className={`text-xl sm:text-2xl sm:text-[28px] font-black tracking-tight transition-all cursor-pointer relative pb-1 ${
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

              <span className="text-slate-300 text-lg sm:text-xl font-light select-none pb-1">|</span>

              <button
                type="button"
                onClick={() => {
                  setView('signup');
                  window.location.hash = 'signup';
                }}
                className={`text-xl sm:text-2xl sm:text-[28px] font-black tracking-tight transition-all cursor-pointer relative pb-1 ${
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
              {/* Role Selection Tabs — Two Options: Client | Technician */}
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

              {/* STANDARD SIGN IN FORM */}
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
                      placeholder={
                        selectedRole === 'technician'
                          ? 'Technician Email, Mobile, or ID'
                          : 'Email, Mobile, or Master ID'
                      }
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all"
                    />
                  </div>

                  {/* Technician ID Field (Visible on Technician role login) */}
                  {selectedRole === 'technician' && (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Wrench className="w-4 h-4 text-[#0066FF]" />
                      </div>
                      <input
                        ref={techIdInputRef}
                        type="text"
                        value={technicianId}
                        onChange={(e) => setTechnicianId(e.target.value.toUpperCase())}
                        placeholder="Permanent Technician ID (Optional or e.g. Wepsun0001)"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all uppercase tracking-wider"
                      />
                    </div>
                  )}

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
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>{submitStatusText}</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

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

                  <div className="text-center mt-1.5">
                    <button
                      type="button"
                      onClick={() => setIsGoogleModalOpen(true)}
                      className="text-[11px] text-[#0066FF] hover:text-blue-800 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Choose or switch Google account</span>
                    </button>
                  </div>
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

              {/* Technician Pending Approval Success Card */}
              {technicianPendingSuccess ? (
                <div className="text-center py-6 px-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border-2 border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <ShieldCheck className="w-9 h-9" />
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 mb-2">
                    Pending Administrator Approval
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 mb-2">
                    Your account is awaiting admin approval.
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto mb-6 leading-relaxed">
                    Thank you for applying to <strong>WEPSUN Engineering Solutions</strong>. Your application and technical credentials have been securely submitted to our administration.
                  </p>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left text-xs text-slate-600 mb-6 space-y-2.5">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Registration details & qualifications recorded</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>You will receive your permanent Technician ID via email upon approval</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Technician job assignments and tools will unlock upon approval</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTechnicianPendingSuccess(false);
                      setView('signin');
                      setSelectedRole('technician');
                      window.location.hash = 'login';
                    }}
                    className="w-full py-3.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-98 transition-all cursor-pointer"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <>
                  {/* Role Tabs for Registration */}
                  <div className="mb-4">
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/90 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('client')}
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
                        onClick={() => setSelectedRole('technician')}
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

                  {/* Registration Details Form with Inline Email OTP Verification */}
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

                      {/* Email Address with Inline Verification Option */}
                      <div className="space-y-1.5">
                        {/* Label row: Email Address on left, Verify Email button or Verified Badge on right */}
                        <div className="flex items-center justify-between text-xs px-0.5">
                          <label htmlFor="reg-email-input" className="font-semibold text-slate-700 flex items-center gap-1">
                            <span>Email Address</span>
                            <span className="text-red-500">*</span>
                          </label>

                          {isEmailVerified && verifiedEmailAddress === regEmail.trim().toLowerCase() ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Email Verified ✓</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              id="btn-verify-email"
                              onClick={handleTriggerSendEmailOtp}
                              disabled={isSendingInlineOtp || isVerifyingInlineOtp}
                              className="text-[11px] font-bold text-[#0066FF] hover:text-[#0052cc] hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline flex items-center gap-1 py-0.5 px-2 rounded-lg hover:bg-blue-50/60 transition-colors"
                            >
                              {isSendingInlineOtp ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin text-[#0066FF]" />
                                  <span>Sending OTP...</span>
                                </>
                              ) : showInlineOtp ? (
                                <span>Resend Code</span>
                              ) : (
                                <span>Verify Email</span>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Email Input Field */}
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            id="reg-email-input"
                            ref={regEmailInputRef}
                            type="email"
                            value={regEmail}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRegEmail(val);
                              if (isEmailVerified || showInlineOtp) {
                                setIsEmailVerified(false);
                                setVerifiedEmailAddress('');
                                setEmailVerificationToken('');
                                setVerifiedOtpCode('');
                                setFallbackAuthData(null);
                                setShowInlineOtp(false);
                                setInlineOtpValue('');
                                setInlineOtpError(null);
                                setInlineOtpSuccess(null);
                                invalidateEmailState(val);
                              }
                            }}
                            placeholder="Enter your email address"
                            required
                            className={`w-full pl-10 ${
                              isEmailVerified && verifiedEmailAddress === regEmail.trim().toLowerCase()
                                ? 'pr-28 border-emerald-400 bg-emerald-50/25 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/10'
                                : 'pr-4 border-slate-200/90 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-[#0066FF]/10'
                            } py-2.5 rounded-2xl border text-xs sm:text-sm font-medium focus:ring-4 outline-none transition-all`}
                          />
                          {isEmailVerified && verifiedEmailAddress === regEmail.trim().toLowerCase() && (
                            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-white/95 px-2 py-0.5 rounded-md border border-emerald-200 shadow-xs">
                                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                <span>Verified ✓</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Inline Error feedback when OTP boxes are not yet open */}
                        {!showInlineOtp && !isEmailVerified && inlineOtpError && (
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200 animate-in fade-in slide-in-from-top-1 text-left mt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                            <span>{inlineOtpError}</span>
                          </div>
                        )}

                        {/* INSTEAD OF THE OTP BOXES: Show clean green "Email Verified" status box in the empty space */}
                        {isEmailVerified && verifiedEmailAddress === regEmail.trim().toLowerCase() && (
                          <div
                            id="inline-email-verified-box"
                            className="p-3 rounded-2xl bg-emerald-50/90 border border-emerald-300 shadow-xs flex items-center justify-between gap-2.5 animate-in fade-in zoom-in-95 duration-200 text-left mt-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs sm:text-[13px] font-black text-emerald-900">
                                    Email Verified
                                  </span>
                                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                                    ✓
                                  </span>
                                </div>
                                <p className="text-[11px] text-emerald-700 font-medium truncate mt-0.5">
                                  Verification complete for <strong className="font-bold text-emerald-900">{verifiedEmailAddress}</strong>
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsEmailVerified(false);
                                setVerifiedEmailAddress('');
                                setEmailVerificationToken('');
                                setVerifiedOtpCode('');
                                setFallbackAuthData(null);
                                setShowInlineOtp(false);
                                setInlineOtpValue('');
                                setInlineOtpError(null);
                                setInlineOtpSuccess(null);
                                invalidateEmailState(regEmail);
                                setTimeout(() => regEmailInputRef.current?.focus(), 50);
                              }}
                              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 hover:underline px-2 py-1 rounded-lg hover:bg-emerald-100/70 transition-colors cursor-pointer shrink-0"
                            >
                              Change
                            </button>
                          </div>
                        )}

                        {/* Inline OTP Verification Section (appears directly below email field while entering OTP) */}
                        {showInlineOtp && !isEmailVerified && (
                          <div
                            id="inline-otp-section"
                            className="p-3 sm:p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/90 shadow-xs space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200 text-left mt-2"
                          >
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-[#0b2545] flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-[#0066FF]" />
                                <span>Enter Email Verification Code</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowInlineOtp(false);
                                  setInlineOtpValue('');
                                  setInlineOtpError(null);
                                  setInlineOtpSuccess(null);
                                }}
                                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>

                            <p className="text-[11px] text-slate-600 leading-tight">
                              A 6-digit verification code was sent to <strong className="text-slate-800 font-bold">{regEmail}</strong>.
                            </p>

                            {/* Development OTP quick fill helper when available */}
                            {devSignupOtp && (
                              <div className="flex items-center justify-between text-[11px] font-mono text-blue-800 bg-blue-100/90 px-2.5 py-1 rounded-xl border border-blue-200">
                                <span>Dev OTP: <strong>{devSignupOtp}</strong></span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInlineOtpValue(devSignupOtp);
                                    handleVerifyInlineOtp(devSignupOtp);
                                  }}
                                  className="text-[10px] font-bold text-[#0066FF] hover:underline cursor-pointer bg-white px-2 py-0.5 rounded shadow-2xs"
                                >
                                  Auto-Fill
                                </button>
                              </div>
                            )}

                            {/* 6 Individual boxes with transparent numeric input overlay */}
                            <div
                              className="relative cursor-text py-0.5"
                              onClick={() => inlineOtpInputRef.current?.focus()}
                            >
                              <input
                                ref={inlineOtpInputRef}
                                id="inline-otp-input"
                                type="tel"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={inlineOtpValue}
                                onChange={(e) => {
                                  const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                                  setInlineOtpValue(clean);
                                  setInlineOtpError(null);
                                  if (clean.length === 6) {
                                    handleVerifyInlineOtp(clean);
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-text"
                                style={{ fontSize: '16px' }}
                                autoFocus
                              />
                              <div className="grid grid-cols-6 gap-1.5 sm:gap-2 pointer-events-none">
                                {[0, 1, 2, 3, 4, 5].map((idx) => {
                                  const char = inlineOtpValue[idx] || '';
                                  const isCurrentActive = inlineOtpValue.length === idx;
                                  return (
                                    <div
                                      key={idx}
                                      className={`h-11 sm:h-12 flex items-center justify-center text-base sm:text-lg font-black rounded-xl border transition-all ${
                                        char
                                          ? 'border-[#0066FF] bg-white text-[#0066FF] shadow-xs ring-1 ring-[#0066FF]/20'
                                          : isCurrentActive
                                          ? 'border-[#0066FF] bg-white ring-2 ring-[#0066FF]/30 text-slate-800 shadow-xs'
                                          : 'border-slate-300 bg-white/90 text-slate-400'
                                      }`}
                                    >
                                      {char || (isCurrentActive ? <span className="w-0.5 h-4 bg-[#0066FF] animate-pulse rounded-full" /> : '')}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Inline error feedback */}
                            {inlineOtpError && (
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                                <span>{inlineOtpError}</span>
                              </div>
                            )}

                            {/* Inline success feedback */}
                            {inlineOtpSuccess && !inlineOtpError && (
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                                <span>{inlineOtpSuccess}</span>
                              </div>
                            )}

                            {/* Action controls: Verify OTP button and Resend OTP countdown */}
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <button
                                type="button"
                                id="btn-verify-otp"
                                onClick={() => handleVerifyInlineOtp()}
                                disabled={isVerifyingInlineOtp || inlineOtpValue.length !== 6}
                                className="px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-xs shadow-sm hover:shadow active:scale-98 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              >
                                {isVerifyingInlineOtp ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                    <span>Verifying...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Verify OTP</span>
                                  </>
                                )}
                              </button>

                              <div className="text-right">
                                {canResendInlineOtp ? (
                                  <button
                                    type="button"
                                    id="btn-resend-inline-otp"
                                    onClick={handleResendInlineOtp}
                                    disabled={isSendingInlineOtp}
                                    className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <RefreshCw className={`w-3 h-3 ${isSendingInlineOtp ? 'animate-spin' : ''}`} />
                                    <span>Resend OTP</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] font-medium text-slate-500">
                                    Resend OTP in <strong className="text-[#0066FF] font-semibold font-mono">{inlineOtpTimer}s</strong>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
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
                            placeholder={selectedRole === 'technician' ? 'Mobile Number (10 digits, required)' : 'Mobile Number'}
                            required={selectedRole === 'technician'}
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Extra Fields for Technicians: Address, Qualifications, Experience, Documents */}
                      {selectedRole === 'technician' && (
                        <>
                          {/* Residential Address */}
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              value={techAddress}
                              onChange={(e) => setTechAddress(e.target.value)}
                              placeholder="Residential Address / City"
                              required
                              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all"
                            />
                          </div>

                          {/* Qualifications */}
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <GraduationCap className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              value={techQualifications}
                              onChange={(e) => setTechQualifications(e.target.value)}
                              placeholder="Technical Qualifications (e.g. ITI, Diploma, BE/BTech)"
                              required
                              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all"
                            />
                          </div>

                          {/* Experience and Certificate / License info */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Briefcase className="w-4 h-4" />
                              </div>
                              <select
                                value={techExperienceYears}
                                onChange={(e) => setTechExperienceYears(e.target.value)}
                                className="w-full pl-10 pr-2 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-[#0066FF] outline-none"
                              >
                                <option value="1">1 Year Exp.</option>
                                <option value="2">2 Years Exp.</option>
                                <option value="3">3 Years Exp.</option>
                                <option value="5">5+ Years Exp.</option>
                                <option value="10">10+ Years Exp.</option>
                              </select>
                            </div>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <FileText className="w-4 h-4" />
                              </div>
                              <input
                                type="text"
                                value={techDocuments}
                                onChange={(e) => setTechDocuments(e.target.value)}
                                placeholder="License / Certificate No."
                                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 outline-none transition-all"
                              />
                            </div>
                          </div>
                        </>
                      )}

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
                      <div className="space-y-1">
                        <button
                          type="submit"
                          id="btn-submit-signup"
                          disabled={
                            regIsSubmitting ||
                            isSendingInlineOtp ||
                            isVerifyingInlineOtp ||
                            !regAgreeTerms ||
                            !isEmailVerified
                          }
                          className="w-full py-3.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-1"
                        >
                          {regIsSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                              <span>Submitting Application...</span>
                            </>
                          ) : isSendingInlineOtp ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                              <span>Sending Verification OTP...</span>
                            </>
                          ) : selectedRole === 'technician' ? (
                            <>
                              <span>Submit Application (Requires Approval)</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          ) : (
                            <>
                              <span>Create Account</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                        {!isEmailVerified && regEmail && (
                          <p className="text-[11px] text-center text-slate-500">
                            Please click <strong className="text-[#0066FF]">Verify Email</strong> above to enable registration.
                          </p>
                        )}
                      </div>
                    </form>

                    {/* OR Divider & Continue with Google (Client Only) */}
                    {selectedRole === 'client' && (
                      <>
                        <div className="relative flex items-center justify-center my-3.5">
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

                        <div className="text-center mt-1.5">
                          <button
                            type="button"
                            onClick={() => setIsGoogleModalOpen(true)}
                            className="text-[11px] text-[#0066FF] hover:text-blue-800 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1 transition-colors"
                          >
                            <span>Choose or switch Google account</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
            </>
          )}

          {/* Switch to Sign In */}
          {!technicianPendingSuccess && (
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setView('signin');
                    setShowInlineOtp(false);
                    window.location.hash = 'login';
                  }}
                  className="font-bold text-[#0066FF] hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </div>
          )}
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
