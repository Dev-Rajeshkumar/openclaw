# Services & Business Logic

## Backend Services

### `auth.service.ts`
Handles user authentication:
- Password hashing (bcrypt)
- JWT token generation & verification
- Google OAuth flow
- Password reset token management

### `invoice.service.ts`
Core invoice business logic:
- Invoice CRUD operations
- Invoice number generation (auto-increment per business)
- Status management (Draft → Sent → Paid, etc.)
- Line item calculations (subtotal, tax, discount, total)
- Public access token generation
- Invoice duplication

### `pdf.service.ts`
PDF generation using PDFKit:
- 22 distinct invoice template layouts
- Template-based rendering (Classic, Modern, Minimal, Professional, Elegant, Bold, etc.)
- Custom text label overrides for premium users
- GST-compliant format (HSN codes, tax breakdown)
- Company branding (logo, colors, white label)

### `email.service.ts`
Email delivery via Nodemailer/SMTP:
- Invoice email with PDF attachment
- Payment receipt emails
- Team invitation emails
- Client portal magic links
- Password reset emails
- Automated payment reminders

### `aiInvoice.service.ts`
AI-powered features (OpenAI GPT-4o):
- **Invoice Parsing**: Natural language → structured invoice data (client, items, amounts, tax)
- **Business Insights**: Revenue trends, client metrics, overdue analysis, opportunities
- **Follow-Up Generation**: Contextual payment reminder messages based on overdue days

### `razorpay.service.ts`
Razorpay payment integration:
- Order creation (convert invoice amount to paise)
- Payment signature verification
- Payment details fetching
- Webhook handling for async payment confirmation

### `recurringInvoice.service.ts`
Recurring invoice management:
- Schedule calculation (daily/weekly/monthly/quarterly/yearly)
- Next run date computation
- Auto-generation of invoices from templates
- Cron job integration for automated processing

### `report.service.ts`
Business reporting:
- Revenue aggregation by period
- Expense categorization and totals
- Profit/loss calculations
- Invoice status breakdown
- CSV export generation

### `gst.service.ts`
GST compliance:
- GST summary (total CGST, SGST, IGST collected/paid)
- GSTR-1 format data extraction
- Tax rate breakdown by invoice

### `subscription.service.ts`
Subscription management:
- Plan management (Free/Starter/Professional/Business)
- Usage tracking (invoices, clients, businesses vs limits)
- Period management (start/end dates)
- Cancellation and renewal logic

### `notification.service.ts`
Notification system:
- In-app notification creation
- Discord webhook notifications (server events)
- Email notification triggers
- Notification preference checking

### `file.service.ts`
File management:
- File upload handling (multer)
- Entity association (attach to invoices, etc.)
- File metadata storage
- Soft delete

### `team.service.ts`
Team management:
- Member invitation (email + token)
- Role assignment and validation
- Permission management
- Invitation acceptance/rejection flow

### `clientPortal.service.ts`
Client portal:
- Magic link generation and verification
- Client-scoped invoice access
- Payment history for clients

### `apiKey.service.ts`
API key management:
- Key generation (48-char hex, prefixed `bbk_`)
- SHA-256 hashing for storage
- Key listing (masked: first 8 chars)
- Soft delete for revocation

### `notificationPreference.service.ts`
Notification preferences:
- Per-user preference storage
- Email notification toggles (invoice, payment, reminder, team)
- Push notification toggles (invoice, payment, reminder, team)
- Default preferences for new users

---

## Cron Jobs

### `recurringInvoice.job.ts`
- **Frequency:** Every hour
- **Logic:** Finds all `RecurringInvoice` records where `nextRun <= now` and `deletedAt` is null
- **Action:** Generates new invoices from template, updates `nextRun` date
- **Auto-send:** If `autoSend` is true, sends invoice via email

### `emailReminder.job.ts`
- **Frequency:** Every 24 hours
- **Logic:** Finds invoices where `dueDate` is approaching or past due
- **Action:** Sends reminder emails to clients
- **Respects:** Notification preferences

---

## Middleware

### `auth.ts`
- JWT token verification
- User attachment to request
- Protected route enforcement

### `clientAuth.ts`
- Client portal token verification
- Client-scoped request handling

### `rateLimiter.ts`
- Express rate-limit middleware
- Configurable window and max requests
- Per-IP tracking

### `activityLogger.ts`
- Logs all API requests to `ActivityLog` model
- Captures: user, action, entity, method, path, status, IP, user-agent
- Runs after route handlers

### `errorHandler.ts`
- Centralized error handling
- Formats error responses consistently
- Handles Prisma errors, JWT errors, validation errors

### `upload.ts`
- Multer middleware for file uploads
- File size limits
- File type validation
- Storage configuration
