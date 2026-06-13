# CMS Platform — Complete Feature Reference

> Last updated: 2026-06-13
> Base: Strapi v5 + Next.js 14 + PostgreSQL + Redis + Meilisearch
> AI: OpenRouter (open-source models) / Ollama (self-hosted)

---

## LEGEND

✅ = Available out-of-the-box (Strapi v5)
🔧 = Built by us (custom plugin/service)
📋 = Planned / Not yet built
🚫 = Not applicable

---

## 1. CONTENT MANAGEMENT

### 1.1 Content Types & Fields
✅ Collection types (posts, pages, custom types)
✅ Single types (homepage, settings, about page)
✅ Component types (reusable field groups like "seo-block", "hero-section")
✅ Dynamic zones (mix components inside a content type)
✅ 20+ field types: text, rich text, number, boolean, date, datetime, email, password, media, enumeration, relation, component, dynamic zone, JSON, blocks
✅ Custom field types via plugins
✅ Required / unique / default value / min-max validation per field

### 1.2 Rich Text Editor
✅ CKEditor 5 built-in (headings, bold, italic, lists, links, images, tables, code blocks)
✅ Markdown editor option
✅ TipTap / Slate custom editor support
✅ Embed media directly in content
✅ Code syntax highlighting
✅ Custom toolbar configuration

### 1.3 Media Library
✅ Image, video, audio, document uploads
✅ Folder organization
✅ Focal point selection for smart cropping
✅ Alt text & title metadata
✅ Image editing (crop, rotate, resize)
✅ Multiple formats: local disk, S3, MinIO, Google Cloud Storage, Azure Blob
✅ Responsive image generation (srcset)
✅ WebP / AVIF conversion via Sharp
✅ CDN integration (CloudFlare, CloudFront)
✅ Upload size limits & MIME type restrictions
✅ SVG sanitization

### 1.4 Draft & Publish
✅ Draft / Published / Archived states
✅ Preview mode (see draft before publishing)
✅ Content versioning (full history, diff view, rollback)
✅ Scheduled publishing (publish at future date/time)
✅ Unpublishing (take content down)
✅ Content workflow stages (draft → review → approved → published)

### 1.5 Multi-Language (i18n)
✅ Built-in internationalization plugin
✅ Per-field localization (translate title, content, SEO fields)
✅ 50+ supported languages
✅ Locale-specific URLs (/en/blog, /es/blog)
✅ Fallback locale when translation missing
✅ Language switcher in admin panel
✅ Translation management UI
✅ next-intl integration on frontend

### 1.6 Taxonomy
✅ Tags (flat, many-to-many with posts)
✅ Categories (hierarchical, parent-child)
✅ Custom taxonomies (e.g., "topics", "series", "difficulty")
✅ Tag / category archive pages
✅ Tag cloud widget
✅ Filter content by taxonomy

### 1.7 Content Relations
✅ One-to-one, one-to-many, many-to-many
✅ Polymorphic relations (e.g., "related content" that can be post or page)
✅ Self-referencing (parent-child)
✅ Bidirectional relation management
✅ Relation sorting & filtering

---

## 2. BLOG MANAGEMENT

### 2.1 Blog Templates
📋 Blog listing page (grid / list / masonry layouts)
📋 Single post template (with hero, content, author box, related posts)
📋 Author archive page (all posts by author)
📋 Tag / category archive pages
📋 Search results page
📋 404 / error pages
📋 Custom page templates per category

### 2.2 Featured Content
✅ Featured posts flag (boolean field)
📋 Featured posts carousel / hero section
📋 "Editor's Picks" section
📋 Trending posts (most viewed in last 7 days)
📋 Related posts (by tags, categories, or AI similarity)

### 2.3 Author Pages
✅ Author bio, avatar, social links
✅ Author archive (all posts by author)
✅ Multiple authors per post
✅ Guest author support
✅ Author role-based permissions

### 2.4 Reading Experience
📋 Reading time estimation (auto-calculated from word count)
📋 Progress bar (scroll position indicator)
📋 Table of contents (auto-generated from headings)
📋 Dark mode toggle
📋 Font size adjustment
📋 Print-friendly view
📋 "Estimated read time" badge
📋 Code copy button in code blocks
📋 Image lightbox / zoom

