// =====================================================================
// RENTBOOK KENYA — SETTINGS & DANGER ZONE SCREEN
// App rules, Supabase Cloud Credentials setup, Backup & Restore JSON,
// and Admin-Only Danger Zone with typed 'DELETE' confirmation
// =====================================================================

import React, { useRef, useState } from 'react';
import {
  AlertOctagon,
  Cloud,
  Database,
  Download,
  Key,
  RotateCcw,
  Save,
  ShieldAlert,
  Sliders,
  Trash2,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  getSupabaseCredentials,
  isSupabaseConfigured,
  saveSupabaseCredentials,
} from '../lib/supabase';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportBackupJson,
    importBackupJson,
    openDangerModal,
    currentProperty,
    broadcastLiveAction,
  } = useApp();

  const { activeRole, currentUser } = useAuth();

  // App Settings State
  const [approvalRequired, setApprovalRequired] = useState(
    settings.caretaker_approval_required
  );
  const [editWindow, setEditWindow] = useState(settings.caretaker_edit_window_minutes);
  const [rentDueDay, setRentDueDay] = useState(settings.default_rent_due_day);

  // Supabase Credentials State
  const initialCreds = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(initialCreds.url);
  const [supabaseKey, setSupabaseKey] = useState(initialCreds.anonKey);
  const [isCloudConnected, setIsCloudConnected] = useState(isSupabaseConfigured());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      caretaker_approval_required: approvalRequired,
      caretaker_edit_window_minutes: editWindow,
      default_rent_due_day: rentDueDay,
    });
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials(supabaseUrl, supabaseKey);
    setIsCloudConnected(isSupabaseConfigured());
    broadcastLiveAction('Supabase credentials saved. Reloading app for cloud sync...', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rentbook-kenya-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    broadcastLiveAction('Downloaded complete JSON backup file', 'success');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importBackupJson(content);
      if (success) {
        alert('Backup successfully restored!');
        window.location.reload();
      } else {
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-5 pb-16 select-none max-w-4xl mx-auto">
      {/* 1. HEADER */}
      <div className="bg-slate-900 border border-slate-800 p-4 shadow-sm">
        <h1 className="text-base sm:text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
          <span>Application Settings & Data Control</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure approval rules, cloud sync, data backups, and master controls
        </p>
      </div>

      {/* 2. APP-WIDE OPERATIONAL RULES */}
      {activeRole === 'admin' && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-slate-900 border border-slate-800 p-4 sm:p-5 flex flex-col gap-4 shadow-sm"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Operational & Caretaker Rules
            </h2>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            {/* Approval toggle */}
            <label className="flex items-start gap-3 cursor-pointer p-3 bg-slate-800/40 border border-slate-700/60 hover:bg-slate-800/80 transition">
              <input
                type="checkbox"
                checked={approvalRequired}
                onChange={(e) => setApprovalRequired(e.target.checked)}
                className="mt-0.5 h-4 w-4 bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <div className="font-bold text-slate-100">
                  Caretaker entries require Landlord / Admin approval
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  When enabled, all rent payments entered by caretakers show as PENDING until
                  verified against M-Pesa statements. (Default: ON)
                </div>
              </div>
            </label>

            {/* Edit window */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Caretaker Self-Edit Window (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={editWindow}
                  onChange={(e) => setEditWindow(parseInt(e.target.value) || 120)}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-100 min-h-[40px]"
                />
                <span className="text-[10px] text-slate-500">
                  Default 120 minutes (2 hours). After this, entries are permanently locked.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Default Rent Due Day of the Month
                </label>
                <select
                  value={rentDueDay}
                  onChange={(e) => setRentDueDay(parseInt(e.target.value) || 5)}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-100 min-h-[40px]"
                >
                  {[1, 5, 7, 10, 15].map((d) => (
                    <option key={d} value={d}>
                      {d}th of every month
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500">Standard Kenyan default is the 5th.</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition active:scale-95 min-h-[40px]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Rules</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. SUPABASE CLOUD SETUP (NO TERMINAL REQUIRED) */}
      <form
        onSubmit={handleSaveSupabase}
        className="bg-slate-900 border border-slate-800 p-4 sm:p-5 flex flex-col gap-4 shadow-sm"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-sky-400" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Supabase Cloud Connection (Multi-Device Sync)
            </h2>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 font-mono uppercase ${
              isCloudConnected
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}
          >
            {isCloudConnected ? 'Cloud Active' : 'Standalone / Local Demo Mode'}
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          To sync live data between your Acer Chromebook and phones, paste your free Supabase
          project credentials below. You can do this directly from Chrome without running any
          terminal commands.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-mono text-slate-100 min-h-[40px]"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Supabase Anon / Public Key
            </label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-mono text-slate-100 min-h-[40px]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-[11px] text-slate-500">
            See README.md for click-by-click instructions in the Supabase browser dashboard.
          </span>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow transition active:scale-95 min-h-[40px]"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Connect Supabase</span>
          </button>
        </div>
      </form>

      {/* 4. BACKUP & RESTORE (JSON DATA FREEDOM) */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Database className="w-4 h-4 text-emerald-400" />
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-200">
            Backup & Data Freedom (Offline JSON)
          </h2>
        </div>

        <p className="text-xs text-slate-400">
          Download an offline backup file of all properties, houses, tenants, and cash book
          ledgers. You can restore this file on any computer or phone at any time.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 transition active:scale-95 min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup (.json)</span>
          </button>

          {activeRole === 'admin' && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs border border-slate-700 transition active:scale-95 min-h-[44px]"
              >
                <Upload className="w-4 h-4" />
                <span>Import Backup</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 5. DANGER ZONE (ADMIN MASTER CONTROL ONLY) */}
      {currentUser.role === 'admin' && (
        <div className="bg-rose-950/20 border border-rose-900/60 p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-rose-900/40">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-rose-300">
              Admin Danger Zone (Master Overrides)
            </h2>
          </div>

          <p className="text-xs text-rose-200/80">
            These operations permanently erase records. Each action requires typing{' '}
            <strong className="font-mono text-white">DELETE</strong> to confirm, and includes a
            10-second undo window.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => openDangerModal('units')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold text-xs border border-rose-800 transition active:scale-95 min-h-[44px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete All Houses in {currentProperty?.name}</span>
            </button>

            <button
              type="button"
              onClick={() => openDangerModal('payments')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold text-xs border border-rose-800 transition active:scale-95 min-h-[44px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete All Payments</span>
            </button>

            <button
              type="button"
              onClick={() => openDangerModal('all')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md transition active:scale-95 min-h-[44px]"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Full Factory Reset</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
