import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SubscriptionPlan } from '@/types/auth';
import { parseRequestBody, apiErrorToResponse, ApiError, logError } from '@/lib/errorHandler';

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
    if (typeof body !== 'object' || body === null || !('planId' in body)) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    const { planId } = body as { planId: unknown };

    // Validate plan
    const validPlans = Object.values(SubscriptionPlan);
    if (typeof planId !== 'string' || !validPlans.includes(planId as SubscriptionPlan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Determine subscription end date based on plan
    let subscriptionEndDate = null;
    if (planId === SubscriptionPlan.STARTER || planId === SubscriptionPlan.AI_PRO) {
      // Monthly plans - set to 30 days from now
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      subscriptionEndDate = endDate;
    } else if (planId === SubscriptionPlan.LIFETIME) {
      // Lifetime plan - set far in the future (2099)
      subscriptionEndDate = new Date('2099-12-31');
    }

    // Update user plan in database
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: {
        plan: planId as SubscriptionPlan,
        subscriptionStatus: 'active',
        subscriptionEndDate: subscriptionEndDate,
        updatedAt: new Date(),
      },
    });

    // Remove password hash before sending
    const { passwordHash, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${planId} plan`,
      user: userWithoutPassword,
    });
  } catch (error) {
    logError('subscription_update_plan', error);
    return apiErrorToResponse(error);
  }
}
