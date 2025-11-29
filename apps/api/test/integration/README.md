# Backend Integration Tests

This directory contains integration tests that verify Row-Level Security (RLS) policies work correctly with a real PostgreSQL database connection.

## Purpose

These tests ensure that:
- Users can only see data in their own organization
- Users cannot access data from other organizations  
- RLS policies block unauthorized access at the database level
- Cross-tenant isolation is enforced

## Prerequisites

### 1. PostgreSQL Database

You need a running PostgreSQL database. The tests will use the `DATABASE_URL` environment variable.

```bash
# Example DATABASE_URL
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/forgestack_dev"
```

### 2. Apply Migrations

**IMPORTANT**: The RLS policies must be applied to the database before running these tests.

```bash
# From the repository root
cd packages/db
pnpm db:migrate
```

This will apply all migrations including:
- Schema creation (tables, columns, constraints)
- RLS enablement on org-scoped tables
- RLS policy definitions

## Running the Tests

### Run Integration Tests

```bash
# From apps/api directory
pnpm test:integration

# Or from repository root
cd apps/api && pnpm test:integration
```

### Run with Database URL

If `DATABASE_URL` is not set in your environment, you can provide it inline:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/forgestack_dev" pnpm test:integration
```

### Skip Tests Without Database

If `DATABASE_URL` is not set, the tests will be automatically skipped with a warning message. This allows the test suite to run in CI environments where a database might not be available.

## Test Structure

### `setup.ts`

Contains utilities for:
- Setting up test database with two users in two separate organizations
- Creating test data (users, organizations, projects)
- Cleaning up all test data after tests complete

### `rls.integration.spec.ts`

Contains test suites for:
- **RLS Setup Verification**: Verifies RLS is enabled on all org-scoped tables
- **Projects RLS**: Tests project access control across organizations
- **Organization Members RLS**: Tests member visibility across organizations
- **Cross-tenant Isolation**: Tests complete data isolation between organizations

## Test Data

Each test run creates:
- **User A** with **Organization A** (User A is OWNER)
- **User B** with **Organization B** (User B is OWNER)

This setup allows testing cross-tenant isolation by attempting to access Organization B's data while authenticated as User A.

## Troubleshooting

### RLS Not Enabled Error

If you see an error like:
```
❌ RLS is not enabled on all tables!
```

**Solution**: Run migrations to enable RLS:
```bash
cd packages/db && pnpm db:migrate
```

### Connection Errors

If you see database connection errors:
1. Verify PostgreSQL is running
2. Check `DATABASE_URL` is correct
3. Verify database exists
4. Check user has proper permissions

### Tests Hanging

If tests don't exit after completion:
- This usually indicates open database connections
- The cleanup function should close all connections
- Check for any async operations that aren't being awaited

## CI/CD Integration

These tests are designed to run in CI/CD pipelines with a PostgreSQL service container:

```yaml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_DB: forgestack_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - 5432:5432
```

## Related Documentation

- [RLS Policies Spec](../../../../docs/specs/epic-db/rls-policies.md)
- [Comprehensive Tests Spec](../../../../docs/specs/epic-testing/comprehensive-tests.md)
- [Database Package](../../../../packages/db/README.md)

