# Local Development with Custom Domains and Subdomains

**Status:** Proposal  
**Date:** 2025-12-02  
**Author:** ForgeStack Team

---

## Problem Statement

We need to split the application architecture so that different services run on separate subdomains, mirroring the production environment:

| Service | URL | Description |
|---------|-----|-------------|
| Marketing/Landing | `https://fg-test.com` | Public landing page |
| Web Application | `https://app.fg-test.com` | Protected app (Next.js) |
| API | `https://api.fg-test.com/api` | Backend API (NestJS) |

This proposal outlines how to achieve this in a **local development environment** with full HTTPS support and cross-subdomain authentication.

---

## 1. Is This Possible Locally?

✅ **YES** — Setting up custom domains with subdomains and HTTPS for local development is a well-established practice and fully supported.

The key components needed are:

1. **DNS resolution**: `/etc/hosts` or a local DNS resolver
2. **SSL certificates**: `mkcert` creates locally-trusted certificates
3. **Reverse proxy**: Caddy (recommended) or nginx
4. **App configuration**: Update environment variables for new URLs

---

## 2. Tools & Configuration Required

### A. DNS Resolution (`/etc/hosts`)

Add the following entries to `/etc/hosts`:

```bash
# ForgeStack Local Development
127.0.0.1 fg-test.com
127.0.0.1 app.fg-test.com
127.0.0.1 api.fg-test.com
```

**Location:**
- macOS/Linux: `/etc/hosts`
- Windows: `C:\Windows\System32\drivers\etc\hosts`

### B. SSL Certificates (`mkcert`)

