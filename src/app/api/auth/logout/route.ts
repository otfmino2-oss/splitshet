import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (refreshToken) {
      // Revoke the refresh token
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revoked: true },
      });
    }

    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Set-Cookie': 'refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
        },
      }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
