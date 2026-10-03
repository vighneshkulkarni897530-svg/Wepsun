import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, Info, AlertOctagon, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        const isEmergency = toast.type === 'emergency';
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl backdrop-blur-xl border transition-all duration-300 animate-slide-in ${
              isEmergency
                ? 'bg-red-50 border-red-300 text-red-900 shadow-red-500/20'
                : isSuccess
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : isError
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : isWarning
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isEmergency && <AlertOctagon className="w-5 h-5 text-red-600 animate-bounce" />}
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {isError && <AlertTriangle className="w-5 h-5 text-rose-600" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {!isEmergency && !isSuccess && !isError && !isWarning && (
                <Info className="w-5 h-5 text-[#1976D2]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold tracking-wide flex items-center justify-between">
                <span>{toast.title}</span>
              </div>
              <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-black/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