[mkcert](https://github.com/FiloSottile/mkcert) creates locally-trusted development certificates that browsers accept without warnings.

```bash
# Install mkcert
brew install mkcert        # macOS
# or: choco install mkcert # Windows
# or: apt install mkcert   # Linux

# Install local CA (one-time setup)
mkcert -install

# Generate wildcard certificate for your domain
cd certs/
mkcert "fg-test.com" "*.fg-test.com"

# Creates:
#   - fg-test.com+1.pem      (certificate)
#   - fg-test.com+1-key.pem  (private key)
```

### C. Reverse Proxy (Caddy)

**Why Caddy over nginx?**
- Simpler configuration syntax
- Better automatic HTTPS handling
- Modern, actively maintained
- Single binary, easy to install

**Installation:**
```bash
brew install caddy  # macOS
# or download from https://caddyserver.com/download
```

**Caddyfile configuration:**

```caddyfile
# Caddyfile - Place in repository root

{
    # Disable automatic HTTPS (we use mkcert certs)
    auto_https off
}

# Marketing / Landing Page
fg-test.com {
    tls ./certs/fg-test.com+1.pem ./certs/fg-test.com+1-key.pem
    reverse_proxy localhost:3000
}

# Web Application
app.fg-test.com {
    tls ./certs/fg-test.com+1.pem ./certs/fg-test.com+1-key.pem
    reverse_proxy localhost:3001
}

# API Server
api.fg-test.com {
    tls ./certs/fg-test.com+1.pem ./certs/fg-test.com+1-key.pem
    reverse_proxy localhost:4000
}
```

**Running Caddy:**
```bash
caddy run --config Caddyfile
```

### D. Application Configuration Changes

Update environment variables to use the new URLs:

| Variable | Current Value | New Value |
|----------|---------------|-----------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://app.fg-test.com` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` | `https://api.fg-test.com/api/v1` |
| `BETTER_AUTH_URL` | `http://localhost:4000` | `https://api.fg-test.com` |

---

## 3. Authentication with `better-auth`

**better-auth has native support for cross-subdomain cookies!**

### Configuration

```typescript
// packages/auth/src/auth.ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // ... other config ...
  
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: ".fg-test.com", // Leading dot = all subdomains
    },
    useSecureCookies: true, // Required for HTTPS
  },
  
  trustedOrigins: [
    'https://fg-test.com',
    'https://app.fg-test.com',
    'https://api.fg-test.com',
  ],
});
```

### How It Works

| Setting | Purpose |
|---------|---------|
| `domain: ".fg-test.com"` | Cookie accessible on all `*.fg-test.com` subdomains |
| `useSecureCookies: true` | Sets `Secure` flag (required for HTTPS) |
| `trustedOrigins` | CORS + CSRF protection whitelist |

### Cookie Behavior

- **SameSite=Lax** (default) works across subdomains on the same parent domain
- User logs in at `app.fg-test.com` → cookie set on `.fg-test.com`
- API at `api.fg-test.com` can read the same cookie
- Marketing at `fg-test.com` can also read it (for showing logged-in state)

### Client Configuration

```typescript
// apps/web/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  // Cookies automatically shared across subdomains
});
```

---

## 4. Trade-offs Analysis

### Option A: Keep `localhost:PORT` (Current Approach)

| Pros | Cons |
|------|------|
| Zero setup required | Different from production |
| Works immediately | No cross-port cookie sharing |
| Simple debugging | No HTTPS locally |
| Familiar to all developers | Can't test subdomain auth |
| | CORS issues hidden until production |

### Option B: Custom Domains with HTTPS (Proposed)

| Pros | Cons |
|------|------|
| Mirrors production exactly | ~30-60 min initial setup |
| Test cross-subdomain auth | Need to run Caddy alongside apps |
| Catch cookie/CORS issues early | Team members need same setup |
| HTTPS everywhere | Slightly more complex debugging |
| Professional dev environment | Additional process to manage |
| Better security testing | |

---

## 5. Recommendation

### Decision: **Implement Custom Domains** ✅

**Rationale:**

1. **Production Parity**: ForgeStack is a multi-tenant SaaS with separate marketing/app domains — local dev should mirror this
2. **Auth Testing**: better-auth's cross-subdomain cookies need proper testing before production
3. **Early Issue Detection**: Catch cookie, CORS, and HTTPS issues during development, not after deployment
4. **One-Time Investment**: Setup cost (~1.5 hours) pays off throughout the project lifecycle

### Implementation Plan

| Step | Effort | Description |
|------|--------|-------------|
| 1. Setup script | 30 min | Create `scripts/setup-local-domains.sh` for hosts + mkcert |
| 2. Caddy config | 15 min | Create `Caddyfile` in repository root |
| 3. Env files | 15 min | Add `LOCAL_DOMAIN` config option to `.env.example` |
| 4. Auth config | 15 min | Update better-auth for cross-subdomain support |
| 5. Documentation | 15 min | Update README with setup instructions |
| **Total** | **~1.5 hrs** | One-time setup |

### Alternative: Docker Compose Approach

For teams using Docker, consider a `docker-compose.local.yml` that:
- Runs Caddy as a container with automatic certificate mounting
- Configures internal networking
- Provides one-command startup: `docker-compose -f docker-compose.local.yml up`

---

## 6. Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `scripts/setup-local-domains.sh` | Automated setup (hosts file, mkcert installation) |
| `Caddyfile` | Reverse proxy configuration |
| `certs/.gitkeep` | Directory for local certificates (gitignored) |
| `.env.local.example` | Local domain environment template |
| `docs/LOCAL_DEVELOPMENT.md` | Detailed setup instructions |

### Modified Files

| File | Changes |
|------|---------|
| `packages/auth/src/auth.ts` | Add `crossSubDomainCookies` configuration |
| `.env.example` | Add `LOCAL_DOMAIN` variable documentation |
| `.gitignore` | Add `certs/*.pem` to ignore generated certificates |
| `README.md` | Add link to local development docs |
| `apps/web/.env.example` | Update URL examples |
| `apps/api/.env.example` | Update URL examples |

---

## Appendix: Quick Start (After Implementation)

Once implemented, new developers can set up their environment with:

```bash
# 1. Run automated setup (adds hosts entries, installs mkcert)
./scripts/setup-local-domains.sh

# 2. Generate certificates
cd certs && mkcert "fg-test.com" "*.fg-test.com"

# 3. Copy environment file
cp .env.local.example .env.local

# 4. Start all services
pnpm dev          # Start Next.js + NestJS
caddy run         # Start reverse proxy (separate terminal)

# 5. Open in browser
open https://app.fg-test.com
```

---

## References

- [mkcert - GitHub](https://github.com/FiloSottile/mkcert)
- [Caddy Server](https://caddyserver.com/)
- [better-auth Cookies Documentation](https://www.better-auth.com/docs/concepts/cookies)
- [MDN: SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

