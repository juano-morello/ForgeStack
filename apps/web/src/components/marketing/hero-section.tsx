import Link from 'next/link';
import { ArrowRight, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background with gradient and grid pattern */}
      <div className="absolute inset-0 bg-gradient-radial" />
      <div className="absolute inset-0 bg-grid" />
      
      {/* Fade overlay at edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center rounded-full border border-border/40 bg-background/10 backdrop-blur-sm px-3 py-1 text-xs font-medium text-foreground/90 shadow-sm">
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Introducing ForgeStack v2
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-display text-gradient text-balance max-w-4xl mt-8 animate-fade-up delay-100">
            Build SaaS products faster than ever before
          </h1>

          {/* Subheadline */}
          <p className="text-body-lg text-balance max-w-2xl mx-auto mt-6 animate-fade-up delay-200">
            ForgeStack is a production-ready multi-tenant starter kit with authentication, billing, teams, and everything you need to launch.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-10 animate-fade-up delay-300">
            <Button asChild size="lg" className="group">
              <Link href="/signup">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg" className="group backdrop-blur-sm">
              <Link href="https://github.com/forgestack/forgestack" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </Link>
            </Button>
          </div>

          {/* Tech Stack Badge */}
          <div className="mt-12 animate-fade-up delay-400">
            <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-3">
              Built with modern tech
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground/80">
              <span className="px-2 py-1 rounded border border-border/30 bg-background/5 backdrop-blur-sm">
                Next.js 16
              </span>
              <span className="px-2 py-1 rounded border border-border/30 bg-background/5 backdrop-blur-sm">
                React 19
              </span>
              <span className="px-2 py-1 rounded border border-border/30 bg-background/5 backdrop-blur-sm">
                TypeScript
              </span>
              <span className="px-2 py-1 rounded border border-border/30 bg-background/5 backdrop-blur-sm">
                Tailwind CSS
              </span>
              <span className="px-2 py-1 rounded border border-border/30 bg-background/5 backdrop-blur-sm">
                Drizzle ORM
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

