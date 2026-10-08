// =====================================================================
// RENTBOOK KENYA — CASH BOOK & RENT ROLL SCREEN
// Authentic Kenyan Kasuku Counter Book experience:
// 1. Units ordered strictly from House 1 to House N (G1, G2, 101, 102...)
// 2. Multi-receipts for a unit grouped inside the SAME unit block
// 3. Clear "NO RECORD FOR THIS MONTH" box when unpaid
// 4. Encased accounting Money Box on each line (Receipts, Methods, Refs)
// 5. No confusing running bank balance — replaced with clear House Balance
// 6. Excel-style Fast Grid Entry row/column with Master Edit Lock 🔒
// 7. Compound Expenses section & Net Landlord Cash in Hand
// =====================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit2,
  FileSpreadsheet,
  Filter,
  History,
  Lock,
  Plus,
  Printer,
  Receipt,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Unlock,
  User,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  formatKES,
  formatMonthName,
  getCurrentMonthKey,
  getPreviousMonthKey,
} from '../lib/formatters';
import { getFloorDisplayName } from '../lib/namingEngine';
import { Payment, PaymentMethod, PaymentStatus, Unit } from '../types';

export const CashBookScreen: React.FC = () => {
  const {
    currentProperty,
    units,
    tenants,
    payments,
    expenses,
    cashBookEntries,
    recordPayment,
    approvePayment,
    rejectPayment,
    voidPayment,
    deletePayment,
    openPaymentModal,
    openExpenseModal,
    openReceiptModal,
    broadcastLiveAction,
  } = useApp();

  const { activeRole } = useAuth();

  const currentMonthKey = getCurrentMonthKey();
  const previousMonthKey = getPreviousMonthKey(currentMonthKey);

  // Month & View states (defaults directly to Current Month's Rent Book)
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [viewMode, setViewMode] = useState<'counter-book' | 'excel-grid' | 'audit-ledger'>('counter-book');
  const [isEditLocked, setIsEditLocked] = useState<boolean>(true); // Locked by default for data integrity
  const [isClosedPeriodVerified, setIsClosedPeriodVerified] = useState<boolean>(false); // Delete icon ONLY appears under verify closed period option
  const [searchQuery, setSearchQuery] = useState('');
  const [activeUnitInline, setActiveUnitInline] = useState<string | null>(null);

  // Auto-lock closed period verification and hide delete icons whenever month changes
  useEffect(() => {
    setIsClosedPeriodVerified(false);
  }, [selectedMonth]);

  // Draft inputs for Excel fast row entry per unit
  const [rowInputs, setRowInputs] = useState<
    Record<
      string,
      {
        amount: string;
        reference: string;
        method: PaymentMethod;
        date: string;
        isSubmitting?: boolean;
      }
    >
  >({});

  const effectiveMonth = selectedMonth === 'all' ? currentMonthKey : selectedMonth;
  const isViewingPastMonth = selectedMonth !== 'all' && selectedMonth < currentMonthKey;

  // 1. SORT UNITS IN STRICT PHYSICAL ORDER (House 1, House 2, House 3... / G1, G2, 101, 102...)
  const sortedUnits = useMemo(() => {
    return [...units].sort((a, b) => {
      if (a.floor_number !== b.floor_number) {
        return a.floor_number - b.floor_number;
      }
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [units]);

  // 2. COMPOSE UNIT LEDGER ROWS FOR THE SELECTED MONTH
  const unitLedgerRows = useMemo(() => {
    return sortedUnits
      .map((unit) => {
        const tenant = tenants.find(
          (t) => t.unit_id === unit.id && !t.move_out_date && !t.deleted_at
        );

        // All non-deleted, non-void payments for this house covering this month
        const unitPayments = payments
          .filter(
            (p) =>
              !p.deleted_at &&
              p.unit_id === unit.id &&
              p.covers_month === effectiveMonth &&
              p.status !== 'void' &&
              p.status !== 'rejected'
          )
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const approvedPaid = unitPayments
          .filter((p) => p.status === 'approved')
          .reduce((sum, p) => sum + p.amount, 0);

        const pendingPaid = unitPayments
          .filter((p) => p.status === 'pending')
          .reduce((sum, p) => sum + p.amount, 0);

        const totalPaid = approvedPaid + pendingPaid;
        const isVacant = unit.status === 'vacant' && !tenant;
        const expectedRent = isVacant && unitPayments.length === 0 ? 0 : unit.monthly_rent;
        const balance = expectedRent - totalPaid;

        const hasNoRecord = unitPayments.length === 0;

        return {
          unit,
          tenant,
          unitPayments,
          approvedPaid,
          pendingPaid,
          totalPaid,
          isVacant,
          expectedRent,
          balance,
          hasNoRecord,
        };
      })
      .filter((row) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const houseMatch = row.unit.name.toLowerCase().includes(q);
        const tenantMatch = row.tenant?.full_name.toLowerCase().includes(q) || false;
        const refMatch = row.unitPayments.some((p) => p.reference.toLowerCase().includes(q));
        return houseMatch || tenantMatch || refMatch;
      });
  }, [sortedUnits, tenants, payments, effectiveMonth, searchQuery]);

  // 3. MONTH RECONCILIATION TOTALS (NO CONFUSING RUNNING BANK BALANCE)
  const totalUnitsCount = sortedUnits.length;
  const occupiedUnitsCount = sortedUnits.filter((u) => u.status === 'occupied').length;

  const totalExpectedRent = unitLedgerRows.reduce((sum, r) => sum + r.expectedRent, 0);
  const totalRentCollected = unitLedgerRows.reduce((sum, r) => sum + r.approvedPaid, 0);
  const totalRentPending = unitLedgerRows.reduce((sum, r) => sum + r.pendingPaid, 0);
  const totalShortfall = unitLedgerRows.reduce((sum, r) => sum + (r.balance > 0 ? r.balance : 0), 0);

  // Month Compound Expenses
  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchProperty = !currentProperty || e.property_id === currentProperty.id;
      const matchMonth = e.date.slice(0, 7) === effectiveMonth;
      return matchProperty && matchMonth && !e.deleted_at;
    });
  }, [expenses, currentProperty, effectiveMonth]);

  const totalExpenses = monthExpenses.reduce(
    (sum, e) => (e.status === 'approved' ? sum + e.amount : sum),
    0
  );

  const netCashRemittance = totalRentCollected - totalExpenses;
  const collectionRate =
    totalExpectedRent > 0 ? Math.min(100, Math.round((totalRentCollected / totalExpectedRent) * 100)) : 100;

  // 4. CHRONOLOGICAL TRANSACTIONS (FOR AUDIT TAB)
  const filteredAuditEntries = useMemo(() => {
    return cashBookEntries.filter((item) => {
      const coversMonth = (item.rawItem as Payment)?.covers_month;
      const dateMonth = item.date.slice(0, 7);
      if (selectedMonth !== 'all') {
        if (coversMonth) {
          if (coversMonth !== selectedMonth) return false;
        } else if (dateMonth !== selectedMonth) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.description.toLowerCase().includes(q) ||
          item.reference.toLowerCase().includes(q) ||
          item.tenant_name?.toLowerCase().includes(q) ||
          item.recorded_by_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [cashBookEntries, selectedMonth, searchQuery]);

  // 5. INLINE EXCEL FAST SAVE HANDLER
  const handleInlineSave = async (unit: Unit, tenantId?: string) => {
    const draft = rowInputs[unit.id] || {
      amount: String(unit.monthly_rent),
      reference: '',
      method: 'M-Pesa',
      date: new Date().toISOString().slice(0, 10),
    };

    const amountNum = parseFloat(draft.amount);
    if (!amountNum || amountNum <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    if (!draft.reference || !draft.reference.trim()) {
      alert('Please enter an M-Pesa reference code or cash receipt number.');
      return;
    }

    setRowInputs((prev) => ({
      ...prev,
      [unit.id]: { ...draft, isSubmitting: true },
    }));

    try {
      const res = await recordPayment({
        unit_id: unit.id,
        tenant_id: tenantId || 'unassigned',
        date: draft.date || new Date().toISOString().slice(0, 10),
        amount: amountNum,
        method: draft.method || 'M-Pesa',
        reference: draft.reference.trim().toUpperCase(),
        covers_month: effectiveMonth,
      });

      if (res.success) {
        setRowInputs((prev) => {
          const updated = { ...prev };
          delete updated[unit.id];
          return updated;
        });
        setActiveUnitInline(null);
        broadcastLiveAction?.(
          `Logged KES ${amountNum.toLocaleString()} for House ${unit.name} [Ref: ${draft.reference.trim().toUpperCase()}]`,
          'success'
        );
      }
    } finally {
      setRowInputs((prev) => ({
        ...prev,
        [unit.id]: {
          ...(prev[unit.id] || draft),
          isSubmitting: false,
        },
      }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRejectPrompt = (paymentId: string) => {
    const reason = prompt('Enter reason for rejecting this caretaker payment entry:');
    if (reason) {
      rejectPayment(paymentId, reason);
    }
  };

  const handleDeletePayment = async (payment: Payment, houseName?: string) => {
    const confirmDelete = window.confirm(
      `Delete payment record of ${formatKES(payment.amount)}?\n\n` +
      `House: ${houseName || 'Unit'}\n` +
      `Reference: ${payment.reference} (${payment.method})\n` +
      `Date: ${payment.date}\n\n` +
      `This will remove the entry from the cash book and update the house balance immediately.`
    );
    if (!confirmDelete) return;

    const res = await deletePayment(
      payment.id,
      `Removed misplaced or accidental entry of ${formatKES(payment.amount)} for House ${houseName || ''}`
    );
    if (!res.success) {
      alert(res.message || 'Failed to delete payment');
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-12 select-none">
      {/* =================================================================== */}
      {/* 1. TOP HEADER & CONTROLS                                            */}
      {/* =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 sm:p-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Rent Cash Book & Ledger</span>
            </h1>
            <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 bg-slate-800 border border-slate-700">
              {currentProperty?.name}
            </span>
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              · {formatMonthName(effectiveMonth)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            House-by-house rent ledger, grouped multi-receipts, and compound cash reconciliation
          </p>
        </div>

        {/* Master Actions & Edit Lock */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Master Edit Lock Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsEditLocked(!isEditLocked);
              broadcastLiveAction?.(
                isEditLocked
                  ? 'Cash Book Unlocked: Excel Fast Grid Entry enabled'
                  : 'Cash Book Locked: Protected against accidental edits',
                isEditLocked ? 'warning' : 'info'
              );
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border transition active:scale-95 min-h-[40px] shadow-sm ${
              isEditLocked
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-500 font-black'
            }`}
            title={isEditLocked ? 'Click to unlock fast data entry' : 'Click to lock cash book and prevent changes'}
          >
            {isEditLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cash Book Locked</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-slate-950" />
                <span>Edit Mode Active (Lock 🔒)</span>
              </>
            )}
          </button>

          {/* Verify Closed Period Option Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !isClosedPeriodVerified;
              setIsClosedPeriodVerified(next);
              broadcastLiveAction?.(
                next
                  ? `Verified Closed Period for ${formatMonthName(effectiveMonth)}: Deletion icons unlocked`
                  : 'Closed Period locked: Deletion icons hidden',
                next ? 'warning' : 'info'
              );
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border transition active:scale-95 min-h-[40px] shadow-sm ${
              isClosedPeriodVerified
                ? 'bg-rose-700 hover:bg-rose-600 text-white border-rose-500 font-black'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={
              isClosedPeriodVerified
                ? 'Click to lock closed period and hide delete icons'
                : 'Verify closed period to unlock record deletion for misplaced entries'
            }
          >
            {isClosedPeriodVerified ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-white" />
                <span>Closed Period Verified (Delete Active 🗑️)</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Verify Closed Period</span>
              </>
            )}
          </button>

          {/* Record Rent Modal Fallback */}
          <button
            type="button"
            onClick={() =>
              openPaymentModal(
                selectedMonth !== 'all' ? { coversMonth: selectedMonth } : null
              )
            }
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition active:scale-95 shadow-sm min-h-[40px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Record Rent</span>
          </button>

          {/* Record Compound Expense */}
          <button
            type="button"
            onClick={() => openExpenseModal()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition active:scale-95 min-h-[40px]"
          >
            <Plus className="w-3.5 h-3.5 text-rose-400" />
            <span>+ Expense</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition active:scale-95 shrink-0 min-h-[40px]"
            title="Print clean counter book statement"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span className="hidden min-[600px]:inline">Print Book</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. MONTH NAVIGATION & HISTORICAL PERIOD SELECTOR                    */}
      {/* =================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-900 border border-slate-800 p-2.5 sm:p-3 print:hidden">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ledger Month:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedMonth(currentMonthKey)}
            className={`px-3 py-1.5 text-xs font-bold transition min-h-[36px] ${
              selectedMonth === currentMonthKey
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Current ({formatMonthName(currentMonthKey)})
          </button>

          <button
            type="button"
            onClick={() => setSelectedMonth(previousMonthKey)}
            className={`px-3 py-1.5 text-xs font-bold transition min-h-[36px] ${
              selectedMonth === previousMonthKey
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Previous ({formatMonthName(previousMonthKey)})
          </button>
        </div>

        {/* View Mode Switcher + Month Picker */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Tabs */}
          <div className="flex items-center bg-slate-800 border border-slate-700 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('counter-book')}
              className={`px-2.5 py-1 text-xs font-bold transition flex items-center gap-1 ${
                viewMode === 'counter-book'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Kasuku Counter Book format: Ordered House 1..N, grouped multi-receipts, clear money boxes"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Counter Book</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('excel-grid');
                setIsEditLocked(false);
              }}
              className={`px-2.5 py-1 text-xs font-bold transition flex items-center gap-1 ${
                viewMode === 'excel-grid'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Spreadsheet fast entry matrix with editable columns/rows"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('audit-ledger')}
              className={`px-2.5 py-1 text-xs font-bold transition flex items-center gap-1 ${
                viewMode === 'audit-ledger'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Raw chronological Money In / Money Out timeline"
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Log</span>
            </button>
          </div>

          {/* Jump to specific month input */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400 hidden lg:inline">Jump:</span>
            <input
              type="month"
              value={selectedMonth !== 'all' ? selectedMonth : currentMonthKey}
              onChange={(e) => setSelectedMonth(e.target.value || currentMonthKey)}
              className="bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[36px]"
            />
          </div>
        </div>
      </div>

      {/* 2b. PAST MONTH WARNING & VERIFY CLOSED PERIOD BANNER */}
      {isViewingPastMonth && (
        <div
          className={`p-3 text-xs border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden transition ${
            isClosedPeriodVerified
              ? 'bg-rose-950/30 border-rose-600/70 text-rose-200'
              : 'bg-amber-950/40 border-amber-600/60 text-amber-200'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2.5">
            {isClosedPeriodVerified ? (
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <div>
              <div className="font-bold flex items-center gap-2">
                <span>Closed Period: {formatMonthName(selectedMonth)}</span>
                <span
                  className={`px-1.5 py-0.2 font-mono text-[10px] uppercase font-bold border ${
                    isClosedPeriodVerified
                      ? 'bg-rose-900/60 text-rose-300 border-rose-600'
                      : 'bg-amber-900/60 text-amber-300 border-amber-700'
                  }`}
                >
                  {isClosedPeriodVerified ? 'Correction Mode Active' : 'Period Locked'}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] opacity-90 leading-relaxed">
                {isClosedPeriodVerified
                  ? 'Closed period verified for audit corrections. You may now delete misplaced or accidental cash/receipt entries directly from unit blocks.'
                  : 'Historical records locked. Delete controls for misplaced cash/receipts are hidden until you verify closed period authorization.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = !isClosedPeriodVerified;
              setIsClosedPeriodVerified(next);
              broadcastLiveAction?.(
                next
                  ? `Verified Closed Period for ${formatMonthName(selectedMonth)}: Deletion icons unlocked`
                  : 'Closed Period locked: Deletion icons hidden',
                next ? 'warning' : 'info'
              );
            }}
            className={`px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 border shrink-0 ${
              isClosedPeriodVerified
                ? 'bg-rose-700 hover:bg-rose-600 text-white border-rose-500 font-black'
                : 'bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-500 font-bold'
            }`}
          >
            {isClosedPeriodVerified ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Closed Period 🔒</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verify Closed Period (Unlock Delete)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 2c. LOCKED DOWN NOTIFICATION BANNER */}
      {isEditLocked && viewMode !== 'audit-ledger' && (
        <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-slate-400 flex items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 inline-block" />
            <span>
              <strong>Protected View:</strong> Cash Book is locked against accidental edits. Click{' '}
              <span className="text-slate-200 font-semibold underline cursor-pointer" onClick={() => setIsEditLocked(false)}>
                Unlock
              </span>{' '}
              to enable Excel-style row data entry.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsEditLocked(false)}
            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 font-mono"
          >
            Unlock Now
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. MONTH RECONCILIATION SUMMARY (NO CONFUSING RUNNING BALANCE)      */}
      {/* =================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3 bg-slate-900 border border-slate-800 p-3 sm:p-4">
        {/* Total Houses & Occupancy */}
        <div>
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Houses
          </span>
          <div className="text-sm sm:text-lg font-black text-slate-100 font-mono">
            {totalUnitsCount} Units
          </div>
          <div className="text-[10px] text-slate-400">
            {occupiedUnitsCount} Occupied · {totalUnitsCount - occupiedUnitsCount} Vacant
          </div>
        </div>

        {/* Expected Rent */}
        <div>
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Expected Rent
          </span>
          <div className="text-sm sm:text-lg font-black text-slate-200 font-mono">
            {formatKES(totalExpectedRent)}
          </div>
          <div className="text-[10px] text-slate-400">
            For {formatMonthName(effectiveMonth)}
          </div>
        </div>

        {/* Collected Rent (Money In) */}
        <div>
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <span>Total Collected</span>
            <span className="text-[9px] font-mono text-emerald-400 font-bold">
              ({collectionRate}%)
            </span>
          </span>
          <div className="text-sm sm:text-lg font-black text-emerald-400 font-mono">
            {formatKES(totalRentCollected)}
          </div>
          {totalRentPending > 0 && (
            <div className="text-[10px] text-amber-400 font-mono">
              +{formatKES(totalRentPending)} pending approval
            </div>
          )}
        </div>

        {/* Unpaid Shortfall */}
        <div>
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Unpaid Shortfall
          </span>
          <div className="text-sm sm:text-lg font-black text-rose-400 font-mono">
            {formatKES(totalShortfall)}
          </div>
          <div className="text-[10px] text-slate-400">
            {unitLedgerRows.filter((r) => r.balance > 0).length} house(s) with balance
          </div>
        </div>

        {/* Net Landlord Cash in Hand (Rent minus Compound Expenses) */}
        <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-3">
          <span className="text-[10px] sm:text-[11px] font-black text-sky-400 uppercase tracking-wider">
            Net Landlord Cash
          </span>
          <div className="text-sm sm:text-xl font-black text-sky-300 font-mono">
            {formatKES(netCashRemittance)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Less {formatKES(totalExpenses)} expenses
          </div>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="flex items-center justify-between gap-2.5 bg-slate-900/60 border border-slate-800 p-2.5 print:hidden">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search house (e.g. G1, 102), tenant, M-Pesa ref..."
            className="w-full bg-slate-800 border border-slate-700 pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[38px]"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono hidden sm:block">
          Showing {unitLedgerRows.length} Houses in Order
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. VIEW MODE A: AUTHENTIC KASUKU RENT COUNTER BOOK (DEFAULT)        */}
      {/* =================================================================== */}
      {(viewMode === 'counter-book' || viewMode === 'excel-grid') && (
        <div className="bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          {/* Print Only Header */}
          <div className="hidden print:block p-4 border-b border-black text-black">
            <h2 className="text-lg font-black uppercase tracking-tight">
              {currentProperty?.name} — RENT CASH BOOK
            </h2>
            <p className="text-xs">
              Period: {formatMonthName(effectiveMonth)} · Printed on:{' '}
              {new Date().toLocaleDateString('en-GB')}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-800 text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-700 shadow-sm print:bg-slate-200 print:text-black">
                <tr>
                  <th className="px-3.5 py-3 w-28 whitespace-nowrap">House #</th>
                  <th className="px-3.5 py-3 w-48">Tenant / Contact</th>
                  <th className="px-3.5 py-3 text-right w-28 whitespace-nowrap">Monthly Rent</th>
                  <th className="px-3.5 py-3 min-w-[260px]">
                    Rent Payments & Receipts (Encased Money Box)
                  </th>
                  <th className="px-3.5 py-3 text-right w-36 whitespace-nowrap">House Balance</th>
                  {!isEditLocked && (
                    <th className="px-3.5 py-3 min-w-[240px] print:hidden">
                      ⚡ Excel Fast Row Entry
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-slate-300">
                {unitLedgerRows.length === 0 ? (
                  <tr>
                    <td colSpan={isEditLocked ? 5 : 6} className="px-4 py-8 text-center text-slate-400 italic">
                      No units found matching your search.
                    </td>
                  </tr>
                ) : (
                  unitLedgerRows.map((row) => {
                    const {
                      unit,
                      tenant,
                      unitPayments,
                      totalPaid,
                      expectedRent,
                      balance,
                      hasNoRecord,
                      isVacant,
                    } = row;

                    const isExpanded = activeUnitInline === unit.id;
                    const draft = rowInputs[unit.id] || {
                      amount: balance > 0 ? String(balance) : String(unit.monthly_rent),
                      reference: '',
                      method: 'M-Pesa',
                      date: new Date().toISOString().slice(0, 10),
                    };

                    return (
                      <tr
                        key={unit.id}
                        className={`hover:bg-slate-800/40 transition print:hover:bg-transparent ${
                          hasNoRecord && !isVacant ? 'bg-rose-950/10' : ''
                        }`}
                      >
                        {/* 1. HOUSE # & FLOOR */}
                        <td className="px-3.5 py-3 align-top font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-slate-100">
                              House {unit.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {getFloorDisplayName(unit.floor_number)}
                          </span>
                          <span
                            className={`inline-block mt-1 px-1.5 py-0.2 text-[9px] font-bold uppercase font-mono ${
                              unit.status === 'occupied'
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                                : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {unit.status}
                          </span>
                        </td>

                        {/* 2. TENANT / CONTACT */}
                        <td className="px-3.5 py-3 align-top">
                          {tenant ? (
                            <div>
                              <div className="font-bold text-slate-100 flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                <span>{tenant.full_name}</span>
                              </div>
                              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                {tenant.phone}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">
                              Empty House (Vacant)
                            </span>
                          )}
                        </td>

                        {/* 3. MONTHLY RENT DUE */}
                        <td className="px-3.5 py-3 align-top text-right font-mono">
                          <span className="font-bold text-slate-200">
                            {formatKES(unit.monthly_rent)}
                          </span>
                          {isVacant && unitPayments.length === 0 && (
                            <span className="text-[10px] text-slate-500 block">
                              (Vacant: KES 0 Due)
                            </span>
                          )}
                        </td>

                        {/* 4. RENT PAYMENTS & RECEIPTS (ENCASED MONEY BOX) */}
                        <td className="px-3.5 py-3 align-top">
                          {hasNoRecord ? (
                            /* Clear NO RECORD Box */
                            <div className="border border-dashed border-rose-800/70 bg-rose-950/20 px-3 py-2 text-xs flex items-center justify-between gap-2 shadow-sm">
                              <div className="flex items-center gap-2 text-rose-300 font-mono font-semibold">
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                <span>
                                  NO RECORD FOR {formatMonthName(effectiveMonth).toUpperCase()}
                                </span>
                              </div>
                              {!isEditLocked && (
                                <button
                                  type="button"
                                  onClick={() => setActiveUnitInline(unit.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase transition active:scale-95 shrink-0 print:hidden"
                                >
                                  + Record Rent
                                </button>
                              )}
                            </div>
                          ) : (
                            /* Encased Multi-Receipt Accounting Box */
                            <div className="border border-emerald-700/60 bg-emerald-950/20 p-2.5 flex flex-col gap-1.5 shadow-sm">
                              <div className="space-y-1">
                                {unitPayments.map((p, idx) => (
                                  <div
                                    key={p.id}
                                    className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 px-2 py-1 text-xs font-mono"
                                  >
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-black text-emerald-400">
                                        {formatKES(p.amount)}
                                      </span>
                                      <span className="text-[11px] text-slate-300">
                                        · {p.method.toUpperCase()}
                                      </span>
                                      <span className="text-[11px] text-slate-400 font-semibold">
                                        [{p.reference}]
                                      </span>
                                      {unitPayments.length > 1 && (
                                        <span className="text-[9px] font-bold bg-slate-800 text-emerald-400 border border-slate-700 px-1 py-0.2">
                                          Receipt #{idx + 1}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0">
                                      <span>{p.date}</span>
                                      {p.status === 'pending' && (
                                        <span className="px-1 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 font-bold uppercase text-[9px]">
                                          Pending Review
                                        </span>
                                      )}
                                      {/* Official Print Receipt Voucher Button */}
                                      <button
                                        type="button"
                                        onClick={() => openReceiptModal(p)}
                                        className="p-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition print:hidden"
                                        title={`Print Official Rent Receipt for ${formatKES(p.amount)} [Ref: ${p.reference}]`}
                                      >
                                        <Printer className="w-3.5 h-3.5 text-sky-400" />
                                      </button>
                                      {/* Delete button: strictly under verify closed period option! Otherwise icon does NOT appear */}
                                      {isClosedPeriodVerified && (activeRole !== 'caretaker' || p.status === 'pending') && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeletePayment(p, unit.name)}
                                          className="p-1 text-rose-300 hover:text-white bg-rose-950/80 hover:bg-rose-900 border border-rose-800 transition print:hidden"
                                          title={`Delete misplaced record of ${formatKES(p.amount)} [Ref: ${p.reference}]`}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Subtotal if multi-receipt */}
                              {unitPayments.length > 1 && (
                                <div className="flex items-center justify-between pt-1 border-t border-emerald-800/40 px-1 text-xs font-mono">
                                  <span className="text-slate-400 font-bold">
                                    Total Paid ({unitPayments.length} Receipts):
                                  </span>
                                  <span className="text-emerald-300 font-black">
                                    {formatKES(totalPaid)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 5. HOUSE BALANCE (NO CONFUSING RUNNING BANK BALANCE) */}
                        <td className="px-3.5 py-3 align-top text-right font-mono">
                          {balance === 0 ? (
                            <span className="inline-block px-2 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-black uppercase">
                              Cleared (KES 0)
                            </span>
                          ) : balance > 0 ? (
                            <span className="inline-block px-2 py-1 bg-rose-950 text-rose-300 border border-rose-800 text-[11px] font-black uppercase">
                              Owes {formatKES(balance)}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 bg-sky-950 text-sky-300 border border-sky-800 text-[11px] font-black uppercase">
                              Advance +{formatKES(Math.abs(balance))}
                            </span>
                          )}
                        </td>

                        {/* 6. EXCEL SPREADSHEET FAST ROW ENTRY (ACTIVE WHEN UNLOCKED) */}
                        {!isEditLocked && (
                          <td className="px-3.5 py-2.5 align-top print:hidden">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Amount input */}
                              <input
                                type="number"
                                value={draft.amount}
                                onChange={(e) =>
                                  setRowInputs((prev) => ({
                                    ...prev,
                                    [unit.id]: { ...draft, amount: e.target.value },
                                  }))
                                }
                                placeholder="Amount"
                                className="w-20 bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />

                              {/* M-Pesa / Receipt Ref input */}
                              <input
                                type="text"
                                value={draft.reference}
                                onChange={(e) =>
                                  setRowInputs((prev) => ({
                                    ...prev,
                                    [unit.id]: { ...draft, reference: e.target.value },
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleInlineSave(unit, tenant?.id);
                                  }
                                }}
                                placeholder="M-Pesa Ref / Receipt"
                                className="w-28 bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-100 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />

                              {/* Method */}
                              <select
                                value={draft.method}
                                onChange={(e) =>
                                  setRowInputs((prev) => ({
                                    ...prev,
                                    [unit.id]: {
                                      ...draft,
                                      method: e.target.value as PaymentMethod,
                                    },
                                  }))
                                }
                                className="bg-slate-800 border border-slate-700 px-1.5 py-1 text-xs text-slate-300 focus:outline-none"
                              >
                                <option value="M-Pesa">M-Pesa</option>
                                <option value="Cash">Cash</option>
                                <option value="Bank">Bank</option>
                                <option value="Cheque">Cheque</option>
                              </select>

                              {/* Date */}
                              <input
                                type="date"
                                value={draft.date}
                                onChange={(e) =>
                                  setRowInputs((prev) => ({
                                    ...prev,
                                    [unit.id]: { ...draft, date: e.target.value },
                                  }))
                                }
                                className="bg-slate-800 border border-slate-700 px-1 py-1 text-xs text-slate-300 focus:outline-none font-mono"
                              />

                              {/* 1-Click Save */}
                              <button
                                type="button"
                                disabled={draft.isSubmitting}
                                onClick={() => handleInlineSave(unit, tenant?.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase transition active:scale-95 shadow-sm"
                                title="Record payment directly to cash book"
                              >
                                {draft.isSubmitting ? '...' : 'Save'}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. COMPOUND EXPENSES SECTION (MONEY OUT)                           */}
      {/* =================================================================== */}
      <div className="bg-slate-900 border border-slate-800 p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-black text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
              <span>Compound Expenses for {formatMonthName(effectiveMonth)}</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Caretaker allowance, water bills, electricity tokens, garbage collection, and site repairs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-rose-400 text-sm">
              Total Out: {formatKES(totalExpenses)}
            </span>
            <button
              type="button"
              onClick={() => openExpenseModal()}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition active:scale-95 print:hidden"
            >
              + Add Expense
            </button>
          </div>
        </div>

        {monthExpenses.length === 0 ? (
          <div className="py-4 text-center text-slate-500 text-xs italic">
            No compound expenses logged for {formatMonthName(effectiveMonth)}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Payee / Purpose</th>
                  <th className="px-3 py-2 text-right">Amount (KES)</th>
                  <th className="px-3 py-2">Recorded By</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {monthExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40">
                    <td className="px-3 py-2 font-mono text-slate-400">{exp.date}</td>
                    <td className="px-3 py-2 font-bold text-slate-300 uppercase text-[10px]">
                      {exp.category}
                    </td>
                    <td className="px-3 py-2 text-slate-200">
                      <div className="font-semibold">{exp.payee}</div>
                      {exp.note && <div className="text-[10px] text-slate-400">{exp.note}</div>}
                    </td>
                    <td className="px-3 py-2 font-mono font-black text-rose-400 text-right">
                      -{formatKES(exp.amount)}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-400 text-[11px]">
                      {exp.recorder_name || 'Admin'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                          exp.status === 'approved'
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-amber-950 text-amber-300'
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 6. VIEW MODE B: RAW CHRONOLOGICAL AUDIT TIMELINE (FOR ACCOUNTANTS)  */}
      {/* =================================================================== */}
      {viewMode === 'audit-ledger' && (
        <div className="bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Raw Chronological Audit Timeline</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {filteredAuditEntries.length} Transactions
            </span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-800 text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-700">
                <tr>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Period</th>
                  <th className="px-3 py-2.5">Description</th>
                  <th className="px-3 py-2.5">Method / Ref</th>
                  <th className="px-3 py-2.5 text-right">Money In</th>
                  <th className="px-3 py-2.5 text-right">Money Out</th>
                  <th className="px-3 py-2.5">Recorded By</th>
                  <th className="px-3 py-2.5 text-center">Status / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredAuditEntries.map((item) => {
                  const isPending = item.status === 'pending';
                  const coversMonth = (item.rawItem as Payment)?.covers_month;
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isPending ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="px-3 py-2 font-mono text-slate-400">{item.date}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-slate-300">
                        {coversMonth || '—'}
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-200">
                        {item.description}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-400">
                        {item.categoryOrMethod} ({item.reference})
                      </td>
                      <td className="px-3 py-2 font-mono font-bold text-emerald-400 text-right">
                        {item.money_in > 0 ? `+${formatKES(item.money_in)}` : '—'}
                      </td>
                      <td className="px-3 py-2 font-mono font-bold text-rose-400 text-right">
                        {item.money_out > 0 ? `-${formatKES(item.money_out)}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-400 text-[11px]">
                        {item.recorded_by_name}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {isPending && activeRole !== 'caretaker' ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => approvePayment(item.id)}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectPrompt(item.id)}
                              className="px-2 py-0.5 bg-slate-800 text-rose-300 font-semibold text-[10px]"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.2 text-[9px] font-bold uppercase font-mono ${
                                item.status === 'approved'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : item.status === 'pending'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800'
                              }`}
                            >
                              {item.status}
                            </span>
                            {/* Delete button: strictly under verify closed period option! Otherwise icon does NOT appear */}
                            {isClosedPeriodVerified &&
                              item.type === 'in' &&
                              (activeRole !== 'caretaker' || item.status === 'pending') && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeletePayment(
                                      item.rawItem as Payment,
                                      item.description
                                    )
                                  }
                                  className="p-1 text-rose-300 hover:text-white bg-rose-950/80 hover:bg-rose-900 border border-rose-800 transition"
                                  title="Delete payment entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
