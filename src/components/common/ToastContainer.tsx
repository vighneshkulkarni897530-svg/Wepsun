import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, Info, AlertOctagon, X, Zap } from 'lucide-react';
import { playNotificationSound } from '../../utils/notificationSound';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  // Play subtle chime on toast appearance
  useEffect(() => {
    if (toasts.length > 0) {
      const latest = toasts[toasts.length - 1];
      if (latest.type === 'emergency') {
        playNotificationSound('urgent');
      } else if (latest.type === 'success') {
        playNotificationSound('success');
      } else {
        playNotificationSound('standard');
      }
    }
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        const isEmergency = toast.type === 'emergency';
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden flex items-start gap-3.5 p-4 sm:p-4.5 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 animate-slide-in ${
              isEmergency
                ? 'bg-rose-950/95 border-rose-500/80 text-white shadow-rose-900/40 ring-1 ring-rose-500/40'
                : isSuccess
                ? 'bg-slate-900/95 border-emerald-500/60 text-white shadow-emerald-950/40'
                : isError
                ? 'bg-slate-900/95 border-rose-500/60 text-white shadow-rose-950/40'
                : isWarning
                ? 'bg-slate-900/95 border-amber-500/60 text-white shadow-amber-950/40'
                : 'bg-slate-900/95 border-blue-500/60 text-white shadow-slate-950/40'
            }`}
          >
            {/* Left Category Icon */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border shadow-2xs ${
                isEmergency
                  ? 'bg-rose-600/30 border-rose-500/50 text-rose-300'
                  : isSuccess
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  : isError
                  ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                  : isWarning
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                  : 'bg-blue-500/20 border-blue-500/30 text-blue-400'
              }`}
            >
              {isEmergency && <AlertOctagon className="w-5 h-5 text-rose-300 animate-bounce" />}
              {isSuccess && <CheckCircle2 className="w-5 h-5" />}
              {isError && <AlertTriangle className="w-5 h-5" />}
              {isWarning && <AlertTriangle className="w-5 h-5" />}
              {!isEmergency && !isSuccess && !isError && !isWarning && <Info className="w-5 h-5" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold tracking-tight text-white leading-tight">
                  {toast.title}
                </span>
                {isEmergency && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-rose-600 text-white animate-pulse">
                    CRITICAL
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toast.message}</p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Subtle Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
              <div
                className={`h-full animate-toast-progress ${
                  isEmergency
                    ? 'bg-rose-500'
                    : isSuccess
                    ? 'bg-emerald-400'
                    : isError
                    ? 'bg-rose-400'
                    : isWarning
                    ? 'bg-amber-400'
                    : 'bg-blue-400'
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
