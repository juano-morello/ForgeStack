import { render, screen } from '@testing-library/react';
import { HeroSection } from './hero-section';

describe('HeroSection', () => {
  it('renders the main headline', () => {
    render(<HeroSection />);
    
    expect(
      screen.getByRole('heading', { name: /build saas products faster than ever before/i })
    ).toBeInTheDocument();
  });

  it('renders the subheadline', () => {
    render(<HeroSection />);
    
    expect(
      screen.getByText(/production-ready multi-tenant starter kit/i)
    ).toBeInTheDocument();
  });

  it('renders the version badge', () => {
    render(<HeroSection />);
    
    expect(screen.getByText(/introducing forgestack v2/i)).toBeInTheDocument();
  });

  it('renders CTA buttons', () => {
    render(<HeroSection />);
    
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('View on GitHub')).toBeInTheDocument();
  });

  it('has correct links for CTA buttons', () => {
    render(<HeroSection />);

    const getStartedLink = screen.getByText('Get Started').closest('a');
    const githubLink = screen.getByText('View on GitHub').closest('a');

    expect(getStartedLink).toHaveAttribute('href', '/signup');
    expect(githubLink).toHaveAttribute('href', 'https://github.com/forgestack/forgestack');
  });

  it('renders tech stack badges', () => {
    render(<HeroSection />);
    
    expect(screen.getByText('Next.js 16')).toBeInTheDocument();
    expect(screen.getByText('React 19')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Tailwind CSS')).toBeInTheDocument();
    expect(screen.getByText('Drizzle ORM')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(<HeroSection />);
    
    const section = container.querySelector('section');
    expect(section).toHaveClass('relative', 'min-h-[90vh]');
  });

  it('renders with semantic HTML structure', () => {
    const { container } = render(<HeroSection />);
    
    expect(container.querySelector('section')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});

