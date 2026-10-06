// =====================================================================
// RENTBOOK KENYA — OFFLINE QUEUE FOR FIELD WORKERS
// Saves pending records to localStorage when connection drops, syncs when back online
// =====================================================================

import { Expense, Payment } from '../types';

export interface QueuedItem {
  id: string;
  type: 'payment' | 'expense';
  payload: Partial<Payment> | Partial<Expense>;
  queuedAt: string;
}

const QUEUE_KEY = 'rentbook_offline_sync_queue_v1';

export function getOfflineQueue(): QueuedItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(item: Omit<QueuedItem, 'id' | 'queuedAt'>): QueuedItem {
  const queue = getOfflineQueue();
  const queuedItem: QueuedItem = {
    ...item,
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    queuedAt: new Date().toISOString(),
  };
  queue.push(queuedItem);
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to save to offline queue', err);
  }
  return queuedItem;
}

export function removeFromOfflineQueue(id: string): void {
  const queue = getOfflineQueue().filter((item) => item.id !== id);
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to update offline queue', err);
  }
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch (err) {
    console.error('Failed to clear offline queue', err);
  }
}
