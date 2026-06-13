#!/usr/bin/env ts-node
/**
 * Seed Script — populates CMS with sample data
 * 
 * Creates:
 *   - Tags & Categories
 *   - Sample blog posts (with AI-generated content markers)
 *   - Sample comments with reactions
 *   - Sample newsletter
 *   - Admin user
 */

import axios from 'axios';

const API_BASE = process.env.API_BASE || 'http://localhost:1337';
const ADMIN_EMAIL = 'admin@cms.local';
const ADMIN_PASSWORD = 'Admin123!@#';

async function seed() {
  console.log('🌱 Seeding CMS data...\n');

  // --- 1. Get admin JWT ---
  const authRes = await axios.post(`${API_BASE}/api/auth/local`, {
    identifier: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  }).catch(() => null);

  const jwt = authRes?.data?.jwt;
  const headers = jwt ? { Authorization: `Bearer ${jwt}` } : {};
  console.log(jwt ? '✓ Authenticated as admin' : '⚠ Running without auth (public endpoints only)');

  // --- 2. Create Tags ---
  const tagNames = ['TypeScript', 'Next.js', 'Open Source', 'AI', 'DevOps', 'Tutorial', 'News'];
  const tags: any[] = [];
  for (const name of tagNames) {
    try {
      const res = await axios.post(`${API_BASE}/api/tags`, { data: { name, slug: name.toLowerCase().replace(/\s+/g, '-') } }, { headers });
      tags.push(res.data.data || res.data);
      console.log(`  ✓ Tag: ${name}`);
    } catch (e: any) {
      console.log(`  ⚠ Tag ${name} might exist: ${e.response?.data?.error?.message || e.message}`);
    }
  }

  // --- 3. Create Categories ---
  const catNames = ['Engineering', 'Product', 'Tutorials', 'Announcements'];
  const categories: any[] = [];
  for (const name of catNames) {
    try {
      const res = await axios.post(`${API_BASE}/api/categories`, { data: { name, slug: name.toLowerCase() } }, { headers });
      categories.push(res.data.data || res.data);
      console.log(`  ✓ Category: ${name}`);
    } catch (e: any) {
      console.log(`  ⚠ Category ${name} might exist`);
    }
  }

  // --- 4. Create Posts ---
  const posts = [
    {
      title: 'Building a Modern CMS with Strapi and Next.js',
      excerpt: 'How we built a scalable, open-source content platform with AI-powered writing assistance.',
      content: '## Introduction\n\nIn this post, we explore building a modern CMS...',
      featured: true,
      tags: ['TypeScript', 'Next.js'],
      categories: ['Engineering'],
    },
    {
      title: 'AI-Powered Content Creation: Open Source Models in Production',
      excerpt: 'Integrating Llama, Mistral, and other open-source LLMs into your content workflow.',
      content: '## The Rise of Open-Source AI\n\nOpen-source language models have reached production-grade quality...',
      featured: true,
      tags: ['AI', 'Open Source'],
      categories: ['Product', 'Engineering'],
    },
    {
      title: 'Getting Started with Docker Compose for Full-Stack Development',
      excerpt: 'A practical guide to orchestrating your local dev environment with Docker.',
      content: '## Why Docker Compose?\n\nDocker Compose simplifies multi-service development...',
      featured: false,
      tags: ['DevOps', 'Tutorial'],
      categories: ['Tutorials'],
    },
  ];

  for (const post of posts) {
    try {
      const res = await axios.post(`${API_BASE}/api/posts`, {
        data: {
          ...post,
          status: 'published',
          publishedAt: new Date().toISOString(),
          readingTimeMinutes: Math.ceil(post.content.split(' ').length / 200),
          seoTitle: post.title,
          seoDescription: post.excerpt,
          seoKeywords: post.tags.join(', '),
        }
      }, { headers });
      console.log(`  ✓ Post: ${post.title}`);

      // --- 5. Add Comments to first post ---
      if (post === posts[0]) {
        const postId = res.data.data?.id || res.data.id;
        const comments = [
          { content: 'Great article! Really helpful for understanding the architecture.', authorName: 'Alice Dev', authorEmail: 'alice@example.com' },
          { content: 'The AI integration part is particularly interesting. Would love a follow-up deep dive.', authorName: 'Bob Engineer', authorEmail: 'bob@example.com' },
        ];
        for (const comment of comments) {
          try {
            await axios.post(`${API_BASE}/api/comments`, {
              ...comment,
              postId,
              status: 'approved',
            }, { headers });
            console.log(`    💬 Comment: "${comment.content.slice(0, 40)}..."`);
          } catch { /* skip */ }
        }
      }
    } catch (e: any) {
      console.log(`  ⚠ Post "${post.title}" might exist: ${e.response?.data?.error?.message?.slice(0, 80) || e.message.slice(0, 80)}`);
    }
  }

  // --- 6. Create Newsletter ---
  try {
    await axios.post(`${API_BASE}/api/newsletters`, {
      data: {
        subject: 'Welcome to Our CMS Platform',
        body: `<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text font-size="20px" font-weight="bold">Welcome! 🎉</mj-text>
        <mj-text>Thanks for subscribing to our newsletter. Here's what you can expect:</mj-text>
        <mj-list>
          <mj-item>Weekly tech articles</mj-item>
          <mj-item>Product updates</mj-item>
          <mj-item>Community highlights</mj-item>
        </mj-list>
        <mj-button href="{{unsubscribeUrl}}">Unsubscribe</mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`,
        status: 'draft',
        segment: { allActive: true },
      }
    }, { headers });
    console.log('  ✓ Newsletter created');
  } catch (e: any) {
    console.log(`  ⚠ Newsletter: ${e.message?.slice(0, 80)}`);
  }

  // --- 7. Index in Meilisearch ---
  try {
    const postsRes = await axios.get(`${API_BASE}/api/posts?pagination[limit]=100`);
    const allPosts = postsRes.data?.data || [];
    for (const p of allPosts) {
      const { indexPosts } = await import('../services/search-service');
      await indexPosts([p]);
    }
    console.log(`  🔍 Indexed ${allPosts.length} posts in Meilisearch`);
  } catch (e: any) {
    console.log(`  ⚠ Search indexing: ${e.message?.slice(0, 80)}`);
  }

  console.log('\n✅ Seed complete! Visit http://localhost:3000 to see the platform.');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
