import { render, screen } from '@testing-library/react';
import NavSidebar from '../NavSidebar';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/groves'),
}));

describe('NavSidebar', () => {
  it('links to Groves, Nursery and Apiary', () => {
    render(<NavSidebar />);

    expect(screen.getByRole('link', { name: 'Groves' })).toHaveAttribute('href', '/groves');
    expect(screen.getByRole('link', { name: 'Nursery' })).toHaveAttribute('href', '/nursery');
    expect(screen.getByRole('link', { name: 'Apiary' })).toHaveAttribute('href', '/apiary');
  });
});
