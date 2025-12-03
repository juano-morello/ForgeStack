import { render, screen } from '@testing-library/react';
import { PricingSection } from './pricing-section';

describe('PricingSection', () => {
  it('renders the section heading', () => {
    render(<PricingSection />);
    
    expect(
      screen.getByRole('heading', { name: /simple, transparent pricing/i })
    ).toBeInTheDocument();
  });

  it('renders all three pricing tiers', () => {
    render(<PricingSection />);
    
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('renders pricing information', () => {
    render(<PricingSection />);
    
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$29')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('renders tier descriptions', () => {
    render(<PricingSection />);
    
    expect(screen.getByText('Perfect for getting started')).toBeInTheDocument();
    expect(screen.getByText('For growing teams')).toBeInTheDocument();
    expect(screen.getByText('For large organizations')).toBeInTheDocument();
  });

  it('highlights the popular tier', () => {
    render(<PricingSection />);

    const popularBadge = screen.getByText('POPULAR');
    expect(popularBadge).toBeInTheDocument();
    
    // Check that the Pro tier has the ring styling
    const proCard = popularBadge.closest('.glass-card');
    expect(proCard).toHaveClass('ring-2', 'ring-primary/20');
  });

  it('renders CTA buttons for each tier', () => {
    render(<PricingSection />);
    
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Start Free Trial')).toBeInTheDocument();
    expect(screen.getByText('Contact Sales')).toBeInTheDocument();
  });

  it('has correct links for CTA buttons', () => {
    render(<PricingSection />);
    
    const getStartedLink = screen.getByText('Get Started').closest('a');
    const freeTrialLink = screen.getByText('Start Free Trial').closest('a');
    const contactSalesLink = screen.getByText('Contact Sales').closest('a');
    
    expect(getStartedLink).toHaveAttribute('href', '/signup');
    expect(freeTrialLink).toHaveAttribute('href', '/signup?plan=pro');
    expect(contactSalesLink).toHaveAttribute('href', '/contact');
  });

  it('renders feature lists for each tier', () => {
    render(<PricingSection />);
    
    // Free tier features
    expect(screen.getByText('Up to 3 team members')).toBeInTheDocument();
    expect(screen.getByText('1 organization')).toBeInTheDocument();
    
    // Pro tier features
    expect(screen.getByText('Unlimited team members')).toBeInTheDocument();
    expect(screen.getByText('API access')).toBeInTheDocument();
    
    // Enterprise tier features
    expect(screen.getByText('SSO/SAML')).toBeInTheDocument();
    expect(screen.getByText('SLA guarantee')).toBeInTheDocument();
  });

  it('applies correct grid layout', () => {
    const { container } = render(<PricingSection />);
    
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-3', 'gap-8');
  });
});

