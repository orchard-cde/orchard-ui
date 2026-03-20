import axios from 'axios';
import type { ApiError } from '@/types/orchard';
import { getCultivatorId } from '@/lib/auth';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
});

apiClient.interceptors.request.use((config) => {
  const cultivatorId = getCultivatorId();
  if (cultivatorId) {
    config.headers['X-Cultivator-Id'] = cultivatorId;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/unauthorized';
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
