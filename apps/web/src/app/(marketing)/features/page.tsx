import type { Metadata } from 'next';
import { FeaturesSection } from '@/components/marketing/features-section';
import { TechStackSection } from '@/components/marketing/tech-stack-section';
import { CTASection } from '@/components/marketing/cta-section';

export const metadata: Metadata = {
  title: 'Features - ForgeStack',
  description: 'Explore all the features included in ForgeStack. Everything you need to build, launch, and scale your SaaS product.',
  openGraph: {
    title: 'Features - ForgeStack',
    description: 'Explore all the features included in ForgeStack',
    type: 'website',
  },
};

export default function FeaturesPage() {
  return (
    <>
      <div className="py-20">
        <div className="container text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            All Features
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build, launch, and scale your SaaS product. 
            Focus on your unique value proposition, not boilerplate.
          </p>
        </div>
      </div>
      <FeaturesSection />
      <TechStackSection />
      <CTASection />
    </>
  );
}

