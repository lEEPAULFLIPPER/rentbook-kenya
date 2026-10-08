#!/usr/bin/env python3
# =====================================================================
# RENTBOOK KENYA — SQLITE REST API SERVER
# High-speed local database server running on port 3001
# Zero external dependencies — pure Python 3 standard library
# =====================================================================

import json
import os
import re
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from urllib.parse import urlparse, parse_qs

# Add parent directory to sys.path so we can import server.db
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
import db

PORT = 3001

class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

class RentBookApiHandler(BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def send_json(self, data, status_code=200):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode("utf-8"))

    def send_error_json(self, message, status_code=400):
        self.send_json({"error": True, "message": str(message)}, status_code=status_code)

    def parse_body(self):
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length > 0:
            raw_data = self.rfile.read(content_length).decode("utf-8")
            try:
                return json.loads(raw_data)
            except Exception as e:
                return {}
        return {}

    def log_message(self, format, *args):
        # Concise logging
        sys.stderr.write(f"[RentBook DB] {self.command} {self.path} -> {args[1] if len(args) > 1 else ''}\n")

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")
        query = parse_qs(parsed.query)

        con = db.get_connection()
        cur = con.cursor()

        try:
            # 1. Server & DB Status
            if path == "/api/status" or path == "/api/health":
                stats = db.get_db_stats()
                stats["status"] = "online"
                return self.send_json(stats)

            # 2. Export SQL dump
            elif path == "/api/export/sql":
                sql_dump = db.export_sql()
                self.send_response(200)
                self.send_header("Content-Type", "application/sql")
                self.send_header("Content-Disposition", 'attachment; filename="rentbook-backup.sql"')
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(sql_dump.encode("utf-8"))
                return

            # 3. Full Sync Pull (all tables in one call)
            elif path == "/api/sync/pull":
                cur.execute("SELECT * FROM properties ORDER BY created_at DESC;")
                properties = [dict(r) for r in cur.fetchall()]

                cur.execute("SELECT * FROM units WHERE deleted_at IS NULL OR deleted_at = '' ORDER BY floor_number ASC, name ASC;")
                units = [dict(r) for r in cur.fetchall()]

                cur.execute("SELECT * FROM tenants WHERE deleted_at IS NULL OR deleted_at = '';")
                tenants = [dict(r) for r in cur.fetchall()]

                cur.execute("SELECT * FROM payments WHERE deleted_at IS NULL OR deleted_at = '' ORDER BY date DESC, created_at DESC;")
                payments = [dict(r) for r in cur.fetchall()]

                cur.execute("SELECT * FROM expenses WHERE deleted_at IS NULL OR deleted_at = '' ORDER BY date DESC, created_at DESC;")
                expenses = [dict(r) for r in cur.fetchall()]

                cur.execute("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100;")
                audit_logs = [dict(r) for r in cur.fetchall()]

                cur.execute("SELECT * FROM settings;")
                settings_rows = cur.fetchall()
                settings = {}
                for s in settings_rows:
                    try:
                        settings[s["key"]] = json.loads(s["value"])
                    except:
                        settings[s["key"]] = s["value"]

                return self.send_json({
                    "success": True,
                    "properties": properties,
                    "units": units,
                    "tenants": tenants,
                    "payments": payments,
                    "expenses": expenses,
                    "auditLogs": audit_logs,
                    "settings": settings.get("app_settings", {})
                })

            # 4. Properties
            elif path == "/api/properties":
                cur.execute("SELECT * FROM properties ORDER BY created_at DESC;")
                return self.send_json([dict(r) for r in cur.fetchall()])

            # 5. Units
            elif path == "/api/units":
                prop_id = query.get("property_id", [None])[0]
                if prop_id:
                    cur.execute("SELECT * FROM units WHERE property_id = ? ORDER BY floor_number ASC, name ASC;", (prop_id,))
                else:
                    cur.execute("SELECT * FROM units ORDER BY floor_number ASC, name ASC;")
                return self.send_json([dict(r) for r in cur.fetchall()])

            # 6. Tenants
            elif path == "/api/tenants":
                cur.execute("SELECT * FROM tenants WHERE deleted_at IS NULL OR deleted_at = '' ORDER BY full_name ASC;")
                return self.send_json([dict(r) for r in cur.fetchall()])

            # 7. Payments
            elif path == "/api/payments":
                unit_id = query.get("unit_id", [None])[0]
                if unit_id:
                    cur.execute("SELECT * FROM payments WHERE unit_id = ? AND (deleted_at IS NULL OR deleted_at = '') ORDER BY date DESC;", (unit_id,))
                else:
                    cur.execute("SELECT * FROM payments WHERE deleted_at IS NULL OR deleted_at = '' ORDER BY date DESC, created_at DESC;")
                return self.send_json([dict(r) for r in cur.fetchall()])

            # 8. Expenses
            elif path == "/api/expenses":
                cur.execute("SELECT * FROM expenses WHERE deleted_at IS NULL OR deleted_at = '' ORDER BY date DESC, created_at DESC;")
                return self.send_json([dict(r) for r in cur.fetchall()])

            # 9. Audit Logs
            elif path == "/api/audit-logs":
                cur.execute("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100;")
                return self.send_json([dict(r) for r in cur.fetchall()])

            # 10. Settings
            elif path == "/api/settings":
                cur.execute("SELECT value FROM settings WHERE key = 'app_settings';")
                row = cur.fetchone()
                val = json.loads(row["value"]) if row else {}
                return self.send_json(val)

            else:
                return self.send_error_json(f"Endpoint not found: {path}", status_code=404)

        except Exception as e:
            return self.send_error_json(str(e), status_code=500)
        finally:
            con.close()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")
        body = self.parse_body()

        con = db.get_connection()
        cur = con.cursor()

        try:
            # 1. Custom Client Mockup Generator
            if path == "/api/mockup/seed":
                client_name = body.get("clientName", "James Kariuki")
                property_name = body.get("propertyName", "Parkview Heights")
                location = body.get("location", "Ruaka, Kiambu Road")
                floors = int(body.get("floors", 3))
                units_per_floor = int(body.get("unitsPerFloor", 4))
                monthly_rent = float(body.get("monthlyRent", 22000))
                naming_scheme = body.get("namingScheme", "scheme1")
                ground_convention = body.get("groundConvention", "G")
                custom_units = body.get("customUnits")

                result = db.seed_custom_mockup(
                    client_name=client_name,
                    property_name=property_name,
                    location=location,
                    floors=floors,
                    units_per_floor=units_per_floor,
                    monthly_rent=monthly_rent,
                    naming_scheme=naming_scheme,
                    ground_convention=ground_convention,
                    custom_units=custom_units
                )
                return self.send_json(result)

            # 2. Reset / Restore Default Demo
            elif path == "/api/mockup/reset-default":
                cur.execute("DELETE FROM payments;")
                cur.execute("DELETE FROM expenses;")
                cur.execute("DELETE FROM tenants;")
                cur.execute("DELETE FROM units;")
                cur.execute("DELETE FROM properties;")
                cur.execute("DELETE FROM audit_log;")
                db.seed_default_demo_data(con)
                return self.send_json({"success": True, "message": "Restored default Kilimani Heights demo data."})

            # 3. Batch Push Sync (Frontend writes all records to SQLite)
            elif path == "/api/sync/push":
                if "properties" in body:
                    for p in body["properties"]:
                        cur.execute("""
                            INSERT OR REPLACE INTO properties (id, name, location, floors, units_per_floor, blocks, naming_scheme, owner_id, created_by)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                        """, (p["id"], p["name"], p["location"], p.get("floors", 1), p.get("units_per_floor", 4),
                              json.dumps(p.get("blocks", [])), p.get("naming_scheme", "scheme1"), p.get("owner_id"), p.get("created_by")))

                if "units" in body:
                    for u in body["units"]:
                        cur.execute("""
                            INSERT OR REPLACE INTO units (id, property_id, block_name, floor_number, name, monthly_rent, status, notes, version, deleted_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                        """, (u["id"], u["property_id"], u.get("block_name"), u.get("floor_number", 0), u["name"],
                              u.get("monthly_rent", 0), u.get("status", "vacant"), u.get("notes"), u.get("version", 1), u.get("deleted_at")))

                if "tenants" in body:
                    for t in body["tenants"]:
                        cur.execute("""
                            INSERT OR REPLACE INTO tenants (id, unit_id, full_name, phone, id_number, move_in_date, move_out_date, deposit_paid, rent_due_day, version, deleted_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                        """, (t["id"], t["unit_id"], t["full_name"], t["phone"], t.get("id_number"),
                              t.get("move_in_date"), t.get("move_out_date"), t.get("deposit_paid", 0),
                              t.get("rent_due_day", 5), t.get("version", 1), t.get("deleted_at")))

                if "payments" in body:
                    for pay in body["payments"]:
                        cur.execute("""
                            INSERT OR REPLACE INTO payments (id, unit_id, tenant_id, date, amount, method, reference, covers_month, note, status, recorded_by, recorder_name, approved_by, approved_at, reject_reason, version, deleted_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                        """, (pay["id"], pay["unit_id"], pay["tenant_id"], pay["date"], pay["amount"],
                              pay.get("method", "M-Pesa"), pay["reference"], pay["covers_month"], pay.get("note"),
                              pay.get("status", "approved"), pay.get("recorded_by", ""), pay.get("recorder_name"),
                              pay.get("approved_by"), pay.get("approved_at"), pay.get("reject_reason"), pay.get("version", 1), pay.get("deleted_at")))

                if "expenses" in body:
                    for exp in body["expenses"]:
                        cur.execute("""
                            INSERT OR REPLACE INTO expenses (id, property_id, date, amount, category, payee, note, status, recorded_by, recorder_name, approved_by, approved_at, reject_reason, deleted_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                        """, (exp["id"], exp["property_id"], exp["date"], exp["amount"], exp.get("category", "Repairs"),
                              exp.get("payee", ""), exp.get("note"), exp.get("status", "approved"),
                              exp.get("recorded_by", ""), exp.get("recorder_name"), exp.get("approved_by"), exp.get("approved_at"),
                              exp.get("reject_reason"), exp.get("deleted_at")))

                con.commit()
                return self.send_json({"success": True, "message": "Synced to SQLite successfully."})

            # 4. Insert Payment
            elif path == "/api/payments":
                cur.execute("""
                    INSERT INTO payments (id, unit_id, tenant_id, date, amount, method, reference, covers_month, note, status, recorded_by, recorder_name, approved_by, approved_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, (body["id"], body["unit_id"], body["tenant_id"], body["date"], body["amount"],
                      body.get("method", "M-Pesa"), body["reference"], body["covers_month"], body.get("note"),
                      body.get("status", "approved"), body.get("recorded_by", ""), body.get("recorder_name"),
                      body.get("approved_by"), body.get("approved_at")))
                con.commit()
                return self.send_json({"success": True, "id": body["id"]})

            # 5. Insert Expense
            elif path == "/api/expenses":
                cur.execute("""
                    INSERT INTO expenses (id, property_id, date, amount, category, payee, note, status, recorded_by, recorder_name, approved_by, approved_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, (body["id"], body["property_id"], body["date"], body["amount"], body.get("category", "Repairs"),
                      body["payee"], body.get("note"), body.get("status", "approved"),
                      body.get("recorded_by", ""), body.get("recorder_name"), body.get("approved_by"), body.get("approved_at")))
                con.commit()
                return self.send_json({"success": True, "id": body["id"]})

            # 6. Insert Unit
            elif path == "/api/units":
                cur.execute("""
                    INSERT INTO units (id, property_id, block_name, floor_number, name, monthly_rent, status, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                """, (body["id"], body["property_id"], body.get("block_name"), body.get("floor_number", 0),
                      body["name"], body.get("monthly_rent", 0), body.get("status", "vacant"), body.get("notes")))
                con.commit()
                return self.send_json({"success": True, "id": body["id"]})

            # 7. Insert Tenant
            elif path == "/api/tenants":
                cur.execute("""
                    INSERT INTO tenants (id, unit_id, full_name, phone, id_number, move_in_date, deposit_paid, rent_due_day)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                """, (body["id"], body["unit_id"], body["full_name"], body["phone"], body.get("id_number"),
                      body.get("move_in_date"), body.get("deposit_paid", 0), body.get("rent_due_day", 5)))
                # Update unit status to occupied
                cur.execute("UPDATE units SET status = 'occupied' WHERE id = ?;", (body["unit_id"],))
                con.commit()
                return self.send_json({"success": True, "id": body["id"]})

            # 8. Insert Audit Log
            elif path == "/api/audit-logs":
                cur.execute("""
                    INSERT INTO audit_log (id, actor_id, actor_name, actor_role, action, table_name, record_id, before_json, after_json, reason, device_info)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, (body["id"], body.get("actor_id"), body.get("actor_name"), body.get("actor_role"),
                      body["action"], body["table_name"], body["record_id"],
                      json.dumps(body.get("before_json")), json.dumps(body.get("after_json")),
                      body.get("reason"), body.get("device_info")))
                con.commit()
                return self.send_json({"success": True, "id": body["id"]})

            # 9. Update Settings
            elif path == "/api/settings":
                cur.execute("""
                    INSERT OR REPLACE INTO settings (key, value) VALUES ('app_settings', ?);
                """, (json.dumps(body),))
                con.commit()
                return self.send_json({"success": True})

            else:
                return self.send_error_json(f"Cannot POST to {path}", status_code=404)

        except Exception as e:
            con.rollback()
            return self.send_error_json(str(e), status_code=500)
        finally:
            con.close()

    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")
        body = self.parse_body()

        con = db.get_connection()
        cur = con.cursor()

        try:
            # Match /api/<resource>/<id>
            m = re.match(r"^/api/([a-zA-Z_-]+)/([a-zA-Z0-9_-]+)$", path)
            if not m:
                return self.send_error_json(f"Cannot PUT to {path}", status_code=404)

            resource, rec_id = m.group(1), m.group(2)

            if resource == "units":
                cur.execute("""
                    UPDATE units
                    SET name = coalesce(?, name),
                        monthly_rent = coalesce(?, monthly_rent),
                        status = coalesce(?, status),
                        notes = coalesce(?, notes),
                        updated_at = datetime('now')
                    WHERE id = ?;
                """, (body.get("name"), body.get("monthly_rent"), body.get("status"), body.get("notes"), rec_id))
                con.commit()
                return self.send_json({"success": True})

            elif resource == "payments":
                cur.execute("""
                    UPDATE payments
                    SET status = coalesce(?, status),
                        approved_by = coalesce(?, approved_by),
                        approved_at = coalesce(?, approved_at),
                        reject_reason = coalesce(?, reject_reason),
                        deleted_at = coalesce(?, deleted_at),
                        updated_at = datetime('now')
                    WHERE id = ?;
                """, (body.get("status"), body.get("approved_by"), body.get("approved_at"),
                      body.get("reject_reason"), body.get("deleted_at"), rec_id))
                con.commit()
                return self.send_json({"success": True})

            elif resource == "expenses":
                cur.execute("""
                    UPDATE expenses
                    SET status = coalesce(?, status),
                        approved_by = coalesce(?, approved_by),
                        approved_at = coalesce(?, approved_at),
                        reject_reason = coalesce(?, reject_reason),
                        deleted_at = coalesce(?, deleted_at),
                        updated_at = datetime('now')
                    WHERE id = ?;
                """, (body.get("status"), body.get("approved_by"), body.get("approved_at"),
                      body.get("reject_reason"), body.get("deleted_at"), rec_id))
                con.commit()
                return self.send_json({"success": True})

            elif resource == "tenants":
                cur.execute("""
                    UPDATE tenants
                    SET full_name = coalesce(?, full_name),
                        phone = coalesce(?, phone),
                        move_out_date = coalesce(?, move_out_date),
                        deleted_at = coalesce(?, deleted_at),
                        updated_at = datetime('now')
                    WHERE id = ?;
                """, (body.get("full_name"), body.get("phone"), body.get("move_out_date"), body.get("deleted_at"), rec_id))
                con.commit()
                return self.send_json({"success": True})

            else:
                return self.send_error_json(f"Resource {resource} not editable via PUT", status_code=400)

        except Exception as e:
            con.rollback()
            return self.send_error_json(str(e), status_code=500)
        finally:
            con.close()

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")

        con = db.get_connection()
        cur = con.cursor()

        try:
            m = re.match(r"^/api/([a-zA-Z_-]+)/([a-zA-Z0-9_-]+)$", path)
            if not m:
                return self.send_error_json(f"Cannot DELETE {path}", status_code=404)

            resource, rec_id = m.group(1), m.group(2)

            if resource in ["payments", "expenses", "units", "tenants"]:
                # Soft delete
                cur.execute(f"UPDATE {resource} SET deleted_at = datetime('now') WHERE id = ?;", (rec_id,))
                con.commit()
                return self.send_json({"success": True, "deleted": rec_id})
            elif resource == "properties":
                cur.execute("DELETE FROM properties WHERE id = ?;", (rec_id,))
                con.commit()
                return self.send_json({"success": True, "deleted": rec_id})
            else:
                return self.send_error_json(f"Cannot delete from {resource}", status_code=400)

        except Exception as e:
            con.rollback()
            return self.send_error_json(str(e), status_code=500)
        finally:
            con.close()

def run_server(port=PORT):
    db.init_db()
    server_address = ("127.0.0.1", port)
    httpd = ThreadingHTTPServer(server_address, RentBookApiHandler)
    print(f"======================================================")
    print(f"  RentBook Kenya SQLite Database Server Active 🚀")
    print(f"  Listening on: http://127.0.0.1:{port}")
    print(f"  Database File: {db.DB_FILE}")
    print(f"======================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down database server...")
        httpd.server_close()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    run_server(port)
