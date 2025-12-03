# Local Stripe Webhook Development Setup

> **Status:** Proposal  
> **Created:** 2025-12-03  
> **Author:** AI Assistant  

---

## Executive Summary

This proposal outlines the recommended approach for setting up local Stripe webhook development in ForgeStack using the official Stripe CLI Docker image integrated into our existing Docker Compose infrastructure.

---

## Problem Statement

During local development, Stripe cannot reach our application to deliver webhook events because:
1. Localhost is not accessible from the public internet
2. Developer machines typically have dynamic IP addresses
3. Firewall/NAT configurations block incoming connections

This prevents testing of critical billing flows like subscription creation, payment success/failure, and subscription updates.

---

## Current State

### Existing Webhook Infrastructure ✅

| Component | Location | Status |
|-----------|----------|--------|
| Webhook Endpoint | `POST /api/v1/webhooks/stripe` | Implemented |
| Controller | `apps/api/src/incoming-webhooks/incoming-webhooks.controller.ts` | Implemented |
| Signature Verification | `apps/api/src/incoming-webhooks/stripe-webhook.service.ts` | Implemented |
| Event Processing | `apps/worker/src/handlers/stripe-webhook.handler.ts` | Implemented |
| Queue Integration | BullMQ `incoming-webhook-processing` | Implemented |

### Docker Compose Services

```yaml
# Current docker-compose.yml
services:
  postgres:    # ✅ Configured
  redis:       # ✅ Configured
  # stripe-cli: ❌ NOT configured
```

### Environment Variables

```bash
# Already in .env.example
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Proposed Solution

### Option 1: Docker Compose Service (Recommended) ⭐

Add the official Stripe CLI as a Docker Compose service that automatically forwards webhooks to the local API.

**Pros:**
- Auto-starts with `docker compose up`
- Team consistency - everyone uses same setup
- No local installation required
- Integrates with existing infrastructure

**Cons:**
- Requires Docker networking knowledge
- Webhook secret changes on each CLI restart

### Option 2: Local Stripe CLI Installation

Install Stripe CLI directly on developer machines.

**Pros:**
- Simple setup
- Well-documented by Stripe

**Cons:**
- Each developer must install separately
- Manual startup required
- Version inconsistencies between team members

### Option 3: ngrok/Tunneling Service

Use a tunneling service to expose localhost to the internet.

**Pros:**
- Works with actual Stripe webhooks (not simulated)

**Cons:**
- Requires additional service/account
- Security concerns with exposing localhost
- Not recommended for development

---

## Recommended Implementation

### Docker Compose Configuration

```yaml
# docker-compose.yml
services:
  postgres:
    # ... existing config

  redis:
    # ... existing config

  stripe-cli:
    image: stripe/stripe-cli:latest
    container_name: forgestack-stripe-cli
    restart: unless-stopped
    environment:
      - STRIPE_API_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_DEVICE_NAME=${STRIPE_DEVICE_NAME:-forgestack_dev}
    command: >
      listen
      --api-key ${STRIPE_SECRET_KEY}
      --forward-to host.docker.internal:4000/api/v1/webhooks/stripe
      --skip-verify
    depends_on:
      - redis
    profiles:
      - dev
```

### Configuration Notes

| Setting | Value | Purpose |
|---------|-------|---------|
| `host.docker.internal` | Docker DNS | Resolves to host machine's localhost (macOS/Windows) |
| `profiles: [dev]` | Optional profile | Only starts when explicitly requested |
| `--skip-verify` | Flag | Skip TLS verification for localhost |
| `--forward-to` | URL | Forward webhooks to API endpoint |

### Environment Variables

```bash
# Add to .env.example
# Stripe CLI device name (for webhook forwarding identification)
STRIPE_DEVICE_NAME=forgestack_dev
```

---

## Developer Workflow

### First-Time Setup

```bash
# 1. Start services with Stripe CLI profile
docker compose --profile dev up -d

# 2. View Stripe CLI logs to get webhook signing secret
docker compose logs -f stripe-cli

# Output:
# > Ready! Your webhook signing secret is whsec_xxxxx
# > (copy this value)

# 3. Update .env with the webhook secret
echo "STRIPE_WEBHOOK_SECRET=whsec_xxxxx" >> .env

# 4. Restart API to pick up new secret
pnpm dev
```

### Daily Development

```bash
# Start all services including Stripe CLI
docker compose --profile dev up -d

# Or start Stripe CLI separately
docker compose --profile dev up stripe-cli -d

# View webhook events in real-time
docker compose logs -f stripe-cli
```

### Testing Webhooks

```bash
# Trigger test events via Docker
docker compose exec stripe-cli stripe trigger checkout.session.completed
docker compose exec stripe-cli stripe trigger customer.subscription.created
docker compose exec stripe-cli stripe trigger customer.subscription.updated
docker compose exec stripe-cli stripe trigger invoice.paid
docker compose exec stripe-cli stripe trigger invoice.payment_failed
```

---

## Optional: CLI Wrapper Script

Create `bin/stripe` for convenient CLI access:

```bash
#!/usr/bin/env bash
# bin/stripe - Wrapper for Stripe CLI in Docker
docker compose exec stripe-cli stripe "$@"
```

Usage:
```bash
chmod +x bin/stripe
./bin/stripe customers list
./bin/stripe trigger payment_intent.succeeded
./bin/stripe logs tail
```

---

## Linux Compatibility

On Linux, `host.docker.internal` may not work by default. Add this to the service:

```yaml
stripe-cli:
  # ... other config
  extra_hosts:
    - "host.docker.internal:host-gateway"
```

---

## Implementation Checklist

- [ ] Update `docker-compose.yml` with stripe-cli service
- [ ] Add `STRIPE_DEVICE_NAME` to `.env.example`
- [ ] Create `bin/stripe` wrapper script (optional)
- [ ] Update README with webhook development section
- [ ] Test complete webhook flow end-to-end

---

## Estimated Effort

| Task | Time |
|------|------|
| Docker Compose updates | 10 min |
| Environment variable updates | 5 min |
| Documentation updates | 15 min |
| Testing | 15 min |
| **Total** | **~45 min** |

---

## Security Considerations

1. **API Key Exposure:** The Stripe secret key is passed to the container via environment variable. Ensure `.env` is in `.gitignore`.

2. **Webhook Secret Rotation:** The CLI generates a new webhook secret on each restart. This is only for local development; production uses a stable secret from Stripe Dashboard.

3. **Network Access:** The `host.docker.internal` DNS only allows the container to reach the host machine, not external networks.

---

## References

- [Stripe CLI Docker Image](https://hub.docker.com/r/stripe/stripe-cli)
- [Stripe CLI Documentation](https://docs.stripe.com/cli)
- [Stripe Webhooks Guide](https://docs.stripe.com/webhooks)
- [Using Stripe CLI with Docker Compose](https://akrabat.com/using-the-stripe-cli-with-with-docker-compose/)

---

## Decision

**Recommendation:** Proceed with Option 1 (Docker Compose Service) as it provides the best developer experience with minimal setup overhead and ensures consistency across the team.

