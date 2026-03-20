export type GroveState =
  | 'PREPARING'
  | 'PLANTING'
  | 'GROWING'
  | 'FLOURISHING'
  | 'DORMANT'
  | 'CLEARING'
  | 'CLEARED'
  | 'BLIGHTED';

export interface SeedlingInfo {
  id: string;
  state: string;
  ipAddress: string | null;
  sshPort: number;
  cpuCores: number;
  memoryMb: number;
  diskGb: number;
}

export interface FruitInfo {
  id: string;
  state: string;
  containerId: string | null;
  containerName: string | null;
  serviceName: string | null;
}

export interface GroveResponse {
  id: string;
  name: string;
  repositoryUrl: string;
  branch: string;
  commitSha: string | null;
  state: GroveState;
  sshConnectionString: string | null;
  seedling: SeedlingInfo | null;
  fruits: FruitInfo[];
  plantedAt: string;
  lastAccessedAt: string | null;
}

export interface CultivatorResponse {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface CreateGroveRequest {
  name: string;
  repositoryUrl: string;
  branch?: string;
}

export interface ApiError {
  message: string;
}
