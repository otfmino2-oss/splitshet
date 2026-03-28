import { NextRequest, NextResponse } from 'next/server';

/**
 * Add security headers to all responses
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (adjust based on your needs)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );
  
  return response;
}

/**
 * Add performance headers (timing information)
 */
export function addPerformanceHeaders(response: NextResponse, startTime: number): NextResponse {
  const duration = Date.now() - startTime;
  response.headers.set('X-Response-Time', `${duration}ms`);
  response.headers.set('X-Served-By', 'Next.js API');
  
  return response;
}

/**
 * Add CORS headers for API routes
 */
export function addCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  return response;
}

/**
 * Request timeout wrapper
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
  errorMessage: string = 'Request timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Compression helper (checks if response should be compressed)
 */
export function shouldCompress(contentType: string | null): boolean {
  if (!contentType) return false;
  
  const compressibleTypes = [
    'application/json',
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'text/plain',
  ];
  
  return compressibleTypes.some(type => contentType.includes(type));
}

/**
 * Request logging helper
 */
export function logRequest(request: NextRequest, duration?: number): void {
  const { method, url } = request;
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  const logData = {
    method,
    url,
    ip,
    userAgent,
    ...(duration && { duration: `${duration}ms` }),
    timestamp: new Date().toISOString(),
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Request]', JSON.stringify(logData, null, 2));
  } else {
    // In production, use structured logging
    console.log(JSON.stringify(logData));
  }
}

/**
 * Error response helper with proper status codes
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: unknown
): NextResponse {
  const response = NextResponse.json(
    {
      error: message,
      ...(details && process.env.NODE_ENV === 'development' && { details }),
      timestamp: new Date().toISOString(),
    },
    { status }
  );
  
  return addSecurityHeaders(response);
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  headers?: Record<string, string>
): NextResponse {
  const response = NextResponse.json(data, { status });
  
  // Add custom headers if provided
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  
  return addSecurityHeaders(response);
}

/**
 * API route wrapper with automatic error handling and logging
 */
export function apiRoute<T>(
  handler: (request: NextRequest, ...args: any[]) => Promise<T>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const startTime = Date.now();
    
    try {
      // Add request logging
      if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
        logRequest(request);
      }
      
      // Execute handler with timeout
      const result = await withTimeout(
        handler(request, ...args),
        parseInt(process.env.API_TIMEOUT || '30000', 10)
      );
      
      // Create response
      let response: NextResponse;
      if (result instanceof NextResponse) {
        response = result;
      } else {
        response = NextResponse.json(result);
      }
      
      // Add performance and security headers
      response = addPerformanceHeaders(response, startTime);
      response = addSecurityHeaders(response);
      
      return response;
    } catch (error) {
      // Log error
      console.error('[API Error]', {
        url: request.url,
        method: request.method,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Return error response
      const status = error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500;
      
      return errorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        status,
        process.env.NODE_ENV === 'development' ? error : undefined
      );
    }
  };
}
