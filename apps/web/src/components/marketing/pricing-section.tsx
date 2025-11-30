import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      'Up to 3 team members',
      '1 organization',
      'Basic analytics',
      'Community support',
    ],
    cta: 'Get Started',
    href: '/signup',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For growing teams',
    features: [
      'Unlimited team members',
      'Unlimited organizations',
      'Advanced analytics',
      'Priority support',
      'API access',
      'Audit logs',
    ],
    cta: 'Start Free Trial',
    href: '/signup?plan=pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'SSO/SAML',
      'Custom contracts',
      'Dedicated support',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    href: '/contact',
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-heading-lg text-center mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-body-lg text-center mb-16 max-w-2xl mx-auto text-muted-foreground">
          Choose the plan that fits your needs. All plans include core features
          to help your team collaborate effectively.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`glass-card rounded-2xl p-8 relative ${
                tier.popular ? 'ring-2 ring-primary/20' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full">
                    POPULAR
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {tier.description}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  {tier.period && (
                    <span className="text-muted-foreground ml-1">
                      {tier.period}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={tier.popular ? 'default' : 'outline'}
                className="w-full"
              >
                <Link href={tier.href}>{tier.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

