# MDX Docs Site

**Epic:** Docs
**Priority:** Phase 5C
**Depends on:** Design System, SDK & API Docs, Marketing Site
**Status:** Draft

---

## Overview

This specification defines the developer documentation portal for ForgeStack. The docs site provides comprehensive guides, tutorials, and API reference documentation to help developers integrate and use the ForgeStack platform effectively.

### Core Sections

- **Getting Started** – Introduction, installation, and quickstart guides
- **Guides** – In-depth tutorials for authentication, organizations, billing, and webhooks
- **API Reference** – Complete API documentation with examples
- **SDK** – TypeScript SDK installation and usage

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Docs Site (Next.js + MDX)                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                     App Router with MDX Support                          │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │ │
│  │  │  @next/mdx or contentlayer                                         │  │ │
│  │  │  - Frontmatter parsing (title, description, order)                │  │ │
│  │  │  - Static generation for all pages                                 │  │ │
│  │  │  - Auto-generated table of contents                                │  │ │
│  │  └───────────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────────┐  │
│  │   DocsLayout       │  │   DocsSidebar      │  │   Custom MDX           │  │
│  │   - Sidebar        │  │   - Section nav    │  │   Components           │  │
│  │   - Content area   │  │   - Collapsible    │  │   - Callout            │  │
│  │   - TOC panel      │  │   - Active state   │  │   - CodeBlock          │  │
│  │   - Mobile toggle  │  │   - Search         │  │   - Tabs               │  │
│  └────────────────────┘  └────────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Principles

- **Developer-first** – Clear, concise documentation with practical examples
- **Static generation** – All docs pages pre-rendered for fast loading
- **MDX-powered** – Rich content with interactive components
- **Searchable** – Easy to find relevant documentation (optional search)
- **Dark/Light mode** – Respects user preference, optimized for code readability

---

## User Stories

### US-1: Getting Started Documentation

**As a** new developer
**I want to** quickly understand how to get started with ForgeStack
**So that** I can begin integrating the platform into my application

**Acceptance Criteria:**
- Introduction page explains what ForgeStack is and its key features
- Installation page shows how to install the SDK with package manager commands
- Quickstart page provides a minimal working example
- Each page includes code snippets with copy buttons
- Navigation clearly guides through the onboarding flow

### US-2: In-Depth Guides

**As a** developer building an integration
**I want to** understand how to implement specific features
**So that** I can correctly use authentication, organizations, billing, and webhooks

**Acceptance Criteria:**
- Authentication guide covers login, signup, session management, and API keys
- Organizations guide covers creating, managing, and switching organizations
- Billing guide covers subscription management and usage tracking
- Webhooks guide covers setup, verification, and handling events
- Each guide includes complete code examples with multiple language tabs
- Guides include callouts for important notes, warnings, and tips

### US-3: API Reference

**As a** developer integrating the API
**I want to** see complete endpoint documentation
**So that** I can understand request/response formats and authentication requirements

**Acceptance Criteria:**
- Overview page explains API conventions, base URLs, and authentication
- Authentication reference documents all auth-related endpoints
- Endpoints reference documents all CRUD operations by resource
- Each endpoint shows method, path, parameters, request body, and response
- Response examples include success and error cases
- Copy button available for all code examples

### US-4: SDK Documentation

**As a** developer using the TypeScript SDK
**I want to** understand how to install and use the SDK
**So that** I can leverage type-safe API interactions

**Acceptance Criteria:**
- Installation page shows npm/yarn/pnpm installation commands
- Usage page demonstrates client initialization and common operations
- Examples show real-world use cases with complete code
- Type definitions are documented with descriptions

---

## Acceptance Criteria

### Pages Structure Requirements

```
/docs
├── getting-started/
│   ├── introduction.mdx      # What is ForgeStack, features overview
│   ├── installation.mdx      # SDK installation with package managers
│   └── quickstart.mdx        # Minimal working example
├── guides/
│   ├── authentication.mdx    # Auth flows, sessions, API keys
│   ├── organizations.mdx     # Org management, switching, invites
│   ├── billing.mdx           # Subscriptions, usage, invoices
│   └── webhooks.mdx          # Setup, verification, event handling
├── api-reference/
│   ├── overview.mdx          # Base URLs, conventions, errors
│   ├── authentication.mdx    # Auth endpoints reference
│   └── endpoints.mdx         # All API endpoints by resource
└── sdk/
    ├── installation.mdx      # Package installation
    └── usage.mdx             # Client usage examples
```

