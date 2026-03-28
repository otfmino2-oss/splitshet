import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLeadSchema } from '@/lib/validations';
import { getAuthUserFromRequest } from '@/lib/auth';
import { parseRequestBody, apiErrorToResponse, logError, ApiError } from '@/lib/errorHandler';
import { parseIntSafe, sanitizeString } from '@/lib/paramParsing';
import { invalidateUserCache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Safe JSON parsing
    let rawBody: unknown;
    try {
      rawBody = await parseRequestBody(request);
    } catch (error) {
      if (error instanceof ApiError) {
        return apiErrorToResponse(error);
      }
      return apiErrorToResponse(new ApiError('Invalid request format', 400));
    }

    // Handle empty followUpDate
    if (typeof rawBody === 'object' && rawBody !== null && 'followUpDate' in rawBody) {
      const obj = rawBody as Record<string, unknown>;
      if (obj.followUpDate === '') {
        delete obj.followUpDate;
      }
    }

    const validationResult = createLeadSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const leadData = validationResult.data;

    const lead = await prisma.lead.create({
      data: {
        userId: user.userId,
        name: sanitizeString(leadData.name, 255),
        contact: sanitizeString(leadData.contact, 255),
        source: leadData.source ? sanitizeString(leadData.source, 100) : '',
        status: leadData.status ? sanitizeString(leadData.status, 50) : 'New',
        priority: leadData.priority ? sanitizeString(leadData.priority, 50) : 'Medium',
        followUpDate: leadData.followUpDate ? new Date(leadData.followUpDate) : null,
        lastMessage: leadData.lastMessage ? sanitizeString(leadData.lastMessage, 5000) : '',
        notes: leadData.notes ? sanitizeString(leadData.notes, 5000) : '',
        revenue: leadData.revenue || 0,
      },
    });

    // Invalidate user cache after creating lead
    invalidateUserCache(user.userId);

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    logError('create_lead', error);
    return apiErrorToResponse(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const source = searchParams.get('source');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const fields = searchParams.get('fields');

    const where: any = { userId: user.userId };

    if (status) where.status = sanitizeString(status, 50);
    if (priority) where.priority = sanitizeString(priority, 50);
    if (source) where.source = sanitizeString(source, 100);

    // Safe parseInt with bounds checking
    const take = parseIntSafe(limit, undefined, 1, 100);
    const skip = parseIntSafe(offset, undefined, 0);

    // Support selective field fetching for reduced payload
    const ALLOWED_FIELDS = ['id', 'name', 'contact', 'status', 'priority', 'source', 'revenue', 'createdAt'] as const;
    const select = fields
      ? Object.fromEntries(
          fields
            .split(',')
            .map(f => [f.trim(), true])
            .filter(([f]) => ALLOWED_FIELDS.includes(f as typeof ALLOWED_FIELDS[number]))
        )
      : undefined;

    const leads = await prisma.lead.findMany({
      where,
      take: take || undefined,
      skip: skip || undefined,
      ...(select && { select }),
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(leads, {
      headers: {
        'Cache-Control': 'private, max-age=30',
      },
    });
  } catch (error) {
    logError('get_leads', error);
    return apiErrorToResponse(error);
  }
}