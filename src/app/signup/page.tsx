'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { PublicNav } from '@/components/PublicNav';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

export default function SignupPage() {
  const router = useRouter();
  const { signup, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const result = await signup(email, password, name.trim());
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
      <PublicNav />
      <div className="flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/landing" className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, boxShadow: `0 8px 30px -8px ${PRIMARY}60` }}>
                <span className="text-xl font-bold text-white">S</span>
              </div>
              <span className="text-2xl font-bold" style={{ color: '#E4E4E7' }}>
                Split<span style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sheet</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#E4E4E7' }}>Create account</h1>
            <p style={{ color: '#6B6B7B' }}>Start tracking your leads</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444' }}>
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-lg focus:outline-none" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26', color: '#E4E4E7' }} />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg focus:outline-none" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26', color: '#E4E4E7' }} />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg focus:outline-none" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26', color: '#E4E4E7' }} />
              <p className="text-xs mt-1" style={{ color: '#6B6B7B' }}>Minimum 8 characters</p>
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg focus:outline-none" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26', color: '#E4E4E7' }} />
            </div>
            <button type="submit" disabled={isLoading} className="w-full py-3 rounded-lg font-semibold disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: '#6B6B7B' }}>
            Already have an account? <button onClick={() => router.push('/login')} className="font-semibold" style={{ color: PRIMARY }}>Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
}
