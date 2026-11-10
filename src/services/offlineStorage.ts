/**
 * WEPSUN Engineering Solutions — Enterprise IndexedDB Offline Storage
 * High-capacity transactional storage for entities and mutations when offline.
 * Replaces volatile/limited LocalStorage (5MB cap) with native IndexedDB (>50MB quota).
 * Safely falls back to LocalStorage/in-memory if IndexedDB is blocked or unavailable.
 */

const DB_NAME = 'wepsun_offline_v2';
const DB_VERSION = 1;

export const STORES = {
  ENTITIES: 'entities',
  SYNC_QUEUE: 'sync_queue',
} as const;

export type MutationAction =
  | 'CREATE_COMPLAINT'
  | 'UPDATE_COMPLAINT_STATUS'
  | 'ASSIGN_TECHNICIAN'
  | 'SUBMIT_SERVICE_REPORT'
  | 'GPS_CHECK_IN'
  | 'UPDATE_INVENTORY'
  | 'SUBMIT_FEEDBACK';

export interface QueuedMutation {
  id: string; // Unique UUID
  idempotencyKey: string; // Sent in x-idempotency-key header to prevent duplicates
  action: MutationAction | string;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  payload: any;
  companyId: string;
  branchId?: string;
  userId?: string;
  userRole?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  lastAttemptAt?: string;
  lastError?: string;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'RESOLVED';
  clientTimestamp: number;
}

// In-memory fallback cache
const memoryFallback = new Map<string, any>();
const memoryQueue: QueuedMutation[] = [];

/**
 * Checks if IndexedDB is supported in the current environment
 */
export function isIndexedDBAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Opens or upgrades the IndexedDB instance
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      return reject(new Error('IndexedDB not supported or blocked'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Entities store (key-value)
      if (!db.objectStoreNames.contains(STORES.ENTITIES)) {
        db.createObjectStore(STORES.ENTITIES);
      }

      // Sync queue store (keyed by mutation ID)
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('createdAt', 'createdAt', { unique: false });
        queueStore.createIndex('idempotencyKey', 'idempotencyKey', { unique: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
    request.onblocked = () => {
      console.warn('[IndexedDB] Database open request blocked by older connection');
    };
  });
}

// -------------------------------------------------------------
// ENTITY CACHE (Lifts, Complaints, Inventory, AMC, Invoices)
// -------------------------------------------------------------

/**
 * Saves a collection of entities to IndexedDB with automatic memory fallback
 */
export async function saveOfflineCollection<T>(collectionKey: string, items: T[]): Promise<void> {
  if (!items || !Array.isArray(items)) return;

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.ENTITIES, 'readwrite');
      const store = tx.objectStore(STORES.ENTITIES);
      const req = store.put({ items, updatedAt: Date.now() }, collectionKey);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Graceful fallback to memory & LocalStorage
    memoryFallback.set(collectionKey, items);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`wepsun_offline_ent_${collectionKey}`, JSON.stringify(items));
      }
    } catch {}
  }
}

/**
 * Retrieves a collection of entities from IndexedDB
 */
export async function getOfflineCollection<T>(collectionKey: string): Promise<T[] | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.ENTITIES, 'readonly');
      const store = tx.objectStore(STORES.ENTITIES);
      const req = store.get(collectionKey);

      req.onsuccess = () => {
        if (req.result && Array.isArray(req.result.items)) {
          resolve(req.result.items);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (memoryFallback.has(collectionKey)) {
      return memoryFallback.get(collectionKey);
    }
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`wepsun_offline_ent_${collectionKey}`);
        if (stored) return JSON.parse(stored);
      }
    } catch {}
    return null;
  }
}

// -------------------------------------------------------------
// OFFLINE MUTATION QUEUE
// -------------------------------------------------------------

/**
 * Enqueues a mutation to be executed when connectivity is restored
 */
export async function enqueueSyncMutation(mutation: QueuedMutation): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const req = store.put(mutation);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Memory fallback
    const idx = memoryQueue.findIndex((m) => m.id === mutation.id);
    if (idx !== -1) {
      memoryQueue[idx] = mutation;
    } else {
      memoryQueue.push(mutation);
    }
  }
}

/**
 * Gets all pending mutations in FIFO order
 */
export async function getPendingMutations(): Promise<QueuedMutation[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readonly');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const req = store.getAll();

      req.onsuccess = () => {
        const all: QueuedMutation[] = req.result || [];
        // Filter pending or failed, sorted by clientTimestamp
        const pending = all
          .filter((m) => m.status === 'PENDING' || m.status === 'FAILED')
          .sort((a, b) => a.clientTimestamp - b.clientTimestamp);
        resolve(pending);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return memoryQueue
      .filter((m) => m.status === 'PENDING' || m.status === 'FAILED')
      .sort((a, b) => a.clientTimestamp - b.clientTimestamp);
  }
}

/**
 * Updates a queued mutation (e.g. after retry attempt or status change)
 */
export async function updateMutation(id: string, updates: Partial<QueuedMutation>): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        if (!getReq.result) return resolve();
        const updated = { ...getReq.result, ...updates };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch {
    const item = memoryQueue.find((m) => m.id === id);
    if (item) {
      Object.assign(item, updates);
    }
  }
}

/**
 * Removes a mutation from the queue after successful sync
 */
export async function removeMutation(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const idx = memoryQueue.findIndex((m) => m.id === id);
    if (idx !== -1) memoryQueue.splice(idx, 1);
  }
}

/**
 * Counts all pending mutations
 */
export async function countPendingMutations(): Promise<number> {
  const pending = await getPendingMutations();
  return pending.length;
}

export default {
  isIndexedDBAvailable,
  saveOfflineCollection,
  getOfflineCollection,
  enqueueSyncMutation,
  getPendingMutations,
  updateMutation,
  removeMutation,
  countPendingMutations,
};