### 2.5 SEO
✅ SEO title (custom, falls back to post title)
✅ Meta description (custom, falls back to excerpt)
✅ Custom slug / URL
✅ Open Graph tags (og:title, og:description, og:image, og:type)
✅ Twitter Card tags
✅ Canonical URL
✅ Robots meta (noindex, nofollow)
✅ Structured data (JSON-LD: Article, BreadcrumbList, Organization)
✅ Sitemap.xml auto-generation
✅ RSS feed (per category, per author, all posts)
✅ 301 redirect management
✅ SEO analysis / suggestions (via AI)

### 2.6 RSS Feed
📋 Auto-generated RSS 2.0 feed
📋 Per-category RSS feeds
📋 Per-author RSS feeds
📋 Customizable feed content (full post vs excerpt)
📋 Atom feed support

---

## 3. USER MANAGEMENT

### 3.1 Authentication
✅ Email + password registration & login
✅ JWT access + refresh tokens
✅ Token expiration & rotation
📋 OAuth2: Google
📋 OAuth2: GitHub
📋 OAuth2: Twitter / X
📋 OAuth2: Discord
📋 OAuth2: Apple
📋 Magic link / passwordless login
📋 SSO (SAML 2.0) for enterprise
📋 WebAuthn / passkey support

### 3.2 Two-Factor Authentication (2FA)
📋 TOTP (Google Authenticator, Authy)
📋 Backup codes
📋 Email-based 2FA
📋 SMS-based 2FA (via Twilio)

### 3.3 Roles & Permissions
✅ Built-in roles: Admin, Editor, Authenticated, Public
📋 Custom roles (e.g., "SEO Manager", "Newsletter Editor")
📋 Granular permissions per content type (create, read, update, delete)
📋 Field-level permissions (hide sensitive fields)
📋 Content-level permissions (edit only own posts)
📋 Category-based permissions
📋 Plugin-level permissions

### 3.4 User Profiles
✅ Username, email, password
📋 Profile page (avatar, bio, website, social links)
📋 Profile editing (frontend + admin)
📋 Avatar upload
📋 Activity history (posts, comments)
📋 Notification preferences
📋 Language preference
📋 Timezone setting

### 3.5 Password Management
✅ Password reset via email
✅ Password strength validation
✅ Password history (prevent reuse)
📋 Account lockout after failed attempts
📋 Session management (view & revoke active sessions)

---

## 4. NEWSLETTER SYSTEM

### 4.1 Subscription Management
✅ Subscriber model (email, name, preferences)
✅ Subscribe / unsubscribe flow
✅ Double opt-in (confirmation email)
✅ Unsubscribe link in every email
📋 Preference center (choose topics, frequency)
📋 Import / export subscribers (CSV)
📋 Subscriber tagging
📋 Subscriber activity tracking (last open, last click)

### 4.2 Email Templates
📋 MJML responsive email templates
📋 Handlebars variables (name, unsubscribe URL, etc.)
📋 Template library (welcome, digest, announcement, custom)
📋 Live preview (desktop + mobile)
📋 Dark mode email support
📋 Custom template upload

### 4.3 Sending
📋 Queue-based sending via BullMQ (handles 10K+ subscribers)
📋 SMTP support (SendGrid, Mailgun, Amazon SES, Postmark)
📋 Batch sending with rate limiting
📋 Scheduled sends
📋 Test email preview
📋 Send to segment only
📋 A/B testing (subject line variants)

### 4.4 Segmentation
📋 Segment by tags
📋 Segment by role
📋 Segment by locale
📋 Segment by activity (opened in last 30 days)
📋 Segment by subscription date
📋 Dynamic segments (auto-updating)

### 4.5 Analytics
📋 Delivery count
📋 Open rate (tracking pixel)
📋 Click rate (link tracking)
📋 Bounce rate
📋 Unsubscribe rate
📋 Per-subscriber engagement history
📋 Campaign comparison
📋 CSV export

---

## 5. COMMENTS SYSTEM

### 5.1 Comment Features
✅ Threaded / nested comments (parent-child)
✅ Pagination (load more / infinite scroll)
✅ Comment editing (within time window)
✅ Comment deletion
✅ Rich text in comments (limited formatting)
📋 Comment voting (upvote / downvote comments)
📋 Comment sorting (newest, oldest, most liked)
📋 Comment pinning
📋 Comment permalink

### 5.2 Moderation
✅ Moderation queue (pending comments)
✅ Approve / reject / mark as spam
✅ Bulk moderation actions
📋 Auto-approve for trusted users
📋 Keyword blacklist
📋 Profanity filter
📋 Rate limiting (max comments per hour)

