'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Header } from '@/components/Header';
import { getAllLeads, updateLead, createLead } from '@/lib/dataService';
import { Lead, LeadStatus, Priority } from '@/types';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

const statusColumns: { status: LeadStatus; color: string; icon: string }[] = [
  { status: LeadStatus.NEW, color: '#3B82F6', icon: '🆕' },
  { status: LeadStatus.CONTACTED, color: '#F59E0B', icon: '📧' },
  { status: LeadStatus.INTERESTED, color: '#A855F7', icon: '💡' },
  { status: LeadStatus.CLOSED_WON, color: '#10B981', icon: '🎉' },
  { status: LeadStatus.CLOSED_LOST, color: '#EF4444', icon: '❌' },
];

export default function PipelinePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', contact: '', source: '', status: LeadStatus.NEW, priority: Priority.MEDIUM,
    followUpDate: '', lastMessage: '', notes: '', revenue: 0,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      getAllLeads().then(setLeads);
    }
  }, [isAuthenticated]);

  const reload = async () => {
    const leads = await getAllLeads();
    setLeads(leads);
  };

  const getLeadsByStatus = (status: LeadStatus) => leads.filter(l => l.status === status);
  const getStatusTotal = (status: LeadStatus) => getLeadsByStatus(status).reduce((sum, l) => sum + (l.revenue || 0), 0);

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    if (draggedLead && draggedLead.status !== status) {
      try {
        await updateLead(draggedLead.id, { status });
        await reload();
      } catch (error) {
        console.error('Failed to move lead:', error);
        alert('Failed to move lead. Please try again.');
      }
    }
    setDraggedLead(null);
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.contact) return;
    try {
      await createLead({ ...formData, templatesUsed: [] });
      await reload();
      setFormData({ name: '', contact: '', source: '', status: LeadStatus.NEW, priority: Priority.MEDIUM, followUpDate: '', lastMessage: '', notes: '', revenue: 0 });
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add lead:', error);
      alert('Failed to add lead. Please try again.');
    }
  };

  const getPriorityColor = (priority: Priority) => ({
    [Priority.HIGH]: '#EF4444',
    [Priority.MEDIUM]: '#F59E0B',
    [Priority.LOW]: '#6B7280',
  }[priority] || '#6B7280');

  const getStatusColor = (status: LeadStatus) => ({
    [LeadStatus.NEW]: '#3B82F6', [LeadStatus.CONTACTED]: '#F59E0B', [LeadStatus.INTERESTED]: '#A855F7', [LeadStatus.CLOSED_WON]: '#10B981', [LeadStatus.CLOSED_LOST]: '#EF4444',
  }[status] || '#6B7280');

  const totalPipelineValue = leads.reduce((sum, l) => sum + (l.revenue || 0), 0);
  const totalLeads = leads.length;

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
      <main className="px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#E4E4E7' }}>Pipeline</h1>
            <p className="text-sm" style={{ color: '#6B6B7B' }}>Drag & drop leads between stages</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26' }}>
              <span className="text-xs" style={{ color: '#6B6B7B' }}>Pipeline Value</span>
              <p className="text-lg font-bold" style={{ color: '#10B981' }}>${totalPipelineValue.toLocaleString()}</p>
            </div>
            <div className="px-4 py-2 rounded-xl" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26' }}>
              <span className="text-xs" style={{ color: '#6B6B7B' }}>Total Leads</span>
              <p className="text-lg font-bold" style={{ color: '#E4E4E7' }}>{totalLeads}</p>
            </div>
            <button onClick={() => router.push('/followups')} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: '#1C1C26', color: '#8B8B9E', border: '1px solid #2A2A35' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Follow-ups
            </button>
            <button onClick={() => setShowAddModal(true)} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Lead
            </button>
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PRIMARY}20 0%, ${PRIMARY_LIGHT}20 100%)` }}>
              <span className="text-4xl">📊</span>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#E4E4E7' }}>Your Pipeline is Empty</h2>
            <p className="text-sm mb-6" style={{ color: '#8B8B9E' }}>Add leads to start tracking your sales process</p>
            <button onClick={() => setShowAddModal(true)} className="px-6 py-3 rounded-xl font-semibold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
              + Add Your First Lead
            </button>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 180px)' }}>
            {statusColumns.map(({ status, color, icon }) => (
              <div key={status} className="flex-shrink-0 w-72" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)}>
                <div className="sticky top-0 z-10 p-3 rounded-t-xl mb-2" style={{ backgroundColor: '#14141B', borderBottom: `2px solid ${color}` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{icon}</span>
                      <span className="font-semibold text-sm" style={{ color: '#E4E4E7' }}>{status}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${color}20`, color }}>
                      {getLeadsByStatus(status).length}
                    </span>
                  </div>
                  {getStatusTotal(status) > 0 && (
                    <div className="mt-1 text-sm font-bold" style={{ color: '#10B981' }}>
                      ${getStatusTotal(status).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="space-y-2 min-h-96 p-1">
                  {getLeadsByStatus(status).map(lead => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onDragEnd={() => setDraggedLead(null)}
                      onClick={() => setViewingLead(lead)}
                      className="p-4 rounded-xl border cursor-grab active:cursor-grabbing transition-all"
                      style={{
                        backgroundColor: '#14141B',
                        borderColor: draggedLead?.id === lead.id ? color : '#1C1C26',
                        opacity: draggedLead?.id === lead.id ? 0.5 : 1,
                        borderWidth: draggedLead?.id === lead.id ? '2px' : '1px',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: '#E4E4E7' }}>{lead.name}</p>
                          <p className="text-xs truncate" style={{ color: '#6B6B7B' }}>{lead.contact}</p>
                        </div>
                      </div>

                      {lead.revenue > 0 && (
                        <div className="text-lg font-bold mb-2" style={{ color: '#10B981' }}>
                          ${lead.revenue.toLocaleString()}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: `${getPriorityColor(lead.priority)}20`, color: getPriorityColor(lead.priority) }}>
                          {lead.priority}
                        </span>
                        {lead.followUpDate && (
                          <span className="text-xs flex items-center gap-1" style={{ color: '#6B6B7B' }}>
                            📅 {new Date(lead.followUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {lead.source && (
                        <div className="mt-2 text-xs truncate flex items-center gap-1" style={{ color: '#8B8B9E' }}>
                          📍 {lead.source}
                        </div>
                      )}
                    </div>
                  ))}

                  {getLeadsByStatus(status).length === 0 && (
                    <div className="p-8 rounded-xl border border-dashed text-center" style={{ borderColor: '#2A2A35' }}>
                      <p className="text-sm mb-1" style={{ color: '#6B6B7B' }}>Drop leads here</p>
                      <p className="text-xs" style={{ color: '#4A4A55' }}>{status} stage</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {viewingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setViewingLead(null)}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
                {viewingLead.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: '#E4E4E7' }}>{viewingLead.name}</h3>
                <p className="text-sm" style={{ color: '#6B6B7B' }}>{viewingLead.contact}</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {[
                ['Status', <span key="s" className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: `${getStatusColor(viewingLead.status)}20`, color: getStatusColor(viewingLead.status) }}>{viewingLead.status}</span>],
                ['Priority', <span key="p" className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: `${getPriorityColor(viewingLead.priority)}20`, color: getPriorityColor(viewingLead.priority) }}>{viewingLead.priority}</span>],
                ['Revenue', `$${viewingLead.revenue || 0}`],
                ['Source', viewingLead.source || 'Unknown'],
                ['Follow-up', viewingLead.followUpDate ? new Date(viewingLead.followUpDate).toLocaleDateString() : 'Not set'],
              ].map(([label, value], i) => (
                <div key={i} className="flex justify-between p-2 rounded-lg" style={{ backgroundColor: '#1C1C26' }}>
                  <span className="text-sm" style={{ color: '#8B8B9E' }}>{label}</span>
                  <span className="text-sm font-medium" style={{ color: '#E4E4E7' }}>{value}</span>
                </div>
              ))}
            </div>
            {viewingLead.notes && (
              <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: '#1C1C26' }}>
                <p className="text-xs mb-1" style={{ color: '#8B8B9E' }}>Notes</p>
                <p className="text-sm" style={{ color: '#E4E4E7' }}>{viewingLead.notes}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setViewingLead(null)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#1C1C26', color: '#8B8B9E' }}>Close</button>
              <button onClick={() => { router.push('/timeline'); setViewingLead(null); }} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>View Timeline</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6" style={{ color: '#E4E4E7' }}>Add New Lead</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Name *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Contact *</label>
                <input type="text" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} placeholder="email@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Source</label>
                  <input type="text" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} placeholder="Referral" />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Revenue ($)</label>
                  <input type="number" value={formData.revenue} onChange={e => setFormData({ ...formData, revenue: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} placeholder="0" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ backgroundColor: '#1C1C26', color: '#8B8B9E' }}>Cancel</button>
              <button onClick={handleAdd} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>Add Lead</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
