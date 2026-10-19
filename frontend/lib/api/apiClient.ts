import axios from 'axios';
import type { ApiError } from '@/types/orchard';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080',
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const exempt =
        typeof window !== 'undefined' &&
        (window.location.pathname.startsWith('/signin') ||
          error.config?.url === '/auth/session');
      if (typeof window !== 'undefined' && !exempt) {
        window.location.href = '/signin';
        return new Promise(() => {});
      }
    }
    const message: string =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject({ message } satisfies ApiError);
  }
);
