export type GroveState =
  | 'PREPARING'
  | 'PLANTING'
  | 'GROWING'
  | 'FLOURISHING'
  | 'DORMANT'
  | 'CLEARING'
  | 'CLEARED'
  | 'BLIGHTED';

export type PlotKind = 'VM' | 'CONTAINER';

export type PlotState =
  | 'GERMINATING'
  | 'SPROUTING'
  | 'ROOTED'
  | 'WILTING'
  | 'DORMANT'
  | 'WITHERED'
  | 'BLIGHTED';

export interface PlotInfo {
  kind: PlotKind;
  id: string;
  state: PlotState;
  providerId: string;
  host: string | null;
  sshPort: number | null;
  cpuCores: number | null;
  memoryMb: number | null;
  diskGb: number | null;
  runtime: 'DOCKER' | 'PODMAN' | null;
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
  plot: PlotInfo | null;
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

export type MachineSize = 'small' | 'medium' | 'large';

export interface CreateGroveRequest {
  name: string;
  repositoryUrl: string;
  branch?: string;
  machineSize?: MachineSize;
}

export interface ApiError {
  message: string;
}

export type BeeState =
  | 'HATCHING'
  | 'HIBERNATING'
  | 'BUZZING'
  | 'POLLINATING'
  | 'SMOKED';

export const BEE_STATE_ORDER: readonly BeeState[] = [
  'HATCHING',
  'HIBERNATING',
  'BUZZING',
  'POLLINATING',
  'SMOKED',
];

export type BeeType =
  | 'CLAUDE_CODE'
  | 'GEMINI'
  | 'CODEX'
  | 'KIRO'
  | 'OPENCODE'
  | 'CUSTOM';

export interface BeeResponse {
  id: string;
  groveId: string;
  type: BeeType;
  state: BeeState;
  processId: string | null;
  hatchedAt: string;
  startedAt: string | null;
  stoppedAt: string | null;
}

export interface SwarmStatusResponse {
  groveId: string;
  totalBees: number;
  byState: Record<string, number>;
}

export interface CreateBeeRequest {
  beeType: BeeType;
  version?: string;
  configOverrides?: Record<string, string>;
}
