# Marketing Site

**Epic:** Marketing
**Priority:** Phase 5B
**Depends on:** Design System, Authentication
**Status:** Draft

---

## Overview

This specification defines the public marketing site for ForgeStack. The marketing site serves as the primary customer acquisition channel, providing information about features, pricing, and social proof to convert visitors into users.

### Core Pages

- **Landing Page** (`/`) – Hero, features, testimonials, pricing preview, CTAs
- **Pricing Page** (`/pricing`) – Tier comparison, feature table, FAQ
- **Features Page** (`/features`) – Detailed feature descriptions and use cases

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Marketing Site (Next.js)                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    App Router (Static Generation)                ││
│  │  ┌───────────────────┐ ┌───────────────────┐ ┌─────────────────┐││
│  │  │  / (Landing)      │ │  /pricing         │ │  /features      │││
│  │  │  - HeroSection    │ │  - PricingCards   │ │  - FeatureList  │││
│  │  │  - FeaturesGrid   │ │  - CompareTable   │ │  - UseCases     │││
│  │  │  - Testimonials   │ │  - FAQ            │ │  - Screenshots  │││
│  │  │  - PricingPreview │ │  - CTA            │ │  - CTA          │││
│  │  │  - CTASection     │ └───────────────────┘ └─────────────────┘││
│  │  └───────────────────┘                                          ││
│  └─────────────────────────────────────────────────────────────────┘│
│  Shared Components:                                                  │
│  - MarketingNav (logo, links, login/signup buttons)                 │
│  - Footer (links, social icons, copyright)                          │
│  - CTASection, PricingCard, FeatureCard, TestimonialCard            │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Principles

- **Static generation** – All pages pre-rendered at build time for performance
- **SEO optimized** – Proper metadata, Open Graph images, sitemap
- **Dark theme** – Modern, tech-focused aesthetic with gradient accents
- **Mobile-first** – Responsive design starting from mobile breakpoints
- **Fast loading** – Optimized images, minimal JavaScript, no blocking resources

---

## User Stories

### US-1: Landing Page

**As a** visitor  
**I want to** understand what ForgeStack offers at a glance  
**So that** I can decide whether to sign up

**Acceptance Criteria:**
- Hero section displays compelling headline, subheadline, and primary/secondary CTA buttons
- Features grid shows 6-8 key features with icons and brief descriptions
- Tech stack section showcases technologies used
- Testimonials carousel displays customer quotes with rotation
- Pricing preview shows tier names and starting prices with "View Pricing" link
- Final CTA section encourages signup
- Footer includes navigation links, social icons, and copyright

### US-2: Pricing Page

**As a** potential customer  
**I want to** compare pricing tiers and features  
**So that** I can choose the right plan

**Acceptance Criteria:**
- 3 pricing tiers displayed: Free, Pro, Enterprise
- Each tier shows price, key features, and CTA button
- Feature comparison table shows all features across tiers
- FAQ section answers common billing/plan questions
- Enterprise tier has "Contact Sales" CTA

### US-3: Features Page

**As a** visitor  
**I want to** see detailed feature descriptions  
**So that** I can understand the product capabilities

**Acceptance Criteria:**
- Detailed description for each major feature
- Screenshots or illustrations for key features
- Use cases section showing how teams use ForgeStack
- CTA section encouraging signup

---

## Acceptance Criteria

### Design Requirements

| Requirement | Specification |
|-------------|---------------|
| Theme | Dark theme with gradient accents (purple/blue) |
| Typography | Modern sans-serif, clear hierarchy |
| Animations | Smooth scroll, fade-in on scroll, hover effects |
| Responsive | Mobile-first, breakpoints at sm/md/lg/xl |
| Performance | Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1 |

### Technical Requirements

| Requirement | Specification |
|-------------|---------------|
| Framework | Next.js App Router |
| Rendering | Static generation (`generateStaticParams`) |
| SEO | Metadata API for title, description, keywords |
| Open Graph | OG images for each page (1200x630) |
| Sitemap | Auto-generated via `sitemap.ts` |
| Robots | `robots.ts` with proper crawl rules |
| Analytics | Placeholder for analytics integration |

---

## Component Specifications

