# BillingBee — Project Overview

> **Version:** 2.0.0
> **Stack:** Next.js 15 (Frontend) + Express.js (Backend) + MongoDB (via Prisma ORM)
> **Branch:** `BillingBee`
> **License:** MIT

BillingBee is a full-featured invoicing and billing management platform for Indian businesses. It supports GST-compliant invoicing, online payments (Razorpay), AI-powered invoice creation, team management, recurring invoices, and a client portal.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js 15)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │  Dashboard   │  │ Client Portal│  │ Public Invoice    │ │
│  │ /dashboard/* │ │  /portal/*   │  │ /i/{token}        │ │
│  └──────────────┘  └──────────────┘  └───────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────────┐
│                     Backend (Express.js)                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────────────────┐  │
│  │   Auth     │ │  Invoice   │ │   Razorpay Payments    │  │
│  │   JWT      │ │   Engine   │ │   Webhooks             │  │
│  └────────────┘ └────────────┘ └────────────────────────┘  │
│  ┌────────────┐ ┌────────────┐ ┌────────────────────────┐  │
│  │  AI (GPT)  │ │   Email    │ │   Cron Jobs            │  │
│  │  Parsing   │ │   SMTP     │ │   Recurring + Reminder │  │
│  └────────────┘ └────────────┘ └────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ Prisma ORM
┌──────────────────────────▼──────────────────────────────────┐
│                       MongoDB                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
openclaw/
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── config/             # Environment configuration
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Auth, rate limit, activity log
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # Business logic
│   │   ├── jobs/               # Cron jobs (recurring invoices, email reminders)
│   │   ├── utils/              # Helpers (response, PDF, email, AI)
│   │   ├── types/              # TypeScript interfaces
│   │   ├── prisma/             # Prisma client & schema
│   │   └── index.ts            # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # Next.js 15 app
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/         # Login, register, forgot password
│   │   │   ├── (dashboard)/    # Protected dashboard pages
│   │   │   ├── portal/         # Client portal (magic link auth)
│   │   │   ├── i/[token]/      # Public invoice view (no auth)
│   │   │   ├── public/         # Public invoice with PDF
│   │   │   └── page.tsx        # Landing page
│   │   ├── components/         # Shared UI components
│   │   ├── hooks/              # React hooks (useAuth)
│   │   ├── stores/             # Zustand stores (templates)
│   │   ├── lib/                # API client, utils, validations
│   │   ├── types/              # TypeScript interfaces
│   │   └── context/            # Theme context (dark mode)
│   ├── package.json
│   └── tailwind.config.ts
└── docs/                       # Project documentation ← YOU ARE HERE
```

---

## 🚀 Quick Start

### Backend

```bash
cd backend
npm install
# Create .env file (see Environment Variables below)
npx prisma generate
npx prisma db push
npm run dev    # Starts on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
# Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm run dev    # Starts on http://localhost:3000
```

---

## 🔑 Key Features

| Feature | Description |
|---------|-------------|
| **Invoices** | Create, edit, delete, PDF generation with 22 templates, GST-compliant |
| **Estimates** | Convert to invoices, track status |
| **Recurring Invoices** | Auto-generate on schedule (daily/weekly/monthly/quarterly/yearly) |
| **Clients** | Full CRUD, client portal with magic link auth |
| **Products & Services** | Catalog for quick invoice line items |
| **Payments** | Record offline, online via Razorpay, payment tracking |
| **Expenses** | Categorize, track, attach receipts |
| **Reports** | Revenue, expenses, profit — with CSV export |
| **GST Reports** | GST summary, GSTR-1 format |
| **Team Management** | Invite members, role-based access |
| **Files** | Upload, attach to invoices, download |
| **AI Features** | Natural language invoice parsing, business insights, follow-up messages |
| **Notifications** | In-app + email notifications, preference settings |
| **API Keys** | Generate keys for external API access |
| **Subscription** | 4-tier plans (Free/Starter/Professional/Business) |
| **White Label** | Custom branding, colors, email settings |
| **22 Invoice Templates** | Tiered templates with customizable text labels |
| **Dark Mode** | System preference + manual toggle |
| **Client Portal** | Clients view/pay invoices via magic link |
| **Bulk Operations** | Select & mark-sent/paid/delete multiple invoices |

---

## 🗺️ Feature Checklist

### Core Modules
- [x] Authentication (Register, Login, Forgot Password, JWT)
- [x] Dashboard with stats & overview
- [x] Invoices (CRUD, PDF, templates, payments, bulk actions)
- [x] Estimates (CRUD, convert to invoice)
- [x] Recurring Invoices (CRUD, auto-generate cron)
- [x] Clients (CRUD, detail page with invoice history)
- [x] Products (CRUD, product picker in invoice form)
- [x] Services (backend ready)
- [x] Payments (list, record, Razorpay online)
- [x] Expenses (CRUD, categorization, stats)
- [x] Reports (charts, CSV export)
- [x] GST Reports (summary, GSTR-1)
- [x] Files (upload, attach to invoices, download)
- [x] Activity Log (API request tracking)
- [x] Notifications (in-app, mark as read, preferences)
- [x] Team Management (invite by email, roles)
- [x] Subscription Management (plans, upgrade/downgrade)
- [x] API Key Management (generate, list, revoke)

### AI Features
- [x] AI Invoice Creator (natural language → invoice data)
- [x] AI Business Insights (revenue trends, client metrics)
- [x] AI Follow-Up Messages (payment reminder generation)

### Client Portal
- [x] Magic link authentication
- [x] Invoice list & detail view
- [x] Razorpay "Pay Now" payment
- [x] Download PDF

### Nice-to-Have
- [x] Dark mode with system preference detection
- [x] 22 invoice templates with plan tier access
- [x] Customizable template text (premium users)
- [x] Multi-currency support (10 currencies)
- [x] Global Command Palette (⌘K search)
- [x] Mobile responsive with bottom navigation
- [x] White label branding settings
- [x] Notification preferences (email + push toggles)
- [x] Bulk operations on invoices list
- [x] File attachments on invoice detail
