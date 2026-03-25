import { NextRequest, NextResponse } from 'next/server';
import { generateLeadInsight } from '@/lib/aiClient';
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
      const { leadName, leadContact, leadStatus, leadPriority, leadRevenue, lastFollowUp, notes, daysSinceCreated } = body;

      if (!leadName || !leadContact) {
        return NextResponse.json(
          { error: 'Missing required fields: leadName, leadContact' },
          { status: 400 }
        );
      }

      const result = await generateLeadInsight({
        leadName,
        leadContact,
        leadStatus: leadStatus || 'New',
        leadPriority: leadPriority || 'Medium',
        leadRevenue: leadRevenue || 0,
        lastFollowUp,
        notes,
        daysSinceCreated: daysSinceCreated || 1,
      });

      return NextResponse.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('AI Insights API Error:', error);
      return NextResponse.json(
        { error: 'Failed to generate insights' },
        { status: 500 }
      );
    }
  });
}
