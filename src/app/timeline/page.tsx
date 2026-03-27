'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Header } from '@/components/Header';
import { getAllLeads, getActivitiesByLeadId, addActivity } from '@/lib/dataService';
import { Lead, Activity, ActivityType } from '@/types';
import { hasFeature } from '@/types/auth';
import AIComposeModal from '@/components/AIComposeModal';
import Link from 'next/link';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

const activityIcons: Record<ActivityType, string> = {
  [ActivityType.NOTE]: '📝',
  [ActivityType.CALL]: '📞',
  [ActivityType.EMAIL]: '✉️',
  [ActivityType.MEETING]: '🤝',
  [ActivityType.PROPOSAL]: '📄',
  [ActivityType.PAYMENT]: '💰',
  [ActivityType.STATUS_CHANGE]: '🔄',
};

export default function TimelinePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAICompose, setShowAICompose] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [newActivity, setNewActivity] = useState({ type: ActivityType.NOTE, description: '' });

  const canUseAI = user && hasFeature(user.plan, 'aiMessageComposer');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      getAllLeads().then(setLeads);
      if (selectedLead) {
        getActivitiesByLeadId(selectedLead.id).then(setActivities);
      }
    }
  }, [isAuthenticated, selectedLead]);

  const handleAddActivity = async (description?: string, type?: string) => {
    if (!selectedLead) return;
    const desc = description || newActivity.description;
    const actType = type ? (type as ActivityType) : newActivity.type;
    if (!desc.trim()) return;
    await addActivity(selectedLead.id, actType, desc);
    const activities = await getActivitiesByLeadId(selectedLead.id);
    setActivities(activities);
    setNewActivity({ type: ActivityType.NOTE, description: '' });
    setShowAddModal(false);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#E4E4E7' }}>Client Timeline</h1>
          {selectedLead && (
            canUseAI ? (
              <button
                onClick={() => setShowAICompose(true)}
                className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}
              >
                <span>✨</span>
                AI Write
              </button>
            ) : (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                style={{ backgroundColor: '#1C1C26', color: '#8B8B9E', border: '1px solid #2A2A35' }}
              >
                <span>🔒</span>
                AI Write
              </button>
            )
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="p-4 rounded-xl border" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: '#8B8B9E' }}>Select Client</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {leads.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: '#6B6B7B' }}>No clients yet</p>
                ) : (
                  leads.map(lead => (
                    <button
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="w-full p-3 rounded-lg text-left transition-all"
                      style={{ backgroundColor: selectedLead?.id === lead.id ? `${PRIMARY}20` : '#1C1C26', border: selectedLead?.id === lead.id ? `1px solid ${PRIMARY}` : '1px solid transparent' }}
                    >
                      <p className="font-semibold text-sm truncate" style={{ color: '#E4E4E7' }}>{lead.name}</p>
                      <p className="text-xs truncate" style={{ color: '#6B6B7B' }}>{lead.contact}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedLead ? (
              <div className="p-6 rounded-xl border" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
                      {selectedLead.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold" style={{ color: '#E4E4E7' }}>{selectedLead.name}</h2>
                      <p className="text-sm" style={{ color: '#6B6B7B' }}>{selectedLead.contact}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddModal(true)} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#1C1C26', color: '#E4E4E7' }}>
                    + Add Activity
                  </button>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#1C1C26', color: '#8B8B9E' }}>Status: {selectedLead.status}</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#1C1C26', color: '#8B8B9E' }}>Revenue: ${selectedLead.revenue || 0}</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#1C1C26', color: '#8B8B9E' }}>Source: {selectedLead.source || 'Unknown'}</span>
                </div>

                {activities.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-lg font-medium mb-2" style={{ color: '#E4E4E7' }}>No activities yet</p>
                    <p className="text-sm" style={{ color: '#6B6B7B' }}>Add your first activity to start tracking</p>
                    <button
                      onClick={() => setShowAICompose(true)}
                      className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold"
                      style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}
                    >
                      ✨ Write with AI
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5" style={{ backgroundColor: '#1C1C26' }}></div>
                    <div className="space-y-4">
                      {activities.map(activity => (
                        <div key={activity.id} className="relative flex gap-4 pl-12">
                          <div className="absolute left-4 w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: '#1C1C26' }}>
                            {activityIcons[activity.type] || '📝'}
                          </div>
                          <div className="flex-1 p-4 rounded-lg" style={{ backgroundColor: '#1C1C26' }}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: `${PRIMARY}20`, color: PRIMARY }}>{activity.type}</span>
                              <span className="text-xs" style={{ color: '#6B6B7B' }}>{formatDate(activity.date)}</span>
                            </div>
                            <p className="text-sm" style={{ color: '#D4D4DB' }}>{activity.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 rounded-xl border text-center" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                <p className="text-lg font-medium mb-2" style={{ color: '#E4E4E7' }}>Select a client</p>
                <p className="text-sm" style={{ color: '#6B6B7B' }}>Choose a client from the left to view their timeline</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {showAddModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6" style={{ color: '#E4E4E7' }}>Add Activity</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Type</label>
                <select value={newActivity.type} onChange={e => setNewActivity({ ...newActivity, type: e.target.value as ActivityType })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }}>
                  {Object.values(ActivityType).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Description</label>
                <textarea value={newActivity.description} onChange={e => setNewActivity({ ...newActivity, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none resize-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} placeholder="What happened?" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#1C1C26', color: '#8B8B9E' }}>Cancel</button>
              {canUseAI ? (
                <button onClick={() => { setShowAddModal(false); setShowAICompose(true); }} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
                  ✨ AI Help
                </button>
              ) : (
                <button onClick={() => { setShowAddModal(false); setShowUpgradeModal(true); }} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#1C1C26', color: '#8B8B9E' }}>
                  🔒 AI Pro
                </button>
              )}
              <button onClick={() => handleAddActivity()} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: PRIMARY, color: 'white' }}>Add</button>
            </div>
          </div>
        </div>
      )}

      {selectedLead && canUseAI && (
        <AIComposeModal
          isOpen={showAICompose}
          onClose={() => setShowAICompose(false)}
          lead={selectedLead}
          onSaveActivity={(description, activityType) => handleAddActivity(description, activityType)}
        />
      )}

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setShowUpgradeModal(false)}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26' }} onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)` }}>
                <span className="text-3xl">🤖</span>
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#E4E4E7' }}>AI Features Require AI Pro</h2>
              <p className="text-sm" style={{ color: '#8B8B9E' }}>
                Upgrade to AI Pro to access AI Message Composer and other AI features.
              </p>
            </div>
            <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: '#1C1C26' }}>
              <p className="text-sm font-semibold mb-3" style={{ color: '#E4E4E7' }}>AI Pro includes:</p>
              <ul className="space-y-2 text-sm" style={{ color: '#8B8B9E' }}>
                <li className="flex items-center gap-2"><span style={{ color: PRIMARY }}>✓</span> AI Message Composer</li>
                <li className="flex items-center gap-2"><span style={{ color: PRIMARY }}>✓</span> AI Chat Assistant</li>
                <li className="flex items-center gap-2"><span style={{ color: PRIMARY }}>✓</span> AI Lead Insights</li>
              </ul>
            </div>
            <div className="text-center mb-4">
              <p className="text-2xl font-bold" style={{ color: PRIMARY }}>$35/month</p>
              <p className="text-sm" style={{ color: '#6B6B7B' }}>Cancel anytime</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowUpgradeModal(false)} className="flex-1 py-3 rounded-lg font-semibold" style={{ backgroundColor: '#1C1C26', color: '#8B8B9E' }}>Maybe Later</button>
              <Link href="/account" onClick={() => setShowUpgradeModal(false)} className="flex-1 py-3 rounded-lg font-semibold text-center" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>Upgrade Now</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
