// =====================================================================
// RENTBOOK KENYA — ARREARS & DEBTS SCREEN (Aging Analysis)
// Sorted by largest debt first, aging buckets (0-30, 31-60, 61-90, 90+ days),
// months behind, days overdue, and one-tap polite SMS reminders
// =====================================================================

import React, { useState } from 'react';
import {
  AlertCircle,
  Clock,
  MessageSquare,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createSmsHref, formatKES, formatPhoneKE, generateRentSMS } from '../lib/formatters';

export const ArrearsScreen: React.FC = () => {
  const { tenantArrears, setCurrentScreen, openPaymentModal } = useApp();

  const [bucketFilter, setBucketFilter] = useState<'all' | '0-30' | '31-60' | '61-90' | '90+'>(
    'all'
  );

  const debtors = tenantArrears
    .filter((t) => t.balance > 0)
    .filter((t) => bucketFilter === 'all' || t.bucket === bucketFilter);

  const totalOwed = debtors.reduce((sum, d) => sum + d.balance, 0);

  // Group bucket totals
  const bucket030 = tenantArrears.filter((t) => t.balance > 0 && t.bucket === '0-30');
  const bucket3160 = tenantArrears.filter((t) => t.balance > 0 && t.bucket === '31-60');
  const bucket6190 = tenantArrears.filter((t) => t.balance > 0 && t.bucket === '61-90');
  const bucket90Plus = tenantArrears.filter((t) => t.balance > 0 && t.bucket === '90+');

  return (
    <div className="flex flex-col gap-4 pb-12 select-none">
      {/* 1. TOP HEADER & TOTAL DEBT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 shadow-sm">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
            <span>Arrears & Aging Debts</span>
            <span className="text-xs font-mono font-bold text-rose-400 px-2 py-0.5 bg-rose-950 border border-rose-800">
              {debtors.length} Tenants Owing
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological aging report prioritized by largest outstanding balance first
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 px-4 py-2 text-right">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Outstanding</div>
          <div className="text-lg sm:text-2xl font-black text-rose-400">{formatKES(totalOwed)}</div>
        </div>
      </div>

      {/* 2. AGING BUCKETS FILTER RIBBON */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { id: '0-30', label: '0 – 30 Days', list: bucket030, color: 'text-amber-400' },
          { id: '31-60', label: '31 – 60 Days', list: bucket3160, color: 'text-orange-400' },
          { id: '61-90', label: '61 – 90 Days', list: bucket6190, color: 'text-rose-400' },
          { id: '90+', label: '90+ Days Critical', list: bucket90Plus, color: 'text-rose-500' },
        ].map((bucket) => {
          const sum = bucket.list.reduce((acc, d) => acc + d.balance, 0);
          const isSelected = bucketFilter === bucket.id;
          return (
            <button
              key={bucket.id}
              type="button"
              onClick={() => setBucketFilter(isSelected ? 'all' : (bucket.id as any))}
              className={`p-3 border text-left transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800 border-rose-500 shadow-md ring-1 ring-rose-500/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] font-semibold text-slate-400 uppercase">
                {bucket.label}
              </div>
              <div className={`text-base font-black my-1 ${bucket.color}`}>{formatKES(sum)}</div>
              <div className="text-[11px] text-slate-400">
                {bucket.list.length} tenant(s)
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. DEBTORS TABLE / CARDS */}
      <div className="bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800 text-slate-300 font-bold border-b border-slate-700">
              <tr>
                <th className="px-3.5 py-3">House / Flat</th>
                <th className="px-3.5 py-3">Tenant Name</th>
                <th className="px-3 py-3">Months Behind</th>
                <th className="px-3 py-3">Oldest Unpaid</th>
                <th className="px-3 py-3 text-right">Total Owed</th>
                <th className="px-3 py-3 text-center">Aging Bucket</th>
                <th className="px-3.5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {debtors.map((debtor) => {
                const reminderMsg = generateRentSMS(
                  'sw',
                  debtor.unit.name,
                  debtor.balance,
                  debtor.tenant.full_name
                );

                return (
                  <tr key={debtor.tenant.id} className="hover:bg-slate-800/40 transition">
                    {/* Unit */}
                    <td className="px-3.5 py-3">
                      <button
                        type="button"
                        onClick={() => setCurrentScreen('unit-detail', debtor.unit.id)}
                        className="font-bold font-mono text-emerald-400 hover:underline"
                      >
                        House {debtor.unit.name}
                      </button>
                      <div className="text-[10px] text-slate-400">
                        Rent: {formatKES(debtor.monthly_rent)}/mo
                      </div>
                    </td>

                    {/* Tenant */}
                    <td className="px-3.5 py-3">
                      <div className="font-bold text-slate-200">{debtor.tenant.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {debtor.tenant.phone}
                      </div>
                    </td>

                    {/* Months Behind */}
                    <td className="px-3 py-3 font-semibold text-rose-300">
                      {debtor.months_behind} Month(s)
                    </td>

                    {/* Oldest Unpaid */}
                    <td className="px-3 py-3 font-mono text-slate-300">
                      {debtor.oldest_unpaid_month}
                    </td>

                    {/* Total Owed */}
                    <td className="px-3 py-3 text-right font-black text-sm text-rose-400">
                      {formatKES(debtor.balance)}
                    </td>

                    {/* Bucket */}
                    <td className="px-3 py-3 text-center">
                      <span className="px-2 py-0.5 text-[10px] font-bold font-mono uppercase bg-rose-950 text-rose-300 border border-rose-800">
                        {debtor.bucket} Days
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3.5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`tel:${formatPhoneKE(debtor.tenant.phone)}`}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                          title="Call Tenant"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        </a>

                        <a
                          href={createSmsHref(debtor.tenant.phone, reminderMsg)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900/80 text-rose-200 border border-rose-700 text-[11px] font-bold transition"
                          title={reminderMsg}
                        >
                          <MessageSquare className="w-3 h-3 text-rose-400" />
                          <span>SMS</span>
                        </a>

                        <button
                          type="button"
                          onClick={() =>
                            openPaymentModal({
                              unitId: debtor.unit.id,
                              tenantId: debtor.tenant.id,
                            })
                          }
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition"
                        >
                          Collect
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {debtors.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-400 italic">
                    🎉 Excellent! Zero arrears found for this filter. All tenants are fully paid.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
