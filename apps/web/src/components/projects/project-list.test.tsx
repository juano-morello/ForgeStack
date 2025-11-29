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

const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  orgId: 'org-1',
  name: 'Test Project',
  description: 'A test project description',
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  ...overrides,
});

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
});

