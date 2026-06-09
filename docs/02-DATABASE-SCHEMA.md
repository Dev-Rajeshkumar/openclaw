# Database Schema (MongoDB via Prisma)

## Connection
- **Database:** MongoDB
- **ORM:** Prisma
- **Configure:** `DATABASE_URL` in `.env`
- **Schema:** `backend/prisma/schema.prisma`
- **Client Generation:** `npx prisma generate`
- **Push Schema:** `npx prisma db push`

---

## Models

### User
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `email` | String | unique | Login email |
| `password` | String | — | Bcrypt hashed password |
| `fullName` | String | — | Display name |
| `avatar` | String? | — | Profile picture URL |
| `googleId` | String? | unique | Google OAuth ID |
| `isEmailVerified` | Boolean | false | Email verification status |
| `phone` | String? | — | Phone number |
| `currency` | String | "INR" | Preferred currency |
| `language` | String | "en" | Preferred language |
| `timezone` | String | "Asia/Kolkata" | User timezone |
| `plan` | Plan | Free | Subscription plan |
| `deletedAt` | DateTime? | — | Soft delete |
| `createdAt` | DateTime | now() | Creation timestamp |
| `updatedAt` | DateTime | updatedAt | Last update timestamp |

**Relations:** businesses, clients, products, services, estimates, invoices, recurringInvoices, payments, expenses, activityLogs, statusLogs, files, notifications, subscription, apiKeys, notificationPreference

---

### Business
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | — | Owner user |
| `name` | String | — | Business name |
| `gstNumber` | String? | — | GST registration |
| `pan` | String? | — | PAN number |
| `phone` | String? | — | Business phone |
| `address` | String? | — | Business address |
| `logo` | String? | — | Logo URL |
| `invoicePrefix` | String | "INV" | Invoice prefix |
| `nextInvoiceNo` | Int | 1 | Next invoice number |
| `razorpayKeyId` | String? | — | Razorpay Key ID |
| `razorpayKeySecret` | String? | — | Razorpay Secret (encrypted) |
| `razorpayEnabled` | Boolean | false | Online payments toggle |
| `primaryColor` | String? | "#f59e0b" | Brand primary color |
| `accentColor` | String? | "#1a1a2e" | Brand accent color |
| `customDomain` | String? | — | Custom white-label domain |
| `whiteLabelEnabled` | Boolean | false | White label toggle |
| `emailFromName` | String? | — | Email sender name |
| `emailReplyTo` | String? | — | Email reply-to address |
| `deletedAt` | DateTime? | — | Soft delete |

**Relations:** user, clients, products, services, estimates, invoices, recurringInvoices, expenses, teamMembers, invitations, files, invoiceTemplates

---

### Client
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | — | Owner |
| `businessId` | ObjectId | — | Belongs to business |
| `name` | String | — | Client name |
| `company` | String? | — | Company name |
| `email` | String? | — | Contact email |
| `phone` | String? | — | Contact phone |
| `gstNumber` | String? | — | Client GST |
| `pan` | String? | — | Client PAN |
| `billingAddress` | String? | — | Billing address |
| `shippingAddress` | String? | — | Shipping address |
| `notes` | String? | — | Internal notes |
| `tags` | String[] | — | Tags for filtering |
| `status` | ClientStatus | Active | Active/Inactive/Archived |
| `magicToken` | String? | — | Client portal magic link |
| `magicTokenExpires` | DateTime? | — | Token expiry |
| `deletedAt` | DateTime? | — | Soft delete |

**Relations:** user, business, estimates, invoices, recurringInvoices

---

### Product
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | — | Owner |
| `businessId` | ObjectId | — | Belongs to business |
| `name` | String | — | Product name |
| `sku` | String? | — | SKU code |
| `hsnCode` | String? | — | HSN code for GST |
| `description` | String? | — | Product description |
| `unitPrice` | Float | — | Price per unit |
| `taxRate` | Float | 0 | GST rate % |
| `category` | String? | — | Product category |
| `deletedAt` | DateTime? | — | Soft delete |

---

### Service
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | — | Owner |
| `businessId` | ObjectId | — | Belongs to business |
| `name` | String | — | Service name |
| `description` | String? | — | Service description |
| `hourlyRate` | Float? | — | Hourly billing rate |
| `fixedRate` | Float? | — | Fixed billing rate |
| `deletedAt` | DateTime? | — | Soft delete |

---

