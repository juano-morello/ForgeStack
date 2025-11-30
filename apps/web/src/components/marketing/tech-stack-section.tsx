const frontendTechs = [
  'Next.js',
  'React',
  'TypeScript',
  'Tailwind CSS',
  'shadcn/ui',
];

const backendTechs = [
  'NestJS',
  'PostgreSQL',
  'Drizzle ORM',
  'Redis',
  'BullMQ',
];

export function TechStackSection() {
  return (
    <section className="py-24 px-4 border-t border-border/50">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-8">
          Built with modern technologies
        </h2>
        
        {/* Frontend Technologies */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-3">
            Frontend
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {frontendTechs.map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-full border border-border/50 text-sm font-medium bg-card/50 hover:bg-card transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Backend Technologies */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-3">
            Backend
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {backendTechs.map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-full border border-border/50 text-sm font-medium bg-card/50 hover:bg-card transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

