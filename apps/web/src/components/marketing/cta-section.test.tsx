import { render, screen } from '@testing-library/react';
import { CTASection } from './cta-section';

describe('CTASection', () => {
  it('renders the section heading', () => {
    render(<CTASection />);
    
    expect(
      screen.getByRole('heading', { name: /ready to build your next saas/i })
    ).toBeInTheDocument();
  });

  it('renders the section description', () => {
    render(<CTASection />);
    
    expect(
      screen.getByText(/get started with forgestack today/i)
    ).toBeInTheDocument();
  });

  it('renders the CTA button', () => {
    render(<CTASection />);
    
    expect(screen.getByText('Start Building for Free')).toBeInTheDocument();
  });

  it('has correct link for CTA button', () => {
    render(<CTASection />);
    
    const ctaLink = screen.getByText('Start Building for Free').closest('a');
    expect(ctaLink).toHaveAttribute('href', '/signup');
  });

  it('applies correct styling classes', () => {
    const { container } = render(<CTASection />);
    
    const section = container.querySelector('section');
    expect(section).toHaveClass('py-24', 'px-4');
  });

  it('renders with glass-card styling', () => {
    const { container } = render(<CTASection />);
    
    const card = container.querySelector('.glass-card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('rounded-2xl');
  });

  it('renders with semantic HTML structure', () => {
    const { container } = render(<CTASection />);
    
    expect(container.querySelector('section')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});

