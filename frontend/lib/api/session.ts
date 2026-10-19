import { apiClient } from './apiClient';

export interface SessionStatus {
  enabled: boolean;
  authenticated: boolean;
}

export async function getSession(): Promise<SessionStatus> {
  const response = await apiClient.get<SessionStatus>('/auth/session');
  return response.data;
}
