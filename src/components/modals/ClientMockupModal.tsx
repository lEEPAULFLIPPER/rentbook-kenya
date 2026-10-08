// =====================================================================
// RENTBOOK KENYA — CLIENT MOCKUP & DATABASE GENERATOR MODAL
// Allows immediate setup of a tailored apartment mockup for pitching clients
// =====================================================================

import React, { useState } from 'react';
import {
  Building,
  CheckCircle2,
  Database,
  Download,
  Flame,
  Layers,
  MapPin,
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { DatabaseService } from '../../lib/databaseService';

interface ClientMockupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClientMockupModal: React.FC<ClientMockupModalProps> = ({ isOpen, onClose }) => {
  const { broadcastLiveAction } = useApp();

  const [clientName, setClientName] = useState('James Kariuki');
  const [propertyName, setPropertyName] = useState('Parkview Heights');
  const [location, setLocation] = useState('Ruaka, Kiambu Road');
  const [floors, setFloors] = useState<number>(3);
  const [unitsPerFloor, setUnitsPerFloor] = useState<number>(4);
  const [monthlyRent, setMonthlyRent] = useState<number>(22000);
  const [isGenerating, setIsGenerating] = useState(false);

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
      });

      if (res.success) {
        broadcastLiveAction(`Mockup generated for ${propertyName}! Reloading...`, 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        alert(res.error || 'Failed to generate mockup');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetDefault = async () => {
    if (!window.confirm('Reset database to default Kilimani Heights demo?')) return;
    setIsGenerating(true);
    await DatabaseService.resetDefaultDemo();
    broadcastLiveAction('Reset to default Kilimani Heights demo', 'info');
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
      title="Client Mockup & Database Center"
      maxWidth="xl"
    >
      <div className="flex flex-col gap-4 text-xs select-none">
        {/* Banner */}
        <div className="bg-sky-950/60 border border-sky-800 p-3.5 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-slate-100 text-xs">
              Tailor the Mockup to Your Client's Building
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              When pitching a landlord, showing their actual building name, unit count, and realistic
              rent prices closes the deal in minutes. This tool builds a custom SQLite database
              pre-filled with authentic Kenyan tenants, M-Pesa receipts, and arrears.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleGenerateMockup} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Client / Landlord Name
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Peter Kamau"
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 min-h-[38px]"
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
                placeholder="e.g. Sunrise Court"
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 min-h-[38px]"
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
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 min-h-[38px]"
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
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 min-h-[38px]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Number of Floors
              </label>
              <select
                value={floors}
                onChange={(e) => setFloors(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 min-h-[38px]"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((f) => (
                  <option key={f} value={f}>
                    {f} {f === 1 ? 'Floor (Ground only)' : 'Floors'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Units Per Floor
              </label>
              <select
                value={unitsPerFloor}
                onChange={(e) => setUnitsPerFloor(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 min-h-[38px]"
              >
                {[2, 3, 4, 5, 6, 8, 10].map((u) => (
                  <option key={u} value={u}>
                    {u} Units per floor ({floors * u} Total Houses)
                  </option>
                ))}
              </select>
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
                Reset Default Demo
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
                <span>{isGenerating ? 'Building Database...' : 'Generate Client Mockup'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
