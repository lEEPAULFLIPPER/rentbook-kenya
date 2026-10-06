// =====================================================================
// RENTBOOK KENYA — DASHBOARD SCREEN
// Tuned for Acer Chromebook Spin 311 (1366x768) & Mobile Phones
// Compact 4-column KPI grid, arrears alerts, quick action bar, pending approvals
// =====================================================================

import React from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Building,
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatKES, getCurrentMonthKey } from '../lib/formatters';

export const DashboardScreen: React.FC = () => {
  const {
    currentProperty,
    units,
    tenants,
    payments,
    expenses,
    tenantArrears,
    cashBookEntries,
    pendingApprovalsCount,
    openPaymentModal,
    openExpenseModal,
    openPropertyModal,
    setCurrentScreen,
    approvePayment,
  } = useApp();

  const { activeRole, currentUser } = useAuth();
  const currentMonth = getCurrentMonthKey();

  // Metrics calculation
  const totalUnits = units.length;
  const occupiedUnits = units.filter((u) => u.status === 'occupied').length;
  const vacantUnits = units.filter((u) => u.status === 'vacant').length;
  const vacancyRate = totalUnits > 0 ? Math.round((vacantUnits / totalUnits) * 100) : 0;

  // Expected Rent this month
  const expectedRent = units.reduce((sum, u) => sum + Number(u.monthly_rent || 0), 0);

  // Collected this month (Approved payments)
  const thisMonthPayments = payments.filter(
    (p) => p.covers_month === currentMonth && !p.deleted_at && p.status === 'approved'
  );
  const collectedRent = thisMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const collectionRate = expectedRent > 0 ? Math.round((collectedRent / expectedRent) * 100) : 0;

  // Total Outstanding Arrears
  const totalArrears = tenantArrears.reduce((sum, t) => (t.balance > 0 ? sum + t.balance : sum), 0);

  // Cash Book Balance (Running Money In - Money Out)
  const cashBalance = cashBookEntries[0]?.balance || 0;

  // Pending Payments waiting for approval
  const pendingPayments = payments.filter((p) => p.status === 'pending' && !p.deleted_at);

  return (
    <div className="flex flex-col gap-4 pb-12 select-none">
      {/* 1. TOP HEADER SUMMARY & QUICK ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 sm:p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black text-slate-100 tracking-tight">
              {currentProperty?.name || 'Compound Overview'}
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-800 text-emerald-400 border border-slate-700">
              {currentProperty?.location || 'Kenya'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Logged in as <strong className="text-slate-200">{currentUser.full_name}</strong> (
            <span className="capitalize text-emerald-400 font-bold">{activeRole}</span>)
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => openPaymentModal()}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95 min-h-[40px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record Rent</span>
          </button>
          <button
            type="button"
            onClick={() => openExpenseModal()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition active:scale-95 min-h-[40px]"
          >
            <Plus className="w-4 h-4 text-amber-400 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
          {activeRole !== 'caretaker' && (
            <button
              type="button"
              onClick={() => openPropertyModal()}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition active:scale-95 min-h-[40px]"
            >
              <Building className="w-4 h-4 text-sky-400" />
              <span>New Flat</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. COMPACT 4-COLUMN KPI CARDS (FITS 1366x768 WITHOUT OVERFLOW) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* KPI 1: Occupancy */}
        <div
          onClick={() => setCurrentScreen('units')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-3 sm:p-4 cursor-pointer transition shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Occupancy</span>
            <Building className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-lg sm:text-2xl font-black text-slate-100">
              {occupiedUnits} <span className="text-xs text-slate-400 font-normal">/ {totalUnits}</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-400">{100 - vacancyRate}% Full</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="text-rose-400 font-medium">{vacantUnits} Vacant</span>
            <span>{occupiedUnits} Occupied</span>
          </div>
        </div>

        {/* KPI 2: Collections This Month */}
        <div
          onClick={() => setCurrentScreen('cashbook')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-3 sm:p-4 cursor-pointer transition shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">This Month Collected</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-400">
            {formatKES(collectedRent)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Expected: {formatKES(expectedRent)}</span>
            <span className="font-bold text-slate-200">{collectionRate}%</span>
          </div>
        </div>

        {/* KPI 3: Total Arrears Owed */}
        <div
          onClick={() => setCurrentScreen('debts')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-3 sm:p-4 cursor-pointer transition shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Arrears Owed</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-400">
            {formatKES(totalArrears)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{tenantArrears.filter((t) => t.balance > 0).length} tenants owing</span>
            <span className="text-rose-300 font-medium">Aging View →</span>
          </div>
        </div>

        {/* KPI 4: Cash Book Balance (Landlord/Admin) OR Pending Badge (Caretaker) */}
        {activeRole !== 'caretaker' ? (
          <div
            onClick={() => setCurrentScreen('cashbook')}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-3 sm:p-4 cursor-pointer transition shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Cash Book Balance</span>
              <Wallet className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-sky-300">
              {formatKES(cashBalance)}
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Net in-hand</span>
              <span className="text-sky-300 font-medium">Full Ledger →</span>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setCurrentScreen('units')}
            className="bg-slate-900 border border-slate-800 p-3 sm:p-4 cursor-pointer transition shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">My Shift Mode</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-amber-400">Field Active</div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Ready for collections</span>
              <span className="text-amber-300 font-medium">Record Pay (N)</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. PENDING APPROVALS ALERT (Landlord & Admin) */}
      {activeRole !== 'caretaker' && pendingPayments.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-600/50 p-3.5 sm:p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="font-bold text-xs text-amber-200">
                {pendingPayments.length} Payment(s) Awaiting Approval (Submitted by Caretaker)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentScreen('cashbook')}
              className="text-xs text-amber-300 hover:underline font-semibold"
            >
              View in Ledger →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pendingPayments.slice(0, 2).map((pay) => {
              const u = units.find((item) => item.id === pay.unit_id);
              const t = tenants.find((item) => item.id === pay.tenant_id);
              return (
                <div
                  key={pay.id}
                  className="bg-slate-900/90 border border-slate-700/80 p-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-100">
                      House {u?.name || '—'} · {formatKES(pay.amount)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {t?.full_name} · Ref: <span className="font-mono text-amber-300">{pay.reference}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      By: {pay.recorder_name}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => approvePayment(pay.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. SPLIT ROW: ARREARS GLANCE & RECENT CASH BOOK TRANSACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: Arrears Debtors at a Glance */}
        <div className="bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <h3 className="font-bold text-xs text-slate-200">Top Tenants in Arrears</h3>
              </div>
              <button
                type="button"
                onClick={() => setCurrentScreen('debts')}
                className="text-xs text-emerald-400 hover:underline font-semibold"
              >
                View all ({tenantArrears.filter((t) => t.balance > 0).length}) →
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {tenantArrears
                .filter((t) => t.balance > 0)
                .slice(0, 4)
                .map((debtor) => (
                  <div
                    key={debtor.tenant.id}
                    className="flex items-center justify-between p-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-xs transition"
                  >
                    <div>
                      <div className="font-bold text-slate-200">
                        House {debtor.unit.name} — {debtor.tenant.full_name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {debtor.months_behind} month(s) behind · Due since {debtor.oldest_unpaid_month}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-rose-400">{formatKES(debtor.balance)}</div>
                      <span className="text-[10px] px-1.5 py-0.2 bg-rose-950 text-rose-300 font-bold uppercase">
                        {debtor.bucket} Days
                      </span>
                    </div>
                  </div>
                ))}
              {tenantArrears.filter((t) => t.balance > 0).length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  🎉 All tenants are fully paid up! Zero arrears.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Recent Activity / Cash Book Feed */}
        <div className="bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs text-slate-200">Recent Transactions</h3>
              </div>
              {activeRole !== 'caretaker' && (
                <button
                  type="button"
                  onClick={() => setCurrentScreen('cashbook')}
                  className="text-xs text-emerald-400 hover:underline font-semibold"
                >
                  Full Cash Book →
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {cashBookEntries.slice(0, 4).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2.5 bg-slate-800/50 border border-slate-700/60 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`p-1.5 shrink-0 ${
                        entry.type === 'in'
                          ? 'bg-emerald-950 text-emerald-400'
                          : 'bg-rose-950 text-rose-400'
                      }`}
                    >
                      {entry.type === 'in' ? (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <div className="truncate">
                      <div className="font-bold text-slate-200 truncate">{entry.description}</div>
                      <div className="text-[11px] text-slate-400">
                        {entry.date} · {entry.categoryOrMethod} ·{' '}
                        <span className="font-mono">{entry.reference}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div
                      className={`font-black ${
                        entry.type === 'in' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {entry.type === 'in' ? `+${formatKES(entry.money_in)}` : `-${formatKES(entry.money_out)}`}
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 font-mono uppercase ${
                        entry.status === 'approved'
                          ? 'bg-emerald-950/80 text-emerald-300'
                          : 'bg-amber-950/80 text-amber-300'
                      }`}
                    >
                      {entry.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
