// =====================================================================
// RENTBOOK KENYA — CONFIRM DANGER MODAL (Admin Only)
// Requires typing the word 'DELETE' in capital letters before proceeding
// =====================================================================

import React, { useState } from 'react';
import { AlertOctagon } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';

export const ConfirmDangerModal: React.FC = () => {
  const {
    isDangerModalOpen,
    closeDangerModal,
    dangerActionType,
    currentProperty,
    executeDangerPurge,
  } = useApp();

  const [confirmInput, setConfirmInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!dangerActionType) return null;

  const isConfirmed = confirmInput.trim() === 'DELETE';

  const getActionDetails = () => {
    switch (dangerActionType) {
      case 'units':
        return {
          title: `Delete All Houses in ${currentProperty?.name || 'Property'}`,
          desc: 'This will purge all house records in this flat. Payment records will be unlinked. 10-second undo available.',
        };
      case 'payments':
        return {
          title: 'Delete All Payment Records',
          desc: 'This will purge all rent collections and cash book history. 10-second undo available.',
        };
      case 'all':
        return {
          title: 'Full Factory Reset (Delete All Data)',
          desc: 'This will reset all properties, units, tenants, payments, expenses, and settings back to default demonstration state.',
        };
      default:
        return { title: 'Danger Zone Action', desc: '' };
    }
  };

  const details = getActionDetails();

  const handleExecute = async () => {
    if (!isConfirmed) return;
    setIsSubmitting(true);
    try {
      await executeDangerPurge(dangerActionType);
      closeDangerModal();
      setConfirmInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isDangerModalOpen}
      onClose={closeDangerModal}
      title={details.title}
      subtitle="Critical Administrative Action"
      maxWidth="md"
    >
      <div className="flex flex-col gap-4 text-xs">
        <div className="flex items-start gap-3 p-3 bg-rose-950/50 border border-rose-600/60 text-rose-200">
          <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{details.desc}</div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            To confirm this destructive action, please type{' '}
            <span className="font-mono font-bold text-rose-400">DELETE</span> below:
          </label>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder="Type DELETE"
            className="w-full bg-slate-800 border border-slate-700 px-3 py-2.5 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[44px]"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={closeDangerModal}
            className="px-4 py-2.5 text-slate-300 hover:bg-slate-800 font-medium transition min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={!isConfirmed || isSubmitting}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md hover:shadow-lg transition active:scale-95 disabled:opacity-30 disabled:pointer-events-none min-h-[44px]"
          >
            {isSubmitting ? 'Deleting...' : 'Confirm Purge'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
