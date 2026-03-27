import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { LeadStatus, Priority, ExpenseType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all data in parallel with optimized queries
    const [leads, expenses] = await Promise.all([
      prisma.lead.findMany({
        where: { userId: user.userId },
        select: {
          id: true,
          status: true,
          priority: true,
          source: true,
          revenue: true,
          followUpDate: true,
          createdAt: true,
        },
      }),
      prisma.expense.findMany({
        where: { userId: user.userId },
        select: {
          type: true,
          amount: true,
        },
      }),
    ]);

    // Calculate stats in-memory (much faster than multiple DB queries)
    const stats = {
      total: leads.length,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      totalRevenue: 0,
      conversionRate: 0,
    };

    // Initialize counts
    Object.values(LeadStatus).forEach(status => {
      stats.byStatus[status] = 0;
    });

    Object.values(Priority).forEach(priority => {
      stats.byPriority[priority] = 0;
    });

    // Aggregate data in single pass
    let closedWonCount = 0;
    const sourceMap = new Map<string, { count: number; revenue: number }>();
    const todayString = new Date().toISOString().split('T')[0];
    const todayFollowUps: typeof leads = [];

    leads.forEach(lead => {
      // Status and priority counts
      stats.byStatus[lead.status]++;
      stats.byPriority[lead.priority]++;

      // Revenue
      stats.totalRevenue += lead.revenue || 0;

      // Conversion rate
      if (lead.status === LeadStatus.CLOSED_WON) closedWonCount++;

      // Source analytics
      const source = lead.source || 'Unknown';
      const current = sourceMap.get(source) || { count: 0, revenue: 0 };
      sourceMap.set(source, {
        count: current.count + 1,
        revenue: current.revenue + (lead.revenue || 0),
      });

      // Today's follow-ups (check date without full DateTime parsing)
      if (lead.followUpDate) {
        const followUpDateStr = lead.followUpDate.toISOString().split('T')[0];
        if (followUpDateStr === todayString) {
          todayFollowUps.push(lead);
        }
      }
    });

    stats.conversionRate = stats.total > 0 ? (closedWonCount / stats.total) * 100 : 0;

    // Calculate financial summary
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const profit = stats.totalRevenue - totalExpenses;
    const adsExpenses = expenses
      .filter(e => e.type === ExpenseType.META_ADS)
      .reduce((sum, e) => sum + e.amount, 0);
    const roiFromAds = adsExpenses === 0 ? 0 : ((stats.totalRevenue - adsExpenses) / adsExpenses) * 100;

    // Format source analytics
    const sourceAnalytics = Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        count: data.count,
        revenue: data.revenue,
        percentage: stats.total > 0 ? Math.round((data.count / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json(
      {
        stats: { ...stats, leads },
        todayFollowUps,
        financial: {
          totalRevenue: stats.totalRevenue,
          totalExpenses,
          profit,
          roiFromAds,
        },
        sourceAnalytics,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=30',
        },
      }
    );
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
