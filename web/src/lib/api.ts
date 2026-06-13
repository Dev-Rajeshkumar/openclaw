/**
 * API Client — Strapi REST API wrapper
 * 
 * Usage:
 *   import { api } from '@/lib/api';
 *   const posts = await api.getPosts();
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';

interface FetchOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  cache?: RequestCache;
  tags?: string[];
}

async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, cache, tags } = options;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body && { body: JSON.stringify(body) }),
    ...(cache && { cache }),
    ...(tags && { next: { tags } }),
  };

  const res = await fetch(`${API_URL}/api${endpoint}`, fetchOptions);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(error.error?.message || `API error: ${res.status}`);
  }

  return res.json();
}

// ── Posts ────────────────────────────────────────────────────

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: { url: string; alternativeText?: string };
  author?: { username: string; avatar?: string };
  tags?: { name: string; slug: string }[];
  categories?: { name: string; slug: string }[];
  publishedAt: string;
  readingTimeMinutes: number;
  seoTitle?: string;
  seoDescription?: string;
  viewCount: number;
  featured: boolean;
}

export const api = {
  // Posts
  getPosts: (params?: { page?: number; pageSize?: number; tag?: string; category?: string; locale?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('pagination[page]', String(params.page));
    if (params?.pageSize) query.set('pagination[pageSize]', String(params.pageSize));
    if (params?.tag) query.set('filters[tags][slug][$eq]', params.tag);
    if (params?.category) query.set('filters[categories][slug][$eq]', params.category);
    query.set('populate', '*');
    query.set('sort', 'publishedAt:desc');
    return fetchAPI<{ data: Post[]; meta: any }>(`/posts?${query}`);
  },

  getPost: (slug: string) =>
    fetchAPI<{ data: Post }>(`/posts?filters[slug][$eq]=${slug}&populate=*`, { tags: [`post-${slug}`] }),

  getFeaturedPosts: () =>
    fetchAPI<{ data: Post[] }>('/posts?filters[featured][$eq]=true&populate=*&pagination[limit]=5'),

  // Search
  search: (query: string, filters?: { locale?: string; tags?: string[] }) =>
    fetchAPI<any>(`/search/posts?q=${encodeURIComponent(query)}&locale=${filters?.locale || ''}`),

  // Comments
  getComments: (postId: string) =>
    fetchAPI<any>(`/comments?filters[post][id][$eq]=${postId}&filters[status][$eq]=approved&populate=*&sort=createdAt:asc`),

  createComment: (data: { content: string; postId: string; authorName?: string; authorEmail?: string }) =>
    fetchAPI<any>('/comments', { method: 'POST', body: { data } }),

  // Reactions
  toggleReaction: (data: { type: string; postId?: string; commentId?: string; userId: string }) =>
    fetchAPI<any>('/reactions/toggle', { method: 'POST', body: { data } }),

  // Newsletter
  subscribe: (email: string, name?: string) =>
    fetchAPI<any>('/newsletter/subscribe', { method: 'POST', body: { data: { email, name } } }),

  unsubscribe: (token: string) =>
    fetchAPI<any>('/newsletter/unsubscribe', { method: 'POST', body: { data: { token } } }),

  // Auth
  login: (identifier: string, password: string) =>
    fetchAPI<{ jwt: string; user: any }>('/auth/local', {
      method: 'POST',
      body: { identifier, password },
    }),

  register: (username: string, email: string, password: string) =>
    fetchAPI<{ jwt: string; user: any }>('/auth/local/register', {
      method: 'POST',
      body: { username, email, password },
    }),

  // Analytics (admin)
  getAnalytics: (token: string, params?: { from?: string; to?: string }) =>
    fetchAPI<any>(`/analytics/dashboard?from=${params?.from || ''}&to=${params?.to || ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getPostAnalytics: (postId: string, token: string) =>
    fetchAPI<any>(`/analytics/posts/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Forms
  submitForm: (formSlug: string, data: Record<string, any>) =>
    fetchAPI<any>(`/forms/${formSlug}/submit`, { method: 'POST', body: { data } }),

  // Tags & Categories
  getTags: () => fetchAPI<any>('/tags?pagination[limit]=100'),
  getCategories: () => fetchAPI<any>('/categories?pagination[limit]=100'),
};

export default api;