### Invoice
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | — | Owner |
| `businessId` | ObjectId | — | Belongs to business |
| `clientId` | ObjectId? | — | Client reference |
| `recurringId` | ObjectId? | — | From recurring invoice |
| `invoiceNumber` | String | — | e.g. "INV-001" |
| `invoiceDate` | DateTime | now() | Invoice date |
| `dueDate` | DateTime | — | Payment due date |
| `items` | Json | — | Line items array |
| `subtotal` | Float | — | Before tax/discount |
| `discountAmount` | Float | 0 | Total discount |
| `taxAmount` | Float | 0 | Total tax |
| `total` | Float | — | Final amount |
| `status` | InvoiceStatus | Draft | Draft/Sent/Paid/etc |
| `invoiceTemplateId` | ObjectId? | — | Chosen template |
| `templateTextOverrides` | Json? | — | Custom label text |
| `publicAccessToken` | String? | unique | Public share token |
| `viewCount` | Int | 0 | Public view count |
| `lastViewedAt` | DateTime? | — | Last public view |
| `notes` | String? | — | Invoice notes |
| `terms` | String? | — | Payment terms |
| `deletedAt` | DateTime? | — | Soft delete |

**Relations:** user, business, client, recurringInvoice, payments

---

### Estimate
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | — | Owner |
| `businessId` | ObjectId | — | Belongs to business |
| `clientId` | ObjectId | — | Client |
| `estimateNumber` | String | — | e.g. "EST-001" |
| `title` | String | — | Estimate title |
| `items` | Json | — | Line items array |
| `subtotal` | Float | — | Before tax |
| `taxAmount` | Float | 0 | Tax amount |
| `total` | Float | — | Final amount |
| `status` | EstimateStatus | Draft | Draft/Sent/Accepted/etc |
| `expiryDate` | DateTime? | — | Estimate expiry |
| `notes` | String? | — | Notes |
| `terms` | String? | — | Terms & conditions |
| `deletedAt` | DateTime? | — | Soft delete |

---

### RecurringInvoice
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | — | Owner |
| `businessId` | ObjectId | — | Belongs to business |
| `clientId` | ObjectId | — | Client |
| `template` | Json | — | Invoice template data |
| `frequency` | RecurringFrequency | — | Daily/Weekly/Monthly/etc |
| `startDate` | DateTime | — | When to start |
| `endDate` | DateTime? | — | When to stop (optional) |
| `nextRun` | DateTime | — | Next generation date |
| `autoSend` | Boolean | false | Auto-send via email |
| `deletedAt` | DateTime? | — | Soft delete |

**Relations:** user, business, client, invoices

---

### Payment
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `invoiceId` | ObjectId | — | Related invoice |
| `userId` | ObjectId | — | Recording user |
| `amount` | Float | — | Payment amount |
| `method` | PaymentMethod | — | Cash/BankTransfer/UPI/etc |
| `reference` | String? | — | Transaction reference |
| `notes` | String? | — | Internal notes |
| `status` | PaymentStatus | Completed | Pending/Completed/Failed/etc |
| `paidAt` | DateTime? | — | Payment timestamp |
| `razorpayOrderId` | String? | — | Razorpay order ID |
| `razorpayPaymentId` | String? | — | Razorpay payment ID |
| `razorpaySignature` | String? | — | Razorpay signature |
| `deletedAt` | DateTime? | — | Soft delete |

---

### Expense
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | — | Owner |
| `businessId` | ObjectId | — | Belongs to business |
| `category` | String | — | Expense category |
| `amount` | Float | — | Expense amount |
| `description` | String? | — | Description |
| `receiptUrl` | String? | — | Receipt image URL |
| `date` | DateTime | now() | Expense date |
| `taxAmount` | Float? | — | Tax on expense |
| `deletedAt` | DateTime? | — | Soft delete |

---

### ActivityLog
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | — | Who performed action |
| `action` | String | — | CREATE/UPDATE/DELETE/etc |
| `entity` | String | — | Affected entity type |
| `entityId` | String? | — | Affected entity ID |
| `method` | String | — | HTTP method |
| `path` | String | — | API endpoint path |
| `statusCode` | Int? | — | HTTP status code |
| `ip` | String? | — | Client IP |
| `userAgent` | String? | — | Client user-agent |
| `metadata` | Json? | — | Extra data |

---

### StatusLog
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `entity` | String | — | Entity type |
| `entityId` | String | — | Entity ID |
| `action` | String | — | What happened |
| `oldValue` | String? | — | Previous value |
| `newValue` | String? | — | New value |
| `description` | String? | — | Human description |
| `changedBy` | ObjectId | — | Who changed it |
| `metadata` | Json? | — | Extra data |

---

