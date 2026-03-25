'use client';

import { useState, useRef, useEffect } from 'react';
import { getAllLeads, getTodayFollowUps, getFinancialSummary, getActivitiesByLeadId } from '@/lib/dataService';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const quickActions = [
  { label: 'Help me prioritize today', prompt: 'What leads should I focus on today? Give me a prioritized list based on urgency and value.' },
  { label: 'Write a follow-up', prompt: 'Help me write a follow-up message for a lead who hasn\'t responded in 3 days. They were interested in our web design services.' },
  { label: 'Analyze my pipeline', prompt: 'Analyze my current pipeline. What\'s going well and what should I improve?' },
  { label: 'Organize my week', prompt: 'Help me organize my week. I need to manage my leads and follow-ups effectively.' },
];

export default function AIChat({ isOpen, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your SplitSheet AI assistant. I can help you:\n\n• Prioritize your leads and follow-ups\n• Write personalized messages\n• Analyze your business performance\n• Organize your workflow\n\nWhat would you like help with today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getContext = () => {
    const leads = getAllLeads();
    const followUps = getTodayFollowUps();
    const financial = getFinancialSummary();
    const recentActivities: string[] = [];

    leads.slice(0, 5).forEach(lead => {
      const activities = getActivitiesByLeadId(lead.id);
      activities.slice(0, 1).forEach(a => {
        recentActivities.push(`${lead.name}: ${a.description.substring(0, 50)}`);
      });
    });

    return {
      totalLeads: leads.length,
      totalRevenue: financial.totalRevenue,
      pendingFollowUps: followUps.length,
      recentActivities,
    };
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          context: getContext(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (prompt: string) => {
    setInput(prompt);
    setTimeout(() => handleSend(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-8rem)] rounded-2xl overflow-hidden shadow-2xl flex flex-col" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26' }}>
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#1C1C26' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)` }}>
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <h3 className="font-bold" style={{ color: '#E4E4E7' }}>AI Assistant</h3>
            <p className="text-xs" style={{ color: '#10B981' }}>Online</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5" style={{ color: '#6B6B7B' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] p-3 rounded-2xl"
              style={{
                backgroundColor: msg.role === 'user' ? `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)` : '#1C1C26',
                color: msg.role === 'user' ? 'white' : '#E4E4E7',
                borderBottomLeftRadius: msg.role === 'user' ? '8px' : '8px',
                borderBottomRightRadius: msg.role === 'user' ? '8px' : '8px',
              }}
            >
              <p className="text-sm whitespace-pre-wrap" style={{ color: msg.role === 'user' ? 'white' : '#D4D4DB' }}>
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-3 rounded-2xl" style={{ backgroundColor: '#1C1C26' }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: PRIMARY, animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: PRIMARY, animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: PRIMARY, animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs mb-2" style={{ color: '#6B6B7B' }}>Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleQuickAction(action.prompt)}
                className="px-3 py-1.5 rounded-lg text-xs transition-all hover:scale-105"
                style={{ backgroundColor: '#1C1C26', color: '#8B8B9E', border: '1px solid #2A2A35' }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 pb-2">
          <p className="text-xs p-2 rounded-lg" style={{ backgroundColor: '#EF444420', color: '#EF4444' }}>{error}</p>
        </div>
      )}

      <div className="p-4 border-t" style={{ borderColor: '#1C1C26' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-2 rounded-xl text-sm focus:outline-none"
            style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 rounded-xl font-semibold transition-all disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
