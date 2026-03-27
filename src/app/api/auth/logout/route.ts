import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseRequestBody, logError } from '@/lib/errorHandler';

export async function POST(request: NextRequest) {
  try {
    // Safe JSON parsing (optional body)
    let body: unknown;
    try {
      body = await parseRequestBody(request);
    } catch {
      body = {}; // Logout can work without body
    }

    // Extract refresh token if provided
    if (typeof body === 'object' && body !== null && 'refreshToken' in body) {
      const refreshToken = (body as { refreshToken: unknown }).refreshToken;
      if (typeof refreshToken === 'string') {
        // Revoke the refresh token
        await prisma.refreshToken.updateMany({
          where: { token: refreshToken },
          data: { revoked: true },
        }).catch((error: unknown) => {
          // Log but don't fail if token revocation fails
          logError('logout_revoke_token', error);
        });
      }
    }

    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    // Clear refresh token cookie
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0, // Immediate expiration
    });

    return response;
  } catch (error) {
    logError('logout_route', error);
    // Even if something fails, clear the cookie and return success
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });
    return response;
  }
}
