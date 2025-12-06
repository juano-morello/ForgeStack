import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteProjectDialog } from './delete-project-dialog';
import type { Project } from '@/types/project';

describe('DeleteProjectDialog', () => {
  const mockProject: Project = {
    id: 'proj-1',
    orgId: 'org-1',
    name: 'Test Project',
    description: 'Test Description',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when project is null', () => {
    const { container } = render(
      <DeleteProjectDialog
        project={null}
        isOpen={true}
        isDeleting={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders dialog when project is provided and isOpen is true', () => {
    render(
      <DeleteProjectDialog
        project={mockProject}
        isOpen={true}
        isDeleting={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Delete Project' })).toBeInTheDocument();
  });

  it('displays project name in description', () => {
    render(
      <DeleteProjectDialog
        project={mockProject}
        isOpen={true}
        isDeleting={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
    expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <DeleteProjectDialog
        project={mockProject}
        isOpen={true}
        isDeleting={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when delete button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <DeleteProjectDialog
        project={mockProject}
        isOpen={true}
        isDeleting={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete project/i });
    await user.click(deleteButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when isDeleting is true', () => {
    render(
      <DeleteProjectDialog
        project={mockProject}
        isOpen={true}
        isDeleting={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    const deleteButton = screen.getByRole('button', { name: /delete project/i });

    expect(cancelButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });

  it('shows loading spinner when isDeleting is true', () => {
    render(
      <DeleteProjectDialog
        project={mockProject}
        isOpen={true}
        isDeleting={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    // Check for the Loader2 icon with animate-spin class
    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <DeleteProjectDialog
        project={mockProject}
        isOpen={false}
        isDeleting={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders alert triangle icon', () => {
    render(
      <DeleteProjectDialog
        project={mockProject}
        isOpen={true}
        isDeleting={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    // Check for the AlertTriangle icon
    const alertIcon = document.querySelector('.text-destructive');
    expect(alertIcon).toBeInTheDocument();
  });

  it('calls onClose when dialog is closed via onOpenChange', async () => {
    const user = userEvent.setup();

    render(
      <DeleteProjectDialog
        project={mockProject}
        isOpen={true}
        isDeleting={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    // Click the X button to close the dialog
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when dialog is closed while deleting', async () => {
    const user = userEvent.setup();

    render(
      <DeleteProjectDialog
        project={mockProject}
        isOpen={true}
        isDeleting={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    // Try to click the X button to close the dialog
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    // onClose should not be called because isDeleting is true
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});

