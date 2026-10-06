-- =====================================================================
-- RENTBOOK KENYA — PRODUCTION POSTGRES DATABASE SCHEMA & RLS POLICIES
-- Target: Supabase (PostgreSQL 15+)
-- Run this directly in the Supabase SQL Editor (Chromebook Browser friendly)
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'landlord', 'caretaker');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('invited', 'active', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE unit_status AS ENUM ('occupied', 'vacant');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('M-Pesa', 'Cash', 'Bank', 'Cheque');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected', 'void');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM (
    'Repairs', 'Water bill', 'Electricity', 'Caretaker salary',
    'Agent commission', 'Garbage', 'Security', 'Rates', 'Other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'caretaker',
  status user_status NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  floors INTEGER NOT NULL DEFAULT 1,
  units_per_floor INTEGER NOT NULL DEFAULT 4,
  blocks TEXT[] DEFAULT '{}',
  naming_scheme TEXT NOT NULL DEFAULT 'scheme1',
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PROPERTY ACCESS (Scope table for Landlords & Caretakers)
CREATE TABLE IF NOT EXISTS public.property_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  role_at_property user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- 6. UNITS / HOUSES TABLE
CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  block_name TEXT,
  floor_number INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  monthly_rent NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status unit_status NOT NULL DEFAULT 'vacant',
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TENANTS TABLE
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_number TEXT,
  move_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  move_out_date DATE,
  deposit_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  rent_due_day INTEGER NOT NULL DEFAULT 5,
  version INTEGER NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PAYMENTS (Money In)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  method payment_method NOT NULL DEFAULT 'M-Pesa',
  reference TEXT NOT NULL,
  covers_month TEXT NOT NULL, -- e.g. '2026-10'
  note TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  recorded_by UUID NOT NULL REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  reject_reason TEXT,
  receipt_url TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. EXPENSES (Money Out)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category expense_category NOT NULL DEFAULT 'Repairs',
  payee TEXT NOT NULL,
  note TEXT,
  status payment_status NOT NULL DEFAULT 'approved',
  recorded_by UUID NOT NULL REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  reject_reason TEXT,
  receipt_url TEXT,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AUDIT LOG (Strictly Append-Only)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id),
  actor_role user_role,
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'VOID'
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  before_json JSONB,
  after_json JSONB,
  reason TEXT,
  device_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. APP SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Initialize default app settings
INSERT INTO public.settings (key, value) VALUES
  ('caretaker_approval_required', 'true'::jsonb),
  ('caretaker_edit_window_minutes', '120'::jsonb),
  ('default_rent_due_day', '5'::jsonb),
  ('currency_label', '"KSh"'::jsonb),
  ('landlord_can_invite_caretaker', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 12. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_properties_owner ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_property_access_user ON public.property_access(user_id);
CREATE INDEX IF NOT EXISTS idx_property_access_prop ON public.property_access(property_id);
CREATE INDEX IF NOT EXISTS idx_units_property ON public.units(property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_unit ON public.tenants(unit_id);
CREATE INDEX IF NOT EXISTS idx_payments_unit ON public.payments(unit_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(date);
CREATE INDEX IF NOT EXISTS idx_payments_month ON public.payments(covers_month);
CREATE INDEX IF NOT EXISTS idx_expenses_property ON public.expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_log(created_at DESC);

-- =====================================================================
-- HELPER FUNCTIONS FOR ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Helper: Get current user's global role
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: Is user an Admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: Can user access property? (Admin has all, Landlord/Caretaker via property_access or owner_id)
CREATE OR REPLACE FUNCTION public.can_access_property(prop_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.status = 'active' AND (
      p.role = 'admin' OR
      EXISTS (SELECT 1 FROM public.properties pr WHERE pr.id = prop_id AND pr.owner_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM public.property_access pa WHERE pa.user_id = auth.uid() AND pa.property_id = prop_id)
    )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =====================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- RLS POLICIES: PROFILES
-- ---------------------------------------------------------------------
CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can read profiles of people in their property scope"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.property_access pa1
      JOIN public.property_access pa2 ON pa1.property_id = pa2.property_id
      WHERE pa1.user_id = auth.uid() AND pa2.user_id = profiles.id
    )
  );

CREATE POLICY "Users can update their own profile basic info"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- ---------------------------------------------------------------------
-- RLS POLICIES: PROPERTIES
-- ---------------------------------------------------------------------
CREATE POLICY "Admins full access on properties"
  ON public.properties FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Landlords can view, insert, update their own properties"
  ON public.properties FOR SELECT
  TO authenticated
  USING (public.can_access_property(id));

CREATE POLICY "Landlords can insert properties"
  ON public.properties FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'landlord'
  );

CREATE POLICY "Landlords can update their properties"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (
    public.is_admin() OR
    owner_id = auth.uid()
  );

-- ---------------------------------------------------------------------
-- RLS POLICIES: UNITS
-- ---------------------------------------------------------------------
CREATE POLICY "View units if property accessible"
  ON public.units FOR SELECT
  TO authenticated
  USING (public.can_access_property(property_id));

CREATE POLICY "Admin & Landlord can insert/update units"
  ON public.units FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND owner_id = auth.uid())
  );

