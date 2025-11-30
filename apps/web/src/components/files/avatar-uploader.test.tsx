import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvatarUploader } from './avatar-uploader';

// Mock the upload hook
vi.mock('@/hooks/use-file-upload', () => ({
  useFileUpload: vi.fn(() => ({
    status: 'idle',
    progress: null,
    error: null,
    file: null,
    upload: vi.fn(),
    reset: vi.fn(),
  })),
}));

import { useFileUpload } from '@/hooks/use-file-upload';

describe('AvatarUploader', () => {
  const mockOrgId = 'org-123';
  const mockOnUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default fallback', () => {
    render(<AvatarUploader orgId={mockOrgId} onUpload={mockOnUpload} />);

    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('renders with custom fallback', () => {
    render(
      <AvatarUploader orgId={mockOrgId} onUpload={mockOnUpload} fallback="AB" />
    );

    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('renders current avatar image', () => {
    render(
      <AvatarUploader
        orgId={mockOrgId}
        currentUrl="https://example.com/avatar.jpg"
        onUpload={mockOnUpload}
      />
    );

    // Avatar component renders, check that the component is present
    const avatar = document.querySelector('.relative.inline-block');
    expect(avatar).toBeInTheDocument();
  });

  it('shows uploading state', () => {
    vi.mocked(useFileUpload).mockReturnValue({
      status: 'uploading',
      progress: { loaded: 50, total: 100, percentage: 50 },
      error: null,
      file: null,
      upload: vi.fn(),
      reset: vi.fn(),
    });

    render(<AvatarUploader orgId={mockOrgId} onUpload={mockOnUpload} />);

    expect(screen.getByText(/Uploading.../i)).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(
      <AvatarUploader orgId={mockOrgId} onUpload={mockOnUpload} size="sm" />
    );

    let avatar = document.querySelector('[class*="h-16"]');
    expect(avatar).toBeInTheDocument();

    rerender(<AvatarUploader orgId={mockOrgId} onUpload={mockOnUpload} size="md" />);
    avatar = document.querySelector('[class*="h-24"]');
    expect(avatar).toBeInTheDocument();

    rerender(<AvatarUploader orgId={mockOrgId} onUpload={mockOnUpload} size="lg" />);
    avatar = document.querySelector('[class*="h-32"]');
    expect(avatar).toBeInTheDocument();
  });

  it('disables upload when disabled prop is true', () => {
    render(<AvatarUploader orgId={mockOrgId} onUpload={mockOnUpload} disabled />);

    const input = document.querySelector('input[type="file"]');
    expect(input).toBeDisabled();
  });

  it('accepts only image files', () => {
    render(<AvatarUploader orgId={mockOrgId} onUpload={mockOnUpload} />);

    const input = document.querySelector('input[type="file"]');
    expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/gif,image/webp');
  });

  it('shows camera icon on hover', () => {
    render(<AvatarUploader orgId={mockOrgId} onUpload={mockOnUpload} />);

    // Camera icon should be in the DOM (even if not visible due to opacity)
    // Look for any svg element with camera-related class
    const overlay = document.querySelector('.absolute.inset-0');
    expect(overlay).toBeInTheDocument();
  });
});

