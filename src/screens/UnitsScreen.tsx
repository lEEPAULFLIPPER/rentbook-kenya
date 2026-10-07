// =====================================================================
// RENTBOOK KENYA — UNITS / HOUSES SCREEN
// Grouped by floor, auto-fit grid (~4-5/row on 1366x768, 1-2 on mobile),
// color-coded occupied (green) / vacant (rose), arrears badges
// =====================================================================

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Building,
  CheckCircle2,
  DoorOpen,
  Edit2,
  Key,
  Plus,
  RefreshCw,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatKES } from '../lib/formatters';
import { getFloorDisplayName } from '../lib/namingEngine';
import { Unit } from '../types';

export const UnitsScreen: React.FC = () => {
  const {
    currentProperty,
    units,
    tenants,
    tenantArrears,
    setCurrentScreen,
    openUnitModal,
    openBulkRenameModal,
    openTenantModal,
    openPropertyModal,
    updateUnit,
    broadcastLiveAction,
  } = useApp();

  const { activeRole } = useAuth();
  const [floorFilter, setFloorFilter] = useState<'all' | number>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'occupied' | 'vacant'>('all');

  // 1-Click quick toggle for house status (Vacant <-> Occupied)
  const handleToggleUnitStatus = async (
    e: React.MouseEvent,
    unit: Unit,
    currentTenant?: { full_name: string }
  ) => {
    e.stopPropagation();
    const nextStatus = unit.status === 'occupied' ? 'vacant' : 'occupied';

    if (unit.status === 'occupied' && currentTenant) {
      const confirmChange = window.confirm(
        `House ${unit.name} currently has an active tenant (${currentTenant.full_name}).\n\nAre you sure you want to mark this house as VACANT?`
      );
      if (!confirmChange) return;
    }

    try {
      await updateUnit({
        ...unit,
        status: nextStatus,
      });
      broadcastLiveAction(
        `House ${unit.name} is now marked as ${nextStatus.toUpperCase()}`,
        nextStatus === 'occupied' ? 'success' : 'info'
      );
    } catch (err) {
      console.error('Failed to toggle unit status', err);
    }
  };

  // Group units by floor
  const floorGroups = useMemo(() => {
    const groups: Record<number, Unit[]> = {};

    units
      .filter((u) => !u.deleted_at)
      .forEach((u) => {
        if (floorFilter !== 'all' && u.floor_number !== floorFilter) return;
        if (statusFilter !== 'all' && u.status !== statusFilter) return;

        if (!groups[u.floor_number]) {
          groups[u.floor_number] = [];
        }
        groups[u.floor_number].push(u);
      });

    return groups;
  }, [units, floorFilter, statusFilter]);

  const sortedFloors = Object.keys(floorGroups)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-4 pb-12 select-none">
      {/* 1. TOP HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 sm:p-4">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
            <span>Houses & Apartments</span>
            <span className="text-xs font-mono font-normal text-emerald-400 px-2 py-0.5 bg-slate-800 border border-slate-700">
              {units.length} Total Units
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {currentProperty?.name} · Floor-by-floor occupancy and tenant allocations
          </p>
        </div>

        {/* Bulk Actions for Landlord / Admin */}
        {activeRole !== 'caretaker' && currentProperty && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openPropertyModal(currentProperty)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition active:scale-95 min-h-[40px]"
              title="Add, delete, or rename flats and configure floor structure"
            >
              <Building className="w-3.5 h-3.5 text-emerald-400" />
              <span>Configure Flats & Naming</span>
            </button>
            <button
              type="button"
              onClick={() => openBulkRenameModal(currentProperty.id)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition active:scale-95 min-h-[40px]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Bulk Rename Houses</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. FILTER TABS (FLOOR & OCCUPANCY) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 border border-slate-800 p-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setFloorFilter('all')}
            className={`px-3 py-1 text-xs font-semibold transition min-h-[36px] ${
              floorFilter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Floors
          </button>
          {Array.from(new Set(units.map((u) => u.floor_number)))
            .sort((a, b) => a - b)
            .map((floor) => (
              <button
                key={floor}
                type="button"
                onClick={() => setFloorFilter(floor)}
                className={`px-3 py-1 text-xs font-semibold transition min-h-[36px] ${
                  floorFilter === floor
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {getFloorDisplayName(floor)}
              </button>
            ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 text-xs font-medium transition min-h-[36px] ${
              statusFilter === 'all' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('occupied')}
            className={`px-2.5 py-1 text-xs font-medium transition min-h-[36px] ${
              statusFilter === 'occupied'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold'
                : 'text-slate-400'
            }`}
          >
            Occupied ({units.filter((u) => u.status === 'occupied').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('vacant')}
            className={`px-2.5 py-1 text-xs font-medium transition min-h-[36px] ${
              statusFilter === 'vacant'
                ? 'bg-rose-950 text-rose-300 border border-rose-600 font-bold'
                : 'text-slate-400'
            }`}
          >
            Vacant ({units.filter((u) => u.status === 'vacant').length})
          </button>
        </div>
      </div>

      {/* 3. FLOOR-BY-FLOOR GRID CARDS (~4-5 PER ROW ON CHROMEBOOK 1366x768) */}
      <div className="flex flex-col gap-6">
        {sortedFloors.map((floorNum) => {
          const floorUnits = floorGroups[floorNum] || [];
          return (
            <div key={floorNum} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 px-1">
                <span className="h-2 w-2 bg-emerald-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {getFloorDisplayName(floorNum)} ({floorUnits.length} Units)
                </h2>
              </div>

              <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {floorUnits.map((unit) => {
                  const tenant = tenants.find(
                    (t) => t.unit_id === unit.id && !t.move_out_date && !t.deleted_at
                  );
                  const isOccupied = unit.status === 'occupied';
                  const arrearsItem = tenantArrears.find((a) => a.unit.id === unit.id);
                  const hasArrears = arrearsItem && arrearsItem.balance > 0;

                  return (
                    <div
                      key={unit.id}
                      onClick={() => setCurrentScreen('unit-detail', unit.id)}
                      className={`group relative p-3.5 border transition cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-md ${
                        isOccupied
                          ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/60'
                          : 'bg-rose-950/20 border-rose-900/40 hover:border-rose-500/60'
                      }`}
                    >
                      {/* Top: House Number & Status Pill */}
                      <div className="flex items-start justify-between gap-1.5 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-base text-slate-100 font-mono tracking-tight">
                              House {unit.name}
                            </span>
                            {activeRole !== 'caretaker' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openUnitModal(unit);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition"
                                title="Edit unit"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-slate-400">
                            {formatKES(unit.monthly_rent)}/mo
                          </span>
                        </div>

                        {/* Interactive Status Pill Toggle */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleUnitStatus(e, unit, tenant)}
                          title={`Click to mark as ${isOccupied ? 'VACANT' : 'OCCUPIED'}`}
                          className={`px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider font-mono border transition active:scale-95 flex items-center gap-1 ${
                            isOccupied
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-rose-950/80 hover:text-rose-300 hover:border-rose-700'
                              : 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-emerald-950/80 hover:text-emerald-300 hover:border-emerald-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 inline-block ${
                              isOccupied ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          <span>{unit.status}</span>
                        </button>
                      </div>

                      {/* Middle: Tenant / Vacant info */}
                      <div className="my-1.5">
                        {tenant ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-200">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold truncate">{tenant.full_name}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-rose-400/90 italic">
                            Empty house (click to assign)
                          </div>
                        )}
                        {unit.notes && (
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {unit.notes}
                          </div>
                        )}
                      </div>

                      {/* Bottom: Arrears Alert or Paid Badge + Dedicated 1-Click Action Button */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 text-[11px]">
                        <div className="min-w-0 flex-1">
                          {hasArrears ? (
                            <div className="flex items-center gap-1 text-rose-400 font-bold truncate">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">Owes {formatKES(arrearsItem.balance)}</span>
                            </div>
                          ) : isOccupied ? (
                            <div className="flex items-center gap-1 text-emerald-400 font-medium truncate">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">Paid Up</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[10px]">Ready for viewing</span>
                          )}
                        </div>

                        {/* Dedicated 1-Click Set Vacant / Occupied Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleUnitStatus(e, unit, tenant)}
                          className={`px-2 py-1 text-[10px] font-bold border transition active:scale-95 flex items-center gap-1 shrink-0 ${
                            isOccupied
                              ? 'bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border-slate-700 hover:border-rose-700'
                              : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-700 hover:border-emerald-500'
                          }`}
                          title={isOccupied ? 'Set house as Vacant' : 'Set house as Occupied'}
                        >
                          {isOccupied ? (
                            <>
                              <DoorOpen className="w-3 h-3 text-rose-400" />
                              <span>Set Vacant</span>
                            </>
                          ) : (
                            <>
                              <Key className="w-3 h-3 text-emerald-400" />
                              <span>Set Occupied</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
