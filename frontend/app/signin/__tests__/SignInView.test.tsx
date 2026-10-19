import { render, screen, waitFor } from '@testing-library/react';
import SignInView from '../SignInView';
import { getSession } from '@/lib/api/session';

const replace = jest.fn();
let search = '';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(search),
}));

jest.mock('@/lib/api/session', () => ({ getSession: jest.fn() }));

const NO_AUTH_COPY =
  /Browser sign-in is not available yet\. For local development, start the dev server with/;

describe('SignInView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    search = '';
  });

  it('renders nothing while the session request is pending', () => {
    (getSession as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { container } = render(<SignInView />);

    expect(container).toBeEmptyDOMElement();
  });

  it('redirects to / when already authenticated', async () => {
    (getSession as jest.Mock).mockResolvedValue({ enabled: true, authenticated: true });
    render(<SignInView />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
  });

  it('shows a Sign in link to the fence authorization endpoint when signed out', async () => {
    (getSession as jest.Mock).mockResolvedValue({ enabled: true, authenticated: false });
    render(<SignInView />);

    const link = await screen.findByRole('link', { name: 'Sign in' });
    expect(link).toHaveAttribute('href', '/oauth2/authorization/fence');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('shows the failure alert when the error query param is present', async () => {
    search = 'error';
    (getSession as jest.Mock).mockResolvedValue({ enabled: true, authenticated: false });
    render(<SignInView />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sign-in failed. Please try again.'
    );
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/oauth2/authorization/fence'
    );
  });

  it('shows the --no-auth guidance when auth is disabled', async () => {
    (getSession as jest.Mock).mockResolvedValue({ enabled: false, authenticated: false });
    render(<SignInView />);

    expect(await screen.findByText(NO_AUTH_COPY)).toBeInTheDocument();
    expect(screen.getByText('trowel dev-server start --no-auth')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
  });

  it('shows the --no-auth guidance when the session request fails', async () => {
    (getSession as jest.Mock).mockRejectedValue(new Error('network'));
    render(<SignInView />);

    expect(await screen.findByText(NO_AUTH_COPY)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
  });
});