### MarketingNav

```tsx
// Location: apps/web/src/components/marketing/marketing-nav.tsx
interface MarketingNavProps {
  transparent?: boolean; // For hero overlay
}

Features:
- Logo on the left
- Navigation links: Features, Pricing, Docs (external)
- Login/Signup buttons on the right
- Sticky header with blur backdrop on scroll
- Mobile: hamburger menu with slide-out drawer
- Height: h-16 (64px)
- Background: transparent → bg-slate-900/80 on scroll
```

### HeroSection

```tsx
// Location: apps/web/src/components/marketing/hero-section.tsx
interface HeroSectionProps {
  headline: string;
  subheadline: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

Features:
- Full viewport height (100vh) or min-h-[80vh]
- Gradient background with animated mesh/particles (optional)
- Large headline with gradient text effect
- Subheadline in muted color
- Two CTA buttons (primary filled, secondary outline)
- Down arrow or scroll indicator
```

### FeatureCard

```tsx
// Location: apps/web/src/components/marketing/feature-card.tsx
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

Features:
- Icon container with gradient background
- Title (text-lg font-semibold)
- Description (text-sm text-muted)
- Hover: subtle lift effect with shadow
- Grid layout in parent: 2 cols mobile, 3 cols tablet, 4 cols desktop
```

### PricingCard

```tsx
// Location: apps/web/src/components/marketing/pricing-card.tsx
interface PricingCardProps {
  name: string;
  price: string | number;
  period?: string;
  description: string;
  features: string[];
  cta: { label: string; href: string };
  highlighted?: boolean;
  badge?: string; // "Popular", "Best Value"
}

Features:
- Card with optional highlight border/glow
- Plan name and optional badge
- Price with period (e.g., "$29/month")
- Description text
- Feature list with checkmarks
- CTA button (filled for highlighted, outline for others)
```

### TestimonialCard

```tsx
// Location: apps/web/src/components/marketing/testimonial-card.tsx
interface TestimonialCardProps {
  quote: string;
  author: {
    name: string;
    title: string;
    company: string;
    avatar?: string;
  };
}

Features:
- Quote icon
- Testimonial text
- Author info with avatar
- Card styling with subtle border
```

### CTASection

```tsx
// Location: apps/web/src/components/marketing/cta-section.tsx
interface CTASectionProps {
  headline: string;
  subheadline?: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

Features:
- Full-width section with gradient background
- Centered content
- Large headline
- Optional subheadline
- CTA buttons
```

### Footer

```tsx
// Location: apps/web/src/components/marketing/footer.tsx
Features:
- Multi-column layout: Product, Company, Resources, Legal
- Social media icons (GitHub, Twitter, Discord)
- Copyright notice
- Newsletter signup (optional)
- Dark background
```

---

## Tasks & Subtasks

### Setup Tasks

#### 1. Create Marketing Layout
- [ ] Create `apps/web/src/app/(marketing)/layout.tsx`
- [ ] Import and render MarketingNav and Footer
- [ ] Configure dark theme as default for marketing pages
- [ ] Add scroll behavior and header transparency logic

### Component Tasks

#### 2. Create MarketingNav Component
- [ ] Create `apps/web/src/components/marketing/marketing-nav.tsx`
- [ ] Implement logo with link to home
- [ ] Add navigation links (Features, Pricing)
- [ ] Add Login/Signup buttons linking to auth pages
- [ ] Implement sticky header with scroll detection
- [ ] Create mobile hamburger menu with Sheet component
- [ ] Add backdrop blur on scroll

#### 3. Create Footer Component
- [ ] Create `apps/web/src/components/marketing/footer.tsx`
- [ ] Implement multi-column link layout
- [ ] Add social media icons (GitHub, Twitter, Discord)
- [ ] Add copyright notice with current year
- [ ] Make responsive (stack on mobile)

#### 4. Create HeroSection Component
- [ ] Create `apps/web/src/components/marketing/hero-section.tsx`
- [ ] Implement gradient background effect
- [ ] Add headline with gradient text styling
- [ ] Add subheadline with muted color
- [ ] Add primary and secondary CTA buttons
- [ ] Optional: Add animated background (particles/mesh)

