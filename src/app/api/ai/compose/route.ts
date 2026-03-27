import { NextRequest, NextResponse } from 'next/server';
import { composeMessage, type ComposeOptions } from '@/lib/aiClient';
import { protectedRoute } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseRequestBody, apiErrorToResponse, ApiError, logError } from '@/lib/errorHandler';
import { sanitizeString } from '@/lib/paramParsing';

const VALID_ACTIONS = ['followup', 'proposal', 'welcome', 'reminder'] as const;
const VALID_TONES = ['professional', 'friendly', 'casual'] as const;

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
        logError('compose_no_api_key', new Error('NVIDIA_API_KEY not configured'));
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

      const { leadName, leadContact, leadSource, leadStatus, action, tone, customContext } = body as Record<string, unknown>;

      // Validate required fields
      if (typeof leadName !== 'string' || typeof leadContact !== 'string' || typeof action !== 'string') {
        return NextResponse.json(
          { error: 'Missing required fields: leadName, leadContact, action' },
          { status: 400 }
        );
      }

      // Validate action
      if (!VALID_ACTIONS.includes(action as any)) {
        return NextResponse.json(
          { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
          { status: 400 }
        );
      }

      // Validate tone if provided
      if (typeof tone === 'string' && !VALID_TONES.includes(tone as any)) {
        return NextResponse.json(
          { error: `Invalid tone. Must be one of: ${VALID_TONES.join(', ')}` },
          { status: 400 }
        );
      }

      // Sanitize inputs
      const composeOptions: ComposeOptions = {
        leadName: sanitizeString(leadName, 255),
        leadContact: sanitizeString(leadContact, 255),
        leadSource: typeof leadSource === 'string' ? sanitizeString(leadSource, 100) : '',
        leadStatus: typeof leadStatus === 'string' ? sanitizeString(leadStatus, 50) : 'New',
        action: action as ComposeOptions['action'],
        tone: (typeof tone === 'string' ? (VALID_TONES.includes(tone as any) ? tone : 'professional') : 'professional') as ComposeOptions['tone'],
        customContext: typeof customContext === 'string' ? sanitizeString(customContext, 1000) : undefined,
      };

      const result = await composeMessage(composeOptions);

      return NextResponse.json({
        success: true,
        message: result.message,
        reasoning: result.reasoning,
      });
    } catch (error) {
      logError('ai_compose_api', error, { userId: user.userId });
      return apiErrorToResponse(new ApiError('Failed to generate message', 500));
    }
  });
}
