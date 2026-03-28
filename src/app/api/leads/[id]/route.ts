import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateLeadSchema } from '@/lib/validations';
import { getAuthUserFromRequest } from '@/lib/auth';
import { parseRequestBody, apiErrorToResponse, logError, ApiError } from '@/lib/errorHandler';
import { sanitizeString } from '@/lib/paramParsing';
import { invalidateUserCache } from '@/lib/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sanitize ID
    const sanitizedId = sanitizeString(id, 100);

    const lead = await prisma.lead.findFirst({
      where: {
        id: sanitizedId,
        userId: user.userId,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(lead, {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    logError('get_lead', error);
    return apiErrorToResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const validationResult = updateLeadSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const sanitizedId = sanitizeString(id, 100);
    const leadData = validationResult.data;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (leadData.name) updateData.name = sanitizeString(leadData.name, 255);
    if (leadData.contact) updateData.contact = sanitizeString(leadData.contact, 255);
    if (leadData.source) updateData.source = sanitizeString(leadData.source, 100);
    if (leadData.status) updateData.status = sanitizeString(leadData.status, 50);
    if (leadData.priority) updateData.priority = sanitizeString(leadData.priority, 50);
    if (leadData.lastMessage) updateData.lastMessage = sanitizeString(leadData.lastMessage, 5000);
    if (leadData.notes) updateData.notes = sanitizeString(leadData.notes, 5000);
    if (leadData.revenue !== undefined) updateData.revenue = leadData.revenue;
    
    // Handle followUpDate explicitly - can be set, cleared, or left unchanged
    if ('followUpDate' in (rawBody as Record<string, unknown>)) {
      const followUpDate = (rawBody as Record<string, unknown>).followUpDate;
      if (followUpDate === '' || followUpDate === null) {
        // Clear the follow-up date
        updateData.followUpDate = null;
      } else if (followUpDate) {
        // Set the follow-up date
        updateData.followUpDate = new Date(String(followUpDate));
      }
    }

    const lead = await prisma.lead.updateMany({
      where: {
        id: sanitizedId,
        userId: user.userId,
      },
      data: updateData,
    });

    if (lead.count === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Get the updated lead
    const updatedLead = await prisma.lead.findFirst({
      where: {
        id: sanitizedId,
        userId: user.userId,
      },
    });

    // Invalidate user cache after updating lead
    invalidateUserCache(user.userId);

    return NextResponse.json(updatedLead);
  } catch (error) {
    logError('update_lead', error);
    return apiErrorToResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sanitizedId = sanitizeString(id, 100);

    const lead = await prisma.lead.deleteMany({
      where: {
        id: sanitizedId,
        userId: user.userId,
      },
    });

    if (lead.count === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Invalidate user cache after deleting lead
    invalidateUserCache(user.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('delete_lead', error);
    return apiErrorToResponse(error);
  }
}