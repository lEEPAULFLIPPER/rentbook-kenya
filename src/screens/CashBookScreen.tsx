// =====================================================================
// RENTBOOK KENYA — CASH BOOK SCREEN (Chronological Digital Sharp Book)
// Wide desktop table with sticky headers, mobile stacked cards,
// live running balance, approve/reject workflow, and print stylesheet
// =====================================================================

import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Filter,
  Printer,
  Search,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatKES } from '../lib/formatters';
import { PaymentStatus } from '../types';

export const CashBookScreen: React.FC = () => {
  const {
    currentProperty,
    cashBookEntries,
    approvePayment,
    rejectPayment,
    voidPayment,
  } = useApp();

  const { activeRole } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all');

  const filteredEntries = useMemo(() => {
    return cashBookEntries.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesRef = item.reference.toLowerCase().includes(q);
        const matchesTenant = item.tenant_name?.toLowerCase().includes(q);
        const matchesRecorder = item.recorded_by_name.toLowerCase().includes(q);
        return matchesDesc || matchesRef || matchesTenant || matchesRecorder;
      }
      return true;
    });
  }, [cashBookEntries, statusFilter, typeFilter, searchQuery]);

  // Totals calculations
  const totalMoneyIn = filteredEntries.reduce(
    (sum, i) => (i.status === 'approved' ? sum + i.money_in : sum),
    0
  );
  const totalMoneyOut = filteredEntries.reduce(
    (sum, i) => (i.status === 'approved' ? sum + i.money_out : sum),
    0
  );
  const netBalance = totalMoneyIn - totalMoneyOut;

  const handlePrint = () => {
    window.print();
  };

  const handleRejectPrompt = (paymentId: string) => {
    const reason = prompt('Enter reason for rejecting this caretaker payment entry:');
    if (reason) {
      rejectPayment(paymentId, reason);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-12 select-none">
      {/* 1. HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 print:hidden">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
            <span>Cash Book Ledger</span>
            <span className="text-xs font-mono font-normal text-emerald-400 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
              {currentProperty?.name}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological audit of all Money In (rent) and Money Out (compound expenses)
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition active:scale-95 shrink-0 min-h-[40px]"
        >
          <Printer className="w-4 h-4 text-slate-300" />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* 2. SUMMARY RIBBON (TOTAL IN / OUT / RUNNING NET) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4">
        <div>
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase">
            Total Money In
          </span>
          <div className="text-sm sm:text-xl font-black text-emerald-400">
            {formatKES(totalMoneyIn)}
          </div>
        </div>

        <div>
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase">
            Total Money Out
          </span>
          <div className="text-sm sm:text-xl font-black text-rose-400">
            {formatKES(totalMoneyOut)}
          </div>
        </div>

        <div>
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase">
            Net Cash Balance
          </span>
          <div className="text-sm sm:text-xl font-black text-sky-300">
            {formatKES(netBalance)}
          </div>
        </div>
      </div>

      {/* 3. FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 print:hidden">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference, tenant, house..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[38px]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | PaymentStatus)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none min-h-[38px] flex-1 sm:flex-initial"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved Only</option>
            <option value="pending">Pending Approval</option>
            <option value="rejected">Rejected</option>
            <option value="void">Voided</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'in' | 'out')}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none min-h-[38px] flex-1 sm:flex-initial"
          >
            <option value="all">Money In & Out</option>
            <option value="in">Money In Only</option>
            <option value="out">Money Out Only</option>
          </select>
        </div>
      </div>

      {/* 4. DESKTOP WIDE DATA TABLE (STICKY HEADER, COMPACT PADDING FOR 1366x768) */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[620px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800 text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-700 shadow-sm">
              <tr>
                <th className="px-3.5 py-3">Date</th>
                <th className="px-3.5 py-3">Description / House</th>
                <th className="px-3 py-3">Method / Ref</th>
                <th className="px-3 py-3 text-right">Money In</th>
                <th className="px-3 py-3 text-right">Money Out</th>
                <th className="px-3 py-3 text-right font-black">Running Balance</th>
                <th className="px-3 py-3">Recorded By</th>
                <th className="px-3 py-3 text-center">Status / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredEntries.map((item) => {
                const isPending = item.status === 'pending';
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800/40 transition ${
                      isPending ? 'bg-amber-950/20 text-slate-300' : ''
                    }`}
                  >
                    {/* Date */}
                    <td className="px-3.5 py-2.5 font-mono text-slate-400 whitespace-nowrap">
                      {item.date}
                    </td>

                    {/* Description */}
                    <td className="px-3.5 py-2.5">
                      <div className="font-semibold text-slate-200">{item.description}</div>
                      {item.tenant_name && (
                        <div className="text-[11px] text-slate-400">Tenant: {item.tenant_name}</div>
                      )}
                    </td>

                    {/* Method / Ref */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="font-bold text-slate-300">{item.categoryOrMethod}</span>
                      <div className="font-mono text-[11px] text-slate-400">{item.reference}</div>
                    </td>

                    {/* Money In */}
                    <td className="px-3 py-2.5 text-right font-black text-emerald-400 whitespace-nowrap">
                      {item.money_in > 0 ? formatKES(item.money_in) : '—'}
                    </td>

                    {/* Money Out */}
                    <td className="px-3 py-2.5 text-right font-black text-rose-400 whitespace-nowrap">
                      {item.money_out > 0 ? formatKES(item.money_out) : '—'}
                    </td>

                    {/* Running Balance */}
                    <td className="px-3 py-2.5 text-right font-black text-sky-300 whitespace-nowrap">
                      {item.status === 'approved' ? formatKES(item.balance) : '— (Pending)'}
                    </td>

                    {/* Recorded By */}
                    <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-slate-300">
                        {item.recorded_by_name}
                      </span>
                    </td>

                    {/* Status & Actions */}
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      {isPending && activeRole !== 'caretaker' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => approvePayment(item.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow-sm active:scale-95"
                            title="Verify and Approve"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectPrompt(item.id)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-rose-300 font-semibold text-[11px] border border-slate-700 transition"
                            title="Reject Entry"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            item.status === 'approved'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              : item.status === 'pending'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MOBILE STACKED CARDS VIEW (FOR SCREENS < 768px) */}
      <div className="md:hidden flex flex-col gap-2.5">
        {filteredEntries.map((item) => {
          const isPending = item.status === 'pending';
          return (
            <div
              key={item.id}
              className={`bg-slate-900 border rounded-xl p-3 flex flex-col gap-2 text-xs ${
                isPending ? 'border-amber-600/60 bg-amber-950/15' : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-100">{item.description}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {item.date} · {item.categoryOrMethod} ({item.reference})
                  </div>
                </div>
                <div
                  className={`font-black text-sm text-right ${
                    item.type === 'in' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {item.type === 'in' ? `+${formatKES(item.money_in)}` : `-${formatKES(item.money_out)}`}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span>By: {item.recorded_by_name}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sky-300">
                    Bal: {item.status === 'approved' ? formatKES(item.balance) : 'Pending'}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                      item.status === 'approved'
                        ? 'bg-emerald-950 text-emerald-300'
                        : 'bg-amber-950 text-amber-300'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Mobile Approval Buttons */}
              {isPending && activeRole !== 'caretaker' && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => approvePayment(item.id)}
                    className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs text-center"
                  >
                    Approve Entry
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectPrompt(item.id)}
                    className="px-3 py-2 rounded-lg bg-slate-800 text-rose-300 text-xs font-semibold"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
