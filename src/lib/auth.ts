import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { JWTPayload } from '@/lib/jwt';

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  userEmail?: string;
}

/**
 * Middleware to verify JWT token from Authorization header
 * Adds userId and userEmail to request object
 */
export async function withAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid authorization header' },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  // Attach user data to request (note: this won't be available in handler unless passed through)
  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.userId);
  response.headers.set('x-user-email', payload.email);

  return { response, userId: payload.userId, userEmail: payload.email };
}

/**
 * Verify auth and return user data or error response
 */
export function getAuthUserFromRequest(request: NextRequest): { userId: string; email: string } | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
  };
}

/**
 * Protect an API route with authentication
 */
export async function protectedRoute(
  request: NextRequest,
  handler: (req: NextRequest, user: { userId: string; email: string }) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = getAuthUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return handler(request, user);
}
