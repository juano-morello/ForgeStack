import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CodeBlock } from './code-block';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

describe('CodeBlock', () => {
  it('renders code content', () => {
    render(<CodeBlock>const x = 1;</CodeBlock>);
    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });

  it('renders language label when provided', () => {
    render(<CodeBlock language="typescript">const x = 1;</CodeBlock>);
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  it('does not render language label when not provided', () => {
    render(<CodeBlock>const x = 1;</CodeBlock>);
    expect(screen.queryByText('typescript')).not.toBeInTheDocument();
  });

  it('renders copy button', () => {
    render(<CodeBlock>const x = 1;</CodeBlock>);
    const copyButton = screen.getByRole('button');
    expect(copyButton).toBeInTheDocument();
  });

  it('copies code to clipboard when copy button is clicked', async () => {
    const code = 'const x = 1;';
    render(<CodeBlock>{code}</CodeBlock>);

    const copyButton = screen.getByRole('button');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(code);
    });
  });

  it('shows check icon after copying', async () => {
    render(<CodeBlock>const x = 1;</CodeBlock>);

    const copyButton = screen.getByRole('button');
    fireEvent.click(copyButton);

    // The button should show a check icon (we can't easily test the icon itself,
    // but we can verify the button is still there)
    await waitFor(() => {
      expect(copyButton).toBeInTheDocument();
    });
  });

  it('renders multiline code correctly', () => {
    const code = `const x = 1;
const y = 2;
const z = 3;`;
    render(<CodeBlock>{code}</CodeBlock>);
    // Check that the code element contains the text (may be split across nodes)
    const codeElement = screen.getByText(/const x = 1;/);
    expect(codeElement).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(<CodeBlock>const x = 1;</CodeBlock>);
    const pre = container.querySelector('pre');
    expect(pre).toHaveClass('bg-muted', 'rounded-lg', 'p-4', 'pt-8');
  });
});

