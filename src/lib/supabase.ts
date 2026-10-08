// =====================================================================
// RENTBOOK KENYA — SUPABASE CLIENT & DUAL-MODE ENGINE
// Works with live Supabase cloud OR offline demo mode with seed data
// =====================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AppSettings,
  AuditLog,
  Expense,
  Payment,
  Profile,
  Property,
  PropertyAccess,
  Tenant,
  Unit,
} from '../types';

const STORAGE_URL_KEY = 'rentbook_supabase_url';
const STORAGE_ANON_KEY = 'rentbook_supabase_anon_key';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_URL_KEY) || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_ANON_KEY) || '' : '';

  return {
    url: storedUrl || envUrl,
    anonKey: storedKey || envKey,
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(STORAGE_URL_KEY, url.trim());
    else localStorage.removeItem(STORAGE_URL_KEY);

    if (anonKey) localStorage.setItem(STORAGE_ANON_KEY, anonKey.trim());
    else localStorage.removeItem(STORAGE_ANON_KEY);
  }
}

const creds = getSupabaseCredentials();

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('http'));
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(creds.url, creds.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// =====================================================================
// SEED INITIAL DEMO DATA (FOR STANDALONE & ZERO-CONFIGURATION MODE)
// =====================================================================

export const DEMO_PROFILES: Profile[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    full_name: 'System Administrator',
    phone: '0700111222',
    role: 'admin',
    status: 'active',
    last_seen_at: new Date().toISOString(),
    created_at: '2026-06-01T08:00:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    full_name: 'David Kimani (Landlord)',
    phone: '0722334455',
    role: 'landlord',
    status: 'active',
    last_seen_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    created_at: '2026-06-01T08:00:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    full_name: 'Jackson Omondi (Caretaker)',
    phone: '0711998877',
    role: 'caretaker',
    status: 'active',
    last_seen_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    created_at: '2026-06-01T08:00:00Z',
  },
];

export const DEMO_PROPERTY: Property = {
  id: 'b0000000-0000-0000-0000-000000000001',
  name: 'Kilimani Heights',
  location: 'Argwings Kodhek Rd, Kilimani, Nairobi',
  floors: 3,
  units_per_floor: 4,
  blocks: [],
  naming_scheme: 'scheme1',
  owner_id: 'a0000000-0000-0000-0000-000000000002',
  created_by: 'a0000000-0000-0000-0000-000000000001',
  created_at: '2026-06-01T08:00:00Z',
};

export const DEMO_PROPERTY_ACCESS: PropertyAccess[] = [
  {
    id: 'pa-1',
    user_id: 'a0000000-0000-0000-0000-000000000002',
    property_id: 'b0000000-0000-0000-0000-000000000001',
    role_at_property: 'landlord',
  },
  {
    id: 'pa-2',
    user_id: 'a0000000-0000-0000-0000-000000000003',
    property_id: 'b0000000-0000-0000-0000-000000000001',
    role_at_property: 'caretaker',
  },
];

