import { Shield, Users, CreditCard, Key, Webhook, ScrollText } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Authentication',
    description: 'Secure login with better-auth, magic links, and OAuth providers',
  },
  {
    icon: Users,
    title: 'Multi-tenancy',
    description: 'Built-in organizations, teams, roles, and permissions',
  },
  {
    icon: CreditCard,
    title: 'Billing',
    description: 'Stripe integration with subscriptions, usage billing, and customer portal',
  },
  {
    icon: Key,
    title: 'API Keys',
    description: 'Generate and manage API keys for programmatic access',
  },
  {
    icon: Webhook,
    title: 'Webhooks',
    description: 'Send and receive webhooks with automatic retries',
  },
  {
    icon: ScrollText,
    title: 'Audit Logs',
    description: 'Track every action with comprehensive audit logging',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-heading-lg text-center mb-4">
          Everything you need to ship faster
        </h2>
        <p className="text-body-lg text-center mb-16 max-w-2xl mx-auto">
          ForgeStack comes with all the essential features you need to build modern SaaS applications.
          Focus on your unique value proposition, not boilerplate.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="glass-card rounded-xl p-6 hover-lift"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

