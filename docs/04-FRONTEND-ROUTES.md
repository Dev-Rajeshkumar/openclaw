# Frontend Routes & Pages

## Route Structure

### Public Routes (No Auth)
| Route | File | Description |
|-------|------|-------------|
| `/` | `src/app/page.tsx` | Landing page |
| `/i/:token` | `src/app/i/[token]/page.tsx` | Public invoice view (shareable link) |
| `/public/invoices/:token` | `src/app/public/invoices/[token]/page.tsx` | Public invoice with PDF download |

### Auth Routes
| Route | File | Description |
|-------|------|-------------|
| `/auth/login` | `src/app/(auth)/login/page.tsx` | Login page |
| `/auth/register` | `src/app/(auth)/register/page.tsx` | Registration page |
| `/auth/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` | Password reset request |

### Client Portal Routes (Magic Link Auth)
| Route | File | Description |
|-------|------|-------------|
| `/portal` | `src/app/portal/page.tsx` | Portal home |
| `/portal/auth` | `src/app/portal/auth/page.tsx` | Magic link request |
| `/portal/auth/verify` | `src/app/portal/auth/verify/page.tsx` | Magic link verification |
| `/portal/invoices` | `src/app/portal/invoices/page.tsx` | Client's invoice list |
| `/portal/invoices/:id` | `src/app/portal/invoices/[id]/page.tsx` | Invoice detail + Pay Now |

### Dashboard Routes (JWT Auth)
| Route | File | Description |
|-------|------|-------------|
| `/dashboard` | `src/app/(dashboard)/page.tsx` | Dashboard home with stats |
| `/dashboard/invoices` | `src/app/(dashboard)/invoices/page.tsx` | Invoice list (table + card view, bulk actions) |
| `/dashboard/invoices/new` | `src/app/(dashboard)/invoices/new/page.tsx` | Create invoice (with AI data pre-fill) |
| `/dashboard/invoices/:id` | `src/app/(dashboard)/invoices/[id]/page.tsx` | Invoice detail (PDF, payments, follow-up, attachments) |
| `/dashboard/estimates` | `src/app/(dashboard)/estimates/page.tsx` | Estimate list |
| `/dashboard/estimates/new` | `src/app/(dashboard)/estimates/new/page.tsx` | Create estimate |
| `/dashboard/estimates/:id` | `src/app/(dashboard)/estimates/[id]/page.tsx` | Estimate detail |
| `/dashboard/recurring` | `src/app/(dashboard)/recurring/page.tsx` | Recurring invoice list |
| `/dashboard/recurring/new` | `src/app/(dashboard)/recurring/new/page.tsx` | Create recurring invoice |
| `/dashboard/recurring/:id` | `src/app/(dashboard)/recurring/[id]/page.tsx` | Recurring invoice detail |
| `/dashboard/clients` | `src/app/(dashboard)/clients/page.tsx` | Client list |
| `/dashboard/clients/new` | `src/app/(dashboard)/clients/new/page.tsx` | Create client |
| `/dashboard/clients/:id` | `src/app/(dashboard)/clients/[id]/page.tsx` | Client detail |
| `/dashboard/products` | `src/app/(dashboard)/products/page.tsx` | Product list |
| `/dashboard/products/:id` | `src/app/(dashboard)/products/[id]/page.tsx` | Product detail/edit |
| `/dashboard/payments` | `src/app/(dashboard)/payments/page.tsx` | Payment list with stats |
| `/dashboard/expenses` | `src/app/(dashboard)/expenses/page.tsx` | Expense list |
| `/dashboard/expenses/new` | `src/app/(dashboard)/expenses/new/page.tsx` | Create expense |
| `/dashboard/expenses/:id` | `src/app/(dashboard)/expenses/[id]/page.tsx` | Expense detail/edit |
| `/dashboard/reports` | `src/app/(dashboard)/reports/page.tsx` | Reports (charts, CSV export) |
| `/dashboard/gst` | `src/app/(dashboard)/gst/page.tsx` | GST reports (summary, GSTR-1) |
| `/dashboard/activity` | `src/app/(dashboard)/activity/page.tsx` | Activity log |
| `/dashboard/notifications` | `src/app/(dashboard)/notifications/page.tsx` | Notifications |
| `/dashboard/team` | `src/app/(dashboard)/team/page.tsx` | Team management |
| `/dashboard/files` | `src/app/(dashboard)/files/page.tsx` | File manager |
| `/dashboard/ai-invoice` | `src/app/(dashboard)/ai-invoice/page.tsx` | AI invoice creator |
| `/dashboard/ai-invoice/insights` | `src/app/(dashboard)/ai-invoice/insights/page.tsx` | AI business insights |
| `/dashboard/settings` | `src/app/(dashboard)/settings/page.tsx` | Settings (profile, password, business, templates, plan, payments, notifications) |
| `/dashboard/subscription` | `src/app/(dashboard)/subscription/page.tsx` | Subscription management |
| `/dashboard/developers` | `src/app/(dashboard)/developers/page.tsx` | API key management & docs |

---

## Shared Components

| Component | File | Description |
|-----------|------|-------------|
| `TemplateSelector` | `src/components/TemplateSelector.tsx` | Invoice template grid picker |
| `TemplateTextEditor` | `src/components/TemplateTextEditor.tsx` | Customize template text labels |
| `CommandPalette` | `src/components/CommandPalette.tsx` | Global ⌘K command palette |
| UI Components | `src/components/ui/` | Card, Button, Input, Select, Table, Dialog, Badge, Skeleton, Tabs, DropdownMenu, Textarea, Separator, Command |

---

## Hooks

| Hook | File | Description |
|------|------|-------------|
| `useAuth` | `src/hooks/useAuth.ts` | Authentication state, user profile, business management, login/logout |
| `useTheme` | `src/context/ThemeContext.tsx` | Dark mode toggle and theme state |

---

## Stores (Zustand)

| Store | File | Description |
|-------|------|-------------|
| `useTemplateStore` | `src/stores/templateStore.ts` | Invoice template data and selection |

---

## Utilities

| File | Description |
|------|-------------|
| `src/lib/api.ts` | Axios instance with auth interceptors |
| `src/lib/utils.ts` | Formatters (currency, date, status colors, plan colors) |
| `src/lib/validations.ts` | Zod schemas for form validation |

---

## Types

| File | Description |
|------|-------------|
| `src/types/index.ts` | All TypeScript interfaces and enums |

---

## Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### Backend (`.env`)
```
DATABASE_URL=mongodb://localhost:27017/billingbee
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
PORT=4000
API_VERSION=v1
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=BillingBee <noreply@billingbee.com>
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DISCORD_WEBHOOK_URL=your-discord-webhook
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```