export const DEMO_UNITS: Unit[] = [
  // Ground Floor (A1-A4) - Rent KSh 18,000
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    property_id: 'b0000000-0000-0000-0000-000000000001',
    floor_number: 0,
    name: 'A1',
    monthly_rent: 18000,
    status: 'occupied',
    notes: 'Near entrance gate',
    version: 1,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    property_id: 'b0000000-0000-0000-0000-000000000001',
    floor_number: 0,
    name: 'A2',
    monthly_rent: 18000,
    status: 'occupied',
    notes: 'Water pressure great',
    version: 1,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    property_id: 'b0000000-0000-0000-0000-000000000001',
    floor_number: 0,
    name: 'A3',
    monthly_rent: 18000,
    status: 'occupied',
    notes: 'Master ensuite with balcony',
    version: 1,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    property_id: 'b0000000-0000-0000-0000-000000000001',
    floor_number: 0,
    name: 'A4',
    monthly_rent: 18000,
    status: 'vacant',
    notes: 'Repainted, ready for tenant viewing',
    version: 1,
  },

  // 1st Floor (B1-B4) - Rent KSh 20,000
  {
    id: 'c0000000-0000-0000-0000-000000000005',
    property_id: 'b0000000-0000-0000-0000-000000000001',
    floor_number: 1,
    name: 'B1',
    monthly_rent: 20000,
    status: 'occupied',
    notes: 'East facing',
    version: 1,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000006',
    property_id: 'b0000000-0000-0000-0000-000000000001',
    floor_number: 1,
    name: 'B2',
    monthly_rent: 20000,
    status: 'occupied',
    notes: 'Spacious kitchen',
    version: 1,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000007',
    property_id: 'b0000000-0000-0000-0000-000000000001',
    floor_number: 1,
    name: 'B3',
    monthly_rent: 20000,
    status: 'vacant',
    notes: 'Bathroom tiles repair pending',
    version: 1,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000008',
    property_id: 'b0000000-0000-0000-0000-000000000001',
    floor_number: 1,
    name: 'B4',
    monthly_rent: 20000,
    status: 'occupied',
    notes: 'Key with caretaker Jackson',
    version: 1,
  },

  // 2nd Floor (C1-C4) - Rent KSh 20,000
  {
    id: 'c0000000-0000-0000-0000-000000000009',
    property_id: 'b0000000-0000-0000-0000-000000000001',
    floor_number: 2,
    name: 'C1',
    monthly_rent: 20000,
    status: 'occupied',
    notes: 'Top floor corner',
    version: 1,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000010',
    property_id: 'b0000000-0000-0000-0000-000000000001',
    floor_number: 2,
    name: 'C2',
    monthly_rent: 20000,
    status: 'occupied',
    notes: 'Natural lighting',
    version: 1,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000011',
    property_id: 'b0000000-0000-0000-0000-000000000001',
    floor_number: 2,
    name: 'C3',
    monthly_rent: 20000,
    status: 'occupied',
    notes: 'Quiet wing',
    version: 1,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000012',
    property_id: 'b0000000-0000-0000-0000-000000000001',
    floor_number: 2,
    name: 'C4',
    monthly_rent: 20000,
    status: 'vacant',
    notes: 'Cleaning scheduled Wednesday',
    version: 1,
  },
];

export const DEMO_TENANTS: Tenant[] = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    unit_id: 'c0000000-0000-0000-0000-000000000001',
    full_name: 'Peter Mwangi',
    phone: '0722123456',
    id_number: '28472910',
    move_in_date: '2026-07-01',
    deposit_paid: 18000,
    rent_due_day: 5,
    version: 1,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    unit_id: 'c0000000-0000-0000-0000-000000000002',
    full_name: 'Grace Wanjiku',
    phone: '0733456789',
    id_number: '31894022',
    move_in_date: '2026-07-01',
    deposit_paid: 18000,
    rent_due_day: 5,
    version: 1,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    unit_id: 'c0000000-0000-0000-0000-000000000003',
    full_name: 'Brian Otieno',
    phone: '0711987654',
    id_number: '29883411',
    move_in_date: '2026-06-01',
    deposit_paid: 18000,
    rent_due_day: 5,
    version: 1, // Owes KSh 22,000 in arrears!
  },
  {
    id: 'd0000000-0000-0000-0000-000000000005',
    unit_id: 'c0000000-0000-0000-0000-000000000005',
    full_name: 'Faith Chemutai',
    phone: '0700445566',
    id_number: '33019284',
    move_in_date: '2026-08-01',
    deposit_paid: 20000,
    rent_due_day: 5,
    version: 1,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000006',
    unit_id: 'c0000000-0000-0000-0000-000000000006',
    full_name: 'Kevin Mutua',
    phone: '0744112233',
    id_number: '27993019',
    move_in_date: '2026-08-01',
    deposit_paid: 20000,
    rent_due_day: 5,
    version: 1,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000008',
    unit_id: 'c0000000-0000-0000-0000-000000000008',
    full_name: 'Mercy Achieng',
    phone: '0721778899',
    id_number: '32901844',
    move_in_date: '2026-07-15',
    deposit_paid: 20000,
    rent_due_day: 5,
    version: 1,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000009',
    unit_id: 'c0000000-0000-0000-0000-000000000009',
    full_name: 'Dennis Kiprop',
    phone: '0715332211',
    id_number: '30119283',
    move_in_date: '2026-06-01',
    deposit_paid: 20000,
    rent_due_day: 5,
    version: 1,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000010',
    unit_id: 'c0000000-0000-0000-0000-000000000010',
    full_name: 'Catherine Nyambura',
    phone: '0729887766',
    id_number: '31229048',
    move_in_date: '2026-08-01',
    deposit_paid: 20000,
    rent_due_day: 5,
    version: 1,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000011',
    unit_id: 'c0000000-0000-0000-0000-000000000011',
    full_name: 'George Ochieng',
    phone: '0712554433',
    id_number: '26771092',
    move_in_date: '2026-07-01',
    deposit_paid: 20000,
    rent_due_day: 5,
    version: 1,
  },
];

