'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Introduction', href: '/docs' },
      { title: 'Installation', href: '/docs/installation' },
      { title: 'Quickstart', href: '/docs/quickstart' },
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
      { title: 'Overview', href: '/docs/api/overview' },
      { title: 'Authentication', href: '/docs/api/authentication' },
      { title: 'Endpoints', href: '/docs/api/endpoints' },
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

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-muted/30 p-6 hidden md:block">
      <Link href="/" className="font-bold text-lg mb-8 block">
        ForgeStack
      </Link>
      <nav className="space-y-6">
        {navigation.map((section) => (
          <div key={section.title}>
            <h4 className="font-semibold text-sm mb-2">{section.title}</h4>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'block text-sm py-1 px-2 rounded-md transition-colors',
                      pathname === item.href
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

