import { render, screen, fireEvent } from '@testing-library/react';
import { MarketingNav } from './marketing-nav';

describe('MarketingNav', () => {
  it('renders the logo and brand name', () => {
    render(<MarketingNav />);
    
    expect(screen.getByText('ForgeStack')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<MarketingNav />);
    
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('Docs')).toBeInTheDocument();
  });

  it('renders CTA buttons', () => {
    render(<MarketingNav />);
    
    expect(screen.getByText('Log in')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('has correct links for CTA buttons', () => {
    render(<MarketingNav />);
    
    const loginLink = screen.getAllByText('Log in')[0].closest('a');
    const signupLink = screen.getAllByText('Get Started')[0].closest('a');
    
    expect(loginLink).toHaveAttribute('href', '/login');
    expect(signupLink).toHaveAttribute('href', '/signup');
  });

  it('toggles mobile menu when hamburger is clicked', () => {
    render(<MarketingNav />);
    
    const menuButton = screen.getByLabelText('Toggle menu');
    
    // Initially, mobile menu should not be visible
    expect(screen.queryByRole('navigation')).toBeInTheDocument();
    
    // Click to open
    fireEvent.click(menuButton);
    
    // Mobile menu should be visible
    const mobileLinks = screen.getAllByText('Features');
    expect(mobileLinks.length).toBeGreaterThan(1); // Desktop + Mobile
  });

  it('applies correct styling classes', () => {
    const { container } = render(<MarketingNav />);
    
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50');
  });
});