export const DEMO_PAYMENTS: Payment[] = [
  // 1) PENDING CARETAKER ENTRY — Recorded on phone by Jackson Omondi, awaiting landlord/admin approval!
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    unit_id: 'c0000000-0000-0000-0000-000000000001',
    tenant_id: 'd0000000-0000-0000-0000-000000000001',
    date: '2026-10-06',
    amount: 18000,
    method: 'M-Pesa',
    reference: 'DEMO-QKL892MN',
    covers_month: '2026-10',
    note: 'M-Pesa received on phone. Submitted for landlord approval.',
    status: 'pending',
    recorded_by: 'a0000000-0000-0000-0000-000000000003',
    recorder_name: 'Jackson Omondi (Caretaker)',
    version: 1,
  },
  // 2) Approved payments
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    unit_id: 'c0000000-0000-0000-0000-000000000002',
    tenant_id: 'd0000000-0000-0000-0000-000000000002',
    date: '2026-10-04',
    amount: 18000,
    method: 'M-Pesa',
    reference: 'DEMO-QKC19293',
    covers_month: '2026-10',
    note: 'Full October rent via Paybill',
    status: 'approved',
    recorded_by: 'a0000000-0000-0000-0000-000000000002',
    recorder_name: 'David Kimani (Landlord)',
    approved_by: 'a0000000-0000-0000-0000-000000000002',
    approved_at: '2026-10-04T10:00:00Z',
    version: 1,
  },
  // 3) Brian Otieno partial payment (leaving KSh 22,000 arrears)
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    unit_id: 'c0000000-0000-0000-0000-000000000003',
    tenant_id: 'd0000000-0000-0000-0000-000000000003',
    date: '2026-09-12',
    amount: 14000,
    method: 'Cash',
    reference: 'DEMO-CSH-0912',
    covers_month: '2026-09',
    note: 'Partial cash collection. KSh 4,000 balance carried over.',
    status: 'approved',
    recorded_by: 'a0000000-0000-0000-0000-000000000003',
    recorder_name: 'Jackson Omondi (Caretaker)',
    approved_by: 'a0000000-0000-0000-0000-000000000002',
    approved_at: '2026-09-13T09:00:00Z',
    version: 1,
  },
  // 4) B1 Faith Chemutai
  {
    id: 'e0000000-0000-0000-0000-000000000004',
    unit_id: 'c0000000-0000-0000-0000-000000000005',
    tenant_id: 'd0000000-0000-0000-0000-000000000005',
    date: '2026-10-03',
    amount: 20000,
    method: 'Bank',
    reference: 'DEMO-EKB77102',
    covers_month: '2026-10',
    note: 'Equity Bank transfer',
    status: 'approved',
    recorded_by: 'a0000000-0000-0000-0000-000000000002',
    recorder_name: 'David Kimani (Landlord)',
    approved_by: 'a0000000-0000-0000-0000-000000000002',
    approved_at: '2026-10-03T14:30:00Z',
    version: 1,
  },
  // 5) B2 Kevin Mutua
  {
    id: 'e0000000-0000-0000-0000-000000000005',
    unit_id: 'c0000000-0000-0000-0000-000000000006',
    tenant_id: 'd0000000-0000-0000-0000-000000000006',
    date: '2026-10-05',
    amount: 20000,
    method: 'M-Pesa',
    reference: 'DEMO-QKD44921',
    covers_month: '2026-10',
    note: 'M-Pesa Till payment',
    status: 'approved',
    recorded_by: 'a0000000-0000-0000-0000-000000000003',
    recorder_name: 'Jackson Omondi (Caretaker)',
    approved_by: 'a0000000-0000-0000-0000-000000000002',
    approved_at: '2026-10-05T18:00:00Z',
    version: 1,
  },
];

