# 🚀 CMS Platform — Full-Featured, 100% Free & Open Source

A modern, AI-powered content management system built with **Strapi v5 + Prisma + PostgreSQL + Next.js 15 + Redis + Meilisearch**.

> **All features. Zero cost. No vendor lock-in. Self-host everything.**

---

## ✨ What Makes This Different

| Feature | WordPress | Ghost | Contentful | **This CMS** |
|---------|-----------|-------|------------|--------------|
| AI content generation | ❌ Plugin | ❌ | ❌ | ✅ Built-in (open models) |
| Post-wise deep analytics | ❌ Plugin | ❌ | ❌ | ✅ Scroll depth, completion, sentiment |
| Content decay detection | ❌ | ❌ | ❌ | ✅ AI-powered |
| Send-time optimization | ❌ | ❌ | ❌ | ✅ Per-subscriber ML |
| Metered paywall | ❌ Plugin | ✅ Paid | ❌ | ✅ Built-in |
| Coupon/referral system | ❌ Plugin | ❌ | ❌ | ✅ Built-in |
| Multi-site/tenant | ⚠️ Multisite | ❌ | ✅ Enterprise | ✅ Built-in |
| Form builder | ❌ Plugin | ❌ | ❌ | ✅ Drag-and-drop |
| Collaborative editor | ❌ | ❌ | ❌ | ✅ Real-time (Yjs) |
| AI content scoring | ❌ | ❌ | ❌ | ✅ 0-100 grading |
| Content A/B testing | ❌ | ❌ | ❌ | ✅ Title variants |
| Churn prediction | ❌ | ❌ | ❌ | ✅ Subscriber scoring |
| **Cost** | Free + plugins | $9-199/mo | $489+/mo | **$0 forever** |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 Frontend                       │
│  Blog Pages │ Dashboard │ Analytics │ Newsletter │ Forms     │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST + GraphQL
┌──────────────────────────▼──────────────────────────────────┐
│                      Strapi v5 CMS                           │
│  Content │ Auth/RBAC │ i18n │ Media │ Plugins              │
└──────┬──────────────────────┬───────────────────────────────┘
       │                      │
┌──────▼──────┐   ┌───────────▼──────────┐
│   Prisma    │   │   PostgreSQL 16      │
│  (Custom    │   │  (Primary Store)     │
│   Queries)  │   │  - JSONB Content     │
└─────────────┘   └──────────────────────┘
       │
