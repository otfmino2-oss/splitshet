import { NextRequest, NextResponse } from 'next/server';
import { generateLeadInsight } from '@/lib/aiClient';
import { protectedRoute } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseRequestBody, apiErrorToResponse, ApiError, logError } from '@/lib/errorHandler';
import { sanitizeString, parseIntSafe } from '@/lib/paramParsing';

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
        logError('insights_no_api_key', new Error('NVIDIA_API_KEY not configured'));
        return NextResponse.json(
          { error: 'AI service unavailable' },
          { status: 503 }
        );
      }

      // Safe JSON parsing
      let body: unknown;
      try {
        body = await parseRequestBody(req);
      } catch (error) {
        if (error instanceof ApiError) {
          return apiErrorToResponse(error);
        }
        return apiErrorToResponse(new ApiError('Invalid request format', 400));
      }

      // Type-safe extraction
      if (typeof body !== 'object' || body === null) {
        return NextResponse.json(
          { error: 'Invalid request format' },
          { status: 400 }
        );
      }

      const { leadName, leadContact, leadStatus, leadPriority, leadRevenue, lastFollowUp, notes, daysSinceCreated } = body as Record<string, unknown>;

      // Validate required fields
      if (typeof leadName !== 'string' || typeof leadContact !== 'string') {
        return NextResponse.json(
          { error: 'Missing required fields: leadName, leadContact' },
          { status: 400 }
        );
      }

      // Sanitize and validate inputs
      const result = await generateLeadInsight({
        leadName: sanitizeString(leadName, 255),
        leadContact: sanitizeString(leadContact, 255),
        leadStatus: typeof leadStatus === 'string' ? sanitizeString(leadStatus, 50) : 'New',
        leadPriority: typeof leadPriority === 'string' ? sanitizeString(leadPriority, 50) : 'Medium',
        leadRevenue: typeof leadRevenue === 'number' ? leadRevenue : 0,
        lastFollowUp: typeof lastFollowUp === 'string' ? lastFollowUp : undefined,
        notes: typeof notes === 'string' ? sanitizeString(notes, 1000) : undefined,
        daysSinceCreated: parseIntSafe(typeof daysSinceCreated === 'string' ? daysSinceCreated : String(daysSinceCreated), 1, 0),
      });

      return NextResponse.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logError('ai_insights_api', error, { userId: user.userId });
      return apiErrorToResponse(new ApiError('Failed to generate insights', 500));
    }
  });
}
