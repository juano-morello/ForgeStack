import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectList } from './project-list';
import type { Project } from '@/types/project';

// Mock hooks
const mockFetchProjects = vi.fn();
const mockDeleteProject = vi.fn();
const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();
let mockUseProjectsReturn = {
  projects: [],
  isLoading: false,
  error: null,
  fetchProjects: mockFetchProjects,
  deleteProject: mockDeleteProject,
};

vi.mock('@/hooks/use-projects', () => ({
  useProjects: () => mockUseProjectsReturn,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));



describe('ProjectList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    mockUseProjectsReturn = {
      projects: [],
      isLoading: false,
      error: null,
      fetchProjects: mockFetchProjects,
      deleteProject: mockDeleteProject,
    };
  });

  it('renders search input', () => {
    render(<ProjectList />);

    const searchInput = screen.getByPlaceholderText('Search projects...');
    expect(searchInput).toBeInTheDocument();
  });

  it('allows typing in search input', async () => {
    const user = userEvent.setup();

    render(<ProjectList />);

    const searchInput = screen.getByPlaceholderText('Search projects...') as HTMLInputElement;

    await user.type(searchInput, 'test');

    expect(searchInput.value).toBe('test');
  });

  it('fetches projects on mount', () => {
    render(<ProjectList />);
    
    expect(mockFetchProjects).toHaveBeenCalled();
  });

  it('shows empty state when no projects', () => {
    render(<ProjectList />);
    
    expect(screen.getByText('No projects found')).toBeInTheDocument();
    expect(screen.getByText('Create your first project to get started.')).toBeInTheDocument();
  });

  it('shows different empty state message when searching', () => {
    // Set search param
    mockSearchParams = new URLSearchParams('search=test');

    render(<ProjectList />);

    expect(screen.getByText('No projects found')).toBeInTheDocument();
    expect(screen.getByText('Try a different search term.')).toBeInTheDocument();
  });

  it('preserves search value from URL on mount', () => {
    mockSearchParams = new URLSearchParams('search=my-project');

    render(<ProjectList />);

    const searchInput = screen.getByPlaceholderText('Search projects...') as HTMLInputElement;
    expect(searchInput.value).toBe('my-project');
  });

  it('shows error message when fetch fails', () => {
    mockUseProjectsReturn = {
      projects: [],
      isLoading: false,
      error: 'Failed to fetch projects',
      fetchProjects: mockFetchProjects,
      deleteProject: mockDeleteProject,
    };

    render(<ProjectList />);

    expect(screen.getByText('Failed to fetch projects')).toBeInTheDocument();
  });

  it('shows loading skeletons when loading', () => {
    mockUseProjectsReturn = {
      projects: [],
      isLoading: true,
      error: null,
      fetchProjects: mockFetchProjects,
      deleteProject: mockDeleteProject,
    };

    render(<ProjectList />);

    // Should show 3 skeleton cards
    const skeletons = screen.getAllByTestId('card-skeleton');
    expect(skeletons).toHaveLength(3);
  });

  it('renders project grid when projects exist', () => {
    const mockProjects: Project[] = [
      {
        id: 'proj-1',
        orgId: 'org-1',
        name: 'Project 1',
        description: 'Description 1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'proj-2',
        orgId: 'org-1',
        name: 'Project 2',
        description: 'Description 2',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    ];

    mockUseProjectsReturn = {
      projects: mockProjects,
      isLoading: false,
      error: null,
      fetchProjects: mockFetchProjects,
      deleteProject: mockDeleteProject,
    };

    render(<ProjectList />);

    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
  });

  it('calls router.push when edit is clicked', async () => {
    const user = userEvent.setup();
    const mockProjects: Project[] = [
      {
        id: 'proj-1',
        orgId: 'org-1',
        name: 'Project 1',
        description: 'Description 1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    mockUseProjectsReturn = {
      projects: mockProjects,
      isLoading: false,
      error: null,
      fetchProjects: mockFetchProjects,
      deleteProject: mockDeleteProject,
    };

    render(<ProjectList />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    expect(mockPush).toHaveBeenCalledWith('/projects/proj-1/edit');
  });

  it('opens delete dialog when delete is clicked', async () => {
    const user = userEvent.setup();
    const mockProjects: Project[] = [
      {
        id: 'proj-1',
        orgId: 'org-1',
        name: 'Project 1',
        description: 'Description 1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    mockUseProjectsReturn = {
      projects: mockProjects,
      isLoading: false,
      error: null,
      fetchProjects: mockFetchProjects,
      deleteProject: mockDeleteProject,
    };

    render(<ProjectList />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    // Dialog should be visible with heading
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Delete Project' })).toBeInTheDocument();
  });

  it('calls deleteProject when delete is confirmed', async () => {
    const user = userEvent.setup();
    mockDeleteProject.mockResolvedValue(undefined);

    const mockProjects: Project[] = [
      {
        id: 'proj-1',
        orgId: 'org-1',
        name: 'Project 1',
        description: 'Description 1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    mockUseProjectsReturn = {
      projects: mockProjects,
      isLoading: false,
      error: null,
      fetchProjects: mockFetchProjects,
      deleteProject: mockDeleteProject,
    };

    render(<ProjectList />);

    // Click delete button on the card
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    // Confirm deletion - the button text is "Delete Project"
    const confirmButton = screen.getByRole('button', { name: /delete project/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteProject).toHaveBeenCalledWith('proj-1');
    });
  });

  it('debounces search input and updates URL', async () => {
    const user = userEvent.setup();

    render(<ProjectList />);

    const searchInput = screen.getByPlaceholderText('Search projects...') as HTMLInputElement;
    await user.type(searchInput, 'test');

    // Wait for debounce (300ms)
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/projects?search=test');
    }, { timeout: 1000 });
  });

  it('clears search param when search is empty', async () => {
    const user = userEvent.setup();

    mockSearchParams = new URLSearchParams('search=test');

    render(<ProjectList />);

    const searchInput = screen.getByPlaceholderText('Search projects...') as HTMLInputElement;

    // Clear the search input
    await user.clear(searchInput);

    // Wait for debounce (300ms)
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/projects?');
    }, { timeout: 1000 });
  });

  it('does not show loading skeletons when projects already exist', () => {
    const mockProjects: Project[] = [
      {
        id: 'proj-1',
        orgId: 'org-1',
        name: 'Project 1',
        description: 'Description 1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    mockUseProjectsReturn = {
      projects: mockProjects,
      isLoading: true, // Still loading but has projects
      error: null,
      fetchProjects: mockFetchProjects,
      deleteProject: mockDeleteProject,
    };

    render(<ProjectList />);

    // Should show projects, not skeletons
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.queryByTestId('card-skeleton')).not.toBeInTheDocument();
  });
});

