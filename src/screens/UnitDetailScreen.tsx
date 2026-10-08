// =====================================================================
// RENTBOOK KENYA — UNIT DETAIL SCREEN (House Statement & History)
// Full ledger for one house, inline renaming, tenant call/SMS, payment waterfall
// =====================================================================

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Building,
  CheckCircle2,
  DollarSign,
  DoorOpen,
  Edit2,
  Key,
  MessageCircle,
  MessageSquare,
  Phone,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Printer,
  Trash2,
  User,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { createSmsHref, createWhatsAppHref, formatKES, formatPhoneKE, generateRentSMS } from '../lib/formatters';
import { getFloorDisplayName } from '../lib/namingEngine';

export const UnitDetailScreen: React.FC = () => {
  const {
    selectedUnitId,
    setCurrentScreen,
    units,
    tenants,
    payments,
    tenantArrears,
    openPaymentModal,
    openTenantModal,
    openUnitModal,
    openReceiptModal,
    updateUnit,
    deletePayment,
    broadcastLiveAction,
  } = useApp();

  const { activeRole } = useAuth();
  const [isClosedPeriodVerified, setIsClosedPeriodVerified] = useState<boolean>(false);

  const unit = units.find((u) => u.id === selectedUnitId);
  const tenant = tenants.find((t) => t.unit_id === selectedUnitId && !t.move_out_date && !t.deleted_at);
  const arrearsItem = tenantArrears.find((a) => a.unit.id === selectedUnitId);

  // Payments for this unit
  const unitPayments = payments
    .filter((p) => p.unit_id === selectedUnitId && !p.deleted_at)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!unit) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        House not found.{' '}
        <button
          type="button"
          onClick={() => setCurrentScreen('units')}
          className="text-emerald-400 underline"
        >
          Return to houses list
        </button>
      </div>
    );
  }

  const isOccupied = unit.status === 'occupied';

  const handleToggleStatus = async () => {
    if (!unit) return;
    const nextStatus = isOccupied ? 'vacant' : 'occupied';

    if (isOccupied && tenant) {
      const confirmChange = window.confirm(
        `House ${unit.name} currently has an active tenant (${tenant.full_name}).\n\nAre you sure you want to change its status to VACANT?`
      );
      if (!confirmChange) return;
    }

    try {
      await updateUnit({
        ...unit,
        status: nextStatus,
      });
      broadcastLiveAction(
        `House ${unit.name} marked as ${nextStatus.toUpperCase()}`,
        nextStatus === 'occupied' ? 'success' : 'info'
      );
    } catch (err) {
      console.error('Failed to toggle unit status', err);
    }
  };

  const handleDeletePayment = async (paymentId: string, amount: number, ref: string) => {
    const confirmDelete = window.confirm(
      `Delete payment record of ${formatKES(amount)} [Ref: ${ref}]?\n\n` +
      `This will remove the entry and update this house's debt balance immediately.`
    );
    if (!confirmDelete) return;

    const res = await deletePayment(
      paymentId,
      `Removed misplaced entry of ${formatKES(amount)} for House ${unit?.name || ''}`
    );
    if (!res.success) {
      alert(res.message || 'Failed to delete payment');
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-12 select-none">
      {/* 1. TOP NAV BACK & HOUSE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentScreen('units')}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Back to houses list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-100 font-mono tracking-tight">
                House {unit.name}
              </h1>
              <button
                type="button"
                onClick={handleToggleStatus}
                title={`Click to switch to ${isOccupied ? 'VACANT' : 'OCCUPIED'}`}
                className={`px-2 py-0.5 text-[10px] font-bold uppercase font-mono border transition active:scale-95 flex items-center gap-1 ${
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
              {activeRole !== 'caretaker' && (
                <button
                  type="button"
                  onClick={() => openUnitModal(unit)}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Rename house or change rent"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {getFloorDisplayName(unit.floor_number)} · Monthly Rent:{' '}
              <strong className="text-emerald-400">{formatKES(unit.monthly_rent)}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleStatus}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border transition active:scale-95 min-h-[44px] ${
              isOccupied
                ? 'bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border-slate-700 hover:border-rose-700'
                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-700 hover:border-emerald-500'
            }`}
            title={isOccupied ? 'Mark house as Vacant' : 'Mark house as Occupied'}
          >
            {isOccupied ? (
              <>
                <DoorOpen className="w-4 h-4 text-rose-400" />
                <span>Mark Vacant</span>
              </>
            ) : (
              <>
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Mark Occupied</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => openPaymentModal({ unitId: unit.id, tenantId: tenant?.id })}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95 min-h-[44px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record Rent Payment</span>
          </button>
        </div>
      </div>

      {/* 2. TENANT & LEASE CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tenant Profile Card */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-400" />
                <span>Tenant & Lease Details</span>
              </span>

              {tenant ? (
                <button
                  type="button"
                  onClick={() => openTenantModal({ unitId: unit.id, tenant })}
                  className="text-xs text-slate-300 hover:text-white font-medium"
                >
                  Edit Tenant →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openTenantModal({ unitId: unit.id, tenant: null })}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:underline font-bold"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Assign Tenant Now</span>
                </button>
              )}
            </div>

            {tenant ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-100">{tenant.full_name}</h3>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      Phone: <span className="text-slate-200">{tenant.phone}</span>
                      {tenant.id_number && <span> · ID: {tenant.id_number}</span>}
                    </div>
                  </div>

                  {/* Direct Mobile Call, SMS & WhatsApp Buttons */}
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${formatPhoneKE(tenant.phone)}`}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition min-h-[44px]"
                      title="Call Tenant"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Call</span>
                    </a>

                    <a
                      href={createSmsHref(
                        tenant.phone,
                        generateRentSMS(
                          'sw',
                          unit.name,
                          arrearsItem ? arrearsItem.balance : unit.monthly_rent,
                          tenant.full_name
                        )
                      )}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition min-h-[44px]"
                      title="Send SMS Reminder"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                      <span>SMS</span>
                    </a>

                    <a
                      href={createWhatsAppHref(
                        tenant.phone,
                        generateRentSMS(
                          'sw',
                          unit.name,
                          arrearsItem ? arrearsItem.balance : unit.monthly_rent,
                          tenant.full_name
                        )
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-200 border border-emerald-700/60 text-xs font-semibold transition min-h-[44px]"
                      title="Send WhatsApp Notice"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <div className="text-[11px] text-slate-400">Lease Start</div>
                    <div className="font-semibold text-slate-200">{tenant.move_in_date}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Deposit Paid</div>
                    <div className="font-semibold text-emerald-400">
                      {formatKES(tenant.deposit_paid)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Rent Due Day</div>
                    <div className="font-semibold text-slate-200">
                      {tenant.rent_due_day || 5}th of month
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                This flat is currently vacant. No tenant is assigned.
              </div>
            )}
          </div>
        </div>

        {/* Debt / Arrears Status Card */}
        <div className="bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Debt Status</span>
              </span>
              {arrearsItem && (
                <span className="text-[10px] font-bold uppercase font-mono px-1.5 py-0.5 bg-slate-800 text-slate-300">
                  {arrearsItem.bucket} Bucket
                </span>
              )}
            </div>

            {arrearsItem && arrearsItem.balance > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="text-2xl font-black text-rose-400">
                  {formatKES(arrearsItem.balance)}
                </div>
                <div className="text-xs text-rose-200/90 leading-relaxed">
                  Outstanding debt across {arrearsItem.months_behind} month(s). Oldest unpaid
                  month is <strong>{arrearsItem.oldest_unpaid_month}</strong>.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1 text-xs">
                <div className="text-2xl font-black text-emerald-400">KSh 0</div>
                <div className="text-emerald-300 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All rent is fully cleared!</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. PAYMENT HISTORY LEDGER FOR THIS HOUSE */}
      <div className="bg-slate-900 border border-slate-800 p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
            Payment History for House {unit.name} ({unitPayments.length} Records)
          </h3>

          {/* Verify Closed Period Option Toggle */}
          <button
            type="button"
            onClick={() => setIsClosedPeriodVerified(!isClosedPeriodVerified)}
            className={`px-2.5 py-1 text-[11px] font-bold border transition flex items-center gap-1.5 active:scale-95 ${
              isClosedPeriodVerified
                ? 'bg-rose-700 text-white border-rose-500 font-black'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
            title={
              isClosedPeriodVerified
                ? 'Click to lock closed period and hide delete icons'
                : 'Verify closed period to unlock record deletion for misplaced entries'
            }
          >
            {isClosedPeriodVerified ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Verified (Delete Active 🗑️)</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Verify Closed Period</span>
              </>
            )}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">For Month</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Reference</th>
                <th className="px-3 py-2 text-right">Amount Paid</th>
                <th className="px-3 py-2">Recorded By</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-center">Receipt</th>
                {isClosedPeriodVerified && (
                  <th className="px-3 py-2 text-center">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {unitPayments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-800/40">
                  <td className="px-3 py-2 font-mono text-slate-400">{pay.date}</td>
                  <td className="px-3 py-2 font-semibold text-slate-200">{pay.covers_month}</td>
                  <td className="px-3 py-2">{pay.method}</td>
                  <td className="px-3 py-2 font-mono text-slate-300">{pay.reference}</td>
                  <td className="px-3 py-2 text-right font-black text-emerald-400">
                    {formatKES(pay.amount)}
                  </td>
                  <td className="px-3 py-2 text-slate-400 text-[11px]">{pay.recorder_name}</td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`px-1.5 py-0.5 text-[9px] font-bold uppercase font-mono ${
                        pay.status === 'approved'
                          ? 'bg-emerald-950 text-emerald-300'
                          : 'bg-amber-950 text-amber-300'
                      }`}
                    >
                      {pay.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => openReceiptModal(pay)}
                      className="p-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
                      title="View / Print Official Rent Receipt"
                    >
                      <Printer className="w-3.5 h-3.5 text-sky-400" />
                    </button>
                  </td>
                  {isClosedPeriodVerified && (
                    <td className="px-3 py-2 text-center">
                      {(activeRole !== 'caretaker' || pay.status === 'pending') && (
                        <button
                          type="button"
                          onClick={() => handleDeletePayment(pay.id, pay.amount, pay.reference)}
                          className="p-1 text-rose-300 hover:text-white bg-rose-950/80 hover:bg-rose-900 border border-rose-800 transition"
                          title="Delete misplaced payment record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {unitPayments.length === 0 && (
                <tr>
                  <td colSpan={isClosedPeriodVerified ? 9 : 8} className="px-3 py-6 text-center text-slate-500 italic">
                    No payment history recorded yet for this house.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
