'use client';

/**
 * Event Selector Component
 *
 * Grouped checkboxes for selecting webhook events.
 */

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { EVENT_GROUPS, EVENT_LABELS, EVENT_GROUP_LABELS, type WebhookEventType } from '@/lib/webhook-constants';

interface EventSelectorProps {
  selectedEvents: WebhookEventType[];
  onChange: (events: WebhookEventType[]) => void;
}

export function EventSelector({ selectedEvents, onChange }: EventSelectorProps) {
  const handleEventToggle = (event: WebhookEventType, checked: boolean) => {
    if (checked) {
      onChange([...selectedEvents, event]);
    } else {
      onChange(selectedEvents.filter((e) => e !== event));
    }
  };

  const handleGroupToggle = (groupEvents: WebhookEventType[], checked: boolean) => {
    if (checked) {
      // Add all events from this group that aren't already selected
      const newEvents = [...selectedEvents];
      groupEvents.forEach((event) => {
        if (!newEvents.includes(event)) {
          newEvents.push(event);
        }
      });
      onChange(newEvents);
    } else {
      // Remove all events from this group
      onChange(selectedEvents.filter((e) => !groupEvents.includes(e)));
    }
  };

  const isGroupSelected = (groupEvents: WebhookEventType[]) => {
    return groupEvents.every((event) => selectedEvents.includes(event));
  };

  return (
    <div className="space-y-6">
      {Object.entries(EVENT_GROUPS).map(([groupKey, groupEvents]) => {
        const isSelected = isGroupSelected(groupEvents);

        return (
          <div key={groupKey} className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">{EVENT_GROUP_LABELS[groupKey as keyof typeof EVENT_GROUPS]}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleGroupToggle(groupEvents, !isSelected)}
              >
                {isSelected ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="space-y-2 pl-4">
              {groupEvents.map((event) => (
                <div key={event} className="flex items-center space-x-2">
                  <Checkbox
                    id={event}
                    checked={selectedEvents.includes(event)}
                    onCheckedChange={(checked) => handleEventToggle(event, checked as boolean)}
                  />
                  <Label
                    htmlFor={event}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {EVENT_LABELS[event]}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

