import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Separator } from './separator';

describe('Separator', () => {
  it('renders with default horizontal orientation', () => {
    render(<Separator data-testid="separator" />);
    
    const separator = screen.getByTestId('separator');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('renders with vertical orientation', () => {
    render(<Separator orientation="vertical" data-testid="separator" />);
    
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
  });

  it('applies horizontal styles by default', () => {
    render(<Separator data-testid="separator" />);
    
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('h-[1px]');
    expect(separator).toHaveClass('w-full');
  });

  it('applies vertical styles when orientation is vertical', () => {
    render(<Separator orientation="vertical" data-testid="separator" />);
    
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('h-full');
    expect(separator).toHaveClass('w-[1px]');
  });

  it('applies base styles', () => {
    render(<Separator data-testid="separator" />);
    
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('shrink-0');
    expect(separator).toHaveClass('bg-border');
  });

  it('is decorative by default', () => {
    render(<Separator data-testid="separator" />);

    const separator = screen.getByTestId('separator');
    // When decorative, Radix uses role="none"
    expect(separator).toHaveAttribute('role', 'none');
  });

  it('can be non-decorative', () => {
    render(<Separator decorative={false} data-testid="separator" />);

    const separator = screen.getByTestId('separator');
    // When not decorative, it should have role="separator"
    expect(separator).toHaveAttribute('role', 'separator');
  });

  it('applies custom className', () => {
    render(<Separator className="custom-class" data-testid="separator" />);
    
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('custom-class');
    // Should still have base classes
    expect(separator).toHaveClass('shrink-0');
    expect(separator).toHaveClass('bg-border');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Separator ref={ref} data-testid="separator" />);
    
    expect(ref.current).not.toBeNull();
  });

  it('renders as separator role when not decorative', () => {
    render(<Separator decorative={false} />);

    const separator = screen.getByRole('separator');
    expect(separator).toBeInTheDocument();
  });

  it('accepts additional props', () => {
    render(<Separator data-custom="test-value" data-testid="separator" />);
    
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('data-custom', 'test-value');
  });

  it('renders in a list context', () => {
    render(
      <div>
        <div>Item 1</div>
        <Separator data-testid="separator-1" />
        <div>Item 2</div>
        <Separator data-testid="separator-2" />
        <div>Item 3</div>
      </div>
    );
    
    expect(screen.getByTestId('separator-1')).toBeInTheDocument();
    expect(screen.getByTestId('separator-2')).toBeInTheDocument();
  });

  it('renders in a vertical layout', () => {
    render(
      <div className="flex">
        <div>Left</div>
        <Separator orientation="vertical" data-testid="separator" />
        <div>Right</div>
      </div>
    );
    
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
    expect(separator).toHaveClass('h-full');
    expect(separator).toHaveClass('w-[1px]');
  });

  it('can override decorative with explicit false', () => {
    render(<Separator decorative={false} data-testid="separator" />);

    const separator = screen.getByTestId('separator');
    // When not decorative, it should have role="separator"
    expect(separator).toHaveAttribute('role', 'separator');
  });

  it('combines custom className with orientation styles', () => {
    render(
      <Separator 
        orientation="vertical" 
        className="my-custom-class" 
        data-testid="separator" 
      />
    );
    
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('my-custom-class');
    expect(separator).toHaveClass('h-full');
    expect(separator).toHaveClass('w-[1px]');
    expect(separator).toHaveClass('shrink-0');
    expect(separator).toHaveClass('bg-border');
  });
});

