import { apiClient } from './apiClient';
import type { CultivatorResponse } from '@/types/orchard';

export async function getCurrentCultivator(): Promise<CultivatorResponse> {
  const response = await apiClient.get<CultivatorResponse>('/api/me');
  return response.data;
}