CREATE POLICY "Admin & Landlord can update units; Caretaker can update status only"
  ON public.units FOR UPDATE
  TO authenticated
  USING (public.can_access_property(property_id));

CREATE POLICY "Admin & Landlord can delete units"
  ON public.units FOR DELETE
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- RLS POLICIES: TENANTS
-- ---------------------------------------------------------------------
CREATE POLICY "View tenants if unit accessible"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.units u WHERE u.id = unit_id AND public.can_access_property(u.property_id))
  );

CREATE POLICY "Admin & Landlord & Caretaker can insert tenants"
  ON public.tenants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.units u WHERE u.id = unit_id AND public.can_access_property(u.property_id))
  );

CREATE POLICY "Admin & Landlord can update full tenant; Caretaker update move_out"
  ON public.tenants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.units u WHERE u.id = unit_id AND public.can_access_property(u.property_id))
  );

-- ---------------------------------------------------------------------
-- RLS POLICIES: PAYMENTS
-- ---------------------------------------------------------------------
CREATE POLICY "View payments if unit accessible"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.units u WHERE u.id = unit_id AND public.can_access_property(u.property_id))
  );

CREATE POLICY "Insert payments if unit accessible"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    recorded_by = auth.uid() AND
    EXISTS (SELECT 1 FROM public.units u WHERE u.id = unit_id AND public.can_access_property(u.property_id))
  );

CREATE POLICY "Update payments (Admin & Landlord can approve/reject/edit; Caretaker can edit within 2 hours if pending)"
  ON public.payments FOR UPDATE
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.units u
      JOIN public.properties p ON p.id = u.property_id
      WHERE u.id = unit_id AND p.owner_id = auth.uid()
    ) OR
    (
      recorded_by = auth.uid() AND
      status = 'pending' AND
      created_at >= NOW() - INTERVAL '2 hours'
    )
  );

CREATE POLICY "Delete payments (Admin & Landlord only; Caretakers CAN NEVER delete)"
  ON public.payments FOR DELETE
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.units u
      JOIN public.properties p ON p.id = u.property_id
      WHERE u.id = unit_id AND p.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- RLS POLICIES: EXPENSES
-- ---------------------------------------------------------------------
CREATE POLICY "View expenses if property accessible"
  ON public.expenses FOR SELECT
  TO authenticated
  USING (public.can_access_property(property_id));

CREATE POLICY "Insert expenses if property accessible"
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    recorded_by = auth.uid() AND
    public.can_access_property(property_id)
  );

CREATE POLICY "Update expenses (Admin/Landlord or Caretaker within window)"
  ON public.expenses FOR UPDATE
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND owner_id = auth.uid()) OR
    (recorded_by = auth.uid() AND created_at >= NOW() - INTERVAL '2 hours')
  );

CREATE POLICY "Delete expenses (Admin & Landlord only)"
  ON public.expenses FOR DELETE
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- RLS POLICIES: AUDIT LOG (Strictly Append-Only)
-- ---------------------------------------------------------------------
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Any authenticated user can insert audit log records"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- NO UPDATE OR DELETE POLICIES ON AUDIT LOG (Append-only guarantee)

-- ---------------------------------------------------------------------
-- RLS POLICIES: SETTINGS
-- ---------------------------------------------------------------------
CREATE POLICY "Anyone authenticated can view settings"
  ON public.settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can update settings"
  ON public.settings FOR ALL
  TO authenticated
  USING (public.is_admin());

-- =====================================================================
-- REALTIME PUBLICATION ENABLEMENT
-- =====================================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE
    public.profiles,
    public.properties,
    public.property_access,
    public.units,
    public.tenants,
    public.payments,
    public.expenses,
    public.audit_log,
    public.settings;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 13. STORAGE BUCKET FOR RECEIPTS
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone authenticated can upload receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Anyone can view receipt photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'receipts');
