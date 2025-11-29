# Comprehensive Test Suites Specification

## Overview

This specification defines the testing strategy for ForgeStack, covering end-to-end browser testing and backend integration tests.

### Testing Strategy

| Layer | Tool | Target |
|-------|------|--------|
| E2E Browser | Playwright | Frontend user flows |
| API Integration | Jest + Supertest | Backend endpoints with real database |

### Key Principles

- **Playwright** for E2E browser testing across multiple browsers
- **Jest with real test database** for API integration tests
- **Test isolation** with database cleanup between tests
- **CI/CD pipeline integration** for automated testing

---

## Playwright E2E Tests

### Setup Requirements

#### Playwright Configuration
- **Browsers**: chromium, firefox, webkit
- **Base URL**: `http://localhost:3000`
- **API URL**: `http://localhost:4000`
- **Timeout**: 30 seconds per test
- **Retries**: 2 in CI, 0 locally

#### Test Infrastructure
- Test fixtures for authenticated user sessions
- Database seeding before test suites
- Screenshots captured on failure
- Video recording on first retry
- Trace collection for debugging

---

### Test Suites

#### 1. Authentication Flow

**File**: `tests/e2e/auth.spec.ts`

| Test Case | Description |
|-----------|-------------|
| should display login page | Verify login form renders correctly |
| should show validation errors for empty form | Submit empty form shows required field errors |
| should show error for invalid credentials | Wrong email/password shows error message |
| should login successfully with valid credentials | Valid credentials redirect to dashboard |
| should redirect to dashboard after login | Successful login lands on /dashboard |
| should display signup page | Verify signup form renders correctly |
| should show validation errors on signup | Empty/invalid signup fields show errors |
| should create account successfully | New user account creation works |
| should logout and redirect to login | Logout clears session and redirects |
| should redirect to login when accessing protected route | Unauthenticated access redirects to /login |

---

#### 2. Organization Flow

**File**: `tests/e2e/organizations.spec.ts`

| Test Case | Description |
|-----------|-------------|
| should display empty state when no orgs | Shows "Create your first organization" UI |
| should create new organization | Create org form works correctly |
| should display org in list after creation | New org appears in organization list |
| should switch between organizations | Org switcher changes active org context |
| should update organization name (owner only) | Owner can edit org settings |
| should delete organization (owner only) | Owner can delete org with confirmation |
| should show org selector in header | Header displays current org with dropdown |

---

#### 3. Project Flow

**File**: `tests/e2e/projects.spec.ts`

| Test Case | Description |
|-----------|-------------|
| should display empty state when no projects | Shows "Create your first project" UI |
| should create new project | Create project form works correctly |
| should display project in list | Project appears in project list |
| should view project details | Click project navigates to detail view |
| should edit project | Edit project form updates correctly |
| should delete project | Delete with confirmation removes project |
| should show validation errors | Invalid form submission shows errors |
| should paginate project list (if > 10) | Pagination controls work correctly |
| should search projects by name | Search filter returns matching projects |

---

#### 4. Protected Routes

**File**: `tests/e2e/protected-routes.spec.ts`

| Test Case | Description |
|-----------|-------------|
| should redirect /dashboard to /login when unauthenticated | Dashboard requires auth |
| should redirect /projects to /login when unauthenticated | Projects requires auth |
| should redirect /organizations to /login when unauthenticated | Organizations requires auth |
| should allow access when authenticated | All routes accessible with valid session |

---

#### 5. Error Handling

**File**: `tests/e2e/error-handling.spec.ts`

| Test Case | Description |
|-----------|-------------|
| should show 404 page for unknown routes | Invalid URLs show 404 page |
| should handle API errors gracefully | API failures show user-friendly errors |
| should show toast notifications for actions | Success/error toasts display correctly |

---

### Test Fixtures

```typescript
// fixtures/auth.ts
export const testUser = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  name: 'Test User',
};

// fixtures/org.ts
export const testOrg = {
  name: 'Test Organization',
};

// fixtures/project.ts
export const testProject = {
  name: 'Test Project',
  description: 'A test project description',
};
```

---

## Backend Integration Tests

### Setup Requirements

#### Test Database Configuration
- **Database Name**: `forgestack_test` (separate from development)
- **Cleanup Strategy**: Truncate tables between test suites
- **Connection**: Same pool configuration as production

#### Test Infrastructure
- **HTTP Client**: Supertest for real HTTP requests
- **Session Handling**: Cookie-based authentication
- **RLS Verification**: Test row-level security policies

---

### Test Suites

#### 1. Health Check

**File**: `test/integration/health.spec.ts`

| Test Case | Description |
|-----------|-------------|
| GET /health should return 200 with status ok | Basic health check endpoint |

---

#### 2. Authentication

**File**: `test/integration/auth.spec.ts`

| Test Case | Description |
|-----------|-------------|
| GET /auth/me without auth should return 401 | Unauthenticated request rejected |
| GET /auth/me with invalid token should return 401 | Invalid/expired token rejected |
| GET /auth/me with valid session should return user | Valid session returns user data |

---

#### 3. Organizations

**File**: `test/integration/organizations.spec.ts`

