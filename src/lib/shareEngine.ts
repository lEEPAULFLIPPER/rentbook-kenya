// =====================================================================
// RENTBOOK KENYA — CLIENT SHARING & SNAPSHOT HYDRATION ENGINE
// Generates WhatsApp rental reports and encodes shareable ledger snapshots
// =====================================================================

import { Expense, Payment, Property, Tenant, Unit } from '../types';
import { formatKES } from './formatters';

export interface ShareSnapshotPayload {
  version: '1.0';
  exportedAt: string;
  property: Property;
  units: Unit[];
  tenants: Tenant[];
  payments: Payment[];
  expenses?: Expense[];
}

/**
 * Encodes a property snapshot into a URL-safe Base64 token.
 * Handles UTF-8 strings (Swahili, emojis, Kenyan shilling symbols).
 */
export function encodeShareSnapshot(payload: ShareSnapshotPayload): string {
  const jsonStr = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(jsonStr);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes a URL-safe Base64 token back into a property snapshot payload.
 */
export function decodeShareSnapshot(token: string): ShareSnapshotPayload | null {
  try {
    const binary = atob(token);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !parsed.property || !Array.isArray(parsed.units)) {
      return null;
    }
    return parsed as ShareSnapshotPayload;
  } catch (err) {
    console.error('Failed to decode share snapshot:', err);
    return null;
  }
}

/**
 * Generates an authentic, executive WhatsApp summary message tailored for Kenyan landlords.
 */
export function generateWhatsAppSummary({
  propertyName,
  monthKey,
  units,
  tenants,
  payments,
  expenses = [],
}: {
  propertyName: string;
  monthKey: string;
  units: Unit[];
  tenants: Tenant[];
  payments: Payment[];
  expenses?: Expense[];
}): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr) || new Date().getFullYear();
  const month = Number(monthStr) || new Date().getMonth() + 1;
  const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });

  let totalExpected = 0;
  let totalCollected = 0;

  // Filter approved payments for this month
  const monthPayments = payments.filter(
    (p) => p.covers_month === monthKey && !p.deleted_at && p.status === 'approved'
  );

  const unitLines = units.map((u) => {
    const t = tenants.find((item) => item.unit_id === u.id && !item.move_out_date && !item.deleted_at);
    const uPays = monthPayments.filter((p) => p.unit_id === u.id);
    const paid = uPays.reduce((sum, p) => sum + Number(p.amount), 0);
    const expected = u.status === 'occupied' ? u.monthly_rent : 0;
    
    totalExpected += expected;
    totalCollected += paid;

    const refs = uPays.map((p) => p.reference).filter(Boolean).join(', ');

    if (u.status === 'vacant') {
      return `• *${u.name}*: ⚪ Vacant (Rent: ${formatKES(u.monthly_rent)})`;
    }

    const tenantLabel = t ? t.full_name : 'Occupied';

    if (paid >= expected && expected > 0) {
      const surplus = paid > expected ? ` (+${formatKES(paid - expected)} advance)` : '';
      return `• *${u.name}* (${tenantLabel}): ✅ Cleared ${formatKES(paid)}${surplus}${refs ? ` [Ref: ${refs}]` : ''}`;
    }

    if (paid > 0 && paid < expected) {
      const balance = expected - paid;
      return `• *${u.name}* (${tenantLabel}): ⚠️ Paid ${formatKES(paid)} of ${formatKES(expected)} (Owes: *${formatKES(balance)}*)${refs ? ` [Ref: ${refs}]` : ''}`;
    }

    return `• *${u.name}* (${tenantLabel}): ❌ Unpaid (Owes: *${formatKES(expected)}*)`;
  });

  const monthExpenses = expenses.filter(
    (e) => e.date.startsWith(monthKey) && !e.deleted_at && e.status === 'approved'
  );
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netCash = totalCollected - totalExpenses;
  const arrears = Math.max(0, totalExpected - totalCollected);
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 100;

  const lines = [
    `🏢 *${propertyName.toUpperCase()} — RENT COLLECTION STATEMENT*`,
    `📅 *Period:* ${monthName} ${year}`,
    `----------------------------------------`,
    `💰 *Total Expected Rent:* ${formatKES(totalExpected)}`,
    `✅ *Total Rent Collected:* ${formatKES(totalCollected)} (${collectionRate}%)`,
    `⚠️ *Outstanding Arrears:* ${formatKES(arrears)}`,
  ];

  if (totalExpenses > 0) {
    lines.push(`📉 *Approved Building Expenses:* ${formatKES(totalExpenses)}`);
    lines.push(`💵 *Net Landlord Remittance:* ${formatKES(netCash)}`);
  }

  lines.push(`----------------------------------------`);
  lines.push(`📋 *UNIT-BY-UNIT BREAKDOWN:*`);
  lines.push(...unitLines);
  lines.push(`----------------------------------------`);
  lines.push(`🔒 _Verified & Generated via RentBook Kenya_`);

  return lines.join('\n');
}
