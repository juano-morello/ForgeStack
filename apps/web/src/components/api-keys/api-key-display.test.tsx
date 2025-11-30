/**
 * Tests for ApiKeyDisplay Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiKeyDisplay } from './api-key-display';

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('ApiKeyDisplay', () => {
  const mockApiKey = 'fsk_live_abc123def456ghi789jkl012mno345pq';
  const mockKeyName = 'Test API Key';

  it('should render the API key and key name', () => {
    render(<ApiKeyDisplay apiKey={mockApiKey} keyName={mockKeyName} />);
    
    expect(screen.getByText(mockApiKey)).toBeInTheDocument();
    expect(screen.getByText(/API Key for "Test API Key"/)).toBeInTheDocument();
  });

  it('should show warning alert', () => {
    render(<ApiKeyDisplay apiKey={mockApiKey} keyName={mockKeyName} />);
    
    expect(screen.getByText(/This key will only be shown once/)).toBeInTheDocument();
  });

  it('should show usage instructions', () => {
    render(<ApiKeyDisplay apiKey={mockApiKey} keyName={mockKeyName} />);
    
    expect(screen.getByText(/How to use this key:/)).toBeInTheDocument();
    expect(screen.getByText(/X-API-Key/)).toBeInTheDocument();
    expect(screen.getByText(/Never commit it to version control/)).toBeInTheDocument();
  });

  it('should copy API key to clipboard when copy button is clicked', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(<ApiKeyDisplay apiKey={mockApiKey} keyName={mockKeyName} />);
    
    const copyButton = screen.getByRole('button', { name: /copy api key/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockApiKey);
    });
  });

  it('should show check icon after successful copy', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(<ApiKeyDisplay apiKey={mockApiKey} keyName={mockKeyName} />);
    
    const copyButton = screen.getByRole('button', { name: /copy api key/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(copyButton.querySelector('.text-green-600')).toBeInTheDocument();
    });
  });
});

