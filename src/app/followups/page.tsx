'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Lead } from '@/types';
import { getAllLeads, updateLead, createLead } from '@/lib/dataService';
import { useAuth } from '@/lib/authContext';
import { Header } from '@/components/Header';
import { Priority, LeadStatus } from '@/types';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

export default function FollowUpsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'select' | 'create'>('select');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [formData, setFormData] = useState({ name: '', contact: '', followUpDate: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showOverdue, setShowOverdue] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const loadData = useCallback(async () => {
    if (isAuthenticated) {
      console.log('Loading all leads for follow-ups page...');
      const all = await getAllLeads();
      console.log('All leads fetched:', all.length, all);
      setAllLeads(all);
      
      const today = new Date().toISOString().split('T')[0];
      // Properly convert followUpDate to a comparable format
      const upcoming = all.filter(l => {
        if (!l.followUpDate) return false;
        // Convert followUpDate to string format YYYY-MM-DD if it's a Date object
        const leadDate = typeof l.followUpDate === 'string' 
          ? l.followUpDate 
          : new Date(l.followUpDate).toISOString().split('T')[0];
        return leadDate >= today;
      });
      console.log('Upcoming leads (with future follow-up dates):', upcoming.length);
      upcoming.sort((a, b) => {
        const dateA = typeof a.followUpDate === 'string' 
          ? new Date(a.followUpDate).getTime() 
          : new Date(a.followUpDate).getTime();
        const dateB = typeof b.followUpDate === 'string' 
          ? new Date(b.followUpDate).getTime() 
          : new Date(b.followUpDate).getTime();
        return dateA - dateB;
      });
      setLeads(upcoming);
    }
  }, [isAuthenticated]);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Follow-ups page mounted and authenticated, loading data...');
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const overdueLeads = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return allLeads.filter(l => {
      if (!l.followUpDate) return false;
      // Properly convert to comparable date strings
      const leadDate = typeof l.followUpDate === 'string' 
        ? l.followUpDate 
        : new Date(l.followUpDate).toISOString().split('T')[0];
      const isOverdue = leadDate < today;
      const isNotClosed = l.status !== LeadStatus.CLOSED_WON && l.status !== LeadStatus.CLOSED_LOST;
      return isOverdue && isNotClosed;
    })
      .sort((a, b) => {
        const dateA = typeof a.followUpDate === 'string' 
          ? new Date(a.followUpDate).getTime() 
          : new Date(a.followUpDate).getTime();
        const dateB = typeof b.followUpDate === 'string' 
          ? new Date(b.followUpDate).getTime() 
          : new Date(b.followUpDate).getTime();
        return dateA - dateB;
      });
  }, [allLeads]);

  const filteredLeads = useMemo(() => {
    if (!searchTerm) return leads;
    const term = searchTerm.toLowerCase();
    return leads.filter(l => l.name.toLowerCase().includes(term) || l.contact.toLowerCase().includes(term));
  }, [leads, searchTerm]);

  const groupedLeads = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const groups = { today: [] as Lead[], tomorrow: [] as Lead[], thisWeek: [] as Lead[], later: [] as Lead[] };

    filteredLeads.forEach(lead => {
      if (!lead.followUpDate) return;
      // Convert followUpDate to string format for comparison
      const date = typeof lead.followUpDate === 'string' 
        ? lead.followUpDate 
        : new Date(lead.followUpDate).toISOString().split('T')[0];
      if (date === todayStr) groups.today.push(lead);
      else if (date === tomorrowStr) groups.tomorrow.push(lead);
      else if (date < nextWeekStr) groups.thisWeek.push(lead);
      else groups.later.push(lead);
    });

    return groups;
  }, [filteredLeads]);

  const markComplete = async (lead: Lead) => {
    try {
      console.log('Marking lead complete:', lead.id, 'Current followUpDate:', lead.followUpDate);
      await updateLead(lead.id, { followUpDate: '' });
      console.log('Lead marked complete successfully');
      await loadData();
    } catch (error) {
      console.error('Failed to mark complete:', error);
      alert('Failed to mark complete. Please try again.');
    }
  };

  const skipToTomorrow = async (lead: Lead) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      console.log('Skipping lead to tomorrow:', lead.id, 'New date:', tomorrowStr);
      await updateLead(lead.id, { followUpDate: tomorrowStr });
      console.log('Lead skipped to tomorrow successfully');
      await loadData();
    } catch (error) {
      console.error('Failed to skip to tomorrow:', error);
      alert('Failed to skip to tomorrow. Please try again.');
    }
  };

  const markAsLost = async (lead: Lead) => {
    try {
      console.log('Marking lead as lost:', lead.id);
      await updateLead(lead.id, { status: LeadStatus.CLOSED_LOST, followUpDate: '' });
      console.log('Lead marked as lost successfully');
      await loadData();
    } catch (error) {
      console.error('Failed to mark as lost:', error);
      alert('Failed to mark as lost. Please try again.');
    }
  };

  const markAsWon = async (lead: Lead) => {
    try {
      console.log('Marking lead as won:', lead.id);
      await updateLead(lead.id, { status: LeadStatus.CLOSED_WON, followUpDate: '' });
      console.log('Lead marked as won successfully');
      await loadData();
    } catch (error) {
      console.error('Failed to mark as won:', error);
      alert('Failed to mark as won. Please try again.');
    }
  };

  const handleAddFromExisting = async () => {
    if (!selectedLeadId || !formData.followUpDate) return;
    try {
      console.log('Adding follow-up to existing lead:', selectedLeadId, 'Date:', formData.followUpDate);
      await updateLead(selectedLeadId, { followUpDate: formData.followUpDate });
      console.log('Follow-up added successfully');
      setSelectedLeadId('');
      setFormData({ name: '', contact: '', followUpDate: '' });
      setShowAddModal(false);
      await loadData();
    } catch (error) {
      console.error('Failed to add follow-up:', error);
      alert('Failed to add follow-up. Please try again.');
    }
  };

  const handleAddLead = async () => {
    if (!formData.name.trim() || !formData.contact.trim()) return;
    try {
      console.log('Creating new lead with follow-up:', formData);
      await createLead({
        name: formData.name,
        contact: formData.contact,
        source: 'Direct',
        status: LeadStatus.NEW,
        priority: Priority.MEDIUM,
        followUpDate: formData.followUpDate || '',
        lastMessage: '',
        notes: '',
        templatesUsed: [],
        revenue: 0,
      });
      console.log('Lead created with follow-up successfully');
      setFormData({ name: '', contact: '', followUpDate: '' });
      setShowAddModal(false);
      await loadData();
    } catch (error) {
      console.error('Failed to add lead:', error);
      alert('Failed to add lead. Please try again.');
    }
  };

  const isToday = (date: string) => date === new Date().toISOString().split('T')[0];

  const getPriorityColor = (priority: string) => ({
    [Priority.HIGH]: '#EF4444',
    [Priority.MEDIUM]: '#F59E0B',
    [Priority.LOW]: '#6B7280',
  }[priority] || '#6B7280');

  const totalCount = groupedLeads.today.length + groupedLeads.tomorrow.length + groupedLeads.thisWeek.length + groupedLeads.later.length;
  const overdueCount = overdueLeads.length;

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#E4E4E7' }}>Follow-ups</h1>
            <p className="text-sm" style={{ color: '#6B6B7B' }}>{totalCount} upcoming {overdueCount > 0 && <span style={{ color: '#EF4444' }}>• {overdueCount} overdue</span>}</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm flex-1 sm:flex-none"
              style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26', color: '#E4E4E7', minWidth: '200px' }}
            />
            <button onClick={() => setShowAddModal(true)} className="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
              + Quick Add
            </button>
          </div>
        </div>

        {overdueCount > 0 && (
          <div className="mb-6">
            <button onClick={() => setShowOverdue(!showOverdue)} className="flex items-center gap-2 mb-3 text-sm font-medium" style={{ color: '#EF4444' }}>
              <span className={`transform transition-transform ${showOverdue ? 'rotate-90' : ''}`}>▶</span>
              ⚠️ Overdue ({overdueCount})
            </button>
            {showOverdue && (
              <div className="space-y-2">
                {overdueLeads.map(lead => (
                  <div key={lead.id} className="p-4 rounded-xl border flex items-center justify-between" style={{ backgroundColor: '#14141B', borderColor: '#EF444440' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#EF4444', color: 'white' }}>{lead.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="font-semibold" style={{ color: '#E4E4E7' }}>{lead.name}</p>
                        <p className="text-sm" style={{ color: '#EF4444' }}>Was due: {new Date(lead.followUpDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => markComplete(lead)} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: '#10B981', color: 'white' }}>Done</button>
                      <button onClick={() => skipToTomorrow(lead)} className="px-3 py-1 rounded-lg text-xs" style={{ backgroundColor: '#1C1C26', color: '#8B8B9E' }}>Snooze</button>
                      <button onClick={() => setViewingLead(lead)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: '#6B6B7B' }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {totalCount === 0 ? (
          <div className="text-center py-16 rounded-xl border" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PRIMARY}20 0%, ${PRIMARY_LIGHT}20 100%)` }}>
              <span className="text-4xl">✅</span>
            </div>
            <p className="text-lg font-medium mb-2" style={{ color: '#E4E4E7' }}>All caught up!</p>
            <p className="text-sm" style={{ color: '#6B6B7B' }}>No pending follow-ups. Add follow-up dates to your leads.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedLeads.today.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔥</span>
                  <h2 className="font-semibold" style={{ color: PRIMARY }}>Today</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${PRIMARY}20`, color: PRIMARY }}>{groupedLeads.today.length}</span>
                </div>
                <div className="space-y-2">
                  {groupedLeads.today.map(lead => (
                    <div key={lead.id} className="p-4 rounded-xl border flex items-center justify-between transition-all hover:scale-102" style={{ backgroundColor: '#14141B', borderColor: `${PRIMARY}40` }}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => markComplete(lead)} className="w-6 h-6 rounded-full border-2 flex items-center justify-center hover:scale-110 transition-all" style={{ borderColor: PRIMARY, backgroundColor: PRIMARY }}>
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </button>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#1C1C26', color: PRIMARY }}>{lead.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <p className="font-semibold" style={{ color: '#E4E4E7' }}>{lead.name}</p>
                          <p className="text-sm" style={{ color: '#6B6B7B' }}>{lead.contact}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => skipToTomorrow(lead)} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#1C1C26', color: '#8B8B9E' }} title="Skip to tomorrow">⏭</button>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${getPriorityColor(lead.priority)}20`, color: getPriorityColor(lead.priority) }}>{lead.priority}</span>
                        <button onClick={() => setViewingLead(lead)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: '#6B6B7B' }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {groupedLeads.tomorrow.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📅</span>
                  <h2 className="font-semibold" style={{ color: '#F59E0B' }}>Tomorrow</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}>{groupedLeads.tomorrow.length}</span>
                </div>
                <div className="space-y-2">
                  {groupedLeads.tomorrow.map(lead => (
                    <div key={lead.id} className="p-4 rounded-xl border flex items-center justify-between" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => markComplete(lead)} className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#6B7280' }}></button>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#1C1C26', color: '#6B7280' }}>{lead.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <p className="font-semibold" style={{ color: '#E4E4E7' }}>{lead.name}</p>
                          <p className="text-sm" style={{ color: '#6B6B7B' }}>{lead.contact}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${getPriorityColor(lead.priority)}20`, color: getPriorityColor(lead.priority) }}>{lead.priority}</span>
                        <button onClick={() => setViewingLead(lead)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: '#6B6B7B' }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {groupedLeads.thisWeek.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📆</span>
                  <h2 className="font-semibold" style={{ color: '#3B82F6' }}>This Week</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#3B82F620', color: '#3B82F6' }}>{groupedLeads.thisWeek.length}</span>
                </div>
                <div className="space-y-2">
                  {groupedLeads.thisWeek.map(lead => (
                    <div key={lead.id} className="p-4 rounded-xl border flex items-center justify-between" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => markComplete(lead)} className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#6B7280' }}></button>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#1C1C26', color: '#6B7280' }}>{lead.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <p className="font-semibold" style={{ color: '#E4E4E7' }}>{lead.name}</p>
                          <p className="text-sm" style={{ color: '#6B6B7B' }}>{lead.contact}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm" style={{ color: '#6B6B7B' }}>{new Date(lead.followUpDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <button onClick={() => setViewingLead(lead)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: '#6B6B7B' }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {groupedLeads.later.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">⏰</span>
                  <h2 className="font-semibold" style={{ color: '#6B7280' }}>Later</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#6B728020', color: '#6B7280' }}>{groupedLeads.later.length}</span>
                </div>
                <div className="space-y-2">
                  {groupedLeads.later.map(lead => (
                    <div key={lead.id} className="p-4 rounded-xl border flex items-center justify-between opacity-60" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => markComplete(lead)} className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#6B7280' }}></button>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#1C1C26', color: '#6B7280' }}>{lead.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <p className="font-semibold" style={{ color: '#E4E4E7' }}>{lead.name}</p>
                          <p className="text-sm" style={{ color: '#6B6B7B' }}>{lead.contact}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm" style={{ color: '#6B6B7B' }}>{new Date(lead.followUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <button onClick={() => setViewingLead(lead)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: '#6B6B7B' }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {viewingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setViewingLead(null)}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: '#1C1C26', color: PRIMARY }}>{viewingLead.name.charAt(0).toUpperCase()}</div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: '#E4E4E7' }}>{viewingLead.name}</h3>
                <p className="text-sm" style={{ color: '#6B6B7B' }}>{viewingLead.contact}</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between p-2 rounded-lg" style={{ backgroundColor: '#1C1C26' }}>
                <span className="text-sm" style={{ color: '#8B8B9E' }}>Follow-up</span>
                <span className="text-sm font-medium" style={{ color: isToday(viewingLead.followUpDate) ? PRIMARY : '#E4E4E7' }}>
                  {isToday(viewingLead.followUpDate) ? 'Today' : new Date(viewingLead.followUpDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded-lg" style={{ backgroundColor: '#1C1C26' }}>
                <span className="text-sm" style={{ color: '#8B8B9E' }}>Priority</span>
                <span className="text-sm font-medium" style={{ color: getPriorityColor(viewingLead.priority) }}>{viewingLead.priority}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg" style={{ backgroundColor: '#1C1C26' }}>
                <span className="text-sm" style={{ color: '#8B8B9E' }}>Status</span>
                <span className="text-sm font-medium" style={{ color: '#E4E4E7' }}>{viewingLead.status}</span>
              </div>
              {viewingLead.notes && (
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#1C1C26' }}>
                  <span className="text-sm" style={{ color: '#8B8B9E' }}>Notes</span>
                  <p className="text-sm mt-1" style={{ color: '#E4E4E7' }}>{viewingLead.notes}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { markAsWon(viewingLead); setViewingLead(null); }} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#10B981', color: 'white' }}>Mark Won</button>
              <button onClick={() => { markAsLost(viewingLead); setViewingLead(null); }} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#EF4444', color: 'white' }}>Mark Lost</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => { setShowAddModal(false); setAddMode('select'); }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4" style={{ color: '#E4E4E7' }}>Add Follow-up</h3>
            
            <div className="flex gap-2 mb-4 p-1 rounded-lg" style={{ backgroundColor: '#1C1C26' }}>
              <button onClick={() => setAddMode('select')} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all" style={addMode === 'select' ? { background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' } : { color: '#8B8B9E' }}>
                Select Lead
              </button>
              <button onClick={() => setAddMode('create')} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all" style={addMode === 'create' ? { background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' } : { color: '#8B8B9E' }}>
                New Lead
              </button>
            </div>

            <div className="space-y-4">
              {addMode === 'select' ? (
                <>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Select Existing Lead</label>
                    <select value={selectedLeadId} onChange={e => setSelectedLeadId(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }}>
                      <option value="">Choose a lead...</option>
                      {allLeads.filter(l => l.status !== LeadStatus.CLOSED_WON && l.status !== LeadStatus.CLOSED_LOST).map(lead => (
                        <option key={lead.id} value={lead.id}>{lead.name} - {lead.contact}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Follow-up Date *</label>
                    <input type="date" value={formData.followUpDate} onChange={e => setFormData({ ...formData, followUpDate: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Name *</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Contact *</label>
                    <input type="text" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Follow-up Date</label>
                    <input type="date" value={formData.followUpDate} onChange={e => setFormData({ ...formData, followUpDate: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowAddModal(false); setAddMode('select'); }} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#1C1C26', color: '#8B8B9E' }}>Cancel</button>
              <button onClick={addMode === 'select' ? handleAddFromExisting : handleAddLead} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
                {addMode === 'select' ? 'Add to Lead' : 'Create Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
