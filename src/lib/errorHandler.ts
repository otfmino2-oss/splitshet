import { NextResponse } from 'next/server';

/**
 * Centralized error handler with proper logging
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Safe JSON parsing with error handling
 */
export async function safeJsonParse<T>(json: string, fallback?: T): Promise<T | undefined> {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
}

/**
 * Wrap request body parsing with error handling
 */
export async function parseRequestBody<T>(request: Request): Promise<T> {
  try {
    const text = await request.text();
    if (!text) {
      throw new ApiError('Request body is empty', 400);
    }
    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof SyntaxError) {
      throw new ApiError('Invalid JSON in request body', 400);
    }
    throw new ApiError('Failed to parse request body', 400);
  }
}

/**
 * Convert ApiError to NextResponse
 */
export function apiErrorToResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error.details && { details: error.details }),
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  console.error('Unhandled error:', error);
  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
}

/**
 * Log error with context
 */
export function logError(context: string, error: unknown, metadata?: Record<string, unknown>) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${context}]`, errorMessage, metadata || '');
}
