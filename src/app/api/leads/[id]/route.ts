import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateLeadSchema } from '@/lib/validations';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = updateLeadSchema.safeParse(body);

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

    const lead = await prisma.lead.updateMany({
      where: {
        id: params.id,
        userId: user.userId,
      },
      data: {
        name: leadData.name,
        contact: leadData.contact,
        source: leadData.source || '',
        status: leadData.status || 'New',
        priority: leadData.priority || 'Medium',
        followUpDate: leadData.followUpDate ? new Date(leadData.followUpDate) : null,
        lastMessage: leadData.lastMessage || '',
        notes: leadData.notes || '',
        revenue: leadData.revenue || 0,
        updatedAt: new Date(),
      },
    });

    if (lead.count === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Get the updated lead
    const updatedLead = await prisma.lead.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lead = await prisma.lead.deleteMany({
      where: {
        id: params.id,
        userId: user.userId,
      },
    });

    if (lead.count === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}