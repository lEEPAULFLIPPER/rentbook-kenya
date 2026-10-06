// =====================================================================
// RENTBOOK KENYA — COMMAND PALETTE (Ctrl+K or "/")
// Fastest keyboard navigation for Acer Chromebook Spin 311
// =====================================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Building,
  FileSpreadsheet,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ScreenType } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const {
    units,
    tenants,
    setCurrentScreen,
    openPaymentModal,
    openExpenseModal,
    openPropertyModal,
  } = useApp();

  const { activeRole, setViewAsRole, currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const normalized = query.toLowerCase().trim();

  // Filter Units
  const matchedUnits = units
    .filter((u) => !u.deleted_at && (u.name.toLowerCase().includes(normalized) || u.status.includes(normalized)))
    .slice(0, 5);

  // Filter Tenants
  const matchedTenants = tenants
    .filter((t) => !t.deleted_at && (t.full_name.toLowerCase().includes(normalized) || t.phone.includes(normalized)))
    .slice(0, 5);

  const handleSelectScreen = (screen: ScreenType) => {
    setCurrentScreen(screen);
    onClose();
  };

  const handleSelectUnit = (unitId: string) => {
    setCurrentScreen('unit-detail', unitId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-100">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 gap-2.5">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a house (e.g. A3), tenant name, or action..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
            Esc
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-[380px] overflow-y-auto p-2 flex flex-col gap-1 text-xs">
          {/* Quick Actions */}
          <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Quick Actions
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              openPaymentModal();
            }}
            className="flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:bg-slate-800 text-left transition"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span className="font-medium">+ Record Rent Payment</span>
            <kbd className="ml-auto text-[10px] font-mono text-slate-500">N</kbd>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              openExpenseModal();
            }}
            className="flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:bg-slate-800 text-left transition"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span className="font-medium">+ Add Compound Expense</span>
            <kbd className="ml-auto text-[10px] font-mono text-slate-500">E</kbd>
          </button>
          {activeRole !== 'caretaker' && (
            <button
              type="button"
              onClick={() => {
                onClose();
                openPropertyModal();
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:bg-slate-800 text-left transition"
            >
              <Building className="w-4 h-4 text-sky-400" />
              <span className="font-medium">+ Add New Property (Flats)</span>
            </button>
          )}

          {/* Matched Units */}
          {matchedUnits.length > 0 && (
            <>
              <div className="px-2 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Houses / Flats
              </div>
              {matchedUnits.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelectUnit(u.id)}
                  className="flex items-center justify-between px-3 py-2 text-slate-200 hover:bg-slate-800 text-left transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-400">House {u.name}</span>
                    <span className="text-[11px] text-slate-400">
                      Floor {u.floor_number} · KSh {u.monthly_rent.toLocaleString()}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 uppercase font-semibold ${
                      u.status === 'occupied' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                    }`}
                  >
                    {u.status}
                  </span>
                </button>
              ))}
            </>
          )}

          {/* Matched Tenants */}
          {matchedTenants.length > 0 && (
            <>
              <div className="px-2 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Tenants
              </div>
              {matchedTenants.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectScreen('tenants')}
                  className="flex items-center justify-between px-3 py-2 text-slate-200 hover:bg-slate-800 text-left transition"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-200">{t.full_name}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{t.phone}</span>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Navigation Jump */}
          <div className="px-2 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Jump to Screen
          </div>
          <button
            type="button"
            onClick={() => handleSelectScreen('debts')}
            className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:bg-slate-800 transition"
          >
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Arrears & Aging Debts</span>
          </button>
          {activeRole !== 'caretaker' && (
            <>
              <button
                type="button"
                onClick={() => handleSelectScreen('cashbook')}
                className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:bg-slate-800 transition"
              >
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span>Cash Book (Running Ledger)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectScreen('reports')}
                className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:bg-slate-800 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                <span>Reports & CSV Export</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectScreen('team')}
                className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:bg-slate-800 transition"
              >
                <UserCheck className="w-4 h-4 text-teal-400" />
                <span>Staff & Caretaker Management</span>
              </button>
            </>
          )}
          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => handleSelectScreen('audit')}
              className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:bg-slate-800 transition"
            >
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <span>Audit Log (Append-Only)</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSelectScreen('settings')}
            className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:bg-slate-800 transition"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings & Backup</span>
          </button>
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Use Tab to move, Enter to open</span>
          <span className="font-mono text-emerald-400/90">RentBook Kenya</span>
        </div>
      </div>
    </div>
  );
};
