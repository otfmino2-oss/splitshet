import { NextRequest, NextResponse } from 'next/server';
import { composeMessage } from '@/lib/aiClient';
import { protectedRoute } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  return protectedRoute(request, async (req, user) => {
    try {
      // Verify user has AI access
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { plan: true },
      });

      if (dbUser?.plan !== 'ai_pro' && dbUser?.plan !== 'lifetime') {
        return NextResponse.json(
          { error: 'AI features require AI Pro plan' },
          { status: 403 }
        );
      }

      if (!process.env.NVIDIA_API_KEY) {
        console.error('NVIDIA_API_KEY not configured');
        return NextResponse.json(
          { error: 'AI service unavailable' },
          { status: 503 }
        );
      }

      const body = await req.json();
      const { leadName, leadContact, leadSource, leadStatus, action, tone, customContext } = body;

      if (!leadName || !leadContact || !action) {
        return NextResponse.json(
          { error: 'Missing required fields: leadName, leadContact, action' },
          { status: 400 }
        );
      }

      const result = await composeMessage({
        leadName,
        leadContact,
        leadSource: leadSource || '',
        leadStatus: leadStatus || 'New',
        action,
        tone: tone || 'professional',
        customContext,
      });

      return NextResponse.json({
        success: true,
        message: result.message,
        reasoning: result.reasoning,
      });
    } catch (error) {
      console.error('AI Compose API Error:', error);
      return NextResponse.json(
        { error: 'Failed to generate message' },
        { status: 500 }
      );
    }
  });
}
