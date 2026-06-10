# Cron Jobs

## Overview
BillingBee uses a MongoDB-locked scheduler (`backend/src/jobs/cronScheduler.ts`) for reliable job execution. Locks prevent duplicate runs when multiple server instances are deployed.

---

## Recurring Invoice Processor

**File:** `backend/src/jobs/recurringInvoice.job.ts`
**Schedule:** Every hour
**Startup delay:** 30 seconds after server start

### Logic
1. Query all `RecurringInvoice` records where:
   - `nextRun <= current time`
   - `deletedAt` is null
2. For each matching record:
   - Create a new `Invoice` from the template data
   - Set invoice number using business prefix + nextInvoiceNo
   - Calculate totals from template items
   - Update `nextRun` based on frequency
3. If `autoSend` is true, send the invoice via email to the client

### Return Value
```ts
{ processed: number, errors: number }
```

---

## Email Reminder Job

**File:** `backend/src/jobs/emailReminder.job.ts`
**Schedule:** Every 24 hours
**Startup delay:** 5 minutes after server start

### Escalation Sequences
Each business can configure its own reminder schedule via `ReminderSchedule` model:
- `daysBefore`: Days before due date to send first reminder (default: 3)
- `onDueDate`: Whether to remind on the due date (default: true)
- `daysAfter`: Array of overdue days to escalate (default: [3, 7, 14, 30])

### Escalation Tones
1. **Friendly** — Pre-due reminder
2. **Gentle** — On due date
3. **Firm** — First overdue reminder
4. **Urgent** — Subsequent overdue reminders

### Persistence
Sent reminders are tracked in the database (via `Notification` model), surviving server restarts.

### Return Value
```ts
{ sent: number, skipped: number, errors: number }
```

---

## Razorpay Webhook

**Endpoint:** `POST /api/v1/public/payments/webhook`
**Auth:** None (Razorpay server-to-server)

### Events Handled
- `payment.captured`: Records payment, marks invoice as Paid
- `payment.failed`: Logs failure

### Security
- ✅ Webhook signature verified using `x-razorpay-signature` header
- Signature computed as HMAC-SHA256 of raw body with business's Razorpay key secret
- Returns 401 on invalid signature (prevents spoofing)
- Uses `express.raw()` middleware to preserve exact body bytes for verification
