# Phase 4B: Design System (packages/ui)

## Context

ForgeStack needs a shared UI component library in `packages/ui` that can be consumed by multiple applications:
- `apps/web` (Next.js frontend) – current primary consumer
- Future apps: admin portal, marketing site, docs site

Currently, shadcn/ui components live in `apps/web/src/components/ui`. This spec defines the migration to a shared package with enhanced components, design tokens, and Storybook documentation.

### Goals

- **Single Source of Truth**: All UI components in one package
- **Consistent Design Language**: Shared tokens for colors, typography, spacing
- **Developer Experience**: Storybook for visual testing and documentation
- **Type Safety**: Full TypeScript support with proper exports
- **Tree Shaking**: Only import what you use

### Tech Stack

- React 19 + TypeScript
- Tailwind CSS v4 (shared config)
- shadcn/ui (Radix primitives + styling)
- tsup (bundling)
- Storybook 8 (documentation & visual testing)
- class-variance-authority (CVA) for variants

---

## User Story

**As a** ForgeStack developer  
**I want** a centralized UI component library with consistent styling  
**So that** I can build features faster with reusable, documented components

---

## Acceptance Criteria

### Package Setup
- [ ] `packages/ui` initialized with proper `package.json` exports
- [ ] TypeScript config extends monorepo base with JSX support
- [ ] tsup configured for ESM/CJS dual build with type definitions
- [ ] Tailwind CSS config exported for consumers to extend
- [ ] Build completes without errors: `pnpm --filter @forgestack/ui build`

### Core Components (shadcn/ui base)
All components must include: TypeScript types, variants, accessibility (ARIA), dark mode support

#### Layout Components
- [ ] `Container` – responsive max-width wrapper
- [ ] `Card` – surface container with header/content/footer slots
- [ ] `Skeleton` – loading placeholder with animation
- [ ] `Separator` – horizontal/vertical divider

#### Form Components
- [ ] `Button` – variants: default, secondary, destructive, outline, ghost, link; sizes: sm, default, lg
- [ ] `Input` – text input with error state support
- [ ] `Label` – form label with required indicator
- [ ] `Textarea` – multi-line text input
- [ ] `Select` – dropdown selector with search option
- [ ] `Checkbox` – with indeterminate state
- [ ] `Switch` – toggle control
- [ ] `RadioGroup` – radio button group

#### Feedback Components
- [ ] `Alert` – variants: default, info, success, warning, destructive
- [ ] `Toast` – notification system (sonner integration)
- [ ] `Badge` – status indicators with variants
- [ ] `Progress` – linear progress bar

#### Overlay Components
- [ ] `Dialog` – modal with accessible focus trap
- [ ] `Sheet` – slide-out panel (left/right/top/bottom)
- [ ] `Popover` – positioned popup content
- [ ] `Tooltip` – hover hint
- [ ] `DropdownMenu` – context menu with keyboard navigation

#### Navigation Components
- [ ] `Tabs` – tabbed interface
- [ ] `Breadcrumb` – navigation path
- [ ] `Pagination` – page controls

#### Data Display
- [ ] `Table` – basic table with header/body/row/cell
- [ ] `Avatar` – user image with fallback initials
- [ ] `DataTable` – enhanced table with sorting, filtering, pagination (TanStack Table)

### ForgeStack Compound Components
- [ ] `PageHeader` – title + description + action buttons slot
- [ ] `EmptyState` – icon + title + description + CTA button
- [ ] `StatCard` – metric value + label + optional trend indicator
- [ ] `FormField` – label + input + error message + help text wrapper
- [ ] `ConfirmDialog` – confirmation modal with customizable title/message/actions

### Design Tokens
- [ ] `colors.ts` – semantic color palette (primary, secondary, success, warning, error, neutral)
- [ ] `typography.ts` – font sizes, weights, line heights
- [ ] `spacing.ts` – consistent spacing scale (4px base)
- [ ] `radius.ts` – border radius tokens
- [ ] `shadows.ts` – elevation shadows
- [ ] `animations.ts` – transition/animation presets
- [ ] Tokens exported as Tailwind plugin for consumers

