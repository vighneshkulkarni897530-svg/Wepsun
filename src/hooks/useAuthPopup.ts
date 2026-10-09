import { useApp } from '../context/AppContext';
import type { WepsunModalOptions } from '../components/common/WepsunModal';

export interface UseAuthPopupReturn {
  showPopup: (options: WepsunModalOptions) => void;
  closePopup: () => void;
  showAccountNotFound: (opts?: { email?: string; onCreateAccount?: () => void; onTryAgain?: () => void }) => void;
  showIncorrectPassword: (opts?: { onTryAgain?: () => void; onForgotPassword?: () => void }) => void;
  showSignInSuccess: (opts?: { name?: string; role?: string; onContinue?: () => void }) => void;
  showInvalidEmail: (opts?: { onOk?: () => void }) => void;
  showMissingFields: (opts?: { message?: string; onOk?: () => void }) => void;
  showTooManyAttempts: (opts?: { waitTimeSeconds?: number; onOk?: () => void }) => void;
  showConnectionProblem: (opts?: { onRetry?: () => void; onCancel?: () => void }) => void;
  showSomethingWentWrong: (opts?: { message?: string; onTryAgain?: () => void }) => void;
  showAccountCreatedSuccess: (opts?: { onContinue?: () => void }) => void;
  showEmailAlreadyExists: (opts?: { email?: string; onSignIn?: () => void; onForgotPassword?: () => void }) => void;
  showPasswordRequirements: (opts?: { onOk?: () => void }) => void;
  showPasswordMismatch: (opts?: { onTryAgain?: () => void }) => void;
  showAgreementRequired: (opts?: { onOk?: () => void }) => void;
  showRegistrationFailed: (opts?: { message?: string; onRetry?: () => void }) => void;
  showCheckInbox: (opts?: { onOk?: () => void }) => void;
  showOtpSent: (opts?: { maskedContact?: string; onEnterOtp?: () => void }) => void;
  showVerificationFailed: (opts?: { onTryAgain?: () => void; onResendCode?: () => void }) => void;
  showVerificationSuccess: (opts?: { onContinue?: () => void }) => void;
  showPasswordResetSuccess: (opts?: { onSignIn?: () => void }) => void;
  showGoogleConnecting: () => void;
  showGoogleCancelled: (opts?: { onTryAgain?: () => void }) => void;
  showGoogleFailed: (opts?: { error?: string; onRetry?: () => void }) => void;
  showGoogleSuccess: (opts?: { name?: string; onContinue?: () => void }) => void;
  showMasterInvalid: (opts?: { onTryAgain?: () => void }) => void;
  showMasterSuccess: (opts?: { name?: string; onContinue?: () => void }) => void;
}

