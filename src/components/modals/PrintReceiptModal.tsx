// =====================================================================
// RENTBOOK KENYA — OFFICIAL RENT RECEIPT MODAL
// Authentic Kenyan apartment rent voucher with print styling & WhatsApp share
// =====================================================================

import React, { useRef } from 'react';
import {
  CheckCircle2,
  Copy,
  Download,
  MessageCircle,
  Printer,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Payment, Property, Tenant, Unit } from '../../types';
import { formatKES, formatMonthName, formatPhoneKE } from '../../lib/formatters';

interface PrintReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  unit?: Unit;
  tenant?: Tenant;
  property?: Property;
}

// Converts numbers to English words (e.g. 18000 -> "Eighteen Thousand")
function numberToWordsKES(num: number): string {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  function convertGroup(n: number): string {
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + ' ';
    }
    return str.trim();
  }

  let words = '';
  const thousands = Math.floor(num / 1000);
  const remainder = Math.floor(num % 1000);

  if (thousands > 0) {
    words += convertGroup(thousands) + ' Thousand ';
  }
  if (remainder > 0) {
    words += convertGroup(remainder) + ' ';
  }

  return (words.trim() + ' Kenya Shillings Only').toUpperCase();
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  isOpen,
  onClose,
  payment,
  unit,
  tenant,
  property,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !payment) return null;

  const receiptNumber = `REC-${payment.date.replace(/-/g, '')}-${payment.reference.slice(-4).toUpperCase()}`;
  const amountWords = numberToWordsKES(Number(payment.amount));

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppReceipt = () => {
    const text = `*OFFICIAL RENT RECEIPT*\n` +
      `*Receipt No:* ${receiptNumber}\n` +
      `*Property:* ${property?.name || 'Apartment'}\n` +
      `*House:* ${unit?.name || '—'}\n` +
      `*Tenant:* ${tenant?.full_name || 'Tenant'}\n` +
      `*Amount Paid:* ${formatKES(payment.amount)}\n` +
      `*Period:* ${formatMonthName(payment.covers_month)}\n` +
      `*Method:* ${payment.method} (Ref: ${payment.reference})\n` +
      `*Date:* ${payment.date}\n` +
      `*Status:* Cleared & Approved\n\n` +
      `Thank you for your prompt payment!`;

    const phone = tenant?.phone ? formatPhoneKE(tenant.phone).replace(/^\+/, '') : '';
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Rent Receipt"
      maxWidth="xl"
    >
      <div className="flex flex-col gap-4">
        {/* Printable Voucher Box */}
        <div
          ref={receiptRef}
          className="bg-white text-slate-900 border-2 border-slate-900 p-5 sm:p-6 shadow-md font-sans text-xs select-text print:m-0 print:border-none print:shadow-none"
        >
          {/* Top Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-3">
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-950 uppercase">
                {property?.name || 'Apartment Management'}
              </h2>
              <p className="text-[11px] text-slate-600 font-medium">
                {property?.location || 'Nairobi, Kenya'}
              </p>
              <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 border border-emerald-300">
                <ShieldCheck className="w-3 h-3" />
                <span>OFFICIAL DIGITAL RENT VOUCHER</span>
              </div>
            </div>
            <div className="text-right">
              <span className="block text-xs font-mono font-black text-slate-900">
                {receiptNumber}
              </span>
              <span className="block text-[11px] text-slate-500 mt-0.5">
                Date: <strong>{payment.date}</strong>
              </span>
            </div>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-b border-slate-300 pb-3 mb-3 text-xs">
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Received From:</span>
              <span className="font-bold text-slate-900 text-sm">{tenant?.full_name || 'Tenant'}</span>
              <span className="block text-[11px] text-slate-600">{tenant?.phone || ''}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">House / Unit:</span>
              <span className="font-black text-slate-900 text-sm">HOUSE {unit?.name || '—'}</span>
              <span className="block text-[11px] text-slate-600">Rent Period: <strong>{formatMonthName(payment.covers_month)}</strong></span>
            </div>
          </div>

          {/* Amount In Words & Figures */}
          <div className="bg-slate-50 border border-slate-300 p-3 mb-3">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Amount Paid:</span>
              <span className="text-lg font-black text-emerald-700 tracking-tight font-mono">
                {formatKES(payment.amount)}
              </span>
            </div>
            <div className="text-[11px] text-slate-700 font-semibold italic border-t border-slate-200 pt-1">
              "{amountWords}"
            </div>
          </div>

          {/* Payment Method & Reference */}
          <div className="grid grid-cols-2 gap-2 text-[11px] mb-4 text-slate-700">
            <div>
              <span className="text-slate-500">Payment Mode:</span>{' '}
              <strong className="text-slate-900">{payment.method}</strong>
            </div>
            <div>
              <span className="text-slate-500">Transaction Ref:</span>{' '}
              <strong className="text-slate-900 font-mono">{payment.reference}</strong>
            </div>
            {payment.note && (
              <div className="col-span-2 text-slate-500 italic">
                Note: {payment.note}
              </div>
            )}
          </div>

          {/* Signature / Approval Footer */}
          <div className="border-t-2 border-slate-900 pt-3 flex justify-between items-end text-[10px] text-slate-600">
            <div>
              <span>Recorded By: <strong>{payment.recorder_name || 'Authorized Staff'}</strong></span>
              <br />
              <span>Status: <strong className="text-emerald-700 uppercase">Approved & Verified</strong></span>
            </div>
            <div className="text-right">
              <div className="font-mono text-[9px] text-slate-400">AUTHENTICATED BY RENTBOOK KENYA</div>
              <div className="font-bold text-slate-900">David Kimani · Landlord Signature</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 flex-wrap">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWhatsAppReceipt}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition active:scale-95 min-h-[40px]"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Send WhatsApp Receipt</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow transition active:scale-95 min-h-[40px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
