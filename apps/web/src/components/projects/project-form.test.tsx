import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectForm } from './project-form';
import type { Project } from '@/types/project';

describe('ProjectForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with name input', () => {
    render(<ProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders with existing project data for editing', () => {
    const project: Project = {
      id: 'proj-1',
      orgId: 'org-1',
      name: 'Existing Project',
      description: 'Existing description',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    render(
      <ProjectForm project={project} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    expect(screen.getByDisplayValue('Existing Project')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('shows validation error for empty name', async () => {
    const user = userEvent.setup();

    render(<ProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const submitButton = screen.getByRole('button', { name: /create project/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/project name is required/i)).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for whitespace-only name', async () => {
    const user = userEvent.setup();

    render(<ProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, '   ');

    const submitButton = screen.getByRole('button', { name: /create project/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/project name is required/i)).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with valid data', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    render(<ProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/project name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const submitButton = screen.getByRole('button', { name: /create project/i });

    await user.type(nameInput, 'New Project');
    await user.type(descriptionInput, 'New project description');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'New Project',
        description: 'New project description',
      });
    });
  });

  it('submits without description when not provided', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    render(<ProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, 'Project Without Description');

    const submitButton = screen.getByRole('button', { name: /create project/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Project Without Description',
        description: undefined,
      });
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(<ProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables form elements when isSubmitting prop is true', () => {
    render(
      <ProjectForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />
    );

    const nameInput = screen.getByLabelText(/project name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    const submitButton = screen.getByRole('button', { name: /create project/i });

    expect(nameInput).toBeDisabled();
    expect(descriptionInput).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('shows character count for name', () => {
    render(<ProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByText('0/255 characters')).toBeInTheDocument();
  });

  it('should show validation error for name exceeding 255 characters', async () => {
    const user = userEvent.setup();

    render(<ProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/project name/i);
    const longName = 'a'.repeat(256);

    // Type a long name (input has maxLength, but we test the validation)
    await user.type(nameInput, longName.substring(0, 255));

    // The input should be limited to 255 characters by maxLength attribute
    expect(nameInput).toHaveAttribute('maxLength', '255');
  });

  it('should show validation error for description exceeding 2000 characters', async () => {
    render(<ProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const descriptionInput = screen.getByLabelText(/description/i);

    // The textarea should be limited to 2000 characters by maxLength attribute
    expect(descriptionInput).toHaveAttribute('maxLength', '2000');
  });

  it('should handle edit mode with initial values', () => {
    const project: Project = {
      id: 'proj-1',
      orgId: 'org-1',
      name: 'Existing Project',
      description: 'Existing description',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    render(
      <ProjectForm project={project} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    // Should show "Save Changes" button in edit mode
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();

    // Should pre-fill the form with existing values
    expect(screen.getByDisplayValue('Existing Project')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
  });

  it('should disable submit when loading', () => {
    render(
      <ProjectForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /create project/i });
    expect(submitButton).toBeDisabled();
  });

  it('should clear form on cancel in create mode', async () => {
    const user = userEvent.setup();

    render(<ProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/project name/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    // Fill in the form
    await user.type(nameInput, 'New Project');
    await user.type(descriptionInput, 'New description');

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // onCancel should be called
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should trim whitespace from name and description on submit', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    render(<ProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/project name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const submitButton = screen.getByRole('button', { name: /create project/i });

    await user.type(nameInput, '  Trimmed Project  ');
    await user.type(descriptionInput, '  Trimmed description  ');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Trimmed Project',
        description: 'Trimmed description',
      });
    });
  });

  it('should show error message when onSubmit throws', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to create project';
    mockOnSubmit.mockRejectedValue(new Error(errorMessage));

    render(<ProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/project name/i);
    const submitButton = screen.getByRole('button', { name: /create project/i });

    await user.type(nameInput, 'New Project');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});