┌──────▼──────┐  ┌────────────┐  ┌──────────┐
│   Redis 7   │  │ Meilisearch│  │  MinIO   │
│ Cache+Queue │  │  (Search)  │  │ (Media)  │
└─────────────┘  └────────────┘  └──────────┘
```

---

## 🎯 Feature Summary (150+ Features)

### Content Management ✅
- Collection types, single types, components, dynamic zones
- 20+ field types including blocks editor
- Draft/publish with versioning and rollback
- Scheduled publishing
- Content workflow (draft → review → approved → published)
- Multi-language (i18n) with 50+ locales
- Media library with Sharp image optimization (WebP/AVIF)
- Taxonomy: tags, categories (hierarchical), custom taxonomies

### Blog Management ✅
- SSR/ISR for optimal performance
- SEO: meta tags, Open Graph, JSON-LD, sitemap, RSS
- Reading time, progress bar, table of contents
- Dark mode, font size adjustment, print view
- Author pages with bio and social links
- Featured posts, trending, related posts

### AI Intelligence ✅
- Content generation (titles, intros, full posts, outlines)
- SSE streaming in editor
- Content scoring (readability, SEO, engagement: 0-100)
- Content decay detection with auto-suggestions
- AI autocomplete (ghost text)
- Image alt text generation
- Social media caption generation
- Comment toxicity scoring
- Supports OpenRouter, Ollama, vLLM (provider-agnostic)

### Newsletter System ✅
- Double opt-in subscription
- MJML responsive email templates
- BullMJQ queue-based sending
- Segmentation (tags, roles, locale, activity)
- Send-time optimization per subscriber
- Open/click/bounce tracking
- Churn prediction
- CSV import/export
- A/B testing (subject lines)

### Comments & Reactions ✅
- Threaded/nested comments
- Moderation queue with approve/reject/spam
- AI toxicity scoring + auto-moderation
- Abuse reporting with auto-flag
- Reactions: like, love, laugh, surprised, sad, angry, upvote/downvote
- Spam detection (heuristic + AI)
- Real-time updates via WebSocket

### Post-Wise Deep Analytics ✅
- Scroll depth (25/50/75/100%)
- Read completion rate
- Avg time on page
- Returning vs new visitors
- Reaction sentiment analysis
- Comment sentiment (AI)
- Share velocity (24h/48h/72h)
- SEO keyword tracking
- Content decay detection
- AI content score

### Paywall & Monetization ✅
- Subscription plans (free, monthly, yearly)
- Metered paywall (N free posts/month)
- Teaser content (first 2 paragraphs)
- Coupon/discount system
- Referral program with tracking
- Stripe integration ready

### Forms Builder ✅
- Drag-and-drop form builder
- 10+ field types
- Conditional logic
- Server-side validation
- Spam detection
- CSV export of submissions
- Completion analytics

### Multi-Site ✅
- Single install, multiple blogs
- Per-site domain, theme, authors
- Shared media library option
- Central admin dashboard

### Search ✅
- Meilisearch (self-hosted)
- Typo-tolerant, sub-50ms queries
- Faceted search (author, tags, date, locale)
- Autocomplete suggestions
- Search analytics
- DB fallback if Meilisearch unavailable

### Security ✅
- JWT (access 15min + refresh 30day) with rotation
- OAuth2 (Google, GitHub, Discord)
- 2FA (TOTP + backup codes)
- RBAC (admin, editor, author, subscriber)
- Rate limiting per IP + per user
- Input sanitization (DOMPurify + sanitize-html)
- Helmet.js security headers
- CORS strict origin whitelist
- Audit logging
- GDPR compliance (consent, export, deletion)

### Performance ✅
- Next.js ISR for blog pages
- Redis caching layer
- Sharp image pipeline (WebP/AVIF, responsive srcset)
- GraphQL DataLoader (N+1 fix)
- Cursor pagination
- CDN-ready

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local dev without Docker)

### 1. Clone & Configure

```bash
git clone https://github.com/Dev-Rajeshkumar/openclaw.git
cd openclaw
cp .env.example .env
# Edit .env with your values
```

### 2. Start All Services

```bash
docker compose up -d
```

| Service | URL |
|---------|-----|
| Next.js Frontend | http://localhost:3000 |
| Strapi Admin | http://localhost:1337/admin |
| Strapi API | http://localhost:1337/api |
| Meilisearch | http://localhost:7700 |
| MinIO Console | http://localhost:9001 |
| Mailpit (Email) | http://localhost:8025 |
| Redis Commander | http://localhost:8081 |

### 3. Initialize Database

```bash
# Push Prisma schema
docker compose exec api npx prisma db push

