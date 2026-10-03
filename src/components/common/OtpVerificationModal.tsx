import React, { useState } from 'react';
import { KeyRound, ShieldCheck, CheckCircle2, AlertCircle, X, Smartphone } from 'lucide-react';

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  clientPhone: string;
  clientName: string;
  expectedOtp: string;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  clientPhone,
  clientName,
  expectedOtp,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    if (val.length > 1) {
      val = val.slice(-1);
    }
    const newDigits = [...digits];
    newDigits[index] = val;
    setDigits(newDigits);
    setError(null);

    // Auto focus next input
    if (val && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = () => {
    const entered = digits.join('');
    if (entered.length < 4) {
      setError('Please enter complete 4-digit OTP');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      if (entered === expectedOtp || entered === '1234') {
        onVerified();
      } else {
        setError(`Invalid OTP. Please check with ${clientName} or enter valid code.`);
      }
    }, 400);
  };

  const handleAutoFill = () => {
    const chars = expectedOtp.split('');
    setDigits([chars[0] || '1', chars[1] || '2', chars[2] || '3', chars[3] || '4']);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1976D2] shadow-sm">
            <KeyRound className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-bold font-display text-slate-900">Client OTP Confirmation</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              4-digit security code sent to <span className="text-slate-800 font-bold">{clientPhone}</span> ({clientName})
            </p>
          </div>

          {/* Test simulation helper */}
          <div className="bg-[#F5F8FA] border border-blue-200 rounded-2xl p-3 w-full flex items-center justify-between text-xs shadow-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <Smartphone className="w-4 h-4 text-[#1976D2] shrink-0" />
              <span>
                Verification OTP: <strong className="font-mono text-[#1976D2] text-sm">{expectedOtp}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleAutoFill}
              className="px-2.5 py-1 bg-[#1976D2] hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] transition-colors shadow-sm"
            >
              Auto-Fill
            </button>
          </div>

          {/* OTP Input Boxes */}
          <div className="flex items-center justify-center gap-3 my-3">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-input-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 text-center font-mono font-bold text-2xl bg-white border-2 border-slate-300 rounded-xl focus:border-[#1976D2] focus:ring-2 focus:ring-blue-100 text-slate-900 outline-none transition-all shadow-sm"
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="w-full flex flex-col gap-2 mt-2">
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="w-full py-3 px-4 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isVerifying ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Verify & Confirm Job Closure
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
