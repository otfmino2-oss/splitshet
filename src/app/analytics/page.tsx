'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Header } from '@/components/Header';
import { getSourceAnalytics, getRevenueForecast, getAllLeads, getFinancialSummary } from '@/lib/dataService';
import { SourceAnalytics, ForecastData, LeadStatus } from '@/types';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [sourceData, setSourceData] = useState<SourceAnalytics[]>([]);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [financial, setFinancial] = useState({ totalRevenue: 0, totalExpenses: 0, profit: 0, roiFromAds: 0 });
  const [leads, setLeads] = useState<{ total: number; closed: number; lost: number; newCount: number; contacted: number; interested: number; avgDeal: number; conversionRate: number }>({ total: 0, closed: 0, lost: 0, newCount: 0, contacted: 0, interested: 0, avgDeal: 0, conversionRate: 0 });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      const sources = getSourceAnalytics();
      const forecast = getRevenueForecast();
      const fin = getFinancialSummary();
      const allLeads = getAllLeads();
      const closedWonLeads = allLeads.filter(l => l.status === LeadStatus.CLOSED_WON);
      const closedLostLeads = allLeads.filter(l => l.status === LeadStatus.CLOSED_LOST);
      const totalRevenue = closedWonLeads.reduce((sum, l) => sum + (l.revenue || 0), 0);

      setSourceData(sources);
      setForecastData(forecast);
      setFinancial(fin);
      setLeads({
        total: allLeads.length,
        closed: closedWonLeads.length,
        lost: closedLostLeads.length,
        newCount: allLeads.filter(l => l.status === LeadStatus.NEW).length,
        contacted: allLeads.filter(l => l.status === LeadStatus.CONTACTED).length,
        interested: allLeads.filter(l => l.status === LeadStatus.INTERESTED).length,
        avgDeal: closedWonLeads.length > 0 ? Math.round(totalRevenue / closedWonLeads.length) : 0,
        conversionRate: allLeads.length > 0 ? Math.round((closedWonLeads.length / allLeads.length) * 100) : 0,
      });
    }
  }, [isAuthenticated]);

  const maxForecast = Math.max(...forecastData.map(f => Math.max(f.actual, f.predicted)), 1);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0F' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2" style={{ borderColor: PRIMARY, borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#E4E4E7' }}>Analytics</h1>
          <p className="text-sm mt-1" style={{ color: '#6B6B7B' }}>Track your performance and make data-driven decisions</p>
        </div>

        {leads.total === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PRIMARY}20 0%, ${PRIMARY_LIGHT}20 100%)` }}>
              <span className="text-4xl">📊</span>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#E4E4E7' }}>No Data Yet</h2>
            <p className="text-sm mb-6" style={{ color: '#8B8B9E' }}>Add leads and track your pipeline to see analytics</p>
            <button onClick={() => router.push('/dashboard')} className="px-6 py-3 rounded-xl font-semibold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
              {[
                { label: 'Total Leads', value: leads.total, color: '#E4E4E7', icon: '👥' },
                { label: 'Closed Deals', value: leads.closed, color: '#10B981', icon: '✅' },
                { label: 'Avg Deal', value: `$${leads.avgDeal.toLocaleString()}`, color: '#F59E0B', icon: '💰' },
                { label: 'Conversion', value: `${leads.conversionRate}%`, color: PRIMARY_LIGHT, icon: '📈' },
                { label: 'Revenue', value: `$${financial.totalRevenue.toLocaleString()}`, color: '#10B981', icon: '💵' },
                { label: 'Profit', value: `$${financial.profit.toLocaleString()}`, color: financial.profit >= 0 ? '#10B981' : '#EF4444', icon: '📊' },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-xl border" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{stat.icon}</span>
                    <p className="text-xs uppercase tracking-wide" style={{ color: '#6B6B7B' }}>{stat.label}</p>
                  </div>
                  <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="p-6 rounded-xl border" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                <h2 className="text-lg font-bold mb-1" style={{ color: '#E4E4E7' }}>Lead Sources</h2>
                <p className="text-sm mb-6" style={{ color: '#6B6B7B' }}>Where your leads are coming from</p>
                {sourceData.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: '#6B6B7B' }}>Add leads with source info to see breakdown</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sourceData.map((source, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, opacity: 1 - (i * 0.15) }}></div>
                            <span className="text-sm font-medium" style={{ color: '#E4E4E7' }}>{source.source || 'Unknown'}</span>
                          </div>
                          <span className="text-sm font-medium" style={{ color: '#8B8B9E' }}>{source.count} leads ({source.percentage}%)</span>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#1C1C26' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${source.percentage}%`, background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, opacity: 1 - (i * 0.15) }}></div>
                        </div>
                        {source.revenue > 0 && <p className="text-xs mt-1" style={{ color: '#10B981' }}>${source.revenue.toLocaleString()} revenue</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 rounded-xl border" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                <h2 className="text-lg font-bold mb-1" style={{ color: '#E4E4E7' }}>Revenue by Month</h2>
                <p className="text-sm mb-6" style={{ color: '#6B6B7B' }}>Monthly revenue (actual vs predicted)</p>
                <div className="space-y-3">
                  {forecastData.map((month, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs w-10" style={{ color: '#6B6B7B' }}>{month.month.split(' ')[0]}</span>
                      <div className="flex-1 h-6 rounded-lg overflow-hidden flex" style={{ backgroundColor: '#1C1C26' }}>
                        {month.actual > 0 && (
                          <div className="h-full rounded-l-lg" style={{ width: `${(month.actual / maxForecast) * 100}%`, backgroundColor: '#10B981' }}></div>
                        )}
                        {month.predicted > 0 && (
                          <div className="h-full rounded-r-lg" style={{ width: `${(month.predicted / maxForecast) * 100}%`, backgroundColor: `${PRIMARY}40` }}></div>
                        )}
                      </div>
                      <div className="w-16 text-right">
                        <span className="text-sm font-bold" style={{ color: month.actual > 0 ? '#10B981' : month.predicted > 0 ? `${PRIMARY}` : '#6B6B7B' }}>
                          {month.actual > 0 ? `$${month.actual}` : month.predicted > 0 ? `~$${month.predicted}` : '-'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-6 mt-4 pt-4 border-t" style={{ borderColor: '#1C1C26' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10B981' }}></div>
                    <span className="text-xs" style={{ color: '#6B6B7B' }}>Actual</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: `${PRIMARY}40` }}></div>
                    <span className="text-xs" style={{ color: '#6B6B7B' }}>Predicted</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl border" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
              <h2 className="text-lg font-bold mb-6" style={{ color: '#E4E4E7' }}>Performance Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(() => {
                  const topSource = sourceData[0];
                  const avgPredicted = Math.round(forecastData.filter(f => f.predicted > 0).reduce((sum, f) => sum + f.predicted, 0) / Math.max(1, forecastData.filter(f => f.predicted > 0).length));
                  return [
                    { title: 'Best Source', value: topSource?.source || 'N/A', sub: topSource ? `${topSource.percentage}% of leads` : 'Add source data', icon: '🏆', color: '#F59E0B' },
                    { title: 'Total Revenue', value: `$${financial.totalRevenue.toLocaleString()}`, sub: 'From all closed deals', icon: '💰', color: '#10B981' },
                    { title: 'Monthly Forecast', value: `$${avgPredicted}`, sub: 'Predicted monthly revenue', icon: '📈', color: PRIMARY },
                    { title: 'Conversion Rate', value: `${leads.conversionRate}%`, sub: `${leads.closed} of ${leads.total} leads closed`, icon: '🎯', color: PRIMARY_LIGHT },
                  ];
                })().map((insight, i) => (
                  <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: '#1C1C26' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{insight.icon}</span>
                      <span className="text-xs uppercase tracking-wide" style={{ color: '#6B6B7B' }}>{insight.title}</span>
                    </div>
                    <p className="text-2xl font-bold mb-1" style={{ color: insight.color }}>{insight.value}</p>
                    <p className="text-xs" style={{ color: '#6B6B7B' }}>{insight.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
