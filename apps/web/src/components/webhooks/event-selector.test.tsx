/**
 * Tests for EventSelector Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventSelector } from './event-selector';
import type { WebhookEventType } from '@/types/webhooks';

describe('EventSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all event groups', () => {
    render(<EventSelector selectedEvents={[]} onChange={mockOnChange} />);

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should render all event checkboxes', () => {
    render(<EventSelector selectedEvents={[]} onChange={mockOnChange} />);

    expect(screen.getByText('Project Created')).toBeInTheDocument();
    expect(screen.getByText('Project Updated')).toBeInTheDocument();
    expect(screen.getByText('Project Deleted')).toBeInTheDocument();
    expect(screen.getByText('Member Invited')).toBeInTheDocument();
    expect(screen.getByText('Test Ping')).toBeInTheDocument();
  });

  it('should show selected events as checked', () => {
    const selectedEvents: WebhookEventType[] = ['project.created', 'member.invited'];
    render(<EventSelector selectedEvents={selectedEvents} onChange={mockOnChange} />);

    const projectCreatedCheckbox = screen.getByRole('checkbox', { name: 'Project Created' });
    const memberInvitedCheckbox = screen.getByRole('checkbox', { name: 'Member Invited' });
    const projectUpdatedCheckbox = screen.getByRole('checkbox', { name: 'Project Updated' });

    expect(projectCreatedCheckbox).toBeChecked();
    expect(memberInvitedCheckbox).toBeChecked();
    expect(projectUpdatedCheckbox).not.toBeChecked();
  });

  it('should call onChange when an event is selected', () => {
    render(<EventSelector selectedEvents={[]} onChange={mockOnChange} />);

    const projectCreatedCheckbox = screen.getByLabelText('Project Created');
    fireEvent.click(projectCreatedCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith(['project.created']);
  });

  it('should call onChange when an event is deselected', () => {
    const selectedEvents: WebhookEventType[] = ['project.created', 'project.updated'];
    render(<EventSelector selectedEvents={selectedEvents} onChange={mockOnChange} />);

    const projectCreatedCheckbox = screen.getByLabelText('Project Created');
    fireEvent.click(projectCreatedCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith(['project.updated']);
  });

  it('should select all events in a group when "Select All" is clicked', () => {
    render(<EventSelector selectedEvents={[]} onChange={mockOnChange} />);

    // Find the "Select All" button for the Projects group
    const selectAllButtons = screen.getAllByText('Select All');
    fireEvent.click(selectAllButtons[0]); // Click the first "Select All" (Projects group)

    expect(mockOnChange).toHaveBeenCalledWith([
      'project.created',
      'project.updated',
      'project.deleted',
    ]);
  });

  it('should deselect all events in a group when "Deselect All" is clicked', () => {
    const selectedEvents: WebhookEventType[] = [
      'project.created',
      'project.updated',
      'project.deleted',
    ];
    render(<EventSelector selectedEvents={selectedEvents} onChange={mockOnChange} />);

    // Find the "Deselect All" button for the Projects group
    const deselectAllButton = screen.getByText('Deselect All');
    fireEvent.click(deselectAllButton);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it('should handle multiple groups selected', () => {
    const selectedEvents: WebhookEventType[] = [
      'project.created',
      'project.updated',
      'project.deleted',
      'member.invited',
      'member.joined',
    ];
    render(<EventSelector selectedEvents={selectedEvents} onChange={mockOnChange} />);

    const projectCreatedCheckbox = screen.getByRole('checkbox', { name: 'Project Created' });
    const memberInvitedCheckbox = screen.getByRole('checkbox', { name: 'Member Invited' });

    expect(projectCreatedCheckbox).toBeChecked();
    expect(memberInvitedCheckbox).toBeChecked();
  });
});

