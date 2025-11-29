# Frontend UI Redesign Specification

## Overview

This specification defines the complete frontend UI redesign for the ForgeStack application. The current UI is broken and requires a complete overhaul to establish a modern, maintainable design system.

### Goals

- **Modern, Clean, Techy Aesthetic**: Professional appearance that conveys technical competence
- **shadcn/ui Component Library Integration**: Leverage pre-built, accessible components
- **Mobile-First Responsive Design**: Design for mobile first, then enhance for larger screens
- **Dark/Light Mode Support**: Full theme support with system preference detection
- **WCAG AA Compliance**: Ensure accessible contrast ratios and keyboard navigation

### Technology Stack

- Next.js 16 App Router
- Tailwind CSS v4
- shadcn/ui component library
- next-themes for dark mode
- React Hook Form + Zod for form validation

---

## Design System

### Color Palette

```
Primary Colors:
  blue-50:  #eff6ff
  blue-100: #dbeafe
  blue-200: #bfdbfe
  blue-300: #93c5fd
  blue-400: #60a5fa
  blue-500: #3b82f6  (PRIMARY)
  blue-600: #2563eb
  blue-700: #1d4ed8
  blue-800: #1e40af
  blue-900: #1e3a8a

Secondary Colors:
  slate-50:  #f8fafc
  slate-100: #f1f5f9
  slate-200: #e2e8f0
  slate-300: #cbd5e1
  slate-400: #94a3b8
  slate-500: #64748b
  slate-600: #475569
  slate-700: #334155
  slate-800: #1e293b
  slate-900: #0f172a
  slate-950: #020617

Accent Colors:
  violet-500: #8b5cf6  (highlights, links, interactive elements)
  violet-600: #7c3aed

Semantic Colors:
  Success: emerald-500 (#10b981)
  Warning: amber-500 (#f59e0b)
  Error:   red-500 (#ef4444)

Background:
  Light Mode: white / slate-50
  Dark Mode:  slate-900 / slate-950

Text:
  Light Mode Primary:   slate-900
  Light Mode Secondary: slate-600
  Dark Mode Primary:    white
  Dark Mode Secondary:  slate-300

Border:
  Light Mode: slate-200
  Dark Mode:  slate-700
```

### Typography Scale

```
Display:  text-4xl / text-5xl  - Landing page heroes, major headings
          font-bold, tracking-tight

H1:       text-3xl             - Page titles
          font-bold

H2:       text-2xl             - Section headings
          font-semibold

H3:       text-xl              - Subsection headings
          font-semibold

H4:       text-lg              - Card titles, minor headings
          font-medium

Body:     text-base            - Standard paragraph text
          font-normal

Small:    text-sm              - Helper text, labels
          font-normal

Caption:  text-xs              - Metadata, timestamps
          font-normal, text-slate-500
```

### Spacing System

```
Base Unit: 4px (Tailwind default)

Container Padding:
  Mobile (default): px-4 (16px)
  Tablet (sm):      px-6 (24px)
  Desktop (lg):     px-8 (32px)

Card Padding:      p-6 (24px)
Card Gap:          gap-6 (24px)

Form Spacing:
  Field Gap:       space-y-4 (16px)
  Section Gap:     space-y-6 (24px)
  Button Gap:      gap-3 (12px)

List Spacing:
  Item Gap:        space-y-2 (8px)
  Section Gap:     space-y-4 (16px)

Page Sections:     space-y-8 (32px) or space-y-12 (48px)
```

### Breakpoints

```
sm:  640px   - Large phones, landscape mobile
md:  768px   - Tablets
lg:  1024px  - Laptops, small desktops
xl:  1280px  - Desktops
2xl: 1536px  - Large desktops

Key Breakpoint Behaviors:
- < md:  Mobile navigation (hamburger/bottom nav)
- >= md: Desktop navigation (sidebar visible)
- < lg:  Single column layouts
- >= lg: Multi-column layouts
```

### Border Radius

```
Buttons:    rounded-md (6px)
Cards:      rounded-lg (8px)
Modals:     rounded-xl (12px)
Avatars:    rounded-full
Inputs:     rounded-md (6px)
Badges:     rounded-full or rounded-md
```

### Shadows

