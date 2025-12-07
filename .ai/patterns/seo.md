# SEO Pattern

Best practices for implementing SEO in ForgeStack's Next.js App Router.

## Metadata API (Next.js 15+)

### Static Metadata

```typescript
// app/(marketing)/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ForgeStack - Production-Ready SaaS Starter',
  description: 'Build multi-tenant SaaS applications with authentication, billing, and team management.',
  keywords: ['SaaS', 'Next.js', 'TypeScript', 'Multi-tenant'],
  authors: [{ name: 'Your Company' }],
  openGraph: {
    title: 'ForgeStack',
    description: 'Production-Ready SaaS Starter Kit',
    url: 'https://forgestack.io',
    siteName: 'ForgeStack',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ForgeStack',
    description: 'Production-Ready SaaS Starter Kit',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

### Dynamic Metadata

```typescript
// app/(app)/[orgSlug]/projects/[projectId]/page.tsx
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ orgSlug: string; projectId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  const project = await getProject(projectId);

  return {
    title: `${project.name} | ForgeStack`,
    description: project.description,
    openGraph: {
      title: project.name,
      description: project.description,
      images: project.coverImage ? [project.coverImage] : [],
    },
  };
}
```

## Sitemap Generation

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/features`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
  ];

  // Dynamic pages (e.g., blog posts)
  const posts = await getBlogPosts();
  const blogPages = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages];
}
```

## Robots.txt

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/app/', '/(app)/', '/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

## Dynamic OG Image Generation

```typescript
// app/api/og/route.tsx
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') ?? 'ForgeStack';
  const description = searchParams.get('description') ?? 'Production-Ready SaaS Starter';

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)', padding: 60 }}>
        <div style={{ fontSize: 64, fontWeight: 700, color: 'white' }}>{title}</div>
        <div style={{ fontSize: 32, color: '#a1a1aa', marginTop: 20 }}>{description}</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

## JSON-LD Structured Data

```typescript
// components/structured-data.tsx
export function OrganizationStructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ForgeStack',
    url: process.env.NEXT_PUBLIC_APP_URL,
    logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
    sameAs: ['https://twitter.com/forgestack', 'https://github.com/forgestack'],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
```

## SEO Checklist

- [ ] Every page has unique `title` and `description`
- [ ] OpenGraph images for social sharing
- [ ] Twitter card metadata
- [ ] `sitemap.xml` generated and submitted to Google Search Console
- [ ] `robots.txt` blocks private routes
- [ ] Canonical URLs for duplicate content
- [ ] JSON-LD structured data for organization/product
- [ ] Dynamic OG images for content pages
- [ ] `alt` text on all images
- [ ] Semantic HTML (`<main>`, `<article>`, `<nav>`, `<header>`, `<footer>`)

## Related Files

- `apps/web/app/layout.tsx` - Root metadata
- `apps/web/app/sitemap.ts` - Sitemap generation
- `apps/web/app/robots.ts` - Robots configuration
- `apps/web/app/api/og/route.tsx` - OG image generation

