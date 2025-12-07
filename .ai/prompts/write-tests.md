# Write Tests Prompt Template

## Prompt

```
I need to write tests for [COMPONENT/SERVICE/FUNCTION].

Context:
- File location: [FILE_PATH]
- Type: [unit/integration/e2e]
- Framework: [Jest/Vitest/Playwright]

Requirements:
1. [List what needs to be tested]
2. [Edge cases to cover]
3. [Mocking requirements]

Please follow ForgeStack testing patterns in .ai/conventions.md.
Read existing tests in the same directory for reference.
```

## Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `COMPONENT/SERVICE/FUNCTION` | What to test | `ProjectsService`, `useProjects hook`, `login page` |
| `FILE_PATH` | Path to source file | `apps/api/src/projects/projects.service.ts` |
| `TYPE` | Test type | `unit`, `integration`, `e2e` |
| `FRAMEWORK` | Testing framework | API: Jest, Web: Vitest, E2E: Playwright |

## Test File Locations

| Source | Test File |
|--------|-----------|
| `apps/api/src/**/*.ts` | `apps/api/src/**/*.spec.ts` (same dir) |
| `apps/web/src/**/*.tsx` | `apps/web/src/**/*.test.tsx` (same dir) |
| `apps/web/e2e/` | Playwright E2E tests |
| `packages/db/src/**/*.ts` | `packages/db/src/**/*.test.ts` |

## Example: Testing a Service

```
I need to write tests for UsageTrackingService.

Context:
- File location: apps/api/src/usage/usage-tracking.service.ts
- Type: unit
- Framework: Jest

Requirements:
1. Test trackApiCall() increments Redis counter
2. Test trackStorage() updates storage usage
3. Test getUsageSummary() aggregates data correctly
4. Edge cases: Redis connection failure, empty data
5. Mock: Redis client, ConfigService

Please follow ForgeStack testing patterns in .ai/conventions.md.
```

## Example: Testing a React Component

```
I need to write tests for ProjectCard component.

Context:
- File location: apps/web/src/components/projects/project-card.tsx
- Type: unit
- Framework: Vitest + Testing Library

Requirements:
1. Renders project name and description
2. Shows edit/delete buttons for owners
3. Calls onEdit/onDelete callbacks
4. Edge cases: long text, missing description

Please follow ForgeStack testing patterns in .ai/conventions.md.
Read apps/web/src/test/utils.tsx for test utilities.
```

## Example: E2E Test

```
I need to write E2E tests for the organization creation flow.

Context:
- File location: apps/web/e2e/organizations.spec.ts
- Type: e2e
- Framework: Playwright

Requirements:
1. User can navigate to create org page
2. Form validation shows errors
3. Successful creation redirects to dashboard
4. New org appears in org selector

Please use fixtures from apps/web/e2e/fixtures.ts.
```

## Testing Patterns Reference

### API Unit Test (Jest)
```typescript
describe('ProjectsService', () => {
  let service: ProjectsService;
  let repository: jest.Mocked<ProjectsRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: ProjectsRepository, useValue: mockRepository },
      ],
    }).compile();
    service = module.get(ProjectsService);
  });

  it('should create project', async () => {
    repository.create.mockResolvedValue(mockProject);
    const result = await service.create(mockCtx, mockDto);
    expect(result).toEqual(mockProject);
  });
});
```

### React Component Test (Vitest)
```typescript
describe('ProjectCard', () => {
  it('renders project info', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText(mockProject.name)).toBeInTheDocument();
  });
});
```

### E2E Test (Playwright)
```typescript
test('can create organization', async ({ page }) => {
  await page.goto('/organizations/new');
  await page.fill('[name="name"]', 'Test Org');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