```
Card:       shadow-sm
Card Hover: shadow-md
Dropdown:   shadow-lg
Modal:      shadow-xl
```

---

## Component Requirements

### Layout Components

#### 1. AppShell
Main layout wrapper that contains the entire application structure.

```tsx
// Location: src/components/layout/app-shell.tsx
interface AppShellProps {
  children: React.ReactNode;
}

Features:
- Flex container with sidebar and main content area
- Responsive: sidebar hidden on mobile, visible on desktop
- Handles sidebar collapse state
- Provides consistent max-width container for content
```

#### 2. Header
Fixed header component with navigation and user controls.

```tsx
// Location: src/components/layout/header.tsx
Features:
- Fixed position at top of viewport
- Logo/brand on the left
- Main navigation links (desktop only)
- Organization selector dropdown
- User avatar with dropdown menu (profile, settings, logout)
- Dark mode toggle
- Height: h-16 (64px)
- Background: bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm
- Border: border-b border-slate-200 dark:border-slate-700
```

#### 3. Sidebar
Collapsible navigation sidebar for desktop views.

```tsx
// Location: src/components/layout/sidebar.tsx
Features:
- Hidden on mobile (< md breakpoint)
- Collapsible to icons-only mode
- Navigation links with icons
- Active state indication
- Width: w-64 (256px) expanded, w-16 (64px) collapsed
- Smooth collapse/expand transition
- Hover tooltips when collapsed
```

#### 4. MobileNav
Mobile navigation component using hamburger menu or bottom navigation.

```tsx
// Location: src/components/layout/mobile-nav.tsx
Features:
- Visible only on mobile (< md breakpoint)
- Option A: Hamburger menu with slide-out drawer
- Option B: Fixed bottom navigation bar
- Same navigation items as sidebar
- Smooth animations for open/close
```

#### 5. PageHeader
Consistent page title and actions area.

```tsx
// Location: src/components/layout/page-header.tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

Features:
- Page title (H1)
- Optional description
- Action buttons area (right-aligned on desktop, stacked on mobile)
- Optional breadcrumb navigation
- Consistent spacing: py-6 or py-8
```

#### 6. Container
Max-width container with responsive padding.

```tsx
// Location: src/components/layout/container.tsx
Features:
- max-w-7xl mx-auto
- Responsive padding: px-4 sm:px-6 lg:px-8
- Optional narrow variant: max-w-3xl
```

---

### Authentication Pages

#### 1. Login Page

**Layout:**
- Centered card on gradient or subtle pattern background
- Logo at top of card
- Card max-width: max-w-md

**Components:**
```tsx
// Location: src/app/(auth)/login/page.tsx
// Form component: src/components/auth/login-form.tsx

Form Fields:
- Email input (type="email", required)
- Password input (type="password", required)
- "Remember me" checkbox
- Submit button (full width)

Links:
- "Forgot password?" link above/below password field
- "Don't have an account? Sign up" link below form

States:
- Default form state
- Loading state (button spinner, inputs disabled)
- Error state (server error message)
- Field validation errors (inline)

Future:
- Social login buttons (Google, GitHub)
- Divider with "or continue with"
```

#### 2. Signup Page

**Layout:**
- Centered card matching login page style
- Logo at top of card

**Components:**
```tsx
// Location: src/app/(auth)/signup/page.tsx
// Form component: src/components/auth/signup-form.tsx

Form Fields:
- Full name input (required)
- Email input (type="email", required)
- Password input (type="password", required)
- Password confirmation input (required)
- Password strength indicator
- Terms acceptance checkbox (required)
- Submit button (full width)

Links:
- "Already have an account? Log in" link below form

Validation:
- Email format validation
- Password minimum length (8 chars)
- Password strength feedback (weak/medium/strong)
- Password match validation
- Terms must be accepted

States:
- Default form state
- Loading state
- Success state (redirect or confirmation)
- Error states (server and field-level)
```

---

### Dashboard

**Location:** `src/app/(protected)/dashboard/page.tsx`