export const DEMO_EXPENSES: Expense[] = [
  {
    id: 'f0000000-0000-0000-0000-000000000001',
    property_id: 'b0000000-0000-0000-0000-000000000001',
    date: '2026-10-02',
    amount: 12500,
    category: 'Caretaker salary',
    payee: 'Jackson Omondi',
    note: 'September caretaker salary',
    status: 'approved',
    recorded_by: 'a0000000-0000-0000-0000-000000000002',
    recorder_name: 'David Kimani (Landlord)',
    approved_by: 'a0000000-0000-0000-0000-000000000002',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000002',
    property_id: 'b0000000-0000-0000-0000-000000000001',
    date: '2026-10-01',
    amount: 8200,
    category: 'Water bill',
    payee: 'Nairobi City Water & Sewerage Co.',
    note: 'Compound master water meter',
    status: 'approved',
    recorded_by: 'a0000000-0000-0000-0000-000000000002',
    recorder_name: 'David Kimani (Landlord)',
    approved_by: 'a0000000-0000-0000-0000-000000000002',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000003',
    property_id: 'b0000000-0000-0000-0000-000000000001',
    date: '2026-10-04',
    amount: 4500,
    category: 'Repairs',
    payee: 'Fundi Moses Plumbing',
    note: 'Fixed reserve tank float switch',
    status: 'approved',
    recorded_by: 'a0000000-0000-0000-0000-000000000003',
    recorder_name: 'Jackson Omondi (Caretaker)',
    approved_by: 'a0000000-0000-0000-0000-000000000002',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000004',
    property_id: 'b0000000-0000-0000-0000-000000000001',
    date: '2026-10-05',
    amount: 6000,
    category: 'Garbage',
    payee: 'CleanCity Waste Collectors',
    note: 'October trash collection fee',
    status: 'approved',
    recorded_by: 'a0000000-0000-0000-0000-000000000003',
    recorder_name: 'Jackson Omondi (Caretaker)',
    approved_by: 'a0000000-0000-0000-0000-000000000002',
  },
];

export const DEMO_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'g0000000-0000-0000-0000-000000000001',
    actor_id: 'a0000000-0000-0000-0000-000000000003',
    actor_name: 'Jackson Omondi',
    actor_role: 'caretaker',
    action: 'INSERT',
    table_name: 'payments',
    record_id: 'e0000000-0000-0000-0000-000000000001',
    before_json: null,
    after_json: {
      amount: 18000,
      unit: 'A1',
      tenant: 'Peter Mwangi',
      reference: 'DEMO-QKL892MN',
      status: 'pending',
    },
    reason: 'Logged M-Pesa payment on phone. Sent for approval.',
    device_info: 'Chrome on Android Mobile',
    created_at: '2026-10-06T14:22:10Z',
  },
  {
    id: 'g0000000-0000-0000-0000-000000000002',
    actor_id: 'a0000000-0000-0000-0000-000000000002',
    actor_name: 'David Kimani',
    actor_role: 'landlord',
    action: 'APPROVE',
    table_name: 'payments',
    record_id: 'e0000000-0000-0000-0000-000000000005',
    before_json: { status: 'pending' },
    after_json: { status: 'approved' },
    reason: 'Verified against M-Pesa statement SMS.',
    device_info: 'Chrome on Android Phone',
    created_at: '2026-10-05T18:00:15Z',
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  caretaker_approval_required: true,
  caretaker_edit_window_minutes: 120,
  default_rent_due_day: 5,
  currency_label: 'KSh',
  landlord_can_invite_caretaker: true,
};
