/**
 * Simple in-memory cache service for frequently accessed data
 * Implements time-based expiration and LRU eviction
 */

interface CacheEntry<T> {
  value: T;
  expires: number;
  lastAccessed: number;
}

export class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number = 1000;
  private defaultTTL: number = 300000; // 5 minutes in milliseconds

  constructor(options?: { maxSize?: number; defaultTTL?: number }) {
    if (options?.maxSize) this.maxSize = options.maxSize;
    if (options?.defaultTTL) this.defaultTTL = options.defaultTTL;
  }

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) return undefined;
    
    // Check if expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }
    
    // Update last accessed time
    entry.lastAccessed = Date.now();
    return entry.value as T;
  }

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in milliseconds (optional)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Evict least recently used if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    this.cache.set(key, {
      value,
      expires: Date.now() + (ttl || this.defaultTTL),
      lastAccessed: Date.now()
    });
  }

  /**
   * Delete a value from cache
   * @param key Cache key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0 // Would need to track hits/misses for real hit rate
    };
  }

  /**
   * Get or compute a value
   * @param key Cache key
   * @param compute Function to compute value if not cached
   * @param ttl Optional TTL for the computed value
   */
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;
    
    const value = await compute();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidate cache entries matching a pattern
   * @param pattern Regular expression pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let invalidated = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    return invalidated;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }
}

// Singleton instance for application-wide caching
export const globalCache = new CacheService({
  maxSize: 5000,
  defaultTTL: 300000 // 5 minutes
});

// Specialized caches with different configurations
export const contentCache = new CacheService({
  maxSize: 1000,
  defaultTTL: 600000 // 10 minutes for content
});

export const userCache = new CacheService({
  maxSize: 2000,
  defaultTTL: 180000 // 3 minutes for user data
});

export const challengeCache = new CacheService({
  maxSize: 500,
  defaultTTL: 900000 // 15 minutes for challenges
});

/**
 * Cache key generators for consistent key formatting
 */
export const cacheKeys = {
  user: (userId: number) => `user:${userId}`,
  userProfile: (userId: number) => `user:${userId}:profile`,
  userChallenges: (userId: number) => `user:${userId}:challenges`,
  content: (contentId: number) => `content:${contentId}`,
  contentByTopic: (topic: string) => `content:topic:${topic}`,
  challenge: (challengeId: number) => `challenge:${challengeId}`,
  trendingTopics: () => 'trending:topics',
  dailyFeed: (userId: number) => `feed:daily:${userId}`,
  echoScore: (userId: number) => `echo:${userId}`,
};

/**
 * Decorator for caching method results
 */
export function Cacheable(keyGenerator: (...args: any[]) => string, ttl?: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const key = keyGenerator(...args);
      
      return globalCache.getOrCompute(
        key,
        () => originalMethod.apply(this, args),
        ttl
      );
    };
    
    return descriptor;
  };
} 