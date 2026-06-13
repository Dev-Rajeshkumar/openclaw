# CMS Enhancement — Architecture Overview (Expanded)

> **Last Updated:** 2026-06-13
> **Stack:** Strapi v5 + Prisma + PostgreSQL + Next.js 15 + Redis + Meilisearch
> **License:** 100% free, open-source, self-hostable

---

## 1. Full Stack Component Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CDN (CloudFlare Free)                        │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────────┐
│                   Next.js 15 Frontend (Vercel/Node)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐ │
│  │ Blog     │ │ Collab   │ │ Comments │ │ Analytics│ │ Dashboard │ │
│  │ Pages    │ │ Editor   │ │ & React. │ │ Tracker  │ │ (Charts)  │ │
│  │(SSR/ISR) │ │ (Yjs+WS) │ │          │ │          │ │           │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └───────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐ │
│  │Paywall/  │ │ Forms    │ │ Search   │ │ Newsletter│ │ Multi-    │ │
│  │Metered   │ │ Builder  │ │ (Facets) │ │ Pref.    │ │ Site      │ │
│  │Access    │ │          │ │          │ │ Center   │ │ Switch    │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └───────────┘ │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ REST + GraphQL + WebSocket
┌──────────────────────────────▼───────────────────────────────────────┐
│                        Strapi v5 CMS (Node.js)                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Strapi Core (OOTB)                            │ │
│  │  Content Mgmt │ Auth/RBAC │ i18n │ Media Library │ API (REST+GQL)│ │
│  └─────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Custom Plugins                                │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │ │
│  │  │ AI       │ │ Comments │ │ Reactions│ │ Newsletter        │  │ │
│  │  │ Assistant│ │ & Actions│ │ Engine   │ │ Engine (BullMQ)   │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │ │
│  │  │ Analytics│ │ Forms    │ │ Search   │ │ Multi-Site        │  │ │
│  │  │ Service  │ │ Builder  │ │ (Meili.) │ │ Manager           │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │ │
│  │  │ Paywall  │ │ Referral │ │ Content  │ │ Moderation        │  │ │
│  │  │ Engine   │ │ System   │ │ Workflow │ │ & Spam            │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────┬──────────────────────┬──────────────────────┬────────────────┘
       │                      │                      │
┌──────▼──────┐   ┌───────────▼────────┐   ┌────────▼──────────┐
│   Prisma    │   │                    │   │                   │
│   ORM       │   │   PostgreSQL 16    │   │                  │
│  (Custom    │   │  (Primary Store)   │   │                  │
│   Queries)  │   │  - JSONB Content   │   │                  │
│             │   │  - Relations       │   │                  │
└─────────────┘   │  - Full-Text Search│   │                  │
                  └────────────────────┘   │                  │
                                           │                  │
       ┌───────────────────┐    ┌─────────▼──────┐  ┌───────▼────────┐
       │     Redis 7       │    │  Meilisearch   │  │  MinIO / S3   │
       │  (Cache+Sessions  │    │  (Search Index)│  │  (Media)      │
       │   + BullMQ Queue) │    │                │  │               │
       └───────────────────┘    └────────────────┘  └───────────────┘
```

## 2. Dual ORM Strategy: Strapi ORM + Prisma

```
┌─────────────────────────────────────────────────────────┐
│                    Data Access Layer                     │
│                                                         │
│  ┌─────────────────┐     ┌──────────────────────────┐  │
│  │   Strapi ORM     │     │      Prisma Client        │  │
│  │   (Bookshelf/    │     │  (Type-safe, complex      │  │
│  │    Entity Serv.) │     │   queries, aggregations)  │  │
│  │                  │     │                          │  │
│  │  Used for:       │     │  Used for:               │  │
│  │  - Content CRUD  │     │  - Analytics aggregations│  │
│  │  - Media mgmt    │     │  - Post-wise deep stats  │  │
│  │  - User/RBAC     │     │  - Billing/subscriptions │  │
│  │  - i18n content  │     │  - Form responses        │  │
│  │  - Plugin data   │     │  - Referral tracking     │  │
│  │  - Auto REST/GQL │     │  - Multi-site management │  │
│  └─────────────────┘     └──────────────────────────┘  │
│            │                          │                 │
│            └────────────┬─────────────┘                 │
│                         ▼                               │
│              ┌─────────────────────┐                    │
│              │   PostgreSQL 16     │                    │
│              └─────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### When to use which:

| Use Strapi ORM | Use Prisma |
|---|---|
| Content CRUD (posts, pages, media) | Complex JOINs across 4+ tables |
| Admin panel operations | Aggregation queries (SUM, COUNT, GROUP BY) |
| Auto-generated REST/GraphQL APIs | Analytics & reporting |
| User/auth management | Post-wise deep analytics |
| Plugin content types | Billing, subscriptions, coupons |
| Scheduled publishing | Form responses |
| Webhooks | Referral tracking |
| | Multi-tenant queries |
| | Anything needing raw SQL power |

