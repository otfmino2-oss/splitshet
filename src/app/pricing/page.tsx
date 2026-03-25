'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { PublicNav } from '@/components/PublicNav';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const features = [
    'Unlimited leads',
    'Pipeline management',
    'Revenue tracking',
    'Follow-up reminders',
    'Message templates',
    'Expense tracking',
    'Analytics dashboard',
    'Task management',
    'AI-powered insights',
    'Auto-generate proposals',
    'Smart follow-up suggestions',
    'Email support',
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
      <PublicNav />

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26' }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }}></span>
            <span className="text-sm" style={{ color: '#8B8B9E' }}>100% Free - No credit card required</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#E4E4E7' }}>
            Completely <span style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Free</span> Forever
          </h1>
          <p className="text-xl mb-8" style={{ color: '#8B8B9E' }}>
            SplitSheet is free to use. No plans, no subscriptions, no hidden fees.
          </p>

          <div className="inline-flex items-center gap-3 p-1 rounded-2xl mb-12" style={{ background: `linear-gradient(135deg, ${PRIMARY}20 0%, ${PRIMARY_LIGHT}20 100%)`, border: `1px solid ${PRIMARY}40` }}>
            <div className="px-8 py-3 rounded-xl" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white', boxShadow: `0 4px 20px -5px ${PRIMARY}60` }}>
              <span className="text-3xl font-bold">FREE</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-12">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: '#14141B' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${PRIMARY}20` }}>
                  <svg className="w-4 h-4" style={{ color: PRIMARY }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span style={{ color: '#D4D4D8' }}>{feature}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => router.push(isAuthenticated ? '/dashboard' : '/signup')} 
            className="px-10 py-4 text-lg font-semibold rounded-xl transition-all hover:scale-105"
            style={{ 
              background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, 
              color: 'white',
              boxShadow: `0 10px 40px -15px ${PRIMARY}80`
            }}
          >
            Get Started Free
          </button>

          <p className="text-sm mt-4" style={{ color: '#6B6B7B' }}>
            No credit card required • Takes 30 seconds to start
          </p>
        </div>
      </section>

      <section className="py-16 px-4" style={{ backgroundColor: '#0A0A0F' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#E4E4E7' }}>Why is it free?</h2>
          <div className="space-y-6">
            <div className="p-6 rounded-xl" style={{ backgroundColor: '#14141B' }}>
              <h3 className="font-bold mb-2" style={{ color: '#FAFAFA' }}>We believe in the product</h3>
              <p style={{ color: '#8B8B9E' }}>We built SplitSheet to solve our own problems as freelancers. We know how expensive tools can get. We want to help freelancers succeed without worrying about monthly bills.</p>
            </div>
            <div className="p-6 rounded-xl" style={{ backgroundColor: '#14141B' }}>
              <h3 className="font-bold mb-2" style={{ color: '#FAFAFA' }}>Growing through word-of-mouth</h3>
              <p style={{ color: '#8B8B9E' }}>Instead of spending money on ads, we invest in making the product better. Happy users bring more users - that's our growth strategy.</p>
            </div>
            <div className="p-6 rounded-xl" style={{ backgroundColor: '#14141B' }}>
              <h3 className="font-bold mb-2" style={{ color: '#FAFAFA' }}>Your success is our reward</h3>
              <p style={{ color: '#8B8B9E' }}>When you close more deals and grow your business, you become an advocate for SplitSheet. That's more valuable to us than subscription fees.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ color: '#E4E4E7' }}>Ready to start?</h2>
          <p className="text-lg mb-8" style={{ color: '#8B8B9E' }}>Join 10,000+ freelancers using SplitSheet for free.</p>
          <button 
            onClick={() => router.push(isAuthenticated ? '/dashboard' : '/signup')} 
            className="px-10 py-4 text-lg font-semibold rounded-xl transition-all hover:scale-105"
            style={{ 
              background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, 
              color: 'white',
              boxShadow: `0 10px 40px -15px ${PRIMARY}80`
            }}
          >
            Start Using Free
          </button>
        </div>
      </section>
    </div>
  );
}
