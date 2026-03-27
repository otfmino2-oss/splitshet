import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLeadSchema } from '@/lib/validations';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody = await request.json();
    if (rawBody.followUpDate === '') {
      delete rawBody.followUpDate;
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
        name: leadData.name,
        contact: leadData.contact,
        source: leadData.source || '',
        status: leadData.status || 'New',
        priority: leadData.priority || 'Medium',
        followUpDate: leadData.followUpDate ? new Date(leadData.followUpDate) : null,
        lastMessage: leadData.lastMessage || '',
        notes: leadData.notes || '',
        revenue: leadData.revenue || 0,
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Create lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    const where: any = { userId: user.userId };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (source) where.source = source;

    const take = limit ? parseInt(limit) : undefined;
    const skip = offset ? parseInt(offset) : undefined;

    const leads = await prisma.lead.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Get leads error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}