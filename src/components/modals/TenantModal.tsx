// =====================================================================
// RENTBOOK KENYA — TENANT MODAL (Assign, Edit, or Vacate Tenant)
// Handles Kenyan phone numbers, National ID, deposit paid, and move-out
// =====================================================================

import React, { useEffect, useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';

export const TenantModal: React.FC = () => {
  const { isTenantModalOpen, closeTenantModal, tenantModalData, units, saveTenant, vacateTenant } =
    useApp();

  const unit = units.find((u) => u.id === tenantModalData?.unitId);
  const existingTenant = tenantModalData?.tenant;

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [depositPaid, setDepositPaid] = useState<string>('');
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split('T')[0]);
  const [rentDueDay, setRentDueDay] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingTenant) {
      setFullName(existingTenant.full_name);
      setPhone(existingTenant.phone);
      setIdNumber(existingTenant.id_number || '');
      setDepositPaid(String(existingTenant.deposit_paid || 0));
      setMoveInDate(existingTenant.move_in_date);
      setRentDueDay(existingTenant.rent_due_day || 5);
    } else {
      setFullName('');
      setPhone('07');
      setIdNumber('');
      setDepositPaid(String(unit?.monthly_rent || 18000));
      setMoveInDate(new Date().toISOString().split('T')[0]);
      setRentDueDay(5);
    }
  }, [existingTenant, unit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !tenantModalData?.unitId) {
      alert('Please enter tenant name and phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveTenant({
        id: existingTenant?.id,
        unit_id: tenantModalData.unitId,
        full_name: fullName.trim(),
        phone: phone.trim(),
        id_number: idNumber.trim() || undefined,
        deposit_paid: parseFloat(depositPaid) || 0,
        move_in_date: moveInDate,
        move_out_date: null,
        rent_due_day: rentDueDay,
      });
      closeTenantModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVacate = async () => {
    if (!existingTenant) return;
    const moveOutDate = prompt('Enter move-out date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!moveOutDate) return;

    setIsSubmitting(true);
    try {
      await vacateTenant(existingTenant.id, moveOutDate);
      closeTenantModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isTenantModalOpen}
      onClose={closeTenantModal}
      title={existingTenant ? `Edit Tenant — House ${unit?.name || ''}` : `Assign Tenant to House ${unit?.name || ''}`}
      subtitle="Manages lease, phone contacts for SMS reminders, and deposits"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
        {/* Full Name */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Tenant Full Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Brian Otieno, Faith Chemutai"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            required
          />
        </div>

        {/* Phone & National ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Kenyan Phone (07xx / 01xx) <span className="text-rose-400">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0712345678"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">National ID Number</label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="e.g. 29883411"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>
        </div>

        {/* Deposit Paid & Rent Due Day */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Deposit Paid (KES)</label>
            <input
              type="number"
              value={depositPaid}
              onChange={(e) => setDepositPaid(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Monthly Rent Due Day</label>
            <select
              value={rentDueDay}
              onChange={(e) => setRentDueDay(parseInt(e.target.value) || 5)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            >
              {[1, 5, 7, 10, 15, 20].map((d) => (
                <option key={d} value={d}>
                  {d}th of the month
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Move-in Date */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Move-In Date</label>
          <input
            type="date"
            value={moveInDate}
            onChange={(e) => setMoveInDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            required
          />
        </div>

        {/* Vacate Tenant Option (If existing tenant) */}
        {existingTenant && (
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleVacate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/60 border border-rose-700/60 text-rose-300 hover:bg-rose-900/60 text-xs font-semibold transition min-h-[40px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Mark Moved Out (Vacate)</span>
            </button>
            <span className="text-[11px] text-slate-500">Unit will become Vacant</span>
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={closeTenantModal}
            className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 font-medium transition min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md hover:shadow-lg transition active:scale-95 disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Saving...' : 'Save Tenant'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
