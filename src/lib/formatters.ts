// =====================================================================
// RENTBOOK KENYA — FORMATTERS & LOCALIZATION UTILITIES
// Standard: KES "KSh 12,000", Dates DD/MM/YYYY, Swahili/English SMS
// =====================================================================

/**
 * Format currency as "KSh 12,000" (no decimals, commas for thousands)
 */
export function formatKES(amount: number | null | undefined, label = 'KSh'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${label} 0`;
  }
  const rounded = Math.round(amount);
  return `${label} ${rounded.toLocaleString('en-KE')}`;
}

/**
 * Format dates as DD/MM/YYYY (e.g. 06/10/2026)
 */
export function formatDateKE(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Format month key "2026-10" as "October 2026"
 */
export function formatMonthName(monthStr: string | null | undefined): string {
  if (!monthStr) return '—';
  const parts = monthStr.split('-');
  if (parts.length < 2) return monthStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
}

/**
 * Get current month string in format YYYY-MM (e.g. "2026-10")
 */
export function getCurrentMonthKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get previous month string in format YYYY-MM (e.g. given "2026-10" -> "2026-09")
 */
export function getPreviousMonthKey(monthKey?: string): string {
  const current = monthKey || getCurrentMonthKey();
  const parts = current.split('-');
  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10) - 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Clean and format Kenyan phone numbers for tel: and sms:
 */
export function formatPhoneKE(phone: string | null | undefined): string {
  if (!phone) return '';
  const clean = phone.replace(/[^\d+]/g, '');
  if (clean.startsWith('0')) {
    return '+254' + clean.slice(1);
  }
  if (clean.startsWith('254')) {
    return '+' + clean;
  }
  return clean;
}

/**
 * Generate pre-filled polite rent reminders in Swahili and English
 */
export function generateRentSMS(
  lang: 'sw' | 'en',
  unitName: string,
  amount: number,
  tenantName?: string
): string {
  const formattedAmount = formatKES(amount);
  if (lang === 'sw') {
    return `Habari${tenantName ? ' ' + tenantName : ''}, kumbusho la kodi ya nyumba ${unitName} ni ${formattedAmount}. Asante.`;
  }
  return `Hello${tenantName ? ' ' + tenantName : ''}, polite reminder that rent for house ${unitName} is ${formattedAmount}. Thank you.`;
}

/**
 * Create SMS link href with body prefilled for mobile phones
 */
export function createSmsHref(phone: string, message: string): string {
  const formattedPhone = formatPhoneKE(phone);
  return `sms:${formattedPhone}?body=${encodeURIComponent(message)}`;
}

/**
 * Create WhatsApp chat link with prefilled text (Kenyan wa.me)
 */
export function createWhatsAppHref(phone: string, message: string): string {
  const formattedPhone = formatPhoneKE(phone).replace(/^\+/, '');
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
