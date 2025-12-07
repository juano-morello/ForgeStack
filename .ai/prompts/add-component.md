# Add Component Prompt Template

## Prompt

```
I need to create a new React component for [COMPONENT_PURPOSE].

Details:
- Component name: [COMPONENT_NAME]
- Location: [DIRECTORY]
- Props: [LIST_PROPS]
- Features: [LIST_FEATURES]
- Includes: [tests/stories/both/none]

Please follow ForgeStack patterns in:
- .ai/conventions.md for naming
- .ai/patterns/react-hook.md if data fetching needed
```

## Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `COMPONENT_PURPOSE` | What the component does | `displaying a member card`, `webhook form` |
| `COMPONENT_NAME` | PascalCase name | `MemberCard`, `WebhookForm` |
| `DIRECTORY` | Where to create | `apps/web/src/components/members/` |
| `PROPS` | Component props | `member: Member`, `onSubmit: (data) => void` |
| `FEATURES` | UI features | `loading state`, `error handling`, `animations` |

## Component Directories

| Type | Directory |
|------|-----------|
| Feature components | `apps/web/src/components/{feature}/` |
| Layout components | `apps/web/src/components/layout/` |
| Shared/reusable | `apps/web/src/components/shared/` |
| UI primitives | `apps/web/src/components/ui/` |
| Shared UI library | `packages/ui/src/components/` |

## Example: Display Component

```
I need to create a new React component for displaying a member card.

Details:
- Component name: MemberCard
- Location: apps/web/src/components/members/
- Props: member: MemberWithUser, onRemove?: () => void, canRemove: boolean
- Features: avatar, role badge, joined date, remove button with confirmation
- Includes: both tests and stories

Please follow ForgeStack patterns.
```

## Example: Form Component

```
I need to create a new React component for webhook endpoint form.

Details:
- Component name: WebhookForm
- Location: apps/web/src/components/webhooks/
- Props: onSubmit: (data: WebhookFormData) => Promise<void>, initialData?: Webhook
- Features: URL validation, event type multi-select, enabled toggle, loading state
- Includes: tests only

Please follow ForgeStack patterns.
```

## Component Template

```typescript
// apps/web/src/components/{feature}/{component-name}.tsx
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface [ComponentName]Props {
  // Required props
  data: DataType;
  // Optional props with defaults
  variant?: 'default' | 'compact';
  // Callbacks
  onAction?: () => void;
}

export function [ComponentName]({
  data,
  variant = 'default',
  onAction,
}: [ComponentName]Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    if (!onAction) return;
    setIsLoading(true);
    try {
      await onAction();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
        <Button onClick={handleAction} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Action'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

## Test Template

```typescript
// apps/web/src/components/{feature}/{component-name}.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { [ComponentName] } from './[component-name]';

const mockData = {
  id: '1',
  name: 'Test Item',
};

describe('[ComponentName]', () => {
  it('renders data correctly', () => {
    render(<[ComponentName] data={mockData} />);
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  it('calls onAction when button clicked', async () => {
    const onAction = vi.fn();
    render(<[ComponentName] data={mockData} onAction={onAction} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onAction).toHaveBeenCalled();
  });
});
```

## Story Template

```typescript
// apps/web/src/components/{feature}/{component-name}.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { [ComponentName] } from './[component-name]';

const meta: Meta<typeof [ComponentName]> = {
  title: 'Components/[Feature]/[ComponentName]',
  component: [ComponentName],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof [ComponentName]>;

export const Default: Story = {
  args: {
    data: { id: '1', name: 'Example' },
  },
};

export const WithAction: Story = {
  args: {
    data: { id: '1', name: 'Example' },
    onAction: () => console.log('Action clicked'),
  },
};
```

## Common UI Components

Import from `@/components/ui/`:
- `Button`, `Card`, `Input`, `Label`, `Select`
- `Dialog`, `DropdownMenu`, `Tabs`
- `Badge`, `Avatar`, `Skeleton`
- `Table`, `Separator`, `ScrollArea`

