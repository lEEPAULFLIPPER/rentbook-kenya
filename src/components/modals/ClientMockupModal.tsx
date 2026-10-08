// RentBook Kenya - Estate Provisioning & Database Engine
// Supports dynamic gallery-style unit management: add, rename, multi-select, and delete

import React, { useState, useEffect, useMemo } from 'react';
import {
  Check,
  CheckSquare,
  Download,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Square,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { DatabaseService } from '../../lib/databaseService';

interface ClientMockupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type NamingSchemeKey = 'scheme1' | 'scheme2' | 'scheme3' | 'scheme4' | 'scheme5';
export type GroundConventionKey = 'G' | 'GF' | 'Ground' | 'Letter';

export interface GalleryUnitItem {
  id: string;
  floorIndex: number;
  name: string;
  monthlyRent?: number;
}

export const ClientMockupModal: React.FC<ClientMockupModalProps> = ({ isOpen, onClose }) => {
  const { broadcastLiveAction } = useApp();

  const [clientName, setClientName] = useState('James Kariuki');
  const [propertyName, setPropertyName] = useState('Parkview Heights');
  const [location, setLocation] = useState('Ruaka, Kiambu Road');
  const [floors, setFloors] = useState<number>(3);
  const [unitsPerFloor, setUnitsPerFloor] = useState<number>(9);
  const [monthlyRent, setMonthlyRent] = useState<number>(22000);
  const [namingScheme, setNamingScheme] = useState<NamingSchemeKey>('scheme1');
  const [groundConvention, setGroundConvention] = useState<GroundConventionKey>('G');
  const [isGenerating, setIsGenerating] = useState(false);

  // Available floors range
  const floorOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12];

  // Units per floor dropdown options (clean numbers, no stars or eg text)
  const unitOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 18, 20, 24];

  // Helper to compute standard unit naming
  const computeUnitName = (
    fl: number,
    uNum: number,
    globalSeq: number,
    scheme: NamingSchemeKey,
    ground: GroundConventionKey
  ): string => {
    const floorLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'];

    if (scheme === 'scheme2') {
      if (fl === 0) {
        if (ground === 'G') return `G${uNum}`;
        if (ground === 'GF') return `GF${uNum}`;
        if (ground === 'Ground') return `Ground ${uNum}`;
        return `${uNum}`;
      }
      return `${fl * 100 + uNum}`;
    }

    if (scheme === 'scheme3') {
      return `${globalSeq}`;
    }

    if (scheme === 'scheme4') {
      const uLetter = uNum <= 26 ? String.fromCharCode(64 + uNum) : `${uNum}`;
      let flPrefix = `${fl}`;
      if (fl === 0) {
        flPrefix = ground === 'Ground' ? 'Ground ' : ground === 'GF' ? 'GF' : ground === 'Letter' ? 'A' : 'G';
      }
      return `${flPrefix}${uLetter}`;
    }

    if (scheme === 'scheme5') {
      return `House ${globalSeq}`;
    }

    // Default scheme1: Floor letters
    if (fl === 0) {
      if (ground === 'Letter') return `A${uNum}`;
      if (ground === 'Ground') return `Ground ${uNum}`;
      if (ground === 'GF') return `GF${uNum}`;
      return `G${uNum}`;
    }
    const idx = ground === 'Letter' ? fl : fl - 1;
    const prefix = floorLetters[idx % floorLetters.length];
    return `${prefix}${uNum}`;
  };

  // Gallery UX State
  const [units, setUnits] = useState<GalleryUnitItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCustomized, setIsCustomized] = useState(false);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Add unit state
  const [addingFloor, setAddingFloor] = useState<number | null>(null);
  const [addingName, setAddingName] = useState('');

  // Generate default units from formula
  const generateTemplateUnits = (
    fls: number,
    upf: number,
    scheme: NamingSchemeKey,
    ground: GroundConventionKey,
    rent: number
  ): GalleryUnitItem[] => {
    const list: GalleryUnitItem[] = [];
    let seq = 0;
    for (let fl = 0; fl < fls; fl++) {
      for (let u = 1; u <= upf; u++) {
        seq++;
        list.push({
          id: `u-${fl}-${u}-${seq}`,
          floorIndex: fl,
          name: computeUnitName(fl, u, seq, scheme, ground),
          monthlyRent: rent,
        });
      }
    }
    return list;
  };

  // Re-sync template when floors/upf/scheme changes unless user made custom edits
  useEffect(() => {
    if (!isCustomized) {
      const generated = generateTemplateUnits(floors, unitsPerFloor, namingScheme, groundConvention, monthlyRent);
      setUnits(generated);
      setSelectedIds(new Set());
    }
  }, [floors, unitsPerFloor, namingScheme, groundConvention, monthlyRent, isCustomized]);

  // Reset to auto-generated scheme template
  const handleResetToTemplate = () => {
    const generated = generateTemplateUnits(floors, unitsPerFloor, namingScheme, groundConvention, monthlyRent);
    setUnits(generated);
    setSelectedIds(new Set());
    setIsCustomized(false);
    setEditingId(null);
    setAddingFloor(null);
    broadcastLiveAction('Reset layout to standard scheme template', 'info');
  };

  // Multi-selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === units.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(units.map((u) => u.id)));
    }
  };

  // Delete handlers
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setUnits((prev) => prev.filter((u) => !selectedIds.has(u.id)));
    setSelectedIds(new Set());
    setIsCustomized(true);
    broadcastLiveAction('Deleted selected units from layout', 'warning');
  };

  const handleDeleteAll = () => {
    if (units.length === 0) return;
    if (!window.confirm('Delete all units in the layout preview? You can reset to template anytime.')) return;
    setUnits([]);
    setSelectedIds(new Set());
    setIsCustomized(true);
    broadcastLiveAction('Cleared all units from layout', 'warning');
  };

  const handleDeleteSingle = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setUnits((prev) => prev.filter((u) => u.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setIsCustomized(true);
  };

  // Inline rename handlers
  const handleStartRename = (u: GalleryUnitItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(u.id);
    setEditingText(u.name);
  };

  const handleSaveRename = (id: string) => {
    const trimmed = editingText.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    setUnits((prev) =>
      prev.map((u) => (u.id === id ? { ...u, name: trimmed } : u))
    );
    setEditingId(null);
    setIsCustomized(true);
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditingText('');
  };

  // Add unit handler
  const handleStartAdd = (floorIndex: number) => {
    setAddingFloor(floorIndex);
    // Suggest next sensible name for floor
    const floorUnits = units.filter((u) => u.floorIndex === floorIndex);
    const count = floorUnits.length + 1;
    setAddingName(`House ${count}`);
  };

  const handleSaveAdd = (floorIndex: number) => {
    const trimmed = addingName.trim();
    if (!trimmed) {
      setAddingFloor(null);
      return;
    }
    const newUnit: GalleryUnitItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      floorIndex,
      name: trimmed,
      monthlyRent,
    };
    setUnits((prev) => [...prev, newUnit]);
    setAddingFloor(null);
    setAddingName('');
    setIsCustomized(true);
    broadcastLiveAction(`Added ${trimmed} to Floor ${floorIndex}`, 'success');
  };

  const handleCancelAdd = () => {
    setAddingFloor(null);
    setAddingName('');
  };

  // Group units by floor
  const floorsList = useMemo(() => {
    const result: Array<{
      floorIndex: number;
      label: string;
      units: GalleryUnitItem[];
    }> = [];

    for (let fl = 0; fl < floors; fl++) {
      const label =
        fl === 0
          ? 'Ground Floor'
          : fl === 1
          ? '1st Floor'
          : fl === 2
          ? '2nd Floor'
          : fl === 3
          ? '3rd Floor'
          : `${fl}th Floor`;

      result.push({
        floorIndex: fl,
        label,
        units: units.filter((u) => u.floorIndex === fl),
      });
    }

    return result;
  }, [floors, units]);

  const totalUnits = units.length;
  const totalMonthlyRoll = units.reduce((sum, u) => sum + (u.monthlyRent || monthlyRent), 0);
  const allSelected = units.length > 0 && selectedIds.size === units.length;

  if (!isOpen) return null;

  const handleGenerateMockup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (units.length === 0) {
      alert('Please configure at least 1 unit before provisioning.');
      return;
    }

    setIsGenerating(true);

    try {
      const res = await DatabaseService.generateCustomMockup({
        clientName,
        propertyName,
        location,
        floors: Number(floors),
        unitsPerFloor: Number(unitsPerFloor),
        monthlyRent: Number(monthlyRent),
        namingScheme,
        groundConvention,
        customUnits: units.map((u) => ({
          floor: u.floorIndex,
          name: u.name,
          rent: u.monthlyRent || monthlyRent,
        })),
      });

      if (res.success) {
        broadcastLiveAction(`Estate provisioned for ${propertyName} with ${totalUnits} units! Reloading...`, 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        alert(res.error || 'Failed to provision property database');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetDefault = async () => {
    if (!window.confirm('Reset database to default Kilimani Heights dataset?')) return;
    setIsGenerating(true);
    await DatabaseService.resetDefaultDemo();
    broadcastLiveAction('Restored Kilimani Heights dataset', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleDownloadSql = () => {
    window.open('/api/export/sql', '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Estate Provisioning & Database Engine"
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-4 text-xs select-none">
        {/* Banner */}
        <div className="bg-sky-950/60 border border-sky-800 p-3 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-slate-100 text-xs">
              Configure Property Layout & Seed Operational Data
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Configure building dimensions and customize your exact door labels. You can rename, add,
              delete, or multi-select units in the live gallery below before provisioning the database.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleGenerateMockup} className="space-y-4">
          {/* Section 1: Property Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Landlord / Owner Name
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Peter Kamau"
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 min-h-[38px] focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Apartment / Estate Name
              </label>
              <input
                type="text"
                required
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="e.g. Parkview Heights"
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 min-h-[38px] focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Location
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Ruaka, Kiambu Road"
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 min-h-[38px] focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Monthly Rent (KES per unit)
              </label>
              <input
                type="number"
                required
                min="1000"
                step="500"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 min-h-[38px] focus:border-sky-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Number of Floors
              </label>
              <select
                value={floors}
                onChange={(e) => setFloors(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 min-h-[38px] focus:border-sky-500 focus:outline-none"
              >
                {floorOptions.map((f) => (
                  <option key={f} value={f}>
                    {f} {f === 1 ? 'Floor (Ground only)' : 'Floors'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold">
                  Units Per Floor
                </label>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  {totalUnits} Total Houses
                </span>
              </div>
              <select
                value={unitsPerFloor}
                onChange={(e) => setUnitsPerFloor(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 min-h-[38px] focus:border-sky-500 focus:outline-none font-medium"
              >
                {unitOptions.map((u) => (
                  <option key={u} value={u}>
                    {u} Units per floor
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Unit Naming & Numbering Format System */}
          <div className="border border-slate-800 bg-slate-900/70 p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-slate-200 text-xs tracking-wide uppercase">
                  Unit Naming & House Numbering Format System
                </h4>
              </div>
              {isCustomized && (
                <span className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2 py-0.5 font-semibold">
                  Custom Layout Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Naming Scheme
                </label>
                <select
                  value={namingScheme}
                  onChange={(e) => {
                    setNamingScheme(e.target.value as NamingSchemeKey);
                    setIsCustomized(false);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 min-h-[38px] focus:border-emerald-500 focus:outline-none"
                >
                  <option value="scheme1">
                    Kenyan Floor Letters (G1..G{unitsPerFloor}, A1..A{unitsPerFloor}, B1..B{unitsPerFloor})
                  </option>
                  <option value="scheme2">
                    100-Series Floor Numbers (G1..G{unitsPerFloor}, 101..10{unitsPerFloor}, 201..20{unitsPerFloor})
                  </option>
                  <option value="scheme4">
                    Floor Number + Unit Letter (GA..G{unitsPerFloor <= 26 ? String.fromCharCode(64 + unitsPerFloor) : 'N'}, 1A..1{unitsPerFloor <= 26 ? String.fromCharCode(64 + unitsPerFloor) : 'N'})
                  </option>
                  <option value="scheme3">
                    Sequential House Numbers (1, 2, 3 ... {floors * unitsPerFloor})
                  </option>
                  <option value="scheme5">
                    Word Prefix (House 1, House 2 ... House {floors * unitsPerFloor})
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Ground Floor Convention
                </label>
                <select
                  value={groundConvention}
                  onChange={(e) => {
                    setGroundConvention(e.target.value as GroundConventionKey);
                    setIsCustomized(false);
                  }}
                  disabled={namingScheme === 'scheme3' || namingScheme === 'scheme5'}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 min-h-[38px] focus:border-emerald-500 focus:outline-none disabled:opacity-40"
                >
                  <option value="G">Prefix "G" (e.g. G1, G2 ... G{unitsPerFloor})</option>
                  <option value="GF">Prefix "GF" (e.g. GF1, GF2 ... GF{unitsPerFloor})</option>
                  <option value="Ground">Word "Ground" (e.g. Ground 1, Ground 2)</option>
                  <option value="Letter">Alphabetical "A" for Ground (A1..A{unitsPerFloor}, 1st=B1..B{unitsPerFloor})</option>
                </select>
              </div>
            </div>

            {/* Live Interactive Unit Preview Gallery UX */}
            <div className="mt-3 bg-slate-950/90 border border-slate-800 p-3 space-y-3">
              {/* Gallery Header & Bulk Action Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-slate-100">
                    Live Unit Gallery ({totalUnits} Units)
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-emerald-400">
                    KES {totalMonthlyRoll.toLocaleString()} / mo
                  </span>
                </div>

                {/* Gallery Toolbar Controls */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Select All */}
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    disabled={units.length === 0}
                    className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold border transition active:scale-95 ${
                      allSelected
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {allSelected ? <CheckSquare className="w-3 h-3 text-emerald-400" /> : <Square className="w-3 h-3" />}
                    <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
                  </button>

                  {/* Delete Selected */}
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    disabled={selectedIds.size === 0}
                    className="flex items-center gap-1 px-2 py-1 bg-rose-950/70 hover:bg-rose-900/90 disabled:opacity-40 disabled:hover:bg-rose-950/70 text-rose-300 border border-rose-800/80 text-[11px] font-semibold transition active:scale-95"
                    title="Delete chosen units"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete Selected ({selectedIds.size})</span>
                  </button>

                  {/* Delete All */}
                  <button
                    type="button"
                    onClick={handleDeleteAll}
                    disabled={units.length === 0}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 border border-slate-700 hover:border-rose-800 text-[11px] font-semibold transition active:scale-95"
                    title="Clear all units"
                  >
                    <X className="w-3 h-3" />
                    <span>Delete All</span>
                  </button>

                  {/* Reset to Scheme Template */}
                  {isCustomized && (
                    <button
                      type="button"
                      onClick={handleResetToTemplate}
                      className="flex items-center gap-1 px-2 py-1 bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-800 text-[11px] font-semibold transition active:scale-95"
                      title="Reset units back to calculated scheme layout"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to Scheme</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Gallery Floor Groups */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {units.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 space-y-2 border border-dashed border-slate-800">
                    <p className="text-xs">All units have been deleted.</p>
                    <button
                      type="button"
                      onClick={handleResetToTemplate}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs"
                    >
                      Restore Scheme Template ({floors * unitsPerFloor} Units)
                    </button>
                  </div>
                ) : (
                  floorsList.map((floor) => (
                    <div
                      key={floor.floorIndex}
                      className="bg-slate-900/80 border border-slate-800/80 p-2.5 space-y-2"
                    >
                      {/* Floor Header */}
                      <div className="flex items-center justify-between flex-wrap gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-sky-300">
                            {floor.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({floor.units.length} {floor.units.length === 1 ? 'unit' : 'units'})
                          </span>
                        </div>

                        {/* Add Unit to Floor Button */}
                        <button
                          type="button"
                          onClick={() => handleStartAdd(floor.floorIndex)}
                          className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-[10px] font-semibold transition active:scale-95"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add House</span>
                        </button>
                      </div>

                      {/* Inline Add Unit Form for Floor */}
                      {addingFloor === floor.floorIndex && (
                        <div className="flex items-center gap-1.5 p-1.5 bg-slate-950 border border-emerald-600/80">
                          <input
                            type="text"
                            autoFocus
                            value={addingName}
                            onChange={(e) => setAddingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveAdd(floor.floorIndex);
                              } else if (e.key === 'Escape') {
                                handleCancelAdd();
                              }
                            }}
                            placeholder="Unit name (e.g. Shop 1, Penthouse)"
                            className="flex-1 bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveAdd(floor.floorIndex)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelAdd}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {/* Gallery Cards Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
                        {floor.units.map((unit) => {
                          const isSelected = selectedIds.has(unit.id);
                          const isEditing = editingId === unit.id;

                          return (
                            <div
                              key={unit.id}
                              onClick={() => !isEditing && handleToggleSelect(unit.id)}
                              className={`group relative p-2 border transition select-none flex flex-col justify-between min-h-[58px] cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-950/80 border-emerald-500 ring-1 ring-emerald-500 text-emerald-100'
                                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200'
                              }`}
                            >
                              {/* Card Top Row: Selection Checkbox & Actions */}
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <div
                                  className={`w-3.5 h-3.5 flex items-center justify-center border text-[9px] ${
                                    isSelected
                                      ? 'bg-emerald-500 border-emerald-400 text-black font-black'
                                      : 'border-slate-600 bg-slate-800/80'
                                  }`}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>

                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                                  {/* Rename Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => handleStartRename(unit, e)}
                                    title="Rename unit"
                                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-sky-300 transition"
                                  >
                                    <Pencil className="w-2.5 h-2.5" />
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteSingle(unit.id, e)}
                                    title="Delete unit"
                                    className="p-1 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Card Body: Unit Name or Inline Editor */}
                              {isEditing ? (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 pt-0.5"
                                >
                                  <input
                                    type="text"
                                    autoFocus
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSaveRename(unit.id);
                                      } else if (e.key === 'Escape') {
                                        handleCancelRename();
                                      }
                                    }}
                                    className="w-full bg-slate-950 border border-sky-500 px-1 py-0.5 text-xs text-white font-mono focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveRename(unit.id)}
                                    className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                                  >
                                    <Check className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelRename}
                                    className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <div className="font-mono font-bold text-xs truncate">
                                    {unit.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    KES {(unit.monthlyRent || monthlyRent).toLocaleString()}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefault}
                disabled={isGenerating}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
              >
                Load Default Sample
              </button>
              <button
                type="button"
                onClick={handleDownloadSql}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
              >
                <Download className="w-3 h-3" />
                <span>Export .SQL</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating || units.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow transition active:scale-95 min-h-[40px]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isGenerating ? 'Provisioning Database...' : `Provision ${totalUnits}-Unit Estate`}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