#### 5. Create FeatureCard Component
- [ ] Create `apps/web/src/components/marketing/feature-card.tsx`
- [ ] Implement icon container with gradient
- [ ] Add title and description
- [ ] Add hover animation

#### 6. Create PricingCard Component
- [ ] Create `apps/web/src/components/marketing/pricing-card.tsx`
- [ ] Implement card with optional highlight styling
- [ ] Add badge support for "Popular" etc.
- [ ] Add price display with period
- [ ] Add feature list with checkmarks
- [ ] Add CTA button

#### 7. Create TestimonialCard Component
- [ ] Create `apps/web/src/components/marketing/testimonial-card.tsx`
- [ ] Add quote icon
- [ ] Display testimonial text
- [ ] Show author info with avatar

#### 8. Create CTASection Component
- [ ] Create `apps/web/src/components/marketing/cta-section.tsx`
- [ ] Implement gradient background
- [ ] Add centered headline and subheadline
- [ ] Add CTA buttons

### Page Tasks

#### 9. Create Landing Page
- [ ] Create `apps/web/src/app/(marketing)/page.tsx`
- [ ] Add HeroSection with main value proposition
- [ ] Add FeaturesGrid section (6-8 features)
- [ ] Add tech stack section
- [ ] Add Testimonials section with carousel/grid
- [ ] Add PricingPreview section
- [ ] Add final CTASection

#### 10. Create Pricing Page
- [ ] Create `apps/web/src/app/(marketing)/pricing/page.tsx`
- [ ] Add pricing tiers section with 3 PricingCards
- [ ] Add feature comparison table
- [ ] Add FAQ section with Accordion component
- [ ] Add CTASection

#### 11. Create Features Page
- [ ] Create `apps/web/src/app/(marketing)/features/page.tsx`
- [ ] Add detailed feature sections
- [ ] Add screenshots/illustrations
- [ ] Add use cases section
- [ ] Add CTASection

### SEO Tasks

#### 12. Configure Metadata
- [ ] Add metadata export to each page (title, description, keywords)
- [ ] Create `apps/web/src/app/(marketing)/opengraph-image.tsx` for OG images
- [ ] Create page-specific OG images for pricing and features

#### 13. Create Sitemap and Robots
- [ ] Create `apps/web/src/app/sitemap.ts`
- [ ] Include all marketing pages
- [ ] Create `apps/web/src/app/robots.ts`
- [ ] Configure crawl rules

### Animation Tasks

#### 14. Add Scroll Animations
- [ ] Install framer-motion or use CSS animations
- [ ] Add fade-in-up animations on scroll
- [ ] Add stagger animations for feature cards
- [ ] Add smooth scroll behavior

---

## Test Plan

### Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| MarketingNav renders all links | Features, Pricing, Login, Signup visible |
| MarketingNav mobile menu opens/closes | Sheet toggles correctly |
| HeroSection renders CTA buttons | Buttons link to correct destinations |
| FeatureCard renders icon, title, description | All content visible |
| PricingCard renders with highlight | Highlighted card has different styling |
| PricingCard renders feature list | All features with checkmarks |
| TestimonialCard renders quote and author | All content visible |
| CTASection renders buttons | CTA buttons visible and clickable |
| Footer renders all link sections | All columns and links visible |

### Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Landing page renders all sections | Hero, Features, Testimonials, Pricing, CTA visible |
| Pricing page renders all tiers | Free, Pro, Enterprise cards visible |
| Features page renders all features | All feature sections visible |
| Navigation links work | Clicking links navigates to correct pages |
| Login/Signup buttons link correctly | Navigate to auth pages |
| CTA buttons work | Navigate to signup or appropriate destination |

### E2E Tests (Playwright)

| Scenario | Steps | Expected |
|----------|-------|----------|
| Landing page loads | Navigate to / | Page loads < 3s, no errors |
| Hero CTA navigates to signup | Click "Get Started" | Navigate to /signup |
| Pricing page displays correctly | Navigate to /pricing | All pricing tiers visible |
| Feature comparison table works | Navigate to /pricing | Table scrolls on mobile |
| FAQ accordion works | Click FAQ item | Accordion expands/collapses |
| Mobile navigation works | Open hamburger menu | Menu opens, links work |
| Responsive layout | Resize browser | Layout adjusts at breakpoints |
| Scroll animations trigger | Scroll down page | Elements animate in |

