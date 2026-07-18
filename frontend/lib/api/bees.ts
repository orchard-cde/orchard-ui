import { apiClient } from './apiClient';
import type {
  BeeResponse,
  SwarmStatusResponse,
  CreateBeeRequest,
} from '@/types/orchard';

export async function listBees(groveId: string): Promise<BeeResponse[]> {
  const response = await apiClient.get<BeeResponse[]>(
    `/api/groves/${groveId}/bees`
  );
  return response.data;
}

export async function getBee(
  groveId: string,
  beeId: string
): Promise<BeeResponse> {
  const response = await apiClient.get<BeeResponse>(
    `/api/groves/${groveId}/bees/${beeId}`
  );
  return response.data;
}

export async function getSwarmStatus(
  groveId: string
): Promise<SwarmStatusResponse> {
  const response = await apiClient.get<SwarmStatusResponse>(
    `/api/groves/${groveId}/bees/status`
  );
  return response.data;
}

export async function createBee(
  groveId: string,
  request: CreateBeeRequest
): Promise<BeeResponse> {
  const response = await apiClient.post<BeeResponse>(
    `/api/groves/${groveId}/bees`,
    request
  );
  return response.data;
}

export async function wakeBee(
  groveId: string,
  beeId: string
): Promise<BeeResponse> {
  const response = await apiClient.post<BeeResponse>(
    `/api/groves/${groveId}/bees/${beeId}/actions/wake`
  );
  return response.data;
}

export async function smokeBee(
  groveId: string,
  beeId: string
): Promise<BeeResponse> {
  const response = await apiClient.post<BeeResponse>(
    `/api/groves/${groveId}/bees/${beeId}/actions/smoke`
  );
  return response.data;
}

export async function removeBee(
  groveId: string,
  beeId: string
): Promise<void> {
  await apiClient.delete(`/api/groves/${groveId}/bees/${beeId}`);
}
