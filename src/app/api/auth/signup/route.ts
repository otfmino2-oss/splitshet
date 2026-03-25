import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signupSchema } from '@/lib/validations';
import { signToken, signRefreshToken } from '@/lib/jwt';
import { authRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rateLimit';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    if (!authRateLimiter(`signup_${ip}`)) {
      return rateLimitResponse();
    }

    // Parse and validate input
    const body = await request.json();
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

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        plan: 'starter',
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
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Return success response with tokens (secure cookie should be set by client or middleware)
    return NextResponse.json(
      {
        success: true,
        user,
        accessToken,
        refreshToken,
      },
      {
        status: 201,
        headers: {
          'Set-Cookie': `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
        },
      }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
