export type UserRole = 'admin' | 'landlord' | 'caretaker';
export type UserStatus = 'invited' | 'active' | 'suspended';

export type PaymentMethod = 'M-Pesa' | 'Cash' | 'Bank' | 'Cheque';
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'void';

export type ExpenseCategory =
  | 'Repairs'
  | 'Water bill'
  | 'Electricity'
  | 'Caretaker salary'
  | 'Agent commission'
  | 'Garbage'
  | 'Security'
  | 'Rates'
  | 'Other';

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  created_by?: string;
  last_seen_at?: string;
  created_at?: string;
}

export interface Property {
  id: string;
  name: string; // e.g. "Kilimani Heights"
  location: string;
  floors: number;
  units_per_floor: number;
  blocks: string[]; // e.g. ["Block A", "Block B"]
  naming_scheme: string; // "scheme1", "scheme2", etc.
  owner_id?: string; // landlord profile ID
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PropertyAccess {
  id: string;
  user_id: string;
  property_id: string;
  role_at_property: UserRole;
  created_at?: string;
}

export interface Unit {
  id: string;
  property_id: string;
  block_name?: string;
  floor_number: number; // 0 = Ground, 1 = 1st, 2 = 2nd
  name: string; // e.g. "A3"
  monthly_rent: number; // KES
  status: 'occupied' | 'vacant';
  notes?: string;
  version: number;
  deleted_at?: string | null;
  deleted_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Tenant {
  id: string;
  unit_id: string;
  full_name: string;
  phone: string; // 07xx / 01xx
  id_number?: string;
  move_in_date: string; // YYYY-MM-DD
  move_out_date?: string | null;
  deposit_paid: number;
  rent_due_day: number; // default 5
  version: number;
  deleted_at?: string | null;
  deleted_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  unit_id: string;
  tenant_id: string;
  date: string; // YYYY-MM-DD
  amount: number; // KES
  method: PaymentMethod;
  reference: string; // M-Pesa code / receipt no.
  covers_month: string; // e.g. "2026-10"
  note?: string;
  status: PaymentStatus;
  recorded_by: string; // Profile ID
  recorder_name?: string;
  approved_by?: string | null;
  approved_at?: string | null;
  reject_reason?: string | null;
  receipt_url?: string | null;
  version: number;
  deleted_at?: string | null;
  deleted_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  property_id: string;
  date: string; // YYYY-MM-DD
  amount: number; // KES
  category: ExpenseCategory;
  payee: string;
  note?: string;
  status: PaymentStatus;
  recorded_by: string;
  recorder_name?: string;
  approved_by?: string | null;
  approved_at?: string | null;
  reject_reason?: string | null;
  receipt_url?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_name?: string;
  actor_role?: UserRole;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'VOID' | 'RESET';
  table_name: string;
  record_id: string;
  before_json?: Record<string, unknown> | null;
  after_json?: Record<string, unknown> | null;
  reason?: string;
  device_info?: string;
  created_at: string;
}

export interface AppSettings {
  caretaker_approval_required: boolean;
  caretaker_edit_window_minutes: number;
  default_rent_due_day: number;
  currency_label: string;
  landlord_can_invite_caretaker: boolean;
}

export type NamingSchemeType =
  | 'scheme1' // Block + Unit (Ground=A1..A4, First=B1..B4)
  | 'scheme2' // Floor prefix (G1 G2, F1 F2, S1 S2, T1 T2)
  | 'scheme3' // Simple sequential numbers (1, 2, 3...)
  | 'scheme4' // Floor number + letter (1A, 1B, 2A, 2B...)
  | 'scheme5' // House / Unit / Door prefix (House 1, House 2...)
  | 'scheme6'; // Custom pattern ({block}-{index}, etc.)

export interface NamingSchemeConfig {
  type: NamingSchemeType;
  prefixWord?: 'House' | 'Unit' | 'Door';
  customPattern?: string; // e.g. "{block}-{floor}{index}"
}

export interface CashBookEntry {
  id: string;
  date: string;
  type: 'in' | 'out';
  description: string;
  categoryOrMethod: string;
  reference: string;
  property_id: string;
  property_name?: string;
  unit_name?: string;
  tenant_name?: string;
  money_in: number;
  money_out: number;
  balance: number;
  status: PaymentStatus;
  recorded_by_name: string;
  recorded_by_role: UserRole;
  rawItem: Payment | Expense;
}

export interface TenantArrearsSummary {
  tenant: Tenant;
  unit: Unit;
  property?: Property;
  monthly_rent: number;
  total_billed: number;
  total_paid: number;
  balance: number; // >0 is owed, <0 is overpaid
  months_behind: number;
  oldest_unpaid_month: string;
  days_overdue: number;
  bucket: '0-30' | '31-60' | '61-90' | '90+';
  is_overdue: boolean;
}

export type ScreenType =
  | 'dashboard'
  | 'cashbook'
  | 'units'
  | 'unit-detail'
  | 'tenants'
  | 'debts'
  | 'reports'
  | 'team'
  | 'audit'
  | 'settings';
