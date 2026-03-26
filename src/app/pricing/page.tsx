'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { PublicNav } from '@/components/PublicNav';
import { PLANS } from '@/types/auth';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

export default function PricingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (!isAuthenticated) {
      router.push('/signup');
      return;
    }

    if (planId === user?.plan) {
      router.push('/account');
      return;
    }

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
        router.push('/account');
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
      <PublicNav />

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#E4E4E7' }}>
              Simple, Transparent <span style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pricing</span>
            </h1>
            <p className="text-xl" style={{ color: '#8B8B9E' }}>
              Start free and upgrade anytime as your business grows
            </p>
          </div>

          {message && (
            <div className={`max-w-4xl mx-auto mb-8 p-4 rounded-lg text-center ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <p style={{ color: message.type === 'success' ? '#10B981' : '#EF4444' }}>
                {message.text}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  plan.highlighted
                    ? 'lg:scale-105 border-opacity-50 order-2 md:order-2'
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
                    className="px-4 py-2 text-sm font-semibold text-center"
                    style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#E4E4E7' }}>
                    {plan.name}
                  </h3>

                  <div className="mb-6">
                    <span className="text-4xl font-bold" style={{ color: PRIMARY }}>
                      ${plan.price}
                    </span>
                    <span className="text-sm ml-2" style={{ color: '#8B8B9E' }}>
                      {plan.period === 'month' ? '/month' : 'one-time'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading && selectedPlan === plan.id}
                    className="w-full py-3 px-4 rounded-lg font-semibold transition-all disabled:opacity-50 mb-6"
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
                      ? '✓ Your Current Plan' 
                      : isAuthenticated ? 'Upgrade Now' : 'Get Started'}
                  </button>

                  <div className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <svg 
                          className="w-5 h-5 flex-shrink-0 mt-0.5" 
                          style={{ color: PRIMARY }} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span style={{ color: '#D4D4D8' }} className="text-sm">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="max-w-4xl mx-auto mt-16 pt-12 border-t" style={{ borderColor: '#1C1C26' }}>
            <h2 className="text-2xl font-bold text-center mb-8" style={{ color: '#E4E4E7' }}>
              Compare All Features
            </h2>
            
            <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: '#0A0A0F', borderBottom: '1px solid #1C1C26' }}>
                      <th className="px-4 py-3 text-left" style={{ color: '#D4D4D8' }}>Feature</th>
                      {PLANS.map(plan => (
                        <th key={plan.id} className="px-4 py-3 text-center" style={{ color: '#D4D4D8' }}>
                          <span className="font-semibold">{plan.name}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Max Leads', values: ['50', 'Unlimited', 'Unlimited', 'Unlimited'] },
                      { name: 'Pipeline Management', values: ['✓', '✓', '✓', '✓'] },
                      { name: 'Analytics', values: ['Basic', 'Full', 'Full', 'Full'] },
                      { name: 'Templates', values: ['5', 'Unlimited', 'Unlimited', 'Unlimited'] },
                      { name: 'AI Features', values: ['✗', '✗', '✓', '✓'] },
                      { name: 'Priority Support', values: ['✗', '✗', '✓', '✓'] },
                      { name: 'API Access', values: ['✗', '✗', '✗', '✓'] },
                    ].map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #1C1C26' }}>
                        <td className="px-4 py-3" style={{ color: '#D4D4D8' }}>
                          {row.name}
                        </td>
                        {row.values.map((value, vIdx) => (
                          <td key={vIdx} className="px-4 py-3 text-center" style={{ color: value === '✗' ? '#6B6B7B' : '#D4D4D8' }}>
                            {value === '✓' ? (
                              <span style={{ color: PRIMARY }}>✓</span>
                            ) : (
                              value
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto mt-16 pt-12 border-t" style={{ borderColor: '#1C1C26' }}>
            <h2 className="text-2xl font-bold text-center mb-8" style={{ color: '#E4E4E7' }}>
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-4">
              {[
                {
                  q: 'Can I start with the free plan?',
                  a: 'Yes! The free plan includes essential features. Upgrade anytime as your business grows.',
                },
                {
                  q: 'Can I cancel my subscription?',
                  a: 'Of course. You can cancel anytime. Lifetime plans are non-refundable after 30 days.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards via Stripe. Monthly and one-time payments available.',
                },
                {
                  q: 'Is there a discount for annual billing?',
                  a: 'Contact us at support@app.com for enterprise pricing and annual billing discounts.',
                },
              ].map((faq, idx) => (
                <div key={idx} className="p-4 rounded-lg" style={{ backgroundColor: '#14141B' }}>
                  <h4 className="font-semibold mb-2" style={{ color: '#E4E4E7' }}>
                    {faq.q}
                  </h4>
                  <p style={{ color: '#8B8B9E' }}>
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="max-w-2xl mx-auto mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#E4E4E7' }}>
              Ready to get started?
            </h2>
            <p className="mb-6" style={{ color: '#8B8B9E' }}>
              {isAuthenticated 
                ? 'Choose a plan above to upgrade' 
                : 'Create a free account now and start managing your leads'}
            </p>
            {!isAuthenticated && (
              <button
                onClick={() => router.push('/signup')}
                className="px-8 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`,
                  color: 'white',
                  boxShadow: `0 10px 40px -15px ${PRIMARY}80`,
                }}
              >
                Start Free
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