**Layout:**
```tsx
Features:
1. Welcome message with user's name
   - "Good morning, {firstName}!" with time-based greeting
   - Subtitle with current date

2. Quick stats cards (grid: 1 col mobile, 2 col tablet, 4 col desktop)
   - Organizations count
   - Projects count
   - Recent activity count (optional)
   - Team members count (optional)

3. Recent projects section
   - Card or table with last 5 projects
   - Project name, org, last updated
   - "View all" link

4. Quick actions
   - Create Organization button
   - Create Project button
   - Invite Team Member button (optional)

5. Empty states
   - No organizations: CTA to create first org
   - No projects: CTA to create first project
   - Friendly illustrations for empty states
```

---

### Organization Pages

#### 1. Organization List

**Location:** `src/app/(protected)/organizations/page.tsx`

```tsx
Layout:
- PageHeader with title "Organizations" and "Create Organization" button
- Grid of organization cards (1 col mobile, 2 col tablet, 3 col desktop)

Org Card (src/components/organizations/org-card.tsx):
- Organization name
- Description (truncated)
- Member count
- Your role badge (Owner, Admin, Member)
- Created date
- Click to navigate to org detail

Empty State:
- Illustration
- "No organizations yet"
- "Create your first organization" CTA
```

#### 2. Create Organization

**Location:** `src/app/(protected)/organizations/new/page.tsx` or dialog

```tsx
Options:
A. Dedicated page with form
B. Modal/dialog triggered from org list

Form Fields:
- Organization name (required)
- Slug/URL (auto-generated, editable)
- Description (optional, textarea)
- Logo upload (optional, future)
- Submit and Cancel buttons

Validation:
- Name: required, max 100 chars
- Slug: required, lowercase, alphanumeric with hyphens, unique
```

#### 3. Organization Selector

**Location:** `src/components/organizations/org-selector.tsx`

```tsx
Features:
- Dropdown in header
- Search/filter functionality
- Shows current org name + avatar/logo
- List of available orgs with role badges
- "Create new organization" option at bottom
- Keyboard navigation support
```

---

### Project Pages

#### 1. Project List

**Location:** `src/app/(protected)/projects/page.tsx`

```tsx
Layout:
- PageHeader with title "Projects" and "Create Project" button
- Search input
- Filter by organization dropdown
- View toggle: table/grid (optional)

Table View (src/components/projects/project-table.tsx):
- Columns: Name, Organization, Status, Last Updated, Actions
- Sortable columns
- Pagination
- Row click navigates to detail
- Mobile: horizontal scroll or card view fallback

Grid View (src/components/projects/project-card.tsx):
- Project name
- Organization name
- Status badge
- Last updated
- Quick action menu

Empty State:
- Illustration
- "No projects found"
- Context-aware message (no projects vs. no search results)
```

#### 2. Project Detail

**Location:** `src/app/(protected)/projects/[id]/page.tsx`

```tsx
Layout:
- PageHeader with project name, org breadcrumb, Edit/Delete buttons
- Project metadata section
- Description
- Status
- Created/updated timestamps
- Related actions

Actions:
- Edit button → navigate to edit page
- Delete button → confirmation dialog
- Back to projects link
```

#### 3. Project Form (Create/Edit)

**Locations:**
- Create: `src/app/(protected)/projects/new/page.tsx`
- Edit: `src/app/(protected)/projects/[id]/edit/page.tsx`
- Shared form: `src/components/projects/project-form.tsx`

```tsx
Form Fields:
- Project name (required)
- Description (optional, textarea)
- Organization selector (required, dropdown)
- Status selector (optional, dropdown)
- Submit and Cancel buttons

Validation:
- Name: required, max 100 chars
- Organization: required

States:
- Create mode vs. Edit mode (pre-filled values)
- Loading state during submission
- Success → redirect to project detail
- Error handling with toast notifications
```

#### 4. Delete Confirmation Dialog

**Location:** `src/components/projects/delete-project-dialog.tsx`

```tsx
Features:
- Confirmation modal with warning
- Project name in message for clarity
- "Cancel" and "Delete" buttons
- Delete button uses destructive variant (red)
- Loading state during deletion
- Toast notification on success/error
```

---

## Acceptance Criteria

### shadcn/ui Setup

