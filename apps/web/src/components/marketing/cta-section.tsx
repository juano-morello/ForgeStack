/**
 * CTA Section Component
 *
 * Final call-to-action section for the landing page.
 * Minimal dark tech aesthetic with glass card and glow effect.
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card rounded-2xl p-12 md:p-16 text-center relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-radial opacity-50" />
          
          {/* Content */}
          <div className="relative z-10">
            <h2 className="text-heading-lg mb-4">
              Ready to build your next SaaS?
            </h2>
            <p className="text-body-lg mb-8 max-w-xl mx-auto">
              Get started with ForgeStack today and launch your product in days, not months.
            </p>
            <Button asChild size="lg" className="group">
              <Link href="/signup">
                Start Building for Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

