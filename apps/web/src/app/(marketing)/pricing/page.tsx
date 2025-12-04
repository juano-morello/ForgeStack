import type { Metadata } from 'next';
import { PricingSection } from '@/components/marketing/pricing-section';
import { CTASection } from '@/components/marketing/cta-section';

export const metadata: Metadata = {
  title: 'Pricing - ForgeStack',
  description: 'Simple, transparent pricing for ForgeStack. Start free, scale as you grow.',
  openGraph: {
    title: 'Pricing - ForgeStack',
    description: 'Simple, transparent pricing for ForgeStack',
    type: 'website',
  },
};

export default function PricingPage() {
  return (
    <>
      <div className="py-20">
        <div className="container text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free, scale as you grow. All plans include core features to help your team collaborate effectively.
          </p>
        </div>
      </div>
      <PricingSection />
      <CTASection />
    </>
  );
}