### MDX Features

| Feature | Specification |
|---------|---------------|
| Code syntax highlighting | Shiki or Prism with language detection |
| Custom components | Callout, CodeBlock, Tabs, Card, Steps |
| Table of contents | Auto-generated from headings (h2, h3) |
| Copy code button | Click to copy code block content |
| Frontmatter | title, description, order, section metadata |

### Navigation Requirements

| Feature | Specification |
|---------|---------------|
| Sidebar | Collapsible sections with nested pages |
| Breadcrumbs | Show current location in docs hierarchy |
| Prev/Next | Navigate between pages in order |
| Mobile | Hamburger menu with slide-out sidebar |
| Search | Optional full-text search (Algolia/local) |

### Design Requirements

| Requirement | Specification |
|-------------|---------------|
| Typography | Clean, readable with proper code font |
| Theme | Dark/light mode with system preference |
| Layout | Responsive: sidebar collapses on mobile |
| Code blocks | Language label, line numbers, copy button |
| Colors | Accessible contrast ratios (WCAG AA) |

---

## Component Specifications

### DocsLayout

```tsx
// Location: apps/web/src/components/docs/docs-layout.tsx
interface DocsLayoutProps {
  children: React.ReactNode;
  frontmatter: {
    title: string;
    description: string;
  };
  tableOfContents: TocItem[];
}

Features:
- Three-column layout: sidebar | content | table of contents
- Sticky sidebar on desktop
- TOC panel on right side (hidden on mobile)
- Responsive: collapses to single column on mobile
- Header with mobile menu toggle
- Footer with prev/next navigation
```

### DocsSidebar

```tsx
// Location: apps/web/src/components/docs/docs-sidebar.tsx
interface DocsSidebarProps {
  navigation: NavSection[];
  currentPath: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  title: string;
  href: string;
  items?: NavItem[]; // Nested items
}

Features:
- Grouped sections (Getting Started, Guides, API Reference, SDK)
- Collapsible section groups
- Active state highlighting for current page
- Nested navigation support
- Keyboard navigation accessible
- Scroll position persistence
```

### DocsHeader

```tsx
// Location: apps/web/src/components/docs/docs-header.tsx
interface DocsHeaderProps {
  breadcrumbs: { label: string; href?: string }[];
  showTocToggle?: boolean;
}

Features:
- Logo linking to /docs
- Breadcrumb navigation (Docs > Guides > Authentication)
- TOC toggle button for mobile
- Theme toggle (dark/light)
- Optional search input
- Mobile hamburger menu
```

### Callout

```tsx
// Location: apps/web/src/components/docs/callout.tsx
interface CalloutProps {
  type: 'info' | 'warning' | 'error' | 'tip';
  title?: string;
  children: React.ReactNode;
}

Features:
- Color-coded background based on type
- Icon indicator (info circle, warning triangle, error x, lightbulb)
- Optional title
- Markdown content support inside
- Styled for both light and dark themes
```

### CodeBlock

```tsx
// Location: apps/web/src/components/docs/code-block.tsx
interface CodeBlockProps {
  code: string;
  language: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
}

Features:
- Syntax highlighting with Shiki
- Language label in top-right corner
- Optional filename tab
- Copy button with success feedback
- Line numbers (optional)
- Line highlighting support
- Horizontal scroll for long lines
- Dark/light theme variants
```

### Tabs

```tsx
// Location: apps/web/src/components/docs/tabs.tsx
interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
}

interface TabItem {
  label: string;
  value: string;
  children: React.ReactNode;
}

Features:
- Tabbed content for multi-language examples
- Keyboard accessible (arrow key navigation)
- Persists selection in localStorage (optional)
- Synchronized tabs across page (optional)
- Smooth transition between tabs
```

### TableOfContents

```tsx
// Location: apps/web/src/components/docs/table-of-contents.tsx
interface TableOfContentsProps {
  items: TocItem[];
}

interface TocItem {
  title: string;
  href: string;
  level: number; // 2 or 3 (h2, h3)
}

Features:
- Auto-generated from page headings
- Sticky positioning on desktop
- Active section highlighting on scroll
- Smooth scroll to section on click
- Indentation for h3 under h2
- Hidden when no headings present
```

### PrevNextNav

```tsx
// Location: apps/web/src/components/docs/prev-next-nav.tsx
interface PrevNextNavProps {
  prev?: { title: string; href: string };
  next?: { title: string; href: string };
}

Features:
- Previous and Next page links at bottom
- Arrow icons indicating direction
- Shows page titles
- Full-width clickable areas
```