### Performance Tests

| Metric | Target |
|--------|--------|
| Lighthouse Performance | > 90 |
| Largest Contentful Paint | < 2.5s |
| First Input Delay | < 100ms |
| Cumulative Layout Shift | < 0.1 |
| Time to First Byte | < 200ms |
| Total Page Size | < 500KB (excluding images) |

### SEO Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Title tag present | Unique title for each page |
| Meta description present | Description < 160 chars |
| OG tags present | og:title, og:description, og:image |
| Canonical URL set | Correct canonical for each page |
| Sitemap accessible | /sitemap.xml returns valid XML |
| Robots.txt accessible | /robots.txt returns valid file |
| No broken links | All internal links resolve |
| Images have alt text | All images have descriptive alt |

---

## Implementation Notes

### Project Structure

```
apps/web/src/
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx           # Marketing layout with nav/footer
│   │   ├── page.tsx             # Landing page
│   │   ├── pricing/
│   │   │   └── page.tsx         # Pricing page
│   │   ├── features/
│   │   │   └── page.tsx         # Features page
│   │   └── opengraph-image.tsx  # Default OG image
│   ├── sitemap.ts               # Sitemap generation
│   └── robots.ts                # Robots.txt
├── components/
│   └── marketing/
│       ├── marketing-nav.tsx
│       ├── footer.tsx
│       ├── hero-section.tsx
│       ├── feature-card.tsx
│       ├── features-grid.tsx
│       ├── pricing-card.tsx
│       ├── pricing-table.tsx
│       ├── testimonial-card.tsx
│       ├── testimonials-carousel.tsx
│       ├── cta-section.tsx
│       ├── faq-section.tsx
│       └── tech-stack.tsx
└── data/
    ├── features.ts              # Feature list data
    ├── pricing.ts               # Pricing tier data
    ├── testimonials.ts          # Testimonial data
    └── faq.ts                   # FAQ data
```

### Static Data Example

```typescript
// apps/web/src/data/pricing.ts
export const pricingTiers = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for side projects and learning',
    features: [
      '1 organization',
      '3 projects',
      '2 team members',
      'Community support',
    ],
    cta: { label: 'Get Started', href: '/signup' },
  },
  {
    name: 'Pro',
    price: 29,
    period: 'month',
    description: 'For growing teams and startups',
    features: [
      'Unlimited organizations',
      'Unlimited projects',
      '25 team members',
      'Priority support',
      'Advanced analytics',
      'API access',
    ],
    cta: { label: 'Start Free Trial', href: '/signup?plan=pro' },
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations with custom needs',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'SSO / SAML',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
    ],
    cta: { label: 'Contact Sales', href: '/contact' },
  },
];
```

### Animation Example (Framer Motion)

```tsx
// apps/web/src/components/marketing/features-grid.tsx
'use client';

import { motion } from 'framer-motion';
import { FeatureCard } from './feature-card';
import { features } from '@/data/features';

export function FeaturesGrid() {
  return (
    <section className="py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold">Everything you need</h2>
          <p className="text-muted-foreground mt-4">
            Built for modern development teams
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## Security Considerations

1. **No sensitive data** – Marketing pages contain only public information
2. **External links** – Use `rel="noopener noreferrer"` for external links
3. **Form submissions** – Newsletter signup should use reCAPTCHA
4. **Content Security Policy** – Configure CSP headers appropriately
5. **Rate limiting** – Protect contact/newsletter endpoints

---

## Dependencies

- **Design System** – Uses `@forgestack/ui` components
- **Authentication** – Links to auth pages
- **framer-motion** – For scroll animations (optional)
- **lucide-react** – For icons

---

## Future Enhancements (Out of Scope for v1)

- Blog section with CMS integration
- Documentation site integration
- Changelog page
- Status page
- Customer case studies
- Video demos
- Interactive feature demos
- Live chat widget
- A/B testing for CTA variations
- Localization / i18n

---

*End of spec*
