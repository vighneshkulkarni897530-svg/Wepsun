/**
 * WEPSUN In-Memory TTL Cache Manager
 * Ultra-fast caching for high-frequency database catalogs (Companies, Branches, Catalogs)
 * Eliminates repetitive round-trips to Supabase PostgreSQL in Tokyo
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class FastMemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  /**
   * Get cached item or null if expired/absent
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  /**
   * Set cached item with TTL in milliseconds (default: 30 seconds)
   */
  set<T>(key: string, value: T, ttlMs = 30000): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Invalidate specific cache key or prefix pattern
   */
  del(keyOrPrefix: string): void {
    if (this.store.has(keyOrPrefix)) {
      this.store.delete(keyOrPrefix);
      return;
    }
    // Delete any key starting with prefix
    for (const key of this.store.keys()) {
      if (key.startsWith(keyOrPrefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Helper to retrieve or lazily execute query and cache result
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlMs = 30000): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const fresh = await fetcher();
    if (fresh !== null && fresh !== undefined) {
      this.set(key, fresh, ttlMs);
    }
    return fresh;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.store.clear();
  }
}

export const serverCache = new FastMemoryCache();
export default serverCache;
