'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { PLANS } from '@/types/auth';
import { Header } from '@/components/Header';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0F' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2" style={{ borderColor: PRIMARY, borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  const currentPlan = PLANS.find(p => p.id === user.plan);

  const handleSelectPlan = async (planId: string) => {
    if (planId === user.plan) return;

    setLoading(true);
    setSelectedPlan(planId);
    setMessage(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/subscription/update-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update plan');
      }

      setMessage({ type: 'success', text: `✓ Successfully upgraded to ${data.user.plan} plan!` });
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update plan' 
      });
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Profile */}
        <div className="rounded-xl border p-6 mb-6" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: '#1C1C26', color: PRIMARY }}>{user.name.charAt(0).toUpperCase()}</div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#E4E4E7' }}>{user.name}</h2>
                <p className="text-sm" style={{ color: '#6B6B7B' }}>{user.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: '#1C1C26', color: '#EF4444', border: '1px solid #2A2A35' }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Current Plan Status */}
        <div className="rounded-xl border p-6 mb-8" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: '#E4E4E7' }}>Your Current Plan</h3>
            <span className="px-4 py-2 rounded-full text-xs font-medium" style={{ backgroundColor: PRIMARY + '20', color: PRIMARY, border: '1px solid ' + PRIMARY + '30' }}>Active</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm" style={{ color: '#6B6B7B' }}>Plan Name</p>
              <p className="text-2xl font-bold" style={{ color: '#E4E4E7' }}>{currentPlan?.name}</p>
            </div>
            <div>
              <p className="text-sm" style={{ color: '#6B6B7B' }}>Billing</p>
              <p className="text-2xl font-bold" style={{ color: '#E4E4E7' }}>
                ${currentPlan?.price}<span style={{ fontSize: '0.5em', color: '#6B6B7B' }}>/{currentPlan?.period === 'month' ? 'month' : 'lifetime'}</span>
              </p>
            </div>
            <div>
              <p className="text-sm" style={{ color: '#6B6B7B' }}>Status</p>
              <p className="text-2xl font-bold" style={{ color: '#10B981' }}>Active</p>
            </div>
          </div>

          {/* Features in Current Plan */}
          <div className="bg-black/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-3" style={{ color: '#D4D4D8' }}>Included Features:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentPlan?.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: PRIMARY }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm" style={{ color: '#D4D4D8' }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-8 p-4 rounded-lg text-center ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            <p style={{ color: message.type === 'success' ? '#10B981' : '#EF4444' }}>
              {message.text}
            </p>
          </div>
        )}

        {/* Upgrade Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-6" style={{ color: '#E4E4E7' }}>Upgrade Your Plan</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl border transition-all ${
                  plan.highlighted
                    ? 'transform scale-105 border-opacity-50'
                    : 'border-opacity-20'
                }`}
                style={{
                  backgroundColor: '#14141B',
                  borderColor: plan.highlighted ? PRIMARY : '#1C1C26',
                  boxShadow: plan.highlighted ? `0 0 40px ${PRIMARY}20` : 'none',
                }}
              >
                {plan.badge && (
                  <div 
                    className="px-4 py-2 text-xs font-semibold text-center"
                    style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className="p-4">
                  <h4 className="text-xl font-bold mb-2" style={{ color: '#E4E4E7' }}>
                    {plan.name}
                  </h4>

                  <div className="mb-4">
                    <span className="text-3xl font-bold" style={{ color: PRIMARY }}>
                      ${plan.price}
                    </span>
                    <span className="text-sm" style={{ color: '#8B8B9E' }}>
                      {plan.period === 'month' ? '/mo' : ' one-time'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading && selectedPlan === plan.id}
                    className="w-full py-2.5 px-3 rounded-lg font-semibold transition-all disabled:opacity-50 mb-4"
                    style={{
                      background: user?.plan === plan.id 
                        ? 'transparent'
                        : `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`,
                      color: user?.plan === plan.id ? PRIMARY : 'white',
                      border: user?.plan === plan.id ? `2px solid ${PRIMARY}` : 'none',
                    }}
                  >
                    {loading && selectedPlan === plan.id 
                      ? 'Upgrading...' 
                      : user?.plan === plan.id 
                      ? '✓ Current' 
                      : 'Select'}
                  </button>

                  <div className="space-y-2 text-xs">
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <svg className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: PRIMARY }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span style={{ color: '#D4D4D8' }}>{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 4 && (
                      <div style={{ color: PRIMARY }} className="font-semibold">
                        +{plan.features.length - 4} more...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="rounded-xl border p-6" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#E4E4E7' }}>Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: 'Dashboard', path: '/dashboard' },
              { label: 'Analytics', path: '/analytics' },
              { label: 'Expenses', path: '/expenses' },
              { label: 'Follow-ups', path: '/followups' },
            ].map(item => (
              <button key={item.path} onClick={() => router.push(item.path)} className="p-3 rounded-lg transition-colors hover:bg-white/5" style={{ backgroundColor: '#1C1C26' }}>
                <span style={{ color: '#E4E4E7' }} className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
