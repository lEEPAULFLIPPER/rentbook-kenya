// =====================================================================
// RENTBOOK KENYA — ADD EXPENSE MODAL (Money Out)
// Logs property expenses (Repairs, Nairobi Water, KPLC tokens, salaries)
// =====================================================================

import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory } from '../../types';

export const AddExpenseModal: React.FC = () => {
  const {
    isExpenseModalOpen,
    closeExpenseModal,
    currentProperty,
    visibleProperties,
    recordExpense,
  } = useApp();

  const [propertyId, setPropertyId] = useState(currentProperty?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Repairs');
  const [payee, setPayee] = useState('');
  const [note, setNote] = useState('');
  const [receiptPhotoName, setReceiptPhotoName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: ExpenseCategory[] = [
    'Repairs',
    'Water bill',
    'Electricity',
    'Caretaker salary',
    'Agent commission',
    'Garbage',
    'Security',
    'Rates',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0 || !payee.trim()) {
      alert('Please enter a valid amount and payee name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordExpense({
        property_id: propertyId || currentProperty?.id || '',
        date,
        amount: numAmount,
        category,
        payee: payee.trim(),
        note: note.trim() || undefined,
        receipt_url: receiptPhotoName ? `receipts/${receiptPhotoName}` : null,
      });
      closeExpenseModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isExpenseModalOpen}
      onClose={closeExpenseModal}
      title="Add Compound Expense (Money Out)"
      subtitle="Log repairs, water, power tokens, security, or caretaker payouts"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
        {/* Property */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Property</label>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            required
          >
            {visibleProperties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.location})
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Amount (KES) <span className="text-rose-400">*</span>
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
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-14 pr-4 py-2.5 text-base sm:text-lg font-black text-rose-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
              required
            />
          </div>
        </div>

        {/* Category & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Expense Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              required
            />
          </div>
        </div>

        {/* Payee */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Paid To (Payee / Vendor) <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            placeholder="e.g. Fundi Moses, Nairobi Water, KPLC Tokens, CleanCity"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            required
          />
        </div>

        {/* Optional Receipt Attachment */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Receipt Attachment</label>
          <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700/60 cursor-pointer min-h-[44px] text-slate-300">
            <Camera className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">
              {receiptPhotoName ? receiptPhotoName : 'Snap / attach receipt photo'}
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setReceiptPhotoName(file.name);
              }}
            />
          </label>
        </div>

        {/* Note */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Description / Notes</label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Replaced leaking PVC pipe behind House B3"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={closeExpenseModal}
            className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 font-medium transition min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md hover:shadow-lg transition active:scale-95 disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Saving...' : 'Save Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
