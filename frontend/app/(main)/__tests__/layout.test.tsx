import { render, screen, waitFor } from '@testing-library/react';
import MainLayout from '../layout';
import { getSession } from '@/lib/api/session';
import { getCurrentCultivator } from '@/lib/api/cultivator';

const replace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/groves',
}));

jest.mock('@/lib/api/session', () => ({ getSession: jest.fn() }));
jest.mock('@/lib/api/cultivator', () => ({ getCurrentCultivator: jest.fn() }));

jest.mock('@/components/layout/TopBar', () => ({
  __esModule: true,
  DRAWER_WIDTH: 240,
  default: ({ cultivatorName, authenticated }: any) => (
    <div data-testid="topbar">{`${cultivatorName}|${authenticated}`}</div>
  ),
}));
jest.mock('@/components/layout/NavSidebar', () => ({
  __esModule: true,
  default: () => <nav data-testid="sidebar" />,
}));

const renderLayout = () =>
  render(
    <MainLayout>
      <div>child content</div>
    </MainLayout>
  );

describe('MainLayout session gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCurrentCultivator as jest.Mock).mockResolvedValue({
      displayName: 'Ada',
      username: 'ada',
    });
  });

  it('renders nothing while the session request is pending', () => {
    (getSession as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { container } = renderLayout();

    expect(container).toBeEmptyDOMElement();
    expect(getCurrentCultivator).not.toHaveBeenCalled();
  });

  it('redirects to /signin and renders nothing when unauthenticated', async () => {
    (getSession as jest.Mock).mockResolvedValue({
      enabled: true,
      authenticated: false,
    });
    const { container } = renderLayout();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/signin'));
    expect(screen.queryByText('child content')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
    expect(getCurrentCultivator).not.toHaveBeenCalled();
  });

  it.each([
    [{ enabled: false, authenticated: false }],
    [{ enabled: true, authenticated: true }],
  ])('renders children and loads the cultivator for %j', async (session) => {
    (getSession as jest.Mock).mockResolvedValue(session);
    renderLayout();

    expect(await screen.findByText('child content')).toBeInTheDocument();
    expect(await screen.findByText(`Ada|${session.authenticated}`)).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('keeps the Cultivator fallback without redirecting when /api/me fails with a non-401', async () => {
    (getSession as jest.Mock).mockResolvedValue({ enabled: true, authenticated: true });
    (getCurrentCultivator as jest.Mock).mockRejectedValue({ message: 'Internal Server Error' });
    renderLayout();

    expect(await screen.findByText('child content')).toBeInTheDocument();
    await waitFor(() => expect(getCurrentCultivator).toHaveBeenCalled());
    expect(await screen.findByText('Cultivator|true')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('shows an error alert when the session request fails', async () => {
    (getSession as jest.Mock).mockRejectedValue(new Error('down'));
    renderLayout();

    expect(
      await screen.findByText('Unable to reach the orchard-ui backend.')
    ).toBeInTheDocument();
    expect(screen.queryByText('child content')).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
