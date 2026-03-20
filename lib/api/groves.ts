import { apiClient } from './apiClient';
import type {
  GroveResponse,
  CreateGroveRequest,
} from '@/types/orchard';

export async function listGroves(): Promise<GroveResponse[]> {
  const response = await apiClient.get<GroveResponse[]>('/api/groves');
  return response.data;
}

export async function getGrove(id: string): Promise<GroveResponse> {
  const response = await apiClient.get<GroveResponse>(`/api/groves/${id}`);
  return response.data;
}

export async function plantGrove(
  request: CreateGroveRequest
): Promise<GroveResponse> {
  const response = await apiClient.post<GroveResponse>('/api/groves', request);
  return response.data;
}

export async function clearGrove(id: string): Promise<void> {
  await apiClient.delete(`/api/groves/${id}`);
}

export async function getSshConfig(id: string): Promise<string> {
  const response = await apiClient.get<string>(
    `/api/groves/${id}/ssh-config`,
    { responseType: 'text' }
  );
  return response.data;
}

export async function stopGrove(id: string): Promise<GroveResponse> {
  const response = await apiClient.post<GroveResponse>(
    `/api/groves/${id}/actions/stop`
  );
  return response.data;
}

export async function startGrove(id: string): Promise<GroveResponse> {
  const response = await apiClient.post<GroveResponse>(
    `/api/groves/${id}/actions/start`
  );
  return response.data;
}
