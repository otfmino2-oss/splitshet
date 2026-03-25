'use client';

import { useState } from 'react';
import { Lead } from '@/types';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

interface AIComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSaveActivity: (description: string, activityType: string) => void;
}

type MessageAction = 'followup' | 'proposal' | 'welcome' | 'reminder';
type MessageTone = 'professional' | 'friendly' | 'casual';

const actionLabels: Record<MessageAction, { label: string; icon: string; desc: string }> = {
  followup: { label: 'Follow-up', icon: '📧', desc: 'Check in with the lead' },
  proposal: { label: 'Proposal', icon: '📄', desc: 'Send a quote or proposal' },
  welcome: { label: 'Welcome', icon: '👋', desc: 'Greet new leads' },
  reminder: { label: 'Reminder', icon: '⏰', desc: 'Gentle reminder' },
};

const toneLabels: Record<MessageTone, { label: string; desc: string }> = {
  professional: { label: 'Professional', desc: 'Formal and business-appropriate' },
  friendly: { label: 'Friendly', desc: 'Warm and approachable' },
  casual: { label: 'Casual', desc: 'Relaxed and personal' },
};

export default function AIComposeModal({ isOpen, onClose, lead, onSaveActivity }: AIComposeModalProps) {
  const [action, setAction] = useState<MessageAction>('followup');
  const [tone, setTone] = useState<MessageTone>('professional');
  const [customContext, setCustomContext] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');
    setGeneratedMessage('');
    setReasoning('');

    try {
      const response = await fetch('/api/ai/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: lead.name,
          leadContact: lead.contact,
          leadSource: lead.source,
          leadStatus: lead.status,
          action,
          tone,
          customContext: customContext || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate message');
      }

      setGeneratedMessage(data.message);
      setReasoning(data.reasoning || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const handleUse = () => {
    if (generatedMessage) {
      onSaveActivity(generatedMessage, action === 'proposal' ? 'PROPOSAL' : action === 'followup' || action === 'reminder' ? 'EMAIL' : 'NOTE');
      onClose();
      setGeneratedMessage('');
      setReasoning('');
      setCustomContext('');
    }
  };

  const handleClose = () => {
    onClose();
    setGeneratedMessage('');
    setReasoning('');
    setError('');
    setCustomContext('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={handleClose}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26' }} onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b" style={{ borderColor: '#1C1C26' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)` }}>
                <span className="text-lg">✨</span>
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#E4E4E7' }}>AI Message Composer</h2>
                <p className="text-sm" style={{ color: '#6B6B7B' }}>Draft personalized messages for {lead.name}</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 rounded-lg hover:bg-white/5" style={{ color: '#6B6B7B' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {!generatedMessage ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#E4E4E7' }}>What do you want to write?</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(actionLabels).map(([key, { label, icon, desc }]) => (
                    <button
                      key={key}
                      onClick={() => setAction(key as MessageAction)}
                      className="p-4 rounded-xl border text-left transition-all"
                      style={{
                        backgroundColor: action === key ? `${PRIMARY}15` : '#1C1C26',
                        borderColor: action === key ? PRIMARY : '#2A2A35',
                        borderWidth: action === key ? '2px' : '1px',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span>{icon}</span>
                        <span className="font-semibold" style={{ color: '#E4E4E7' }}>{label}</span>
                      </div>
                      <p className="text-xs" style={{ color: '#6B6B7B' }}>{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#E4E4E7' }}>Message tone</label>
                <div className="flex gap-2">
                  {Object.entries(toneLabels).map(([key, { label, desc }]) => (
                    <button
                      key={key}
                      onClick={() => setTone(key as MessageTone)}
                      className="flex-1 p-3 rounded-xl border text-center transition-all"
                      style={{
                        backgroundColor: tone === key ? `${PRIMARY}15` : '#1C1C26',
                        borderColor: tone === key ? PRIMARY : '#2A2A35',
                      }}
                    >
                      <p className="font-medium text-sm" style={{ color: '#E4E4E7' }}>{label}</p>
                      <p className="text-xs mt-1" style={{ color: '#6B6B7B' }}>{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#E4E4E7' }}>
                  Additional context <span style={{ color: '#6B6B7B' }}>(optional)</span>
                </label>
                <textarea
                  value={customContext}
                  onChange={e => setCustomContext(e.target.value)}
                  placeholder="e.g., Mention their specific project needs, reference a previous conversation..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none"
                  style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }}
                />
              </div>

              {error && (
                <div className="p-4 rounded-xl" style={{ backgroundColor: '#EF444420', border: '1px solid #EF4444' }}>
                  <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full py-4 rounded-xl font-semibold text-base transition-all hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  '✨ Generate Message'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {reasoning && (
                <div className="p-4 rounded-xl" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">🤔</span>
                    <span className="text-sm font-medium" style={{ color: '#8B8B9E' }}>AI Reasoning</span>
                  </div>
                  <p className="text-sm" style={{ color: '#6B6B7B' }}>{reasoning}</p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: '#E4E4E7' }}>Generated Message</label>
                  <button
                    onClick={handleCopy}
                    className="text-xs px-3 py-1 rounded-lg transition-all"
                    style={{ backgroundColor: copied ? '#10B98120' : '#1C1C26', color: copied ? '#10B981' : '#8B8B9E' }}
                  >
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                <textarea
                  value={generatedMessage}
                  onChange={e => setGeneratedMessage(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none"
                  style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setGeneratedMessage(''); setReasoning(''); }}
                  className="flex-1 py-3 rounded-xl font-semibold"
                  style={{ backgroundColor: '#1C1C26', color: '#8B8B9E' }}
                >
                  Regenerate
                </button>
                <button
                  onClick={handleUse}
                  className="flex-1 py-3 rounded-xl font-semibold"
                  style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}
                >
                  Use This Message
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex items-center justify-center gap-2" style={{ borderColor: '#1C1C26' }}>
          <span className="text-xs" style={{ color: '#6B6B7B' }}>Powered by</span>
          <span className="text-xs font-medium" style={{ color: PRIMARY }}>DeepSeek R1 via NVIDIA</span>
        </div>
      </div>
    </div>
  );
}
