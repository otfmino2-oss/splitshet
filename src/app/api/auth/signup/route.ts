import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signupSchema } from '@/lib/validations';
import { signToken, signRefreshToken } from '@/lib/jwt';
import { authRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rateLimit';
import { parseRequestBody, apiErrorToResponse, ApiError, logError } from '@/lib/errorHandler';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    if (!authRateLimiter(`signup_${ip}`)) {
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

    const validationResult = signupSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { email, password, name } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create user with free plan
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        plan: 'free',
        subscriptionStatus: 'active',
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
      },
    });

    // Generate tokens
    const accessToken = signToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = signRefreshToken(user.id);

    // Store refresh token in database
    try {
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    } catch (error: unknown) {
      logError('signup_refresh_token_creation', error, { userId: user.id });
      // Still continue - tokens will work even if DB storage failed
    }

    // Return success response with tokens
    const response = NextResponse.json(
      {
        success: true,
        user,
        accessToken,
        refreshToken,
      },
      { status: 201 }
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
    logError('signup_route', error);
    return apiErrorToResponse(error);
  }
}
