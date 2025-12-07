# Add Page Prompt Template

## Prompt

```
I need to create a new page for [PAGE_PURPOSE].

Details:
- Route: [ROUTE_PATH]
- Layout: [auth/protected/marketing/docs]
- Data requirements: [LIST_DATA_NEEDED]
- Features: [LIST_FEATURES]

Please follow ForgeStack patterns in:
- .ai/architecture.md for app structure
- .ai/patterns/react-hook.md for data fetching
- .ai/conventions.md for naming
```

## Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PAGE_PURPOSE` | What the page does | `viewing project details`, `managing API keys` |
| `ROUTE_PATH` | Next.js route | `/projects/[id]`, `/settings/api-keys` |
| `LAYOUT` | Route group | `auth`, `protected`, `marketing`, `docs` |
| `DATA_NEEDED` | API data to fetch | `project by ID`, `list of API keys` |
| `FEATURES` | UI features | `edit button`, `delete confirmation`, `pagination` |

## Route Group Reference

| Layout | Directory | Auth Required | Has Org Context |
|--------|-----------|---------------|-----------------|
| `auth` | `(auth)/` | No | No |
| `protected` | `(protected)/` | Yes | Yes |
| `marketing` | `(marketing)/` | No | No |
| `docs` | `docs/` | No | No |
| `onboarding` | `(onboarding)/` | Yes | No |
| `super-admin` | `(super-admin)/` | Yes (super admin) | No |

## File Structure

```
apps/web/src/app/(protected)/[feature]/
├── page.tsx              # Main page component
├── loading.tsx           # Loading state (optional)
├── error.tsx             # Error boundary (optional)
└── [id]/
    ├── page.tsx          # Detail page
    └── edit/
        └── page.tsx      # Edit page
```

## Example: Detail Page

```
I need to create a new page for viewing project details.

Details:
- Route: /projects/[id]
- Layout: protected
- Data requirements: project by ID, recent activities for project
- Features: edit button (owner only), delete button with confirmation, activity timeline

Please follow ForgeStack patterns.
```

## Example: List Page

```
I need to create a new page for managing API keys.

Details:
- Route: /settings/api-keys
- Layout: protected
- Data requirements: list of API keys for current org
- Features: create new key dialog, revoke key button, copy key to clipboard, search/filter

Please follow ForgeStack patterns.
```

## Page Template

```typescript
// apps/web/src/app/(protected)/[feature]/page.tsx
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { use[Feature] } from '@/hooks/use-[feature]';
import { useOrgContext } from '@/components/providers/org-provider';

export default function [Feature]Page() {
  const { currentOrg } = useOrgContext();
  const { data, isLoading, error } = use[Feature]({
    orgId: currentOrg?.id || '',
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No [items] yet"
        description="Get started by creating your first [item]."
        actionLabel="Create [Item]"
        actionHref="/[feature]/new"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="[Feature]"
        description="Manage your [items]"
        action={{ label: 'Create [Item]', href: '/[feature]/new' }}
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map((item) => (
          <Card key={item.id}>
            {/* Card content */}
          </Card>
        ))}
      </div>
    </div>
  );
}
```

## Required Imports

```typescript
// Common page imports
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { useOrgContext } from '@/components/providers/org-provider';
import { useToast } from '@/components/ui/use-toast';
```