export const useAuthPopup = (): UseAuthPopupReturn => {
  const { openModal, closeModal } = useApp();

  const showPopup = (options: WepsunModalOptions) => {
    openModal(options);
  };

  const closePopup = () => {
    closeModal();
  };

  const showAccountNotFound = (opts?: { email?: string; onCreateAccount?: () => void; onTryAgain?: () => void }) => {
    openModal({
      type: 'account_not_found',
      title: 'Account Not Found',
      message: "We couldn't find an account associated with this email address. Please check your email or create a new account to continue.",
      primaryAction: {
        label: 'Create Account',
        variant: 'primary',
        onClick: opts?.onCreateAccount,
      },
      secondaryAction: {
        label: 'Try Again',
        variant: 'secondary',
        onClick: opts?.onTryAgain,
      },
    });
  };

  const showIncorrectPassword = (opts?: { onTryAgain?: () => void; onForgotPassword?: () => void }) => {
    openModal({
      type: 'incorrect_password',
      title: 'Incorrect Password',
      message: 'The password you entered is incorrect. Please try again or reset your password.',
      primaryAction: {
        label: 'Try Again',
        variant: 'primary',
        onClick: opts?.onTryAgain,
      },
      secondaryAction: {
        label: 'Forgot Password',
        variant: 'secondary',
        onClick: opts?.onForgotPassword,
      },
    });
  };

  const showSignInSuccess = (opts?: { name?: string; role?: string; onContinue?: () => void }) => {
    openModal({
      type: 'success',
      title: 'Welcome Back!',
      message: 'You have successfully signed in to your WEPSUN account.',
      badgeText: 'Authentication Successful',
      primaryAction: {
        label: 'Continue',
        variant: 'primary',
        onClick: opts?.onContinue,
      },
    });
  };

  const showInvalidEmail = (opts?: { onOk?: () => void }) => {
    openModal({
      type: 'invalid_email',
      title: 'Check Your Email',
      message: 'Please enter a valid email address.',
      primaryAction: {
        label: 'Okay',
        variant: 'primary',
        onClick: opts?.onOk,
      },
    });
  };

  const showMissingFields = (opts?: { message?: string; onOk?: () => void }) => {
    openModal({
      type: 'missing_fields',
      title: 'Complete All Fields',
      message: opts?.message || 'Please enter your email address and password to continue.',
      primaryAction: {
        label: 'Okay',
        variant: 'primary',
        onClick: opts?.onOk,
      },
    });
  };

  const showTooManyAttempts = (opts?: { waitTimeSeconds?: number; onOk?: () => void }) => {
    const message =
      opts?.waitTimeSeconds && opts.waitTimeSeconds > 0
        ? `You've made too many sign-in attempts. Please wait ${opts.waitTimeSeconds} seconds before trying again.`
        : "You've made too many sign-in attempts. Please wait before trying again.";

    openModal({
      type: 'too_many_attempts',
      title: 'Too Many Attempts',
      message,
      primaryAction: {
        label: 'Okay',
        variant: 'primary',
        onClick: opts?.onOk,
      },
    });
  };

  const showConnectionProblem = (opts?: { onRetry?: () => void; onCancel?: () => void }) => {
    openModal({
      type: 'network_error',
      title: 'Connection Problem',
      message: "We couldn't connect to the server. Check your internet connection and try again.",
      primaryAction: {
        label: 'Retry',
        variant: 'primary',
        onClick: opts?.onRetry,
      },
      secondaryAction: {
        label: 'Cancel',
        variant: 'secondary',
        onClick: opts?.onCancel,
      },
    });
  };

  const showSomethingWentWrong = (opts?: { message?: string; onTryAgain?: () => void }) => {
    openModal({
      type: 'error',
      title: 'Something Went Wrong',
      message: opts?.message || "We couldn't complete your request right now. Please try again later.",
      primaryAction: {
        label: 'Try Again',
        variant: 'primary',
        onClick: opts?.onTryAgain,
      },
    });
  };

  const showAccountCreatedSuccess = (opts?: { onContinue?: () => void }) => {
    openModal({
      type: 'success',
      title: 'Welcome to WEPSUN!',
      message: 'Your account has been created successfully.',
      badgeText: 'Registration Complete',
      primaryAction: {
        label: 'Continue',
        variant: 'primary',
        onClick: opts?.onContinue,
      },
    });
  };

  const showEmailAlreadyExists = (opts?: { email?: string; onSignIn?: () => void; onForgotPassword?: () => void }) => {
    openModal({
      type: 'email_exists',
      title: 'Account Already Exists',
      message: 'An account with this email may already exist. Try signing in or use password recovery.',
      primaryAction: {
        label: 'Sign In',
        variant: 'primary',
        onClick: opts?.onSignIn,
      },
      secondaryAction: {
        label: 'Forgot Password',
        variant: 'secondary',
        onClick: opts?.onForgotPassword,
      },
    });
  };

  const showPasswordRequirements = (opts?: { onOk?: () => void }) => {
    openModal({
      type: 'password_requirements',
      title: 'Password Requirements',
      message: 'Please create a password that meets all the security requirements.',
      primaryAction: {
        label: 'Okay',
        variant: 'primary',
        onClick: opts?.onOk,
      },
    });
  };

  const showPasswordMismatch = (opts?: { onTryAgain?: () => void }) => {
    openModal({
      type: 'password_mismatch',
      title: "Passwords Don't Match",
      message: 'Your password and confirmation password must match.',
      primaryAction: {
        label: 'Try Again',
        variant: 'primary',
        onClick: opts?.onTryAgain,
      },
    });
  };

  const showAgreementRequired = (opts?: { onOk?: () => void }) => {
    openModal({
      type: 'terms_required',
      title: 'Agreement Required',
      message: 'Please accept the Terms and Conditions and Privacy Policy to create your account.',
      primaryAction: {
        label: 'Okay',
        variant: 'primary',
        onClick: opts?.onOk,
      },
    });
  };

  const showRegistrationFailed = (opts?: { message?: string; onRetry?: () => void }) => {
    openModal({
      type: 'registration_failed',
      title: 'Registration Unsuccessful',
      message: opts?.message || "We couldn't create your account. Please review your information and try again.",
      primaryAction: {
        label: 'Retry',
        variant: 'primary',
        onClick: opts?.onRetry,
      },
    });
  };

  const showCheckInbox = (opts?: { onOk?: () => void }) => {
    openModal({
      type: 'check_inbox',
      title: 'Check Your Inbox',
      message: "If the email is eligible for password recovery, you'll receive instructions shortly.",
      primaryAction: {
        label: 'Okay',
        variant: 'primary',
        onClick: opts?.onOk,
      },
    });
  };

  const showOtpSent = (opts?: { maskedContact?: string; onEnterOtp?: () => void }) => {
    const message = opts?.maskedContact
      ? `If delivery succeeds, a verification code will be sent to ${opts.maskedContact}.`
      : 'If delivery succeeds, a verification code will be sent to your registered contact.';

    openModal({
      type: 'code_sent',
      title: 'Verification Code Sent',
      message,
      primaryAction: {
        label: 'Enter OTP',
        variant: 'primary',
        onClick: opts?.onEnterOtp,
      },
    });
  };

  const showVerificationFailed = (opts?: { onTryAgain?: () => void; onResendCode?: () => void }) => {
    openModal({
      type: 'verification_failed',
      title: 'Verification Failed',
      message: 'The code is invalid or has expired. Please check the code or request a new one.',
      primaryAction: {
        label: 'Try Again',
        variant: 'primary',
        onClick: opts?.onTryAgain,
      },
      secondaryAction: {
        label: 'Resend Code',
        variant: 'secondary',
        onClick: opts?.onResendCode,
      },
    });
  };

  const showVerificationSuccess = (opts?: { onContinue?: () => void }) => {
    openModal({
      type: 'verification_success',
      title: 'Verification Successful',
      message: 'Your identity has been verified. You can now continue.',
      primaryAction: {
        label: 'Continue',
        variant: 'primary',
        onClick: opts?.onContinue,
      },
    });
  };

  const showPasswordResetSuccess = (opts?: { onSignIn?: () => void }) => {
    openModal({
      type: 'password_updated',
      title: 'Password Updated',
      message: 'Your password has been changed successfully. You can now sign in using your new password.',
      primaryAction: {
        label: 'Back to Sign In',
        variant: 'primary',
        onClick: opts?.onSignIn,
      },
    });
  };

  const showGoogleConnecting = () => {
    openModal({
      type: 'google_connecting',
      title: 'Connecting to Google',
      message: 'Please wait while we securely authenticate your account.',
      showCloseButton: false,
      closeOnBackdropClick: false,
    });
  };

  const showGoogleCancelled = (opts?: { onTryAgain?: () => void }) => {
    openModal({
      type: 'google_cancelled',
      title: 'Sign-In Cancelled',
      message: 'Google sign-in was cancelled. You can try again whenever you’re ready.',
      primaryAction: {
        label: 'Try Again',
        variant: 'primary',
        onClick: opts?.onTryAgain,
      },
    });
  };

  const showGoogleFailed = (opts?: { error?: string; onRetry?: () => void }) => {
    openModal({
      type: 'google_error',
      title: 'Google Sign-In Unsuccessful',
      message: opts?.error || "We couldn't complete Google sign-in. Please try again.",
      primaryAction: {
        label: 'Retry',
        variant: 'primary',
        onClick: opts?.onRetry,
      },
    });
  };

  const showGoogleSuccess = (opts?: { name?: string; onContinue?: () => void }) => {
    openModal({
      type: 'google_success',
      title: 'Welcome to WEPSUN!',
      message: 'You have successfully authenticated with Google.',
      primaryAction: {
        label: 'Continue',
        variant: 'primary',
        onClick: opts?.onContinue,
      },
    });
  };

  const showMasterInvalid = (opts?: { onTryAgain?: () => void }) => {
    openModal({
      type: 'master_invalid',
      title: 'Invalid Master ID',
      message: 'The Master ID credentials provided are invalid. Access denied.',
      primaryAction: {
        label: 'Try Again',
        variant: 'primary',
        onClick: opts?.onTryAgain,
      },
    });
  };

  const showMasterSuccess = (opts?: { name?: string; onContinue?: () => void }) => {
    openModal({
      type: 'master_success',
      title: 'Master Authentication Verified',
      message: `Welcome, ${opts?.name || 'Executive Admin'}! Granted executive access to the Admin Dashboard.`,
      primaryAction: {
        label: 'Continue to Admin Dashboard',
        variant: 'primary',
        onClick: opts?.onContinue,
      },
    });
  };

  return {
    showPopup,
    closePopup,
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
  };
};
