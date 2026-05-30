/** User type matching API response */
export interface User { id: string; email: string; name: string | null; plan: "FREE" | "PRO" | "ENTERPRISE"; formLimit: number; apiKey: string | null; createdAt: string; }

/** Form type */
export interface Form { id: string; userId: string; name: string; slug: string; description?: string; isActive: boolean; submitCount: number; fields: FormField[]; redirectUrl?: string; honeypotEnabled: boolean; whiteLabel: boolean; createdAt: string; updatedAt: string; _count?: { submissions: number }; }

/** Form field definition */
export interface FormField { name: string; label: string; type: "text" | "email" | "number" | "textarea" | "select" | "radio" | "checkbox" | "file" | "date" | "phone"; required: boolean; placeholder?: string; options?: string[]; }

/** Submission type */
export interface Submission { id: string; formId: string; data: Record<string, string>; ipAddress?: string; isSpam: boolean; createdAt: string; }

/** Activity log entry */
export interface ActivityLog { id: string; userId?: string; action: string; entity?: string; entityId?: string; metadata?: any; ipAddress?: string; createdAt: string; }

/** Alert type */
export interface Alert { id: string; type: string; severity: string; message: string; isRead: boolean; createdAt: string; }

/** API response wrapper */
export interface ApiResponse<T = unknown> { success: boolean; data?: T; error?: string; message?: string; }

/** Paginated response */
export interface PaginatedResponse<T> { success: boolean; data: T[]; total: number; page: number; limit: number; totalPages: number; }

/** Webhook type */
export interface Webhook { id: string; formId: string; url: string; events: string[]; isActive: boolean; createdAt: string; }

/** Integration type */
export interface Integration { id: string; formId: string; type: string; config: any; isActive: boolean; createdAt: string; }

/** AI form generation request */
export interface AIGenerateRequest { prompt: string; }

/** AI form generation response */
export interface AIGenerateResponse { name: string; description: string; fields: FormField[]; }