---

## Tasks & Subtasks

### Setup Tasks

#### 1. Configure MDX Support
- [ ] Install `@next/mdx` or `contentlayer` in `apps/web`
- [ ] Configure `next.config.mjs` for MDX file processing
- [ ] Install `@mdx-js/loader` and `@mdx-js/react`
- [ ] Install Shiki for syntax highlighting
- [ ] Configure frontmatter parsing (gray-matter or contentlayer)
- [ ] Set up MDX component provider

#### 2. Create Docs Route Structure
- [ ] Create `apps/web/src/app/(docs)/docs/layout.tsx`
- [ ] Create catch-all route `[...slug]/page.tsx` for MDX pages
- [ ] Configure static generation with `generateStaticParams`
- [ ] Set up MDX content directory at `apps/web/content/docs/`

### Component Tasks

#### 3. Create DocsLayout Component
- [ ] Create `apps/web/src/components/docs/docs-layout.tsx`
- [ ] Implement three-column layout (sidebar, content, TOC)
- [ ] Add responsive breakpoints for tablet/mobile
- [ ] Integrate DocsSidebar and TableOfContents
- [ ] Add mobile sidebar toggle

#### 4. Create DocsSidebar Component
- [ ] Create `apps/web/src/components/docs/docs-sidebar.tsx`
- [ ] Implement navigation sections from config
- [ ] Add collapsible section groups
- [ ] Highlight active page
- [ ] Support nested navigation items
- [ ] Create mobile slide-out variant

#### 5. Create DocsHeader Component
- [ ] Create `apps/web/src/components/docs/docs-header.tsx`
- [ ] Add logo with link to /docs
- [ ] Implement breadcrumb navigation
- [ ] Add theme toggle button
- [ ] Add mobile hamburger menu
- [ ] Optional: Add search input placeholder

#### 6. Create Callout Component
- [ ] Create `apps/web/src/components/docs/callout.tsx`
- [ ] Implement variants: info, warning, error, tip
- [ ] Add appropriate icons for each type
- [ ] Style for light/dark themes
- [ ] Support MDX children content

#### 7. Create CodeBlock Component
- [ ] Create `apps/web/src/components/docs/code-block.tsx`
- [ ] Integrate Shiki for syntax highlighting
- [ ] Add language label display
- [ ] Implement copy button with clipboard API
- [ ] Add copy success feedback (toast or checkmark)
- [ ] Support optional line numbers
- [ ] Support line highlighting
- [ ] Add dark/light theme variants

#### 8. Create Tabs Component
- [ ] Create `apps/web/src/components/docs/tabs.tsx`
- [ ] Implement tab navigation UI
- [ ] Add keyboard accessibility (arrow keys)
- [ ] Support controlled and uncontrolled modes
- [ ] Optional: Persist selection in localStorage

#### 9. Create TableOfContents Component
- [ ] Create `apps/web/src/components/docs/table-of-contents.tsx`
- [ ] Parse headings from MDX content
- [ ] Implement scroll spy for active section
- [ ] Add smooth scroll on click
- [ ] Style indentation for h3 items
- [ ] Make sticky on desktop

#### 10. Create PrevNextNav Component
- [ ] Create `apps/web/src/components/docs/prev-next-nav.tsx`
- [ ] Calculate prev/next from navigation config
- [ ] Add directional arrow icons
- [ ] Style as full-width clickable areas

### Content Tasks

#### 11. Create Getting Started Content
- [ ] Create `content/docs/getting-started/introduction.mdx`
- [ ] Create `content/docs/getting-started/installation.mdx`
- [ ] Create `content/docs/getting-started/quickstart.mdx`
- [ ] Add frontmatter (title, description, order)
- [ ] Include relevant code examples with copy buttons

#### 12. Create Guides Content
- [ ] Create `content/docs/guides/authentication.mdx`
- [ ] Create `content/docs/guides/organizations.mdx`
- [ ] Create `content/docs/guides/billing.mdx`
- [ ] Create `content/docs/guides/webhooks.mdx`
- [ ] Add multi-language code examples with Tabs
- [ ] Include Callout components for tips/warnings

#### 13. Create API Reference Content
- [ ] Create `content/docs/api-reference/overview.mdx`
- [ ] Create `content/docs/api-reference/authentication.mdx`
- [ ] Create `content/docs/api-reference/endpoints.mdx`
- [ ] Document request/response formats
- [ ] Include curl and SDK examples

