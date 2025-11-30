import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditLogFilters } from './audit-log-filters';

describe('AuditLogFilters', () => {
  const mockOnFiltersChange = vi.fn();

  it('renders all filter inputs', () => {
    render(<AuditLogFilters filters={{}} onFiltersChange={mockOnFiltersChange} />);

    expect(screen.getByLabelText('Action')).toBeInTheDocument();
    expect(screen.getByLabelText('Resource Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Actor Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Date From')).toBeInTheDocument();
    expect(screen.getByLabelText('Date To')).toBeInTheDocument();
  });

  it('displays current filter values', () => {
    const filters = {
      action: 'created',
      resourceType: 'project',
      actorEmail: 'test@example.com',
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31',
    };

    render(<AuditLogFilters filters={filters} onFiltersChange={mockOnFiltersChange} />);

    const emailInput = screen.getByLabelText('Actor Email') as HTMLInputElement;
    expect(emailInput.value).toBe('test@example.com');

    const dateFromInput = screen.getByLabelText('Date From') as HTMLInputElement;
    expect(dateFromInput.value).toBe('2024-01-01');

    const dateToInput = screen.getByLabelText('Date To') as HTMLInputElement;
    expect(dateToInput.value).toBe('2024-01-31');
  });

  it('calls onFiltersChange when Apply Filters is clicked', () => {
    render(<AuditLogFilters filters={{}} onFiltersChange={mockOnFiltersChange} />);

    const emailInput = screen.getByLabelText('Actor Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const applyButton = screen.getByText('Apply Filters');
    fireEvent.click(applyButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      actorEmail: 'test@example.com',
    });
  });

  it('shows Clear button when filters are active', () => {
    const filters = { action: 'created' };
    render(<AuditLogFilters filters={filters} onFiltersChange={mockOnFiltersChange} />);

    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('does not show Clear button when no filters are active', () => {
    render(<AuditLogFilters filters={{}} onFiltersChange={mockOnFiltersChange} />);

    expect(screen.queryByText('Clear')).not.toBeInTheDocument();
  });

  it('clears all filters when Clear is clicked', () => {
    const filters = {
      action: 'created',
      resourceType: 'project',
      actorEmail: 'test@example.com',
    };

    render(<AuditLogFilters filters={filters} onFiltersChange={mockOnFiltersChange} />);

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({});
  });
});

