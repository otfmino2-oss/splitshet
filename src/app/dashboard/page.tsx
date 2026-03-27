'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Lead, LeadStatus, Priority, SourceAnalytics } from '@/types';
import { getDashboardData, createLead, updateLead, deleteLead, invalidateCache } from '@/lib/dataService';
import { useAuth } from '@/lib/authContext';
import { Header } from '@/components/Header';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [financial, setFinancial] = useState({ totalRevenue: 0, totalExpenses: 0, profit: 0, roiFromAds: 0 });
  const [todayFollowUps, setTodayFollowUps] = useState<Lead[]>([]);
  const [sourceData, setSourceData] = useState<SourceAnalytics[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '', contact: '', source: '', status: LeadStatus.NEW, priority: Priority.MEDIUM,
    followUpDate: '', lastMessage: '', notes: '', revenue: 0,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const dashboardData = await getDashboardData();
      setLeads(dashboardData.stats.leads || []);
      setFinancial(dashboardData.financial);
      setTodayFollowUps(dashboardData.todayFollowUps);
      setSourceData(dashboardData.sourceAnalytics);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter(l => l.status === LeadStatus.NEW).length,
    contacted: leads.filter(l => l.status === LeadStatus.CONTACTED).length,
    interested: leads.filter(l => l.status === LeadStatus.INTERESTED).length,
    closedWon: leads.filter(l => l.status === LeadStatus.CLOSED_WON).length,
    closedLost: leads.filter(l => l.status === LeadStatus.CLOSED_LOST).length,
    followUpsToday: todayFollowUps.length,
    conversionRate: leads.length > 0 ? Math.round((leads.filter(l => l.status === LeadStatus.CLOSED_WON).length / leads.length) * 100) : 0,
    pipelineValue: leads.filter(l => l.status !== LeadStatus.CLOSED_WON && l.status !== LeadStatus.CLOSED_LOST).reduce((sum, l) => sum + (l.revenue || 0), 0),
  }), [leads, todayFollowUps]);

  const recentLeads = useMemo(() => {
    return [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  }, [leads]);

  const highPriorityLeads = useMemo(() => {
    return leads.filter(l => l.priority === Priority.HIGH && l.status !== LeadStatus.CLOSED_WON && l.status !== LeadStatus.CLOSED_LOST).slice(0, 3);
  }, [leads]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const resetForm = useCallback(() => {
    setFormData({ name: '', contact: '', source: '', status: LeadStatus.NEW, priority: Priority.MEDIUM, followUpDate: '', lastMessage: '', notes: '', revenue: 0 });
  }, []);

  const handleAdd = useCallback(async () => {
    if (!formData.name || !formData.contact) return;

    try {
      setLoading(true);
      await createLead({
        ...formData,
        templatesUsed: [],
        followUpDate: formData.followUpDate?.trim() ?? '',
      });
      invalidateCache('dashboard');
      await loadData();
      resetForm();
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to create lead:', error);
      alert(error instanceof Error ? error.message : 'Failed to create lead. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, loadData, resetForm]);

  const handleEdit = useCallback(async () => {
    if (!editingLead || !formData.name || !formData.contact) return;

    try {
      setLoading(true);
      await updateLead(editingLead.id, {
        ...formData,
        followUpDate: formData.followUpDate?.trim() ?? '',
      });
      invalidateCache('dashboard');
      await loadData();
      setEditingLead(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update lead:', error);
      alert(error instanceof Error ? error.message : 'Failed to update lead. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [editingLead, formData, loadData, resetForm]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this lead?')) return;

    try {
      setLoading(true);
      await deleteLead(id);
      invalidateCache('dashboard');
      await loadData();
    } catch (error) {
      console.error('Failed to delete lead:', error);
      alert('Failed to delete lead. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  const openEdit = useCallback((lead: Lead) => {
    // Convert followUpDate from ISO string to YYYY-MM-DD format for date input
    const followUpDateValue = lead.followUpDate
      ? new Date(lead.followUpDate).toISOString().split('T')[0]
      : '';

    setFormData({
      name: lead.name,
      contact: lead.contact,
      source: lead.source,
      status: lead.status,
      priority: lead.priority,
      followUpDate: followUpDateValue,
      lastMessage: lead.lastMessage,
      notes: lead.notes,
      revenue: lead.revenue
    });
    setEditingLead(lead);
  }, []);

  const getStatusColor = (status: LeadStatus) => ({
    [LeadStatus.NEW]: '#3B82F6', [LeadStatus.CONTACTED]: '#F59E0B', [LeadStatus.INTERESTED]: '#A855F7', [LeadStatus.CLOSED_WON]: '#10B981', [LeadStatus.CLOSED_LOST]: '#EF4444',
  }[status] || '#6B7280');

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

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#E4E4E7' }}>{getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
            <p className="text-sm mt-1" style={{ color: '#6B6B7B' }}>
              {leads.length === 0 ? 'Get started by adding your first lead' : `You have ${stats.total} leads and ${stats.followUpsToday} follow-ups today`}
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white', boxShadow: `0 4px 15px ${PRIMARY}40` }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Lead
          </button>
        </div>

        {leads.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PRIMARY}20 0%, ${PRIMARY_LIGHT}20 100%)` }}>
              <span className="text-5xl">🚀</span>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#E4E4E7' }}>Welcome to SplitSheet!</h2>
            <p className="text-lg mb-6" style={{ color: '#8B8B9E' }}>Let&apos;s get you started. Add your first lead to begin tracking your business.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
              {[
                { icon: '📊', title: 'Track Pipeline', desc: 'Visualize your sales process' },
                { icon: '🔔', title: 'Follow-ups', desc: 'Never miss a reminder' },
                { icon: '💰', title: 'Revenue', desc: 'Monitor your earnings' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26' }}>
                  <p className="text-2xl mb-2">{item.icon}</p>
                  <p className="font-semibold text-sm" style={{ color: '#E4E4E7' }}>{item.title}</p>
                  <p className="text-xs" style={{ color: '#6B6B7B' }}>{item.desc}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="px-8 py-3 rounded-xl text-base font-semibold"
              style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}
            >
              + Add Your First Lead
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
              {[
                { label: 'Total Leads', value: stats.total, color: '#E4E4E7', icon: '👥' },
                { label: 'New', value: stats.new, color: '#3B82F6', icon: '🆕' },
                { label: 'In Progress', value: stats.contacted + stats.interested, color: PRIMARY, icon: '🔄' },
                { label: 'Won', value: stats.closedWon, color: '#10B981', icon: '🎉' },
              { label: 'Lost', value: stats.closedLost, color: '#EF4444', icon: '❌' },
                { label: 'Pipeline Value', value: `$${stats.pipelineValue.toLocaleString()}`, color: '#10B981', icon: '💰' },
                { label: 'Conversion', value: `${stats.conversionRate}%`, color: '#F59E0B', icon: '📈' },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-xl border transition-all hover:scale-102" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{stat.icon}</span>
                    <p className="text-xs uppercase tracking-wide" style={{ color: '#6B6B7B' }}>{stat.label}</p>
                  </div>
                  <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-1 p-5 rounded-xl border" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                <h2 className="text-sm font-semibold mb-4" style={{ color: '#8B8B9E' }}>Revenue Overview</h2>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { label: 'Revenue', value: `$${financial.totalRevenue.toFixed(0)}`, color: '#10B981' },
                    { label: 'Expenses', value: `$${financial.totalExpenses.toFixed(0)}`, color: '#EF4444' },
                  ].map((stat, i) => (
                    <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: '#1C1C26' }}>
                      <p className="text-xs mb-1" style={{ color: '#6B6B7B' }}>{stat.label}</p>
                      <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: financial.profit >= 0 ? '#10B98115' : '#EF444415', border: `1px solid ${financial.profit >= 0 ? '#10B981' : '#EF4444'}30` }}>
                  <p className="text-xs mb-1" style={{ color: '#6B6B7B' }}>Net Profit</p>
                  <p className="text-2xl font-bold" style={{ color: financial.profit >= 0 ? '#10B981' : '#EF4444' }}>${financial.profit.toFixed(0)}</p>
                </div>
              </div>

              <div className="lg:col-span-1 p-5 rounded-xl border" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                <h2 className="text-sm font-semibold mb-4" style={{ color: '#8B8B9E' }}>Lead Sources</h2>
                {sourceData.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm" style={{ color: '#6B6B7B' }}>Add leads with source info to see breakdown</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sourceData.slice(0, 4).map((source, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium" style={{ color: '#E4E4E7' }}>{source.source || 'Unknown'}</span>
                          <span className="text-xs" style={{ color: '#6B6B7B' }}>{source.count} leads</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1C1C26' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (source.count / Math.max(1, stats.total)) * 100)}%`, background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-1 p-5 rounded-xl border" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold" style={{ color: '#8B8B9E' }}>Today&apos;s Follow-ups</h2>
                  {todayFollowUps.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${PRIMARY}20`, color: PRIMARY }}>{todayFollowUps.length}</span>}
                </div>
                {todayFollowUps.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-2xl mb-2">✅</p>
                    <p className="text-sm" style={{ color: '#6B6B7B' }}>All clear! No follow-ups today.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayFollowUps.slice(0, 4).map(lead => (
                      <div key={lead.id} className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: '#1C1C26' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: '#E4E4E7' }}>{lead.name}</p>
                            <p className="text-xs" style={{ color: '#6B6B7B' }}>{lead.source}</p>
                          </div>
                        </div>
                        <button onClick={() => openEdit(lead)} className="p-1.5 rounded-lg" style={{ backgroundColor: `${PRIMARY}20`, color: PRIMARY }}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </button>
                      </div>
                    ))}
                    {todayFollowUps.length > 4 && (
                      <button onClick={() => router.push('/followups')} className="w-full text-center text-xs py-2" style={{ color: PRIMARY }}>View all {todayFollowUps.length} follow-ups →</button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl border" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold" style={{ color: '#8B8B9E' }}>Recent Leads</h2>
                  <button onClick={() => router.push('/pipeline')} className="text-xs px-3 py-1 rounded-lg" style={{ color: PRIMARY, backgroundColor: `${PRIMARY}10` }}>View Pipeline →</button>
                </div>
                <div className="space-y-2">
                  {recentLeads.length === 0 ? (
                    <p className="text-sm py-4 text-center" style={{ color: '#6B6B7B' }}>No leads yet</p>
                  ) : (
                    recentLeads.map(lead => (
                      <div key={lead.id} className="p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all hover:scale-102" style={{ backgroundColor: '#1C1C26' }} onClick={() => openEdit(lead)}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: getStatusColor(lead.status), color: 'white' }}>
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: '#E4E4E7' }}>{lead.name}</p>
                            <p className="text-xs" style={{ color: '#6B6B7B' }}>{lead.contact}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${getStatusColor(lead.status)}20`, color: getStatusColor(lead.status) }}>{lead.status}</span>
                          {lead.revenue > 0 && <span className="text-xs font-bold" style={{ color: '#10B981' }}>${lead.revenue}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-5 rounded-xl border" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold" style={{ color: '#8B8B9E' }}>⚡ High Priority</h2>
                  {highPriorityLeads.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#EF444420', color: '#EF4444' }}>{highPriorityLeads.length} urgent</span>}
                </div>
                {highPriorityLeads.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-2xl mb-2">🎉</p>
                    <p className="text-sm" style={{ color: '#6B6B7B' }}>No urgent leads — great work!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {highPriorityLeads.map(lead => (
                      <div key={lead.id} className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: '#EF444410', border: '1px solid #EF444430' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#EF4444', color: 'white' }}>
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: '#E4E4E7' }}>{lead.name}</p>
                            <p className="text-xs" style={{ color: '#EF4444' }}>{lead.status} • {lead.source}</p>
                          </div>
                        </div>
                        <button onClick={() => openEdit(lead)} className="text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: '#EF4444', color: 'white' }}>Handle</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 p-5 rounded-xl border" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: '#8B8B9E' }}>⚡ Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button onClick={() => { resetForm(); setShowAddModal(true); }} className="p-4 rounded-xl border text-center transition-all hover:scale-102" style={{ backgroundColor: '#1C1C26', borderColor: '#1C1C26' }}>
                  <p className="text-2xl mb-2">➕</p>
                  <p className="font-semibold text-sm" style={{ color: '#E4E4E7' }}>Add Lead</p>
                </button>
                <button onClick={() => router.push('/tasks')} className="p-4 rounded-xl border text-center transition-all hover:scale-102" style={{ backgroundColor: '#1C1C26', borderColor: '#1C1C26' }}>
                  <p className="text-2xl mb-2">✅</p>
                  <p className="font-semibold text-sm" style={{ color: '#E4E4E7' }}>Add Task</p>
                </button>
                <button onClick={() => router.push('/expenses')} className="p-4 rounded-xl border text-center transition-all hover:scale-102" style={{ backgroundColor: '#1C1C26', borderColor: '#1C1C26' }}>
                  <p className="text-2xl mb-2">💰</p>
                  <p className="font-semibold text-sm" style={{ color: '#E4E4E7' }}>Add Expense</p>
                </button>
                <button onClick={() => router.push('/followups')} className="p-4 rounded-xl border text-center transition-all hover:scale-102" style={{ backgroundColor: '#1C1C26', borderColor: '#1C1C26' }}>
                  <p className="text-2xl mb-2">📅</p>
                  <p className="font-semibold text-sm" style={{ color: '#E4E4E7' }}>View Follow-ups</p>
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { route: '/pipeline', icon: '📊', title: 'Pipeline', desc: 'Drag & drop deals', color: '#3B82F6' },
                { route: '/timeline', icon: '📅', title: 'Timeline', desc: 'Client history', color: PRIMARY },
                { route: '/tasks', icon: '✅', title: 'Tasks', desc: 'Manage tasks', color: '#10B981' },
                { route: '/analytics', icon: '📈', title: 'Analytics', desc: 'Insights & forecasts', color: '#F59E0B' },
              ].map((item, i) => (
                <button key={i} onClick={() => router.push(item.route)} className="p-4 rounded-xl border text-left transition-all hover:scale-102" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                  <p className="text-2xl mb-2">{item.icon}</p>
                  <p className="font-semibold text-sm" style={{ color: '#E4E4E7' }}>{item.title}</p>
                  <p className="text-xs" style={{ color: '#6B6B7B' }}>{item.desc}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </main>

      {(showAddModal || editingLead) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => { setShowAddModal(false); setEditingLead(null); resetForm(); }}>
          <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6" style={{ color: '#E4E4E7' }}>{editingLead ? 'Edit Lead' : 'Add New Lead'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Name *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Contact *</label>
                  <input type="text" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} placeholder="email@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Source</label>
                  <input type="text" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} placeholder="Instagram, Referral..." />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Follow-up Date</label>
                  <input type="date" value={formData.followUpDate} onChange={e => setFormData({ ...formData, followUpDate: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as LeadStatus })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }}>
                    {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value as Priority })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }}>
                    {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Revenue Potential ($)</label>
                <input type="number" value={formData.revenue} onChange={e => setFormData({ ...formData, revenue: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} placeholder="0" />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none resize-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} placeholder="What do you know about this lead?" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowAddModal(false); setEditingLead(null); resetForm(); }} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ backgroundColor: '#1C1C26', color: '#8B8B9E' }}>Cancel</button>
              {editingLead && (
                <button onClick={() => handleDelete(editingLead.id)} className="px-4 py-3 rounded-xl text-sm font-semibold" style={{ backgroundColor: '#EF444420', color: '#EF4444' }}>Delete</button>
              )}
              <button onClick={editingLead ? handleEdit : handleAdd} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
                {editingLead ? 'Save Changes' : 'Add Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
