// =====================================================================
// RENTBOOK KENYA — PROPERTY & AUTO-NAMING CREATOR MODAL
// Auto-generates Kenyan flat conventions (A1..A4, G1..G4, etc.) with live preview
// =====================================================================

import React, { useMemo, useState } from 'react';
import { Building, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { NamingSchemeConfig, NamingSchemeType } from '../../types';
import { generateUnitNames } from '../../lib/namingEngine';

export const PropertyModal: React.FC = () => {
  const { isPropertyModalOpen, closePropertyModal, propertyModalEditing, savePropertyWithUnits } =
    useApp();

  const [name, setName] = useState(propertyModalEditing?.name || '');
  const [location, setLocation] = useState(propertyModalEditing?.location || '');
  const [floors, setFloors] = useState<number>(propertyModalEditing?.floors || 3);
  const [unitsPerFloor, setUnitsPerFloor] = useState<number>(
    propertyModalEditing?.units_per_floor || 4
  );
  const [blocksInput, setBlocksInput] = useState<string>(
    propertyModalEditing?.blocks ? propertyModalEditing.blocks.join(', ') : ''
  );
  const [schemeType, setSchemeType] = useState<NamingSchemeType>(
    (propertyModalEditing?.naming_scheme as NamingSchemeType) || 'scheme1'
  );
  const [prefixWord, setPrefixWord] = useState<'House' | 'Unit' | 'Door'>('House');
  const [customPattern, setCustomPattern] = useState<string>('{block}{floor}{index}');
  const [defaultRent, setDefaultRent] = useState<number>(18000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedBlocks = useMemo(() => {
    if (!blocksInput.trim()) return [];
    return blocksInput
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);
  }, [blocksInput]);

  const schemeConfig = useMemo<NamingSchemeConfig>(() => {
    return {
      type: schemeType,
      prefixWord,
      customPattern,
    };
  }, [schemeType, prefixWord, customPattern]);

  // Live Preview of Generated Units
  const livePreview = useMemo(() => {
    return generateUnitNames(floors, unitsPerFloor, schemeConfig, parsedBlocks);
  }, [floors, unitsPerFloor, schemeConfig, parsedBlocks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || floors < 1 || unitsPerFloor < 1) {
      alert('Please fill in valid property details.');
      return;
    }

    setIsSubmitting(true);
    try {
      await savePropertyWithUnits(
        {
          name: name.trim(),
          location: location.trim() || 'Nairobi, Kenya',
          floors,
          units_per_floor: unitsPerFloor,
          blocks: parsedBlocks,
          naming_scheme: schemeType,
        },
        schemeConfig,
        defaultRent
      );
      closePropertyModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isPropertyModalOpen}
      onClose={closePropertyModal}
      title={propertyModalEditing ? 'Edit Property' : 'Add Property & Auto-Name Houses'}
      subtitle="Creates flats and auto-generates unit numbers using Kenyan conventions"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
        {/* Basic Property Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Property / Apartment Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kilimani Heights, Riverside Plaza"
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Location / Road</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Argwings Kodhek Rd, Kilimani"
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>
        </div>

        {/* Compound Structure */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Number of Floors</label>
            <input
              type="number"
              min="1"
              max="20"
              value={floors}
              onChange={(e) => setFloors(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Units per Floor</label>
            <input
              type="number"
              min="1"
              max="30"
              value={unitsPerFloor}
              onChange={(e) => setUnitsPerFloor(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Default Rent (KES)</label>
            <input
              type="number"
              value={defaultRent}
              onChange={(e) => setDefaultRent(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2.5 text-xs text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              required
            />
          </div>
        </div>

        {/* Blocks (Optional) */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Blocks (Optional, comma-separated)
          </label>
          <input
            type="text"
            value={blocksInput}
            onChange={(e) => setBlocksInput(e.target.value)}
            placeholder="e.g. Block A, Block B (leave empty if single block)"
            className="w-full bg-slate-800 border border-slate-700 px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
          />
        </div>

        {/* Kenyan Auto-Naming Schemes */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Choose Auto-Naming Scheme</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              {
                id: 'scheme1',
                title: 'Scheme 1 — Block + Unit (Kenyan Default)',
                desc: 'Ground = A1..A4, 1st = B1..B4, 2nd = C1..C4',
              },
              {
                id: 'scheme2',
                title: 'Scheme 2 — Floor Prefix + Number',
                desc: 'G1..G4, F1..F4, S1..S4, T1..T4',
              },
              {
                id: 'scheme3',
                title: 'Scheme 3 — Simple Sequential',
                desc: '1, 2, 3, 4, 5, 6...',
              },
              {
                id: 'scheme4',
                title: 'Scheme 4 — Floor Number + Letter',
                desc: '1A..1D, 2A..2D, 3A..3D (Ground = GA..GD)',
              },
              {
                id: 'scheme5',
                title: 'Scheme 5 — Word Prefix',
                desc: 'House 1, House 2 / Unit 1...',
              },
              {
                id: 'scheme6',
                title: 'Scheme 6 — Custom Pattern Tokens',
                desc: 'Pattern like {block}-{floor}{index}',
              },
            ].map((scheme) => (
              <label
                key={scheme.id}
                className={`p-2.5 border cursor-pointer transition flex items-start gap-2.5 ${
                  schemeType === scheme.id
                    ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="scheme"
                  checked={schemeType === scheme.id}
                  onChange={() => setSchemeType(scheme.id as NamingSchemeType)}
                  className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-xs">{scheme.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{scheme.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Pattern extra inputs if Scheme 5 or 6 */}
        {schemeType === 'scheme5' && (
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Prefix Word</label>
            <div className="flex gap-2">
              {(['House', 'Unit', 'Door'] as const).map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => setPrefixWord(word)}
                  className={`px-3 py-1.5 border text-xs font-semibold ${
                    prefixWord === word
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}

        {schemeType === 'scheme6' && (
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Custom Pattern Tokens
            </label>
            <input
              type="text"
              value={customPattern}
              onChange={(e) => setCustomPattern(e.target.value)}
              placeholder="{block}-{floor}{index}"
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-mono text-slate-100"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Tokens: {'{block}'}, {'{floor}'}, {'{floorLetter}'}, {'{index}'}, {'{unit}'}, {'{seq}'}
            </p>
          </div>
        )}

        {/* LIVE PREVIEW OF AUTO-NAMED UNITS */}
        <div className="bg-slate-950/70 border border-slate-800 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Generated House Preview ({livePreview.length} Units Total)</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
            {livePreview.map((u, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-emerald-300 font-mono font-bold text-xs"
              >
                {u.name}
              </span>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={closePropertyModal}
            className="px-4 py-2.5 text-slate-300 hover:bg-slate-800 font-medium transition min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md hover:shadow-lg transition active:scale-95 disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Creating Units...' : 'Save & Generate Houses'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
