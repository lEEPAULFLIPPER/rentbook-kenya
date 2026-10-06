-- =====================================================================
-- RENTBOOK KENYA — SEED DATA (Kilimani Heights Realistic Demo)
-- Target: Supabase SQL Editor
-- Run this after running schema.sql
-- =====================================================================

-- Clean up existing demo records if re-seeding
DELETE FROM public.audit_log WHERE record_id LIKE 'seed-%';
DELETE FROM public.expenses WHERE note LIKE '%[Demo]%';
DELETE FROM public.payments WHERE reference LIKE 'DEMO-%';
DELETE FROM public.properties WHERE name = 'Kilimani Heights';

-- 1. Create Profiles for the 3 Demo Users
-- Note: Replace these UUIDs or let Supabase auth create them.
-- In local demo mode, these IDs match the simulated auth credentials.
INSERT INTO public.profiles (id, full_name, phone, role, status, last_seen_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Admin (You)', '0700111222', 'admin', 'active', NOW()),
  ('a0000000-0000-0000-0000-000000000002', 'David Kimani (Landlord)', '0722334455', 'landlord', 'active', NOW() - INTERVAL '15 minutes'),
  ('a0000000-0000-0000-0000-000000000003', 'Jackson Omondi (Caretaker)', '0711998877', 'caretaker', 'active', NOW() - INTERVAL '2 minutes')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- 2. Create Property: Kilimani Heights
INSERT INTO public.properties (id, name, location, floors, units_per_floor, blocks, naming_scheme, owner_id, created_by)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'Kilimani Heights',
  'Argwings Kodhek Rd, Kilimani, Nairobi',
  3,
  4,
  '{}',
  'scheme1',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Property Access mappings
INSERT INTO public.property_access (user_id, property_id, role_at_property)
VALUES
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'landlord'),
  ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'caretaker')
ON CONFLICT (user_id, property_id) DO NOTHING;

-- 3. Create 12 Units (Scheme 1: A1..A4 Ground, B1..B4 1st, C1..C4 2nd)
INSERT INTO public.units (id, property_id, floor_number, name, monthly_rent, status, notes)
VALUES
  -- Ground Floor (Rent: KSh 18,000)
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 0, 'A1', 18000, 'occupied', 'Near gate'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 0, 'A2', 18000, 'occupied', 'Good water pressure'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 0, 'A3', 18000, 'occupied', 'Master bedroom balcony'),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 0, 'A4', 18000, 'vacant', 'Repainted, ready for tenant'),

  -- 1st Floor (Rent: KSh 20,000)
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 1, 'B1', 20000, 'occupied', 'Front facing'),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 1, 'B2', 20000, 'occupied', 'Spacious kitchen'),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 1, 'B3', 20000, 'vacant', 'Bathroom tiles repair pending'),
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 1, 'B4', 20000, 'occupied', 'Key with caretaker'),

  -- 2nd Floor (Rent: KSh 20,000)
  ('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 2, 'C1', 20000, 'occupied', 'Top floor corner'),
  ('c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 2, 'C2', 20000, 'occupied', 'Great natural lighting'),
  ('c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 2, 'C3', 20000, 'occupied', 'Quiet wing'),
  ('c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', 2, 'C4', 20000, 'vacant', 'Cleaning scheduled Wednesday')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, monthly_rent = EXCLUDED.monthly_rent;

-- 4. Create Active Tenants for the 9 Occupied Units
INSERT INTO public.tenants (id, unit_id, full_name, phone, id_number, move_in_date, deposit_paid, rent_due_day)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Peter Mwangi', '0722123456', '28472910', '2026-07-01', 18000, 5),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Grace Wanjiku', '0733456789', '31894022', '2026-07-01', 18000, 5),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'Brian Otieno', '0711987654', '29883411', '2026-06-01', 18000, 5), -- In Arrears!
  ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'Faith Chemutai', '0700445566', '33019284', '2026-08-01', 20000, 5),
  ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 'Kevin Mutua', '0744112233', '27993019', '2026-08-01', 20000, 5),
  ('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000008', 'Mercy Achieng', '0721778899', '32901844', '2026-07-15', 20000, 5),
  ('d0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000009', 'Dennis Kiprop', '0715332211', '30119283', '2026-06-01', 20000, 5),
  ('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000010', 'Catherine Nyambura', '0729887766', '31229048', '2026-08-01', 20000, 5),
  ('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', 'George Ochieng', '0712554433', '26771092', '2026-07-01', 20000, 5)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 5. Payments History (Approved payments + ONE PENDING CARETAKER PAYMENT)
