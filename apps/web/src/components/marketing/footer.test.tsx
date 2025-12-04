import { render, screen } from '@testing-library/react';
import { Footer } from './footer';

describe('Footer', () => {
  it('renders the logo and brand name', () => {
    render(<Footer />);
    
    expect(screen.getByText('ForgeStack')).toBeInTheDocument();
  });

  it('renders the tagline', () => {
    render(<Footer />);
    
    expect(screen.getByText(/ship faster with the modern saas starter kit/i)).toBeInTheDocument();
  });

  it('renders all link sections', () => {
    render(<Footer />);
    
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Legal')).toBeInTheDocument();
    expect(screen.getByText('Connect')).toBeInTheDocument();
  });

  it('renders product links', () => {
    render(<Footer />);
    
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('Changelog')).toBeInTheDocument();
    expect(screen.getByText('Docs')).toBeInTheDocument();
  });

  it('renders company links', () => {
    render(<Footer />);
    
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('Careers')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('renders legal links', () => {
    render(<Footer />);
    
    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText('Terms')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
  });

  it('renders social links', () => {
    render(<Footer />);
    
    expect(screen.getByText('Twitter')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Discord')).toBeInTheDocument();
  });

  it('renders copyright notice with current year', () => {
    render(<Footer />);
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear} ForgeStack`))).toBeInTheDocument();
  });

  it('has correct links for features and pricing', () => {
    render(<Footer />);
    
    const featuresLink = screen.getByText('Features').closest('a');
    const pricingLink = screen.getByText('Pricing').closest('a');
    
    expect(featuresLink).toHaveAttribute('href', '/features');
    expect(pricingLink).toHaveAttribute('href', '/pricing');
  });

  it('applies correct grid layout', () => {
    const { container } = render(<Footer />);
    
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-2', 'md:grid-cols-4', 'gap-8');
  });

  it('renders with semantic HTML structure', () => {
    const { container } = render(<Footer />);
    
    expect(container.querySelector('footer')).toBeInTheDocument();
  });
});

