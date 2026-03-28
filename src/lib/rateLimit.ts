import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
let cleanupTimer: NodeJS.Timeout | null = null;
const MAX_STORE_SIZE = 10000; // Prevent unlimited memory growth

/**
 * Clean up expired rate limit entries to prevent memory leak
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }

  // If still too large, remove oldest entries (LRU-like behavior)
  if (rateLimitStore.size > MAX_STORE_SIZE) {
    const sortedEntries = Array.from(rateLimitStore.entries())
      .sort((a, b) => a[1].resetTime - b[1].resetTime);
    
    const toRemove = rateLimitStore.size - MAX_STORE_SIZE;
    for (let i = 0; i < toRemove; i++) {
      rateLimitStore.delete(sortedEntries[i][0]);
      cleaned++;
    }
  }

  // Log cleanup stats
  if (cleaned > 0 && process.env.NODE_ENV === 'development') {
    console.log(`[Rate Limit] Cleaned up ${cleaned} entries. Current size: ${rateLimitStore.size}`);
  }
}

/**
 * Schedule periodic cleanup
 */
function ensureCleanupScheduled(): void {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(cleanupExpiredEntries, 60 * 60 * 1000); // 1 hour
    cleanupTimer.unref(); // Don't keep process alive
  }
}

/**
 * Simple rate limiter for API routes
 * Uses in-memory Map (for production, use Redis or Vercel KV)
 */
export function createRateLimiter(
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100
) {
  ensureCleanupScheduled();

  return function rateLimit(key: string): boolean {
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    // Reset if window has passed
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return true;
    }

    // Check if limit exceeded
    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  };
}

/**
 * Get client IP from request
 */
export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  const xri = request.headers.get('x-real-ip');
  
  if (xff) {
    return xff.split(',')[0].trim();
  }
  if (xri) {
    return xri;
  }
  
  return 'unknown';
}

/**
 * Rate limit middleware for auth endpoints
 */
export const authRateLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 minutes
export const apiRateLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes

/**
 * Response for rate limit exceeded
 */
export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { 
      status: 429, 
      headers: { 
        'Retry-After': '900',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0',
      } 
    }
  );
}

/**
 * Get rate limit stats for a key
 */
export function getRateLimitStats(key: string): { count: number; remaining: number; resetTime: number } | null {
  const record = rateLimitStore.get(key);
  if (!record) return null;
  
  return {
    count: record.count,
    remaining: Math.max(0, 100 - record.count),
    resetTime: record.resetTime,
  };
}

/**
 * Clear rate limit for a specific key (useful for testing or admin override)
 */
export function clearRateLimit(key: string): boolean {
  return rateLimitStore.delete(key);
}

/**
 * Get current store size (for monitoring)
 */
export function getRateLimitStoreSize(): number {
  return rateLimitStore.size;
}
