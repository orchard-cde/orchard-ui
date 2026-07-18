import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import BeeCard from '../BeeCard';
import type { BeeResponse } from '@/types/orchard';
jest.mock('@/components/common/Button', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/lib/api/bees', () => ({
  wakeBee: jest.fn(),
// ...

  smokeBee: jest.fn(),
}));

import { wakeBee, smokeBee } from '@/lib/api/bees';

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
