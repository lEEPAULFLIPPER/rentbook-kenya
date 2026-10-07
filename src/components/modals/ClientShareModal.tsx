// =====================================================================
// RENTBOOK KENYA — CLIENT SHARE MODAL
// Fast client reporting: 1-Click WhatsApp statement, Interactive Share URL,
// and Printable PDF statement for remote landlords
// =====================================================================

import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Link2,
  MessageSquare,
  Printer,
  Share2,
  Smartphone,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { encodeShareSnapshot, generateWhatsAppSummary } from '../../lib/shareEngine';
import { getCurrentMonthKey, getPreviousMonthKey } from '../../lib/formatters';

interface ClientShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClientShareModal: React.FC<ClientShareModalProps> = ({ isOpen, onClose }) => {
  const {
    currentProperty,
    units,
    tenants,
    payments,
    expenses,
    broadcastLiveAction,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'whatsapp' | 'weblink' | 'document'>('whatsapp');
  
  // Default to September 2026 if available or previous month
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    // Check if there are September 2026 payments
    const hasSep = payments.some((p) => p.covers_month === '2026-09' && !p.deleted_at);
    if (hasSep) return '2026-09';
    return getPreviousMonthKey(getCurrentMonthKey());
  });

  // Base URL for link generation
  const defaultBaseUrl = typeof window !== 'undefined'
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'https://authority-outputs-linear-belongs.trycloudflare.com'
        : window.location.origin)
    : 'https://authority-outputs-linear-belongs.trycloudflare.com';

  const [customHost, setCustomHost] = useState<string>(defaultBaseUrl);
  const [copiedText, setCopiedText] = useState<'whatsapp' | 'link' | null>(null);

  // Filtered entities scoped to the current property
  const propertyUnits = useMemo(() => {
    return units.filter((u) => u.property_id === currentProperty?.id);
  }, [units, currentProperty]);

  const propertyTenants = useMemo(() => {
    const unitIds = new Set(propertyUnits.map((u) => u.id));
    return tenants.filter((t) => unitIds.has(t.unit_id));
  }, [tenants, propertyUnits]);

  const propertyPayments = useMemo(() => {
    const unitIds = new Set(propertyUnits.map((u) => u.id));
    return payments.filter((p) => unitIds.has(p.unit_id));
  }, [payments, propertyUnits]);

  const propertyExpenses = useMemo(() => {
    return expenses.filter((e) => e.property_id === currentProperty?.id);
  }, [expenses, currentProperty]);

  // WhatsApp Message Text
  const whatsAppText = useMemo(() => {
    if (!currentProperty) return '';
    return generateWhatsAppSummary({
      propertyName: currentProperty.name,
      monthKey: selectedMonth,
      units: propertyUnits,
      tenants: propertyTenants,
      payments: propertyPayments,
      expenses: propertyExpenses,
    });
  }, [currentProperty, selectedMonth, propertyUnits, propertyTenants, propertyPayments, propertyExpenses]);

  // Interactive Snapshot Link
  const shareLink = useMemo(() => {
    if (!currentProperty) return '';
    const payload = {
      version: '1.0' as const,
      exportedAt: new Date().toISOString(),
      property: currentProperty,
      units: propertyUnits,
      tenants: propertyTenants,
      payments: propertyPayments,
      expenses: propertyExpenses,
    };
    const token = encodeShareSnapshot(payload);
    const host = (customHost || window.location.origin).replace(/\/$/, '');
    return `${host}/#share=${token}`;
  }, [currentProperty, propertyUnits, propertyTenants, propertyPayments, propertyExpenses, customHost]);

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsAppText);
    setCopiedText('whatsapp');
    broadcastLiveAction('Copied WhatsApp summary to clipboard!', 'success');
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(whatsAppText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedText('link');
    broadcastLiveAction('Copied interactive client link to clipboard!', 'success');
    setTimeout(() => setCopiedText(null), 2500);
  };

  if (!isOpen || !currentProperty) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Share ${currentProperty.name} with Client`}
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-4 text-xs select-none">
        {/* Month Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Reporting Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-100 px-2 py-1 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {propertyUnits.length} Units • {propertyPayments.filter((p) => p.covers_month === selectedMonth && !p.deleted_at).length} Receipts Recorded
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold transition ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Summary</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('weblink')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold transition ${
              activeTab === 'weblink'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Interactive Phone Link</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('document')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold transition ${
              activeTab === 'document'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Printable Statement</span>
          </button>
        </div>

        {/* TAB 1: WHATSAPP SUMMARY */}
        {activeTab === 'whatsapp' && (
          <div className="flex flex-col gap-3">
            <p className="text-slate-300 text-[11px]">
              Instantly sends a formatted breakdown to James via WhatsApp. Includes house-by-house status, receipts, and total collection.
            </p>
            <div className="bg-slate-950 border border-slate-800 p-3 max-h-60 overflow-y-auto font-mono text-[11px] text-slate-200 whitespace-pre-wrap select-text leading-relaxed">
              {whatsAppText}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold border border-slate-700 transition"
              >
                {copiedText === 'whatsapp' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedText === 'whatsapp' ? 'Copied to Clipboard!' : 'Copy WhatsApp Message'}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in WhatsApp</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE PHONE LINK */}
        {activeTab === 'weblink' && (
          <div className="flex flex-col gap-3">
            <p className="text-slate-300 text-[11px]">
              Sends James a direct interactive link. When he opens it on his smartphone or laptop anywhere, RentBook automatically loads his building and recorded September ledger into his screen.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400">Public App Address / Tunnel:</label>
              <input
                type="text"
                value={customHost}
                onChange={(e) => setCustomHost(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-slate-200 font-mono focus:ring-1 focus:ring-emerald-500"
                placeholder="https://..."
              />
              <span className="text-[10px] text-slate-500">
                Live Cloudflare Tunnel active: Anyone in Kenya can open this link on mobile data or WiFi.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400">Full Shareable Link for James:</label>
              <div className="p-2.5 bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300 break-all select-all max-h-24 overflow-y-auto">
                {shareLink}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
              >
                {copiedText === 'link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedText === 'link' ? 'Link Copied!' : 'Copy Interactive Link for James'}</span>
              </button>
              <a
                href={shareLink}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Test Link</span>
              </a>
            </div>
          </div>
        )}

        {/* TAB 3: PRINTABLE STATEMENT */}
        {activeTab === 'document' && (
          <div className="flex flex-col gap-3">
            <p className="text-slate-300 text-[11px]">
              Print or export a formal PDF statement of the September rent roll to email or send as a document attachment.
            </p>
            <div className="p-4 bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">{currentProperty.name} — September 2026 Statement</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Formal Landlord & Tax Audit Format</div>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold border border-slate-700"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
