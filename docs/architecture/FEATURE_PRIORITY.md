# Feature Priority — Core vs. Extensions (Expanded)

> Updated: 2026-06-13 — Added pro features, post-wise analytics, and unique differentiators

## P0 — Core (Must-Have for MVP)

| Feature | Justification |
|---------|---------------|
| Content CRUD (posts, pages) | Foundation — nothing works without this |
| Rich-text editor | Authors need to create content |
| Draft/publish workflow | Content lifecycle management |
| Media library | Images/files for content |
| Auth (email/password + JWT) | Secure access to admin |
| Blog templates (list + detail) | Frontend to display content |
| Basic search | Users need to find content |
| Roles & permissions (admin, editor, author) | Access control |

## P1 — High Value (Ship for v1.0)

| Feature | Justification |
|---------|---------------|
| SEO fields + meta tags | Discoverability is critical |
| Comments (threaded + moderation) | Community engagement |
| Reactions (likes/upvotes) | Lightweight engagement |
| Newsletter subscription + sending | Audience building |
| Multi-language support | Broader reach |
| RSS feed | Standard for blogs |
| Author pages | Content attribution |
| Taxonomy (tags, categories) | Content organization |
| Scheduled publishing | Editorial workflow |

## P2 — Differentiators (Ship for v1.1–v1.2)

| Feature | Justification |
|---------|---------------|
| AI blog writing (open-source models via OpenRouter/Ollama) | Unique selling point, huge productivity boost, no API costs for self-hosted |
| OAuth2 (Google, GitHub) | Better UX for login |
| 2FA | Security hardening |
| Analytics dashboard | Data-driven decisions |
| Search facets (author/date/tags) | Better content discovery |
| Email templates + segmentation | Newsletter sophistication |
| Spam filtering (automated) | Content quality |
| Image optimization pipeline | Performance |

## P3 — Nice-to-Have (v2.0+)

| Feature | Justification |
|---------|---------------|
| Webhooks + Slack/Discord | Integration ecosystem |
| Social sharing buttons | Distribution |
| Abuse reporting + auto-block | Community safety |
| CSV export | Data portability |
| Advanced analytics (funnels, cohorts) | Growth analysis |
| GraphQL API (if not already) | Flexible client queries |
| CDN integration | Global performance |
| Load testing infrastructure | Reliability at scale |

## P4 — Pro Differentiators (v2.5+) ✨ NEW

> Features that competitors (WordPress, Ghost, Contentful) don't provide natively.

| Feature | Justification |
|---------|---------------|
| Post-wise deep analytics (scroll depth, read completion, heatmap) | Know exactly how readers interact with each post |
| AI content scoring (0-100 readability/SEO/engagement) | Auto-grade content quality |
| Content decay detection + auto-suggestions | Keep content fresh automatically |
| Send-time optimization per subscriber | Maximize newsletter open rates |
| Content A/B testing (title variants) | Data-driven content optimization |
| Freemium/metered paywall system | Built-in monetization |
| Coupon/discount system | Subscription management |
| Referral program engine | Growth hacking built-in |
| Multi-site/multi-tenant support | Single install, multiple blogs |
| Collaborative real-time editor (Google Docs-style) | Team content creation |
| Drag-and-drop form builder with logic | Typeform-level forms native |
| AI autocomplete in editor (ghost text) | Supercharged writing experience |
| Sock puppet detection for comment moderation | Advanced community safety |
| Content dependency graph | Understand content relationships |
| Content gap analysis vs. competitors | Find missing topics automatically |
| Churn prediction for subscribers | Proactive engagement |

## P5 — AI Intelligence Layer (v3.0+) ✨ NEW

| Feature | Justification |
|---------|---------------|
| Auto-content refresh suggestions | AI identifies outdated sections |
| Competitor content gap analysis | Semantic analysis of your vs. competitor content |
| AI-powered content calendar suggestions | "You haven't published about X in 45 days" |
| Semantic duplicate content detection | Go beyond exact match |
| Auto-generated FAQ sections | Rich snippets for SEO |
| Social media caption generator | Cross-platform content |
| Content performance prediction | Predict engagement before publishing |
| Personalized content recommendations | Recommend posts per user behavior |

## Trade-offs

| Decision | Trade-off |
|----------|-----------|
| Strapi vs. Drupal | Strapi = faster dev, smaller community. Drupal = more built-in, steeper learning curve |
| Meilisearch vs. Elasticsearch | Meilisearch = simpler, faster setup. Elasticsearch = more features, heavier ops |
| Next.js vs. custom Node frontend | Next.js = framework overhead but huge perf wins via RSC/ISR |
| OpenAI vs. local LLM | OpenAI = best quality, ongoing cost. Local = free, lower quality, GPU needed |
| BullMQ vs. RabbitMQ | BullMQ = simpler, Redis-native. RabbitMQ = more mature, more features |
| Built-in search vs. external index | Built-in = less infra. External (Meilisearch) = much better search UX |
