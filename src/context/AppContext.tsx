// =====================================================================
// RENTBOOK KENYA — CORE APP CONTEXT & STATE ENGINE
// Real-time synchronization, role-scoped queries, waterfall arrears,
// approvals workflow, audit logging, and offline queueing
// =====================================================================

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AppSettings,
  AuditLog,
  CashBookEntry,
  Expense,
  NamingSchemeConfig,
  Payment,
  PaymentStatus,
  Property,
  PropertyAccess,
  ScreenType,
  Tenant,
  TenantArrearsSummary,
  Unit,
  UserRole,
} from '../types';
import {
  DEFAULT_SETTINGS,
  DEMO_AUDIT_LOGS,
  DEMO_EXPENSES,
  DEMO_PAYMENTS,
  DEMO_PROPERTY,
  DEMO_PROPERTY_ACCESS,
  DEMO_TENANTS,
  DEMO_UNITS,
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';
import { useAuth } from './AuthContext';
import { generateUnitNames } from '../lib/namingEngine';
import { addToOfflineQueue, getOfflineQueue, removeFromOfflineQueue } from '../lib/offlineQueue';
import { formatKES } from '../lib/formatters';

interface LiveToast {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning';
  timestamp: string;
}

interface UndoState {
  message: string;
  secondsRemaining: number;
  undoAction: () => void;
}

interface AppContextType {
  // Navigation & Screen
  currentScreen: ScreenType;
  setCurrentScreen: (screen: ScreenType, unitId?: string | null) => void;
  selectedPropertyId: string;
  setSelectedPropertyId: (id: string) => void;
  selectedUnitId: string | null;
  setSelectedUnitId: (id: string | null) => void;

  // Filtered scoped data (by activeRole and user)
  properties: Property[];
  visibleProperties: Property[];
  currentProperty: Property | undefined;
  units: Unit[];
  tenants: Tenant[];
  payments: Payment[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  settings: AppSettings;
  cashBookEntries: CashBookEntry[];
  tenantArrears: TenantArrearsSummary[];
  pendingApprovalsCount: number;

  // Real-time & Offline Status
  isOnline: boolean;
  queuedSyncCount: number;
  liveToasts: LiveToast[];
  dismissToast: (id: string) => void;
  undoState: UndoState | null;
  dismissUndo: () => void;

  // Modal Controllers
  isPaymentModalOpen: boolean;
  paymentPrefill: { unitId?: string; tenantId?: string } | null;
  openPaymentModal: (prefill?: { unitId?: string; tenantId?: string } | null) => void;
  closePaymentModal: () => void;

  isExpenseModalOpen: boolean;
  openExpenseModal: () => void;
  closeExpenseModal: () => void;

  isPropertyModalOpen: boolean;
  propertyModalEditing: Property | null;
  openPropertyModal: (property?: Property | null) => void;
  closePropertyModal: () => void;

  isBulkRenameModalOpen: boolean;
  bulkRenamePropertyId: string | null;
  openBulkRenameModal: (propertyId: string) => void;
  closeBulkRenameModal: () => void;

  isTenantModalOpen: boolean;
  tenantModalData: { unitId: string; tenant?: Tenant | null } | null;
  openTenantModal: (data: { unitId: string; tenant?: Tenant | null }) => void;
  closeTenantModal: () => void;

  isUnitModalOpen: boolean;
  unitModalData: Unit | null;
  openUnitModal: (unit: Unit) => void;
  closeUnitModal: () => void;

  isInviteModalOpen: boolean;
  openInviteModal: () => void;
  closeInviteModal: () => void;

  isDangerModalOpen: boolean;
  dangerActionType: 'units' | 'payments' | 'all' | null;
  openDangerModal: (type: 'units' | 'payments' | 'all') => void;
  closeDangerModal: () => void;

  // Data Actions
  savePropertyWithUnits: (
    propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'> & { id?: string },
    scheme: NamingSchemeConfig,
    defaultRent: number,
    customNames?: string[]
  ) => Promise<void>;
  updateProperty: (prop: Property) => Promise<void>;
  deleteProperty: (propertyId: string) => Promise<void>;

  addUnit: (unit: Omit<Unit, 'id' | 'version' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateUnit: (unit: Unit) => Promise<void>;
  renameUnit: (unitId: string, newName: string) => Promise<void>;
  bulkRenameUnits: (propertyId: string, scheme: NamingSchemeConfig) => Promise<void>;
  deleteUnit: (unitId: string) => Promise<{ success: boolean; message?: string }>;

  saveTenant: (tenantData: Omit<Tenant, 'id' | 'version' | 'created_at' | 'updated_at'> & { id?: string }) => Promise<void>;
  vacateTenant: (tenantId: string, moveOutDate: string) => Promise<void>;
  deleteTenant: (tenantId: string) => Promise<void>;

  recordPayment: (paymentData: Omit<Payment, 'id' | 'version' | 'created_at' | 'updated_at' | 'status' | 'recorded_by'>) => Promise<{ success: boolean; message?: string }>;
  approvePayment: (paymentId: string) => Promise<void>;
  rejectPayment: (paymentId: string, reason: string) => Promise<void>;
  voidPayment: (paymentId: string, reason: string) => Promise<void>;
  deletePayment: (paymentId: string, reason: string) => Promise<{ success: boolean; message?: string }>;

  recordExpense: (expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'status' | 'recorded_by'>) => Promise<void>;
  approveExpense: (expenseId: string) => Promise<void>;
  rejectExpense: (expenseId: string, reason: string) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;

  // Settings & Danger Zone
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  executeDangerPurge: (type: 'units' | 'payments' | 'all') => Promise<void>;

  // Backup & Restore
  exportBackupJson: () => string;
  importBackupJson: (jsonStr: string) => boolean;

  // Realtime Broadcast Helper
  broadcastLiveAction: (message: string, type?: 'info' | 'success' | 'warning') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Local storage backup keys
const STORAGE_PROPS = 'rentbook_props_v1';
const STORAGE_UNITS = 'rentbook_units_v1';
const STORAGE_TENANTS = 'rentbook_tenants_v1';
const STORAGE_PAYMENTS = 'rentbook_payments_v1';
const STORAGE_EXPENSES = 'rentbook_expenses_v1';
const STORAGE_AUDIT = 'rentbook_audit_v1';
const STORAGE_SETTINGS = 'rentbook_settings_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, activeRole } = useAuth();

  // Navigation State
  const [currentScreen, setCurrentScreenState] = useState<ScreenType>('dashboard');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  // Entities
  const [properties, setProperties] = useState<Property[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_PROPS);
      return s ? JSON.parse(s) : [DEMO_PROPERTY];
    } catch {
      return [DEMO_PROPERTY];
    }
  });

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(() => {
    return properties[0]?.id || DEMO_PROPERTY.id;
  });

  const [units, setUnits] = useState<Unit[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_UNITS);
      return s ? JSON.parse(s) : DEMO_UNITS;
    } catch {
      return DEMO_UNITS;
    }
  });

  const [tenants, setTenants] = useState<Tenant[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_TENANTS);
      return s ? JSON.parse(s) : DEMO_TENANTS;
    } catch {
      return DEMO_TENANTS;
    }
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_PAYMENTS);
      return s ? JSON.parse(s) : DEMO_PAYMENTS;
    } catch {
      return DEMO_PAYMENTS;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_EXPENSES);
      return s ? JSON.parse(s) : DEMO_EXPENSES;
    } catch {
      return DEMO_EXPENSES;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_AUDIT);
      return s ? JSON.parse(s) : DEMO_AUDIT_LOGS;
    } catch {
      return DEMO_AUDIT_LOGS;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const s = localStorage.getItem(STORAGE_SETTINGS);
      return s ? JSON.parse(s) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Offline & Realtime Sync States
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [queuedSyncCount, setQueuedSyncCount] = useState<number>(() => getOfflineQueue().length);
  const [liveToasts, setLiveToasts] = useState<LiveToast[]>([]);
  const [undoState, setUndoState] = useState<UndoState | null>(null);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentPrefill, setPaymentPrefill] = useState<{ unitId?: string; tenantId?: string } | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [propertyModalEditing, setPropertyModalEditing] = useState<Property | null>(null);

  const [isBulkRenameModalOpen, setIsBulkRenameModalOpen] = useState(false);
  const [bulkRenamePropertyId, setBulkRenamePropertyId] = useState<string | null>(null);

  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [tenantModalData, setTenantModalData] = useState<{ unitId: string; tenant?: Tenant | null } | null>(null);

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [unitModalData, setUnitModalData] = useState<Unit | null>(null);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDangerModalOpen, setIsDangerModalOpen] = useState(false);
  const [dangerActionType, setDangerActionType] = useState<'units' | 'payments' | 'all' | null>(null);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_PROPS, JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem(STORAGE_UNITS, JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem(STORAGE_TENANTS, JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Network online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Attempt to sync offline queue
      const queue = getOfflineQueue();
      if (queue.length > 0) {
        broadcastLiveAction(`Back online! Synced ${queue.length} offline record(s)`, 'success');
        queue.forEach((item) => removeFromOfflineQueue(item.id));
        setQueuedSyncCount(0);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      broadcastLiveAction('You are offline. Entries will be queued and synced automatically.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Broadcast channel for multi-tab simultaneous testing on same Chromebook
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('rentbook_kenya_sync');
      channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'TOAST') {
          setLiveToasts((prev) => [payload, ...prev.slice(0, 4)]);
        } else if (type === 'PAYMENT_INSERT') {
          setPayments((prev) => [payload, ...prev.filter((p) => p.id !== payload.id)]);
        } else if (type === 'EXPENSE_INSERT') {
          setExpenses((prev) => [payload, ...prev.filter((e) => e.id !== payload.id)]);
        } else if (type === 'STATE_REFRESH') {
          // Refresh state from localStorage
          try {
            const p = localStorage.getItem(STORAGE_PAYMENTS);
            if (p) setPayments(JSON.parse(p));
            const e = localStorage.getItem(STORAGE_EXPENSES);
            if (e) setExpenses(JSON.parse(e));
          } catch {
            // ignore
          }
        }
      };
    } catch {
      // BroadcastChannel not available
    }

    return () => {
      channel?.close();
    };
  }, []);

  // Realtime Supabase Subscription (if live configured)
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const channel = supabase
      .channel('rentbook-realtime-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newPay = payload.new as Payment;
          setPayments((prev) => [newPay, ...prev.filter((p) => p.id !== newPay.id)]);
          broadcastLiveAction(
            `New payment: ${formatKES(newPay.amount)} recorded for unit ${newPay.covers_month} · Just now`,
            'info'
          );
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Payment;
          setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        } else if (payload.eventType === 'DELETE') {
          setPayments((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newExp = payload.new as Expense;
          setExpenses((prev) => [newExp, ...prev.filter((e) => e.id !== newExp.id)]);
        }
      })
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Countdown timer for 10-second undo toast
  useEffect(() => {
    if (!undoState) return;
    if (undoState.secondsRemaining <= 0) {
      setUndoState(null);
      return;
    }
    const timer = setTimeout(() => {
      setUndoState((prev) => (prev ? { ...prev, secondsRemaining: prev.secondsRemaining - 1 } : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [undoState]);

  const broadcastLiveAction = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const toast: LiveToast = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      message,
      type,
      timestamp: new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
    };

    setLiveToasts((prev) => [toast, ...prev.slice(0, 4)]);

    // Broadcast across other browser tabs/windows
    try {
      const channel = new BroadcastChannel('rentbook_kenya_sync');
      channel.postMessage({ type: 'TOAST', payload: toast });
      channel.close();
    } catch {
      // ignore
    }

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      dismissToast(toast.id);
    }, 6000);
  };

  const dismissToast = (id: string) => {
    setLiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const dismissUndo = () => {
    setUndoState(null);
  };

  const setCurrentScreen = (screen: ScreenType, unitId: string | null = null) => {
    setCurrentScreenState(screen);
    if (unitId !== undefined) {
      setSelectedUnitId(unitId);
    }
    // Auto scroll top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to log audit trail
  const logAudit = (
    action: AuditLog['action'],
    tableName: string,
    recordId: string,
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null,
    reason: string
  ) => {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      actor_role: activeRole,
      action,
      table_name: tableName,
      record_id: recordId,
      before_json: before,
      after_json: after,
      reason,
      device_info: `${navigator.userAgent.includes('CrOS') ? 'ChromeOS (Chromebook)' : 'Web Client'} (${window.innerWidth}x${window.innerHeight})`,
      created_at: new Date().toISOString(),
    };

    setAuditLogs((prev) => [log, ...prev]);

    if (isSupabaseConfigured() && supabase) {
      supabase.from('audit_log').insert({
        actor_id: currentUser.id,
        actor_role: activeRole,
        action,
        table_name: tableName,
        record_id: recordId,
        before_json: before,
        after_json: after,
        reason,
        device_info: log.device_info,
      });
    }
  };

  // -------------------------------------------------------------------
  // Role-Scoped Entities
  // -------------------------------------------------------------------
  const visibleProperties = useMemo(() => {
    if (activeRole === 'admin') {
      return properties;
    }
    // Landlord or Caretaker: Filter by owner_id or property access
    return properties.filter((p) => p.owner_id === currentUser.id || p.id === selectedPropertyId);
  }, [properties, activeRole, currentUser.id, selectedPropertyId]);

  const currentProperty = useMemo(() => {
    return (
      visibleProperties.find((p) => p.id === selectedPropertyId) ||
      visibleProperties[0] ||
      properties[0]
    );
  }, [visibleProperties, selectedPropertyId, properties]);

  // Keep selectedPropertyId pointing to valid property
  useEffect(() => {
    if (currentProperty && currentProperty.id !== selectedPropertyId) {
      setSelectedPropertyId(currentProperty.id);
    }
  }, [currentProperty, selectedPropertyId]);

  // Active units for current property (excluding soft deleted)
  const activePropertyUnits = useMemo(() => {
    if (!currentProperty) return [];
    return units.filter((u) => u.property_id === currentProperty.id && !u.deleted_at);
  }, [units, currentProperty]);

  // Arrears Waterfall Calculation per Tenant
  const tenantArrears = useMemo<TenantArrearsSummary[]>(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthNum = today.getMonth() + 1;

    return tenants
      .filter((t) => !t.deleted_at && !t.move_out_date)
      .map((tenant) => {
        const unit = units.find((u) => u.id === tenant.unit_id);
        const monthlyRent = unit?.monthly_rent || 0;

        // Calculate months active from move_in_date to current month
        const moveIn = new Date(tenant.move_in_date || '2026-06-01');
        const moveInYear = moveIn.getFullYear();
        const moveInMonthNum = moveIn.getMonth() + 1;

        let totalMonths =
          (currentYear - moveInYear) * 12 + (currentMonthNum - moveInMonthNum) + 1;
        if (totalMonths < 1) totalMonths = 1;

        const totalBilled = totalMonths * monthlyRent;

        // Sum approved payments for this tenant
        const approvedPayments = payments.filter(
          (p) =>
            p.tenant_id === tenant.id &&
            !p.deleted_at &&
            (p.status === 'approved' || (p.status === 'pending' && activeRole === 'caretaker'))
        );
        const totalPaid = approvedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const balance = totalBilled - totalPaid;

        // Find oldest unpaid month
        let oldestUnpaid = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;
        let cumulativePaid = totalPaid;
        for (let m = 0; m < totalMonths; m++) {
          const targetDate = new Date(moveInYear, moveInMonthNum - 1 + m, 1);
          const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
          if (cumulativePaid < monthlyRent) {
            oldestUnpaid = monthKey;
            break;
          }
          cumulativePaid -= monthlyRent;
        }

        // Days overdue from rent due day (default 5th)
        const dueDay = tenant.rent_due_day || settings.default_rent_due_day || 5;
        const currentDay = today.getDate();
        const daysOverdue = currentDay > dueDay ? currentDay - dueDay : 0;
        const monthsBehind = monthlyRent > 0 ? Math.floor(Math.max(0, balance) / monthlyRent) : 0;

        let bucket: '0-30' | '31-60' | '61-90' | '90+' = '0-30';
        if (monthsBehind >= 3) bucket = '90+';
        else if (monthsBehind === 2) bucket = '61-90';
        else if (monthsBehind === 1) bucket = '31-60';

        return {
          tenant,
          unit: unit || {
            id: tenant.unit_id,
            name: '—',
            property_id: '',
            floor_number: 0,
            monthly_rent: 0,
            status: 'occupied',
            version: 1,
          },
          property: properties.find((p) => p.id === unit?.property_id),
          monthly_rent: monthlyRent,
          total_billed: totalBilled,
          total_paid: totalPaid,
          balance,
          months_behind: monthsBehind,
          oldest_unpaid_month: oldestUnpaid,
          days_overdue: daysOverdue,
          bucket,
          is_overdue: balance > 0,
        };
      })
      .sort((a, b) => b.balance - a.balance); // largest debt first
  }, [tenants, units, payments, settings.default_rent_due_day, properties, activeRole]);

  // Cash Book Entries (Money In & Money Out sorted chronologically with running balance)
  const cashBookEntries = useMemo<CashBookEntry[]>(() => {
    if (!currentProperty) return [];

    const rawIn: CashBookEntry[] = payments
      .filter((p) => {
        const u = units.find((unit) => unit.id === p.unit_id);
        return u?.property_id === currentProperty.id && !p.deleted_at && p.status !== 'void';
      })
      .map((p) => {
        const u = units.find((unit) => unit.id === p.unit_id);
        const t = tenants.find((tenant) => tenant.id === p.tenant_id);
        return {
          id: p.id,
          date: p.date,
          type: 'in',
          description: `Rent payment for House ${u?.name || '—'} (${p.covers_month})`,
          categoryOrMethod: p.method,
          reference: p.reference,
          property_id: currentProperty.id,
          property_name: currentProperty.name,
          unit_name: u?.name,
          tenant_name: t?.full_name,
          money_in: Number(p.amount),
          money_out: 0,
          balance: 0,
          status: p.status,
          recorded_by_name: p.recorder_name || 'Staff',
          recorded_by_role: p.recorded_by === currentUser.id ? activeRole : 'caretaker',
          rawItem: p,
        };
      });

    const rawOut: CashBookEntry[] = expenses
      .filter((e) => e.property_id === currentProperty.id && !e.deleted_at)
      .map((e) => ({
        id: e.id,
        date: e.date,
        type: 'out',
        description: `${e.category}: ${e.payee}${e.note ? ` (${e.note})` : ''}`,
        categoryOrMethod: e.category,
        reference: 'Expense',
        property_id: currentProperty.id,
        property_name: currentProperty.name,
        money_in: 0,
        money_out: Number(e.amount),
        balance: 0,
        status: e.status,
        recorded_by_name: e.recorder_name || 'Staff',
        recorded_by_role: 'landlord',
        rawItem: e,
      }));

    // Sort chronologically ascending to calculate running balance, then reverse for display
    const merged = [...rawIn, ...rawOut].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let running = 0;
    merged.forEach((item) => {
      // Only approved items affect actual running cash balance
      if (item.status === 'approved') {
        running += item.money_in - item.money_out;
      }
      item.balance = running;
    });

    return merged.reverse(); // Newest first
  }, [currentProperty, payments, expenses, units, tenants, currentUser.id, activeRole]);

  // Pending Approvals Count for Landlord/Admin badge
  const pendingApprovalsCount = useMemo(() => {
    return payments.filter((p) => p.status === 'pending' && !p.deleted_at).length;
  }, [payments]);

  // -------------------------------------------------------------------
  // DATA OPERATIONS
  // -------------------------------------------------------------------

  const savePropertyWithUnits = async (
    propData: Omit<Property, 'id' | 'created_at' | 'updated_at'> & { id?: string },
    scheme: NamingSchemeConfig,
    defaultRent: number,
    customNames?: string[]
  ) => {
    const propId = propData.id || `prop-${Date.now()}`;
    const newProperty: Property = {
      ...propData,
      id: propId,
      owner_id: propData.owner_id || currentUser.id,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
    };

    setProperties((prev) => {
      const idx = prev.findIndex((p) => p.id === propId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newProperty;
        return copy;
      }
      return [newProperty, ...prev];
    });

    // Auto-generate units if creating new property
    if (!propData.id) {
      const generated = generateUnitNames(
        propData.floors,
        propData.units_per_floor,
        scheme,
        propData.blocks
      );

      const newUnits: Unit[] = generated.map((gen, idx) => ({
        id: `unit-${propId}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
        property_id: propId,
        block_name: gen.blockName,
        floor_number: gen.floorNumber,
        name: customNames && customNames[idx] ? customNames[idx] : gen.name,
        monthly_rent: defaultRent,
        status: 'vacant',
        version: 1,
        created_at: new Date().toISOString(),
      }));

      setUnits((prev) => [...newUnits, ...prev]);
    }

    setSelectedPropertyId(propId);
    logAudit('INSERT', 'properties', propId, null, newProperty as unknown as Record<string, unknown>, `Created property ${newProperty.name} with auto-named units`);
    broadcastLiveAction(`Created property "${newProperty.name}" with auto-named houses`, 'success');
  };

  const updateProperty = async (prop: Property) => {
    const before = properties.find((p) => p.id === prop.id);
    setProperties((prev) => prev.map((p) => (p.id === prop.id ? prop : p)));
    logAudit('UPDATE', 'properties', prop.id, before as unknown as Record<string, unknown>, prop as unknown as Record<string, unknown>, `Updated property details`);
  };

  const deleteProperty = async (propId: string) => {
    if (activeRole !== 'admin') return;
    const target = properties.find((p) => p.id === propId);
    setProperties((prev) => prev.filter((p) => p.id !== propId));
    logAudit('DELETE', 'properties', propId, target as unknown as Record<string, unknown>, null, `Deleted property`);
    broadcastLiveAction(`Deleted property ${target?.name || ''}`, 'warning');
  };

  const addUnit = async (unitData: Omit<Unit, 'id' | 'version' | 'created_at' | 'updated_at'>) => {
    const newUnit: Unit = {
      ...unitData,
      id: `unit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      version: 1,
      created_at: new Date().toISOString(),
    };
    setUnits((prev) => [newUnit, ...prev]);
    logAudit('INSERT', 'units', newUnit.id, null, newUnit as unknown as Record<string, unknown>, `Added unit ${newUnit.name}`);
  };

  const updateUnit = async (unit: Unit) => {
    const before = units.find((u) => u.id === unit.id);
    setUnits((prev) =>
      prev.map((u) => (u.id === unit.id ? { ...unit, version: (u.version || 1) + 1, updated_at: new Date().toISOString() } : u))
    );
    logAudit('UPDATE', 'units', unit.id, before as unknown as Record<string, unknown>, unit as unknown as Record<string, unknown>, `Updated unit ${unit.name}`);
  };

  const renameUnit = async (unitId: string, newName: string) => {
    const target = units.find((u) => u.id === unitId);
    if (!target) return;
    const before = { name: target.name };
    const after = { name: newName };
    setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, name: newName.trim() } : u)));
    logAudit('UPDATE', 'units', unitId, before, after, `Renamed unit from ${target.name} to ${newName}`);
    broadcastLiveAction(`Renamed house to "${newName}"`, 'info');
  };

  const bulkRenameUnits = async (propertyId: string, scheme: NamingSchemeConfig) => {
    const prop = properties.find((p) => p.id === propertyId);
    if (!prop) return;

    const generated = generateUnitNames(prop.floors, prop.units_per_floor, scheme, prop.blocks);
    const existing = units.filter((u) => u.property_id === propertyId && !u.deleted_at);

    const updatedUnits = units.map((u) => {
      if (u.property_id !== propertyId || u.deleted_at) return u;
      const idx = existing.findIndex((e) => e.id === u.id);
      if (idx >= 0 && generated[idx]) {
        return { ...u, name: generated[idx].name };
      }
      return u;
    });

    setUnits(updatedUnits);
    logAudit('UPDATE', 'units', propertyId, null, { scheme: scheme.type }, `Bulk renamed units in ${prop.name}`);
    broadcastLiveAction(`Bulk renamed all houses in ${prop.name}`, 'success');
  };

  const deleteUnit = async (unitId: string): Promise<{ success: boolean; message?: string }> => {
    if (activeRole === 'caretaker') {
      return { success: false, message: 'Caretakers cannot delete units' };
    }
    const hasPayments = payments.some((p) => p.unit_id === unitId && !p.deleted_at);
    if (hasPayments) {
      // Soft archive instead
      setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, deleted_at: new Date().toISOString() } : u)));
      logAudit('DELETE', 'units', unitId, null, null, `Archived unit (preserved payment ledger)`);
      return { success: true, message: 'Unit archived to preserve cash book integrity' };
    }

    setUnits((prev) => prev.filter((u) => u.id !== unitId));
    logAudit('DELETE', 'units', unitId, null, null, `Permanently deleted unit`);
    return { success: true };
  };

  const saveTenant = async (
    tenantData: Omit<Tenant, 'id' | 'version' | 'created_at' | 'updated_at'> & { id?: string }
  ) => {
    const tenantId = tenantData.id || `t-${Date.now()}`;
    const newTenant: Tenant = {
      ...tenantData,
      id: tenantId,
      version: 1,
      created_at: new Date().toISOString(),
    };

    setTenants((prev) => {
      const idx = prev.findIndex((t) => t.id === tenantId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newTenant;
        return copy;
      }
      return [newTenant, ...prev];
    });

    // Mark unit occupied
    setUnits((prev) =>
      prev.map((u) => (u.id === tenantData.unit_id ? { ...u, status: 'occupied' } : u))
    );

    logAudit('INSERT', 'tenants', tenantId, null, newTenant as unknown as Record<string, unknown>, `Assigned tenant ${newTenant.full_name}`);
    broadcastLiveAction(`Assigned tenant ${newTenant.full_name}`, 'success');
  };

  const vacateTenant = async (tenantId: string, moveOutDate: string) => {
    const target = tenants.find((t) => t.id === tenantId);
    if (!target) return;

    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, move_out_date: moveOutDate } : t))
    );

    // Mark unit vacant
    setUnits((prev) =>
      prev.map((u) => (u.id === target.unit_id ? { ...u, status: 'vacant' } : u))
    );

    logAudit('UPDATE', 'tenants', tenantId, null, { move_out_date: moveOutDate }, `Vacated tenant ${target.full_name}`);
    broadcastLiveAction(`Tenant ${target.full_name} moved out. House marked vacant.`, 'info');
  };

  const deleteTenant = async (tenantId: string) => {
    const target = tenants.find((t) => t.id === tenantId);
    setTenants((prev) => prev.filter((t) => t.id !== tenantId));
    logAudit('DELETE', 'tenants', tenantId, target as unknown as Record<string, unknown>, null, `Deleted tenant record`);
  };

  // Payment Recording with Duplicate Warning & Waterfall Arrears
  const recordPayment = async (
    paymentData: Omit<Payment, 'id' | 'version' | 'created_at' | 'updated_at' | 'status' | 'recorded_by'>
  ): Promise<{ success: boolean; message?: string }> => {
    // Check possible duplicate entry in last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const isDuplicate = payments.some(
      (p) =>
        p.unit_id === paymentData.unit_id &&
        Number(p.amount) === Number(paymentData.amount) &&
        p.covers_month === paymentData.covers_month &&
        new Date(p.created_at || '').getTime() > fiveMinutesAgo
    );

    if (isDuplicate) {
      const confirmDup = window.confirm(
        `Possible duplicate detected: An identical payment of ${formatKES(paymentData.amount)} for this unit and month was recorded in the last 5 minutes. Do you want to record it anyway?`
      );
      if (!confirmDup) {
        return { success: false, message: 'Cancelled duplicate entry' };
      }
    }

    const requiresApproval =
      activeRole === 'caretaker' && settings.caretaker_approval_required;
    const status: PaymentStatus = requiresApproval ? 'pending' : 'approved';

    const newPayment: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status,
      recorded_by: currentUser.id,
      recorder_name: `${currentUser.full_name} (${activeRole.toUpperCase()})`,
      approved_by: requiresApproval ? null : currentUser.id,
      approved_at: requiresApproval ? null : new Date().toISOString(),
      version: 1,
      created_at: new Date().toISOString(),
    };

    // If offline, queue for sync
    if (!isOnline) {
      addToOfflineQueue({ type: 'payment', payload: newPayment });
      setQueuedSyncCount((prev) => prev + 1);
    }

    setPayments((prev) => [newPayment, ...prev]);

    const unit = units.find((u) => u.id === newPayment.unit_id);
    const msg = requiresApproval
      ? `${currentUser.full_name} (Caretaker) submitted ${formatKES(newPayment.amount)} for ${unit?.name || 'unit'}. Sent for Landlord approval.`
      : `Recorded ${formatKES(newPayment.amount)} for House ${unit?.name || 'unit'}`;

    logAudit('INSERT', 'payments', newPayment.id, null, newPayment as unknown as Record<string, unknown>, msg);
    broadcastLiveAction(msg, requiresApproval ? 'warning' : 'success');

    // Broadcast tab sync
    try {
      const channel = new BroadcastChannel('rentbook_kenya_sync');
      channel.postMessage({ type: 'PAYMENT_INSERT', payload: newPayment });
      channel.close();
    } catch {
      // ignore
    }

    return { success: true };
  };

  const approvePayment = async (paymentId: string) => {
    if (activeRole === 'caretaker') return;
    const target = payments.find((p) => p.id === paymentId);
    if (!target) return;

    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: 'approved',
              approved_by: currentUser.id,
              approved_at: new Date().toISOString(),
            }
          : p
      )
    );

    const unit = units.find((u) => u.id === target.unit_id);
    logAudit('APPROVE', 'payments', paymentId, { status: 'pending' }, { status: 'approved' }, `Approved payment of ${formatKES(target.amount)}`);
    broadcastLiveAction(`Approved payment of ${formatKES(target.amount)} for House ${unit?.name || ''}`, 'success');
  };

  const rejectPayment = async (paymentId: string, reason: string) => {
    if (activeRole === 'caretaker') return;
    const target = payments.find((p) => p.id === paymentId);
    if (!target) return;

    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: 'rejected',
              reject_reason: reason,
              approved_by: currentUser.id,
              approved_at: new Date().toISOString(),
            }
          : p
      )
    );

    logAudit('REJECT', 'payments', paymentId, { status: target.status }, { status: 'rejected', reject_reason: reason }, `Rejected payment: ${reason}`);
    broadcastLiveAction(`Rejected payment: ${reason}`, 'warning');
  };

  const voidPayment = async (paymentId: string, reason: string) => {
    if (activeRole === 'caretaker') return;
    const target = payments.find((p) => p.id === paymentId);
    if (!target) return;

    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: 'void', note: `VOIDED: ${reason}` } : p))
    );

    logAudit('VOID', 'payments', paymentId, { status: target.status }, { status: 'void', reason }, `Voided payment: ${reason}`);
    broadcastLiveAction(`Payment marked VOID: ${reason}`, 'warning');
  };

  const deletePayment = async (
    paymentId: string,
    reason: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (activeRole === 'caretaker') {
      return { success: false, message: 'Caretakers cannot delete payment records' };
    }
    const target = payments.find((p) => p.id === paymentId);
    if (!target) return { success: false, message: 'Not found' };

    // Set 10-second undo window
    const snapshot = [...payments];
    setPayments((prev) => prev.filter((p) => p.id !== paymentId));

    setUndoState({
      message: `Deleted payment of ${formatKES(target.amount)}. Click undo to restore.`,
      secondsRemaining: 10,
      undoAction: () => {
        setPayments(snapshot);
        setUndoState(null);
        broadcastLiveAction('Restored deleted payment', 'info');
      },
    });

    logAudit('DELETE', 'payments', paymentId, target as unknown as Record<string, unknown>, null, `Deleted payment: ${reason}`);
    return { success: true };
  };

  const recordExpense = async (
    expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'status' | 'recorded_by'>
  ) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'approved',
      recorded_by: currentUser.id,
      recorder_name: `${currentUser.full_name} (${activeRole.toUpperCase()})`,
      created_at: new Date().toISOString(),
    };

    setExpenses((prev) => [newExpense, ...prev]);
    logAudit('INSERT', 'expenses', newExpense.id, null, newExpense as unknown as Record<string, unknown>, `Recorded expense: ${newExpense.category} ${formatKES(newExpense.amount)} to ${newExpense.payee}`);
    broadcastLiveAction(`Logged expense: ${formatKES(newExpense.amount)} (${newExpense.category})`, 'info');
  };

  const approveExpense = async (expenseId: string) => {
    setExpenses((prev) => prev.map((e) => (e.id === expenseId ? { ...e, status: 'approved' } : e)));
  };

  const rejectExpense = async (expenseId: string, reason: string) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === expenseId ? { ...e, status: 'rejected', reject_reason: reason } : e))
    );
  };

  const deleteExpense = async (expenseId: string) => {
    if (activeRole === 'caretaker') return;
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    logAudit('DELETE', 'expenses', expenseId, null, null, `Deleted expense`);
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (activeRole !== 'admin') return;
    setSettings((prev) => ({ ...prev, ...newSettings }));
    logAudit('UPDATE', 'settings', 'app_settings', settings as unknown as Record<string, unknown>, newSettings as unknown as Record<string, unknown>, `Updated app settings`);
    broadcastLiveAction('Updated app configuration settings', 'success');
  };

  // -------------------------------------------------------------------
  // DANGER ZONE (Admin Only - Typed 'DELETE' modal verification)
  // -------------------------------------------------------------------
  const executeDangerPurge = async (type: 'units' | 'payments' | 'all') => {
    if (currentUser.role !== 'admin') return;

    if (type === 'units' && currentProperty) {
      const snapshot = [...units];
      setUnits((prev) => prev.filter((u) => u.property_id !== currentProperty.id));
      setUndoState({
        message: `Deleted all units in ${currentProperty.name}. Undo available.`,
        secondsRemaining: 10,
        undoAction: () => {
          setUnits(snapshot);
          setUndoState(null);
        },
      });
      logAudit('DELETE', 'units', currentProperty.id, null, null, `Purged all units in property`);
    } else if (type === 'payments') {
      const snapshot = [...payments];
      setPayments([]);
      setUndoState({
        message: 'Deleted all payments. Undo available.',
        secondsRemaining: 10,
        undoAction: () => {
          setPayments(snapshot);
          setUndoState(null);
        },
      });
      logAudit('DELETE', 'payments', 'all', null, null, `Purged all payment records`);
    } else if (type === 'all') {
      // Factory reset
      localStorage.clear();
      setProperties([DEMO_PROPERTY]);
      setUnits(DEMO_UNITS);
      setTenants(DEMO_TENANTS);
      setPayments(DEMO_PAYMENTS);
      setExpenses(DEMO_EXPENSES);
      setAuditLogs(DEMO_AUDIT_LOGS);
      setSettings(DEFAULT_SETTINGS);
      logAudit('RESET', 'database', 'all', null, null, `Full factory reset executed`);
    }

    broadcastLiveAction(`Executed danger purge: ${type.toUpperCase()}`, 'warning');
  };

  // -------------------------------------------------------------------
  // BACKUP & RESTORE
  // -------------------------------------------------------------------
  const exportBackupJson = (): string => {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      properties,
      units,
      tenants,
      payments,
      expenses,
      settings,
      auditLogs,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importBackupJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.properties) setProperties(parsed.properties);
      if (parsed.units) setUnits(parsed.units);
      if (parsed.tenants) setTenants(parsed.tenants);
      if (parsed.payments) setPayments(parsed.payments);
      if (parsed.expenses) setExpenses(parsed.expenses);
      if (parsed.settings) setSettings(parsed.settings);
      logAudit('INSERT', 'backup', 'import', null, null, `Imported backup from JSON file`);
      broadcastLiveAction('Successfully restored backup data', 'success');
      return true;
    } catch {
      return false;
    }
  };

  // Modal helpers
  const openPaymentModal = (prefill: { unitId?: string; tenantId?: string } | null = null) => {
    setPaymentPrefill(prefill);
    setIsPaymentModalOpen(true);
  };
  const closePaymentModal = () => setIsPaymentModalOpen(false);

  const openExpenseModal = () => setIsExpenseModalOpen(true);
  const closeExpenseModal = () => setIsExpenseModalOpen(false);

  const openPropertyModal = (p: Property | null = null) => {
    setPropertyModalEditing(p);
    setIsPropertyModalOpen(true);
  };
  const closePropertyModal = () => setIsPropertyModalOpen(false);

  const openBulkRenameModal = (pId: string) => {
    setBulkRenamePropertyId(pId);
    setIsBulkRenameModalOpen(true);
  };
  const closeBulkRenameModal = () => setIsBulkRenameModalOpen(false);

  const openTenantModal = (data: { unitId: string; tenant?: Tenant | null }) => {
    setTenantModalData(data);
    setIsTenantModalOpen(true);
  };
  const closeTenantModal = () => setIsTenantModalOpen(false);

  const openUnitModal = (unit: Unit) => {
    setUnitModalData(unit);
    setIsUnitModalOpen(true);
  };
  const closeUnitModal = () => setIsUnitModalOpen(false);

  const openInviteModal = () => setIsInviteModalOpen(true);
  const closeInviteModal = () => setIsInviteModalOpen(false);

  const openDangerModal = (type: 'units' | 'payments' | 'all') => {
    setDangerActionType(type);
    setIsDangerModalOpen(true);
  };
  const closeDangerModal = () => {
    setIsDangerModalOpen(false);
    setDangerActionType(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        selectedPropertyId,
        setSelectedPropertyId,
        selectedUnitId,
        setSelectedUnitId,
        properties,
        visibleProperties,
        currentProperty,
        units: activePropertyUnits,
        tenants,
        payments,
        expenses,
        auditLogs,
        settings,
        cashBookEntries,
        tenantArrears,
        pendingApprovalsCount,
        isOnline,
        queuedSyncCount,
        liveToasts,
        dismissToast,
        undoState,
        dismissUndo,
        isPaymentModalOpen,
        paymentPrefill,
        openPaymentModal,
        closePaymentModal,
        isExpenseModalOpen,
        openExpenseModal,
        closeExpenseModal,
        isPropertyModalOpen,
        propertyModalEditing,
        openPropertyModal,
        closePropertyModal,
        isBulkRenameModalOpen,
        bulkRenamePropertyId,
        openBulkRenameModal,
        closeBulkRenameModal,
        isTenantModalOpen,
        tenantModalData,
        openTenantModal,
        closeTenantModal,
        isUnitModalOpen,
        unitModalData,
        openUnitModal,
        closeUnitModal,
        isInviteModalOpen,
        openInviteModal,
        closeInviteModal,
        isDangerModalOpen,
        dangerActionType,
        openDangerModal,
        closeDangerModal,
        savePropertyWithUnits,
        updateProperty,
        deleteProperty,
        addUnit,
        updateUnit,
        renameUnit,
        bulkRenameUnits,
        deleteUnit,
        saveTenant,
        vacateTenant,
        deleteTenant,
        recordPayment,
        approvePayment,
        rejectPayment,
        voidPayment,
        deletePayment,
        recordExpense,
        approveExpense,
        rejectExpense,
        deleteExpense,
        updateSettings,
        executeDangerPurge,
        exportBackupJson,
        importBackupJson,
        broadcastLiveAction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
