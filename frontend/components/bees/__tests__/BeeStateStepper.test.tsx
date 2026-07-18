import { render, screen } from '@testing-library/react';
import BeeStateStepper from '../BeeStateStepper';

test('renders all four step labels', () => {
  render(<BeeStateStepper currentState="HATCHING" />);
  expect(screen.getByText('Hatching')).toBeInTheDocument();
  expect(screen.getByText('Hibernating')).toBeInTheDocument();
  expect(screen.getByText('Buzzing')).toBeInTheDocument();
  expect(screen.getByText('Pollinating')).toBeInTheDocument();
});

test('shows smoked alert when state is SMOKED', () => {
  render(<BeeStateStepper currentState="SMOKED" />);
  expect(screen.getByText(/This bee has been smoked/)).toBeInTheDocument();
});

test('does not show smoked alert for non-SMOKED states', () => {
  render(<BeeStateStepper currentState="BUZZING" />);
  expect(screen.queryByText(/smoked/)).not.toBeInTheDocument();
});