| Test Case | Description |
|-----------|-------------|
| POST /organizations should create org | Create organization with valid data |
| POST /organizations should add creator as OWNER | Creator gets OWNER role automatically |
| GET /organizations should return user's orgs | Returns only member organizations |
| GET /organizations should not return other user's orgs | RLS prevents cross-user access |
| GET /organizations/:id should return org details | Fetch single org by ID |
| GET /organizations/:id should return 404 for non-member | Non-members cannot access |
| PATCH /organizations/:id should update for OWNER | Owner can modify org |
| PATCH /organizations/:id should return 403 for MEMBER | Members cannot modify org |
| DELETE /organizations/:id should delete for OWNER | Owner can delete org |
| DELETE /organizations/:id should return 403 for MEMBER | Members cannot delete org |

---

#### 4. Projects

**File**: `test/integration/projects.spec.ts`

| Test Case | Description |
|-----------|-------------|
| POST /projects should create project in org | Create project with valid data |
| POST /projects without X-Org-Id should return 400 | Org context required |
| GET /projects should return org's projects | Returns projects in current org |
| GET /projects should not return other org's projects (RLS) | RLS prevents cross-org access |
| GET /projects should paginate correctly | Pagination params work |
| GET /projects should filter by search | Search query filters results |
| GET /projects/:id should return project | Fetch single project by ID |
| GET /projects/:id should return 404 for other org (RLS) | RLS blocks cross-org access |
| PATCH /projects/:id should update project | Update project with valid data |
| DELETE /projects/:id should require OWNER role | Only owners can delete |

---

#### 5. RLS Policy Tests

**File**: `test/integration/rls.spec.ts`

| Test Case | Description |
|-----------|-------------|
| User A cannot see User B's organizations | Cross-user org isolation |
| User A cannot see projects in org they're not member of | Cross-org project isolation |
| Setting wrong org context returns no rows | Invalid context returns empty |
| Direct SQL without context blocked by RLS | RLS enforced at database level |

---

## Acceptance Criteria

### Playwright Tests

- [ ] All auth flows pass
- [ ] All org flows pass
- [ ] All project flows pass
- [ ] Protected route redirects work
- [ ] Screenshots captured on failure
- [ ] Tests run in CI pipeline
- [ ] Tests complete in < 5 minutes

### Integration Tests

- [ ] All endpoints tested
- [ ] RLS policies verified
- [ ] Error responses validated
- [ ] Pagination tested
- [ ] Auth required on protected endpoints
- [ ] Tests use isolated test database
- [ ] Tests complete in < 2 minutes

---

## Implementation Tasks

### Playwright Setup

| # | Task | Command/Details |
|---|------|-----------------|
| 1 | Install Playwright | `pnpm add -D @playwright/test` |
| 2 | Create playwright.config.ts | Configure browsers, base URL, timeouts |
| 3 | Create test fixtures | Auth, org, project test data |
| 4 | Create page objects | Reusable selectors and actions |
| 5 | Set up global setup/teardown | Database seeding and cleanup |

### Playwright Test Files

| # | File | Purpose |
|---|------|---------|
| 1 | tests/e2e/auth.spec.ts | Authentication flow tests |
| 2 | tests/e2e/organizations.spec.ts | Organization management tests |
| 3 | tests/e2e/projects.spec.ts | Project CRUD tests |
| 4 | tests/e2e/protected-routes.spec.ts | Route protection tests |
| 5 | tests/e2e/error-handling.spec.ts | Error handling tests |

### Backend Integration Setup

| # | Task | Details |
|---|------|---------|
| 1 | Create test database config | forgestack_test database |
| 2 | Create test utilities for DB cleanup | Truncate tables helper |
| 3 | Create auth helpers for test sessions | Session/cookie helpers |
| 4 | Update jest config for integration tests | Separate integration config |

### Backend Integration Test Files

| # | File | Purpose |
|---|------|---------|
| 1 | test/integration/health.spec.ts | Health check endpoint |
| 2 | test/integration/auth.spec.ts | Auth endpoint tests |
| 3 | test/integration/organizations.spec.ts | Org endpoint tests |
| 4 | test/integration/projects.spec.ts | Project endpoint tests |
| 5 | test/integration/rls.spec.ts | RLS policy verification |

---

## File Structure

```
apps/web/
├── playwright.config.ts
├── tests/
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── organizations.spec.ts
│   │   ├── projects.spec.ts
│   │   ├── protected-routes.spec.ts
│   │   └── error-handling.spec.ts
│   ├── fixtures/
│   │   ├── auth.ts
│   │   ├── org.ts
│   │   └── project.ts
│   └── pages/
│       ├── login.page.ts
│       ├── signup.page.ts
│       ├── dashboard.page.ts
│       └── projects.page.ts

apps/api/
├── test/
│   ├── integration/
│   │   ├── health.spec.ts
│   │   ├── auth.spec.ts
│   │   ├── organizations.spec.ts
│   │   ├── projects.spec.ts
│   │   └── rls.spec.ts
│   └── utils/
│       ├── database.ts
│       ├── auth.ts
│       └── fixtures.ts
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm playwright install --with-deps
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: apps/web/playwright-report/

  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: forgestack_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm test:integration
```

---

## Notes

- E2E tests should run against a fully built production bundle
- Integration tests connect to real PostgreSQL test database
- Tests are designed to be parallelizable where possible
- Database state is reset between test suites to ensure isolation

