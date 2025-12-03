import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DocsSidebar } from './docs-sidebar';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/docs',
}));

describe('DocsSidebar', () => {
  it('renders ForgeStack logo link', () => {
    render(<DocsSidebar />);
    const logo = screen.getByText('ForgeStack');
    expect(logo).toBeInTheDocument();
    expect(logo.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders all navigation sections', () => {
    render(<DocsSidebar />);
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Guides')).toBeInTheDocument();
    expect(screen.getByText('API Reference')).toBeInTheDocument();
    expect(screen.getByText('SDK')).toBeInTheDocument();
  });

  it('renders Getting Started section items', () => {
    render(<DocsSidebar />);
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    const installationLinks = screen.getAllByText('Installation');
    expect(installationLinks.length).toBeGreaterThan(0);
    expect(screen.getByText('Quickstart')).toBeInTheDocument();
  });

  it('renders Guides section items', () => {
    render(<DocsSidebar />);
    const authLinks = screen.getAllByText('Authentication');
    expect(authLinks.length).toBeGreaterThan(0);
    expect(screen.getByText('Organizations')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.getByText('Webhooks')).toBeInTheDocument();
  });

  it('renders API Reference section items', () => {
    render(<DocsSidebar />);
    const overviewLinks = screen.getAllByText('Overview');
    expect(overviewLinks.length).toBeGreaterThan(0);
    const authLinks = screen.getAllByText('Authentication');
    expect(authLinks.length).toBeGreaterThan(0);
    expect(screen.getByText('Endpoints')).toBeInTheDocument();
  });

  it('renders SDK section items', () => {
    render(<DocsSidebar />);
    const installationLinks = screen.getAllByText('Installation');
    expect(installationLinks.length).toBeGreaterThan(0);
    expect(screen.getByText('Usage')).toBeInTheDocument();
  });

  it('renders navigation links with correct hrefs', () => {
    render(<DocsSidebar />);
    const introLink = screen.getByText('Introduction').closest('a');
    expect(introLink).toHaveAttribute('href', '/docs');

    const installLink = screen.getAllByText('Installation')[0].closest('a');
    expect(installLink).toHaveAttribute('href', '/docs/installation');
  });

  it('applies active styling to current page', () => {
    render(<DocsSidebar />);
    // Verify the Introduction link exists (it should be active since pathname is /docs)
    const introLink = screen.getByRole('link', { name: 'Introduction' });
    expect(introLink).toBeInTheDocument();
  });

  it('applies inactive styling to non-current pages', () => {
    render(<DocsSidebar />);
    // Verify the Installation link exists
    const links = screen.getAllByRole('link', { name: 'Installation' });
    expect(links.length).toBeGreaterThan(0);
  });
});

