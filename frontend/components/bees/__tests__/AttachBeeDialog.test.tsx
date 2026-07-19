import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AttachBeeDialog from '../AttachBeeDialog';

jest.mock('@/components/common/Button', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/lib/api/bees', () => ({
  createBee: jest.fn(),
}));

import { createBee } from '@/lib/api/bees';

beforeEach(() => {
  jest.clearAllMocks();
});

test('does not render when closed', () => {
  render(<AttachBeeDialog open={false} onClose={jest.fn()} groveId="grove-1" />);
  expect(screen.queryByText('Attach Bee')).not.toBeInTheDocument();
});

test('renders type selector and version input when open', () => {
  render(<AttachBeeDialog open={true} onClose={jest.fn()} groveId="grove-1" />);
  expect(screen.getByText('Bee Type')).toBeInTheDocument();
  expect(screen.getByLabelText('Version')).toBeInTheDocument();
});

test('calls createBee and onClose on successful submit', async () => {
  const onClose = jest.fn();
  (createBee as jest.Mock).mockResolvedValue({ id: 'new-bee' });
  render(<AttachBeeDialog open={true} onClose={onClose} groveId="grove-1" />);

  fireEvent.click(screen.getByText('OpenCode'));
  fireEvent.click(screen.getByRole('button', { name: /attach/i }));

  await waitFor(() => {
    expect(createBee).toHaveBeenCalledWith('grove-1', {
      beeType: 'OPENCODE',
      version: undefined,
      configOverrides: undefined,
    });
    expect(onClose).toHaveBeenCalled();
  });
});
