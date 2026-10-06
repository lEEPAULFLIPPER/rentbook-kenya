// =====================================================================
// RENTBOOK KENYA — 10-SECOND UNDO TOAST
// Displays countdown timer and one-tap restore button after deletion
// =====================================================================

import React from 'react';
import { RotateCcw, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const UndoToast: React.FC = () => {
  const { undoState, dismissUndo } = useApp();

  if (!undoState) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-xs text-slate-100 max-w-md">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px] font-mono shrink-0">
          {undoState.secondsRemaining}s
        </span>

        <span className="truncate">{undoState.message}</span>

        <button
          type="button"
          onClick={() => {
            undoState.undoAction();
            dismissUndo();
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 active:scale-95 transition min-h-[36px]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Undo</span>
        </button>

        <button
          type="button"
          onClick={dismissUndo}
          className="p-1 text-slate-400 hover:text-slate-200 shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
