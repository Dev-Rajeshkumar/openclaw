import { API } from "@/lib/constants";

/** Get auth token from localStorage */
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") : null;

/** Make authenticated API request */
async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data.data as T;
}

/** API client methods */
export const api = {
  auth: {
    signup: (body: { email: string; name?: string }) => apiRequest<{ user: any; token: string }>(API.auth.signup, { method: "POST", body: JSON.stringify(body) }),
    login: (email: string) => apiRequest<{ user: any; token: string }>(API.auth.login, { method: "POST", body: JSON.stringify({ email }) }),
    me: () => apiRequest<any>(API.auth.me),
  },
  forms: {
    list: () => apiRequest<any[]>(API.forms.list),
    create: (body: any) => apiRequest<any>(API.forms.create, { method: "POST", body: JSON.stringify(body) }),
    get: (id: string) => apiRequest<any>(API.forms.byId(id)),
    update: (id: string, body: any) => apiRequest<any>(API.forms.byId(id), { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) => apiRequest<void>(API.forms.byId(id), { method: "DELETE" }),
  },
  submissions: {
    getByForm: (formId: string, page = 1) => apiRequest<any>(`${API.submissions.byForm(formId)}?page=${page}`),
    exportCSV: (formId: string) => `${API_BASE}${API.submissions.export(formId)}`,
  },
  ai: { generate: (prompt: string) => apiRequest<any>(API.ai.generate, { method: "POST", body: JSON.stringify({ prompt }) }) },
  webhooks: { getByForm: (formId: string) => apiRequest<any[]>(API.webhooks(formId)), create: (formId: string, body: any) => apiRequest<any>(API.webhooks(formId), { method: "POST", body: JSON.stringify(body) }), delete: (formId: string, id: string) => apiRequest<void>(`${API.webhooks(formId)}/${id}`, { method: "DELETE" }) },
  integrations: { getByForm: (formId: string) => apiRequest<any[]>(API.integrations(formId)), create: (formId: string, body: any) => apiRequest<any>(API.integrations(formId), { method: "POST", body: JSON.stringify(body) }), delete: (formId: string, id: string) => apiRequest<void>(`${API.integrations(formId)}/${id}`, { method: "DELETE" }) },
  payments: { checkout: (formId: string, body: any) => apiRequest<any>(`${API.payments(formId)}/checkout`, { method: "POST", body: JSON.stringify(body) }) },
  activity: { getMy: (page = 1) => apiRequest<any>(`/api/v1/activity?page=${page}`), getUnread: () => apiRequest<any[]>("/api/v1/activity/alerts/unread") },
};
