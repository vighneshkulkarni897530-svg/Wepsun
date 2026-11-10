/**
 * WEPSUN Engineering Solutions — Enterprise Offline Synchronization Engine
 * Features:
 * - Transactional offline mutation queue backed by IndexedDB
 * - Idempotency enforcement via unique `x-idempotency-key`
 * - Automatic background resumption upon network reconnection
 * - Exponential backoff retry mechanism (1s, 2s, 4s, 8s... max 30s)
 * - Conflict detection & resolution
 * - Real-time sync status indicators ('idle' | 'syncing' | 'synced' | 'error' | 'offline')
 */

import {
  enqueueSyncMutation,
  getPendingMutations,
  updateMutation,
  removeMutation,
  countPendingMutations,
  type QueuedMutation,
  type MutationAction,
} from './offlineStorage.js';
import { apiFetch, getApiBaseUrl } from './api.js';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

type SyncSubscriber = (status: SyncState, pendingCount: number) => void;

class OfflineSyncEngine {
  private isProcessing = false;
  private currentStatus: SyncState = 'idle';
  private subscribers: Set<SyncSubscriber> = new Set();
  private retryTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkOnline());
      window.addEventListener('offline', () => this.handleNetworkOffline());

      // Initial queue check after app boots
      setTimeout(() => {
        if (navigator.onLine) {
          this.processQueue();
        } else {
          this.setStatus('offline');
        }
      }, 1500);
    }
  }

  /**
   * Subscribe to live synchronization status changes
   */
  public subscribe(cb: SyncSubscriber): () => void {
    this.subscribers.add(cb);
    // Immediately emit current state synchronously
    try {
      cb(this.currentStatus, 0);
    } catch {}

    // Update with exact pending count asynchronously
    countPendingMutations().then((count) => {
      if (count > 0) {
        cb(this.currentStatus, count);
      }
    }).catch(() => {});

    return () => {
      this.subscribers.delete(cb);
    };
  }

  private setStatus(status: SyncState, pendingCount?: number): void {
    this.currentStatus = status;
    const notify = (count: number) => {
      this.subscribers.forEach((cb) => {
        try {
          cb(status, count);
        } catch {}
      });
    };

    if (typeof pendingCount === 'number') {
      notify(pendingCount);
    } else {
      countPendingMutations().then(notify);
    }
  }

  public getStatus(): SyncState {
    return this.currentStatus;
  }

  private handleNetworkOnline(): void {
    console.info('[SyncQueue] Internet connectivity restored. Resuming offline queue sync...');
    this.processQueue();
  }

  private handleNetworkOffline(): void {
    console.warn('[SyncQueue] Device went offline. Queueing all mutations locally...');
    this.setStatus('offline');
  }

  /**
   * Generates a collision-resistant UUID v4
   */
  private generateUuid(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'mut-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Enqueue a business mutation when server is offline or unreachable
   */
  public async queueOperation(params: {
    action: MutationAction | string;
    endpoint: string;
    method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    payload: any;
    companyId: string;
    branchId?: string;
    userId?: string;
    userRole?: string;
  }): Promise<QueuedMutation> {
    const id = this.generateUuid();
    const idempotencyKey = `idemp_${id}_${Date.now()}`;

    const mutation: QueuedMutation = {
      id,
      idempotencyKey,
      action: params.action,
      endpoint: params.endpoint,
      method: params.method,
      payload: params.payload,
      companyId: params.companyId,
      branchId: params.branchId,
      userId: params.userId,
      userRole: params.userRole,
      attempts: 0,
      maxAttempts: 5,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      clientTimestamp: Date.now(),
    };

    await enqueueSyncMutation(mutation);
    const count = await countPendingMutations();
    this.setStatus(navigator.onLine ? 'idle' : 'offline', count);

    // If online, schedule immediate sync
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.processQueue();
    }

    return mutation;
  }

  /**
   * Processes all pending mutations with retry, backoff, and idempotency
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('offline');
      return;
    }

    this.isProcessing = true;
    const initialCount = await countPendingMutations();
    if (initialCount === 0) {
      this.setStatus('synced', 0);
      this.isProcessing = false;
      return;
    }

    this.setStatus('syncing', initialCount);

    try {
      const pending = await getPendingMutations();

      for (const item of pending) {
        // Enforce exponential backoff: 1s, 2s, 4s, 8s, 16s, up to 30s
        if (item.attempts > 0 && item.lastAttemptAt) {
          const backoffDelayMs = Math.min(30000, 1000 * Math.pow(2, item.attempts - 1));
          const timeSinceLast = Date.now() - new Date(item.lastAttemptAt).getTime();
          if (timeSinceLast < backoffDelayMs) {
            continue; // Skip this item until backoff expires
          }
        }

        try {
          const res = await apiFetch(item.endpoint, {
            method: item.method,
            body: item.payload,
            headers: {
              'x-idempotency-key': item.idempotencyKey,
              'x-client-timestamp': String(item.clientTimestamp),
              ...(item.companyId ? { 'x-company-id': item.companyId } : {}),
              ...(item.branchId ? { 'x-branch-id': item.branchId } : {}),
              ...(item.userRole ? { 'x-user-role': item.userRole } : {}),
              ...(item.userId ? { 'x-user-id': item.userId } : {}),
            },
            timeoutMs: 15000,
          });

          if (res.success || res.status === 200 || res.status === 201) {
            // Mutation successfully synchronized with PostgreSQL backend
            await removeMutation(item.id);

            // Dispatch global event so UI components refresh their active state
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('wepsun_offline_synced', {
                  detail: { action: item.action, id: item.id, data: res.data },
                })
              );
            }
          } else if (res.status === 409) {
            // Conflict detected: record on server has been updated since offline draft was made
            console.warn(`[SyncQueue] Conflict on ${item.action} (${item.id}): Server record takes precedence.`);
            await removeMutation(item.id);
          } else {
            // Failed attempt
            const nextAttempts = item.attempts + 1;
            await updateMutation(item.id, {
              attempts: nextAttempts,
              lastAttemptAt: new Date().toISOString(),
              lastError: res.error || res.message || 'Server error',
              status: nextAttempts >= item.maxAttempts ? 'FAILED' : 'PENDING',
            });
          }
        } catch (itemErr: any) {
          const nextAttempts = item.attempts + 1;
          await updateMutation(item.id, {
            attempts: nextAttempts,
            lastAttemptAt: new Date().toISOString(),
            lastError: itemErr?.message || 'Network exception',
            status: nextAttempts >= item.maxAttempts ? 'FAILED' : 'PENDING',
          });
        }
      }
    } finally {
      this.isProcessing = false;
      const remaining = await countPendingMutations();

      if (remaining === 0) {
        this.setStatus('synced', 0);
      } else {
        const pendingItems = await getPendingMutations();
        const hasFailedPermanently = pendingItems.some((m) => m.status === 'FAILED');
        this.setStatus(hasFailedPermanently ? 'error' : 'idle', remaining);

        // Schedule next retry cycle if items still pending
        if (remaining > 0 && navigator.onLine) {
          clearTimeout(this.retryTimer);
          this.retryTimer = setTimeout(() => this.processQueue(), 10000);
        }
      }
    }
  }

  /**
   * Force manual retry of all failed queue items
   */
  public async retryFailed(): Promise<void> {
    const pending = await getPendingMutations();
    for (const item of pending) {
      if (item.status === 'FAILED') {
        await updateMutation(item.id, { status: 'PENDING', attempts: 0 });
      }
    }
    await this.processQueue();
  }
}

// Singleton export
export const syncEngine = new OfflineSyncEngine();
export default syncEngine;
