'use client';

import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';
import { ConversionPopup } from '@/components/ConversionPopup';
import { getAllBlogPosts, getFeaturedPosts } from '@/lib/blogData';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

export default function BlogPage() {
  const posts = getAllBlogPosts();
  const featuredPosts = getFeaturedPosts();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
      <PublicNav />

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#E4E4E7' }}>
            <span style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SplitSheet Blog</span>
          </h1>
          <p className="text-lg" style={{ color: '#8B8B9E' }}>Tips, guides, and insights for freelancers and agencies building their dream businesses.</p>
        </div>
      </section>

      {featuredPosts.length > 0 && (
        <section className="py-8 px-4 pb-12" style={{ backgroundColor: 'rgba(20, 20, 27, 0.5)' }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold mb-6" style={{ color: '#E4E4E7' }}>Featured Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="block p-6 rounded-xl border transition-all hover:scale-105" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: `${PRIMARY}20`, color: PRIMARY }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#E4E4E7' }}>{post.title}</h3>
                  <p className="mb-4 text-sm" style={{ color: '#8B8B9E' }}>{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm" style={{ color: '#6B6B7B' }}>
                    <span>{post.author}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-8 px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-6" style={{ color: '#E4E4E7' }}>All Articles</h2>
          <div className="space-y-4">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="block p-6 rounded-xl border transition-all hover:scale-102" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: `${PRIMARY}20`, color: PRIMARY }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: '#E4E4E7' }}>{post.title}</h2>
                <p className="mb-4" style={{ color: '#8B8B9E' }}>{post.excerpt}</p>
                <div className="flex items-center gap-4 text-sm" style={{ color: '#6B6B7B' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
                      {post.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span>{post.author}</span>
                  </div>
                  <span>•</span>
                  <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4" style={{ backgroundColor: 'rgba(20, 20, 27, 0.5)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#E4E4E7' }}>Ready to try SplitSheet?</h2>
          <p className="text-lg mb-6" style={{ color: '#8B8B9E' }}>Start tracking your leads and revenue today. No credit card required.</p>
          <Link href="/signup" className="inline-block px-8 py-3 rounded-lg font-semibold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
            Get Started Free
          </Link>
        </div>
      </section>

      <footer className="border-t py-8 px-4" style={{ borderColor: '#1C1C26' }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm" style={{ color: '#6B6B7B' }}>© 2026 SplitSheet. All rights reserved.</p>
        </div>
      </footer>

      <ConversionPopup page="blog" />
    </div>
  );
}
