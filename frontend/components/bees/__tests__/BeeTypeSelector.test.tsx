import { render, screen, fireEvent } from '@testing-library/react';
import BeeTypeSelector from '../BeeTypeSelector';

test('renders all six bee types', () => {
  render(
    <BeeTypeSelector
      selectedType={null}
      onSelect={jest.fn()}
      version=""
      onVersionChange={jest.fn()}
    />
  );
  expect(screen.getByText('Claude Code')).toBeInTheDocument();
  expect(screen.getByText('Gemini CLI')).toBeInTheDocument();
  expect(screen.getByText('Codex')).toBeInTheDocument();
  expect(screen.getByText('Kiro CLI')).toBeInTheDocument();
  expect(screen.getByText('OpenCode')).toBeInTheDocument();
  expect(screen.getByText('Custom')).toBeInTheDocument();
});

test('calls onSelect when a type is clicked', async () => {
  const onSelect = jest.fn();
  render(
    <BeeTypeSelector
      selectedType={null}
      onSelect={onSelect}
      version=""
      onVersionChange={jest.fn()}
    />
  );

  fireEvent.click(screen.getByText('Claude Code'));
  expect(onSelect).toHaveBeenCalledWith('CLAUDE_CODE');
});

test('renders version input and calls onVersionChange', async () => {
  const onVersionChange = jest.fn();
  render(
    <BeeTypeSelector
      selectedType="OPENCODE"
      onSelect={jest.fn()}
      version=""
      onVersionChange={onVersionChange}
    />
  );

  fireEvent.change(screen.getByLabelText('Version'), { target: { value: '1.0.0' } });
  expect(onVersionChange).toHaveBeenCalledWith('1.0.0');
});
