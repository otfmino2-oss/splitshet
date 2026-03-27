'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { PublicNav } from '@/components/PublicNav';
import { ConversionPopup } from '@/components/ConversionPopup';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => { setIsVisible(true); }, []);

  const features = [
    { icon: '�', title: 'Manage Multiple Clients', desc: 'Handle freelance agency clients and real estate deals without confusion' },
    { icon: '💰', title: 'Track Every Commission', desc: 'Never lose track of payments, commissions, or project milestones' },
    { icon: '📞', title: 'Smart Follow-ups', desc: 'Automated reminders for client check-ins, property showings, and deal closings' },
    { icon: '📊', title: 'Pipeline Visibility', desc: 'See all your deals, projects, and opportunities in one visual dashboard' },
    { icon: '🤖', title: 'AI-Powered Insights', desc: 'Get predictions on which deals will close and which clients need attention' },
    { icon: '⚡', title: 'Close Deals Faster', desc: 'Generate proposals, contracts, and follow-ups in seconds with AI' },
  ];

  const testimonials = [
    { name: 'Marcus R.', role: 'Freelance Agency Owner', quote: 'We went from 5 to 15 clients in 6 months. The pipeline view helps us prioritize the right projects.', avatar: 'MR', rating: 5 },
    { name: 'Jennifer T.', role: 'Real Estate Agent', quote: 'I closed 3 properties last month that I would have lost without the automated follow-ups.', avatar: 'JT', rating: 5 },
    { name: 'David K.', role: 'Digital Marketing Agency', quote: 'Finally, a CRM that understands agency life. We\'re closing 40% more deals since switching.', avatar: 'DK', rating: 5 },
    { name: 'Sarah L.', role: 'Real Estate Team Lead', quote: 'Managing 20 agents and 50+ listings was chaos. Now everything is organized and profitable.', avatar: 'SL', rating: 5 },
  ];

  const howItWorks = [
    { num: '01', title: 'Add Your Leads', desc: 'Import or add contacts in seconds' },
    { num: '02', title: 'Track Conversations', desc: 'See every interaction at a glance' },
    { num: '03', title: 'Get Reminded', desc: 'Never miss a follow-up again' },
    { num: '04', title: 'Close More Deals', desc: 'Watch your revenue grow' },
  ];

  const faqs = [
    { q: 'How is this different from other CRMs?', a: 'Most CRMs are built for enterprise sales teams. This CRM is built for freelance agencies and real estate professionals who need to manage multiple clients, track commissions, and scale their operations without complexity.' },
    { q: 'Can my team use it together?', a: 'Yes! Share access with your agency team or real estate partners. Everyone sees the same pipeline and can collaborate on deals.' },
    { q: 'Will it help me scale my agency?', a: 'Absolutely. Our users typically grow their client base by 30-50% because they never miss follow-ups and always know which opportunities to prioritize.' },
    { q: 'Is it hard to migrate from spreadsheets?', a: 'Not at all. Import your contacts in minutes. No training required - it works the way agencies think.' },
  ];

  const stats = [
    { value: '10,000+', label: 'Agencies & Agents' },
    { value: '$500M+', label: 'Deals Tracked' },
    { value: '4.9/5', label: 'Average Rating' },
  ];

  return (
    <div style={{ backgroundColor: '#030307' }}>
      <PublicNav />

      {/* Hero Section */}
      <section className="min-h-screen relative py-32 px-4 overflow-hidden ">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${PRIMARY} 0%, transparent 70%)` }} />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full opacity-15" style={{ background: `radial-gradient(circle, ${PRIMARY_LIGHT} 0%, transparent 70%)` }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, boxShadow: `0 20px 60px -20px ${PRIMARY}60` }}>
                <span className="text-3xl font-bold text-white">S</span>
              </div>
            </div>

            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ backgroundColor: '#0F0F14', border: '1px solid #1C1C26' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }}></span>
              <span className="text-sm" style={{ color: '#8B8B9E' }}>Trusted by 10,000+ agencies & real estate professionals</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: '#FAFAFA' }}>
              Scale Your Agency & Close More
              <span style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Real Estate Deals
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: '#A1A1AA' }}>
              The CRM built for freelance agencies and real estate teams. Manage clients, track deals, and scale your business without the chaos.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <button 
                onClick={() => router.push(isAuthenticated ? '/dashboard' : '/signup')} 
                className="px-8 py-4 text-base font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, 
                  color: 'white',
                  boxShadow: `0 10px 40px -15px ${PRIMARY}80`
                }}
              >
                Start Scaling Your Agency
              </button>
              <button 
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} 
                className="px-8 py-4 text-base font-semibold rounded-xl transition-all hover:scale-105"
                style={{ backgroundColor: '#18181B', color: '#FAFAFA', border: '1px solid #27272A' }}
              >
                See How It Works
              </button>
            </div>

            <p className="text-sm" style={{ color: '#71717A' }}>
              No credit card required • Takes 30 seconds to start
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4" style={{ backgroundColor: '#0A0A0F' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-12 md:gap-20">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {stat.value}
                </p>
                <p className="text-sm mt-1" style={{ color: '#71717A' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#FAFAFA' }}>
              Built for Agencies & Real Estate Teams That
              <span style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> Scale & Close</span>
            </h2>
            <p className="text-lg" style={{ color: '#A1A1AA' }}>Everything you need to manage clients, track deals, and grow your business</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div 
                key={i} 
                className="group p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02]"
                style={{ 
                  backgroundColor: '#0F0F14', 
                  borderColor: '#18181B',
                  boxShadow: '0 0 0 1px transparent'
                }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all" style={{ backgroundColor: '#18181B' }}>
                  <span className="text-2xl">{f.icon}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#FAFAFA' }}>{f.title}</h3>
                <p className="text-sm" style={{ color: '#71717A' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4" style={{ backgroundColor: '#0A0A0F' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#FAFAFA' }}>Get Started in 30 Seconds</h2>
            <p className="text-lg" style={{ color: '#A1A1AA' }}>No training needed. Just add leads and start closing.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-bold opacity-10" style={{ color: PRIMARY }}>{item.num}</div>
                <div className="relative mt-[-30px]">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#FAFAFA' }}>{item.title}</h3>
                  <p className="text-sm" style={{ color: '#71717A' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#FAFAFA' }}>Freelancers Are Closing More</h2>
            <p className="text-lg" style={{ color: '#A1A1AA' }}>Join thousands who've transformed their business</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div 
                key={i} 
                className="p-6 rounded-2xl"
                style={{ backgroundColor: '#0F0F14', border: '1px solid #18181B' }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <span key={j} style={{ color: '#FBBF24' }}>★</span>
                  ))}
                </div>
                <p className="text-base mb-4" style={{ color: '#D4D4D8' }}>&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: '#FAFAFA' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: '#71717A' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Forever Banner */}
      <section className="py-16 px-4" style={{ backgroundColor: '#0A0A0F' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26' }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }}></span>
            <span className="text-sm" style={{ color: '#8B8B9E' }}>100% Free Forever</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#FAFAFA' }}>No Plans. No Fees. Completely Free.</h2>
          <p className="text-lg mb-8" style={{ color: '#A1A1AA' }}>
            SplitSheet is free to use forever. All features included. No credit card required.
          </p>
          <button 
            onClick={() => router.push(isAuthenticated ? '/dashboard' : '/signup')} 
            className="px-10 py-4 text-base font-semibold rounded-xl transition-all hover:scale-105"
            style={{ 
              background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, 
              color: 'white',
              boxShadow: `0 10px 40px -15px ${PRIMARY}80`
            }}
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#FAFAFA' }}>Questions?</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="p-5 rounded-xl" style={{ backgroundColor: '#0F0F14', border: '1px solid #18181B' }}>
                <h3 className="font-medium mb-2" style={{ color: '#FAFAFA' }}>{faq.q}</h3>
                <p className="text-sm" style={{ color: '#71717A' }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4" style={{ backgroundColor: '#0A0A0F' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ color: '#FAFAFA' }}>Ready to Close More Deals?</h2>
          <p className="text-lg mb-8" style={{ color: '#A1A1AA' }}>Start for free. No credit card required.</p>
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
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4" style={{ borderTop: '1px solid #18181B' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)` }}>
              <span className="text-white font-bold">S</span>
            </div>
            <span className="font-semibold" style={{ color: '#FAFAFA' }}>SplitSheet</span>
          </div>
          <div className="flex gap-6">
            <Link href="/blog" className="text-sm hover:opacity-80" style={{ color: '#71717A' }}>Blog</Link>
            <Link href="/about" className="text-sm hover:opacity-80" style={{ color: '#71717A' }}>About</Link>
            <Link href="/login" className="text-sm hover:opacity-80" style={{ color: '#71717A' }}>Login</Link>
          </div>
          <p className="text-sm" style={{ color: '#52525B' }}>© 2026 SplitSheet</p>
        </div>
      </footer>

      <ConversionPopup page="landing" />
    </div>
  );
}
