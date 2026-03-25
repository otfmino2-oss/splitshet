import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations';
import { signToken, signRefreshToken } from '@/lib/jwt';
import { authRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    if (!authRateLimiter(`login_${ip}`)) {
      return rateLimitResponse();
    }

    // Parse and validate input
    const body = await request.json();
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
      });

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Track successful login
    await prisma.loginAttempt.create({
      data: {
        userId: user.id,
        ipAddress: ip,
        success: true,
      },
    });

    // Generate tokens
    const accessToken = signToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = signRefreshToken(user.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return NextResponse.json(
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
      {
        headers: {
          'Set-Cookie': `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
        },
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
