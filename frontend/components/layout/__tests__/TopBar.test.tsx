import { fireEvent, render, screen } from '@testing-library/react';
import TopBar from '../TopBar';

describe('TopBar', () => {
  afterEach(() => {
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('shows no sign out when unauthenticated', () => {
    render(<TopBar cultivatorName="Ada" authenticated={false} />);
    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
  });

  it('posts the XSRF token to /logout when authenticated', () => {
    document.cookie = 'XSRF-TOKEN=abc';
    const { container } = render(
      <TopBar cultivatorName="Ada" authenticated />,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    const input = form.querySelector('input[name="_csrf"]') as HTMLInputElement;
    const block = (e: Event) => e.preventDefault();
    form.addEventListener('submit', block);

    fireEvent.submit(form);

    expect(input.value).toBe('abc');
    expect(form.getAttribute('method')).toBe('post');
    expect(form.getAttribute('action')).toBe('/logout');
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
    form.removeEventListener('submit', block);
  });
});
