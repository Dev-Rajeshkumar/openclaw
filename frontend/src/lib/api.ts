import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { IApiResponse, IAuthTokens } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const ACCESS_TOKEN_KEY = 'bb_access_token';
const REFRESH_TOKEN_KEY = 'bb_refresh_token';
const BUSINESS_ID_KEY = 'bb_business_id';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ==================== TOKEN HELPERS ====================

export const getTokens = (): IAuthTokens | null => {
  if (typeof window === 'undefined') return null;
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
};

export const setTokens = (tokens: IAuthTokens): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
};

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(BUSINESS_ID_KEY);
};

// ==================== BUSINESS ID HELPERS ====================

export const getBusinessId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(BUSINESS_ID_KEY);
};

export const setBusinessId = (businessId: string): void => {
  localStorage.setItem(BUSINESS_ID_KEY, businessId);
};

// ==================== REQUEST INTERCEPTOR ====================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = getTokens();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    // Attach business ID to every request
    const businessId = getBusinessId();
    if (businessId) {
      config.headers['x-business-id'] = businessId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== RESPONSE INTERCEPTOR ====================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) { prom.reject(error); } else { prom.resolve(token!); }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<IApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const tokens = getTokens();
    if (!tokens?.refreshToken) {
      clearTokens();
      isRefreshing = false;
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post<IApiResponse<IAuthTokens>>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken: tokens.refreshToken }
      );

      if (data.success && data.data) {
        setTokens(data.data);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        processQueue(null, data.data.accessToken);
        return api(originalRequest);
      }
      throw new Error('Token refresh failed');
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
