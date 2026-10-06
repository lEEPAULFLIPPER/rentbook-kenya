// =====================================================================
// RENTBOOK KENYA — REPORTS SCREEN (Landlord & Admin)
// Monthly Collection Report, Master Rent Roll, Expense Breakdown, CSV Export
// =====================================================================

import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  PieChart,
  Printer,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatKES, getCurrentMonthKey } from '../lib/formatters';

export const ReportsScreen: React.FC = () => {
  const { currentProperty, units, tenants, payments, expenses, tenantArrears } = useApp();

  const [activeTab, setActiveTab] = useState<'collection' | 'rentroll' | 'expenses'>('collection');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey());

  // 1. Monthly Collection calculations
  const collectionReport = units.map((u) => {
    const t = tenants.find((item) => item.unit_id === u.id && !item.move_out_date && !item.deleted_at);
    const unitPayments = payments.filter(
      (p) =>
        p.unit_id === u.id &&
        p.covers_month === selectedMonth &&
        !p.deleted_at &&
        p.status === 'approved'
    );
    const collected = unitPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const expected = u.status === 'occupied' ? u.monthly_rent : 0;
    const variance = expected - collected;

    return {
      unit: u,
      tenant: t,
      expected,
      collected,
      variance,
      isFullyPaid: collected >= expected,
    };
  });

  const totalExpected = collectionReport.reduce((s, r) => s + r.expected, 0);
  const totalCollected = collectionReport.reduce((s, r) => s + r.collected, 0);

  // 2. Expenses breakdown by category
  const expenseCategories = Array.from(new Set(expenses.map((e) => e.category)));
  const expenseBreakdown = expenseCategories.map((cat) => {
    const catExpenses = expenses.filter(
      (e) => e.category === cat && !e.deleted_at && e.status === 'approved'
    );
    const sum = catExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
    return { category: cat, sum, count: catExpenses.length };
  });
  const totalExpenseSum = expenseBreakdown.reduce((s, e) => s + e.sum, 0);

  // CSV Exporter
  const handleExportCSV = () => {
    let csvContent = '';
    let filename = `rentbook-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;

    if (activeTab === 'collection') {
      csvContent = 'House,Tenant,Status,Expected Rent,Collected,Variance\n';
      collectionReport.forEach((r) => {
        csvContent += `"${r.unit.name}","${r.tenant?.full_name || 'Vacant'}","${r.unit.status}",${r.expected},${r.collected},${r.variance}\n`;
      });
    } else if (activeTab === 'rentroll') {
      csvContent = 'House,Floor,Tenant Name,Phone,Monthly Rent,Deposit Paid,Due Day\n';
      units.forEach((u) => {
        const t = tenants.find((item) => item.unit_id === u.id && !item.move_out_date);
        csvContent += `"${u.name}",${u.floor_number},"${t?.full_name || 'Vacant'}","${t?.phone || ''}",${u.monthly_rent},${t?.deposit_paid || 0},${t?.rent_due_day || 5}\n`;
      });
    } else {
      csvContent = 'Category,Total Spent (KES),Number of Entries\n';
      expenseBreakdown.forEach((e) => {
        csvContent += `"${e.category}",${e.sum},${e.count}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4 pb-12 select-none">
      {/* 1. HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 shadow-sm print:hidden">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
            <span>Landlord Financial Reports</span>
            <span className="text-xs font-mono font-normal text-emerald-400 px-2 py-0.5 bg-slate-800 border border-slate-700">
              {currentProperty?.name}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Export spreadsheets for tax accounting, tenant statements, and bank audit
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition active:scale-95 min-h-[40px]"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition min-h-[40px]"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 2. REPORT TYPE TABS */}
      <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 p-2 print:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('collection')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition min-h-[40px] ${
            activeTab === 'collection'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Monthly Collection</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rentroll')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition min-h-[40px] ${
            activeTab === 'rentroll'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Master Rent Roll</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition min-h-[40px] ${
            activeTab === 'expenses'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Expenses Breakdown</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}
      {activeTab === 'collection' && (
        <div className="flex flex-col gap-3">
          {/* Month Selector & Summary */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Select Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-slate-100 font-mono"
              />
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400">Expected:</span>{' '}
                <strong className="text-slate-200">{formatKES(totalExpected)}</strong>
              </div>
              <div>
                <span className="text-slate-400">Collected:</span>{' '}
                <strong className="text-emerald-400">{formatKES(totalCollected)}</strong>
              </div>
            </div>
          </div>

          {/* Collection Table */}
          <div className="bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-800 text-slate-300 font-bold border-b border-slate-700">
                <tr>
                  <th className="px-3.5 py-3">House</th>
                  <th className="px-3.5 py-3">Tenant</th>
                  <th className="px-3 py-3 text-right">Expected Rent</th>
                  <th className="px-3 py-3 text-right">Collected</th>
                  <th className="px-3 py-3 text-right">Variance</th>
                  <th className="px-3 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {collectionReport.map((row) => (
                  <tr key={row.unit.id} className="hover:bg-slate-800/40">
                    <td className="px-3.5 py-2.5 font-bold font-mono text-slate-100">
                      House {row.unit.name}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-300">
                      {row.tenant ? row.tenant.full_name : <span className="text-rose-400 italic">Vacant</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-200">
                      {formatKES(row.expected)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-black text-emerald-400">
                      {formatKES(row.collected)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-black text-rose-400">
                      {row.variance > 0 ? formatKES(row.variance) : '0'}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                          row.isFullyPaid
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-rose-950 text-rose-300'
                        }`}
                      >
                        {row.isFullyPaid ? 'Cleared' : 'Deficit'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'rentroll' && (
        <div className="bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800 text-slate-300 font-bold border-b border-slate-700">
              <tr>
                <th className="px-3.5 py-3">House</th>
                <th className="px-3 py-3">Floor</th>
                <th className="px-3.5 py-3">Tenant Name</th>
                <th className="px-3 py-3">Phone</th>
                <th className="px-3 py-3 text-right">Monthly Rent</th>
                <th className="px-3 py-3 text-right">Deposit Held</th>
                <th className="px-3 py-3 text-center">Rent Due Day</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {units.map((u) => {
                const t = tenants.find((item) => item.unit_id === u.id && !item.move_out_date);
                return (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="px-3.5 py-2.5 font-bold font-mono text-slate-100">
                      House {u.name}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">Floor {u.floor_number}</td>
                    <td className="px-3.5 py-2.5 text-slate-200">
                      {t ? t.full_name : <span className="text-rose-400 italic">Vacant</span>}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-400">{t?.phone || '—'}</td>
                    <td className="px-3 py-2.5 text-right font-black text-emerald-400">
                      {formatKES(u.monthly_rent)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-sky-400">
                      {t ? formatKES(t.deposit_paid) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-slate-300">
                      {t?.rent_due_day || 5}th
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-200 uppercase">Expense Summary</span>
            <span className="text-sm font-black text-rose-400">
              Total Outflow: {formatKES(totalExpenseSum)}
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800 text-slate-300 font-bold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Entries</th>
                <th className="px-4 py-3 text-right">Total Spent (KES)</th>
                <th className="px-4 py-3 text-right">% of Total Expenses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {expenseBreakdown.map((row) => {
                const percent = totalExpenseSum > 0 ? Math.round((row.sum / totalExpenseSum) * 100) : 0;
                return (
                  <tr key={row.category} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-bold text-slate-200">{row.category}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{row.count}</td>
                    <td className="px-4 py-3 text-right font-black text-rose-400">
                      {formatKES(row.sum)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">{percent}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
