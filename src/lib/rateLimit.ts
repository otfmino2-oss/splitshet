import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

/**
 * Simple rate limiter for API routes
 * Uses in-memory store (for production, use Redis)
 */
export function createRateLimiter(
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100
) {
  return function rateLimit(key: string): boolean {
    const now = Date.now();

    if (!rateLimitStore[key]) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return true;
    }

    const record = rateLimitStore[key];

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
    { status: 429, headers: { 'Retry-After': '900' } }
  );
}
