import React, { useEffect, useState, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Trash2,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  WifiOff,
  LogOut,
  Sparkles,
  BellRing,
  Info,
  X,
  ArrowRight,
  RotateCcw,
  Loader2,
  Check,
  Mail,
  MailCheck,
  Smartphone,
  KeyRound,
  UserX,
  UserCheck,
  Clock,
  FileText,
  AlertCircle,
  Key,
} from 'lucide-react';
import { GeometricBlueWLogo } from './WepsunLogo';

export type WepsunModalType =
  | 'success'
  | 'error'
  | 'warning'
  | 'delete'
  | 'login_error'
  | 'account_not_found'
  | 'incorrect_password'
  | 'email_exists'
  | 'invalid_email'
  | 'missing_fields'
  | 'too_many_attempts'
  | 'terms_required'
  | 'password_requirements'
  | 'password_mismatch'
  | 'registration_failed'
  | 'check_inbox'
  | 'code_sent'
  | 'verification_failed'
  | 'verification_success'
  | 'password_updated'
  | 'google_connecting'
  | 'google_cancelled'
  | 'google_error'
  | 'google_success'
  | 'master_invalid'
  | 'master_success'
  | 'access_denied'
  | 'network_error'
  | 'logout'
  | 'loading'
  | 'info'
  | 'update'
  | 'custom';

