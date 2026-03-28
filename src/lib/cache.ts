/**
 * In-memory caching layer with TTL support
 * For production, consider using Redis or Vercel KV
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private maxSize: number;
  
  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    this.startCleanup();
  }
  
  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    if (this.cleanupInterval) return;
    
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
    
    this.cleanupInterval.unref(); // Don't keep process alive
  }
  
  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[Cache] Cleaned up ${removed} expired entries`);
    }
  }
  
  /**
   * Evict oldest entries if cache is too large
   */
  private evictIfNeeded(): void {
    if (this.cache.size <= this.maxSize) return;
    
    const sortedEntries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt);
    
    const toRemove = this.cache.size - this.maxSize;
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(sortedEntries[i][0]);
    }
  }
  
  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, data: T, ttlSeconds: number = 60): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      expiresAt: now + ttlSeconds * 1000,
      createdAt: now,
    });
    
    this.evictIfNeeded();
  }
  
  /**
   * Get cache entry if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Delete all entries matching a pattern
   */
  deletePattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let deleted = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    
    return deleted;
  }
  
  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  stats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
  
  /**
   * Get or set pattern - fetch if not cached
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 60
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    const data = await fetcher();
    this.set(key, data, ttlSeconds);
    return data;
  }
}

// Global cache instance
export const cache = new CacheManager(1000);

/**
 * Cache key builders for consistent naming
 */
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userLeads: (userId: string) => `user:${userId}:leads`,
  userExpenses: (userId: string) => `user:${userId}:expenses`,
  userActivities: (userId: string) => `user:${userId}:activities`,
  userTasks: (userId: string) => `user:${userId}:tasks`,
  userDashboard: (userId: string) => `user:${userId}:dashboard`,
  lead: (leadId: string) => `lead:${leadId}`,
  expense: (expenseId: string) => `expense:${expenseId}`,
  
  // Invalidation patterns
  userPattern: (userId: string) => `^user:${userId}:`,
};

/**
 * Invalidate user-related cache
 */
export function invalidateUserCache(userId: string): void {
  cache.deletePattern(CacheKeys.userPattern(userId));
}

/**
 * Cache decorator for functions
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyFn: (...args: Parameters<T>) => string,
  ttlSeconds: number = 60
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyFn(...args);
    return cache.getOrSet(key, () => fn(...args), ttlSeconds);
  }) as T;
}

/**
 * Response cache helper for API routes
 */
export function withCache<T>(
  key: string,
  ttlSeconds: number = 30
): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${key}:${JSON.stringify(args)}`;
      return cache.getOrSet(cacheKey, () => originalMethod.apply(this, args), ttlSeconds);
    };
    
    return descriptor;
  };
}

export default cache;
