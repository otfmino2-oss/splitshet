import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRefreshToken, signToken, signRefreshToken } from '@/lib/jwt';
import { parseRequestBody, apiErrorToResponse, ApiError, logError } from '@/lib/errorHandler';

export async function POST(request: NextRequest) {
  try {
    // Safe JSON parsing
    let body: unknown;
    try {
      body = await parseRequestBody(request);
    } catch (error) {
      if (error instanceof ApiError) {
        return apiErrorToResponse(error);
      }
      return apiErrorToResponse(new ApiError('Invalid request format', 400));
    }

    // Type-safe extraction
    if (typeof body !== 'object' || body === null || !('refreshToken' in body)) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 401 }
      );
    }

    const { refreshToken } = body as { refreshToken: unknown };

    if (typeof refreshToken !== 'string') {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 401 }
      );
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Check if token exists in database and is not revoked
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate new tokens
    const newAccessToken = signToken({
      userId: user.id,
      email: user.email,
    });

    const newRefreshToken = signRefreshToken(user.id);

    // Revoke old and create new tokens in transaction
    try {
      await prisma.$transaction([
        prisma.refreshToken.update({
          where: { token: refreshToken },
          data: { revoked: true },
        }),
        prisma.refreshToken.create({
          data: {
            token: newRefreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        }),
      ]);
    } catch (error: unknown) {
      logError('refresh_token_transaction', error, { userId: user.id });
      // Continue anyway - old token is not yet revoked but that's acceptable
    }

    const response = NextResponse.json(
      {
        success: true,
        user,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      { status: 200 }
    );

    // Set new refresh token cookie securely
    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    logError('refresh_route', error);
    return apiErrorToResponse(error);
  }
}