#### 14. Create SDK Documentation Content
- [ ] Create `content/docs/sdk/installation.mdx`
- [ ] Create `content/docs/sdk/usage.mdx`
- [ ] Show npm/yarn/pnpm installation commands
- [ ] Include usage examples with TypeScript

### Configuration Tasks

#### 15. Create Navigation Configuration
- [ ] Create `apps/web/src/config/docs-navigation.ts`
- [ ] Define section structure and page order
- [ ] Include all MDX pages with metadata
- [ ] Export for use in sidebar and prev/next

#### 16. Configure MDX Components
- [ ] Create `apps/web/src/components/docs/mdx-components.tsx`
- [ ] Map custom components (Callout, CodeBlock, Tabs)
- [ ] Override default elements (h1, h2, h3, a, code, pre)
- [ ] Export MDX component provider

---

## Test Plan

### Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| DocsLayout renders sidebar and content | Both panels visible |
| DocsLayout collapses sidebar on mobile | Sidebar hidden, hamburger visible |
| DocsSidebar renders all sections | All navigation sections visible |
| DocsSidebar highlights active page | Current page has active styling |
| DocsSidebar collapses sections | Click toggles section visibility |
| DocsHeader renders breadcrumbs | Correct path displayed |
| Callout renders all variants | Info, warning, error, tip styles correct |
| Callout displays icon and content | Icon and children visible |
| CodeBlock renders with syntax highlighting | Code properly colored |
| CodeBlock copy button copies code | Clipboard contains code content |
| CodeBlock shows language label | Language name displayed |
| Tabs renders all tab items | All tabs visible and clickable |
| Tabs switches content on click | Correct panel shown |
| Tabs supports keyboard navigation | Arrow keys switch tabs |
| TableOfContents renders headings | All h2/h3 headings listed |
| TableOfContents highlights active section | Current section has active style |
| PrevNextNav renders navigation links | Prev and next links visible |

### Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| MDX page renders with frontmatter | Title and description from frontmatter |
| MDX page renders custom components | Callout, CodeBlock, Tabs work |
| Navigation between pages works | Links navigate correctly |
| Prev/Next navigation works | Navigates to adjacent pages |
| Breadcrumbs update on navigation | Path reflects current page |
| TOC scroll spy updates on scroll | Active section highlights |
| Theme toggle switches modes | Dark/light mode applies |
| Mobile sidebar opens/closes | Toggle works correctly |

### E2E Tests (Playwright)

| Scenario | Steps | Expected |
|----------|-------|----------|
| Docs home loads | Navigate to /docs | Introduction page loads |
| Navigate via sidebar | Click "Installation" | Installation page loads |
| Copy code block | Click copy button | Code copied to clipboard |
| Switch tabs | Click different tab | Tab content changes |
| Scroll to TOC item | Click TOC heading | Page scrolls to section |
| Mobile navigation | Open hamburger, click link | Page navigates |
| Theme toggle | Click theme button | Theme switches |
| Breadcrumb navigation | Click breadcrumb link | Navigate to parent |
| Prev/Next navigation | Click "Next" button | Navigate to next page |
| Deep link works | Navigate to /docs/guides/auth#api-keys | Page loads at section |

### Accessibility Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Keyboard navigation works | Tab through all interactive elements |
| Screen reader reads headings | Proper heading hierarchy |
| Focus indicators visible | All focused elements have outline |
| Color contrast meets WCAG AA | All text passes contrast check |
| Skip to content link works | Focus jumps to main content |
| Code blocks are accessible | Announced as code with language |

### Performance Tests

| Metric | Target |
|--------|--------|
| Lighthouse Performance | > 95 (static pages) |
| First Contentful Paint | < 1.0s |
| Largest Contentful Paint | < 2.0s |
| Time to Interactive | < 2.5s |
| Total Blocking Time | < 100ms |
| Build time per page | < 500ms |

---

## Implementation Notes

### Project Structure