INSERT INTO public.payments (
  id, unit_id, tenant_id, date, amount, method, reference, covers_month,
  note, status, recorded_by, approved_by, approved_at
)
VALUES
  -- 1) THE PENDING ENTRY — Recorded by caretaker Jackson, waiting for Admin/Landlord approval!
  (
    'e0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    CURRENT_DATE,
    18000,
    'M-Pesa',
    'DEMO-QKL892MN',
    '2026-10',
    'M-Pesa payment received by caretaker Jackson Omondi. Waiting approval.',
    'pending',
    'a0000000-0000-0000-0000-000000000003',
    NULL,
    NULL
  ),

  -- 2) Approved payments for other tenants
  (
    'e0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000002',
    CURRENT_DATE - INTERVAL '2 days',
    18000,
    'M-Pesa',
    'DEMO-QKC19293',
    '2026-10',
    'Full October rent via M-Pesa Paybill',
    'approved',
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '2 days'
  ),

  -- Brian Otieno (A3): Only paid KSh 14,000 for September, leaving KSh 4,000 balance + KSh 18,000 for October = KSh 22,000 ARREARS!
  (
    'e0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000003',
    CURRENT_DATE - INTERVAL '25 days',
    14000,
    'Cash',
    'DEMO-CSH-0912',
    '2026-09',
    'Partial payment for September. Promised to clear remaining 4,000 by 15th.',
    'approved',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '24 days'
  ),

  -- B1: Faith Chemutai (Paid)
  (
    'e0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000005',
    'd0000000-0000-0000-0000-000000000005',
    CURRENT_DATE - INTERVAL '3 days',
    20000,
    'Bank',
    'DEMO-EKB77102',
    '2026-10',
    'Equity Bank direct deposit',
    'approved',
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '3 days'
  ),

  -- B2: Kevin Mutua (Paid)
  (
    'e0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000006',
    'd0000000-0000-0000-0000-000000000006',
    CURRENT_DATE - INTERVAL '1 day',
    20000,
    'M-Pesa',
    'DEMO-QKD44921',
    '2026-10',
    'M-Pesa Till payment',
    'approved',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- 6. Property Expenses (Money Out)
INSERT INTO public.expenses (
  id, property_id, date, amount, category, payee, note, status, recorded_by, approved_by, approved_at
)
VALUES
  (
    'f0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '4 days',
    12500,
    'Caretaker salary',
    'Jackson Omondi',
    'Monthly caretaker salary for September [Demo]',
    'approved',
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '4 days'
  ),
  (
    'f0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '5 days',
    8200,
    'Water bill',
    'Nairobi City Water & Sewerage Co.',
    'Compound master meter bill [Demo]',
    'approved',
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '5 days'
  ),
  (
    'f0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '2 days',
    4500,
    'Repairs',
    'Fundi Moses Plumbing',
    'Repaired underground float switch on reserve tank [Demo]',
    'approved',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '2 days'
  ),
  (
    'f0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '1 day',
    6000,
    'Garbage',
    'CleanCity Waste Collectors',
    'October trash collection fee for 12 units [Demo]',
    'approved',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- 7. Seed Initial Audit Log Record
INSERT INTO public.audit_log (
  id, actor_id, actor_role, action, table_name, record_id, before_json, after_json, reason, device_info, created_at
)
VALUES (
  'g0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000003',
  'caretaker',
  'INSERT',
  'payments',
  'seed-e0000000-0000-0000-0000-000000000001',
  NULL,
  '{"amount": 18000, "unit": "A1", "tenant": "Peter Mwangi", "reference": "DEMO-QKL892MN", "status": "pending"}'::jsonb,
  'Logged M-Pesa payment on phone. Submitted for approval.',
  'Mozilla/5.0 (Android; Mobile)',
  NOW()
)
ON CONFLICT (id) DO NOTHING;
