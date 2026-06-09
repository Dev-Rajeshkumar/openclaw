# API Reference

## Base URL
```
http://localhost:4000/api/v1
```

## Authentication
All protected endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

Client Portal endpoints use a separate token:
```
Authorization: Bearer <client_token>
```

Public endpoints require no authentication.

---

## Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Register new user |
| POST | `/auth/login` | — | Login with email/password |
| POST | `/auth/google` | — | Google OAuth login |
| POST | `/auth/forgot-password` | — | Send password reset email |
| POST | `/auth/verify-password` | — | Verify reset token & set new password |
| GET | `/auth/me` | ✅ | Get current user profile |

---

## User Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/profile` | ✅ | Get user profile |
| PUT | `/users/profile` | ✅ | Update profile (name, avatar, currency) |
| PUT | `/users/change-password` | ✅ | Change password |
| DELETE | `/users/account` | ✅ | Delete account |

---

## Business Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/businesses` | ✅ | Create business |
| GET | `/businesses` | ✅ | List all businesses |
| GET | `/businesses/:id` | ✅ | Get business by ID |
| GET | `/businesses/:id/stats` | ✅ | Get business statistics |
| PUT | `/businesses/:id` | ✅ | Update business (name, GST, branding, etc.) |
| DELETE | `/businesses/:id` | ✅ | Delete business |

---

## Client Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/businesses/:businessId/clients` | ✅ | Create client |
| GET | `/businesses/:businessId/clients` | ✅ | List clients |
| GET | `/businesses/:businessId/clients/:id` | ✅ | Get client by ID |
| PUT | `/businesses/:businessId/clients/:id` | ✅ | Update client |
| DELETE | `/businesses/:businessId/clients/:id` | ✅ | Delete client |
| GET | `/businesses/:businessId/clients/:id/invoices` | ✅ | Get client's invoices |

---

## Invoice Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/businesses/:businessId/invoices` | ✅ | Create invoice |
| GET | `/businesses/:businessId/invoices` | ✅ | List invoices (paginated) |
| GET | `/businesses/:businessId/invoices/:id` | ✅ | Get invoice by ID |
| PUT | `/businesses/:businessId/invoices/:id` | ✅ | Update invoice (status, items, etc.) |
| DELETE | `/businesses/:businessId/invoices/:id` | ✅ | Delete invoice |
| POST | `/businesses/:businessId/invoices/:id/duplicate` | ✅ | Duplicate invoice |
| POST | `/businesses/:businessId/invoices/:id/send-email` | ✅ | Send invoice via email |
| GET | `/businesses/:businessId/invoices/:id/pdf` | ✅ | Download invoice PDF |
| GET | `/businesses/:businessId/invoices/stats` | ✅ | Get invoice statistics |

---

## Estimate Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/businesses/:businessId/estimates` | ✅ | Create estimate |
| GET | `/businesses/:businessId/estimates` | ✅ | List estimates |
| GET | `/businesses/:businessId/estimates/:id` | ✅ | Get estimate by ID |
| PUT | `/businesses/:businessId/estimates/:id` | ✅ | Update estimate |
| DELETE | `/businesses/:businessId/estimates/:id` | ✅ | Delete estimate |
| POST | `/businesses/:businessId/estimates/:id/convert` | ✅ | Convert estimate to invoice |

---

## Recurring Invoice Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/businesses/:businessId/recurring` | ✅ | Create recurring invoice |
| GET | `/businesses/:businessId/recurring` | ✅ | List recurring invoices |
| GET | `/businesses/:businessId/recurring/:id` | ✅ | Get recurring invoice by ID |
| PUT | `/businesses/:businessId/recurring/:id` | ✅ | Update recurring invoice |
| DELETE | `/businesses/:businessId/recurring/:id` | ✅ | Delete recurring invoice |
| GET | `/businesses/:businessId/recurring/:id/invoices` | ✅ | Get generated invoices |

---

## Payment Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/payments` | ✅ | List payments (paginated, filterable) |
| GET | `/payments/:id` | ✅ | Get payment by ID |
| GET | `/payments/stats` | ✅ | Get payment statistics |
| PUT | `/payments/settings/:businessId` | ✅ | Update Razorpay settings |

---

## Expense Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/businesses/:businessId/expenses` | ✅ | Create expense |
| GET | `/businesses/:businessId/expenses` | ✅ | List expenses (paginated, filterable) |
| GET | `/businesses/:businessId/expenses/:id` | ✅ | Get expense by ID |
| PUT | `/businesses/:businessId/expenses/:id` | ✅ | Update expense |
| DELETE | `/businesses/:businessId/expenses/:id` | ✅ | Delete expense |
| GET | `/businesses/:businessId/expenses/stats` | ✅ | Get expense statistics |

---

