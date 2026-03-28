import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { JWTPayload } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

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
 * Note: This is a synchronous function and cannot check DB for token revocation
 * For critical operations, use protectedRoute which can perform async checks
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
 * Checks if user has any active (non-revoked) refresh tokens to validate session
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

  // Check if user has any active refresh tokens (session validation)
  try {
    const activeTokens = await prisma.refreshToken.count({
      where: {
        userId: user.userId,
        revoked: false,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    // If no active tokens, user has logged out from all sessions
    if (activeTokens === 0) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }
  } catch (error) {
    // If DB check fails, log but allow request (fail open for performance)
    console.error('Failed to check active tokens:', error);
  }

  return handler(request, user);
}
