import { render, screen } from '@testing-library/react';
import BeeStatusChip from '../BeeStatusChip';

test('renders correct label for each state', () => {
  const { rerender } = render(<BeeStatusChip state="HATCHING" />);
  expect(screen.getByText('Hatching')).toBeInTheDocument();

  rerender(<BeeStatusChip state="HIBERNATING" />);
  expect(screen.getByText('Hibernating')).toBeInTheDocument();

  rerender(<BeeStatusChip state="BUZZING" />);
  expect(screen.getByText('Buzzing')).toBeInTheDocument();

  rerender(<BeeStatusChip state="POLLINATING" />);
  expect(screen.getByText('Pollinating')).toBeInTheDocument();

  rerender(<BeeStatusChip state="SMOKED" />);
  expect(screen.getByText('Smoked')).toBeInTheDocument();
});
