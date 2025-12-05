/**
 * Landing Page
 *
 * Marketing homepage with hero, features, pricing, and CTA sections.
 * Uses the dark tech aesthetic by default (marketing class).
 */

import {
  MarketingNav,
  HeroSection,
  FeaturesSection,
  TechStackSection,
  PricingSection,
  CTASection,
  Footer,
} from '@/components/marketing';

export default function HomePage() {
  return (
    <div className="marketing min-h-screen">
      <MarketingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <TechStackSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

