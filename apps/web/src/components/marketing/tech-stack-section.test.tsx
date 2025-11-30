import { render, screen } from '@testing-library/react';
import { TechStackSection } from './tech-stack-section';

describe('TechStackSection', () => {
  it('renders the main heading', () => {
    render(<TechStackSection />);
    
    expect(
      screen.getByRole('heading', { name: /built with modern technologies/i })
    ).toBeInTheDocument();
  });

  it('renders the frontend category heading', () => {
    render(<TechStackSection />);
    
    expect(
      screen.getByRole('heading', { name: /frontend/i })
    ).toBeInTheDocument();
  });

  it('renders the backend category heading', () => {
    render(<TechStackSection />);
    
    expect(
      screen.getByRole('heading', { name: /backend/i })
    ).toBeInTheDocument();
  });

  it('renders all frontend technologies', () => {
    render(<TechStackSection />);
    
    expect(screen.getByText('Next.js')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Tailwind CSS')).toBeInTheDocument();
    expect(screen.getByText('shadcn/ui')).toBeInTheDocument();
  });

  it('renders all backend technologies', () => {
    render(<TechStackSection />);
    
    expect(screen.getByText('NestJS')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText('Drizzle ORM')).toBeInTheDocument();
    expect(screen.getByText('Redis')).toBeInTheDocument();
    expect(screen.getByText('BullMQ')).toBeInTheDocument();
  });

  it('applies correct section styling', () => {
    const { container } = render(<TechStackSection />);
    
    const section = container.querySelector('section');
    expect(section).toHaveClass('py-24', 'px-4', 'border-t', 'border-border/50');
  });

  it('applies correct container styling', () => {
    const { container } = render(<TechStackSection />);
    
    const mainContainer = container.querySelector('.max-w-5xl');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('mx-auto', 'text-center');
  });

  it('applies correct badge styling to tech items', () => {
    const { container } = render(<TechStackSection />);
    
    const badges = container.querySelectorAll('span.px-4');
    expect(badges.length).toBeGreaterThan(0);
    
    badges.forEach((badge) => {
      expect(badge).toHaveClass(
        'px-4',
        'py-2',
        'rounded-full',
        'border',
        'border-border/50',
        'text-sm',
        'font-medium',
        'bg-card/50',
        'hover:bg-card',
        'transition-colors'
      );
    });
  });

  it('renders with semantic HTML structure', () => {
    const { container } = render(<TechStackSection />);
    
    // Check for section element
    expect(container.querySelector('section')).toBeInTheDocument();
    
    // Check for heading hierarchy (h2 for main, h3 for categories)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    const h3Headings = screen.getAllByRole('heading', { level: 3 });
    expect(h3Headings).toHaveLength(2); // Frontend and Backend
  });

  it('renders exactly 5 frontend technologies', () => {
    render(<TechStackSection />);
    
    const frontendTechs = ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'shadcn/ui'];
    frontendTechs.forEach((tech) => {
      expect(screen.getByText(tech)).toBeInTheDocument();
    });
  });

  it('renders exactly 5 backend technologies', () => {
    render(<TechStackSection />);
    
    const backendTechs = ['NestJS', 'PostgreSQL', 'Drizzle ORM', 'Redis', 'BullMQ'];
    backendTechs.forEach((tech) => {
      expect(screen.getByText(tech)).toBeInTheDocument();
    });
  });
});