### 5.3 Spam Prevention
✅ Heuristic spam scoring (caps, links, keywords)
✅ Honeypot field
✅ Time-based check (too fast = bot)
📋 Akismet integration
📋 Google Perspective API
📋 reCAPTCHA v3
📋 IP-based blocking

### 5.4 Abuse Reporting
✅ Report abuse button per comment
✅ Report reasons: spam, harassment, hate speech, misinformation, other
✅ Auto-flag after N reports
✅ Admin review queue for reports
✅ Reporter email (optional)

### 5.5 Notifications
📋 Email notification on reply (opt-in)
📋 Email notification on mention
📋 Admin notification on new comment
📋 Webhook on new comment
📋 In-app notifications (bell icon)

---

## 6. REACTIONS SYSTEM

### 6.1 Reaction Types
✅ Like (heart)
✅ Upvote / downvote
✅ Emoji reactions: love, laugh, surprised, sad, angry
📋 Custom emoji reactions
📋 Animated reactions (confetti on milestone)

### 6.2 Reaction Features
✅ Toggle on/off (click again to remove)
✅ One reaction per user per content (switch type)
✅ Reaction counts displayed
✅ User's current reaction highlighted
✅ Works on posts AND comments
📋 Reaction leaderboard (most reacted posts)
📋 Real-time reaction updates (WebSocket)

---

## 7. AI BLOG WRITING

### 7.1 Content Generation
✅ Generate titles (5 variants)
✅ Generate introduction paragraphs
✅ Generate full blog post drafts
✅ Generate outlines (H2/H3 structure)
✅ Generate excerpts / summaries
✅ Generate SEO meta (title, description, keywords)
📋 Generate image alt text
📋 Generate social media captions
📋 Generate content improvements / rewrites
📋 Generate FAQ section
📋 Generate table of contents

### 7.2 AI Models
✅ OpenRouter (open-source model catalog)
  - Llama 3.1 70B / 8B
  - Mistral 7B / Mixtral 8x7B
  - Gemma 2 9B
  - Qwen 2.5 72B
  - Phi-3 Medium
  - And 100+ more
📋 Ollama (self-hosted, zero cost)
📋 vLLM (self-hosted, production-grade)
📋 llama.cpp (edge / local)
📋 Provider-agnostic adapter (swap models via env var)

### 7.3 Editor Integration
📋 "Generate with AI" button in editor
📋 SSE streaming (see text appear in real-time)
📋 AI sidebar panel
📋 Tone selector (professional, casual, technical, friendly)
📋 Word count target
📋 Keyword input for SEO-optimized content
📋 Regenerate / refine / shorten / expand

### 7.4 AI Safety
📋 Content policy filter (no harmful content)
📋 AI-generated content watermark
📋 Usage tracking & rate limiting per user
📋 Max tokens per generation
📋 Cost tracking (even for open models, track compute)

---

## 8. SEARCH

### 8.1 Search Engine
✅ Meilisearch integration (self-hosted)
📋 Elasticsearch option
📋 Algolia option (managed)

### 8.2 Search Features
✅ Full-text search across posts, pages
✅ Typo tolerance ("javscript" finds "JavaScript")
✅ Faceted search: filter by author, tags, categories, date, locale
✅ Sort by relevance, date, popularity, reading time
✅ Search suggestions / autocomplete
✅ Highlight matching terms in results
✅ Search analytics (popular queries, no-result queries)
📋 Search across comments
📋 Search across media library
📋 "Did you mean?" spell correction
📋 Synonym support

---

## 9. ANALYTICS DASHBOARD

### 9.1 Metrics
✅ Post view counts (total + daily / weekly / monthly)
✅ Unique visitors (by IP)
✅ Top posts by views
✅ Comment counts
✅ Reaction counts (by type)
✅ Newsletter metrics (sent, opened, clicked, bounced)
✅ Subscriber growth over time
📋 User engagement time (via frontend tracking)
📋 Referrer tracking
📋 Device / browser breakdown
📋 Geographic distribution
📋 Conversion tracking (subscribe rate, comment rate)

### 9.2 Dashboard UI
📋 Overview cards (views, comments, subscribers, reactions)
📋 Charts: line (views over time), bar (top posts), pie (reaction types)
📋 Date range picker
📋 Real-time activity feed
📋 Export to CSV
📋 Export to PDF report

