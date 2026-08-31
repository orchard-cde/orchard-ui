import { render, screen, waitFor, act } from '@testing-library/react';
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
  useGroveEvents: jest.fn(),
}));

jest.mock('@/components/common/Button', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/bees/BeeCard', () => ({
  __esModule: true,
  default: ({ bee, onAction }: any) => {
    capturedOnAction = onAction;
    return (
      <div data-testid={`bee-${bee.id}`}>
        {[bee.state, bee.type, bee.processId, bee.hatchedAt, bee.startedAt, bee.stoppedAt]
          .map((v) => String(v))
          .join('|')}
      </div>
    );
  },
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

const buzzingBee = {
  id: 'bee-1',
  groveId: 'test-id',
  type: 'OPENCODE' as const,
  state: 'BUZZING' as const,
  processId: 'proc-1',
  hatchedAt: '2024-06-01T00:00:00Z',
  startedAt: '2024-06-01T00:01:00Z',
  stoppedAt: null,
};

const hibernatingBee = {
  ...buzzingBee,
  id: 'bee-2',
  state: 'HIBERNATING' as const,
  processId: 'proc-2',
};

let capturedOnBeeEvent: ((e: any) => void) | undefined;
let capturedOnAction: (() => void) | undefined;

beforeEach(() => {
  jest.clearAllMocks();
  (getGrove as jest.Mock).mockResolvedValue(mockGrove);
  (getSshConfig as jest.Mock).mockResolvedValue('ssh-ed25519 AAA...');
  (listBees as jest.Mock).mockResolvedValue([]);
  capturedOnBeeEvent = undefined;
  capturedOnAction = undefined;
  (useGroveEvents as jest.Mock).mockImplementation((_groveId: string, opts?: any) => {
    capturedOnBeeEvent = opts?.onBeeEvent;
    return { event: null, error: null, connecting: false };
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
  (listBees as jest.Mock).mockResolvedValue([buzzingBee]);

  render(<GroveDetailView />);

  await waitFor(() => {
    expect(screen.getByText('Swarm')).toBeInTheDocument();
    expect(screen.getByTestId('bee-bee-1')).toBeInTheDocument();
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

  render(<GroveDetailView />);

  await waitFor(() => {
    expect(screen.getByText('Swarm')).toBeInTheDocument();
    expect(screen.getByText(/No bees attached/)).toBeInTheDocument();
  });
});

test('fetchBees still drives the spinner: no false empty-state flash on the first FLOURISHING render', async () => {
  (listBees as jest.Mock).mockImplementation(() => new Promise(() => {}));

  // Bypass waitFor's act-wrapped polling here: it settles cascading updates
  // before any assertion can run, which hides the exact commit under test —
  // the one where isFlourishing flips true but the fetchBees effect (a
  // separate passive effect) has not yet run to update beeLoading.
  render(<GroveDetailView />);
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(screen.getByText('Swarm')).toBeInTheDocument();
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  expect(screen.queryByText(/No bees attached/)).not.toBeInTheDocument();
});

test('derives the swarm chips from the bee list without calling getSwarmStatus', async () => {
  (listBees as jest.Mock).mockResolvedValue([buzzingBee, hibernatingBee]);

  render(<GroveDetailView />);

  await waitFor(() => {
    expect(screen.getByText('2 total')).toBeInTheDocument();
  });
  expect(screen.getByText('1 buzzing')).toBeInTheDocument();
  expect(screen.getByText('1 hibernating')).toBeInTheDocument();
  expect(getSwarmStatus).not.toHaveBeenCalled();
});

test('chip order is stable and canonical regardless of bee insertion order', async () => {
  const pollinatingBee = { ...buzzingBee, id: 'bee-3', state: 'POLLINATING' as const };
  // Insertion order (BUZZING, HIBERNATING, POLLINATING) would reduce into
  // that same order if chips followed Object.entries insertion order.
  (listBees as jest.Mock).mockResolvedValue([buzzingBee, hibernatingBee, pollinatingBee]);

  render(<GroveDetailView />);

  await waitFor(() => {
    expect(screen.getByText('3 total')).toBeInTheDocument();
  });

  const chipLabels = screen
    .getAllByText(/^\d+ (hatching|hibernating|buzzing|pollinating|smoked)$/)
    .map((el) => el.textContent);

  expect(chipLabels).toEqual(['1 hibernating', '1 buzzing', '1 pollinating']);

  act(() => {
    capturedOnBeeEvent?.({
      beeId: 'bee-1',
      groveId: 'test-id',
      previousState: 'BUZZING',
      newState: 'SMOKED',
      changedAt: '2024-06-01T00:02:00Z',
    });
  });

  await waitFor(() => {
    const patchedLabels = screen
      .getAllByText(/^\d+ (hatching|hibernating|buzzing|pollinating|smoked)$/)
      .map((el) => el.textContent);
    expect(patchedLabels).toEqual(['1 hibernating', '1 pollinating', '1 smoked']);
  });
});

test('a bee event patches the matching card and updates the chips', async () => {
  (listBees as jest.Mock).mockResolvedValue([buzzingBee]);

  render(<GroveDetailView />);

  await waitFor(() => {
    expect(screen.getByTestId('bee-bee-1')).toHaveTextContent('BUZZING');
  });

  (listBees as jest.Mock).mockClear();
  act(() => {
    capturedOnBeeEvent?.({
      beeId: 'bee-1',
      groveId: 'test-id',
      previousState: 'BUZZING',
      newState: 'SMOKED',
      changedAt: '2024-06-01T00:02:00Z',
    });
  });

  await waitFor(() => {
    expect(screen.getByTestId('bee-bee-1')).toHaveTextContent('SMOKED');
  });
  expect(screen.getByText('1 smoked')).toBeInTheDocument();
  expect(listBees).not.toHaveBeenCalled();
});

test('two events for two different bees both land', async () => {
  (listBees as jest.Mock).mockResolvedValue([buzzingBee, hibernatingBee]);

  render(<GroveDetailView />);

  await waitFor(() => {
    expect(screen.getByTestId('bee-bee-1')).toBeInTheDocument();
  });

  act(() => {
    capturedOnBeeEvent?.({
      beeId: 'bee-1',
      groveId: 'test-id',
      previousState: 'BUZZING',
      newState: 'SMOKED',
      changedAt: '2024-06-01T00:02:00Z',
    });
    capturedOnBeeEvent?.({
      beeId: 'bee-2',
      groveId: 'test-id',
      previousState: 'HIBERNATING',
      newState: 'BUZZING',
      changedAt: '2024-06-01T00:02:01Z',
    });
  });

  await waitFor(() => {
    expect(screen.getByTestId('bee-bee-1')).toHaveTextContent('SMOKED');
  });
  expect(screen.getByTestId('bee-bee-2')).toHaveTextContent('BUZZING');
});

test('ignores an event for an unknown beeId', async () => {
  (listBees as jest.Mock).mockResolvedValue([buzzingBee]);

  render(<GroveDetailView />);

  await waitFor(() => {
    expect(screen.getByTestId('bee-bee-1')).toHaveTextContent('BUZZING');
  });

  act(() => {
    capturedOnBeeEvent?.({
      beeId: 'bee-unknown',
      groveId: 'test-id',
      previousState: 'BUZZING',
      newState: 'SMOKED',
      changedAt: '2024-06-01T00:02:00Z',
    });
  });

  expect(screen.getByTestId('bee-bee-1')).toHaveTextContent('BUZZING');
  expect(screen.getByText('1 total')).toBeInTheDocument();
});

test('the patch changes only state and preserves every other bee field', async () => {
  (listBees as jest.Mock).mockResolvedValue([buzzingBee]);

  render(<GroveDetailView />);

  await waitFor(() => {
    expect(screen.getByTestId('bee-bee-1')).toBeInTheDocument();
  });

  act(() => {
    capturedOnBeeEvent?.({
      beeId: 'bee-1',
      groveId: 'test-id',
      previousState: 'BUZZING',
      newState: 'POLLINATING',
      changedAt: '2024-06-01T00:02:00Z',
    });
  });

  await waitFor(() => {
    expect(screen.getByTestId('bee-bee-1')).toHaveTextContent(
      'POLLINATING|OPENCODE|proc-1|2024-06-01T00:00:00Z|2024-06-01T00:01:00Z|null',
    );
  });
});

test('shows the bee error alert when listBees rejects', async () => {
  (listBees as jest.Mock).mockRejectedValue({ message: 'Could not load bees' });

  render(<GroveDetailView />);

  await waitFor(() => {
    expect(screen.getByText('Could not load bees')).toBeInTheDocument();
  });
  expect(screen.queryByText(/No bees attached/)).not.toBeInTheDocument();
});

test('renders the Swarm section above Repository', async () => {
  (listBees as jest.Mock).mockResolvedValue([buzzingBee]);

  render(<GroveDetailView />);

  await waitFor(() => {
    expect(screen.getByText('Swarm')).toBeInTheDocument();
  });

  const swarm = screen.getByText('Swarm');
  const repository = screen.getByText('Repository');

  expect(
    swarm.compareDocumentPosition(repository) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});

test('keeps Stop Grove below SSH Access', async () => {
  (listBees as jest.Mock).mockResolvedValue([buzzingBee]);

  render(<GroveDetailView />);

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Stop Grove' })).toBeInTheDocument();
  });

  const ssh = screen.getByText('SSH Access');
  const actions = screen.getByText('Actions');

  expect(
    ssh.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});

test('a stale fetchBees response does not clobber a newer one that resolved first', async () => {
  const resolvers: Array<(bees: any[]) => void> = [];
  (listBees as jest.Mock).mockImplementation(
    () => new Promise((resolve) => { resolvers.push(resolve); }),
  );

  render(<GroveDetailView />);

  await waitFor(() => expect(listBees).toHaveBeenCalledTimes(1));
  await act(async () => { resolvers[0]([hibernatingBee]); });

  await waitFor(() => {
    expect(screen.getByTestId('bee-bee-2')).toHaveTextContent('HIBERNATING');
  });

  act(() => { capturedOnAction?.(); });
  await waitFor(() => expect(listBees).toHaveBeenCalledTimes(2));

  act(() => { capturedOnAction?.(); });
  await waitFor(() => expect(listBees).toHaveBeenCalledTimes(3));

  // Newer request (call #3) resolves first with POLLINATING; older request
  // (call #2) resolves after with HIBERNATING. The newer result must win.
  await act(async () => { resolvers[2]([{ ...hibernatingBee, state: 'POLLINATING' }]); });
  await act(async () => { resolvers[1]([{ ...hibernatingBee, state: 'HIBERNATING' }]); });

  expect(screen.getByTestId('bee-bee-2')).toHaveTextContent('POLLINATING');
});

test('an SSE patch applied during a refetch survives the stale refetch response landing later', async () => {
  const resolvers: Array<(bees: any[]) => void> = [];
  (listBees as jest.Mock).mockImplementation(
    () => new Promise((resolve) => { resolvers.push(resolve); }),
  );

  render(<GroveDetailView />);

  await waitFor(() => expect(listBees).toHaveBeenCalledTimes(1));
  await act(async () => { resolvers[0]([buzzingBee]); });

  await waitFor(() => {
    expect(screen.getByTestId('bee-bee-1')).toHaveTextContent('BUZZING');
  });

  act(() => { capturedOnAction?.(); });
  await waitFor(() => expect(listBees).toHaveBeenCalledTimes(2));

  // The refetch is now in flight (beeLoading hides the card list). Deliver
  // the SSE patch while it's still pending.
  act(() => {
    capturedOnBeeEvent?.({
      beeId: 'bee-1',
      groveId: 'test-id',
      previousState: 'BUZZING',
      newState: 'SMOKED',
      changedAt: '2024-06-01T00:02:00Z',
    });
  });

  // The in-flight refetch resolves with the pre-patch snapshot; the SSE patch must hold.
  await act(async () => { resolvers[1]([buzzingBee]); });

  await waitFor(() => {
    expect(screen.getByTestId('bee-bee-1')).toHaveTextContent('SMOKED');
  });
});

test('an SSE patch for a bee not yet in the list is not lost when the first fetch resolves', async () => {
  const resolvers: Array<(bees: any[]) => void> = [];
  (listBees as jest.Mock).mockImplementation(
    () => new Promise((resolve) => { resolvers.push(resolve); }),
  );

  render(<GroveDetailView />);

  await waitFor(() => expect(listBees).toHaveBeenCalledTimes(1));

  // The bee isn't in the list yet (bees is still []), so this patch is a
  // no-op against the current state, but it must not be discarded.
  act(() => {
    capturedOnBeeEvent?.({
      beeId: 'bee-1',
      groveId: 'test-id',
      previousState: 'BUZZING',
      newState: 'POLLINATING',
      changedAt: '2024-06-01T00:02:00Z',
    });
  });

  await act(async () => { resolvers[0]([buzzingBee]); });

  await waitFor(() => {
    expect(screen.getByTestId('bee-bee-1')).toBeInTheDocument();
  });
  expect(screen.queryByText(/No bees attached/)).not.toBeInTheDocument();
  expect(screen.getByTestId('bee-bee-1')).toHaveTextContent('POLLINATING');
});
