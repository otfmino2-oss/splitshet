'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

interface PublicNavProps {
  showNav?: boolean;
}

export const PublicNav: React.FC<PublicNavProps> = ({ showNav = true }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { href: '/landing', label: 'Home' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
  ];

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    transition: 'all 0.3s ease',
    backgroundColor: isScrolled ? 'rgba(10, 10, 15, 0.95)' : 'transparent',
    backdropFilter: isScrolled ? 'blur(12px)' : 'none',
    borderBottom: isScrolled ? '1px solid rgba(28, 28, 38, 0.8)' : 'none',
  };

  const innerStyle: React.CSSProperties = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const logoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
  };

  const logoIconStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: '10px',
    background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: isScrolled ? 'none' : `0 4px 20px -5px ${PRIMARY}60`,
  };

  const navStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const linkStyle = (href: string): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'all 0.2s',
    backgroundColor: isActive(href) ? `${PRIMARY}15` : 'transparent',
    color: isActive(href) ? PRIMARY : '#A1AAA5',
  });

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <div style={innerStyle}>
          <Link href="/landing" style={logoStyle}>
            <div style={logoIconStyle}>
              <span className="text-lg font-bold text-white">S</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: '18px', color: '#E4E4E7' }}>
              Split<span style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sheet</span>
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={containerStyle}>
        <div style={innerStyle}>
          <Link href="/landing" style={logoStyle}>
            <div style={logoIconStyle}>
              <span className="text-lg font-bold text-white">S</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: '18px', color: '#E4E4E7' }}>
              Split<span style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sheet</span>
            </span>
          </Link>

          {showNav && (
            <>
              <nav style={navStyle} className="hidden md:flex">
                {navItems.map(item => (
                  <Link key={item.href} href={item.href} style={linkStyle(item.href)}>
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isAuthenticated ? (
                  <>
                    <Link 
                      href="/dashboard" 
                      className="px-4 py-2 rounded-lg text-sm font-medium hidden md:block"
                      style={{ color: '#A1AAA5' }}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={logout}
                      className="px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ backgroundColor: '#1C1C26', color: '#A1AAA5' }}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/login" 
                      className="px-4 py-2 rounded-lg text-sm font-medium hidden md:block"
                      style={{ color: '#A1AAA5' }}
                    >
                      Login
                    </Link>
                    <Link 
                      href="/signup" 
                      className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                      style={{ 
                        background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, 
                        color: 'white',
                        boxShadow: `0 4px 20px -5px ${PRIMARY}60`,
                      }}
                    >
                      Get Started
                    </Link>
                  </>
                )}

                <button 
                  className="md:hidden p-2 rounded-lg"
                  style={{ backgroundColor: '#1C1C26', color: '#A1AAA5' }}
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t" style={{ borderColor: '#1C1C26', backgroundColor: 'rgba(10, 10, 15, 0.98)' }}>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {navItems.map(item => (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  style={linkStyle(item.href)}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="h-px my-2" style={{ backgroundColor: '#1C1C26' }} />
              {isAuthenticated ? (
                <Link href="/dashboard" style={{ ...linkStyle('/dashboard'), display: 'block' }}>Dashboard</Link>
              ) : (
                <>
                  <Link href="/login" style={{ ...linkStyle('/login'), display: 'block' }}>Login</Link>
                  <Link href="/signup" style={{ ...linkStyle('/signup'), display: 'block', background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showNav && <div style={{ height: 60 }} />}
    </>
  );
};

export default PublicNav;
