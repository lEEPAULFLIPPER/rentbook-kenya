// =====================================================================
// RENTBOOK KENYA — BOTTOM NAVIGATION (Phone First for Landlords & Caretakers)
// Fixed at bottom on screens < 768px, minimum 44px touch targets
// =====================================================================

import React from 'react';
import {
  AlertCircle,
  BookOpen,
  Building,
  LayoutDashboard,
  Plus,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ScreenType } from '../../types';

export const BottomNav: React.FC = () => {
  const { currentScreen, setCurrentScreen, openPaymentModal } = useApp();
  const { activeRole } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1 flex items-center justify-around safe-area-bottom">
      <button
        type="button"
        onClick={() => setCurrentScreen('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] min-h-[44px] min-w-[44px] transition ${
          currentScreen === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Home</span>
      </button>

      {activeRole !== 'caretaker' ? (
        <button
          type="button"
          onClick={() => setCurrentScreen('cashbook')}
          className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] min-h-[44px] min-w-[44px] transition ${
            currentScreen === 'cashbook' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span>Ledger</span>
        </button>
      ) : null}

      {/* Floating Center "+ Pay" Button */}
      <button
        type="button"
        onClick={() => openPaymentModal()}
        className="flex flex-col items-center justify-center -mt-4 bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 shadow-lg border-2 border-slate-900 active:scale-95 transition min-h-[48px] min-w-[48px]"
        title="Record payment"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      <button
        type="button"
        onClick={() => setCurrentScreen('units')}
        className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] min-h-[44px] min-w-[44px] transition ${
          currentScreen === 'units' ? 'text-emerald-400 font-bold' : 'text-slate-400'
        }`}
      >
        <Building className="w-5 h-5 mb-0.5" />
        <span>Houses</span>
      </button>

      <button
        type="button"
        onClick={() => setCurrentScreen('tenants')}
        className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] min-h-[44px] min-w-[44px] transition ${
          currentScreen === 'tenants' ? 'text-emerald-400 font-bold' : 'text-slate-400'
        }`}
      >
        <Users className="w-5 h-5 mb-0.5" />
        <span>Tenants</span>
      </button>

      <button
        type="button"
        onClick={() => setCurrentScreen('debts')}
        className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] min-h-[44px] min-w-[44px] transition ${
          currentScreen === 'debts' ? 'text-emerald-400 font-bold' : 'text-slate-400'
        }`}
      >
        <AlertCircle className="w-5 h-5 mb-0.5" />
        <span>Arrears</span>
      </button>
    </nav>
  );
};
