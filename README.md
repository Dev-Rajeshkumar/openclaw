# FormFlow 🚀

**AI-Powered Form Backend — Build forms with AI. Accept payments. Automate everything.**

FormFlow is a full-stack micro-SaaS platform that lets you create forms using AI, accept payments via Stripe, connect to 1000+ tools, and manage everything from a beautiful dashboard.

## ✨ Features

### For Everyone
- **AI-Native Form Building** — Describe your form in plain English, GPT-4o generates it instantly
- **Advanced Spam Protection** — Honeypot fields, Turnstile, IP filtering, time-trap checks
- **Webhooks & Integrations** — Zapier, Make, Google Sheets, Slack, Salesforce, Notion, Airtable
- **Stripe Payments** — Accept one-time payments and subscriptions through your forms
- **AI Analytics** — AI analyzes your submissions for trends, sentiment, and suggestions

### For Developers
- **REST API** — Clean, versioned API with JWT and API key authentication
- **Auto-generated Docs** — Interactive API documentation with code snippets
- **CLI Tool** — Manage forms, submissions, and exports from the terminal
- **Webhooks with HMAC** — Cryptographically signed webhook payloads

### For Teams
- **Role-Based Access Control** — Manage team permissions and form access
- **Activity Logging** — Complete audit trail of every user action
- **Alert System** — Real-time alerts for security events and errors
- **Discord Integration** — Critical errors and unauthorized access notified instantly

## 🏗️ Architecture

```
formflow/
├── frontend/          # Next.js 15 + Tailwind + Shadcn UI
│   ├── src/
│   │   ├── app/       # Pages & routes (App Router)
│   │   ├── components/# UI components
│   │   │   ├── ui/    # Base components (Button, Input, Card...)
│   │   │   └── features/  # Feature-specific components
│   │   ├── context/   # React context providers
│   │   ├── hooks/     # Custom React hooks
│   │   ├── lib/       # API client, helpers, constants
│   │   ├── types/     # TypeScript type definitions
│   │   └── styles/    # Global styles
│   └── ...
└── backend/           # Express.js + Prisma + MongoDB
    ├── prisma/
    │   └── schema.prisma  # Database schema
    └── src/
        ├── config/    # Environment, Prisma client
        ├── constants/ # Plan limits, rate limits
        ├── middlewares/  # Auth, error handling, activity logging
        ├── modules/   # Feature-based modules
        │   ├── auth/      # JWT signup/login
        │   ├── form/      # Form CRUD
        │   ├── submission/  # Public submit, export
        │   ├── webhook/   # HMAC-signed webhooks
        │   ├── ai/        # GPT-4o form generation
        │   ├── integration/  # Zapier, Make, Sheets...
        │   ├── payment/   # Stripe checkout
        │   ├── activity/  # Audit logging + alerts
        │   └── user/      # Profile, stats
        ├── routes/    # Central route registry
        ├── types/     # TypeScript types
        └── utils/     # ApiError, catchAsync, logger
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (Atlas free tier works)
- (Optional) OpenAI API key for AI features
- (Optional) Stripe account for payments
- (Optional) Discord webhook URL for alerts

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npx prisma db push
npm run dev
# API runs on http://localhost:3001
```

### Frontend

```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

## 📚 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Create account |
| POST | `/api/v1/auth/login` | Sign in |
| GET | `/api/v1/auth/me` | Get profile |

### Forms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/forms` | List forms |
| POST | `/api/v1/forms` | Create form |
| GET | `/api/v1/forms/:id` | Get form |
| PUT | `/api/v1/forms/:id` | Update form |
| DELETE | `/api/v1/forms/:id` | Delete form |

### Submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/submissions/:slug` | Submit form (public) |
| GET | `/api/v1/submissions/form/:formId` | List submissions |
| GET | `/api/v1/submissions/form/:formId/export` | Export CSV |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai/generate-form` | Generate form with AI |
| POST | `/api/v1/ai/analyze` | Analyze submissions |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/forms/:formId/webhooks` | Create webhook |
| GET | `/api/v1/forms/:formId/webhooks` | List webhooks |
| DELETE | `/api/v1/forms/:formId/webhooks/:id` | Delete webhook |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/forms/:formId/payments/checkout` | Create Stripe checkout |

### Activity
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/activity` | My activity log |
| GET | `/api/v1/activity/alerts/unread` | Unread alerts |
| PATCH | `/api/v1/activity/alerts/:id/read` | Mark alert read |

## 💰 Pricing

| Plan | Price | Forms | Submissions | Features |
|------|-------|-------|-------------|----------|
| Free | ₹0 | 3 | 100/mo | AI builder, basic spam protection, API |
| Pro | ₹499/mo | Unlimited | Unlimited | + Turnstile, webhooks, integrations, Stripe |
| Enterprise | Custom | Unlimited | Unlimited | + RBAC, SSO, SOC2/HIPAA, white-label |

## 🛡️ Security

- JWT + API key authentication
- HMAC-SHA256 signed webhooks
- Honeypot + Turnstile spam protection
- Rate limiting (10 submissions/min, 200 API calls/15min)
- Activity logging for complete audit trail
- Discord alerts for unauthorized access and critical errors
- Helmet.js security headers
- CORS protection

## 📝 License

MIT — do whatever you want with it.

---

Built with ❤️ by Rajeshkumar S & Maya ✨
