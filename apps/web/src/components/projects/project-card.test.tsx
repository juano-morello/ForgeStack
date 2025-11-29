import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectCard } from './project-card';
import type { Project } from '@/types/project';

const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  orgId: 'org-1',
  name: 'Test Project',
  description: 'A test project description',
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  ...overrides,
});

describe('ProjectCard', () => {
  it('renders project name and description', () => {
    const project = createMockProject({
      name: 'My Awesome Project',
      description: 'This is a great project',
    });

    render(<ProjectCard project={project} />);

    expect(screen.getByText('My Awesome Project')).toBeInTheDocument();
    expect(screen.getByText('This is a great project')).toBeInTheDocument();
  });

  it('renders project without description', () => {
    const project = createMockProject({
      name: 'No Description Project',
      description: null,
    });

    render(<ProjectCard project={project} />);

    expect(screen.getByText('No Description Project')).toBeInTheDocument();
    // Should not crash when description is null
  });

  it('renders project link correctly', () => {
    const project = createMockProject({ id: 'proj-123' });

    render(<ProjectCard project={project} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/projects/proj-123');
  });

  it('shows created and updated dates', () => {
    const project = createMockProject({
      createdAt: '2024-01-15T12:00:00.000Z',
      updatedAt: '2024-02-20T12:00:00.000Z',
    });

    render(<ProjectCard project={project} />);

    // Check for the presence of "Created" and "Updated" text
    expect(screen.getByText(/created/i)).toBeInTheDocument();
    expect(screen.getByText(/updated/i)).toBeInTheDocument();
  });

  it('does not show updated date if same as created', () => {
    const sameDate = '2024-01-15T12:00:00.000Z';
    const project = createMockProject({
      createdAt: sameDate,
      updatedAt: sameDate,
    });

    render(<ProjectCard project={project} />);

    // "Created" should be present but "Updated" should not
    expect(screen.getByText(/created/i)).toBeInTheDocument();
    expect(screen.queryByText(/updated/i)).not.toBeInTheDocument();
  });

  it('edit button calls onEdit handler', async () => {
    const user = userEvent.setup();
    const project = createMockProject();
    const onEdit = vi.fn();

    render(<ProjectCard project={project} onEdit={onEdit} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(project);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('delete button calls onDelete handler', async () => {
    const user = userEvent.setup();
    const project = createMockProject();
    const onDelete = vi.fn();

    render(<ProjectCard project={project} onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(project);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('does not render edit button when onEdit not provided', () => {
    const project = createMockProject();

    render(<ProjectCard project={project} onDelete={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('does not render delete button when onDelete not provided', () => {
    const project = createMockProject();

    render(<ProjectCard project={project} onEdit={vi.fn()} />);

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });
});

