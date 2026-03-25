'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

interface ConversionPopupProps {
  page: 'landing' | 'blog' | 'pricing' | 'about';
}

export const ConversionPopup: React.FC<ConversionPopupProps> = ({ page }) => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hasClosed, setHasClosed] = useState(false);

  const content = {
    landing: {
      headline: 'Start Closing More Deals Today',
      subheadline: 'Get 5 proven follow-up templates that double response rates.',
      cta: 'Get Free Templates',
      placeholder: 'Enter your email',
    },
    blog: {
      headline: 'Get Freelance Tips Weekly',
      subheadline: 'Join 10,000+ freelancers getting actionable tips every week.',
      cta: 'Subscribe Free',
      placeholder: 'Enter your email',
    },
    pricing: {
      headline: 'Start Using SplitSheet Free',
      subheadline: 'Join 10,000+ freelancers. All features included, no credit card.',
      cta: 'Get Started Free',
      placeholder: 'Enter your email',
    },
    about: {
      headline: 'Join Our Community',
      subheadline: 'Connect with 10,000+ freelancers sharing tips and wins.',
      cta: 'Join Free',
      placeholder: 'Enter your email',
    },
  };

  const showPopup = useCallback(() => {
    if (hasClosed || isSubscribed || localStorage.getItem('conversion_popup_dismissed')) {
      return;
    }
    
    const scrollDepth = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    
    if (scrollDepth > 0.3) {
      setIsVisible(true);
    }
  }, [hasClosed, isSubscribed]);

  useEffect(() => {
    const handleScroll = () => {
      if (!isVisible) {
        showPopup();
      }
    };

    const timeout = setTimeout(() => {
      if (!isVisible && !hasClosed && !isSubscribed) {
        const scrollDepth = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        if (scrollDepth > 0.2 || window.scrollY > 500) {
          setIsVisible(true);
        }
      }
    }, 15000);

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
    };
  }, [isVisible, hasClosed, isSubscribed, showPopup]);

  const handleClose = () => {
    setIsVisible(false);
    setHasClosed(true);
    localStorage.setItem('conversion_popup_dismissed', 'true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsSubscribed(true);
    localStorage.setItem('conversion_popup_subscribed', 'true');
    setIsVisible(false);
  };

  if (isSubscribed) {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  const c = content[page];

  return (
    <>
      <div 
        className="fixed inset-0 z-50 transition-opacity"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={handleClose}
      />
      <div 
        className="fixed z-50 transition-all duration-500"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 440,
        }}
      >
        <div 
          className="relative p-8 rounded-2xl border"
          style={{ 
            backgroundColor: '#14141B', 
            borderColor: '#1C1C26',
            boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5)`,
          }}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: '#6B6B7B' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center mb-6">
            <div 
              className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)` }}
            >
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#FAFAFA' }}>
              {c.headline}
            </h3>
            <p className="text-sm" style={{ color: '#A1AAA5' }}>
              {c.subheadline}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={c.placeholder}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{ 
                backgroundColor: '#0A0A0F', 
                border: '1px solid #1C1C26',
                color: '#FAFAFA',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ 
                background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, 
                color: 'white',
                boxShadow: `0 4px 20px -5px ${PRIMARY}60`,
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Subscribing...
                </span>
              ) : c.cta}
            </button>
          </form>

          <p className="text-xs text-center mt-4" style={{ color: '#6B6B7B' }}>
            No spam, unsubscribe anytime.
          </p>
        </div>
      </div>
    </>
  );
};

export default ConversionPopup;
