import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroveDetailView from '../GroveDetailView';
import type { GroveResponse } from '@/types/orchard';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/groves/test-id'),
}));

jest.mock('@/lib/api/groves', () => ({
  getGrove: jest.fn(),
  stopGrove: jest.fn(),
  getSshConfig: jest.fn(),
}));

jest.mock('@/lib/api/bees', () => ({
  listBees: jest.fn(),
  getSwarmStatus: jest.fn(),
  createBee: jest.fn(),
  wakeBee: jest.fn(),
  smokeBee: jest.fn(),
  removeBee: jest.fn(),
}));

jest.mock('@/lib/events/useGroveEvents', () => ({
  useGroveEvents: jest.fn(() => ({
    event: null,
    error: null,
    connecting: false,
  })),
}));

jest.mock('@/components/common/Button', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/bees/BeeCard', () => ({
  __esModule: true,
  default: () => <div>BeeCard</div>,
}));

jest.mock('@/components/bees/AttachBeeDialog', () => ({
  __esModule: true,
  default: () => <div>AttachBeeDialog</div>,
}));

import { getGrove, stopGrove, getSshConfig } from '@/lib/api/groves';
import { listBees, getSwarmStatus } from '@/lib/api/bees';
import { useGroveEvents } from '@/lib/events/useGroveEvents';

const mockGrove: GroveResponse = {
  id: 'test-id',
  name: 'Test Grove',
  repositoryUrl: 'https://github.com/test/repo',
  branch: 'main',
  commitSha: null,
  state: 'FLOURISHING',
  sshConnectionString: null,
  seedling: {
    id: 'seedling-1',
    state: 'RUNNING',
    ipAddress: '10.0.0.1',
    sshPort: 22,
    cpuCores: 2,
    memoryMb: 4096,
    diskGb: 50,
  },
  fruits: [],
  plantedAt: '2024-06-01T00:00:00Z',
  lastAccessedAt: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  (getGrove as jest.Mock).mockResolvedValue(mockGrove);
  (getSshConfig as jest.Mock).mockResolvedValue('ssh-ed25519 AAA...');
  (listBees as jest.Mock).mockResolvedValue([]);
  (getSwarmStatus as jest.Mock).mockResolvedValue({ groveId: 'test-id', totalBees: 0, byState: {} });
  (useGroveEvents as jest.Mock).mockReturnValue({
    event: null,
    error: null,
    connecting: false,
  });
});

test('shows inline error when stop fails instead of replacing the entire view', async () => {
  (stopGrove as jest.Mock).mockRejectedValue({ message: 'Failed to stop grove' });

  const user = userEvent.setup();
  render(<GroveDetailView />);

  await waitFor(() => {
    expect(screen.getByText('Test Grove')).toBeInTheDocument();
  });

  expect(screen.getByRole('button', { name: 'Stop Grove' })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Stop Grove' }));

  await waitFor(() => {
    expect(screen.getByText('Test Grove')).toBeInTheDocument();
    expect(screen.getByText('Failed to stop grove')).toBeInTheDocument();
  });
});

test('holds button in stopping state after successful API call until SSE confirms state change', async () => {
  (stopGrove as jest.Mock).mockResolvedValue({ ...mockGrove, state: 'FLOURISHING' });

  const mockEvents = useGroveEvents as jest.Mock;
  mockEvents.mockReturnValue({
    event: null,
    error: null,
    connecting: false,
  });

  const user = userEvent.setup();
  const { rerender } = render(<GroveDetailView />);

  await waitFor(() => {
    expect(screen.getByText('Test Grove')).toBeInTheDocument();
  });

  await user.click(screen.getByRole('button', { name: 'Stop Grove' }));

  // After API succeeds with same state, button stays in stopping state
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Stopping…' })).toBeDisabled();
  });

  // Simulate SSE event arriving with the state change
  mockEvents.mockReturnValue({
    event: { newState: 'DORMANT', previousState: 'FLOURISHING', changedAt: new Date().toISOString() },
    error: null,
    connecting: false,
  });

  rerender(<GroveDetailView />);

  await waitFor(() => {
    expect(screen.queryByRole('button', { name: /Stop/i })).not.toBeInTheDocument();
    expect(screen.getByText('Dormant')).toBeInTheDocument();
  });
});

test('shows swarm section when FLOURISHING', async () => {
  (listBees as jest.Mock).mockResolvedValue([
    {
      id: 'bee-1',
      groveId: 'test-id',
      type: 'OPENCODE',
      state: 'BUZZING',
      processId: 'proc-1',
      hatchedAt: '2024-06-01T00:00:00Z',
      startedAt: '2024-06-01T00:01:00Z',
      stoppedAt: null,
    },
  ]);
  (getSwarmStatus as jest.Mock).mockResolvedValue({
    groveId: 'test-id',
    totalBees: 1,
    byState: { BUZZING: 1 },
  });

  render(<GroveDetailView />);

  await waitFor(() => {
    expect(screen.getByText('Swarm')).toBeInTheDocument();
    expect(screen.getByText('BeeCard')).toBeInTheDocument();
    expect(screen.getByText('AttachBeeDialog')).toBeInTheDocument();
  });
});

test('hides swarm section when not FLOURISHING', async () => {
  (getGrove as jest.Mock).mockResolvedValue({ ...mockGrove, state: 'GROWING' });

  render(<GroveDetailView />);

  await waitFor(() => {
    expect(screen.getByText('Test Grove')).toBeInTheDocument();
  });

  expect(screen.queryByText('Swarm')).not.toBeInTheDocument();
});

test('shows empty state when FLOURISHING but no bees', async () => {
  (listBees as jest.Mock).mockResolvedValue([]);
  (getSwarmStatus as jest.Mock).mockResolvedValue({
    groveId: 'test-id',
    totalBees: 0,
    byState: {},
  });

  render(<GroveDetailView />);

  await waitFor(() => {
    expect(screen.getByText('Swarm')).toBeInTheDocument();
    expect(screen.getByText(/No bees attached/)).toBeInTheDocument();
  });
});