## 3. Data Flow Diagrams

### Content Creation (with AI)
```
Author opens editor → Collaborative editing (Yjs+WebSocket)
  → "Generate with AI" button → Strapi AI Service → OpenRouter/Ollama
  → SSE streaming → Draft saved (versioning enabled)
  → Author edits → Preview → Publish/Schedule
  → On publish: webhook → Meilisearch reindex + Redis purge + subscriber notify
```

### Post View with Deep Analytics
```
Reader visits post → Next.js SSR renders page
  → View tracked (postId, userId, IP, UA, referrer, timestamp)
  → Scroll depth tracked (25%, 50%, 75%, 100%)
  → Time-on-page measured
  → Data sent to Prisma → PostgreSQL analytics tables
  → Admin sees: scroll heatmap, completion rate, engagement score
```

### Newsletter Send (with Optimization)
```
Admin creates newsletter → Strapi → BullMQ queue
  → Worker: query subscribers via Prisma (by segment/preferences)
  → Per-subscriber: determine optimal send-time
  → Render MJML template with Handlebars → Send via SMTP
  → Track: delivery, open (pixel), click (redirect)
  → Update engagement scores → Predict churn risk
```

### Content Monetization (Paywall)
```
Reader views post → Next.js checks access
  → Free? Serve full content
  → Premium + not subscribed? Serve teaser (first 2 paragraphs)
  → Metered? Check this month's free count
  → All tracked via Prisma (PostAccessLog)
```

### Comment Submission (with AI Moderation)
```
User submits comment → Strapi validates
  → AI toxicity scoring (0.0-1.0)
  → Heuristic spam check (caps, links, speed)
  → Score < 0.3 auto-approve, 0.3-0.7 queue, > 0.7 auto-hide
  → On approve: notify thread participants → update counts
```

## 4. Tech Choices & Trade-offs

| Decision | Choice | Alternative | Why |
|----------|--------|-------------|-----|
| Base CMS | **Strapi v5** | Drupal, Ghost, Payload | Headless + plugin ecosystem + TS support + REST+GQL out of box |
| ORM (primary) | **Strapi ORM** | — | Auto-generates APIs, content-type aware |
| ORM (secondary) | **Prisma** | Knex, TypeORM | Type-safe, Prisma Studio, migration system, complex queries |
| Frontend | **Next.js 15** | Nuxt, Remix | RSC perf, ISR for static blog, huge ecosystem, App Router |
| Database | **PostgreSQL 16** | MySQL, MongoDB | JSONB for flexible content, full-text search, mature, Strapi v5 recommended |
| Search | **Meilisearch** | Elasticsearch, Algolia | Simpler ops, typo-tolerant, self-hostable, great DX |
| Cache | **Redis 7** | Memcached | Data structures, BullMQ compatibility, sessions |
| Queue | **BullMQ** | RabbitMQ, SQS | Redis-native, simple, great Node.js support |
| AI | **OpenRouter + Ollama** | OpenAI, Anthropic | Open-source first, configurable, no vendor lock-in |
| Editor (collab) | **Yjs + WebSocket** | ProseMirror collab | CRDT-based, offline-capable, framework agnostic |
| Email | **Nodemailer + SMTP** | SendGrid API | Self-hostable (Postpit/Mailpit), zero cost |
| i18n | **Strapi i18n + next-intl** | Custom | Both layers support locale content |
| Forms | **Custom Strapi plugin** | Formspree, Typeform | Native, zero external deps, unlimited submissions |
| Payments | **Custom (Stripe-free tier)** | Memberful, Paddle | Full control, metered/freemonic support |
| Analytics tracking | **Custom (Prisma)** | PostHog, Matomo | Zero external deps, post-wise deep analytics |

## 5. Post-Wise Deep Analytics Engine ✨ NEW

Tracks per-post metrics beyond simple view counts:

| Metric | Method | Storage |
|---|---|---|
| Total views | Counter increment | posts.viewCount |
| Unique visitors | IP + fingerprint dedup | page_views table |
| Scroll depth (25/50/75/100%) | Frontend IntersectionObserver | post_scroll_events |
| Avg. time on page | Frontend time measurement | post_engagement |
| Read completion rate | scroll ≥ 90% + time ≥ readingTime×0.5 | post_engagement |
| Returning vs new | Cookie/ fingerprint | page_views.visitorId |
| Reaction distribution | Count by type | reactions table |
| Comment sentiment | AI analysis (OpenRouter) | comments.sentimentScore |
| Share velocity | Track shares in first 24/48/72h | post_shares |
| SEO keyword rank | Self-hosted crawler | post_seo_tracking |
| AI content score | OpenRouter analysis | posts.contentScore |
| Content decay | Compare 30d vs 90d rolling avg | analytics materialized views |
| Heatmap data | Frontend click/ scroll tracker | post_heatmap_events |