export interface WepsunModalAction {
  label: string;
  onClick?: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'outline';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export interface WepsunModalOptions {
  id?: string;
  type?: WepsunModalType;
  title?: string;
  message?: string | React.ReactNode;
  primaryAction?: WepsunModalAction;
  secondaryAction?: WepsunModalAction;
  tertiaryAction?: WepsunModalAction;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  onClose?: () => void;
  customIcon?: React.ReactNode;
  badgeText?: string;
  children?: React.ReactNode;
  className?: string;
  autoCloseMs?: number;
}

export interface WepsunModalProps extends WepsunModalOptions {
  isOpen: boolean;
}

// Google Colored G SVG
const GoogleGIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24">
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

export const WepsunModal: React.FC<WepsunModalProps> = ({
  isOpen,
  type = 'info',
  title,
  message,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  showCloseButton = true,
  closeOnBackdropClick = true,
  onClose,
  customIcon,
  badgeText,
  children,
  className = '',
  autoCloseMs,
}) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  // Focus preservation and restoration
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      setIsRendered(true);
      const timer = setTimeout(() => {
        setIsAnimating(true);
        primaryButtonRef.current?.focus();
      }, 20);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
        if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
          previousActiveElementRef.current.focus();
        }
      }, 240);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Auto-close countdown timer if set
  useEffect(() => {
    if (isOpen && autoCloseMs && autoCloseMs > 0 && onClose) {
      const autoTimer = setTimeout(() => {
        onClose();
      }, autoCloseMs);
      return () => clearTimeout(autoTimer);
    }
  }, [isOpen, autoCloseMs, onClose]);

  // Handle ESC key and focus trapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape' && onClose && closeOnBackdropClick && type !== 'loading' && type !== 'google_connecting') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalContainerRef.current) {
        const focusableElements = modalContainerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, closeOnBackdropClick, type]);

  if (!isRendered) return null;

  // Defaults based on modal type
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
      case 'google_success':
        return {
          defaultTitle: type === 'google_success' ? 'Welcome to WEPSUN!' : 'Welcome Back!',
          defaultMessage:
            type === 'google_success'
              ? 'You have successfully authenticated with Google.'
              : 'You have successfully signed in to your WEPSUN account.',
          badge: badgeText || (type === 'google_success' ? 'Google Verified' : 'Authentication Successful'),
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-transparent text-emerald-600 ring-emerald-500/20',
          glowClass: 'bg-emerald-500/10',
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Continue', variant: 'primary' as const },
          defaultSecondary: undefined,
        };

      case 'account_not_found':
        return {
          defaultTitle: 'Account Not Found',
          defaultMessage: "We couldn't find an account associated with this email address. Please check your email or create a new account to continue.",
          badge: badgeText || 'Account Verification',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-rose-500/15 via-amber-500/10 to-transparent text-rose-600 ring-rose-500/20',
          glowClass: 'bg-rose-500/10',
          icon: <UserX className="w-8 h-8 text-rose-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Create Account', variant: 'primary' as const },
          defaultSecondary: { label: 'Try Again', variant: 'secondary' as const },
        };

      case 'incorrect_password':
        return {
          defaultTitle: 'Incorrect Password',
          defaultMessage: 'The password you entered is incorrect. Please try again or reset your password.',
          badge: badgeText || 'Security Check',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-rose-500/15 via-rose-500/10 to-transparent text-rose-600 ring-rose-500/20',
          glowClass: 'bg-rose-500/10',
          icon: <LockKeyhole className="w-8 h-8 text-rose-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Try Again', variant: 'primary' as const },
          defaultSecondary: { label: 'Forgot Password', variant: 'secondary' as const },
        };

      case 'email_exists':
        return {
          defaultTitle: 'Account Already Exists',
          defaultMessage: 'An account with this email may already exist. Try signing in or use password recovery.',
          badge: badgeText || 'Existing Account',
          badgeClass: 'bg-blue-50 text-[#0066FF] border-blue-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-[#0066FF]/15 via-blue-500/10 to-transparent text-[#0066FF] ring-[#0066FF]/20',
          glowClass: 'bg-[#0066FF]/10',
          icon: <UserCheck className="w-8 h-8 text-[#0066FF] animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Sign In', variant: 'primary' as const },
          defaultSecondary: { label: 'Forgot Password', variant: 'secondary' as const },
        };

      case 'invalid_email':
        return {
          defaultTitle: 'Check Your Email',
          defaultMessage: 'Please enter a valid email address.',
          badge: badgeText || 'Email Verification',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-transparent text-amber-600 ring-amber-500/20',
          glowClass: 'bg-amber-500/10',
          icon: <Mail className="w-8 h-8 text-amber-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Okay', variant: 'primary' as const },
          defaultSecondary: undefined,
        };

      case 'missing_fields':
        return {
          defaultTitle: 'Complete All Fields',
          defaultMessage: 'Please enter your email address and password to continue.',
          badge: badgeText || 'Required Fields',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-transparent text-amber-600 ring-amber-500/20',
          glowClass: 'bg-amber-500/10',
          icon: <AlertCircle className="w-8 h-8 text-amber-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Okay', variant: 'primary' as const },
          defaultSecondary: undefined,
        };

      case 'too_many_attempts':
        return {
          defaultTitle: 'Too Many Attempts',
          defaultMessage: "You've made too many sign-in attempts. Please wait before trying again.",
          badge: badgeText || 'Rate Limited',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-rose-500/15 via-orange-500/10 to-transparent text-rose-600 ring-rose-500/20',
          glowClass: 'bg-rose-500/10',
          icon: <Clock className="w-8 h-8 text-rose-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Okay', variant: 'primary' as const },
          defaultSecondary: undefined,
        };

      case 'terms_required':
        return {
          defaultTitle: 'Agreement Required',
          defaultMessage: 'Please accept the Terms and Conditions and Privacy Policy to create your account.',
          badge: badgeText || 'Terms Agreement',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-transparent text-amber-600 ring-amber-500/20',
          glowClass: 'bg-amber-500/10',
          icon: <FileText className="w-8 h-8 text-amber-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Okay', variant: 'primary' as const },
          defaultSecondary: undefined,
        };

      case 'password_requirements':
        return {
          defaultTitle: 'Password Requirements',
          defaultMessage: 'Please create a password that meets all the security requirements.',
          badge: badgeText || 'Password Policy',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-transparent text-amber-600 ring-amber-500/20',
          glowClass: 'bg-amber-500/10',
          icon: <KeyRound className="w-8 h-8 text-amber-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Okay', variant: 'primary' as const },
          defaultSecondary: undefined,
        };

      case 'password_mismatch':
        return {
          defaultTitle: "Passwords Don't Match",
          defaultMessage: 'Your password and confirmation password must match.',
          badge: badgeText || 'Validation',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-rose-500/15 via-rose-500/10 to-transparent text-rose-600 ring-rose-500/20',
          glowClass: 'bg-rose-500/10',
          icon: <AlertTriangle className="w-8 h-8 text-rose-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Try Again', variant: 'primary' as const },
          defaultSecondary: undefined,
        };

      case 'registration_failed':
        return {
          defaultTitle: 'Registration Unsuccessful',
          defaultMessage: "We couldn't create your account. Please review your information and try again.",
          badge: badgeText || 'Registration Failed',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-rose-500/15 via-rose-500/10 to-transparent text-rose-600 ring-rose-500/20',
          glowClass: 'bg-rose-500/10',
          icon: <AlertOctagon className="w-8 h-8 text-rose-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Retry', variant: 'primary' as const },
          defaultSecondary: undefined,
        };

      case 'check_inbox':
        return {
          defaultTitle: 'Check Your Inbox',
          defaultMessage: "If the email is eligible for password recovery, you'll receive instructions shortly.",
          badge: badgeText || 'Password Recovery',
          badgeClass: 'bg-blue-50 text-[#0066FF] border-blue-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-[#0066FF]/15 via-sky-500/10 to-transparent text-[#0066FF] ring-[#0066FF]/20',
          glowClass: 'bg-[#0066FF]/10',
          icon: <MailCheck className="w-8 h-8 text-[#0066FF] animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Okay', variant: 'primary' as const },
          defaultSecondary: undefined,
        };

      case 'code_sent':
        return {
          defaultTitle: 'Verification Code Sent',
          defaultMessage: 'If delivery succeeds, a verification code will be sent to your registered contact.',
          badge: badgeText || 'Security Code',
          badgeClass: 'bg-blue-50 text-[#0066FF] border-blue-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-[#0066FF]/15 via-sky-500/10 to-transparent text-[#0066FF] ring-[#0066FF]/20',
          glowClass: 'bg-[#0066FF]/10',
          icon: <Mail className="w-8 h-8 text-[#0066FF] animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Enter OTP', variant: 'primary' as const },
          defaultSecondary: undefined,
        };

      case 'verification_failed':
        return {
          defaultTitle: 'Verification Failed',
          defaultMessage: 'The code is invalid or has expired. Please check the code or request a new one.',
          badge: badgeText || 'Security Verification',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-rose-500/15 via-rose-500/10 to-transparent text-rose-600 ring-rose-500/20',
          glowClass: 'bg-rose-500/10',
          icon: <ShieldAlert className="w-8 h-8 text-rose-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Try Again', variant: 'primary' as const },
          defaultSecondary: { label: 'Resend Code', variant: 'secondary' as const },
        };

      case 'verification_success':
        return {
          defaultTitle: 'Verification Successful',
          defaultMessage: 'Your identity has been verified. You can now continue.',
          badge: badgeText || 'Identity Verified',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-transparent text-emerald-600 ring-emerald-500/20',
          glowClass: 'bg-emerald-500/10',
          icon: <ShieldCheck className="w-8 h-8 text-emerald-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Continue', variant: 'primary' as const },
          defaultSecondary: undefined,
        };

      case 'password_updated':
        return {
          defaultTitle: 'Password Updated',
          defaultMessage: 'Your password has been changed successfully. You can now sign in using your new password.',
          badge: badgeText || 'Password Updated',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-transparent text-emerald-600 ring-emerald-500/20',
          glowClass: 'bg-emerald-500/10',
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Back to Sign In', variant: 'primary' as const },
          defaultSecondary: undefined,
        };

      case 'google_connecting':
        return {
          defaultTitle: 'Connecting to Google',
          defaultMessage: 'Please wait while we securely authenticate your account.',
          badge: badgeText || 'Google Authentication',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-[#0066FF]/15 via-blue-500/10 to-transparent text-[#0066FF] ring-[#0066FF]/25',
          glowClass: 'bg-[#0066FF]/10',
          icon: (
            <div className="relative flex items-center justify-center">
              <GoogleGIcon />
              <div className="absolute -inset-2 rounded-full border-2 border-t-[#0066FF] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
          ),
          defaultPrimary: undefined,
          defaultSecondary: undefined,
        };

      case 'google_cancelled':
        return {
          defaultTitle: 'Sign-In Cancelled',
          defaultMessage: 'Google sign-in was cancelled. You can try again whenever you’re ready.',
          badge: badgeText || 'Google Sign-In',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-slate-200/60 via-slate-100 to-transparent text-slate-700 ring-slate-200',
          glowClass: 'bg-slate-300/10',
          icon: <Info className="w-8 h-8 text-slate-700 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Try Again', variant: 'primary' as const },
          defaultSecondary: undefined,
        };

      case 'google_error':
        return {
          defaultTitle: 'Google Sign-In Unsuccessful',
          defaultMessage: "We couldn't complete Google sign-in. Please try again.",
          badge: badgeText || 'Google Sign-In',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-rose-500/15 via-rose-500/10 to-transparent text-rose-600 ring-rose-500/20',
          glowClass: 'bg-rose-500/10',
          icon: <AlertOctagon className="w-8 h-8 text-rose-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Retry', variant: 'primary' as const },
          defaultSecondary: undefined,
        };

      case 'master_invalid':
        return {
          defaultTitle: 'Invalid Master ID',
          defaultMessage: 'The Master ID credentials provided are invalid. Access denied.',
          badge: badgeText || 'Administrative Access',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-rose-500/15 via-slate-900/10 to-transparent text-rose-600 ring-rose-500/20',
          glowClass: 'bg-rose-500/10',
          icon: <Key className="w-8 h-8 text-rose-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Try Again', variant: 'primary' as const },
          defaultSecondary: undefined,
        };

      case 'master_success':
        return {
          defaultTitle: 'Master Authentication Verified',
          defaultMessage: 'Granted executive access to the Admin Dashboard.',
          badge: badgeText || 'Master Admin',
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-indigo-500/15 via-blue-500/10 to-transparent text-indigo-600 ring-indigo-500/20',
          glowClass: 'bg-indigo-500/10',
          icon: <ShieldCheck className="w-8 h-8 text-indigo-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Continue to Admin Dashboard', variant: 'primary' as const },
          defaultSecondary: undefined,
        };

      case 'network_error':
        return {
          defaultTitle: 'Connection Problem',
          defaultMessage: "We couldn't connect to the server. Check your internet connection and try again.",
          badge: badgeText || 'Network Offline',
          badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-sky-500/15 via-blue-900/10 to-transparent text-sky-600 ring-sky-500/20',
          glowClass: 'bg-sky-500/10',
          icon: <WifiOff className="w-8 h-8 text-sky-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Retry', variant: 'primary' as const, icon: <RotateCcw className="w-4 h-4" /> },
          defaultSecondary: { label: 'Cancel', variant: 'secondary' as const },
        };

      case 'error':
        return {
          defaultTitle: 'Something Went Wrong',
          defaultMessage: "We couldn't complete your request right now. Please try again later.",
          badge: badgeText || 'Action Failed',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-rose-500/15 via-rose-500/10 to-transparent text-rose-600 ring-rose-500/20',
          glowClass: 'bg-rose-500/10',
          icon: <AlertOctagon className="w-8 h-8 text-rose-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Try Again', variant: 'primary' as const },
          defaultSecondary: undefined,
        };

      case 'warning':
        return {
          defaultTitle: 'Are You Sure?',
          defaultMessage: 'This action may affect your existing data.',
          badge: badgeText || 'Caution Required',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-transparent text-amber-600 ring-amber-500/20',
          glowClass: 'bg-amber-500/10',
          icon: <AlertTriangle className="w-8 h-8 text-amber-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Continue', variant: 'warning' as const },
          defaultSecondary: { label: 'Cancel', variant: 'secondary' as const },
        };

      case 'delete':
        return {
          defaultTitle: 'Delete This Item?',
          defaultMessage: 'This action cannot be undone.',
          badge: badgeText || 'Irreversible Action',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-rose-500/15 via-rose-500/10 to-transparent text-rose-600 ring-rose-500/20',
          glowClass: 'bg-rose-500/10',
          icon: <Trash2 className="w-8 h-8 text-rose-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Delete', variant: 'danger' as const },
          defaultSecondary: { label: 'Cancel', variant: 'secondary' as const },
        };

      case 'login_error':
        return {
          defaultTitle: 'Invalid Credentials',
          defaultMessage: 'Please check your ID and password and try again.',
          badge: badgeText || 'Authentication Failed',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-rose-500/15 via-slate-900/10 to-transparent text-rose-600 ring-rose-500/20',
          glowClass: 'bg-rose-500/10',
          icon: <LockKeyhole className="w-8 h-8 text-rose-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Try Again', variant: 'primary' as const },
          defaultSecondary: undefined,
        };

      case 'access_denied':
        return {
          defaultTitle: 'Access Denied',
          defaultMessage: "You don't have permission to access this section.",
          badge: badgeText || 'Restricted Area',
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-indigo-500/15 via-blue-900/10 to-transparent text-indigo-600 ring-indigo-500/20',
          glowClass: 'bg-indigo-500/10',
          icon: <ShieldAlert className="w-8 h-8 text-indigo-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'OK', variant: 'primary' as const },
          defaultSecondary: undefined,
        };

      case 'logout':
        return {
          defaultTitle: 'Logout?',
          defaultMessage: 'Are you sure you want to logout from WepSun Engineering Solution?',
          badge: badgeText || 'Sign Out Session',
          badgeClass: 'bg-orange-50 text-orange-700 border-orange-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-orange-500/15 via-rose-500/10 to-transparent text-orange-600 ring-orange-500/20',
          glowClass: 'bg-orange-500/10',
          icon: <LogOut className="w-8 h-8 text-orange-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Logout', variant: 'warning' as const },
          defaultSecondary: { label: 'Cancel', variant: 'secondary' as const },
        };

      case 'loading':
        return {
          defaultTitle: 'Please wait…',
          defaultMessage: 'Processing your request securely with WEPSUN Cloud Services.',
          badge: badgeText || 'Processing Action',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-[#0066FF]/15 via-blue-500/10 to-transparent text-[#0066FF] ring-[#0066FF]/25',
          glowClass: 'bg-[#0066FF]/10',
          icon: (
            <div className="relative flex items-center justify-center">
              <GeometricBlueWLogo className="w-9 h-7 animate-pulse" />
              <div className="absolute -inset-2 rounded-full border-2 border-t-[#0066FF] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
          ),
          defaultPrimary: undefined,
          defaultSecondary: undefined,
        };

      case 'update':
      case 'info':
      default:
        return {
          defaultTitle: type === 'update' ? 'New Update Available' : 'Information',
          defaultMessage:
            type === 'update'
              ? 'A new feature or service update is available for WepSun Engineering Solution.'
              : 'Here is an update regarding your system and elevator operations.',
          badge: badgeText || (type === 'update' ? 'System Release' : 'Notice'),
          badgeClass: 'bg-blue-50 text-[#0066FF] border-blue-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-[#0066FF]/15 via-sky-500/10 to-transparent text-[#0066FF] ring-[#0066FF]/20',
          glowClass: 'bg-[#0066FF]/10',
          icon: type === 'update' ? (
            <Sparkles className="w-8 h-8 text-[#0066FF] animate-in zoom-in duration-300" strokeWidth={2.2} />
          ) : (
            <Info className="w-8 h-8 text-[#0066FF] animate-in zoom-in duration-300" strokeWidth={2.2} />
          ),
          defaultPrimary: { label: type === 'update' ? 'View Details' : 'Continue', variant: 'primary' as const },
          defaultSecondary: type === 'update' ? { label: 'Later', variant: 'secondary' as const } : undefined,
        };
    }
  };

  const config = getTypeConfig();
  const effectiveTitle = title || config.defaultTitle;
  const effectiveMessage = message !== undefined ? message : config.defaultMessage;
  const effectivePrimary = primaryAction || config.defaultPrimary;
  const effectiveSecondary = secondaryAction || config.defaultSecondary;

  const handleActionClick = async (action?: WepsunModalAction) => {
    if (!action) return;
    try {
      if (action.onClick) {
        setIsActionLoading(true);
        await action.onClick();
      }
      if (onClose) {
        onClose();
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const renderButton = (action: WepsunModalAction, isPrimary = false, refProp?: React.RefObject<HTMLButtonElement | null>) => {
    const variant = action.variant || (isPrimary ? 'primary' : 'secondary');

    let btnClass = 'w-full py-3.5 px-5 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-xs active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ';

    if (variant === 'primary') {
      btnClass += 'bg-[#0066FF] hover:bg-[#0052cc] text-white shadow-blue-500/20 hover:shadow-blue-500/30';
    } else if (variant === 'danger') {
      btnClass += 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20 hover:shadow-rose-500/30';
    } else if (variant === 'warning') {
      btnClass += 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20 hover:shadow-amber-500/30';
    } else if (variant === 'outline') {
      btnClass += 'border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700';
    } else {
      // secondary
      btnClass += 'border border-slate-200/90 hover:border-slate-300 bg-slate-100/90 hover:bg-slate-200/90 text-slate-700';
    }

    return (
      <button
        ref={refProp}
        key={action.label}
        type="button"
        disabled={isActionLoading || action.isLoading}
        onClick={() => handleActionClick(action)}
        className={btnClass}
      >
        {isActionLoading || action.isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          action.icon
        )}
        <span>{action.label}</span>
      </button>
    );
  };

  const isDismissible = showCloseButton && onClose && type !== 'loading' && type !== 'google_connecting';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wepsun-modal-title"
      className={`fixed inset-0 z-[99990] flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none transition-all duration-250 ease-out ${
        isAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Semi-transparent dark overlay with soft background blur */}
      <div
        onClick={() => {
          if (closeOnBackdropClick && onClose && type !== 'loading' && type !== 'google_connecting') {
            onClose();
          }
        }}
        className={`fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity duration-250 ease-out ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Modal Surface Card */}
      <div
        ref={modalContainerRef}
        className={`relative z-10 w-full max-w-[390px] sm:max-w-[430px] bg-white border border-slate-200/90 rounded-[28px] shadow-[0_25px_60px_-15px_rgba(11,37,69,0.35)] p-6 sm:p-7 overflow-hidden text-center transition-all duration-250 ease-out transform ${
          isAnimating ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-3 opacity-0'
        } ${className}`}
      >
        {/* Subtle Ambient Radial Glow */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${config.glowClass}`} />

        {/* Top Floating Close Button */}
        {isDismissible && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer z-20 active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header Branding + State Icon Container */}
        <div className="relative flex flex-col items-center justify-center pt-1 mb-4">
          {/* Subtle Mini Top Brand Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/60 mb-3.5 shadow-2xs">
            <GeometricBlueWLogo className="w-3.5 h-3 shrink-0" />
            <span className="text-[10px] font-black tracking-wider text-[#0b2545] uppercase">WEPSUN</span>
            <span className="text-slate-300">•</span>
            <span className={`text-[9.5px] font-bold uppercase tracking-wider ${config.badgeClass} px-1.5 py-0.2 rounded-md`}>
              {config.badge}
            </span>
          </div>

          {/* Large Animated State Icon Circle */}
          <div
            className={`w-16 h-16 sm:w-18 sm:h-18 rounded-3xl flex items-center justify-center ring-8 transition-transform duration-300 ${config.iconWrapperClass} shadow-sm`}
          >
            {customIcon || config.icon}
          </div>
        </div>

        {/* Modal Typography (Strong Title & Short Supporting Message) */}
        <div className="space-y-2 mb-6">
          <h3
            id="wepsun-modal-title"
            className="text-lg sm:text-xl font-black tracking-tight text-[#0b2545] leading-snug"
          >
            {effectiveTitle}
          </h3>
          {effectiveMessage && (
            <div className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed max-w-[320px] mx-auto">
              {effectiveMessage}
            </div>
          )}
        </div>

        {/* Custom Body Content (if provided) */}
        {children && <div className="mb-6 text-left">{children}</div>}

        {/* Modal Actions / Buttons Layout */}
        {(effectivePrimary || effectiveSecondary || tertiaryAction) && (
          <div className="space-y-2.5 pt-1">
            {effectivePrimary && renderButton(effectivePrimary, true, primaryButtonRef)}
            {effectiveSecondary && renderButton(effectiveSecondary, false)}
            {tertiaryAction && renderButton(tertiaryAction, false)}
          </div>
        )}
      </div>
    </div>
  );
};

export default WepsunModal;