### Storybook Configuration
- [ ] Storybook 8 installed and configured
- [ ] All components have stories with:
  - Default story
  - All variants/sizes demonstrated
  - Interactive controls (args)
  - Accessibility addon enabled
- [ ] Dark mode toggle in Storybook toolbar
- [ ] Build static Storybook: `pnpm --filter @forgestack/ui build-storybook`

### Consumer Integration
- [ ] `apps/web` can import from `@forgestack/ui`
- [ ] Tailwind config preset exported and consumed by apps
- [ ] Migration guide documented for moving components from `apps/web/src/components/ui`

---

## Tasks

### 1. Package Configuration
- [ ] 1.1 Update `packages/ui/package.json` with dependencies (React, Radix, CVA, clsx, tailwind-merge)
- [ ] 1.2 Add tsup as build tool with proper config
- [ ] 1.3 Configure TypeScript for React JSX
- [ ] 1.4 Set up path aliases and exports map
- [ ] 1.5 Add peer dependencies for React, React DOM

### 2. Design Tokens Setup
- [ ] 2.1 Create `src/tokens/colors.ts` with semantic palette
- [ ] 2.2 Create `src/tokens/typography.ts` with scale
- [ ] 2.3 Create `src/tokens/spacing.ts` with spacing scale
- [ ] 2.4 Create `src/tokens/radius.ts` with border radius values
- [ ] 2.5 Create `src/tokens/shadows.ts` with elevation levels
- [ ] 2.6 Create `src/tokens/animations.ts` with transitions
- [ ] 2.7 Create `src/tokens/index.ts` barrel export
- [ ] 2.8 Create Tailwind preset exporting tokens

### 3. Utility Functions
- [ ] 3.1 Create `src/lib/utils.ts` with `cn()` helper (clsx + tailwind-merge)
- [ ] 3.2 Create `src/lib/create-context.ts` for compound components

### 4. Core Components – Layout
- [ ] 4.1 Migrate/create `Container` component
- [ ] 4.2 Migrate/create `Card` component with CardHeader, CardContent, CardFooter
- [ ] 4.3 Migrate/create `Skeleton` component
- [ ] 4.4 Migrate/create `Separator` component

### 5. Core Components – Forms
- [ ] 5.1 Migrate/create `Button` with CVA variants
- [ ] 5.2 Migrate/create `Input` component
- [ ] 5.3 Migrate/create `Label` component
- [ ] 5.4 Migrate/create `Textarea` component
- [ ] 5.5 Migrate/create `Select` component (Radix-based)
- [ ] 5.6 Migrate/create `Checkbox` component
- [ ] 5.7 Migrate/create `Switch` component
- [ ] 5.8 Create `RadioGroup` component

### 6. Core Components – Feedback
- [ ] 6.1 Migrate/create `Alert` component with variants
- [ ] 6.2 Migrate/create `Toast` component (sonner wrapper)
- [ ] 6.3 Migrate/create `Badge` component
- [ ] 6.4 Migrate/create `Progress` component

### 7. Core Components – Overlays
- [ ] 7.1 Migrate/create `Dialog` component
- [ ] 7.2 Migrate/create `Sheet` component
- [ ] 7.3 Create `Popover` component
- [ ] 7.4 Create `Tooltip` component
- [ ] 7.5 Migrate/create `DropdownMenu` component

### 8. Core Components – Navigation
- [ ] 8.1 Migrate/create `Tabs` component
- [ ] 8.2 Create `Breadcrumb` component
- [ ] 8.3 Create `Pagination` component

### 9. Core Components – Data Display
- [ ] 9.1 Migrate/create `Table` primitives
- [ ] 9.2 Migrate/create `Avatar` component
- [ ] 9.3 Create `DataTable` with TanStack Table integration

### 10. ForgeStack Compound Components
- [ ] 10.1 Create `PageHeader` component with title/description/actions
- [ ] 10.2 Create `EmptyState` component with icon/title/description/action
- [ ] 10.3 Create `StatCard` component with value/label/trend
- [ ] 10.4 Create `FormField` wrapper component
- [ ] 10.5 Create `ConfirmDialog` component