- [ ] Initialize shadcn/ui with `pnpm dlx shadcn@latest init`
- [ ] Configure with Next.js App Router
- [ ] Use CSS variables for theming
- [ ] Install required components:
  - [ ] Button
  - [ ] Card
  - [ ] Input
  - [ ] Label
  - [ ] Form (react-hook-form integration)
  - [ ] Dialog
  - [ ] DropdownMenu
  - [ ] Avatar
  - [ ] Badge
  - [ ] Table
  - [ ] Skeleton
  - [ ] Toast (sonner)
  - [ ] Separator
  - [ ] Sheet (for mobile drawer)
  - [ ] Command (for searchable selects)
  - [ ] Checkbox
  - [ ] Select
  - [ ] Textarea

### Responsive Behavior

- [ ] All pages render correctly at 320px width minimum
- [ ] No horizontal overflow at any breakpoint
- [ ] Navigation collapses to hamburger/mobile nav at < md breakpoint
- [ ] Forms stack vertically on mobile
- [ ] Tables either:
  - Scroll horizontally with sticky first column, OR
  - Convert to card/list view on mobile
- [ ] Modals become full-screen on mobile (< sm breakpoint)
- [ ] Touch targets minimum 44x44px on mobile
- [ ] Images and media scale appropriately

### Accessibility

- [ ] All interactive elements have visible focus states
- [ ] Focus states use focus-visible for keyboard-only styling
- [ ] Proper heading hierarchy maintained (h1 → h2 → h3)
- [ ] Only one h1 per page
- [ ] Form labels properly associated with inputs (htmlFor/id)
- [ ] Error messages linked to inputs with aria-describedby
- [ ] Required fields indicated with aria-required
- [ ] Loading states announced with aria-live regions
- [ ] Keyboard navigation works throughout:
  - [ ] Tab through all interactive elements
  - [ ] Enter/Space to activate buttons
  - [ ] Escape to close modals
  - [ ] Arrow keys for dropdown navigation
- [ ] Color is not the only indicator of state
- [ ] Minimum contrast ratio of 4.5:1 for normal text
- [ ] Minimum contrast ratio of 3:1 for large text
- [ ] Skip to main content link (optional but recommended)

### Dark Mode

- [ ] System preference detection on initial load
- [ ] Manual toggle available in header
- [ ] Toggle between light/dark/system modes
- [ ] Preference persisted in localStorage
- [ ] Smooth transition between modes (no flash)
- [ ] All components have proper dark mode styles
- [ ] Images and illustrations work in both modes
- [ ] No accessibility contrast issues in dark mode

---

## Implementation Tasks

### Phase 1A: Setup (Priority: Critical)

1. **Initialize shadcn/ui**
   - Run `pnpm dlx shadcn@latest init`
   - Configure for Next.js App Router
   - Set up CSS variables
   - Configure slate color scheme

2. **Install next-themes**
   - `pnpm add next-themes`
   - Create ThemeProvider component
   - Wrap app in provider

3. **Configure Tailwind**
   - Update tailwind.config.ts with design tokens
   - Set up custom colors if needed
   - Configure dark mode variant

4. **Set up globals.css**
   - CSS variables for colors
   - Base styles
   - Smooth theme transition

### Phase 1B: Layout Components

1. **Create AppShell component**
   - Main layout structure
   - Sidebar + main content area
   - Responsive behavior

2. **Create Header component**
   - Logo and branding
   - Navigation links
   - Org selector integration
   - User menu dropdown
   - Dark mode toggle

3. **Create MobileNav component**
   - Hamburger menu trigger
   - Slide-out drawer with Sheet component
   - Navigation links
   - Close on navigation

4. **Create PageHeader component**
   - Title and description
   - Action buttons slot
   - Breadcrumb support

5. **Create Footer component** (if needed)
   - Copyright
   - Links

### Phase 1C: Authentication Pages

1. **Redesign login page**
   - New layout with shadcn Card
   - Form with shadcn Input, Button, Checkbox
   - Error handling with Form component
   - Loading states

2. **Redesign signup page**
   - Matching layout to login
   - Password strength indicator
   - Terms checkbox
   - Form validation

3. **Add form validation feedback**
   - Inline error messages
   - Success states
   - Server error display

4. **Add loading states**
   - Button spinners
   - Disabled inputs during submission

### Phase 1D: Dashboard

