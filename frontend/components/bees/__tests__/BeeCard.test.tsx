import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import BeeCard from '../BeeCard';
import type { BeeResponse } from '@/types/orchard';
jest.mock('@/components/common/Button', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/lib/api/bees', () => ({
  wakeBee: jest.fn(),
  smokeBee: jest.fn(),
  removeBee: jest.fn(),
}));

import { wakeBee, smokeBee, removeBee } from '@/lib/api/bees';

const mockBee: BeeResponse = {
  id: 'bee-1',
  groveId: 'grove-1',
  type: 'OPENCODE',
  state: 'BUZZING',
  processId: 'proc-123',
  hatchedAt: '2024-06-01T00:00:00Z',
  startedAt: '2024-06-01T00:01:00Z',
  stoppedAt: null,
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('renders bee type and status', () => {
  render(<BeeCard bee={mockBee} onAction={jest.fn()} />);
  expect(screen.getByText('OpenCode')).toBeInTheDocument();
  expect(screen.getByText('Buzzing', { selector: '.MuiChip-label' })).toBeInTheDocument();
});

test('shows Stop button when BUZZING', () => {
  render(<BeeCard bee={mockBee} onAction={jest.fn()} />);
  expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
});

test('shows Wake button when HIBERNATING', () => {
  const hibernatingBee = { ...mockBee, state: 'HIBERNATING' as const };
  render(<BeeCard bee={hibernatingBee} onAction={jest.fn()} />);
  expect(screen.getByRole('button', { name: /wake/i })).toBeInTheDocument();
});

test('calls smokeBee and onAction when Stop is clicked', async () => {
  const onAction = jest.fn();
  (smokeBee as jest.Mock).mockResolvedValue({ ...mockBee, state: 'SMOKED' });
  render(<BeeCard bee={mockBee} onAction={onAction} />);

  fireEvent.click(screen.getByRole('button', { name: /stop/i }));
  fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

  await waitFor(() => {
    expect(smokeBee).toHaveBeenCalledWith('grove-1', 'bee-1');
    expect(onAction).toHaveBeenCalled();
  });
});

test('shows Remove button when HIBERNATING', () => {
  render(<BeeCard bee={{ ...mockBee, state: 'HIBERNATING' }} onAction={jest.fn()} />);
  expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
});

test('shows Remove button when SMOKED', () => {
  render(<BeeCard bee={{ ...mockBee, state: 'SMOKED' }} onAction={jest.fn()} />);
  expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
});

test.each(['HATCHING', 'BUZZING', 'POLLINATING'] as const)(
  'hides Remove button when %s',
  (state) => {
    render(<BeeCard bee={{ ...mockBee, state }} onAction={jest.fn()} />);
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  },
);

test('Remove confirmation says the action is permanent', () => {
  render(<BeeCard bee={{ ...mockBee, state: 'HIBERNATING' }} onAction={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /remove/i }));

  expect(screen.getByText('Remove Bee')).toBeInTheDocument();
  expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
});

test('calls removeBee and onAction when Remove is confirmed', async () => {
  const onAction = jest.fn();
  (removeBee as jest.Mock).mockResolvedValue(undefined);
  render(<BeeCard bee={{ ...mockBee, state: 'HIBERNATING' }} onAction={onAction} />);

  fireEvent.click(screen.getByRole('button', { name: /remove/i }));
  fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

  await waitFor(() => {
    expect(removeBee).toHaveBeenCalledWith('grove-1', 'bee-1');
    expect(onAction).toHaveBeenCalled();
  });
});

test('does not call removeBee when the confirmation is cancelled', async () => {
  render(<BeeCard bee={{ ...mockBee, state: 'HIBERNATING' }} onAction={jest.fn()} />);

  fireEvent.click(screen.getByRole('button', { name: /remove/i }));
  fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

  await waitFor(() => {
    expect(screen.queryByText('Remove Bee')).not.toBeInTheDocument();
  });
  expect(removeBee).not.toHaveBeenCalled();
});

test('surfaces a removeBee failure inside the card', async () => {
  (removeBee as jest.Mock).mockRejectedValue({ message: 'Bee is still running' });
  render(<BeeCard bee={{ ...mockBee, state: 'SMOKED' }} onAction={jest.fn()} />);

  fireEvent.click(screen.getByRole('button', { name: /remove/i }));
  fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

  await waitFor(() => {
    expect(screen.getByText('Bee is still running')).toBeInTheDocument();
  });
});

test('Stop still uses its own copy and handler', async () => {
  (smokeBee as jest.Mock).mockResolvedValue({ ...mockBee, state: 'SMOKED' });
  render(<BeeCard bee={mockBee} onAction={jest.fn()} />);

  fireEvent.click(screen.getByRole('button', { name: /stop/i }));
  expect(screen.getByText('Stop Bee')).toBeInTheDocument();
  expect(screen.getByText(/wake it later/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
  await waitFor(() => {
    expect(smokeBee).toHaveBeenCalledWith('grove-1', 'bee-1');
    expect(removeBee).not.toHaveBeenCalled();
  });
});