### 11. Storybook Setup
- [ ] 11.1 Install Storybook 8 with React/Vite builder
- [ ] 11.2 Configure `.storybook/main.ts` for TypeScript + Tailwind
- [ ] 11.3 Configure `.storybook/preview.ts` with global styles
- [ ] 11.4 Add dark mode toggle addon
- [ ] 11.5 Add accessibility addon
- [ ] 11.6 Create stories for all Layout components
- [ ] 11.7 Create stories for all Form components
- [ ] 11.8 Create stories for all Feedback components
- [ ] 11.9 Create stories for all Overlay components
- [ ] 11.10 Create stories for all Navigation components
- [ ] 11.11 Create stories for all Data Display components
- [ ] 11.12 Create stories for ForgeStack compound components

### 12. Consumer Integration & Migration
- [ ] 12.1 Export Tailwind preset from `@forgestack/ui/tailwind`
- [ ] 12.2 Update `apps/web/tailwind.config.ts` to use preset
- [ ] 12.3 Update `apps/web` imports to use `@forgestack/ui`
- [ ] 12.4 Remove migrated components from `apps/web/src/components/ui`
- [ ] 12.5 Verify all existing pages work with new imports
- [ ] 12.6 Document migration steps in README

---

## Test Plan

### Unit Tests
- [ ] Button renders with correct variants and sizes
- [ ] Input handles controlled/uncontrolled state
- [ ] Form components propagate accessibility attributes
- [ ] Dialog traps focus correctly
- [ ] Toast notifications appear and auto-dismiss
- [ ] DataTable sorting works correctly
- [ ] DataTable filtering works correctly
- [ ] DataTable pagination works correctly

### Visual Regression (Storybook)
- [ ] All component stories render without console errors
- [ ] Dark mode styling applied correctly in all stories
- [ ] Components responsive at mobile/tablet/desktop viewports
- [ ] No accessibility violations (a11y addon)

### Integration Tests (apps/web)
- [ ] Login form renders with UI package components
- [ ] Dashboard stats cards display correctly
- [ ] Project table with DataTable works
- [ ] Organization selector dropdown works
- [ ] Toast notifications work in protected routes
- [ ] All dialogs (create, edit, delete) function correctly

### Build Verification
- [ ] `pnpm --filter @forgestack/ui build` completes
- [ ] Generated types are correct in `dist/`
- [ ] ESM and CJS builds both work
- [ ] `pnpm --filter @forgestack/ui build-storybook` completes
- [ ] Tree-shaking works (only used components bundled)

---

## File Structure

```
packages/ui/
├── .storybook/
│   ├── main.ts                 # Storybook config
│   └── preview.ts              # Global decorators & styles
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── container.tsx
│   │   │   ├── card.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── separator.tsx
│   │   │   └── index.ts
│   │   ├── forms/
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── select.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── radio-group.tsx
│   │   │   └── index.ts
│   │   ├── feedback/
│   │   │   ├── alert.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── progress.tsx
│   │   │   └── index.ts
│   │   ├── overlays/
│   │   │   ├── dialog.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── index.ts
│   │   ├── navigation/
│   │   │   ├── tabs.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── pagination.tsx
│   │   │   └── index.ts
│   │   ├── data-display/
│   │   │   ├── table.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── data-table.tsx
│   │   │   └── index.ts
│   │   ├── compound/
│   │   │   ├── page-header.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── stat-card.tsx
│   │   │   ├── form-field.tsx
│   │   │   ├── confirm-dialog.tsx
│   │   │   └── index.ts
│   │   └── index.ts            # Barrel export all components
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   ├── radius.ts
│   │   ├── shadows.ts
│   │   ├── animations.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── utils.ts            # cn() helper
│   │   └── create-context.ts   # Compound component helper
│   ├── tailwind/
│   │   └── preset.ts           # Tailwind preset with tokens
│   ├── stories/                # Storybook stories (colocated or here)
│   │   ├── Button.stories.tsx
│   │   ├── Card.stories.tsx
│   │   └── ...
│   └── index.ts                # Main entry point
├── tailwind.config.ts          # Package's Tailwind config
├── tsup.config.ts              # Build configuration
├── tsconfig.json
├── package.json
└── README.md                   # Usage & migration guide
```

