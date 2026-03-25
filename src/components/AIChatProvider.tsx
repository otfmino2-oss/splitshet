'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { hasFeature } from '@/types/auth';
import AIChat from './AIChat';
import Link from 'next/link';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

export default function AIChatProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [hovered, setHovered] = useState(false);

  const canUseAI = user && hasFeature(user.plan, 'aiAssistant');

  const handleChatClick = () => {
    if (isAuthenticated && canUseAI) {
      setHovered(true);
    } else if (isAuthenticated) {
      setShowUpgradeModal(true);
    }
  };

  return (
    <>
      {children}
      
      {isAuthenticated && (
        <button
          onClick={handleChatClick}
          onMouseEnter={() => canUseAI && setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all z-40"
          style={{
            background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`,
            boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
            transform: hovered ? 'scale(1.1)' : 'scale(1)',
          }}
          title={canUseAI ? 'Open AI Assistant' : 'Upgrade to AI Pro'}
        >
          <span className="text-xl">{canUseAI ? '🤖' : '🔒'}</span>
        </button>
      )}

      {canUseAI && <AIChat isOpen={hovered} onClose={() => setHovered(false)} />}

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setShowUpgradeModal(false)}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26' }} onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)` }}>
                <span className="text-3xl">🤖</span>
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#E4E4E7' }}>AI Assistant is an AI Pro Feature</h2>
              <p className="text-sm" style={{ color: '#8B8B9E' }}>
                Upgrade to AI Pro to access our AI Chat Assistant, Message Composer, and Lead Insights.
              </p>
            </div>

            <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: '#1C1C26' }}>
              <p className="text-sm font-semibold mb-3" style={{ color: '#E4E4E7' }}>AI Pro includes:</p>
              <ul className="space-y-2 text-sm" style={{ color: '#8B8B9E' }}>
                <li className="flex items-center gap-2">
                  <span style={{ color: PRIMARY }}>✓</span> AI Chat Assistant
                </li>
                <li className="flex items-center gap-2">
                  <span style={{ color: PRIMARY }}>✓</span> AI Message Composer
                </li>
                <li className="flex items-center gap-2">
                  <span style={{ color: PRIMARY }}>✓</span> AI Lead Insights
                </li>
                <li className="flex items-center gap-2">
                  <span style={{ color: PRIMARY }}>✓</span> Smart Follow-up Suggestions
                </li>
              </ul>
            </div>

            <div className="text-center mb-4">
              <p className="text-2xl font-bold" style={{ color: PRIMARY }}>$35/month</p>
              <p className="text-sm" style={{ color: '#6B6B7B' }}>Cancel anytime</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-3 rounded-lg font-semibold"
                style={{ backgroundColor: '#1C1C26', color: '#8B8B9E' }}
              >
                Maybe Later
              </button>
              <Link
                href="/account"
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-3 rounded-lg font-semibold text-center"
                style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
