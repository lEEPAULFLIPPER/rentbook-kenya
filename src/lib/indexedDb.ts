// =====================================================================
// RENTBOOK KENYA — EMBEDDED INDEXEDDB RELATIONAL STORE
// Robust, multi-megabyte offline persistence with zero external packages
// =====================================================================

const DB_NAME = 'rentbook_kenya_idb';
const DB_VERSION = 1;

export interface AppDatabaseSnapshot {
  properties: any[];
  units: any[];
  tenants: any[];
  payments: any[];
  expenses: any[];
  auditLogs: any[];
  settings: any;
}

let dbInstance: IDBDatabase | null = null;

export async function openIndexedDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const stores = ['properties', 'units', 'tenants', 'payments', 'expenses', 'audit_logs', 'settings'];
      stores.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function saveCollectionToIDB(storeName: string, items: any[]): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    // Clear and put
    store.clear();
    items.forEach((item) => {
      if (item && item.id) {
        store.put(item);
      }
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`IndexedDB save error for ${storeName}:`, err);
  }
}

export async function loadCollectionFromIDB<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => resolve((request.result as T[]) || []);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function saveFullSnapshotToIDB(snapshot: AppDatabaseSnapshot): Promise<void> {
  await Promise.all([
    saveCollectionToIDB('properties', snapshot.properties || []),
    saveCollectionToIDB('units', snapshot.units || []),
    saveCollectionToIDB('tenants', snapshot.tenants || []),
    saveCollectionToIDB('payments', snapshot.payments || []),
    saveCollectionToIDB('expenses', snapshot.expenses || []),
    saveCollectionToIDB('audit_logs', snapshot.auditLogs || []),
  ]);
}

export async function loadFullSnapshotFromIDB(): Promise<Partial<AppDatabaseSnapshot>> {
  const [properties, units, tenants, payments, expenses, auditLogs] = await Promise.all([
    loadCollectionFromIDB('properties'),
    loadCollectionFromIDB('units'),
    loadCollectionFromIDB('tenants'),
    loadCollectionFromIDB('payments'),
    loadCollectionFromIDB('expenses'),
    loadCollectionFromIDB('audit_logs'),
  ]);

  return {
    properties,
    units,
    tenants,
    payments,
    expenses,
    auditLogs,
  };
}
