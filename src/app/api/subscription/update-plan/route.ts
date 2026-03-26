import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SubscriptionPlan } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId } = body;

    // Validate plan
    const validPlans = Object.values(SubscriptionPlan);
    if (!validPlans.includes(planId)) {
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
        plan: planId,
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
    console.error('Subscription update error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
