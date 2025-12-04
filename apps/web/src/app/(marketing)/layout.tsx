import type { Metadata } from 'next';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { Footer } from '@/components/marketing/footer';

export const metadata: Metadata = {
  title: 'ForgeStack - Build SaaS Products 10x Faster',
  description: 'Production-ready multi-tenant SaaS starter kit with authentication, billing, RBAC, file uploads, webhooks, and more. Built with Next.js, NestJS, and PostgreSQL.',
  keywords: ['SaaS', 'starter kit', 'Next.js', 'NestJS', 'PostgreSQL', 'multi-tenant', 'authentication', 'billing', 'RBAC'],
  authors: [{ name: 'ForgeStack' }],
  openGraph: {
    title: 'ForgeStack - Build SaaS Products 10x Faster',
    description: 'Production-ready multi-tenant SaaS starter kit with authentication, billing, RBAC, and more.',
    type: 'website',
    locale: 'en_US',
    siteName: 'ForgeStack',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ForgeStack - Build SaaS Products 10x Faster',
    description: 'Production-ready multi-tenant SaaS starter kit',
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketing min-h-screen flex flex-col bg-background">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

