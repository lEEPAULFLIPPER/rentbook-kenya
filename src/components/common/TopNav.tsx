// =====================================================================
// RENTBOOK KENYA — TOPNAV BAR (Tuned for Chromebook 1366x768 & Split Screen)
// Compact layout, sticky, quick actions, role indicator & persona switch
// =====================================================================

import React, { useState } from 'react';
import {
  Building2,
  ChevronDown,
  Eye,
  Plus,
  Search,
  SlidersHorizontal,
  UserCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface TopNavProps {
  onOpenCommandPalette: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenCommandPalette }) => {
  const {
    visibleProperties,
    currentProperty,
    setSelectedPropertyId,
    openPaymentModal,
    openExpenseModal,
    pendingApprovalsCount,
    isOnline,
    queuedSyncCount,
    setCurrentScreen,
  } = useApp();

  const {
    currentUser,
    activeRole,
    isViewingAs,
    viewAsRole,
    setViewAsRole,
    allProfiles,
    switchUser,
  } = useAuth();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-900/60 text-purple-200 border-purple-700/60';
      case 'landlord':
        return 'bg-emerald-900/60 text-emerald-200 border-emerald-700/60';
      case 'caretaker':
        return 'bg-amber-900/60 text-amber-200 border-amber-700/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 h-14 px-3 sm:px-4 flex items-center justify-between gap-2 select-none">
      {/* LEFT: Logo & Property Selector */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div
          onClick={() => setCurrentScreen('dashboard')}
          className="flex items-center gap-1.5 cursor-pointer font-bold text-base sm:text-lg text-emerald-400 tracking-tight shrink-0"
        >
          <span className="flex h-7 w-7 items-center justify-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black">
            🇰🇪
          </span>
          <span className="hidden min-[480px]:inline font-black text-slate-100">
            RentBook<span className="text-emerald-400">.ke</span>
          </span>
        </div>

        {/* Property Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsPropertyDropdownOpen(!isPropertyDropdownOpen)}
            className="flex items-center gap-1.5 max-w-[130px] sm:max-w-[190px] md:max-w-[240px] px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700/80 transition truncate min-h-[36px]"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{currentProperty?.name || 'All Flats'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-auto" />
          </button>

          {isPropertyDropdownOpen && (
            <div
              className="absolute left-0 mt-1.5 w-56 bg-slate-800 border border-slate-700 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setIsPropertyDropdownOpen(false)}
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                Switch Property
              </div>
              {visibleProperties.map((prop) => (
                <button
                  key={prop.id}
                  type="button"
                  onClick={() => {
                    setSelectedPropertyId(prop.id);
                    setIsPropertyDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-700/70 transition ${
                    prop.id === currentProperty?.id ? 'text-emerald-400 font-semibold bg-slate-700/40' : 'text-slate-300'
                  }`}
                >
                  <span className="truncate">{prop.name}</span>
                  <span className="text-[10px] text-slate-400">{prop.floors * prop.units_per_floor} units</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Online / Offline Sync status */}
        <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400">
          {isOnline ? (
            <span className="flex items-center gap-1 text-emerald-400/90" title="Live Synced with Supabase">
              <Wifi className="w-3 h-3" />
              <span className="text-[10px]">Live</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400" title="Working Offline">
              <WifiOff className="w-3 h-3" />
              <span className="text-[10px]">Offline ({queuedSyncCount})</span>
            </span>
          )}
        </div>
      </div>

      {/* CENTER: Search / Command Palette Shortcut */}
      <button
        type="button"
        onClick={onOpenCommandPalette}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60 text-xs transition min-w-[160px] lg:min-w-[210px] justify-between min-h-[36px]"
      >
        <span className="flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Jump to house / tenant...</span>
        </span>
        <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-400 ">
          Ctrl+K
        </kbd>
      </button>

      {/* RIGHT: Quick Actions & Role Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Record Payment Button */}
        <button
          type="button"
          onClick={() => openPaymentModal()}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm hover:shadow transition active:scale-95 min-h-[36px]"
          title="Shortcut: Press 'N'"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="font-semibold">Record Pay</span>
          <span className="hidden xl:inline text-[10px] text-emerald-200/80 font-mono">(N)</span>
        </button>

        {/* Add Expense Button (Landlord / Caretaker / Admin) */}
        <button
          type="button"
          onClick={() => openExpenseModal()}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition active:scale-95 min-h-[36px]"
          title="Shortcut: Press 'E'"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
          <span>Expense</span>
          <span className="hidden xl:inline text-[10px] text-slate-400 font-mono">(E)</span>
        </button>

        {/* Pending approvals badge */}
        {activeRole !== 'caretaker' && pendingApprovalsCount > 0 && (
          <button
            type="button"
            onClick={() => setCurrentScreen('cashbook')}
            className="flex items-center gap-1 px-2 py-1 bg-amber-950/60 border border-amber-600/60 text-amber-300 text-xs font-semibold animate-pulse hover:bg-amber-900/60 min-h-[36px]"
            title={`${pendingApprovalsCount} entries awaiting approval`}
          >
            <span className="w-2 h-2 bg-amber-400" />
            <span className="text-[11px]">{pendingApprovalsCount} Pending</span>
          </button>
        )}

        {/* Role Persona Switcher / View As Mode Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 border text-xs font-semibold uppercase tracking-wider transition min-h-[36px] ${getRoleBadgeColor(
              activeRole
            )}`}
            title="Switch user or preview role"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{isViewingAs ? `View: ${viewAsRole}` : activeRole}</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {isRoleDropdownOpen && (
            <div
              className="absolute right-0 mt-1.5 w-64 bg-slate-800 border border-slate-700 shadow-2xl py-1.5 z-50 text-slate-200 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setIsRoleDropdownOpen(false)}
            >
              <div className="px-3 py-1.5 border-b border-slate-700/60">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Active Account</div>
                <div className="text-xs font-bold text-slate-100 truncate">{currentUser.full_name}</div>
                <div className="text-[10px] text-slate-400">{currentUser.phone || 'Phone: 0700000000'}</div>
              </div>

              {/* 1-Click Persona Simulator for Chromebook Admin */}
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                  <span>Switch Test Account</span>
                </div>
                {allProfiles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      switchUser(p.id);
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-700/70 transition ${
                      p.id === currentUser.id ? 'bg-slate-700/50 text-emerald-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <span className="truncate">{p.full_name}</span>
                    <span
                      className={`text-[10px] uppercase font-mono px-1.5 py-0.5 ${
                        p.role === 'admin'
                          ? 'bg-purple-900/60 text-purple-300'
                          : p.role === 'landlord'
                          ? 'bg-emerald-900/60 text-emerald-300'
                          : 'bg-amber-900/60 text-amber-300'
                      }`}
                    >
                      {p.role}
                    </span>
                  </button>
                ))}
              </div>

              {/* View As Mode (Admin Only) */}
              {currentUser.role === 'admin' && (
                <div className="border-t border-slate-700/60 pt-1 mt-1">
                  <div className="px-3 py-1 text-[10px] font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>View As (Preview UI)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 px-2 py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setViewAsRole(null);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`py-1 text-[11px] text-center transition ${
                        !isViewingAs ? 'bg-purple-600 text-white font-bold' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setViewAsRole('landlord');
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`py-1 text-[11px] text-center transition ${
                        viewAsRole === 'landlord' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Landlord
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setViewAsRole('caretaker');
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`py-1 text-[11px] text-center transition ${
                        viewAsRole === 'caretaker' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Caretaker
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
