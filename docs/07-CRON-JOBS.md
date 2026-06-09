# Cron Jobs

## Overview
BillingBee uses `setInterval` for scheduled tasks. Jobs run inside the main server process.

---

## Recurring Invoice Processor

**File:** `backend/src/jobs/recurringInvoice.job.ts`
**Schedule:** Every hour (3,600,000 ms)
**Startup delay:** 30 seconds after server start

### Logic
1. Query all `RecurringInvoice` records where:
   - `nextRun <= current time`
   - `deletedAt` is null
2. For each matching record:
   - Create a new `Invoice` from the template data
   - Set invoice number using business prefix + nextInvoiceNo
   - Calculate totals from template items
   - Update `nextRun` based on frequency:
     - Daily: +1 day
     - Weekly: +7 days
     - Monthly: +1 month
     - Quarterly: +3 months
     - Yearly: +1 year
   - If `endDate` is set and `nextRun > endDate`, deactivate the recurring invoice
3. If `autoSend` is true, send the invoice via email to the client

### Return Value
```ts
{ processed: number }  // Number of invoices generated
```

---

## Email Reminder Job

**File:** `backend/src/jobs/emailReminder.job.ts`
**Schedule:** Every 24 hours (86,400,000 ms)
**Startup delay:** 5 minutes after server start

### Logic
1. Find all invoices where:
   - Status is `Sent` or `Overdue`
   - `dueDate` is approaching (within 3 days) or past due
   - No reminder sent in the last 7 days
2. For each invoice:
   - Check client's notification preferences
   - Send reminder email with invoice details and payment link
   - Respects `emailReminder` preference toggle

### Return Value
```ts
{ sent: number }  // Number of reminders sent
```

---

## Razorpay Webhook

**Endpoint:** `POST /api/v1/public/payments/webhook`
**Auth:** None (Razorpay server-to-server)

### Events Handled
- `payment.captured`: Records payment, marks invoice as Paid
- `payment.failed`: Logs failure (future: notify user)

### Security
- In production, verify `x-razorpay-signature` header
- Currently trusts payload (payment is verified separately via the verify endpoint)
