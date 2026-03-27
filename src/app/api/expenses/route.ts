import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createExpenseSchema } from '@/lib/validations';
import { getAuthUserFromRequest } from '@/lib/auth';
import { parseRequestBody, apiErrorToResponse, logError, ApiError } from '@/lib/errorHandler';
import { sanitizeString } from '@/lib/paramParsing';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expenses = await prisma.expense.findMany({
      where: { userId: user.userId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    logError('get_expenses', error);
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

    const validationResult = createExpenseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const expenseData = validationResult.data;

    const expense = await prisma.expense.create({
      data: {
        userId: user.userId,
        type: sanitizeString(expenseData.type, 50),
        amount: expenseData.amount,
        date: new Date(expenseData.date),
        description: expenseData.description ? sanitizeString(expenseData.description, 500) : '',
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    logError('create_expense', error);
    return apiErrorToResponse(error);
  }
}