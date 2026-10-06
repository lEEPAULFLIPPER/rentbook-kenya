// =====================================================================
// RENTBOOK KENYA — LIVE NOTIFICATION TOAST
// Displays real-time entries ("John (Caretaker) recorded KSh 12,000...")
// =====================================================================

import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LiveNotificationToast: React.FC = () => {
  const { liveToasts, dismissToast } = useApp();

  if (liveToasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      className="fixed bottom-16 sm:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {liveToasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-2.5 p-3 border shadow-xl backdrop-blur-md animate-in slide-in-from-right-4 fade-in duration-200 text-xs ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-600/60 text-emerald-100'
              : toast.type === 'warning'
              ? 'bg-amber-950/90 border-amber-600/60 text-amber-100'
              : 'bg-slate-900/90 border-slate-700/80 text-slate-100'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : toast.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          )}

          <div className="flex-1">
            <div className="font-medium leading-relaxed">{toast.message}</div>
            <div className="text-[10px] opacity-70 mt-0.5">{toast.timestamp}</div>
          </div>

          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="p-1 text-slate-400 hover:text-white shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </aside>
  );
};
