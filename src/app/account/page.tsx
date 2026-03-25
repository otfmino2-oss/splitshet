'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { PLANS } from '@/types/auth';
import { Header } from '@/components/Header';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

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

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile */}
        <div className="rounded-xl border p-6 mb-4" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: '#1C1C26', color: PRIMARY }}>{user.name.charAt(0).toUpperCase()}</div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#E4E4E7' }}>{user.name}</h2>
              <p className="text-sm" style={{ color: '#6B6B7B' }}>{user.email}</p>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="rounded-xl border p-6 mb-4" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#E4E4E7' }}>Subscription</h3>
          <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: '#1C1C26' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold" style={{ backgroundColor: PRIMARY + '20', color: PRIMARY }}>{currentPlan?.name.charAt(0)}</div>
              <div>
                <p className="font-semibold" style={{ color: '#E4E4E7' }}>{currentPlan?.name} Plan</p>
                <p className="text-sm" style={{ color: '#6B6B7B' }}>${currentPlan?.price}/month</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: PRIMARY + '20', color: PRIMARY, border: '1px solid ' + PRIMARY + '30' }}>Active</span>
          </div>
          <button onClick={() => router.push('/pricing')} className="w-full mt-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
            View Plans
          </button>
        </div>

        {/* Quick Links */}
        <div className="rounded-xl border p-6 mb-4" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#E4E4E7' }}>Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Dashboard', path: '/dashboard' },
              { label: 'Revenue & Expenses', path: '/expenses' },
              { label: 'Follow-ups', path: '/followups' },
              { label: 'Pricing', path: '/pricing' },
            ].map(item => (
              <button key={item.path} onClick={() => router.push(item.path)} className="w-full flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-white/5" style={{ backgroundColor: '#1C1C26' }}>
                <span style={{ color: '#E4E4E7' }}>{item.label}</span>
                <svg className="w-4 h-4" style={{ color: '#6B6B7B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            ))}
          </div>
        </div>

        {/* Sign Out */}
        <button onClick={handleLogout} className="w-full py-3 rounded-xl text-sm font-semibold" style={{ backgroundColor: '#1C1C26', color: '#EF4444', border: '1px solid #2A2A35' }}>
          Sign Out
        </button>
      </main>
    </div>
  );
}