## 6. AI Intelligence Layer ✨ NEW

| Capability | Model | Method |
|---|---|---|
| Content generation | Llama/Mistral via OpenRouter | SSE streaming to editor |
| Content scoring | OpenRouter LLM | Analyze readability, SEO, structure |
| Content decay detection | Rolling avg + LLM | Flag posts with declining engagement |
| Comment toxicity | OpenRouter or Ollama | Score 0-1, auto-moderation |
| SEO suggestions | OpenRouter LLM | Title/description/keyword optimization |
| Content gap analysis | OpenRouter LLM | Compare sitemap vs. topics |
| Send-time optimization | Heuristic (per-subscriber open history) | ML-lite, no external dependency |
| Churn prediction | Engagement trend analysis | Rolling 90-day window |
| Image alt text | OpenRouter vision model | Auto-generate for accessibility |
| Social captions | OpenRouter LLM | Generate Twitter/LinkedIn text from post |
| Content A/B testing | Statistical significance testing | Built-in, no external service |

## 7. Security Architecture

- **Auth:** JWT (access 15min + refresh 30day) + OAuth2 (Google, GitHub, Discord)
- **2FA:** TOTP (speakeasy) + backup codes
- **Rate limiting:** Per-IP + per-user (Redis-backed in production)
- **Input sanitization:** DOMPurify (frontend) + sanitize-html (backend)
- **XSS prevention:** CSP headers + output encoding
- **File upload:** MIME type validation + size limits + SVG sanitize + ClamAV (optional)
- **CORS:** Strict origin whitelist
- **Dependency scanning:** npm audit + Snyk in CI
- **Audit logs:** All admin actions logged with actor + timestamp + IP
- **GDPR:** Consent management, data export, right to deletion, anonymization
- **IP blocking:** Auto-block after N failed attempts or spam reports
- **Session management:** View + revoke active sessions

## 8. Performance Strategy

- **Frontend:** ISR for blog pages, image optimization (next/image), lazy loading, code splitting
- **API:** Redis caching (TTL-based), GraphQL DataLoader for N+1, cursor pagination
- **Images:** Sharp processing pipeline, WebP/AVIF conversion, responsive srcset, LQIP placeholder
- **Search:** Meilisearch indexed fields, sub-50ms queries
- **Background:** BullMQ workers for newsletters, notifications, image processing
- **Database:** PostgreSQL indexes on all filter/sort fields, materialized views for analytics, connection pooling (PgBouncer)
- **CDN:** CloudFlare free tier or self-hosted Nginx reverse proxy
- **Monitoring:** Prometheus + Grafana + Loki, Core Web Vitals tracking

## 9. Accessibility

- WCAG 2.1 Level AA compliance target
- Semantic HTML, ARIA labels, keyboard navigation
- Focus management in modals, editor, dropdowns
- Skip-to-content links
- Color contrast ratio ≥ 4.5:1
- Reduced motion support (prefers-reduced-motion)
- Dark mode (respects prefers-color-scheme)
- High contrast mode
- axe-core automated testing in CI
- Lighthouse accessibility audit in CI

## 10. Multi-Site / Multi-Tenant Architecture ✨ NEW

```
┌──────────────────────────────────────────┐
│            Single Strapi Install          │
│                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Site A  │ │  Site B  │ │  Site C  │ │
│  │ tech.blog│ │news.blog │ │cook.blog │ │
│  │          │ │          │ │          │ │
│  │ Own:     │ │ Own:     │ │ Own:     │ │
│  │ - posts  │ │ - posts  │ │ - posts  │ │
│  │ - authors│ │ - authors│ │ - authors│ │
│  │ - theme  │ │ - theme  │ │ - theme  │ │
│  │ - domain │ │ - domain │ │ - domain │ │
│  └──────────┘ └──────────┘ └──────────┘ │
│                                          │
│  All share: auth, media (optional),      │
│  admin dashboard, plugins                │
└──────────────────────────────────────────┘
```

## 11. Deployment Architectures

### Development (Docker Compose)
```
docker compose up → Strapi + Next.js + Postgres + Redis + Meilisearch + MinIO
```

### Production (Single VPS)
```
Docker Compose + Nginx reverse proxy + Let's Encrypt + automated backups
```

### Production (Kubernetes)
```
K8s cluster → Strapi pods + Next.js pods + PostgreSQL (RDS/Cloud SQL) +
Redis (ElastiCache/Memorystore) + Meilisearch + Ingress (cert-manager)
```

### Production (Serverless)
```
Next.js → Vercel (free tier)
Strapi → Railway / Render / AWS ECS
PostgreSQL → Neon / Supabase / Cloud SQL
Redis → Upstash / Memorystore
Meilisearch → Meilisearch Cloud (self-hosted option)
```
