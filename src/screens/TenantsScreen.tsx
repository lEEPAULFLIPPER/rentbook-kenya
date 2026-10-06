// =====================================================================
// RENTBOOK KENYA — TENANTS ROSTER SCREEN
// Tenant directory with live debt badges, direct Tel: and SMS: buttons,
// and pre-filled polite reminder templates in Swahili & English
// =====================================================================

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  MessageSquare,
  Phone,
  Search,
  User,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createSmsHref, formatKES, formatPhoneKE, generateRentSMS } from '../lib/formatters';

export const TenantsScreen: React.FC = () => {
  const { tenants, units, tenantArrears, openTenantModal, setCurrentScreen } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState<'sw' | 'en'>('sw');

  const activeTenants = useMemo(() => {
    return tenants
      .filter((t) => !t.deleted_at && !t.move_out_date)
      .filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const unit = units.find((u) => u.id === t.unit_id);
        return (
          t.full_name.toLowerCase().includes(q) ||
          t.phone.includes(q) ||
          unit?.name.toLowerCase().includes(q)
        );
      });
  }, [tenants, units, searchQuery]);

  return (
    <div className="flex flex-col gap-4 pb-12 select-none">
      {/* 1. HEADER & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 shadow-sm">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
            <span>Tenant Directory</span>
            <span className="text-xs font-mono font-normal text-emerald-400 px-2 py-0.5 bg-slate-800 border border-slate-700">
              {activeTenants.length} Active
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Contacts, unit allocations, arrears balances, and polite SMS reminders
          </p>
        </div>

        {/* SMS Language Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">SMS Language:</span>
          <div className="flex bg-slate-800 p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setLanguage('sw')}
              className={`px-3 py-1 text-xs font-bold transition ${
                language === 'sw' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Swahili
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-xs font-bold transition ${
                language === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="relative bg-slate-900/60 border border-slate-800 p-2.5">
        <Search className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by tenant name, phone number, or house number..."
          className="w-full bg-slate-800 border border-slate-700 pl-10 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
        />
      </div>

      {/* 3. TENANTS GRID (DESKTOP & MOBILE RESPONSIVE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {activeTenants.map((tenant) => {
          const unit = units.find((u) => u.id === tenant.unit_id);
          const arrears = tenantArrears.find((a) => a.tenant.id === tenant.id);
          const owesMoney = arrears && arrears.balance > 0;
          const reminderText = generateRentSMS(
            language,
            unit?.name || '',
            owesMoney ? arrears.balance : unit?.monthly_rent || 0,
            tenant.full_name
          );

          return (
            <div
              key={tenant.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 flex flex-col justify-between shadow-sm transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-black text-sm text-slate-100">{tenant.full_name}</h3>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{tenant.phone}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentScreen('unit-detail', unit?.id)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-mono font-bold text-xs"
                    title="View house statement"
                  >
                    House {unit?.name || '—'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-slate-950/50 p-2.5 border border-slate-800/80">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Monthly Rent</div>
                    <div className="font-bold text-slate-200">
                      {formatKES(unit?.monthly_rent)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Rent Balance</div>
                    <div
                      className={`font-black ${
                        owesMoney ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {owesMoney ? formatKES(arrears.balance) : 'Paid Up'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Actions: Call & SMS Reminders */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <a
                  href={`tel:${formatPhoneKE(tenant.phone)}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition min-h-[44px]"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call</span>
                </a>

                <a
                  href={createSmsHref(tenant.phone, reminderText)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold border transition min-h-[44px] ${
                    owesMoney
                      ? 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-200 border-rose-700/60'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                  title={reminderText}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                  <span>SMS Notice</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
