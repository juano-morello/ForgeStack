# Prompt: Write Marketing Copy

Generate marketing copy for ForgeStack landing pages, emails, and product descriptions.

## Input Required

- **Copy type**: landing-page | email | product-description | social-media | cta
- **Target audience**: developers | startup-founders | enterprise | general
- **Tone**: professional | casual | technical | persuasive
- **Key benefits to highlight**: (list 2-3)
- **Call to action**: (what should the user do?)

## Landing Page Hero Section

```markdown
## Request
Generate a hero section for ForgeStack's landing page targeting startup founders.
Highlight: speed to market, multi-tenancy, production-ready
CTA: Start free trial

## Expected Output Structure
- Headline (8 words max, impactful)
- Subheadline (20-30 words, value proposition)
- CTA button text
- Supporting bullet points (3)
```

### Example Output

```
**Headline**: Ship Your SaaS in Days, Not Months

**Subheadline**: ForgeStack gives you authentication, billing, teams, and multi-tenancy 
out of the box. Stop rebuilding infrastructure and start building your product.

**CTA**: Start Building Free →

**Bullets**:
• Multi-tenant from day one with PostgreSQL RLS
• Stripe billing with subscriptions and usage tracking
• Team management with granular permissions
```

## Email Copy

```markdown
## Request
Generate a welcome email for new users who just signed up.
Tone: friendly, helpful
Goal: Get them to create their first project

## Expected Output Structure
- Subject line (40 chars max)
- Preview text (90 chars max)
- Body (3-4 short paragraphs)
- CTA button text
```

### Example Output

```
**Subject**: Welcome to ForgeStack! Let's build something great 🚀

**Preview**: Your account is ready. Here's how to get started in 5 minutes.

**Body**:
Hey {firstName}!

You're in! ForgeStack is now ready for you to start building.

Here's what you can do right now:
1. Create your first organization
2. Invite your team members  
3. Connect your Stripe account

Most founders ship their first feature within an hour. Will you be next?

**CTA**: Create Your First Project →
```

## Product Feature Description

```markdown
## Request
Write a feature description for "Team Management" for the features page.
Target: startup founders evaluating SaaS boilerplates
Highlight: permissions, invitations, roles

## Expected Output Structure
- Feature title
- One-liner (15 words max)
- Description (2-3 sentences)
- Key capabilities (3-4 bullets)
```

### Example Output

```
**Title**: Team Management

**One-liner**: Invite teammates, assign roles, and control access—all built in.

**Description**: 
Give your customers the collaboration tools they expect. ForgeStack includes 
a complete team management system with role-based permissions, email invitations, 
and organization-level access controls.

**Capabilities**:
• Role-based access control with 33 granular permissions
• Email invitations with customizable templates
• Organization switching for multi-team users
• Audit logs for compliance requirements
```

## Social Media Post

```markdown
## Request
Write a Twitter/X thread announcing a new feature release.
Feature: Usage-based billing
Tone: excited, technical but accessible
Include: code snippet if relevant

## Expected Output Structure
- Hook tweet (280 chars)
- 3-4 follow-up tweets
- Call to action tweet
```

## CTA Button Text Guidelines

| Context | Good Examples | Avoid |
|---------|---------------|-------|
| Sign up | "Start Free", "Get Started" | "Submit", "Click Here" |
| Upgrade | "Upgrade to Pro", "Unlock Features" | "Buy Now", "Pay" |
| Learn more | "See How It Works", "Explore Features" | "Learn More", "Info" |
| Demo | "Book a Demo", "See It in Action" | "Contact Us", "Talk" |

## Tone Guidelines

**Professional**: Clear, confident, benefit-focused. Avoid jargon.
**Technical**: Include specifics (tech stack, numbers). Developers appreciate precision.
**Persuasive**: Focus on pain points solved. Use social proof.
**Casual**: Conversational, use contractions, occasional emoji okay.

## Anti-patterns to Avoid

- ❌ Vague claims ("best-in-class", "cutting-edge")
- ❌ Feature lists without benefits
- ❌ Passive voice
- ❌ Walls of text
- ❌ Multiple CTAs competing for attention
- ❌ Overpromising ("build in minutes" when it takes hours)

## Related Files

- `apps/web/app/(marketing)/` - Marketing pages
- `packages/emails/src/templates/` - Email templates
- `.ai/conventions.md` - Writing style guide

