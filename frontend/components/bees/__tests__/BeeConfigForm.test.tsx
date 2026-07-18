import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import BeeConfigForm from '../BeeConfigForm';

function ControlledWrapper({ initialValues, onChangeCapture }: { initialValues: Record<string, string>; onChangeCapture: (values: Record<string, string>) => void }) {
  const [values, setValues] = useState(initialValues);
  const handleChange = (newValues: Record<string, string>) => {
    setValues(newValues);
    onChangeCapture(newValues);
  };
  return <BeeConfigForm beeType="CLAUDE_CODE" values={values} onChange={handleChange} />;
}

test('renders schema fields for CLAUDE_CODE', () => {
  render(
    <BeeConfigForm beeType="CLAUDE_CODE" values={{}} onChange={jest.fn()} />
  );
  expect(screen.getByLabelText('Model')).toBeInTheDocument();
  expect(screen.getByLabelText('Allowed Tools')).toBeInTheDocument();
  expect(screen.getByLabelText('Max Tokens')).toBeInTheDocument();
  expect(screen.getByLabelText('CLAUDE.md Content')).toBeInTheDocument();
  expect(screen.getByLabelText('AGENTS.md Content')).toBeInTheDocument();
});

test('renders free-form key/value editor for CUSTOM', () => {
  render(
    <BeeConfigForm beeType="CUSTOM" values={{}} onChange={jest.fn()} />
  );
  expect(screen.getByText('Configuration')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /add field/i })).toBeInTheDocument();
});

test('calls onChange when a field value changes', async () => {
  const onChange = jest.fn();
  const user = userEvent.setup();
  render(
    <ControlledWrapper initialValues={{}} onChangeCapture={onChange} />
  );

  await user.type(screen.getByLabelText('Allowed Tools'), 'bash,read');
  expect(onChange).toHaveBeenLastCalledWith({ allowedTools: 'bash,read' });
});

test('adds and removes key/value pairs for CUSTOM type', async () => {
  const onChange = jest.fn();
  const user = userEvent.setup();
  render(
    <BeeConfigForm beeType="CUSTOM" values={{}} onChange={onChange} />
  );

  await user.click(screen.getByRole('button', { name: /add field/i }));
  expect(onChange).toHaveBeenCalledWith({ '': '' });
});
