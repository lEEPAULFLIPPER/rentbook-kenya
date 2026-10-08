// =====================================================================
// RENTBOOK KENYA — UNIFIED DATABASE SERVICE
// Bridges SQLite Backend (localhost:3001), Supabase Cloud, and IndexedDB
// =====================================================================

import { AuditLog, Expense, Payment, Property, Tenant, Unit } from '../types';
import { loadFullSnapshotFromIDB, saveFullSnapshotToIDB } from './indexedDb';

export interface SqliteDbStats {
  engine: string;
  sqlite_version: string;
  database_file: string;
  file_size_bytes: number;
  file_size_kb: number;
  tables: Record<string, number>;
  status: 'online' | 'offline';
}

export interface ClientMockupConfig {
  clientName: string;
  propertyName: string;
  location: string;
  floors: number;
  unitsPerFloor: number;
  monthlyRent: number;
  namingScheme?: string;
  groundConvention?: string;
}

const API_BASE = '/api';

export class DatabaseService {
  private static isSqliteAvailable: boolean | null = null;
  private static cachedStats: SqliteDbStats | null = null;

  /**
   * Ping the local SQLite database server
   */
  static async checkSqliteHealth(): Promise<SqliteDbStats | null> {
    try {
      const res = await fetch(`${API_BASE}/status`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(2000),
      });

      if (res.ok) {
        const stats: SqliteDbStats = await res.json();
        this.isSqliteAvailable = true;
        this.cachedStats = stats;
        return stats;
      }
    } catch {
      // Server not reachable
    }

    this.isSqliteAvailable = false;
    this.cachedStats = null;
    return null;
  }

  static get isLocalDbActive(): boolean {
    return Boolean(this.isSqliteAvailable);
  }

  static get lastStats(): SqliteDbStats | null {
    return this.cachedStats;
  }

  /**
   * Pull complete state from SQLite database
   */
  static async pullAllFromSqlite(): Promise<{
    properties: Property[];
    units: Unit[];
    tenants: Tenant[];
    payments: Payment[];
    expenses: Expense[];
    auditLogs: AuditLog[];
    settings?: any;
  } | null> {
    try {
      const res = await fetch(`${API_BASE}/sync/pull`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.properties) {
          // Also mirror in IndexedDB for instant offline access
          saveFullSnapshotToIDB(data);
          return data;
        }
      }
    } catch (err) {
      console.warn('Could not pull from SQLite API:', err);
    }
    return null;
  }

  /**
   * Push complete state to SQLite database
   */
  static async pushAllToSqlite(snapshot: {
    properties: Property[];
    units: Unit[];
    tenants: Tenant[];
    payments: Payment[];
    expenses: Expense[];
  }): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
        signal: AbortSignal.timeout(4000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Save or update an individual unit in SQLite
   */
  static async saveUnit(unit: Unit): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unit),
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Save an individual payment in SQLite
   */
  static async savePayment(payment: Payment): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment),
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Save an individual expense in SQLite
   */
  static async saveExpense(expense: Expense): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense),
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Soft-delete a record in SQLite
   */
  static async deleteRecord(table: 'payments' | 'expenses' | 'units' | 'tenants', id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/${table}/${id}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generate customized Client Mockup in SQLite
   */
  static async generateCustomMockup(config: ClientMockupConfig): Promise<{
    success: boolean;
    property_name?: string;
    units_count?: number;
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/mockup/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to contact mockup generator API' };
  }

  /**
   * Reset database back to default Kilimani Heights demo
   */
  static async resetDefaultDemo(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/mockup/reset-default`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(4000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
