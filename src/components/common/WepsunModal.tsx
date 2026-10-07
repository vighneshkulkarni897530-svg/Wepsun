import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Trash2,
  LockKeyhole,
  ShieldAlert,
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
} from 'lucide-react';
import { GeometricBlueWLogo, WepsunLogoIcon } from './WepsunLogo';

export type WepsunModalType =
  | 'success'
  | 'error'
  | 'warning'
  | 'delete'
  | 'login_error'
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

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const timer = setTimeout(() => setIsAnimating(true), 15);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsRendered(false), 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && autoCloseMs && autoCloseMs > 0 && onClose) {
      const autoTimer = setTimeout(() => {
        onClose();
      }, autoCloseMs);
      return () => clearTimeout(autoTimer);
    }
  }, [isOpen, autoCloseMs, onClose]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onClose && closeOnBackdropClick) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, closeOnBackdropClick]);

  if (!isRendered) return null;

  // Defaults based on modal type
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          defaultTitle: 'Successfully Saved!',
          defaultMessage: 'Your changes have been saved successfully.',
          badge: badgeText || 'Operation Complete',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-transparent text-emerald-600 ring-emerald-500/20',
          glowClass: 'bg-emerald-500/10',
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Continue', variant: 'primary' as const },
        };

      case 'error':
        return {
          defaultTitle: 'Something Went Wrong',
          defaultMessage: "We couldn't complete your request. Please try again.",
          badge: badgeText || 'Action Failed',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-rose-500/15 via-rose-500/10 to-transparent text-rose-600 ring-rose-500/20',
          glowClass: 'bg-rose-500/10',
          icon: <AlertOctagon className="w-8 h-8 text-rose-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Try Again', variant: 'primary' as const },
          defaultSecondary: { label: 'Cancel', variant: 'secondary' as const },
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
        };

      case 'network_error':
        return {
          defaultTitle: 'No Internet Connection',
          defaultMessage: 'Please check your internet connection and try again.',
          badge: badgeText || 'Network Offline',
          badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-sky-500/15 via-blue-900/10 to-transparent text-sky-600 ring-sky-500/20',
          glowClass: 'bg-sky-500/10',
          icon: <WifiOff className="w-8 h-8 text-sky-600 animate-in zoom-in duration-300" strokeWidth={2.2} />,
          defaultPrimary: { label: 'Retry', variant: 'primary' as const, icon: <RotateCcw className="w-4 h-4" /> },
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
          defaultMessage: 'Processing your request securely with WepSun Cloud Services.',
          badge: badgeText || 'Processing Action',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
          iconWrapperClass: 'bg-gradient-to-br from-[#0066FF]/15 via-blue-500/10 to-transparent text-[#0066FF] ring-[#0066FF]/25',
          glowClass: 'bg-[#0066FF]/10',
          icon: (
            <div className="relative flex items-center justify-center">
              <GeometricBlueWLogo className="w-9 h-7 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-2 border-t-[#0066FF] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
          ),
          defaultPrimary: undefined,
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

  const renderButton = (action: WepsunModalAction, isPrimary = false) => {
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
      btnClass += 'border border-slate-200/90 hover:border-slate-300 bg-slate-100/80 hover:bg-slate-200/80 text-slate-700';
    }

    return (
      <button
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
          if (closeOnBackdropClick && onClose && type !== 'loading') {
            onClose();
          }
        }}
        className={`fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity duration-250 ease-out ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Modal Surface Card */}
      <div
        className={`relative z-10 w-full max-w-[380px] sm:max-w-[420px] bg-white border border-slate-200/90 rounded-[28px] shadow-[0_25px_60px_-15px_rgba(11,37,69,0.35)] p-6 sm:p-7 overflow-hidden text-center transition-all duration-250 ease-out transform ${
          isAnimating ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-3 opacity-0'
        } ${className}`}
      >
        {/* Subtle Ambient Radial Glow */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${config.glowClass}`} />

        {/* Top Floating Close Button */}
        {showCloseButton && onClose && type !== 'loading' && (
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
            {effectivePrimary && renderButton(effectivePrimary, true)}
            {effectiveSecondary && renderButton(effectiveSecondary, false)}
            {tertiaryAction && renderButton(tertiaryAction, false)}
          </div>
        )}
      </div>
    </div>
  );
};

export default WepsunModal;