1. **Create dashboard layout**
   - Welcome section
   - Grid layout for stats
   - Sections for content

2. **Create StatsCard component**
   - Icon
   - Label
   - Value
   - Optional trend indicator

3. **Add recent projects section**
   - List or table of recent items
   - Click to navigate

4. **Add quick actions**
   - Action buttons for common tasks

5. **Handle empty states**
   - Empty state component
   - Contextual messages and CTAs

### Phase 1E: Organization Pages

1. **Redesign org list**
   - Grid of org cards
   - Org card component
   - Role badges

2. **Create org creation modal/page**
   - Form with validation
   - Success/error handling

3. **Create org selector dropdown**
   - Search functionality
   - Current org indicator
   - Role badges

### Phase 1F: Project Pages

1. **Redesign project list**
   - Table with shadcn Table
   - Search and filters
   - Pagination

2. **Redesign project detail page**
   - Full information display
   - Edit/delete actions
   - Breadcrumb navigation

3. **Redesign project forms**
   - Create and edit pages
   - Shared form component
   - Validation feedback

4. **Add delete confirmation dialog**
   - shadcn Dialog
   - Destructive action styling
   - Loading state

---

## File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx          # Auth pages layout (centered, no nav)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx          # Protected layout with AppShell
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── organizations/
│   │   │   ├── page.tsx        # Org list
│   │   │   └── new/
│   │   │       └── page.tsx    # Create org
│   │   └── projects/
│   │       ├── page.tsx        # Project list
│   │       ├── new/
│   │       │   └── page.tsx    # Create project
│   │       └── [id]/
│   │           ├── page.tsx    # Project detail
│   │           └── edit/
│   │               └── page.tsx # Edit project
│   ├── layout.tsx              # Root layout with providers
│   └── globals.css
├── components/
│   ├── ui/                     # shadcn/ui components (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── form.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── table.tsx
│   │   ├── skeleton.tsx
│   │   ├── toast.tsx
│   │   ├── sheet.tsx
│   │   ├── checkbox.tsx
│   │   ├── select.tsx
│   │   └── textarea.tsx
│   ├── layout/
│   │   ├── app-shell.tsx
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   ├── mobile-nav.tsx
│   │   ├── page-header.tsx
│   │   ├── container.tsx
│   │   └── footer.tsx
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── signup-form.tsx
│   ├── organizations/
│   │   ├── org-card.tsx
│   │   ├── org-list.tsx
│   │   ├── org-selector.tsx
│   │   ├── org-form.tsx
│   │   └── create-org-dialog.tsx
│   ├── projects/
│   │   ├── project-table.tsx
│   │   ├── project-card.tsx
│   │   ├── project-form.tsx
│   │   ├── project-detail.tsx
│   │   └── delete-project-dialog.tsx
│   └── shared/
│       ├── empty-state.tsx
│       ├── loading-skeleton.tsx
│       ├── stats-card.tsx
│       └── theme-toggle.tsx
├── lib/
│   ├── utils.ts               # cn() helper and utilities
│   └── providers/
│       └── theme-provider.tsx
└── styles/
    └── globals.css            # CSS variables and base styles
```

---

## Dependencies

```json
{
  "dependencies": {
    "next-themes": "^0.4.x",
    "@radix-ui/react-*": "auto-installed by shadcn",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "lucide-react": "^0.x",
    "sonner": "^1.x"
  },
  "devDependencies": {
    "tailwindcss": "^4.x",
    "@tailwindcss/postcss": "^4.x"
  }
}
```

---

## Notes

1. **Component Composition**: Prefer composition over configuration. Use slots and children props rather than complex configuration objects.

2. **Server vs Client Components**: Keep layout components as server components where possible. Form components and interactive elements will be client components.

3. **Data Fetching**: Use Server Components for data fetching. Pass data down to client components as props.

4. **Error Handling**: Implement error boundaries at the layout level. Use toast notifications for action feedback.

5. **Loading States**: Use Suspense boundaries with Skeleton components for loading states.

6. **Form State**: Use react-hook-form with zod for form validation. shadcn Form component integrates well with this.

7. **Testing**: Components should be designed for testability with proper data-testid attributes on key interactive elements.

