'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { getBlogPost, getAllBlogPosts } from '@/lib/blogData';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<ReturnType<typeof getBlogPost> | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<ReturnType<typeof getAllBlogPosts>>([]);

  useEffect(() => {
    if (slug) {
      const blogPost = getBlogPost(slug);
      setPost(blogPost);
      
      if (blogPost) {
        const allPosts = getAllBlogPosts();
        const related = allPosts.filter(p => p.slug !== slug && p.tags.some(t => blogPost.tags.includes(t))).slice(0, 2);
        const other = related.length < 2 ? [...allPosts.filter(p => p.slug !== slug), ...related].slice(0, 2) : related;
        setRelatedPosts(other);
      }
    }
  }, [slug]);

  if (!post) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
        <Header showNav={false} />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p style={{ color: '#8B8B9E' }}>Loading...</p>
        </div>
      </div>
    );
  }
  
  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-2xl font-bold mt-10 mb-4" style={{ color: '#E4E4E7' }}>{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-xl font-bold mt-8 mb-3" style={{ color: '#E4E4E7' }}>{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('**') && line.endsWith('**') && !line.includes('\n')) {
        return <p key={i} className="font-bold text-lg mt-6 mb-4" style={{ color: '#D4D4DB' }}>{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.startsWith('- [ ] ')) {
        return <div key={i} className="flex items-start gap-3 ml-6 mb-2"><input type="checkbox" disabled className="mt-1" /><span style={{ color: '#8B8B9E' }}>{line.replace('- [ ] ', '')}</span></div>;
      }
      if (line.startsWith('- ')) {
        return <li key={i} className="ml-6 mb-2" style={{ color: '#8B8B9E' }}>{line.replace('- ', '')}</li>;
      }
      if (line.match(/^\d+\.\s/)) {
        return <li key={i} className="ml-6 mb-2 list-decimal" style={{ color: '#8B8B9E' }}>{line.replace(/^\d+\.\s/, '')}</li>;
      }
      if (line.match(/^\*\*[^*]+\*\*:$/)) {
        return <h4 key={i} className="font-bold mt-4 mb-2" style={{ color: '#E4E4E7' }}>{line.replace(/\*\*/g, '')}</h4>;
      }
      if (line.trim() === '' || line === '') {
        return <div key={i} className="h-4"></div>;
      }
      return <p key={i} className="mb-4 leading-relaxed" style={{ color: '#8B8B9E' }}>{line}</p>;
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
      <Header showNav={false} />

      <article className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-2 mb-8 text-sm hover:opacity-80" style={{ color: PRIMARY }}>
            ← Back to Blog
          </Link>

          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${PRIMARY}20`, color: PRIMARY }}>
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: '#E4E4E7' }}>{post.title}</h1>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
                {post.author.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="font-semibold" style={{ color: '#E4E4E7' }}>{post.author}</p>
                <p className="text-sm" style={{ color: '#6B6B7B' }}>{post.authorRole}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm" style={{ color: '#6B6B7B' }}>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-sm" style={{ color: '#6B6B7B' }}>{post.readTime}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-b py-8 my-8" style={{ borderColor: '#1C1C26' }}>
            <p className="text-lg leading-relaxed" style={{ color: '#D4D4DB' }}>{post.excerpt}</p>
          </div>

          <div className="prose max-w-none">
            {formatContent(post.content)}
          </div>

          <div className="mt-12 pt-8 border-t" style={{ borderColor: '#1C1C26' }}>
            <div className="flex items-center gap-4 p-6 rounded-xl" style={{ backgroundColor: '#14141B' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
                {post.author.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="font-bold text-lg" style={{ color: '#E4E4E7' }}>About {post.author}</p>
                <p className="text-sm" style={{ color: '#6B6B7B' }}>{post.authorRole} at SplitSheet</p>
              </div>
            </div>
          </div>
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="py-12 px-4" style={{ backgroundColor: 'rgba(20, 20, 27, 0.5)' }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#E4E4E7' }}>More Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedPosts.map((relatedPost: { slug: string; tags: string[]; title: string; excerpt: string; author: string; readTime: string }) => (
                <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`} className="p-5 rounded-xl border transition-all hover:scale-105" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {relatedPost.tags.slice(0, 1).map((tag: string) => (
                      <span key={tag} className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: `${PRIMARY}20`, color: PRIMARY }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-bold mb-2" style={{ color: '#E4E4E7' }}>{relatedPost.title}</h3>
                  <p className="text-sm" style={{ color: '#8B8B9E' }}>{relatedPost.excerpt.substring(0, 100)}...</p>
                  <div className="mt-3 text-xs" style={{ color: '#6B6B7B' }}>
                    {relatedPost.author} • {relatedPost.readTime}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#E4E4E7' }}>Ready to try SplitSheet?</h2>
          <p className="text-lg mb-6" style={{ color: '#8B8B9E' }}>Start managing your leads and growing your business today.</p>
          <Link href="/signup" className="inline-block px-8 py-3 rounded-lg font-semibold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>
            Get Started Free
          </Link>
        </div>
      </section>

      <footer className="border-t py-8 px-4" style={{ borderColor: '#1C1C26' }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm" style={{ color: '#6B6B7B' }}>© 2026 SplitSheet. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
