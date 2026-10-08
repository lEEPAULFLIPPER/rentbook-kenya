# =====================================================================
# RENTBOOK KENYA — SQLITE DATABASE ENGINE
# High-performance, zero-dependency SQLite3 relational store
# Mirrors Supabase Postgres schema with ACID transactions & WAL mode
# =====================================================================

import os
import sqlite3
import json
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "rentbook.db")

def get_connection():
    con = sqlite3.connect(DB_FILE, timeout=10.0)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode = WAL;")
    con.execute("PRAGMA foreign_keys = ON;")
    return con

def init_db():
    con = get_connection()
    cur = con.cursor()

    cur.executescript("""
    CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'caretaker',
        status TEXT NOT NULL DEFAULT 'active',
        created_by TEXT,
        last_seen_at TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        floors INTEGER NOT NULL DEFAULT 1,
        units_per_floor INTEGER NOT NULL DEFAULT 4,
        blocks TEXT DEFAULT '[]',
        naming_scheme TEXT NOT NULL DEFAULT 'scheme1',
        owner_id TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS property_access (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        property_id TEXT NOT NULL,
        role_at_property TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, property_id),
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS units (
        id TEXT PRIMARY KEY,
        property_id TEXT NOT NULL,
        block_name TEXT,
        floor_number INTEGER NOT NULL DEFAULT 0,
        name TEXT NOT NULL,
        monthly_rent REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'vacant',
        notes TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        deleted_at TEXT,
        deleted_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
        FOREIGN KEY (deleted_by) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        unit_id TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        id_number TEXT,
        move_in_date TEXT NOT NULL DEFAULT (date('now')),
        move_out_date TEXT,
        deposit_paid REAL NOT NULL DEFAULT 0,
        rent_due_day INTEGER NOT NULL DEFAULT 5,
        version INTEGER NOT NULL DEFAULT 1,
        deleted_at TEXT,
        deleted_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
        FOREIGN KEY (deleted_by) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        unit_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        date TEXT NOT NULL DEFAULT (date('now')),
        amount REAL NOT NULL CHECK (amount > 0),
        method TEXT NOT NULL DEFAULT 'M-Pesa',
        reference TEXT NOT NULL,
        covers_month TEXT NOT NULL,
        note TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        recorded_by TEXT NOT NULL,
        recorder_name TEXT,
        approved_by TEXT,
        approved_at TEXT,
        reject_reason TEXT,
        receipt_url TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        deleted_at TEXT,
        deleted_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (recorded_by) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        property_id TEXT NOT NULL,
        date TEXT NOT NULL DEFAULT (date('now')),
        amount REAL NOT NULL CHECK (amount > 0),
        category TEXT NOT NULL DEFAULT 'Repairs',
        payee TEXT NOT NULL,
        note TEXT,
        status TEXT NOT NULL DEFAULT 'approved',
        recorded_by TEXT NOT NULL,
        recorder_name TEXT,
        approved_by TEXT,
        approved_at TEXT,
        reject_reason TEXT,
        receipt_url TEXT,
        deleted_at TEXT,
        deleted_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
        FOREIGN KEY (recorded_by) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        actor_id TEXT,
        actor_name TEXT,
        actor_role TEXT,
        action TEXT NOT NULL,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        before_json TEXT,
        after_json TEXT,
        reason TEXT,
        device_info TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
    );
    """)

    con.commit()

    # Check if we should seed default data
    cur.execute("SELECT COUNT(*) AS count FROM properties;")
    if cur.fetchone()["count"] == 0:
        seed_default_demo_data(con)

    con.close()

