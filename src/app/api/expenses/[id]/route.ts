import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { apiErrorToResponse, logError } from '@/lib/errorHandler';

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

    // Validate expense ID
    if (!id || id.trim() === '') {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    // Verify expense belongs to user before deletion
    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    if (expense.userId !== user.userId) {
      return NextResponse.json({ error: 'Unauthorized - expense does not belong to user' }, { status: 403 });
    }

    // Delete the expense
    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    logError('delete_expense', error);
    return apiErrorToResponse(error);
  }
}
