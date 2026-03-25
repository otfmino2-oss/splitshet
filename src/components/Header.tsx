'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

interface HeaderProps {
  showNav?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ showNav = true }) => {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, logout } = useAuth();

  const isActive = (path: string) => pathname === path;

  const publicNavItems = [
    { href: '/landing', label: 'Home' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
  ];

  const dashboardNavItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/pipeline', label: 'Pipeline' },
    { href: '/timeline', label: 'Timeline' },
    { href: '/tasks', label: 'Tasks' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/followups', label: 'Follow-ups' },
    { href: '/expenses', label: 'Expenses' },
  ];

  const linkStyle = (href: string): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all 0.2s',
    backgroundColor: isActive(href) ? `${PRIMARY}20` : 'transparent',
    color: isActive(href) ? PRIMARY : '#8B8B9E',
  });

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    width: '100%',
    background: 'linear-gradient(135deg, #0A0A0F 0%, #0F0F15 100%)',
    borderBottom: '1px solid #1C1C26',
    backdropFilter: 'blur(12px)',
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '8px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const LogoIcon = () => (
    <div style={{
      width: 36,
      height: 36,
      borderRadius: '10px',
      background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <span className="text-lg font-bold text-white">S</span>
    </div>
  );

  const navStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexWrap: 'wrap',
  };

  if (isLoading) {
    return (
      <header style={headerStyle} role="banner" aria-label="Site header">
        <div style={containerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LogoIcon />
            <span style={{ fontWeight: 700, fontSize: '18px', color: '#E4E4E7' }}>
              Split<span style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sheet</span>
            </span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header style={headerStyle} role="banner" aria-label="Site header">
      <div style={containerStyle}>
        <Link href={isAuthenticated ? "/dashboard" : "/landing"} aria-label="SplitSheet home" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 20px -5px ${PRIMARY}60`,
            }}>
              <span className="text-lg font-bold text-white">S</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: '18px', color: '#E4E4E7' }}>
              Split<span style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sheet</span>
            </span>
          </div>
        </Link>

        {showNav && (
          <>
            {isAuthenticated ? (
              <nav aria-label="Dashboard navigation" style={navStyle}>
                {dashboardNavItems.map(item => (
                  <Link key={item.href} href={item.href} style={linkStyle(item.href)}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            ) : (
              <nav aria-label="Public navigation" style={navStyle}>
                {publicNavItems.map(item => (
                  <Link key={item.href} href={item.href} style={linkStyle(item.href)}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isAuthenticated ? (
                <>
                  <Link href="/account" style={{ padding: '8px', borderRadius: '8px', color: '#8B8B9E' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ backgroundColor: '#1C1C26', color: '#8B8B9E' }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ color: '#8B8B9E' }}>
                    Login
                  </Link>
                  <Link href="/signup" className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
