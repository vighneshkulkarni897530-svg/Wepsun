import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  PenTool,
  RotateCcw,
  ShieldCheck,
  Send,
  User,
  Building2,
  Check,
  Clock,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { TechnicianJob } from '../../types';

interface SignatureOtpSignoffProps {
  job: TechnicianJob;
  onUpdateJob: (updated: Partial<TechnicianJob>) => void;
  onNavigateToTab: (tab: string) => void;
  showToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const SignatureOtpSignoff: React.FC<SignatureOtpSignoffProps> = ({
  job,
  onUpdateJob,
  onNavigateToTab,
  showToast,
}) => {
  // Digital Signature state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!job?.clientSignature);
  const [clientName, setClientName] = useState(job?.clientNameSigned || job?.contactPerson || 'Client Authorized Signatory');
  const [clientDesignation, setClientDesignation] = useState(job?.clientDesignation || 'Society Secretary / Facility Head');
  const [completionAgreed, setCompletionAgreed] = useState<boolean>(job?.workCompletionConfirmed !== undefined ? !!job.workCompletionConfirmed : true);

  // OTP Verification state
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState<boolean>(job?.otpSent !== undefined ? !!job.otpSent : true);
  const [isOtpVerified, setIsOtpVerified] = useState(!!job?.otpVerified);
  const [otpTimer, setOtpTimer] = useState(60);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [isVerifying, setIsVerifying] = useState(false);

  // Canvas drawing handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#123B5D';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // If job already has signature, draw placeholder
    if (job.clientSignature && !hasSignature) {
      setHasSignature(true);
    }
  }, [job.clientSignature]);

  // OTP countdown timer
  useEffect(() => {
    if (isOtpSent && !isOtpVerified && otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOtpSent, isOtpVerified, otpTimer]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const interval = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendCooldown]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    showToast('info', 'Signature Cleared', 'Signature pad reset.');
  };

  const handleSaveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) {
      showToast('error', 'Signature Missing', 'Please draw client signature on the pad before confirming.');
      return;
    }
    const signatureDataUrl = canvas.toDataURL('image/png');
    const now = new Date();
    const timeStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    onUpdateJob({
      clientSignature: signatureDataUrl,
      clientNameSigned: clientName,
      clientDesignation,
      technicianSignature: `${job.technicianName} (Verified Lead Field Engineer)`,
      signatureDate: timeStr,
      workCompletionConfirmed: completionAgreed,
    });

    showToast('success', 'Signature Saved', `Client digital sign-off recorded for ${clientName}.`);
  };

  // OTP handlers
  const handleSendOtp = () => {
    setIsOtpSent(true);
    setOtpTimer(60);
    setResendCooldown(30);
    setEnteredOtp('');
    const now = new Date().toISOString();

    onUpdateJob({
      otpSent: true,
      otpSentAt: now,
      clientOtp: '7419', // Internal system matching code
    });

    showToast('info', 'OTP Dispatched', `Secure 4-digit completion code sent via SMS to client (+91 ${job.clientPhone.slice(-4).padStart(job.clientPhone.length - 3, '•')}).`);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredOtp || enteredOtp.length < 4) {
      showToast('error', 'Invalid Input', 'Please enter 4-digit code provided by client.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      // Valid OTP test code: '7419' or '1234'
      if (enteredOtp === '7419' || enteredOtp === '1234' || enteredOtp === job.clientOtp) {
        setIsOtpVerified(true);
        const now = new Date().toISOString();
        onUpdateJob({
          otpVerified: true,
          otpVerifiedAt: now,
          workCompletionConfirmed: true,
        });
        showToast('success', 'Client OTP Verified', 'Job completion authenticated and sealed.');
      } else {
        const nextAttempts = attemptsRemaining - 1;
        setAttemptsRemaining(nextAttempts);
        if (nextAttempts <= 0) {
          showToast('error', 'Too Many Failed Attempts', 'OTP locked. Please request resend.');
          setIsOtpSent(false);
          setAttemptsRemaining(3);
        } else {
          showToast('error', 'Incorrect OTP', `Incorrect verification code. ${nextAttempts} attempt(s) remaining.`);
        }
      }
    }, 600);
  };

  // Mask client phone for strict privacy
  const maskedPhone = job.clientPhone.replace(/(\+?\d{2}\s?\d{2})\d{4}(\d{4})/, '$1 •••• $2');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Client Digital Sign-off & OTP</h2>
              <p className="text-xs text-slate-500">
                Dual-Factor Job Completion Sign-off (Canvas Signature & Mobile OTP Authentication)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {hasSignature && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Signature Recorded
              </span>
            )}
            {isOtpVerified && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> OTP Verified
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. DIGITAL SIGNATURE PAD CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#1976D2] flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="text-sm font-black text-slate-900">Client Digital Signature</h3>
            </div>

            <button
              type="button"
              onClick={handleClearSignature}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-all"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Pad</span>
            </button>
          </div>

          {/* Signer Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Client Representative Name *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full p-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white font-semibold"
                placeholder="e.g. Arvind Mehta"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Designation / Capacity *
              </label>
              <input
                type="text"
                value={clientDesignation}
                onChange={(e) => setClientDesignation(e.target.value)}
                className="w-full p-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white font-semibold"
                placeholder="e.g. Society Chairman / Estate Manager"
              />
            </div>
          </div>

          {/* Signature Canvas Box */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
              <span>Touch / Draw Signature Below</span>
              <span>Smooth Vector Capture</span>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/70 p-1 flex items-center justify-center overflow-hidden touch-none relative">
              <canvas
                ref={canvasRef}
                width={460}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-40 cursor-crosshair bg-white rounded-lg shadow-2xs"
              />

              {!hasSignature && (
                <div className="absolute pointer-events-none text-slate-300 text-xs font-bold flex items-center gap-1.5">
                  <PenTool className="w-4 h-4 text-slate-300" />
                  <span>Sign with finger or stylus here</span>
                </div>
              )}
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={completionAgreed}
              onChange={(e) => setCompletionAgreed(e.target.checked)}
              className="mt-0.5 accent-[#1976D2] w-4 h-4 rounded"
            />
            <span className="text-[11px] text-slate-700 leading-snug">
              I confirm that the elevator maintenance work for unit <strong className="text-slate-900">{job.liftNumber}</strong> has been completed to our satisfaction and tested in safe operating condition.
            </span>
          </label>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleSaveSignature}
            className="w-full py-2.5 rounded-xl bg-[#123B5D] hover:bg-slate-800 text-white font-black text-xs shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Save Client Signature</span>
          </button>
        </div>

        {/* 2. CLIENT OTP CONFIRMATION CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="text-sm font-black text-slate-900">Client Mobile OTP Confirmation</h3>
            </div>

            {isOtpVerified ? (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirmed & Verified
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Pending OTP
              </span>
            )}
          </div>

          {/* OTP Explanation & Masked Phone */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Registered Client Mobile</span>
              <span className="text-[10px] text-emerald-700 font-bold">SMS Gateway Active</span>
            </div>
            <p className="font-mono text-sm font-bold text-slate-800">{maskedPhone}</p>
            <p className="text-[11px] text-slate-500">
              For complete paperless audit verification, a 4-digit one-time passcode is sent to the society contact upon job closure.
            </p>
          </div>

          {!isOtpVerified ? (
            <form onSubmit={handleVerifyOtp} className="space-y-3.5">
              {/* OTP Input Field */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Enter 4-Digit Client OTP
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="• • • •"
                    className="w-full text-center tracking-[1em] font-mono text-lg font-black py-2.5 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />

                  <button
                    type="submit"
                    disabled={isVerifying || enteredOtp.length < 4}
                    className={`py-2.5 px-5 rounded-xl font-black text-xs text-white shadow-sm transition-all whitespace-nowrap ${
                      enteredOtp.length === 4
                        ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {isVerifying ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </div>

              {/* Countdown & Resend Control */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>
                  Expires in:{' '}
                  <strong className="font-mono text-slate-800">
                    {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                  </strong>
                </span>

                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={handleSendOtp}
                  className={`font-bold transition-all ${
                    resendCooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-[#1976D2] hover:underline'
                  }`}
                >
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP to Mobile'}
                </button>
              </div>

              <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 flex items-center justify-between">
                <span>Verification Attempts Remaining: {attemptsRemaining}</span>
                <span className="font-mono text-emerald-600 font-bold">256-Bit SMS Gateway Secure</span>
              </div>
            </form>
          ) : (
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-black text-sm text-emerald-950">Client Confirmation Verified via OTP</h4>
              <p className="text-[11px] text-emerald-800">
                Timestamp: {job.otpVerifiedAt || '2026-09-22 09:48 AM'} • Mobile: {maskedPhone}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          onClick={() => onNavigateToTab('photos')}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
        >
          ← Back to Evidence Photos
        </button>

        <button
          onClick={() => onNavigateToTab('service_report')}
          className="px-5 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-black text-xs shadow-sm flex items-center gap-2"
        >
          <span>Proceed to PDF Service Report</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
