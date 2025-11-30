import { render, screen } from '@testing-library/react';
import { FeaturesSection } from './features-section';

describe('FeaturesSection', () => {
  it('renders the section heading', () => {
    render(<FeaturesSection />);
    
    expect(
      screen.getByRole('heading', { name: /everything you need to ship faster/i })
    ).toBeInTheDocument();
  });

  it('renders the section description', () => {
    render(<FeaturesSection />);
    
    expect(
      screen.getByText(/forgestack comes with all the essential features/i)
    ).toBeInTheDocument();
  });

  it('renders all 6 feature cards', () => {
    render(<FeaturesSection />);
    
    // Check for all feature titles
    expect(screen.getByText('Authentication')).toBeInTheDocument();
    expect(screen.getByText('Multi-tenancy')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.getByText('API Keys')).toBeInTheDocument();
    expect(screen.getByText('Webhooks')).toBeInTheDocument();
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(<FeaturesSection />);
    
    expect(
      screen.getByText(/secure login with better-auth/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/built-in organizations, teams, roles/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/stripe integration with subscriptions/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/generate and manage api keys/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/send and receive webhooks/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/track every action with comprehensive audit logging/i)
    ).toBeInTheDocument();
  });

  it('renders icons for each feature', () => {
    const { container } = render(<FeaturesSection />);
    
    // Check that icon containers are rendered (6 features = 6 icon containers)
    const iconContainers = container.querySelectorAll('.bg-primary\\/10');
    expect(iconContainers).toHaveLength(6);
  });

  it('applies correct styling classes', () => {
    const { container } = render(<FeaturesSection />);
    
    // Check section has correct padding
    const section = container.querySelector('section');
    expect(section).toHaveClass('py-24', 'px-4');
    
    // Check container has max-width
    const mainContainer = container.querySelector('.max-w-7xl');
    expect(mainContainer).toBeInTheDocument();
    
    // Check grid layout
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6');
  });

  it('applies glass-card and hover-lift classes to feature cards', () => {
    const { container } = render(<FeaturesSection />);
    
    const cards = container.querySelectorAll('.glass-card');
    expect(cards).toHaveLength(6);
    
    cards.forEach((card) => {
      expect(card).toHaveClass('hover-lift', 'rounded-xl', 'p-6');
    });
  });

  it('renders with semantic HTML structure', () => {
    const { container } = render(<FeaturesSection />);
    
    // Check for section element
    expect(container.querySelector('section')).toBeInTheDocument();
    
    // Check for heading hierarchy
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    
    // Check for multiple h3 headings (feature titles)
    const h3Headings = screen.getAllByRole('heading', { level: 3 });
    expect(h3Headings).toHaveLength(6);
  });
});

