// =====================================================================
// RENTBOOK KENYA — AUDIT LOG SCREEN (Admin Master Control Only)
// Append-only audit trail: Who, Role, Action, Changes (before/after), Device info
// =====================================================================

import React, { useMemo, useState } from 'react';
import {
  Download,
  Filter,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AuditLog } from '../types';

export const AuditLogScreen: React.FC = () => {
  const { auditLogs } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mActor = log.actor_name?.toLowerCase().includes(q);
        const mTable = log.table_name.toLowerCase().includes(q);
        const mReason = log.reason?.toLowerCase().includes(q);
        const mDevice = log.device_info?.toLowerCase().includes(q);
        return mActor || mTable || mReason || mDevice;
      }
      return true;
    });
  }, [auditLogs, actionFilter, searchQuery]);

  const handleExportCSV = () => {
    let csv = 'Timestamp,Actor,Role,Action,Table,RecordID,Reason,Device\n';
    filteredLogs.forEach((l) => {
      csv += `"${l.created_at}","${l.actor_name || ''}","${l.actor_role || ''}","${l.action}","${l.table_name}","${l.record_id}","${l.reason || ''}","${l.device_info || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rentbook-audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="flex flex-col gap-4 pb-12 select-none">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-400" />
            <span>Master Audit Trail</span>
            <span className="text-xs font-mono font-normal text-purple-300 px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800">
              Append-Only ({filteredLogs.length} Records)
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of every database write, approval, deletion, and user action
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow transition active:scale-95 min-h-[40px]"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* 2. SEARCH & FILTER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search actor, table, or reason..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[40px]"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none min-h-[40px] w-full sm:w-auto"
        >
          <option value="all">All Actions</option>
          <option value="INSERT">INSERT (Create)</option>
          <option value="UPDATE">UPDATE (Edit)</option>
          <option value="APPROVE">APPROVE (Verify)</option>
          <option value="REJECT">REJECT</option>
          <option value="DELETE">DELETE</option>
          <option value="RESET">RESET (Factory)</option>
        </select>
      </div>

      {/* 3. AUDIT LOG TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[620px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800 text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-700">
              <tr>
                <th className="px-3.5 py-3">Timestamp</th>
                <th className="px-3.5 py-3">Actor & Role</th>
                <th className="px-3 py-3">Action</th>
                <th className="px-3 py-3">Entity (Table)</th>
                <th className="px-3.5 py-3">Description / Reason</th>
                <th className="px-3 py-3">Device Info</th>
                <th className="px-3 py-3 text-center">Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-3.5 py-2.5 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                    {new Date(log.created_at).toLocaleString('en-KE')}
                  </td>

                  <td className="px-3.5 py-2.5 whitespace-nowrap">
                    <span className="font-bold text-slate-200">{log.actor_name}</span>
                    <span
                      className={`ml-1.5 px-1.5 py-0.2 rounded text-[9px] uppercase font-mono font-bold ${
                        log.actor_role === 'admin'
                          ? 'bg-purple-950 text-purple-300'
                          : log.actor_role === 'landlord'
                          ? 'bg-emerald-950 text-emerald-300'
                          : 'bg-amber-950 text-amber-300'
                      }`}
                    >
                      {log.actor_role}
                    </span>
                  </td>

                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                        log.action === 'INSERT'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : log.action === 'APPROVE'
                          ? 'bg-sky-950 text-sky-400 border border-sky-800'
                          : log.action === 'DELETE' || log.action === 'RESET'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>

                  <td className="px-3 py-2.5 font-mono text-slate-300 whitespace-nowrap">
                    {log.table_name}
                  </td>

                  <td className="px-3.5 py-2.5 text-slate-300 max-w-xs truncate">
                    {log.reason || '—'}
                  </td>

                  <td className="px-3 py-2.5 text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                    {log.device_info || 'Chrome Client'}
                  </td>

                  <td className="px-3 py-2.5 text-center">
                    {log.before_json || log.after_json ? (
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 text-[10px] font-mono border border-slate-700"
                      >
                        Inspect
                      </button>
                    ) : (
                      <span className="text-slate-600 text-[10px]">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. JSON INSPECTION MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-4 flex flex-col gap-3 text-xs text-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-slate-100">Audit Record Inspection</h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1">
                Before State:
              </div>
              <pre className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-300 overflow-x-auto">
                {selectedLog.before_json
                  ? JSON.stringify(selectedLog.before_json, null, 2)
                  : 'null (New Record)'}
              </pre>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1">
                After State:
              </div>
              <pre className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                {selectedLog.after_json
                  ? JSON.stringify(selectedLog.after_json, null, 2)
                  : 'null (Deleted)'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
