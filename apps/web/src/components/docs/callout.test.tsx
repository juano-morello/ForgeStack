import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Callout } from './callout';

describe('Callout', () => {
  it('renders with default info type', () => {
    render(<Callout>Test content</Callout>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders with title', () => {
    render(<Callout title="Test Title">Test content</Callout>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders info type with correct styling', () => {
    const { container } = render(<Callout type="info">Info content</Callout>);
    const callout = container.querySelector('.bg-blue-500\\/10');
    expect(callout).toBeInTheDocument();
  });

  it('renders warning type with correct styling', () => {
    const { container } = render(
      <Callout type="warning">Warning content</Callout>
    );
    const callout = container.querySelector('.bg-yellow-500\\/10');
    expect(callout).toBeInTheDocument();
  });

  it('renders error type with correct styling', () => {
    const { container } = render(<Callout type="error">Error content</Callout>);
    const callout = container.querySelector('.bg-red-500\\/10');
    expect(callout).toBeInTheDocument();
  });

  it('renders success type with correct styling', () => {
    const { container } = render(
      <Callout type="success">Success content</Callout>
    );
    const callout = container.querySelector('.bg-green-500\\/10');
    expect(callout).toBeInTheDocument();
  });

  it('renders without title', () => {
    render(<Callout type="info">Content only</Callout>);
    expect(screen.getByText('Content only')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders children correctly', () => {
    render(
      <Callout>
        <p>Paragraph content</p>
        <ul>
          <li>List item</li>
        </ul>
      </Callout>
    );
    expect(screen.getByText('Paragraph content')).toBeInTheDocument();
    expect(screen.getByText('List item')).toBeInTheDocument();
  });
});