### 9.3 Reports
📋 Weekly digest email to admin
📋 Monthly performance report
📋 Content performance ranking
📋 Author performance ranking
📋 Custom report builder

---

## 10. MODERATION & SAFETY

### 10.1 Content Moderation
✅ Comment moderation queue
✅ Abuse reporting
✅ Auto-flag after N reports
📋 Content review workflow (draft → review → approved)
📋 Profanity filter for comments
📋 Link whitelist / blacklist
📋 Image moderation (NSFW detection via AI)

### 10.2 Spam Protection
✅ Heuristic spam scoring
✅ Rate limiting per IP
✅ Honeypot fields
✅ CAPTCHA on comment form
📋 Akismet integration
📋 Automatic IP blocking after repeated spam

### 10.3 Content Policies
📋 Configurable content rules
📋 Auto-flag hate speech (keyword + AI)
📋 Auto-flag personal information leaks
📋 GDPR-compliant data handling
📋 Right to be forgotten (delete user + all data)
📋 Data export (GDPR portability)

---

## 11. PERFORMANCE

### 11.1 Caching
📋 Redis caching layer (API responses, rendered pages)
📋 HTTP cache headers (ETag, Cache-Control)
📋 CDN integration (CloudFlare, CloudFront, Fastly)
📋 Stale-while-revalidate strategy
📋 Cache invalidation on content update

### 11.2 Image Optimization
📋 Sharp-based processing pipeline
📋 Auto WebP / AVIF conversion
📋 Responsive srcset generation
📋 Lazy loading (native + Intersection Observer)
📋 Blur-up placeholder (LQIP)
📋 Image CDN (Cloudinary, imgix, or CloudFlare Images)

### 11.3 Frontend Performance
📋 Next.js App Router + React Server Components
📋 ISR (Incremental Static Regeneration) for blog pages
📋 Static generation for tag/category pages
📋 Code splitting per route
📋 Font optimization (next/font)
📋 Script optimization (next/script)
📋 Core Web Vitals monitoring

### 11.4 API Performance
📋 GraphQL DataLoader (fix N+1 queries)
📋 Database query optimization (indexes, EXPLAIN)
📋 Connection pooling (PgBouncer)
📋 Response compression (gzip / brotli)
📋 Pagination (cursor-based for large datasets)

---

## 12. ACCESSIBILITY

### 12.1 Standards
📋 WCAG 2.1 Level AA compliance target
📋 Semantic HTML throughout
📋 ARIA labels on all interactive elements
📋 Keyboard navigation for all flows
📋 Focus management in modals, editor, dropdowns
📋 Skip-to-content links
📋 Screen reader testing

### 12.2 Visual
📋 Color contrast ratio >= 4.5:1 (text), >= 3:1 (large text)
📋 Don't rely on color alone for information
📋 Responsive text sizing (rem/em, not px)
📋 Reduced motion support (prefers-reduced-motion)
📋 High contrast mode support
📋 Dark mode (respects prefers-color-scheme)

### 12.3 Testing
📋 axe-core automated testing in CI
📋 Lighthouse accessibility audit
📋 Manual screen reader testing (NVDA, VoiceOver)
📋 Keyboard-only navigation testing

---

## 13. APIs & INTEGRATIONS

### 13.1 APIs
✅ REST API (auto-generated from content types)
✅ GraphQL API (auto-generated schema)
✅ API token management (per-plugin, per-role)
✅ API rate limiting
📋 OpenAPI / Swagger documentation
📋 Webhook events (post published, comment created, user registered, etc.)
📋 API versioning (v1, v2)

### 13.2 Integrations
📋 Slack notifications (new comment, post published)
📋 Discord webhook
📋 Social sharing (Twitter/X, Facebook, LinkedIn, Reddit, Hacker News)
📋 Zapier / Make (Integromat) via webhooks
📋 Google Analytics 4
📋 Google Tag Manager
📋 Plausible Analytics (privacy-first)
📋 Sentry (error tracking)

### 13.3 Import / Export
✅ CSV export for analytics
📋 Content export (JSON, Markdown)
📋 Content import (from WordPress, Ghost, Contentful)
📋 Subscriber import / export (CSV)
📋 Media library export

---

## 14. SECURITY

### 14.1 Authentication Security
✅ JWT with short-lived access tokens (15 min)
✅ Long-lived refresh tokens (30 days)
✅ Token rotation on refresh
📋 Brute force protection (rate limiting + lockout)
📋 Session management (view & revoke)
📋 IP allowlisting for admin panel

