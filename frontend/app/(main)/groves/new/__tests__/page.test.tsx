import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlantGrovePage from '../page';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

jest.mock('@/lib/api/groves', () => ({
  plantGrove: jest.fn(),
}));

import { plantGrove } from '@/lib/api/groves';

beforeEach(() => {
  jest.clearAllMocks();
  (plantGrove as jest.Mock).mockResolvedValue({ id: 'grove-1' });
});

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Name/), 'My Grove');
  await user.type(screen.getByLabelText(/Repository URL/), 'https://github.com/org/repo');
}

test('submits without machineSize when the default Small is kept', async () => {
  const user = userEvent.setup();
  render(<PlantGrovePage />);

  await fillRequiredFields(user);
  await user.click(screen.getByRole('button', { name: 'Plant Grove' }));

  await waitFor(() => expect(plantGrove).toHaveBeenCalledTimes(1));
  expect(plantGrove).toHaveBeenCalledWith({
    name: 'My Grove',
    repositoryUrl: 'https://github.com/org/repo',
  });
});

test('submits machineSize when Large is chosen', async () => {
  const user = userEvent.setup();
  render(<PlantGrovePage />);

  await fillRequiredFields(user);
  await user.click(screen.getByRole('combobox', { name: /Machine size/ }));
  await user.click(screen.getByRole('option', { name: 'Large' }));
  await user.click(screen.getByRole('button', { name: 'Plant Grove' }));

  await waitFor(() => expect(plantGrove).toHaveBeenCalledTimes(1));
  expect(plantGrove).toHaveBeenCalledWith({
    name: 'My Grove',
    repositoryUrl: 'https://github.com/org/repo',
    machineSize: 'large',
  });
});
