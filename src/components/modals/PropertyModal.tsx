// =====================================================================
// RENTBOOK KENYA — PROPERTY & AUTO-NAMING CREATOR MODAL
// Auto-generates Kenyan flat conventions (G1..G4, Ground 1..4, A1..A4, etc.)
// with interactive preview: delete, add, edit unit names before finalizing
// =====================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  Building,
  Check,
  Edit2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
  Layers,
  Coins,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import {
  GroundFloorNaming,
  NamingSchemeConfig,
  NamingSchemeType,
  PreviewUnitSpec,
} from '../../types';
import {
  generateUnitNames,
  getFloorDisplayName,
  getFloorShortName,
} from '../../lib/namingEngine';
import { formatKES } from '../../lib/formatters';

export const PropertyModal: React.FC = () => {
  const {
    isPropertyModalOpen,
    closePropertyModal,
    propertyModalEditing,
    savePropertyWithUnits,
    units,
  } = useApp();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [floors, setFloors] = useState<number>(3);
  const [unitsPerFloor, setUnitsPerFloor] = useState<number>(4);
  const [blocksInput, setBlocksInput] = useState<string>('');
  const [schemeType, setSchemeType] = useState<NamingSchemeType>('scheme1');
  const [groundFloorNaming, setGroundFloorNaming] = useState<GroundFloorNaming>('G');
  const [prefixWord, setPrefixWord] = useState<'House' | 'Unit' | 'Door'>('House');
  const [customPattern, setCustomPattern] = useState<string>('{block}{floor}{index}');
  const [defaultRent, setDefaultRent] = useState<number>(18000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interactive Live Preview State
  const [previewUnits, setPreviewUnits] = useState<PreviewUnitSpec[]>([]);
  const [isManuallyCustomized, setIsManuallyCustomized] = useState(false);

  // Inline Unit Name Editing State
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitName, setEditingUnitName] = useState('');

  // Quick Add Unit State
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [addUnitFloor, setAddUnitFloor] = useState<number>(0);
  const [addUnitName, setAddUnitName] = useState<string>('');
  const [addUnitRent, setAddUnitRent] = useState<number>(18000);
  const [addUnitBlock, setAddUnitBlock] = useState<string>('');

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
      groundFloorNaming,
    };
  }, [schemeType, prefixWord, customPattern, groundFloorNaming]);

  // Sync / Initialise Modal State when opened or propertyModalEditing changes
  useEffect(() => {
    if (!isPropertyModalOpen) return;

    if (propertyModalEditing) {
      setName(propertyModalEditing.name);
      setLocation(propertyModalEditing.location || '');
      setFloors(propertyModalEditing.floors);
      setUnitsPerFloor(propertyModalEditing.units_per_floor);
      setBlocksInput(
        propertyModalEditing.blocks ? propertyModalEditing.blocks.join(', ') : ''
      );
      setSchemeType((propertyModalEditing.naming_scheme as NamingSchemeType) || 'scheme1');
      setGroundFloorNaming('G');

      const existingUnits = units.filter(
        (u) => u.property_id === propertyModalEditing.id && !u.deleted_at
      );
      if (existingUnits.length > 0) {
        setPreviewUnits(
          existingUnits.map((u) => ({
            id: u.id,
            name: u.name,
            floorNumber: u.floor_number,
            blockName: u.block_name,
            monthlyRent: u.monthly_rent,
          }))
        );
        setIsManuallyCustomized(true);
        return;
      }
    } else {
      // New property default
      setName('');
      setLocation('Nairobi, Kenya');
      setFloors(3);
      setUnitsPerFloor(4);
      setBlocksInput('');
      setSchemeType('scheme1');
      setGroundFloorNaming('G');
      setDefaultRent(18000);
      setIsManuallyCustomized(false);
      setEditingUnitId(null);
      setIsAddingUnit(false);
    }
  }, [isPropertyModalOpen, propertyModalEditing]);

  // Automatically regenerate preview when configuration parameters change,
  // unless the admin has made manual edits.
  useEffect(() => {
    if (!isPropertyModalOpen) return;
    if (isManuallyCustomized) return;

    const generated = generateUnitNames(floors, unitsPerFloor, schemeConfig, parsedBlocks);
    setPreviewUnits(
      generated.map((u, i) => ({
        id: `gen-${u.floorNumber}-${i}-${u.name}`,
        name: u.name,
        floorNumber: u.floorNumber,
        blockName: u.blockName,
        monthlyRent: defaultRent,
      }))
    );
  }, [
    floors,
    unitsPerFloor,
    schemeConfig,
    parsedBlocks,
    defaultRent,
    isManuallyCustomized,
    isPropertyModalOpen,
  ]);

  // Reset preview back to auto-generated scheme template
  const handleResetToTemplate = () => {
    const generated = generateUnitNames(floors, unitsPerFloor, schemeConfig, parsedBlocks);
    setPreviewUnits(
      generated.map((u, i) => ({
        id: `gen-${u.floorNumber}-${i}-${u.name}`,
        name: u.name,
        floorNumber: u.floorNumber,
        blockName: u.blockName,
        monthlyRent: defaultRent,
      }))
    );
    setIsManuallyCustomized(false);
    setEditingUnitId(null);
    setIsAddingUnit(false);
  };

  // 1. Delete Unit from Preview
  const handleDeleteUnit = (id: string) => {
    setPreviewUnits((prev) => prev.filter((u) => u.id !== id));
    setIsManuallyCustomized(true);
    if (editingUnitId === id) {
      setEditingUnitId(null);
    }
  };

  // 2. Start Inline Editing of Unit Name
  const handleStartEdit = (u: PreviewUnitSpec) => {
    setEditingUnitId(u.id || null);
    setEditingUnitName(u.name);
  };

  // 2. Save Inline Editing of Unit Name
  const handleSaveEdit = (id: string) => {
    if (!editingUnitName.trim()) return;
    setPreviewUnits((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, name: editingUnitName.trim(), isCustom: true } : u
      )
    );
    setIsManuallyCustomized(true);
    setEditingUnitId(null);
  };

  // 2. Cancel Inline Editing
  const handleCancelEdit = () => {
    setEditingUnitId(null);
    setEditingUnitName('');
  };

  // 3. Open Quick Add Unit Form
  const handleOpenAddUnit = (targetFloor?: number) => {
    const fl = targetFloor !== undefined ? targetFloor : 0;
    setAddUnitFloor(fl);
    setAddUnitRent(defaultRent);
    setAddUnitBlock(parsedBlocks[0] || '');

    // Sensible Kenyan default suggestion
    if (fl === 0) {
      const gCount = previewUnits.filter((u) => u.floorNumber === 0).length;
      if (groundFloorNaming === 'Ground') {
        setAddUnitName(`Ground ${gCount + 1}`);
      } else if (groundFloorNaming === 'GF') {
        setAddUnitName(`GF${gCount + 1}`);
      } else {
        setAddUnitName(`G${gCount + 1}`);
      }
    } else {
      const flCount = previewUnits.filter((u) => u.floorNumber === fl).length;
      const letter = String.fromCharCode(64 + fl);
      setAddUnitName(`${letter}${flCount + 1}`);
    }

    setIsAddingUnit(true);
  };

  // 3. Submit Quick Add Unit Form
  const handleAddUnitSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!addUnitName.trim()) return;

    const newUnit: PreviewUnitSpec = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: addUnitName.trim(),
      floorNumber: addUnitFloor,
      blockName: addUnitBlock.trim() || undefined,
      monthlyRent: addUnitRent || defaultRent,
      isCustom: true,
    };

    setPreviewUnits((prev) => [...prev, newUnit]);
    setIsManuallyCustomized(true);
    setIsAddingUnit(false);
    setAddUnitName('');
  };

  // Group Preview Units by Floor
  const unitsByFloor = useMemo(() => {
    const map: Record<number, PreviewUnitSpec[]> = {};
    for (let f = 0; f < floors; f++) {
      map[f] = [];
    }
    previewUnits.forEach((u) => {
      if (!map[u.floorNumber]) {
        map[u.floorNumber] = [];
      }
      map[u.floorNumber].push(u);
    });
    return map;
  }, [previewUnits, floors]);

  const totalFlats = previewUnits.length;
  const totalPotentialRent = previewUnits.reduce(
    (sum, u) => sum + (u.monthlyRent || defaultRent),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please fill in a valid property name.');
      return;
    }
    if (previewUnits.length === 0) {
      alert('Please configure at least 1 flat in the preview before saving.');
      return;
    }

    setIsSubmitting(true);
    try {
      await savePropertyWithUnits(
        {
          id: propertyModalEditing?.id,
          name: name.trim(),
          location: location.trim() || 'Nairobi, Kenya',
          floors,
          units_per_floor: unitsPerFloor,
          blocks: parsedBlocks,
          naming_scheme: schemeType,
        },
        schemeConfig,
        defaultRent,
        previewUnits
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
      title={propertyModalEditing ? 'Edit Property & Flats' : 'Add Property & Configure Houses'}
      subtitle="Full control: add, delete, rename units, and select Kenyan Ground Floor ('G' / 'Ground') conventions"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
        {/* 1. BASIC PROPERTY DETAILS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Property / Apartment Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kilimani Heights, Ruaka Elite Flats"
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
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
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
            />
          </div>
        </div>

        {/* 2. COMPOUND STRUCTURE */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Number of Floors</label>
            <input
              type="number"
              min="1"
              max="25"
              value={floors}
              onChange={(e) => {
                setFloors(Math.max(1, parseInt(e.target.value) || 1));
              }}
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Units per Floor</label>
            <input
              type="number"
              min="1"
              max="40"
              value={unitsPerFloor}
              onChange={(e) => {
                setUnitsPerFloor(Math.max(1, parseInt(e.target.value) || 1));
              }}
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Default Rent (KES)</label>
            <input
              type="number"
              value={defaultRent}
              onChange={(e) => setDefaultRent(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
              required
            />
          </div>
        </div>

        {/* 3. BLOCKS (OPTIONAL) */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Blocks (Optional, comma-separated)
          </label>
          <input
            type="text"
            value={blocksInput}
            onChange={(e) => setBlocksInput(e.target.value)}
            placeholder="e.g. Block A, Block B (leave blank if single building)"
            className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
          />
        </div>

        {/* 4. KENYAN GROUND FLOOR NAMING SELECTION */}
        <div className="bg-slate-900/90 border border-emerald-500/40 p-3 rounded-none">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Kenyan Ground Floor Unit Naming</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">
              Standard in Kenyan Flats: Ground floor is called "G" or "Ground"
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              {
                id: 'G' as const,
                title: '“G” Prefix',
                example: 'G1, G2, G3, G4...',
                tag: 'Most Popular',
              },
              {
                id: 'Ground' as const,
                title: '“Ground” Word',
                example: 'Ground 1, Ground 2...',
                tag: 'Formal Kenyan',
              },
              {
                id: 'GF' as const,
                title: '“GF” Prefix',
                example: 'GF1, GF2, GF3, GF4...',
                tag: 'Commercial',
              },
              {
                id: 'Letter' as const,
                title: 'Letter “A”',
                example: 'A1, A2, A3, A4...',
                tag: 'Lettering',
              },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setGroundFloorNaming(opt.id)}
                className={`p-2.5 text-left border transition relative flex flex-col justify-between min-h-[58px] ${
                  groundFloorNaming === opt.id
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
                    : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs">{opt.title}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                      groundFloorNaming === opt.id
                        ? 'bg-emerald-500/30 text-emerald-300'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {opt.tag}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-emerald-400 mt-1">{opt.example}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 5. KENYAN AUTO-NAMING SCHEMES */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Choose Auto-Naming Scheme Template</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              {
                id: 'scheme1',
                title: 'Scheme 1 — Kenyan Standard (Ground G/Ground + Floor Letters)',
                desc: `Ground = ${
                  groundFloorNaming === 'Ground'
                    ? 'Ground 1..4'
                    : groundFloorNaming === 'GF'
                    ? 'GF1..4'
                    : groundFloorNaming === 'Letter'
                    ? 'A1..4'
                    : 'G1..G4'
                }, 1st = A1..A4, 2nd = B1..B4`,
              },
              {
                id: 'scheme2',
                title: 'Scheme 2 — Floor Prefix + Number',
                desc: `${
                  groundFloorNaming === 'Ground' ? 'Ground 1..4' : 'G1..G4'
                }, F1..F4, S1..S4, T1..T4`,
              },
              {
                id: 'scheme3',
                title: 'Scheme 3 — Simple Sequential',
                desc: '1, 2, 3, 4, 5, 6...',
              },
              {
                id: 'scheme4',
                title: 'Scheme 4 — Floor Label + Letter',
                desc: `${
                  groundFloorNaming === 'Ground' ? 'Ground-A..D' : 'GA..GD'
                }, 1A..1D, 2A..2D`,
              },
              {
                id: 'scheme5',
                title: 'Scheme 5 — Word Prefix',
                desc: 'House 1, House 2 / Unit 1...',
              },
              {
                id: 'scheme6',
                title: 'Scheme 6 — Custom Pattern Tokens',
                desc: 'Pattern like {block}{floor}{index}',
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

        {/* 6. INTERACTIVE LIVE PREVIEW — EDIT, DELETE, ADD BEFORE FINALIZING */}
        <div className="bg-slate-950 border border-slate-800 p-3.5 flex flex-col gap-3">
          {/* Preview Header & Stats */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-100 text-sm">
                Flats Available Preview
              </span>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-600 font-mono font-bold text-xs">
                {totalFlats} Flats Available
              </span>
              {isManuallyCustomized && (
                <span className="px-1.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-600/60 font-semibold text-[10px]">
                  Customized
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs hidden sm:inline">
                Est. Rent:{' '}
                <strong className="text-emerald-400">{formatKES(totalPotentialRent)}</strong>
              </span>
              <button
                type="button"
                onClick={() => handleOpenAddUnit(0)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition active:scale-95"
                title="Add a new flat/house to preview"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Flat</span>
              </button>
              {isManuallyCustomized && (
                <button
                  type="button"
                  onClick={handleResetToTemplate}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition"
                  title="Re-generate and reset all units according to scheme"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reset to Scheme</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Add Form Drawer */}
          {isAddingUnit && (
            <div className="bg-slate-900 border border-emerald-500/80 p-3 flex flex-col gap-2">
              <div className="font-bold text-xs text-emerald-400 flex items-center justify-between">
                <span>+ Add Extra House / Flat to Preview</span>
                <button
                  type="button"
                  onClick={() => setIsAddingUnit(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-0.5 font-semibold">
                    Floor
                  </label>
                  <select
                    value={addUnitFloor}
                    onChange={(e) => setAddUnitFloor(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-slate-100 min-h-[36px]"
                  >
                    {Array.from({ length: Math.max(floors, ...previewUnits.map((u) => u.floorNumber + 1)) }, (_, f) => (
                      <option key={f} value={f}>
                        {getFloorDisplayName(f)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-0.5 font-semibold">
                    House Name / Door Label
                  </label>
                  <input
                    type="text"
                    value={addUnitName}
                    onChange={(e) => setAddUnitName(e.target.value)}
                    placeholder="e.g. G5, Shop 1, Caretaker"
                    className="w-full bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs font-mono font-bold text-slate-100 min-h-[36px]"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-0.5 font-semibold">
                    Rent (KES)
                  </label>
                  <input
                    type="number"
                    value={addUnitRent}
                    onChange={(e) => setAddUnitRent(Number(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-emerald-400 font-bold min-h-[36px]"
                  />
                </div>
                {parsedBlocks.length > 0 && (
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-0.5 font-semibold">
                      Block
                    </label>
                    <select
                      value={addUnitBlock}
                      onChange={(e) => setAddUnitBlock(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-slate-100 min-h-[36px]"
                    >
                      <option value="">None</option>
                      {parsedBlocks.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingUnit(false)}
                  className="px-3 py-1 bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddUnitSubmit}
                  disabled={!addUnitName.trim()}
                  className="px-4 py-1 bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 disabled:opacity-50"
                >
                  Add House to Preview
                </button>
              </div>
            </div>
          )}

          {/* Interactive Unit Cards Grouped by Floor */}
          <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
            {Object.keys(unitsByFloor)
              .map(Number)
              .sort((a, b) => a - b)
              .map((floorNum) => {
                const floorUnits = unitsByFloor[floorNum] || [];
                const isGround = floorNum === 0;

                return (
                  <div
                    key={floorNum}
                    className="bg-slate-900/70 border border-slate-800 p-2.5 flex flex-col gap-2"
                  >
                    {/* Floor Row Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 text-[11px] font-bold ${
                            isGround
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {getFloorDisplayName(floorNum)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({floorUnits.length} {floorUnits.length === 1 ? 'unit' : 'units'})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenAddUnit(floorNum)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add to {getFloorShortName(floorNum)}</span>
                      </button>
                    </div>

                    {/* Floor Units List */}
                    {floorUnits.length === 0 ? (
                      <div className="text-[11px] text-slate-500 italic py-1">
                        No houses on this floor.{' '}
                        <button
                          type="button"
                          onClick={() => handleOpenAddUnit(floorNum)}
                          className="text-emerald-400 hover:underline not-italic"
                        >
                          + Add a unit
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {floorUnits.map((u) => {
                          const isEditingThis = editingUnitId === u.id;

                          if (isEditingThis) {
                            return (
                              <div
                                key={u.id}
                                className="flex items-center gap-1 bg-slate-900 border border-emerald-500 px-2 py-1"
                              >
                                <input
                                  type="text"
                                  value={editingUnitName}
                                  onChange={(e) => setEditingUnitName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveEdit(u.id!);
                                    } else if (e.key === 'Escape') {
                                      handleCancelEdit();
                                    }
                                  }}
                                  className="w-24 px-1.5 py-1 text-xs font-mono font-bold bg-slate-800 text-emerald-300 border border-slate-700 focus:outline-none"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(u.id!)}
                                  className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded"
                                  title="Save unit name (Enter)"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded"
                                  title="Cancel (Esc)"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={u.id}
                              className={`group flex items-center gap-1.5 px-2.5 py-1 border text-xs transition ${
                                u.isCustom
                                  ? 'bg-amber-950/40 border-amber-600/70 text-amber-200'
                                  : isGround
                                  ? 'bg-slate-800/90 border-emerald-700/50 text-emerald-300'
                                  : 'bg-slate-800/80 border-slate-700 text-slate-200'
                              }`}
                            >
                              <span
                                className="font-mono font-bold cursor-pointer hover:underline"
                                onClick={() => handleStartEdit(u)}
                                title="Click to rename"
                              >
                                {u.name}
                              </span>

                              {u.blockName && (
                                <span className="text-[10px] text-slate-400">
                                  ({u.blockName})
                                </span>
                              )}

                              {u.isCustom && (
                                <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 font-semibold rounded">
                                  Custom
                                </span>
                              )}

                              {/* Action buttons (Edit & Delete) */}
                              <div className="flex items-center gap-1 ml-1 opacity-70 group-hover:opacity-100 transition">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(u)}
                                  className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded transition"
                                  title={`Rename House ${u.name}`}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUnit(u.id!)}
                                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded transition"
                                  title={`Delete House ${u.name} from preview`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>
              💡 Click any house name or the pencil icon to rename. Click trash to delete.
            </span>
            <span className="font-mono text-emerald-400">
              Total flats to create: <strong>{totalFlats}</strong>
            </span>
          </div>
        </div>

        {/* 7. MODAL ACTIONS */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            {totalFlats > 0 ? (
              <span>
                Final summary:{' '}
                <strong className="text-slate-200 font-mono">{totalFlats} flats</strong> across{' '}
                <strong className="text-slate-200 font-mono">
                  {Math.max(...previewUnits.map((u) => u.floorNumber), 0) + 1} floors
                </strong>
              </span>
            ) : (
              <span className="text-rose-400">Warning: No flats in preview</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closePropertyModal}
              className="px-4 py-2.5 text-slate-300 hover:bg-slate-800 font-medium transition min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalFlats === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md hover:shadow-lg transition active:scale-95 disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting
                ? 'Creating Property...'
                : propertyModalEditing
                ? `Save Property (${totalFlats} Flats)`
                : `Save & Create Property (${totalFlats} Flats)`}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