### TeamMember
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `businessId` | ObjectId | — | Business |
| `userId` | ObjectId | — | Team member |
| `role` | TeamRole | Employee | Owner/Admin/Accountant/etc |
| `permissions` | String[] | — | Custom permissions |
| `invitedBy` | ObjectId | — | Who invited |
| `joinedAt` | DateTime | now() | When joined |
| `deletedAt` | DateTime? | — | Soft delete |

**Unique:** `[businessId, userId]`

---

### Invitation
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `businessId` | ObjectId | — | Business |
| `email` | String | — | Invited email |
| `role` | TeamRole | — | Assigned role |
| `invitedBy` | ObjectId | — | Sender |
| `token` | String | unique | Invitation token |
| `expiresAt` | DateTime | — | Token expiry |
| `status` | InvitationStatus | Pending | Pending/Accepted/Rejected |

---

### File
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | — | Uploader |
| `businessId` | ObjectId | — | Business |
| `entityType` | String | — | e.g. "Invoice" |
| `entityId` | String | — | Attached entity ID |
| `fileName` | String | — | Original filename |
| `fileUrl` | String | — | Storage URL |
| `mimeType` | String | — | File type |
| `size` | Int | — | File size in bytes |
| `uploadedBy` | ObjectId | — | Uploader |
| `deletedAt` | DateTime? | — | Soft delete |

---

### Notification
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | — | Recipient |
| `title` | String | — | Notification title |
| `message` | String | — | Notification body |
| `type` | NotificationType | — | Invoice/Payment/System/Reminder |
| `isRead` | Boolean | false | Read status |
| `link` | String? | — | Deep link URL |

---

### InvoiceTemplate
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `businessId` | ObjectId | — | Business |
| `name` | String | — | Template name |
| `slug` | String | — | URL-friendly name |
| `description` | String? | — | Description |
| `isDefault` | Boolean | false | Is default template |
| `isPremium` | Boolean | false | Requires paid plan |
| `layout` | Json | — | Template layout config (colors, styles, labels) |

**Unique:** `[businessId, slug]`

---

### Subscription
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | unique | User |
| `plan` | Plan | Free | Free/Starter/Professional/Business |
| `status` | SubscriptionStatus | Active | Active/Inactive/Cancelled/PastDue |
| `currentPeriodStart` | DateTime | now() | Billing period start |
| `currentPeriodEnd` | DateTime | — | Billing period end |
| `cancelAtPeriodEnd` | Boolean | false | Cancellation pending |
| `paymentMethod` | String? | — | Payment method used |

---

### ApiKey
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | — | Owner |
| `name` | String | — | Key name/label |
| `keyHash` | String | — | SHA-256 hash of key |
| `lastUsedAt` | DateTime? | — | Last usage timestamp |
| `deletedAt` | DateTime? | — | Soft delete |

---

### NotificationPreference
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `userId` | ObjectId | unique | User |
| `emailInvoice` | Boolean | true | Email on new invoice |
| `emailPayment` | Boolean | true | Email on payment received |
| `emailReminder` | Boolean | true | Email on reminder |
| `emailTeam` | Boolean | true | Email on team invite |
| `pushInvoice` | Boolean | true | Push on new invoice |
| `pushPayment` | Boolean | true | Push on payment |
| `pushReminder` | Boolean | true | Push on reminder |
| `pushTeam` | Boolean | true | Push on team invite |

---

### InvoiceViewLog
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | ObjectId | auto | Primary key |
| `invoiceId` | ObjectId | — | Viewed invoice |
| `ipAddress` | String? | — | Viewer IP |
| `userAgent` | String? | — | Viewer user-agent |

---

## Enums

### Plan
`Free | Starter | Professional | Business`

### InvoiceStatus
`Draft | Sent | Viewed | PartiallyPaid | Paid | Overdue | Cancelled`

### EstimateStatus
`Draft | Sent | Accepted | Rejected | Expired`

### ClientStatus
`Active | Inactive | Archived`

### RecurringFrequency
`Daily | Weekly | Monthly | Quarterly | Yearly`

### PaymentMethod
`Cash | BankTransfer | UPI | Card | Cheque | Online | Other`

### PaymentStatus
`Pending | Completed | Failed | Refunded`

### TeamRole
`Owner | Admin | Accountant | Manager | Employee | Viewer`

### InvitationStatus
`Pending | Accepted | Rejected | Expired`

### NotificationType
`Invoice | Payment | System | Reminder`

### SubscriptionStatus
`Active | Inactive | Cancelled | PastDue`

### InvoiceItemType
`Product | Service | Custom`
