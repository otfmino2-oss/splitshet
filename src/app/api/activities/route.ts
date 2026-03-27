import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { parseRequestBody, apiErrorToResponse, logError, ApiError } from '@/lib/errorHandler';
import { sanitizeString } from '@/lib/paramParsing';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activities = await prisma.activity.findMany({
      where: { userId: user.userId },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(activities);
  } catch (error) {
    logError('get_activities', error);
    return apiErrorToResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Safe JSON parsing
    let body: unknown;
    try {
      body = await parseRequestBody(request);
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

    const { leadId, type, description } = body as Record<string, unknown>;

    if (typeof type !== 'string' || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Type and description are required' },
        { status: 400 }
      );
    }

    // Validate inputs
    const sanitizedType = sanitizeString(type, 50);
    const sanitizedDescription = sanitizeString(description, 5000);

    if (!sanitizedType || !sanitizedDescription) {
      return NextResponse.json(
        { error: 'Type and description cannot be empty' },
        { status: 400 }
      );
    }

    let leadIdValue: string | undefined;
    if (typeof leadId === 'string') {
      const sanitizedLeadId = sanitizeString(leadId, 100);
      leadIdValue = sanitizedLeadId || undefined;
    }

    const activity = await prisma.activity.create({
      data: {
        userId: user.userId,
        leadId: leadIdValue,
        type: sanitizedType,
        description: sanitizedDescription,
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    logError('create_activity', error);
    return apiErrorToResponse(error);
  }
}