### 14.2 Input Security
✅ Input sanitization (DOMPurify frontend + sanitize-html backend)
✅ XSS prevention (Content Security Policy headers)
✅ SQL injection prevention (parameterized queries via ORM)
✅ CSRF protection
✅ File upload validation (MIME type, size, virus scan)

### 14.3 Infrastructure Security
✅ Helmet.js security headers
✅ CORS strict origin whitelist
✅ HTTPS enforcement
✅ Rate limiting per IP + per user
📋 WAF (CloudFlare or AWS WAF)
📋 DDoS protection
📋 Dependency scanning (npm audit + Snyk in CI)
📋 Secret management (environment variables, Vault)

### 14.4 Audit & Compliance
📋 Audit logs (who did what, when)
📋 Admin action logging
📋 Login attempt logging
📋 GDPR compliance (consent, data export, right to deletion)
📋 SOC 2 readiness (audit trail, access controls)

---

## 15. DEVELOPER EXPERIENCE

### 15.1 Local Development
📋 Docker Compose (one command: `docker compose up`)
📋 Hot reload (Strapi + Next.js)
📋 Database seeding (`npm run seed`)
📋 Sample data included
📋 Makefile for common commands

### 15.2 CI/CD
📋 GitHub Actions templates
📋 Automated testing on PR
📋 Lint + type check
📋 Build verification
📋 Deploy to staging on merge to develop
📋 Deploy to production on merge to main
📋 Database migration in CI

### 15.3 Code Quality
✅ TypeScript throughout
✅ ESLint configuration
✅ Prettier formatting
📋 Pre-commit hooks (husky + lint-staged)
📋 Conventional commits
📋 Automated dependency updates (Renovate / Dependabot)

### 15.4 Testing
📋 Unit tests (Jest) — services, utilities
📋 Integration tests — API endpoints, database
📋 E2E tests (Playwright) — critical user flows
📋 Test coverage reporting
📋 CI test gates

### 15.5 Documentation
📋 README with setup instructions
📋 API documentation (auto-generated)
📋 Architecture decision records (ADRs)
📋 Plugin development guide
📋 Deployment guide
📋 Environment variable reference
📋 Contributing guide

---

## 16. DEPLOYMENT & INFRASTRUCTURE

### 16.1 Containerization
📋 Docker Compose (local dev: Strapi + Postgres + Redis + Meilisearch + Next.js)
📋 Multi-stage Docker images (optimized for production)
📋 Docker health checks
📋 Non-root container user

### 16.2 Production Deployment
📋 Kubernetes manifests (or Helm chart)
📋 Horizontal pod autoscaling
📋 Rolling deployments (zero downtime)
📋 Database backup automation
📋 SSL/TLS via cert-manager
📋 Ingress controller (Nginx or Traefik)

### 16.3 Cloud Providers
📋 AWS (ECS/EKS + RDS + ElastiCache + S3)
📋 Google Cloud (Cloud Run + Cloud SQL + Memorystore)
📋 Azure (Container Instances + Azure SQL + Azure Cache)
📋 DigitalOcean (App Platform + Managed DB + Spaces)
📋 Self-hosted (any VPS with Docker)

### 16.4 Monitoring
📋 Health check endpoint (/api/health)
📋 Prometheus metrics endpoint
📋 Grafana dashboards
📋 Log aggregation (Loki, CloudWatch, or Papertrail)
📋 Uptime monitoring (Better Uptime, Pingdom)
📋 Error tracking (Sentry)
📋 Performance monitoring (Core Web Vitals)

---

## SUMMARY: BUILD STATUS

### ✅ Already Available (Strapi v5) — 35+ features
Content CRUD, rich text, draft/publish, versioning, media library, auth, roles, i18n, taxonomy, admin panel, GraphQL, webhooks, email, migrations, file upload

### 🔧 Custom Built by Us — 15+ features
AI content generation, threaded comments, reactions, spam detection, abuse reporting, newsletter system, search (Meilisearch), analytics, rate limiting, view tracking, seed script

### 📋 Planned / In Progress — 50+ features
Next.js frontend, Docker Compose, OAuth2, 2FA, scheduled publishing, RSS, SEO fields, image pipeline, newsletter analytics, comment notifications, webhooks, CSV export, accessibility audit, tests, CI/CD, deployment guide

### Total: ~100+ features covering everything a modern CMS needs
