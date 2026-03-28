import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { LeadStatus, Priority, ExpenseType } from '@/types';
import { logError, apiErrorToResponse } from '@/lib/errorHandler';
import { cache, CacheKeys } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check cache first
    const cacheKey = CacheKeys.userDashboard(user.userId);
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'private, max-age=30',
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch all data in parallel with optimized queries
    const [leads, expenses] = await Promise.all([
      prisma.lead.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
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
    const todayDate = new Date();
    const todayString = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
    const todayFollowUps: typeof leads = [];

    leads.forEach(lead => {
      // Status and priority counts - with safety checks
      const status = lead.status || 'Unknown';
      const priority = lead.priority || 'Medium';
      
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;

      // Revenue - with NaN check
      const revenue = lead.revenue ?? 0;
      if (typeof revenue === 'number' && !isNaN(revenue)) {
        stats.totalRevenue += revenue;
      }

      // Conversion rate
      if (status === LeadStatus.CLOSED_WON) closedWonCount++;

      // Source analytics
      const source = lead.source || 'Unknown';
      const current = sourceMap.get(source) || { count: 0, revenue: 0 };
      sourceMap.set(source, {
        count: current.count + 1,
        revenue: current.revenue + (revenue || 0),
      });

      // Today's follow-ups
      if (lead.followUpDate) {
        try {
          const followUpDateObj = lead.followUpDate instanceof Date ? lead.followUpDate : new Date(lead.followUpDate);
          if (!isNaN(followUpDateObj.getTime())) {
            const followUpDateStr = `${followUpDateObj.getFullYear()}-${String(followUpDateObj.getMonth() + 1).padStart(2, '0')}-${String(followUpDateObj.getDate()).padStart(2, '0')}`;
            if (followUpDateStr === todayString) {
              todayFollowUps.push(lead);
            }
          }
        } catch (e) {
          logError('dashboard_parse_date', e, { leadId: lead.id });
        }
      }
    });

    stats.conversionRate = stats.total > 0 ? (closedWonCount / stats.total) * 100 : 0;

    // Calculate financial summary with safety checks
    const totalExpenses = expenses.reduce((sum, expense) => {
      const amount = expense.amount ?? 0;
      return sum + (typeof amount === 'number' ? amount : 0);
    }, 0);
    
    const profit = stats.totalRevenue - totalExpenses;
    const adsExpenses = expenses
      .filter(e => e.type === ExpenseType.META_ADS)
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);
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

    const responseData = {
      leads,
      stats: {
        total: stats.total,
        byStatus: stats.byStatus,
        byPriority: stats.byPriority,
        totalRevenue: stats.totalRevenue,
        conversionRate: stats.conversionRate,
      },
      todayFollowUps,
      financial: {
        totalRevenue: stats.totalRevenue,
        totalExpenses,
        profit,
        roiFromAds,
      },
      sourceAnalytics,
    };

    // Cache for 30 seconds
    cache.set(cacheKey, responseData, 30);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'private, max-age=30',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    logError('dashboard_summary', error);
    return apiErrorToResponse(error);
  }
}
