// =====================================================================
// RENTBOOK KENYA — BULK RENAME MODAL
// Re-applies a naming scheme with before & after comparison table
// =====================================================================

import React, { useMemo, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { NamingSchemeConfig, NamingSchemeType } from '../../types';
import { generateUnitNames } from '../../lib/namingEngine';

export const BulkRenameModal: React.FC = () => {
  const {
    isBulkRenameModalOpen,
    closeBulkRenameModal,
    bulkRenamePropertyId,
    properties,
    units,
    bulkRenameUnits,
  } = useApp();

  const property = properties.find((p) => p.id === bulkRenamePropertyId);
  const propertyUnits = units.filter((u) => u.property_id === bulkRenamePropertyId && !u.deleted_at);

  const [schemeType, setSchemeType] = useState<NamingSchemeType>('scheme1');
  const [prefixWord, setPrefixWord] = useState<'House' | 'Unit' | 'Door'>('House');
  const [customPattern, setCustomPattern] = useState('{block}{floor}{index}');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schemeConfig = useMemo<NamingSchemeConfig>(() => {
    return { type: schemeType, prefixWord, customPattern };
  }, [schemeType, prefixWord, customPattern]);

  const newNames = useMemo(() => {
    if (!property) return [];
    return generateUnitNames(property.floors, property.units_per_floor, schemeConfig, property.blocks);
  }, [property, schemeConfig]);

  if (!property) return null;

  const handleApply = async () => {
    const confirmed = window.confirm(
      `Apply bulk rename across all ${propertyUnits.length} units in ${property.name}? This will overwrite custom names.`
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await bulkRenameUnits(property.id, schemeConfig);
      closeBulkRenameModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isBulkRenameModalOpen}
      onClose={closeBulkRenameModal}
      title={`Bulk Rename Houses — ${property.name}`}
      subtitle="Re-apply an auto-naming convention across all flats"
      maxWidth="lg"
    >
      <div className="flex flex-col gap-4 text-xs">
        {/* Scheme Picker */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Select Target Naming Scheme</span>
          </label>
          <select
            value={schemeType}
            onChange={(e) => setSchemeType(e.target.value as NamingSchemeType)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 min-h-[44px]"
          >
            <option value="scheme1">Scheme 1: Block + Unit (Ground=A1..A4, 1st=B1..B4)</option>
            <option value="scheme2">Scheme 2: Floor Prefix + Number (G1..G4, F1..F4, S1..S4)</option>
            <option value="scheme3">Scheme 3: Simple Sequential (1, 2, 3, 4, 5...)</option>
            <option value="scheme4">Scheme 4: Floor Number + Letter (1A, 1B, 2A, 2B...)</option>
            <option value="scheme5">Scheme 5: Word Prefix (House 1, House 2...)</option>
            <option value="scheme6">Scheme 6: Custom Token Pattern</option>
          </select>
        </div>

        {/* Side-by-Side Comparison Table */}
        <div className="border border-slate-700/80 rounded-xl overflow-hidden bg-slate-950/60 max-h-64 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
              <tr>
                <th className="px-3 py-2 font-semibold">Current Name</th>
                <th className="px-3 py-2 text-center w-8"></th>
                <th className="px-3 py-2 font-semibold text-emerald-400">New Auto-Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {propertyUnits.map((u, i) => (
                <tr key={u.id} className="hover:bg-slate-800/40">
                  <td className="px-3 py-2 font-mono text-slate-300">{u.name}</td>
                  <td className="px-3 py-2 text-center text-slate-500">
                    <ArrowRight className="w-3.5 h-3.5 inline" />
                  </td>
                  <td className="px-3 py-2 font-mono font-bold text-emerald-400">
                    {newNames[i]?.name || u.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Warning Callout */}
        <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-3 text-[11px] text-amber-200">
          <strong>Note:</strong> Bulk rename will overwrite any manual custom labels (such as
          "A3 (Big)"). Tenants and payment histories will remain intact.
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={closeBulkRenameModal}
            className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 font-medium transition min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md hover:shadow-lg transition active:scale-95 disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Applying...' : 'Apply Bulk Rename'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
