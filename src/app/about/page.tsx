'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { PublicNav } from '@/components/PublicNav';
import { ConversionPopup } from '@/components/ConversionPopup';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

export default function AboutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const team = [
    { name: 'Alex Chen', role: 'Founder & CEO', bio: 'Former freelancer turned SaaS builder. Built our CRM to solve agency and real estate management challenges after seeing too many teams struggle with spreadsheets.', avatar: 'AC', linkedin: '#' },
    { name: 'Maria Santos', role: 'Head of Design', bio: 'Design systems expert with 12+ years creating intuitive interfaces. Previously at Figma and Stripe. Passionate about making complex tools simple for busy professionals.', avatar: 'MS', linkedin: '#' },
    { name: 'David Kim', role: 'Lead Engineer', bio: 'Full-stack developer passionate about performance and developer experience. Built scalable systems for agencies and real estate teams before joining.', avatar: 'DK', linkedin: '#' },
    { name: 'Sarah Johnson', role: 'Head of Customer Success', bio: 'Customer advocate with 8+ years in SaaS. Former agency owner and real estate team lead who understands scaling challenges.', avatar: 'SJ', linkedin: '#' },
    { name: 'James Rivera', role: 'AI/ML Engineer', bio: 'Machine learning specialist focused on making AI practical for agencies and real estate. PhD from Stanford, now making AI accessible to service businesses.', avatar: 'JR', linkedin: '#' },
    { name: 'Emily Zhang', role: 'Head of Marketing', bio: 'Growth marketer with a background in agency consulting. Knows what resonates with agencies and real estate professionals because she works with them daily.', avatar: 'EZ', linkedin: '#' },
  ];

  const testimonials = [
    { quote: 'This CRM transformed our agency from chaos to organized growth. We\'re closing 3x more projects now.', name: 'Marcus Rodriguez', role: 'Agency Owner', avatar: 'MR' },
    { quote: 'Finally, a CRM designed for real estate teams. Our commission tracking alone saved us thousands.', name: 'Jennifer Walsh', role: 'Real Estate Team Lead', avatar: 'JW' },
    { quote: 'The team collaboration features are incredible. No more lost leads or miscommunication.', name: 'David Park', role: 'Real Estate Broker', avatar: 'DP' },
    { quote: 'Best investment for our agency. The AI features help us scale without hiring more admin staff.', name: 'Lisa Chen', role: 'Marketing Agency CEO', avatar: 'LC' },
  ];

  const values = [
    { icon: '👥', title: 'Built for Teams', desc: 'We believe great software should scale with your business. Every feature we build must work for agencies and real estate teams, not just solo operators.' },
    { icon: '🔒', title: 'Privacy First', desc: 'Your client relationships and business data are your most valuable assets. We never sell, share, or use your data for anything other than making our CRM better.' },
    { icon: '📈', title: 'Growth Focused', desc: 'We\'d rather help you scale your business than add features you don\'t need. Focus on what drives revenue and team productivity.' },
    { icon: '🤝', title: 'Customer Success', desc: 'We\'re not just building software — we\'re helping agencies and real estate teams build sustainable, profitable businesses. Your success is our success.' },
    { icon: '⚡', title: 'Efficiency Obsessed', desc: 'Agencies and agents don\'t have time to waste on complex software. Every second saved is a second you can spend serving clients.' },
    { icon: '🎯', title: 'Industry Expertise', desc: 'Built by people who understand agency life and real estate challenges. No generic solutions — just tools that work for your specific business.' },
  ];

  const milestones = [
    { year: '2024', event: 'Founded', desc: 'Born from seeing agencies and real estate teams struggle with outdated CRM solutions' },
    { year: '2024', event: 'Beta Launch', desc: 'Launched private beta with 200 agencies and real estate teams, refined based on real workflow needs' },
    { year: '2025', event: 'Public Launch', desc: 'Opened to the public with team collaboration and commission tracking features' },
    { year: '2025', event: 'AI Features', desc: 'Introduced AI Assistant for Agency Pro subscribers, revolutionizing client communication' },
    { year: '2026', event: '10,000 Users', desc: 'Celebrated 10,000 active agencies and $500M+ deals tracked' },
    { year: '2026', event: 'Mobile Apps', desc: 'Launching iOS and Android apps for agencies and agents working on the go' },
  ];

  const stats = [
    { value: '10,000+', label: 'Agencies & Teams' },
    { value: '$50M+', label: 'Revenue Tracked' },
    { value: '150+', label: 'Countries' },
    { value: '4.9/5', label: 'Average Rating' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
      <PublicNav />

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#E4E4E7' }}>
            About <span style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SplitSheet</span>
          </h1>
          <p className="text-xl mb-8" style={{ color: '#8B8B9E' }}>We&apos;re on a mission to help freelancers and small agencies manage their clients without the complexity.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-4 rounded-xl" style={{ backgroundColor: '#14141B' }}>
                <p className="text-3xl font-bold mb-1" style={{ color: PRIMARY }}>{stat.value}</p>
                <p className="text-sm" style={{ color: '#6B6B7B' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4" style={{ backgroundColor: 'rgba(20, 20, 27, 0.5)' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#E4E4E7' }}>Our Story</h2>
          <div className="space-y-6" style={{ color: '#8B8B9E' }}>
            <p className="text-lg">
              SplitSheet was born from frustration. As freelancers ourselves, we tried every CRM on the market — Salesforce, HubSpot, Pipedrive, you name it. They were all built for enterprise sales teams with dedicated admins, complex onboarding, and price tags to match.
            </p>
            <p className="text-lg">
              We just wanted something simple. A place to track our leads, remember when to follow up, and see how much money we were making. Instead, we ended up with spreadsheets, sticky notes, and missed opportunities.
            </p>
            <p className="text-lg">
              So in 2024, we built SplitSheet. A CRM that does exactly what you need and nothing more. No bloat, no learning curve, no enterprise pricing. Just a clean, intuitive tool that helps you close more deals and grow your business.
            </p>
            <p className="text-lg">
              Today, SplitSheet helps over 10,000 freelancers and agencies worldwide manage their leads, track revenue, and build sustainable businesses. And we&apos;re just getting started.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#E4E4E7' }}>Our Mission</h2>
          <div className="p-8 rounded-xl border" style={{ backgroundColor: '#14141B', borderColor: PRIMARY }}>
            <p className="text-xl md:text-2xl text-center font-medium" style={{ color: '#D4D4DB' }}>
              To empower freelancers and small agencies with tools that are <span style={{ color: PRIMARY }}>powerful yet simple</span>. We believe great software should enhance your work, not distract from it.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 px-4" style={{ backgroundColor: 'rgba(20, 20, 27, 0.5)' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#E4E4E7' }}>Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <div key={i} className="p-6 rounded-xl border" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#E4E4E7' }}>{v.title}</h3>
                <p className="text-sm" style={{ color: '#8B8B9E' }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#E4E4E7' }}>Our Journey</h2>
          <div className="space-y-4">
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl" style={{ backgroundColor: '#14141B' }}>
                <div className="w-20 flex-shrink-0 text-center">
                  <span className="text-lg font-bold" style={{ color: PRIMARY }}>{m.year}</span>
                </div>
                <div>
                  <h3 className="font-bold mb-1" style={{ color: '#E4E4E7' }}>{m.event}</h3>
                  <p className="text-sm" style={{ color: '#8B8B9E' }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4" style={{ backgroundColor: 'rgba(20, 20, 27, 0.5)' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#E4E4E7' }}>Meet the Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <div key={i} className="p-6 rounded-xl border text-center" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
                  {member.avatar}
                </div>
                <h3 className="font-bold mb-1" style={{ color: '#E4E4E7' }}>{member.name}</h3>
                <p className="text-sm mb-3" style={{ color: PRIMARY }}>{member.role}</p>
                <p className="text-sm" style={{ color: '#8B8B9E' }}>{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#E4E4E7' }}>What Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testimonials.map((t, i) => (
              <div key={i} className="p-6 rounded-xl border" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                <p className="text-base mb-4" style={{ color: '#D4D4DB' }}>&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: '#E4E4E7' }}>{t.name}</p>
                    <p className="text-sm" style={{ color: '#6B6B7B' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4" style={{ backgroundColor: 'rgba(20, 20, 27, 0.5)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ color: '#E4E4E7' }}>Join Our Community</h2>
          <p className="text-lg mb-6" style={{ color: '#8B8B9E' }}>Connect with thousands of freelancers sharing tips, insights, and success stories.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => router.push(isAuthenticated ? '/dashboard' : '/signup')} className="px-8 py-3 rounded-lg font-semibold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
              Get Started Free
            </button>
            <button onClick={() => router.push('/pricing')} className="px-8 py-3 rounded-lg font-semibold" style={{ backgroundColor: '#14141B', color: '#8B8B9E', border: '1px solid #1C1C26' }}>
              View Pricing
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-4" style={{ borderColor: '#1C1C26' }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm" style={{ color: '#6B6B7B' }}>© 2026 SplitSheet. Built with ❤️ for freelancers worldwide.</p>
        </div>
      </footer>

      <ConversionPopup page="about" />
    </div>
  );
}
