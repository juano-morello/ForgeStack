/**
 * Landing Page
 *
 * Marketing homepage with hero, features, tech stack, pricing, and CTA sections.
 */

import {
  HeroSection,
  FeaturesSection,
  TechStackSection,
  PricingSection,
  CTASection,
} from '@/components/marketing';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <TechStackSection />
      <PricingSection />
      <CTASection />
    </>
  );
}

