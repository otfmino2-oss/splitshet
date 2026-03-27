import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations';
import { signToken, signRefreshToken } from '@/lib/jwt';
import { authRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rateLimit';
import { parseRequestBody, apiErrorToResponse, ApiError, logError } from '@/lib/errorHandler';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    if (!authRateLimiter(`login_${ip}`)) {
      return rateLimitResponse();
    }

    // Parse and validate input with improved error handling
    let body: unknown;
    try {
      body = await parseRequestBody(request);
    } catch (error) {
      if (error instanceof ApiError) {
        return apiErrorToResponse(error);
      }
      return apiErrorToResponse(new ApiError('Invalid request format', 400));
    }

    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const { email, password } = validationResult.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        plan: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await compare(password, user.passwordHash);

    if (!passwordMatch) {
      // Track failed login attempt
      await prisma.loginAttempt.create({
        data: {
          userId: user.id,
          ipAddress: ip,
          success: false,
        },
      }).catch((error: unknown) => {
        logError('login_attempt_tracking', error, { userId: user.id });
      });

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login and track successful login in transaction
    try {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        }),
        prisma.loginAttempt.create({
          data: {
            userId: user.id,
            ipAddress: ip,
            success: true,
          },
        }),
      ]);
    } catch (error: unknown) {
      logError('login_transaction', error, { userId: user.id });
      // Continue anyway - tokens were generated successfully
    }

    // Generate tokens
    const accessToken = signToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = signRefreshToken(user.id);

    // Store refresh token
    try {
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    } catch (error: unknown) {
      logError('refresh_token_creation', error, { userId: user.id });
      // Still return tokens but log the issue
    }

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        },
        accessToken,
        refreshToken,
      },
      { status: 200 }
    );

    // Set refresh token cookie securely
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    logError('login_route', error);
    return apiErrorToResponse(error);
  }
}
