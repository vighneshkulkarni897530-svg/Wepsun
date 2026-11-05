import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, Info, AlertOctagon, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <aside
      aria-label="Status Notifications"
      aria-live="polite"
      className="fixed top-3 sm:top-5 left-3 sm:left-auto right-3 sm:right-5 z-[999] flex flex-col gap-2.5 max-w-sm w-full mx-auto sm:mx-0 pointer-events-none select-none safe-top"
    >
      {toasts.map((toast) => {
        const isEmergency = toast.type === 'emergency';
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl shadow-xl backdrop-blur-xl border transition-all duration-300 animate-in slide-in-from-top-3 fade-in ${
              isEmergency
                ? 'bg-rose-950/95 border-rose-500/80 text-white shadow-rose-950/40'
                : isSuccess
                ? 'bg-slate-900/95 border-emerald-500/70 text-white shadow-emerald-950/30'
                : isError
                ? 'bg-slate-900/95 border-rose-500/70 text-white shadow-rose-950/30'
                : isWarning
                ? 'bg-slate-900/95 border-amber-500/70 text-white shadow-amber-950/30'
                : 'bg-slate-900/95 border-blue-500/70 text-white shadow-blue-950/30'
            }`}
          >
            {/* Status Icon */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                isEmergency
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : isSuccess
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : isError
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : isWarning
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-blue-500/20 border-blue-500/40 text-blue-400'
              }`}
            >
              {isEmergency && <AlertOctagon className="w-4.5 h-4.5 text-rose-300 animate-bounce" />}
              {isSuccess && <CheckCircle2 className="w-4.5 h-4.5" />}
              {isError && <AlertTriangle className="w-4.5 h-4.5" />}
              {isWarning && <AlertTriangle className="w-4.5 h-4.5" />}
              {!isEmergency && !isSuccess && !isError && !isWarning && <Info className="w-4.5 h-4.5" />}
            </div>

            {/* Status Text Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-tight text-white leading-tight">
                  {toast.title}
                </span>
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded font-mono ${
                    isEmergency
                      ? 'bg-rose-500/30 text-rose-200 border border-rose-500/40'
                      : isSuccess
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/40'
                      : isError
                      ? 'bg-rose-500/30 text-rose-200 border border-rose-500/40'
                      : isWarning
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                      : 'bg-blue-500/30 text-blue-200 border border-blue-500/40'
                  }`}
                >
                  {isEmergency ? 'Urgent' : isSuccess ? 'Success' : isError ? 'Error' : isWarning ? 'Notice' : 'Info'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed break-words">{toast.message}</p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss status notification"
              className="shrink-0 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </aside>
  );
};

export default ToastContainer;