---

## Dependencies

### Production
```json
{
  "@radix-ui/react-checkbox": "^1.x",
  "@radix-ui/react-dialog": "^1.x",
  "@radix-ui/react-dropdown-menu": "^2.x",
  "@radix-ui/react-label": "^2.x",
  "@radix-ui/react-popover": "^1.x",
  "@radix-ui/react-progress": "^1.x",
  "@radix-ui/react-select": "^2.x",
  "@radix-ui/react-separator": "^1.x",
  "@radix-ui/react-switch": "^1.x",
  "@radix-ui/react-tabs": "^1.x",
  "@radix-ui/react-tooltip": "^1.x",
  "@radix-ui/react-radio-group": "^1.x",
  "@tanstack/react-table": "^8.x",
  "class-variance-authority": "^0.7.x",
  "clsx": "^2.x",
  "lucide-react": "^0.x",
  "sonner": "^1.x",
  "tailwind-merge": "^2.x"
}
```

### Peer Dependencies
```json
{
  "react": "^19.x",
  "react-dom": "^19.x",
  "tailwindcss": "^4.x"
}
```

### Dev Dependencies
```json
{
  "@storybook/addon-a11y": "^8.x",
  "@storybook/addon-essentials": "^8.x",
  "@storybook/react": "^8.x",
  "@storybook/react-vite": "^8.x",
  "storybook": "^8.x",
  "tsup": "^8.x",
  "typescript": "^5.x",
  "vite": "^6.x"
}
```

---

## Package.json Exports

```json
{
  "name": "@forgestack/ui",
  "version": "0.1.0",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./components/*": {
      "types": "./dist/components/*/index.d.ts",
      "import": "./dist/components/*/index.mjs",
      "require": "./dist/components/*/index.js"
    },
    "./tokens": {
      "types": "./dist/tokens/index.d.ts",
      "import": "./dist/tokens/index.mjs",
      "require": "./dist/tokens/index.js"
    },
    "./tailwind": {
      "types": "./dist/tailwind/preset.d.ts",
      "import": "./dist/tailwind/preset.mjs",
      "require": "./dist/tailwind/preset.js"
    }
  }
}
```

---

## Design Tokens Reference

### Colors
```typescript
// src/tokens/colors.ts
export const colors = {
  primary: {
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe',
    300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', // DEFAULT
    600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a',
  },
  secondary: { /* slate scale */ },
  success: { /* emerald scale */ },
  warning: { /* amber scale */ },
  error: { /* red scale */ },
  neutral: { /* gray scale */ },
};
```

### Typography
```typescript
// src/tokens/typography.ts
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
```

---

## Migration Guide (for apps/web)

### Step 1: Update Tailwind Config
```typescript
// apps/web/tailwind.config.ts
import uiPreset from '@forgestack/ui/tailwind';

export default {
  presets: [uiPreset],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}', // Include UI package
  ],
};
```

### Step 2: Update Imports
```typescript
// Before
import { Button } from '@/components/ui/button';

// After
import { Button } from '@forgestack/ui';
// or
import { Button } from '@forgestack/ui/components/forms';
```

### Step 3: Remove Migrated Files
After verifying imports work, delete the corresponding files from `apps/web/src/components/ui/`.

---

## Notes

- **Incremental Migration**: Components can be migrated one at a time. Apps can import from both locations during transition.
- **Breaking Changes**: Compound components (PageHeader, etc.) are new – no migration needed.
- **Radix Primitives**: All interactive components use Radix UI for accessibility.
- **CSS Variables**: Design tokens generate CSS custom properties for runtime theming.
- **Bundle Size**: tsup tree-shakes unused components. Monitor bundle impact.
- **Storybook CI**: Consider adding Storybook visual tests to CI pipeline.

---

*Spec created for Phase 4B: Design System – see also `epic-ui/frontend-redesign.md` for app-level UI implementation.*

