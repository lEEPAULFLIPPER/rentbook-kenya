// =====================================================================
// RENTBOOK KENYA — UNIT MODAL (Inline House Edit & Rent Adjustment)
// Allows Landlord/Admin to rename a house, change rent, or add notes
// =====================================================================

import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const UnitModal: React.FC = () => {
  const { isUnitModalOpen, closeUnitModal, unitModalData, updateUnit, deleteUnit } = useApp();
  const { activeRole } = useAuth();

  const [name, setName] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'occupied' | 'vacant'>('vacant');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (unitModalData) {
      setName(unitModalData.name);
      setMonthlyRent(String(unitModalData.monthly_rent));
      setNotes(unitModalData.notes || '');
      setStatus(unitModalData.status);
    }
  }, [unitModalData]);

  if (!unitModalData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await updateUnit({
        ...unitModalData,
        name: name.trim(),
        monthly_rent: parseFloat(monthlyRent) || unitModalData.monthly_rent,
        notes: notes.trim() || undefined,
        status,
      });
      closeUnitModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (activeRole === 'caretaker') {
      alert('Caretakers cannot delete houses.');
      return;
    }
    const confirm = window.confirm(`Delete House ${unitModalData.name}?`);
    if (!confirm) return;

    const res = await deleteUnit(unitModalData.id);
    if (res.message) alert(res.message);
    closeUnitModal();
  };

  return (
    <Modal
      isOpen={isUnitModalOpen}
      onClose={closeUnitModal}
      title={`Edit House ${unitModalData.name}`}
      subtitle={`Floor ${unitModalData.floor_number} · Property Unit Settings`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
        {/* House Name (Inline Rename) */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            House / Door Label (e.g. rename to "A3 (Big)")
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={activeRole === 'caretaker'}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px] disabled:opacity-50"
            required
          />
        </div>

        {/* Monthly Rent (Admin / Landlord only) */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Monthly Rent Amount (KES)
          </label>
          <input
            type="number"
            value={monthlyRent}
            onChange={(e) => setMonthlyRent(e.target.value)}
            disabled={activeRole === 'caretaker'}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px] disabled:opacity-50"
            required
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Occupancy Status</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setStatus('occupied')}
              className={`py-2 rounded-xl font-bold border transition min-h-[44px] ${
                status === 'occupied'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Occupied
            </button>
            <button
              type="button"
              onClick={() => setStatus('vacant')}
              className={`py-2 rounded-xl font-bold border transition min-h-[44px] ${
                status === 'vacant'
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Vacant
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">House Notes / Condition</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Master ensuite, key with caretaker Jackson, tiles replaced"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          {activeRole !== 'caretaker' ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-rose-400 hover:text-rose-300 font-medium py-2 px-1 text-xs"
            >
              Delete / Archive House
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeUnitModal}
              className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 font-medium transition min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md hover:shadow-lg transition active:scale-95 disabled:opacity-50 min-h-[44px]"
            >
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
