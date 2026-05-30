// src/lib/constants/index.ts — App-wide constants
export const APP_NAME = "FormFlow";
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** API endpoint paths */
export const API = {
  auth: { signup: "/api/v1/auth/signup", login: "/api/v1/auth/login", me: "/api/v1/auth/me" },
  forms: { list: "/api/v1/forms", create: "/api/v1/forms", byId: (id: string) => `/api/v1/forms/${id}` },
  submissions: { byForm: (id: string) => `/api/v1/submissions/form/${id}`, export: (id: string) => `/api/v1/submissions/form/${id}/export` },
  ai: { generate: "/api/v1/ai/generate-form", analyze: "/api/v1/ai/analyze" },
  webhooks: (formId: string) => `/api/v1/forms/${formId}/webhooks`,
  integrations: (formId: string) => `/api/v1/forms/${formId}/integrations`,
  payments: (formId: string) => `/api/v1/forms/${formId}/payments`,
} as const;

/** Plan limits */
export const PLANS = {
  FREE: { forms: 3, submissions: 100, price: "₹0" },
  PRO: { forms: Infinity, submissions: Infinity, price: "₹499/mo" },
  ENTERPRISE: { forms: Infinity, submissions: Infinity, price: "Custom" },
} as const;