def seed_default_demo_data(con):
    cur = con.cursor()

    # Profiles
    profiles = [
        ('a0000000-0000-0000-0000-000000000001', 'Admin (Chromebook Master)', '0700111222', 'admin', 'active', '2026-06-01T08:00:00Z'),
        ('a0000000-0000-0000-0000-000000000002', 'David Kimani (Landlord)', '0722334455', 'landlord', 'active', '2026-06-01T08:00:00Z'),
        ('a0000000-0000-0000-0000-000000000003', 'Jackson Omondi (Caretaker)', '0711998877', 'caretaker', 'active', '2026-06-01T08:00:00Z'),
    ]
    cur.executemany("""
        INSERT OR IGNORE INTO profiles (id, full_name, phone, role, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?);
    """, profiles)

    # Property
    prop_id = 'b0000000-0000-0000-0000-000000000001'
    cur.execute("""
        INSERT OR IGNORE INTO properties (id, name, location, floors, units_per_floor, blocks, naming_scheme, owner_id, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (prop_id, 'Kilimani Heights', 'Argwings Kodhek Rd, Kilimani, Nairobi', 3, 4, '[]', 'scheme1',
          'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '2026-06-01T08:00:00Z'))

    # Units (Ground Floor A1..A4, 1st Floor B1..B4, 2nd Floor C1..C4)
    units_data = [
        ('c0000000-0000-0000-0000-000000000001', prop_id, 0, 'A1', 18000, 'occupied', 'Near entrance gate'),
        ('c0000000-0000-0000-0000-000000000002', prop_id, 0, 'A2', 18000, 'occupied', 'Water pressure great'),
        ('c0000000-0000-0000-0000-000000000003', prop_id, 0, 'A3', 18000, 'occupied', 'Master ensuite with balcony'),
        ('c0000000-0000-0000-0000-000000000004', prop_id, 0, 'A4', 18000, 'vacant', 'Repainted, ready for tenant viewing'),
        ('c0000000-0000-0000-0000-000000000005', prop_id, 1, 'B1', 20000, 'occupied', 'East facing'),
        ('c0000000-0000-0000-0000-000000000006', prop_id, 1, 'B2', 20000, 'occupied', 'Spacious kitchen'),
        ('c0000000-0000-0000-0000-000000000007', prop_id, 1, 'B3', 20000, 'vacant', 'Bathroom tiles repair pending'),
        ('c0000000-0000-0000-0000-000000000008', prop_id, 1, 'B4', 20000, 'occupied', 'Key with caretaker Jackson'),
        ('c0000000-0000-0000-0000-000000000009', prop_id, 2, 'C1', 20000, 'occupied', 'Top floor corner'),
        ('c0000000-0000-0000-0000-000000000010', prop_id, 2, 'C2', 20000, 'occupied', 'Natural lighting'),
        ('c0000000-0000-0000-0000-000000000011', prop_id, 2, 'C3', 20000, 'occupied', 'Quiet wing'),
        ('c0000000-0000-0000-0000-000000000012', prop_id, 2, 'C4', 20000, 'vacant', 'Cleaning scheduled Wednesday'),
    ]
    cur.executemany("""
        INSERT OR IGNORE INTO units (id, property_id, floor_number, name, monthly_rent, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    """, units_data)

    # Tenants
    tenants_data = [
        ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Peter Mwangi', '0722123456', '28472910', '2026-07-01', 18000, 5),
        ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Grace Wanjiku', '0733456789', '31894022', '2026-07-01', 18000, 5),
        ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'Brian Otieno', '0711987654', '29883411', '2026-06-01', 18000, 5),
        ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'Faith Chemutai', '0700445566', '33019284', '2026-08-01', 20000, 5),
        ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 'Kevin Mutua', '0744112233', '27993019', '2026-08-01', 20000, 5),
        ('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000008', 'Mercy Achieng', '0721778899', '32901844', '2026-07-15', 20000, 5),
        ('d0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000009', 'Dennis Kiprop', '0715332211', '30119283', '2026-06-01', 20000, 5),
        ('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000010', 'Catherine Nyambura', '0729887766', '31229048', '2026-08-01', 20000, 5),
        ('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', 'George Ochieng', '0712554433', '26771092', '2026-07-01', 20000, 5),
    ]
    cur.executemany("""
        INSERT OR IGNORE INTO tenants (id, unit_id, full_name, phone, id_number, move_in_date, deposit_paid, rent_due_day)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, tenants_data)

    # Payments
    payments_data = [
        ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
         '2026-10-06', 18000, 'M-Pesa', 'DEMO-QKL892MN', '2026-10', 'M-Pesa received on phone. Submitted for landlord approval.',
         'pending', 'a0000000-0000-0000-0000-000000000003', 'Jackson Omondi (Caretaker)', None, None),
        ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002',
         '2026-10-04', 18000, 'M-Pesa', 'DEMO-QKC19293', '2026-10', 'Full October rent via Paybill',
         'approved', 'a0000000-0000-0000-0000-000000000002', 'David Kimani (Landlord)', 'a0000000-0000-0000-0000-000000000002', '2026-10-04T10:00:00Z'),
        ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003',
         '2026-09-12', 14000, 'Cash', 'DEMO-CSH-0912', '2026-09', 'Partial cash collection. KSh 4,000 balance carried over.',
         'approved', 'a0000000-0000-0000-0000-000000000003', 'Jackson Omondi (Caretaker)', 'a0000000-0000-0000-0000-000000000002', '2026-09-13T09:00:00Z'),
        ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005',
         '2026-10-03', 20000, 'Bank', 'DEMO-EKB77102', '2026-10', 'Equity Bank transfer',
         'approved', 'a0000000-0000-0000-0000-000000000002', 'David Kimani (Landlord)', 'a0000000-0000-0000-0000-000000000002', '2026-10-03T14:30:00Z'),
        ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000006',
         '2026-10-05', 20000, 'M-Pesa', 'DEMO-QKD44921', '2026-10', 'M-Pesa Till payment',
         'approved', 'a0000000-0000-0000-0000-000000000003', 'Jackson Omondi (Caretaker)', 'a0000000-0000-0000-0000-000000000002', '2026-10-05T18:00:00Z'),
    ]
    cur.executemany("""
        INSERT OR IGNORE INTO payments (id, unit_id, tenant_id, date, amount, method, reference, covers_month, note, status, recorded_by, recorder_name, approved_by, approved_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, payments_data)

    # Expenses
    expenses_data = [
        ('f0000000-0000-0000-0000-000000000001', prop_id, '2026-10-02', 12500, 'Caretaker salary', 'Jackson Omondi', 'September caretaker salary', 'approved', 'a0000000-0000-0000-0000-000000000002', 'David Kimani (Landlord)'),
        ('f0000000-0000-0000-0000-000000000002', prop_id, '2026-10-01', 8200, 'Water bill', 'Nairobi City Water & Sewerage Co.', 'Compound master water meter', 'approved', 'a0000000-0000-0000-0000-000000000002', 'David Kimani (Landlord)'),
        ('f0000000-0000-0000-0000-000000000003', prop_id, '2026-10-04', 4500, 'Repairs', 'Fundi Moses Plumbing', 'Fixed reserve tank float switch', 'approved', 'a0000000-0000-0000-0000-000000000003', 'Jackson Omondi (Caretaker)'),
        ('f0000000-0000-0000-0000-000000000004', prop_id, '2026-10-05', 6000, 'Garbage', 'CleanCity Waste Collectors', 'October trash collection fee', 'approved', 'a0000000-0000-0000-0000-000000000003', 'Jackson Omondi (Caretaker)'),
    ]
    cur.executemany("""
        INSERT OR IGNORE INTO expenses (id, property_id, date, amount, category, payee, note, status, recorded_by, recorder_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, expenses_data)

    # Settings
    default_settings = {
        'caretaker_approval_required': True,
        'caretaker_edit_window_minutes': 120,
        'default_rent_due_day': 5,
        'currency_label': 'KSh',
        'landlord_can_invite_caretaker': True
    }
    cur.execute("""
        INSERT OR REPLACE INTO settings (key, value) VALUES ('app_settings', ?);
    """, (json.dumps(default_settings),))

    con.commit()

def compute_mockup_unit_name(fl, u_num, global_seq, scheme='scheme1', ground='G'):
    floor_letters = ['A', 'B', 'C', 'D', 'E', 'F', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T']

    if scheme == 'scheme2':
        # 100-series: Ground -> 1..9 or G1..G9, 1st -> 101..109, 2nd -> 201..209
        if fl == 0:
            if ground == 'G': return f"G{u_num}"
            elif ground == 'GF': return f"GF{u_num}"
            elif ground == 'Ground': return f"Ground {u_num}"
            else: return f"{u_num}"
        else:
            return f"{fl * 100 + u_num}"

    elif scheme == 'scheme3':
        # Pure Sequential: 1, 2, 3...
        return f"{global_seq}"

    elif scheme == 'scheme4':
        # Floor label + Unit Letter: GA..GI, 1A..1I, 2A..2I...
        u_letter = chr(64 + u_num) if u_num <= 26 else f"{u_num}"
        if fl == 0:
            fl_prefix = 'Ground ' if ground == 'Ground' else ('GF' if ground == 'GF' else ('A' if ground == 'Letter' else 'G'))
        else:
            fl_prefix = f"{fl}"
        return f"{fl_prefix}{u_letter}"

    elif scheme == 'scheme5':
        # Word prefix: House 1..N
        return f"House {global_seq}"

    else:
        # Default scheme1: Floor letters
        # Ground: G1..G9 (or A1..A9), 1st: A1..A9 (or B1..B9)
        if fl == 0:
            if ground == 'Letter':
                prefix = 'A'
            elif ground == 'Ground':
                prefix = 'Ground '
            elif ground == 'GF':
                prefix = 'GF'
            else:
                prefix = 'G'
        else:
            idx = fl if ground == 'Letter' else fl - 1
            prefix = floor_letters[idx % len(floor_letters)]
        return f"{prefix}{u_num}"

def seed_custom_mockup(client_name="James Kariuki", property_name="Parkview Apartments",
                       location="Ruaka, Kiambu Road", floors=3, units_per_floor=4, monthly_rent=22000,
                       naming_scheme="scheme1", ground_convention="G"):
    """Generates a complete, tailored mockup building for a client pitch with Kenyan naming format"""
    con = get_connection()
    cur = con.cursor()

    # Clear previous demo
    cur.execute("DELETE FROM payments;")
    cur.execute("DELETE FROM expenses;")
    cur.execute("DELETE FROM tenants;")
    cur.execute("DELETE FROM units;")
    cur.execute("DELETE FROM properties;")
    cur.execute("DELETE FROM audit_log;")

    # Insert client as landlord
    landlord_id = 'a0000000-0000-0000-0000-000000000002'
    cur.execute("""
        INSERT OR REPLACE INTO profiles (id, full_name, phone, role, status)
        VALUES (?, ?, '0722112233', 'landlord', 'active');
    """, (landlord_id, f"{client_name} (Landlord)"))

    caretaker_id = 'a0000000-0000-0000-0000-000000000003'
    cur.execute("""
        INSERT OR REPLACE INTO profiles (id, full_name, phone, role, status)
        VALUES (?, 'Samson Njoroge (Caretaker)', '0711554433', 'caretaker', 'active');
    """, (caretaker_id,))

    # Insert Property
    import uuid
    prop_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO properties (id, name, location, floors, units_per_floor, blocks, naming_scheme, owner_id, created_by)
        VALUES (?, ?, ?, ?, ?, '[]', ?, ?, ?);
    """, (prop_id, property_name, location, floors, units_per_floor, naming_scheme, landlord_id, landlord_id))

    # Dynamic pool of authentic Kenyan names
    first_names = [
        "Peter", "Mary", "Brian", "Faith", "John", "Esther", "Kevin", "Lilian",
        "Daniel", "Mercy", "Emmanuel", "Ruth", "Dennis", "Grace", "Samson",
        "Catherine", "George", "Beatrice", "Kennedy", "Sarah", "Paul", "Eunice",
        "David", "Lucy", "Victor", "Jane", "James", "Joyce", "Patrick", "Hellen",
        "Joseph", "Naomi", "Francis", "Alice", "Stephen", "Caroline", "Martin", "Rose"
    ]
    last_names = [
        "Kamau", "Wanjiku", "Omondi", "Chebet", "Mwangi", "Njeri", "Kiprono", "Atieno",
        "Mutua", "Wambui", "Kipchumba", "Achieng", "Kiprop", "Nyambura", "Ochieng",
        "Kariuki", "Kimani", "Wafula", "Odhiambo", "Cheruiyot", "Barasa", "Nekesa",
        "Muthoni", "Maina", "Kiptoo", "Koech", "Juma", "Hassan", "Ndungu", "Githinji",
        "Ouma", "Wairimu", "Njoroge", "Kibet", "Mogaka", "Wamalwa", "Otieno", "Makau"
    ]

    current_month = datetime.now().strftime("%Y-%m")
    
    tenant_idx = 0
    total_units_created = 0

    for fl in range(floors):
        for u_num in range(1, units_per_floor + 1):
            total_units_created += 1
            unit_id = str(uuid.uuid4())
            unit_name = compute_mockup_unit_name(fl, u_num, total_units_created, scheme=naming_scheme, ground=ground_convention)
            
            # ~85% occupancy: leave every 6th or 7th unit vacant
            is_occupied = (total_units_created % 6 != 0)
            status = 'occupied' if is_occupied else 'vacant'
            
            cur.execute("""
                INSERT INTO units (id, property_id, floor_number, name, monthly_rent, status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?);
            """, (unit_id, prop_id, fl, unit_name, monthly_rent, status, f"Floor {fl} unit"))

            if is_occupied:
                fname = first_names[tenant_idx % len(first_names)]
                lname = last_names[(tenant_idx * 3 + 1) % len(last_names)]
                tenant_name = f"{fname} {lname}"
                phone_num = f"07{20 + (tenant_idx % 70):02d}{100000 + (tenant_idx * 3421) % 900000}"
                id_num = f"{27000000 + (tenant_idx * 13245) % 9000000}"
                
                tenant_idx += 1
                tenant_id = str(uuid.uuid4())

                cur.execute("""
                    INSERT INTO tenants (id, unit_id, full_name, phone, id_number, move_in_date, deposit_paid, rent_due_day)
                    VALUES (?, ?, ?, ?, ?, '2026-06-01', ?, 5);
                """, (tenant_id, unit_id, tenant_name, phone_num, id_num, monthly_rent))

                # Payments: realistic mix of approved, pending caretaker, and partial with arrears
                if tenant_idx == 1:
                    # Paid full M-Pesa
                    cur.execute("""
                        INSERT INTO payments (id, unit_id, tenant_id, date, amount, method, reference, covers_month, note, status, recorded_by, recorder_name, approved_by, approved_at)
                        VALUES (?, ?, ?, date('now', '-2 days'), ?, 'M-Pesa', 'QKJ78291A', ?, 'Full payment via Paybill', 'approved', ?, 'David Kimani (Landlord)', ?, datetime('now'));
                    """, (str(uuid.uuid4()), unit_id, tenant_id, monthly_rent, current_month, landlord_id, landlord_id))
                elif tenant_idx == 2:
                    # Caretaker pending payment
                    cur.execute("""
                        INSERT INTO payments (id, unit_id, tenant_id, date, amount, method, reference, covers_month, note, status, recorded_by, recorder_name)
                        VALUES (?, ?, ?, date('now'), ?, 'M-Pesa', 'QKP90123M', ?, 'Caretaker collection via phone', 'pending', ?, 'Samson Njoroge (Caretaker)');
                    """, (str(uuid.uuid4()), unit_id, tenant_id, monthly_rent, current_month, caretaker_id))
                elif tenant_idx == 3:
                    # Partial payment (leaves arrears!)
                    cur.execute("""
                        INSERT INTO payments (id, unit_id, tenant_id, date, amount, method, reference, covers_month, note, status, recorded_by, recorder_name, approved_by, approved_at)
                        VALUES (?, ?, ?, date('now', '-5 days'), ?, 'Cash', 'CSH-0021', ?, 'Partial rent, promises balance by 15th', 'approved', ?, 'David Kimani (Landlord)', ?, datetime('now'));
                    """, (str(uuid.uuid4()), unit_id, tenant_id, max(1000, monthly_rent - 5000), current_month, landlord_id, landlord_id))
                elif tenant_idx % 2 == 0:
                    # Approved payment
                    ref_code = f"QKX{tenant_idx:02d}920"
                    cur.execute("""
                        INSERT INTO payments (id, unit_id, tenant_id, date, amount, method, reference, covers_month, note, status, recorded_by, recorder_name, approved_by, approved_at)
                        VALUES (?, ?, ?, date('now', '-3 days'), ?, 'M-Pesa', ?, ?, 'Rent paid via Till', 'approved', ?, 'David Kimani (Landlord)', ?, datetime('now'));
                    """, (str(uuid.uuid4()), unit_id, tenant_id, monthly_rent, ref_code, current_month, landlord_id, landlord_id))

    # Standard compound expenses
    cur.execute("""
        INSERT INTO expenses (id, property_id, date, amount, category, payee, note, status, recorded_by, recorder_name)
        VALUES (?, ?, date('now', '-4 days'), 15000, 'Caretaker salary', 'Samson Njoroge', 'Monthly caretaker allowance', 'approved', ?, 'Landlord');
    """, (str(uuid.uuid4()), prop_id, landlord_id))

    cur.execute("""
        INSERT INTO expenses (id, property_id, date, amount, category, payee, note, status, recorded_by, recorder_name)
        VALUES (?, ?, date('now', '-2 days'), 6500, 'Water bill', 'Nairobi Water', 'Master compound connection', 'approved', ?, 'Landlord');
    """, (str(uuid.uuid4()), prop_id, landlord_id))

    con.commit()
    con.close()
    return {"success": True, "property_id": prop_id, "property_name": property_name, "units_count": total_units_created}

def get_db_stats():
    con = get_connection()
    cur = con.cursor()

    stats = {
        "engine": "SQLite 3",
        "sqlite_version": sqlite3.sqlite_version,
        "database_file": DB_FILE,
        "file_size_bytes": os.path.getsize(DB_FILE) if os.path.exists(DB_FILE) else 0,
        "file_size_kb": round(os.path.getsize(DB_FILE) / 1024, 2) if os.path.exists(DB_FILE) else 0,
        "tables": {}
    }

    for table in ['properties', 'units', 'tenants', 'payments', 'expenses', 'audit_log']:
        cur.execute(f"SELECT COUNT(*) AS count FROM {table};")
        stats["tables"][table] = cur.fetchone()["count"]

    con.close()
    return stats

def export_sql():
    con = get_connection()
    sql_lines = []
    for line in con.iterdump():
        sql_lines.append(line)
    con.close()
    return "\n".join(sql_lines)