```
apps/web/
├── src/
│   ├── app/
│   │   └── (docs)/
│   │       └── docs/
│   │           ├── layout.tsx           # Docs layout with sidebar
│   │           └── [...slug]/
│   │               └── page.tsx         # Dynamic MDX page renderer
│   ├── components/
│   │   └── docs/
│   │       ├── docs-layout.tsx
│   │       ├── docs-sidebar.tsx
│   │       ├── docs-header.tsx
│   │       ├── callout.tsx
│   │       ├── code-block.tsx
│   │       ├── tabs.tsx
│   │       ├── table-of-contents.tsx
│   │       ├── prev-next-nav.tsx
│   │       └── mdx-components.tsx
│   └── config/
│       └── docs-navigation.ts           # Sidebar navigation config
├── content/
│   └── docs/
│       ├── getting-started/
│       │   ├── introduction.mdx
│       │   ├── installation.mdx
│       │   └── quickstart.mdx
│       ├── guides/
│       │   ├── authentication.mdx
│       │   ├── organizations.mdx
│       │   ├── billing.mdx
│       │   └── webhooks.mdx
│       ├── api-reference/
│       │   ├── overview.mdx
│       │   ├── authentication.mdx
│       │   └── endpoints.mdx
│       └── sdk/
│           ├── installation.mdx
│           └── usage.mdx
└── next.config.mjs                      # MDX configuration
```

### MDX Frontmatter Example

```mdx
---
title: Authentication
description: Learn how to implement authentication in your ForgeStack application
section: guides
order: 1
---

# Authentication

ForgeStack provides multiple authentication methods...
```

### Navigation Configuration Example

```typescript
// apps/web/src/config/docs-navigation.ts
export interface NavItem {
  title: string;
  href: string;
  items?: NavItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const docsNavigation: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Introduction', href: '/docs/getting-started/introduction' },
      { title: 'Installation', href: '/docs/getting-started/installation' },
      { title: 'Quickstart', href: '/docs/getting-started/quickstart' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { title: 'Authentication', href: '/docs/guides/authentication' },
      { title: 'Organizations', href: '/docs/guides/organizations' },
      { title: 'Billing', href: '/docs/guides/billing' },
      { title: 'Webhooks', href: '/docs/guides/webhooks' },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { title: 'Overview', href: '/docs/api-reference/overview' },
      { title: 'Authentication', href: '/docs/api-reference/authentication' },
      { title: 'Endpoints', href: '/docs/api-reference/endpoints' },
    ],
  },
  {
    title: 'SDK',
    items: [
      { title: 'Installation', href: '/docs/sdk/installation' },
      { title: 'Usage', href: '/docs/sdk/usage' },
    ],
  },
];
```

### MDX Component Setup

```typescript
// apps/web/src/components/docs/mdx-components.tsx
import { Callout } from './callout';
import { CodeBlock } from './code-block';
import { Tabs, TabItem } from './tabs';

export const mdxComponents = {
  // Custom components
  Callout,
  CodeBlock,
  Tabs,
  TabItem,

  // Override default elements
  h1: (props) => <h1 className="text-4xl font-bold mt-8 mb-4" {...props} />,
  h2: (props) => <h2 className="text-2xl font-semibold mt-6 mb-3" {...props} />,
  h3: (props) => <h3 className="text-xl font-medium mt-4 mb-2" {...props} />,
  a: (props) => <a className="text-primary hover:underline" {...props} />,
  code: (props) => <code className="bg-muted px-1 py-0.5 rounded" {...props} />,
  pre: ({ children, ...props }) => {
    // Extract language from className
    const language = props.className?.replace('language-', '') || 'text';
    return <CodeBlock language={language} code={children} />;
  },
};
```

### Next.js MDX Configuration

```javascript
// next.config.mjs
import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap' }],
    ],
  },
});

export default withMDX({
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
});
```

---

## Dependencies

- **@next/mdx** – MDX support for Next.js (or contentlayer)
- **@mdx-js/loader** – MDX webpack loader
- **@mdx-js/react** – MDX React provider
- **shiki** – Syntax highlighting
- **gray-matter** – Frontmatter parsing
- **remark-gfm** – GitHub Flavored Markdown support
- **rehype-slug** – Add IDs to headings
- **rehype-autolink-headings** – Autolink headings

---

## Security Considerations

1. **XSS prevention** – MDX content is pre-rendered, no runtime eval
2. **External links** – Use `rel="noopener noreferrer"` for external links
3. **Code examples** – Sanitize any user-provided examples
4. **Search indexing** – Ensure search doesn't expose private content

---

## Future Enhancements (Out of Scope for v1)

- Full-text search with Algolia or local search
- API reference auto-generation from OpenAPI spec
- Versioned documentation
- Community contributions (edit on GitHub)
- Feedback widget (was this helpful?)
- Interactive code playground
- Video tutorials embedded
- Localization / i18n support
- PDF export for documentation
- Changelog integration

---

*End of spec*

