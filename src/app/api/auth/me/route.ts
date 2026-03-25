import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { protectedRoute } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return protectedRoute(request, async (req, user) => {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          subscriptionStatus: true,
          subscriptionEndDate: true,
          createdAt: true,
          lastLogin: true,
        },
      });

      if (!dbUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        user: dbUser,
      });
    } catch (error) {
      console.error('Get me error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