## Product Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/businesses/:businessId/products` | ✅ | Create product |
| GET | `/businesses/:businessId/products` | ✅ | List products |
| GET | `/businesses/:businessId/products/:id` | ✅ | Get product by ID |
| PUT | `/businesses/:businessId/products/:id` | ✅ | Update product |
| DELETE | `/businesses/:businessId/products/:id` | ✅ | Delete product |

---

## File Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/businesses/:businessId/files` | ✅ | Upload file (multipart) |
| GET | `/businesses/:businessId/files` | ✅ | List files |
| GET | `/businesses/:businessId/files/:id` | ✅ | Get file by ID |
| DELETE | `/businesses/:businessId/files/:id` | ✅ | Delete file |

---

## Team Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/businesses/:businessId/team/members` | ✅ | List team members |
| POST | `/businesses/:businessId/team/invite` | ✅ | Invite team member |
| POST | `/businesses/:businessId/team/accept` | ✅ | Accept invitation |
| POST | `/businesses/:businessId/team/reject` | ✅ | Reject invitation |
| PATCH | `/businesses/:businessId/team/members/:memberId` | ✅ | Update member role |
| DELETE | `/businesses/:businessId/team/members/:memberId` | ✅ | Remove team member |
| GET | `/businesses/:businessId/team/invitations` | ✅ | List pending invitations |
| DELETE | `/businesses/:businessId/team/invitations/:id` | ✅ | Cancel invitation |

---

## Notification Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | ✅ | List notifications |
| PATCH | `/notifications/:id/read` | ✅ | Mark as read |
| PATCH | `/notifications/read-all` | ✅ | Mark all as read |
| DELETE | `/notifications/:id` | ✅ | Delete notification |

---

## Notification Preference Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notification-preferences` | ✅ | Get preferences |
| PUT | `/notification-preferences` | ✅ | Update preferences |

---

## Report Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/businesses/:businessId/reports/summary` | ✅ | Get report summary (revenue, expenses, profit) |
| GET | `/businesses/:businessId/reports/export` | ✅ | Export report as CSV |

---

## GST Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/businesses/:businessId/gst/summary` | ✅ | Get GST summary |
| GET | `/businesses/:businessId/gst/gstr1` | ✅ | Get GSTR-1 data |

---

## Activity Log Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/activity-logs/my` | ✅ | Get user's activity logs |
| GET | `/activity-logs/entity/:entity/:entityId` | ✅ | Get entity-specific logs |

---

## Status Log Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/status-logs/my` | ✅ | Get user's status logs |
| GET | `/status-logs/entity/:entity/:entityId` | ✅ | Get entity-specific status logs |

---

## Invoice Template Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/businesses/:businessId/invoice-templates` | ✅ | List templates |
| GET | `/businesses/:businessId/invoice-templates/:slug` | ✅ | Get template by slug |
| GET | `/businesses/:businessId/invoice-templates/available/:plan` | ✅ | Get templates available for plan |
| POST | `/businesses/:businessId/invoice-templates/custom` | ✅ | Create custom template |
| POST | `/businesses/:businessId/invoice-templates/default` | ✅ | Set default template |

---

## AI Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/ai/parse` | ✅ | Parse natural language → invoice data |
| GET | `/ai/insights/:businessId` | ✅ | Get AI business insights |
| GET | `/ai/follow-up/:id` | ✅ | Generate follow-up message for invoice |

---

## Subscription Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/subscriptions` | ✅ | Get current subscription |
| POST | `/subscriptions` | ✅ | Create subscription |
| PUT | `/subscriptions` | ✅ | Update subscription plan |
| POST | `/subscriptions/cancel` | ✅ | Cancel subscription |
| POST | `/subscriptions/renew` | ✅ | Renew subscription |

---

## API Key Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api-keys` | ✅ | List API keys (masked) |
| POST | `/api-keys` | ✅ | Create new API key |
| DELETE | `/api-keys/:id` | ✅ | Revoke API key |

---

## Client Portal Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/portal/auth/magic-link` | — | Request magic link email |
| POST | `/portal/auth/verify` | — | Verify magic link token |
| GET | `/portal/me` | 🔑 | Get client profile |
| GET | `/portal/invoices` | 🔑 | List client's invoices |
| GET | `/portal/invoices/:id` | 🔑 | Get invoice detail |
| GET | `/portal/payments` | 🔑 | List client's payments |

> 🔑 = Client Portal token (not JWT)

---

## Public Invoice Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/public/invoices/:token` | — | View public invoice |
| GET | `/public/invoices/:token/pdf` | — | Download public invoice PDF |
| POST | `/public/payments/invoice/:token/create-order` | — | Create Razorpay order |
| POST | `/public/payments/invoice/:token/verify` | — | Verify Razorpay payment |
| POST | `/public/payments/webhook` | — | Razorpay webhook |

---

## Response Format

All API responses follow a consistent format:

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error
```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": ["error message"]
  }
}
```

---

## Rate Limiting
- **Window:** 15 minutes
- **Max Requests:** 100 per window
- Configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS`
