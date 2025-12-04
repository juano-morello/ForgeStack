import type { Meta, StoryObj } from '@storybook/react';

// Mock DocsSidebar component to avoid usePathname hook issues
function MockDocsSidebar() {
  const navigation = [
    {
      title: 'Getting Started',
      items: [
        { title: 'Introduction', href: '/docs', active: true },
        { title: 'Installation', href: '/docs/installation', active: false },
        { title: 'Quickstart', href: '/docs/quickstart', active: false },
      ],
    },
    {
      title: 'Guides',
      items: [
        { title: 'Authentication', href: '/docs/guides/authentication', active: false },
        { title: 'Organizations', href: '/docs/guides/organizations', active: false },
        { title: 'Billing', href: '/docs/guides/billing', active: false },
        { title: 'Webhooks', href: '/docs/guides/webhooks', active: false },
      ],
    },
    {
      title: 'API Reference',
      items: [
        { title: 'Overview', href: '/docs/api/overview', active: false },
        { title: 'Authentication', href: '/docs/api/authentication', active: false },
        { title: 'Endpoints', href: '/docs/api/endpoints', active: false },
      ],
    },
    {
      title: 'SDK',
      items: [
        { title: 'Installation', href: '/docs/sdk/installation', active: false },
        { title: 'Usage', href: '/docs/sdk/usage', active: false },
      ],
    },
  ];

  return (
    <aside className="w-64 border-r bg-muted/30 p-6">
      <a href="/" className="font-bold text-lg mb-8 block">
        ForgeStack
      </a>
      <nav className="space-y-6">
        {navigation.map((section) => (
          <div key={section.title}>
            <h4 className="font-semibold text-sm mb-2">{section.title}</h4>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={`block text-sm py-1 px-2 rounded-md transition-colors ${
                      item.active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

const meta = {
  title: 'Docs/DocsSidebar',
  component: MockDocsSidebar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockDocsSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

