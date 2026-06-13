#!/usr/bin/env ts-node
/**
 * Comprehensive Seed Script
 *
 * Creates sample data for all content types:
 *   - Tags, Categories
 *   - Posts (with content, SEO, relations)
 *   - Comments (threaded, with reactions)
 *   - Reactions on posts and comments
 *   - Newsletter subscribers + campaign
 *   - Forms + submissions
 *   - Subscription plans, coupons
 *   - Referrals
 *   - Admin + editor + author users
 *   - Audit logs
 *
 * Run: docker compose exec api npm run seed
 */

import prisma from '../src/lib/prisma';

const API_URL = process.env.API_URL || 'http://localhost:1337';
const ADMIN_EMAIL = 'admin@cms.local';
const ADMIN_PASSWORD = 'Admin123!@#';

async function seed() {
  console.log('🌱 Starting comprehensive CMS seed...\n');

  // ── 1. Cleanup existing data ──────────────────────────────
  console.log('📦 Cleaning existing data...');
  const tables = [
    'webhook_deliveries', 'webhooks', 'audit_logs', 'newsletter_email_events',
    'newsletter_logs', 'newsletters', 'form_submissions', 'forms', 'post_access_logs',
    'referrals', 'coupons', 'subscriptions', 'subscription_plans', 'post_seo_tracking',
    'post_shares', 'post_engagement', 'scroll_events', 'page_views', 'comment_reports',
    'reactions', 'comments', 'subscribers', 'user_sessions', 'user_preferences',
    'posts', 'tags', 'categories', 'users', 'sites',
  ];
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    } catch { /* table might not exist yet */ }
  }
  console.log('  ✓ Data cleaned\n');

  // ── 2. Create Users ───────────────────────────────────────
  console.log('👤 Creating users...');

  const adminUser = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      username: 'admin',
      password: '$2b$10$placeholder_hash_replace_in_production',
      role: 'admin',
      bio: 'Platform administrator',
      locale: 'en',
      emailVerified: true,
    },
  });
  console.log(`  ✓ Admin: ${adminUser.email}`);

  const editorUser = await prisma.user.create({
    data: {
      email: 'editor@cms.local',
      username: 'editor',
      password: '$2b$10$placeholder_hash',
      role: 'editor',
      bio: 'Content editor',
      locale: 'en',
      emailVerified: true,
    },
  });
  console.log(`  ✓ Editor: ${editorUser.email}`);

  const authorUser = await prisma.user.create({
    data: {
      email: 'author@cms.local',
      username: 'jane_writer',
      password: '$2b$10$placeholder_hash',
      role: 'author',
      bio: 'Tech writer and open-source enthusiast',
      locale: 'en',
      emailVerified: true,
    },
  });
  console.log(`  ✓ Author: ${authorUser.email}`);

  // ── 3. User Preferences ──────────────────────────────────
  for (const user of [adminUser, editorUser, authorUser]) {
    await prisma.userPreferences.create({
      data: {
        userId: user.id,
        emailNotifications: true,
        commentNotifications: true,
        newsletterFrequency: 'weekly',
        theme: system: user.id === authorUser.id ? 'light' : 'dark',
      },
    });
  }
  console.log('  ✓ User preferences created');

  // ── 4. Tags ──────────────────────────────────────────────
  console.log('\n🏷 Creating tags...');
  const tagData = [
    'TypeScript', 'Next.js', 'React', 'Node.js', 'PostgreSQL',
    'Open Source', 'AI/ML', 'DevOps', 'Tutorial', 'News',
    'Security', 'Performance', 'Testing', 'Docker', 'Kubernetes',
  ];
  const tags: any[] = [];
  for (const name of tagData) {
    const tag = await prisma.tag.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      },
    });
    tags.push(tag);
    console.log(`  ✓ Tag: ${name}`);
  }

  // ── 5. Categories ────────────────────────────────────────
  console.log('\n📂 Creating categories...');
  const engCat = await prisma.category.create({ data: { name: 'Engineering', slug: 'engineering' } });
  const prodCat = await prisma.category.create({ data: { name: 'Product', slug: 'product' } });
  const tutCat = await prisma.category.create({ data: { name: 'Tutorials', slug: 'tutorials' } });
  const annCat = await prisma.category.create({ data: { name: 'Announcements', slug: 'announcements' } });
  console.log('  ✓ Categories: Engineering, Product, Tutorials, Announcements');

  // ── 6. Posts ──────────────────────────────────────────────
  console.log('\n📝 Creating posts...');

  const postsData = [
    {
      title: 'Building a Modern CMS with Strapi v5 and Next.js 15',
      excerpt: 'How we built a scalable, open-source content platform with AI-powered writing assistance and deep analytics.',
      content: `<h2>Introduction</h2><p>In this comprehensive guide, we explore building a modern CMS from scratch using Strapi v5 and Next.js 15...</p><h2>Architecture Overview</h2><p>The platform uses a dual ORM approach: Strapi's built-in entity service for content management, and Prisma for complex analytical queries...</p><h2>AI Integration</h2><p>We integrated open-source language models via OpenRouter, enabling content generation, scoring, and decay detection...</p>`,
      featured: true, status: 'published', authorId: authorUser.id,
      tags: ['TypeScript', 'Next.js', 'React'], categories: ['Eng'],
      viewCount: 15420, readingTimeMinutes: 12, seoTitle: 'Building a Modern CMS with Strapi v5 & Next.js 15', seoDescription: 'Learn how to build a scalable CMS with AI-powered writing assistance.',
    },
    {
      title: 'AI-Powered Content Creation with Open-Source Models',
      excerpt: 'Integrating Llama, Mistral, and other open-source LLMs into your content workflow — zero API costs.',
      content: `<h2>The Rise of Open-Source AI</h2><p>Open-source language models have reached production-grade quality...</p><h2>Provider-Agnostic Architecture</h2><p>Our AI adapter supports OpenRouter, Ollama, and vLLM through a unified interface...</p>`,
      featured: true, status: 'published', authorId: editorUser.id,
      tags: ['AI/ML', 'Open Source', 'Tutorial'], categories: ['Eng', 'Tut'],
      viewCount: 12350, readingTimeMinutes: 8,
    },
    {
      title: 'Deep Dive: Post-Wise Analytics Engine',
      excerpt: 'How we track scroll depth, read completion, and content decay for every blog post.',
      content: `<h2>Why Post-Wise Analytics?</h2><p>View counts alone don't tell the full story...</p><h2>Scroll Depth Tracking</h2><p>Using the IntersectionObserver API, we track when readers reach 25%, 50%, 75%, and 100% of content...</p>`,
      featured: false, status: 'published', authorId: authorUser.id,
      tags: ['TypeScript', 'Performance', 'Tutorial'], categories: ['Eng'],
      viewCount: 8920, readingTimeMinutes: 10,
    },
    {
      title: 'Newsletter System: BullMJQ + MJML + Send-Time Optimization',
      excerpt: 'Building a production-grade newsletter system with queue-based sending and per-subscriber optimization.',
      content: `<h2>Architecture</h2><p>The newsletter system uses BullMJQ for reliable, queue-based email sending...</p>`,
      featured: false, status: 'published', authorId: editorUser.id,
      tags: ['Node.js', 'DevOps', 'Tutorial'], categories: ['Eng', 'Tut'],
      viewCount: 6780, readingTimeMinutes: 7,
    },
    {
      title: 'Security Best Practices for Headless CMS',
      excerpt: 'JWT rotation, 2FA, rate limiting, input sanitization — a comprehensive security guide.',
      content: `<h2>Authentication</h2><p>We implement short-lived JWT access tokens (15 min) with long-lived refresh tokens (30 days)...</p>`,
      featured: true, status: 'published', authorId: authorUser.id,
      tags: ['Security', 'Node.js', 'Testing'], categories: ['Eng', 'Tut'],
      viewCount: 5430, readingTimeMinutes: 15,
    },
    {
      title: 'Docker Compose for Full-Stack Development',
      excerpt: 'Orchestrating Postgres, Redis, Meilisearch, and MinIO for a seamless local dev experience.',
      content: `<h2>Why Docker Compose?</h2><p>Docker Compose simplifies multi-service development...</p>`,
      featured: false, status: 'draft', authorId: authorUser.id,
      tags: ['DevOps', 'Docker', 'Tutorial'], categories: ['Tut'],
      viewCount: 0, readingTimeMinutes: 6,
    },
  ];

  const createdPosts: any[] = [];
  for (const postData of postsData) {
    const { tags: tagNames, categories: catNames, ...rest } = postData;

    const post = await prisma.post.create({
      data: {
        ...rest,
        slug: postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60),
        publishedAt: postData.status === 'published' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
        tags: {
          connect: tagNames.map((name: string) => ({ slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') })),
        },
        ...(catNames && {
          categories: {
            connect: catNames.map((name: string) => ({
              slug: name === 'Eng' ? 'engineering' : name === 'Tut' ? 'tutorials' : name.toLowerCase(),
            })),
          },
        }),
      },
    });
    createdPosts.push(post);
    console.log(`  ✓ Post: ${postData.title.slice(0, 50)}...`);
  }

  // ── 7. Comments (threaded) ───────────────────────────────
  console.log('\n💬 Creating comments...');

  const comment1 = await prisma.comment.create({
    data: {
      content: 'Excellent article! The dual ORM approach is really clever. How do you handle migration conflicts between Strapi and Prisma?',
      postId: createdPosts[0].id,
      authorName: 'Alex Developer',
      authorEmail: 'alex@example.com',
      status: 'approved',
      sentimentScore: 0.8,
      toxicityScore: 0.05,
    },
  });

  const comment1Reply = await prisma.comment.create({
    data: {
      content: 'Great question! We use Strapi migrations for content schema and Prisma migrations for analytics tables. They operate on separate schemas.',
      postId: createdPosts[0].id,
      parentId: comment1.id,
      authorId: authorUser.id,
      status: 'approved',
      sentimentScore: 0.7,
      toxicityScore: 0.02,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'This is exactly what I needed for my project. The AI integration part is particularly interesting.',
      postId: createdPosts[0].id,
      authorName: 'Sarah Engineer',
      authorEmail: 'sarah@example.com',
      status: 'approved',
      sentimentScore: 0.9,
      toxicityScore: 0.03,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'How does the send-time optimization work? Is it based on historical open data?',
      postId: createdPosts[3].id,
      authorName: 'Mike Marketing',
      authorEmail: 'mike@example.com',
      status: 'approved',
      sentimentScore: 0.5,
      toxicityScore: 0.01,
    },
  });

  // A pending comment
  await prisma.comment.create({
    data: {
      content: 'Great tutorial, very detailed!',
      postId: createdPosts[1].id,
      authorName: 'New User',
      authorEmail: 'new@example.com',
      status: 'pending',
      spamScore: 0.1,
    },
  });

  console.log(`  ✓ Comments: 5 (4 approved, 1 pending)`);

  // ── 8. Reactions ──────────────────────────────────────────
  console.log('\n❤️ Creating reactions...');

  const reactionUsers = [adminUser.id, editorUser.id, authorUser.id];
  const reactionTypes = ['like', 'love', 'laugh', 'upvote'];

  for (const post of createdPosts.slice(0, 4)) {
    for (let i = 0; i < Math.min(3, reactionUsers.length); i++) {
      try {
        await prisma.reaction.create({
          data: {
            type: reactionTypes[i % reactionTypes.length],
            userId: reactionUsers[i],
            postId: post.id,
          },
        });
      } catch { /* duplicate */ }
    }
  }
  console.log('  ✓ Reactions created');

  // ── 9. Newsletter Subscribers ─────────────────────────────
  console.log('\n📧 Creating newsletter subscribers...');

  const subscriberEmails = [
    { email: 'subscriber1@example.com', name: 'Alice Johnson', tags: ['Engineering', 'Tutorials'] },
    { email: 'subscriber2@example.com', name: 'Bob Smith', tags: ['AI/ML', 'News'] },
    { email: 'subscriber3@example.com', name: 'Carol White', tags: ['DevOps'] },
    { email: 'subscriber4@example.com', name: 'Dave Brown', tags: ['Security', 'Engineering'] },
    { email: 'subscriber5@example.com', name: 'Eve Davis', tags: ['Tutorials', 'Product'] },
  ];

  for (const sub of subscriberEmails) {
    const unsubscribeToken = Buffer.from(`${sub.email}:unsub:${Date.now()}`).toString('base64url');
    await prisma.subscriber.create({
      data: {
        email: sub.email,
        name: sub.name,
        tags: sub.tags,
        status: 'confirmed',
        doubleOptInAt: new Date(),
        unsubscribeToken,
        totalOpens: Math.floor(Math.random() * 20),
        totalClicks: Math.floor(Math.random() * 10),
        engagementScore: Math.random(),
        lastOpenAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`  ✓ Subscriber: ${sub.email}`);
  }

  // ── 10. Subscription Plans ────────────────────────────────
  console.log('\n💳 Creating subscription plans...');

  const freePlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Free', slug: 'free', price: 0, currency: 'USD', interval: 'monthly',
      features: { freePostsPerMeter: 5, unlimitedAccess: false, newsletterPriority: false },
      isActive: true,
    },
  });

  const proPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Pro', slug: 'pro', price: 9.99, currency: 'USD', interval: 'monthly',
      features: { freePostsPerMeter: null, unlimitedAccess: true, newsletterPriority: true },
      isActive: true,
    },
  });

  const yearlyPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Pro Annual', slug: 'pro-annual', price: 99.99, currency: 'USD', interval: 'yearly',
      features: { freePostsPerMeter: null, unlimitedAccess: true, newsletterPriority: true },
      isActive: true,
    },
  });

  console.log('  ✓ Plans: Free ($0), Pro ($9.99/mo), Pro Annual ($99.99/yr)');

  // ── 11. Coupons ───────────────────────────────────────────
  console.log('\n🎟 Creating coupons...');

  await prisma.coupon.create({
    data: { code: 'WELCOME20', discountType: 'percentage', discountValue: 20, maxUses: 100, validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
  });
  await prisma.coupon.create({
    data: { code: 'FLAT10', discountType: 'fixed', discountValue: 10, maxUses: 50, validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
  });
  console.log('  ✓ Coupons: WELCOME20 (20% off), FLAT10 ($10 off)');

  // ── 12. Forms ─────────────────────────────────────────────
  console.log('\n📋 Creating forms...');

  const contactForm = await prisma.form.create({
    data: {
      name: 'Contact Us', slug: 'contact',
      description: 'General contact form',
      fields: [
        { id: 'name', type: 'text', label: 'Full Name', required: true },
        { id: 'email', type: 'email', label: 'Email', required: true },
        { id: 'subject', type: 'text', label: 'Subject', required: true },
        { id: 'message', type: 'textarea', label: 'Message', required: true },
      ],
      settings: { submitMessage: 'Thank you! We\'ll get back to you soon.', notifyEmails: [ADMIN_EMAIL] },
      status: 'active',
      submissionCount: 3,
    },
  });

  const feedbackForm = await prisma.form.create({
    data: {
      name: 'Content Feedback', slug: 'feedback',
      description: 'Rate and provide feedback on articles',
      fields: [
        { id: 'rating', type: 'radio', label: 'Rating', required: true, options: ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'] },
        { id: 'feedback', type: 'textarea', label: 'Your Feedback', required: false },
      ],
      settings: { submitMessage: 'Thanks for your feedback!' },
      status: 'active',
      submissionCount: 12,
    },
  });

  console.log('  ✓ Forms: Contact Us, Content Feedback');

  // ── 13. Page Views (sample analytics) ─────────────────────
  console.log('\n📊 Creating sample analytics data...');

  for (const post of createdPosts.filter(p => p.status === 'published')) {
    const viewCount = post.viewCount || Math.floor(Math.random() * 1000) + 100;
    const views = [];
    for (let i = 0; i < Math.min(viewCount, 50); i++) {
      views.push({
        postId: post.id,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (compatible)',
        viewedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }
    if (views.length > 0) {
      await prisma.pageView.createMany({ data: views });
    }

    // Engagement data
    await prisma.postEngagement.create({
      data: {
        postId: post.id,
        avgTimeOnPage: Math.random() * 300 + 60,
        readCompletionRate: Math.random() * 0.4 + 0.3,
        bounceRate: Math.random() * 0.3 + 0.1,
        scroll25pct: 0.95,
        scroll50pct: Math.random() * 0.3 + 0.6,
        scroll75pct: Math.random() * 0.3 + 0.3,
        scroll100pct: Math.random() * 0.2 + 0.1,
      },
    });
  }
  console.log('  ✓ Analytics data created');

  // ── 14. Sites (multi-site) ────────────────────────────────
  console.log('\n🌐 Creating sites...');

  await prisma.site.create({
    data: {
      name: 'Main Blog', slug: 'main', domain: 'localhost:3000',
      status: 'active',
      settings: { defaultLocale: 'en', allowedLocales: ['en', 'es', 'fr'], features: { paywall: true, newsletter: true } },
    },
  });
  console.log('  ✓ Site: Main Blog');

  // ── 15. Audit Logs ───────────────────────────────────────
  console.log('\n📝 Creating audit logs...');

  await prisma.auditLog.createMany({
    data: [
      { action: 'create', entityType: 'post', entityId: createdPosts[0].id, newValue: { title: createdPosts[0].title }, actorId: adminUser.id },
      { action: 'create', entityType: 'user', entityId: authorUser.id, newValue: { username: authorUser.username }, actorId: adminUser.id },
      { action: 'approve', entityType: 'comment', entityId: comment1.id, actorId: editorUser.id },
      { action: 'publish', entityType: 'post', entityId: createdPosts[1].id, actorId: editorUser.id },
    ],
  });
  console.log('  ✓ Audit logs created');

  // ── Summary ──────────────────────────────────────────────
  console.log('\n' + '='.repeat(50));
  console.log('✅ Seed complete!');
  console.log('='.repeat(50));
  console.log(`
📊 Summary:
  Users: 3 (admin, editor, author)
  Tags: ${tags.length}
  Categories: 4
  Posts: ${createdPosts.length} (${createdPosts.filter(p => p.status === 'published').length} published, ${createdPosts.filter(p => p.status === 'draft').length} draft)
  Comments: 5
  Reactions: multiple
  Subscribers: ${subscriberEmails.length}
  Plans: 3 (Free, Pro, Pro Annual)
  Coupons: 2
  Forms: 2
  Sites: 1

🔑 Admin Login:
  Email: ${ADMIN_EMAIL}
  Password: ${ADMIN_PASSWORD}
  URL: ${API_URL}/admin

🌐 Frontend: http://localhost:3000
📧 Webhooks: Configured in admin panel
`);
}

seed()
  .catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