# Seed sample data
docker compose exec api npm run seed
```

### 4. Create Admin User

Visit http://localhost:1337/admin and create your first admin account.

---

## 📁 Project Structure

```
openclaw/
├── api/                          # Strapi v5 CMS Backend
│   ├── config/                   # Strapi config (DB, plugins, server)
│   ├── prisma/                   # Prisma schema (30+ models)
│   ├── src/
│   │   ├── content-types/        # Strapi content type definitions
│   │   ├── lib/                  # Shared utilities (Prisma client)
│   │   ├── middleware/           # Custom middleware (rate limiter, view tracker)
│   │   ├── plugins/              # 10 custom Strapi plugins
│   │   │   ├── ai-assistant/     # AI content generation & scoring
│   │   │   ├── analytics/        # Dashboard & post-wise analytics
│   │   │   ├── audit-log/        # Admin action logging
│   │   │   ├── comments-reactions/# Comments, reactions, moderation
│   │   │   ├── forms/            # Form builder & submissions
│   │   │   ├── multi-site/       # Multi-tenant site management
│   │   │   ├── newsletter/       # Email newsletter system
│   │   │   ├── paywall/          # Subscriptions, coupons, referrals
│   │   │   ├── search/           # Meilisearch integration
│   │   │   ├── user-management/  # 2FA, OAuth, RBAC, sessions
│   │   │   └── webhooks/         # Event webhooks with retry
│   │   └── services/             # Business logic services
│   │       ├── ai-service.ts     # AI provider adapter (OpenRouter/Ollama)
│   │       ├── analytics-service.ts
│   │       ├── newsletter-service.ts
│   │       ├── post-analytics-service.ts
│   │       └── search-service.ts
│   └── scripts/
│       └── seed.ts               # Database seeder
│
├── web/                          # Next.js 15 Frontend
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── posts/            # Blog listing & detail
│   │   │   ├── login/            # Authentication
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   ├── newsletter/       # Subscribe/preferences/unsubscribe
│   │   │   ├── dashboard/        # Admin dashboard
│   │   │   ├── about/
│   │   │   ├── contact/
│   │   │   ├── error.tsx         # Error boundary
│   │   │   ├── loading.tsx       # Loading skeleton
│   │   │   └── not-found.tsx     # 404 page
│   │   ├── components/           # Shared UI components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── SearchModal.tsx
│   │   │   ├── ReactionBar.tsx
│   │   │   ├── ShareButtons.tsx
│   │   │   ├── ReadingProgress.tsx
│   │   │   ├── TableOfContents.tsx
│   │   │   ├── PaywallGate.tsx
│   │   │   └── newsletter/SubscribeForm.tsx
│   │   ├── hooks/                # React hooks
│   │   │   └── useAnalytics.ts   # Page view & scroll tracking
│   │   ├── lib/                  # Utilities
│   │   │   ├── api.ts            # Strapi REST API client
│   │   │   ├── prisma.ts         # Prisma client (server-side)
│   │   │   └── analytics-service.ts
│   │   └── styles/
│   │       └── globals.css       # Tailwind + custom styles
│   └── public/                   # Static assets
│
├── infra/                        # Infrastructure
│   ├── ci/                       # CI/CD pipeline
│   ├── k8s/                      # Kubernetes manifests
│   ├── nginx/                    # Nginx reverse proxy config
│   └── postgres/                 # PostgreSQL init scripts
│
├── docker-compose.yml            # Local development
├── .env.example                  # Environment variable template
└── README.md
```

---

## 🔧 Configuration

Key environment variables (see `.env.example` for full list):

```env
# Database
DATABASE_URL=postgresql://cms_user:cms_password@localhost:5432/cms_db

# AI (choose one)
AI_PROVIDER=openrouter
AI_API_KEY=sk-or-...
AI_MODEL=meta-llama/llama-3.1-70b

# Or self-hosted:
# AI_PROVIDER=ollama
# AI_BASE_URL=http://localhost:11434/v1
# AI_MODEL=llama3.1

# Redis
REDIS_URL=redis://localhost:6379

# Search
MEILI_HOST=http://localhost:7700
MEILI_API_KEY=your-master-key

# Email
SMTP_HOST=localhost
SMTP_PORT=1025
```

---

## 🧪 Testing

```bash
# API tests
cd api && npm test

# Frontend tests
cd web && npm test

# E2E tests
cd web && npx playwright test
```

---

## 📦 Deployment

### Docker Compose (Single VPS)
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Kubernetes
```bash
kubectl apply -f infra/k8s/
```

### Serverless
- Next.js → Vercel (free tier)
- Strapi → Railway / Render
- PostgreSQL → Neon / Supabase
- Redis → Upstash
- Meilisearch → Self-hosted or Meilisearch Cloud

---

## 📊 Database Schema

30+ tables via Prisma:
- **Content**: posts, tags, categories, comments, reactions
- **Analytics**: page_views, scroll_events, post_engagement, post_shares, post_seo_tracking
- **Newsletter**: subscribers, newsletters, newsletter_logs, newsletter_email_events
- **Forms**: forms, form_subscriptions
- **Monetization**: subscription_plans, subscriptions, post_access_logs, coupons, referrals
- **Multi-Site**: sites
- **System**: user_sessions, user_preferences, audit_logs, webhooks, webhook_deliveries

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m "feat: my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — use it, modify it, ship it.

---

## 🙏 Acknowledgments

Built with [Strapi](https://strapi.io), [Next.js](https://nextjs.org), [Prisma](https://prisma.io), [Meilisearch](https://meilisearch.com), [PostgreSQL](https://postgresql.org), [Redis](https://redis.io), and [MinIO](https://min.io).
