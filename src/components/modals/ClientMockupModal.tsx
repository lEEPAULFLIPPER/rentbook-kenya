// RentBook Kenya - Estate Provisioning & Database Engine

import React, { useState, useMemo } from 'react';
import {
  Building2,
  CheckCircle2,
  Database,
  Download,
  Eye,
  Hash,
  Layers,
  MapPin,
  RefreshCw,
  Sparkles,
  Tag,
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

  // Expanded Units per Floor list specifically highlighting 9 and full real-estate options
  const unitOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 18, 20, 24];

  // Helper to compute sample unit names identical to backend logic
  const previewUnitName = (
    fl: number,
    uNum: number,
    globalSeq: number,
    scheme: NamingSchemeKey,
    ground: GroundConventionKey
  ): string => {
    const floorLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'];

    if (scheme === 'scheme2') {
      // 100-series: Ground -> G1..G9 (or 1..9), 1st -> 101..109, 2nd -> 201..209
      if (fl === 0) {
        if (ground === 'G') return `G${uNum}`;
        if (ground === 'GF') return `GF${uNum}`;
        if (ground === 'Ground') return `Ground ${uNum}`;
        return `${uNum}`;
      }
      return `${fl * 100 + uNum}`;
    }

    if (scheme === 'scheme3') {
      // Sequential: 1, 2, 3 ...
      return `${globalSeq}`;
    }

    if (scheme === 'scheme4') {
      // Floor + Letter: GA..GI, 1A..1I, 2A..2I
      const uLetter = uNum <= 26 ? String.fromCharCode(64 + uNum) : `${uNum}`;
      let flPrefix = `${fl}`;
      if (fl === 0) {
        flPrefix = ground === 'Ground' ? 'Ground ' : ground === 'GF' ? 'GF' : ground === 'Letter' ? 'A' : 'G';
      }
      return `${flPrefix}${uLetter}`;
    }

    if (scheme === 'scheme5') {
      // Word prefix: House 1..N
      return `House ${globalSeq}`;
    }

    // Default scheme1: Kenyan Floor Letters (Ground G1..G9, 1st A1..A9, 2nd B1..B9)
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

  // Generate live preview chips for all floors
  const previewFloors = useMemo(() => {
    const results: Array<{
      floorIndex: number;
      label: string;
      units: string[];
    }> = [];

    let currentSeq = 0;
    for (let fl = 0; fl < floors; fl++) {
      const unitsOnFloor: string[] = [];
      const floorTitle =
        fl === 0
          ? 'Ground Floor'
          : fl === 1
          ? '1st Floor'
          : fl === 2
          ? '2nd Floor'
          : fl === 3
          ? '3rd Floor'
          : `${fl}th Floor`;

      for (let u = 1; u <= unitsPerFloor; u++) {
        currentSeq++;
        unitsOnFloor.push(previewUnitName(fl, u, currentSeq, namingScheme, groundConvention));
      }

      results.push({
        floorIndex: fl,
        label: floorTitle,
        units: unitsOnFloor,
      });
    }

    return results;
  }, [floors, unitsPerFloor, namingScheme, groundConvention]);

  const totalUnits = floors * unitsPerFloor;
  const totalMonthlyRoll = totalUnits * monthlyRent;

  if (!isOpen) return null;

  const handleGenerateMockup = async (e: React.FormEvent) => {
    e.preventDefault();
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
              Configure building dimensions, floor plans, and authentic Kenyan unit numbering formats
              (e.g., G1 to G9, A1 to A9). Provisions a live relational database with active tenant profiles,
              M-Pesa statements, and balance ledgers.
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
                    {u} Units per floor {u === 9 ? '⭐ (e.g. G1..G9 / 101..109)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Unit Naming & Numbering Format System */}
          <div className="border border-slate-800 bg-slate-900/70 p-3.5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Tag className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-slate-200 text-xs tracking-wide uppercase">
                Unit Naming & House Numbering Format System
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Naming Scheme
                </label>
                <select
                  value={namingScheme}
                  onChange={(e) => setNamingScheme(e.target.value as NamingSchemeKey)}
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
                    Sequential House Numbers (1, 2, 3 ... {totalUnits})
                  </option>
                  <option value="scheme5">
                    Word Prefix (House 1, House 2 ... House {totalUnits})
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Ground Floor Convention
                </label>
                <select
                  value={groundConvention}
                  onChange={(e) => setGroundConvention(e.target.value as GroundConventionKey)}
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

            {/* Live Interactive Unit Preview Box */}
            <div className="mt-3 bg-slate-950/80 border border-slate-800/90 p-3 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[11px] font-bold text-slate-200">
                    Live Unit Numbering Preview
                  </span>
                  <span className="text-[10px] text-slate-400">
                    (How houses appear on client screens)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-slate-300">
                    <strong className="text-white">{totalUnits}</strong> Units
                  </span>
                  <span className="text-emerald-400 font-semibold">
                    KSh {totalMonthlyRoll.toLocaleString()} / mo
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {previewFloors.map((floor) => (
                  <div
                    key={floor.floorIndex}
                    className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 bg-slate-900/60 border border-slate-800/60 p-2"
                  >
                    <div className="text-[11px] font-bold text-sky-300 w-24 shrink-0">
                      {floor.label}:
                    </div>
                    <div className="flex flex-wrap gap-1 items-center">
                      {floor.units.map((unitName, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 font-mono text-[10px] font-semibold"
                        >
                          {unitName}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
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
                disabled={isGenerating}
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
