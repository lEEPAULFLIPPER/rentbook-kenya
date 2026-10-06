// =====================================================================
// RENTBOOK KENYA — RECORD PAYMENT MODAL (Fast < 15 seconds)
// Big touch buttons, M-Pesa toggles, waterfall arrears pre-fill, receipt camera
// =====================================================================

import React, { useEffect, useState } from 'react';
import { Camera, Check, CreditCard, DollarSign } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { PaymentMethod } from '../../types';
import { formatKES, getCurrentMonthKey } from '../../lib/formatters';

export const RecordPaymentModal: React.FC = () => {
  const {
    isPaymentModalOpen,
    closePaymentModal,
    paymentPrefill,
    units,
    tenants,
    recordPayment,
    tenantArrears,
    settings,
  } = useApp();

  const { activeRole } = useAuth();

  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState<PaymentMethod>('M-Pesa');
  const [reference, setReference] = useState<string>('');
  const [coversMonth, setCoversMonth] = useState<string>(getCurrentMonthKey());
  const [note, setNote] = useState<string>('');
  const [receiptPhotoName, setReceiptPhotoName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or update fields when modal opens
  useEffect(() => {
    if (isPaymentModalOpen) {
      const initialUnitId =
        paymentPrefill?.unitId ||
        units.find((u) => u.status === 'occupied')?.id ||
        units[0]?.id ||
        '';

      setSelectedUnitId(initialUnitId);
      setDate(new Date().toISOString().split('T')[0]);
      setMethod('M-Pesa');
      setReference('');
      setNote('');
      setReceiptPhotoName('');
    }
  }, [isPaymentModalOpen, paymentPrefill, units]);

  // When selected unit changes, prefill tenant, amount and oldest unpaid month
  useEffect(() => {
    if (!selectedUnitId) return;

    const unit = units.find((u) => u.id === selectedUnitId);
    const tenant = tenants.find((t) => t.unit_id === selectedUnitId && !t.move_out_date && !t.deleted_at);
    const arrearsItem = tenantArrears.find((a) => a.unit.id === selectedUnitId);

    if (arrearsItem && arrearsItem.balance > 0) {
      // Pre-fill with outstanding debt or standard rent
      setAmount(String(unit?.monthly_rent || 0));
      setCoversMonth(arrearsItem.oldest_unpaid_month);
    } else if (unit) {
      setAmount(String(unit.monthly_rent));
      setCoversMonth(getCurrentMonthKey());
    }
  }, [selectedUnitId, units, tenants, tenantArrears]);

  const activeTenant = tenants.find(
    (t) => t.unit_id === selectedUnitId && !t.move_out_date && !t.deleted_at
  );
  const selectedUnit = units.find((u) => u.id === selectedUnitId);
  const arrearsInfo = tenantArrears.find((a) => a.unit.id === selectedUnitId);

  const numAmount = parseFloat(amount) || 0;
  const projectedBalance = arrearsInfo ? arrearsInfo.balance - numAmount : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitId || numAmount <= 0) {
      alert('Please select a house and enter a valid amount.');
      return;
    }

    if (!reference.trim()) {
      alert('Please enter an M-Pesa reference code or cash receipt number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await recordPayment({
        unit_id: selectedUnitId,
        tenant_id: activeTenant ? activeTenant.id : 'unassigned',
        date,
        amount: numAmount,
        method,
        reference: reference.trim().toUpperCase(),
        covers_month: coversMonth,
        note: note.trim() || undefined,
        receipt_url: receiptPhotoName ? `receipts/${receiptPhotoName}` : null,
      });

      if (res.success) {
        closePaymentModal();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const methodsList: PaymentMethod[] = ['M-Pesa', 'Cash', 'Bank', 'Cheque'];

  return (
    <Modal
      isOpen={isPaymentModalOpen}
      onClose={closePaymentModal}
      title="Record Rent Payment"
      subtitle={
        activeRole === 'caretaker' && settings.caretaker_approval_required
          ? 'Fast entry (will be submitted to Landlord for verification)'
          : 'Under 15-second entry into cash book'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
        {/* House / Unit Selector */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            House / Unit <span className="text-rose-400">*</span>
          </label>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            required
          >
            <option value="" disabled>
              Select house...
            </option>
            {units
              .filter((u) => !u.deleted_at)
              .map((u) => {
                const t = tenants.find((item) => item.unit_id === u.id && !item.move_out_date && !item.deleted_at);
                return (
                  <option key={u.id} value={u.id}>
                    House {u.name} — {t ? t.full_name : '(Vacant)'} (KSh {u.monthly_rent.toLocaleString()})
                  </option>
                );
              })}
          </select>
        </div>

        {/* Tenant Details Banner */}
        {activeTenant && (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">Current Tenant</div>
              <div className="text-xs font-bold text-slate-100">{activeTenant.full_name}</div>
              <div className="text-[11px] text-slate-400 font-mono">{activeTenant.phone}</div>
            </div>
            {arrearsInfo && (
              <div className="text-right">
                <div className="text-[11px] text-slate-400">Current Owed</div>
                <div
                  className={`text-xs font-black ${
                    arrearsInfo.balance > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {formatKES(arrearsInfo.balance)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Amount (Big field) */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Amount Paid (KES) <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
              KSh
            </span>
            <input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-14 pr-4 py-2.5 text-base sm:text-lg font-black text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
              required
            />
          </div>
        </div>

        {/* Payment Method Toggles */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1.5">Payment Method</label>
          <div className="grid grid-cols-4 gap-1.5">
            {methodsList.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`py-2 px-1 text-center rounded-xl font-bold text-xs border transition min-h-[44px] flex items-center justify-center gap-1 ${
                  method === m
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700/60'
                }`}
              >
                {method === m && <Check className="w-3.5 h-3.5" />}
                <span>{m}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reference / M-Pesa Code & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              {method === 'M-Pesa' ? 'M-Pesa Transaction Code' : 'Receipt / Ref Number'}{' '}
              <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              placeholder={method === 'M-Pesa' ? 'e.g. QKL892MN' : 'e.g. REC-104'}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono uppercase text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Payment Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              required
            />
          </div>
        </div>

        {/* Covering Month (Waterfall) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Paying For Month (Waterfall)
            </label>
            <input
              type="month"
              value={coversMonth}
              onChange={(e) => setCoversMonth(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              required
            />
          </div>

          {/* Optional Receipt Photo from Phone Camera */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Receipt Photo</label>
            <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700/60 cursor-pointer min-h-[44px] text-slate-300">
              <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">
                {receiptPhotoName ? receiptPhotoName : 'Snap / attach receipt'}
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setReceiptPhotoName(file.name);
                  }
                }}
              />
            </label>
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Optional Note</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Paid in cash at the gate, promised balance on Friday"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
          />
        </div>

        {/* Live Balance Preview */}
        {arrearsInfo && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">Projected Tenant Balance:</span>
            <span
              className={`font-black text-sm ${
                projectedBalance > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {formatKES(projectedBalance)}
            </span>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={closePaymentModal}
            className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 font-medium transition min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md hover:shadow-lg transition active:scale-95 disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Saving...' : 'Save Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
