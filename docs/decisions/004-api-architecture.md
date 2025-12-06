# ADR-004: NestJS with REST API Architecture

## Status
Accepted

## Context

ForgeStack requires a robust backend API that:
1. Handles authentication and authorization
2. Implements multi-tenant data isolation
3. Provides CRUD operations for resources
4. Integrates with external services (Stripe, Resend, R2)
5. Supports background job queuing
6. Provides observability (logging, tracing, metrics)
7. Is type-safe and maintainable
8. Scales to handle production workloads

We needed to choose a backend framework and API architecture that balances developer experience, performance, and ecosystem maturity.

## Decision

We chose **NestJS** with a **REST API** architecture.

### Framework: NestJS

NestJS provides:
- **Modular architecture** with dependency injection
- **TypeScript-first** design
- **Decorator-based** routing and validation
- **Extensive ecosystem** of integrations
- **Built-in support** for guards, interceptors, pipes, filters

### API Style: REST

REST provides:
- **Standard HTTP methods** (GET, POST, PATCH, DELETE)
- **Resource-based URLs** (`/api/v1/projects/:id`)
- **Stateless** communication
- **Cacheable** responses
- **Wide tooling support** (Postman, curl, OpenAPI)

### Architecture Patterns

**1. Guard Pattern for Authorization:**
```typescript
@Controller('projects')
@UseGuards(TenantContextGuard)
export class ProjectsController {
  @Get()
  @RequirePermission('projects:read')
  async list(@TenantCtx() ctx: TenantContext) {
    return this.projectsService.list(ctx);
  }
}
```

**2. Interceptor Pattern for Cross-Cutting Concerns:**
```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const start = Date.now();
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        logger.info({ duration }, 'Request completed');
      })
    );
  }
}
```

**3. Service Layer for Business Logic:**
```typescript
@Injectable()
export class ProjectsService {
  async create(ctx: TenantContext, dto: CreateProjectDto) {
    return withTenantContext(ctx, async (tx) => {
      const [project] = await tx.insert(projects).values({
        ...dto,
        organizationId: ctx.orgId,
        createdBy: ctx.userId,
      }).returning();
      
      // Queue activity log
      await this.queueService.add('activity', {
        action: 'project.created',
        projectId: project.id,
      });
      
      return project;
    });
  }
}
```

**4. DTO Pattern for Validation:**
```typescript
export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
  
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
```

## Consequences

### Positive

1. **Type Safety**: Full TypeScript support
   - Compile-time type checking
   - IntelliSense in IDEs
   - Refactoring safety

2. **Developer Experience**: Excellent DX
   - Decorators reduce boilerplate
   - Dependency injection simplifies testing
   - CLI for code generation
   - Hot reload in development

3. **Modularity**: Clean code organization
   - Each feature is a module
   - Clear separation of concerns
   - Easy to add/remove features

4. **Validation**: Built-in request validation
   - class-validator decorators
   - Automatic error responses
   - Type-safe DTOs

5. **Testing**: Easy to test
   - Dependency injection enables mocking
   - Built-in testing utilities
   - Integration test support

6. **Ecosystem**: Rich ecosystem
   - Many official packages (@nestjs/*)
   - Community packages
   - Well-documented patterns

7. **REST Benefits**: Standard, well-understood
   - Easy to consume from any client
   - Excellent tooling (Postman, Swagger)
   - Cacheable with HTTP caching
   - Works with CDNs

8. **OpenAPI**: Automatic API documentation
   - Swagger UI out of the box
   - Type-safe SDK generation
   - Always up-to-date docs

### Negative

1. **Learning Curve**: Steeper than Express
   - Decorators can be confusing
   - Dependency injection concepts
   - Module system complexity

2. **Boilerplate**: More code than minimal frameworks
   - Need modules, controllers, services
   - More files per feature
   - Mitigated by CLI generators

3. **REST Limitations**: Not ideal for all use cases
   - Over-fetching/under-fetching data
   - Multiple round trips for related data
   - No real-time subscriptions (need WebSockets)

4. **Bundle Size**: Larger than minimal frameworks
   - More dependencies
   - Longer cold starts
   - Acceptable for most deployments

## Alternatives Considered

### 1. tRPC

**Pros:**
- End-to-end type safety
- No code generation
- Excellent DX for TypeScript monorepos
- Automatic client generation

**Cons:**
- **TypeScript-only**: Can't consume from non-TS clients
- **Monorepo coupling**: Tight coupling between frontend and backend
- **Limited ecosystem**: Fewer integrations
- **Non-standard**: Not REST, harder for external consumers
- **SDK generation**: Harder to provide public SDK

**Rejected because:** While tRPC is excellent for internal APIs, ForgeStack needs to provide a public SDK for external consumption. REST is more standard and accessible.

### 2. GraphQL (with NestJS)

**Pros:**
- Flexible queries
- Single endpoint
- Strong typing with schema
- Efficient data fetching

**Cons:**
- **Complexity**: Schema definition + resolvers
- **Caching**: Harder to cache than REST
- **Learning curve**: Steeper for developers
- **Tooling**: More complex setup
- **Over-engineering**: Overkill for CRUD operations

**Rejected because:** GraphQL adds significant complexity for minimal benefit in a CRUD-heavy SaaS application. REST is simpler and more than sufficient.

### 3. Express.js

**Pros:**
- Minimal, flexible
- Huge ecosystem
- Well-known
- Fast

**Cons:**
- **No structure**: Need to build architecture from scratch
- **No TypeScript-first**: Types are afterthought
- **No DI**: Manual dependency management
- **No validation**: Need to add manually
- **Boilerplate**: More code for common patterns

**Rejected because:** Too low-level. Would need to build many features that NestJS provides out of the box.

### 4. Fastify (with NestJS)

**Pros:**
- Faster than Express
- Schema-based validation
- Plugin ecosystem

**Cons:**
- **Smaller ecosystem**: Fewer packages than Express
- **NestJS support**: Less mature than Express adapter
- **Migration effort**: Would need to migrate later

**Note:** NestJS supports Fastify as an alternative to Express. We could switch later if performance becomes critical.

**Rejected for now because:** Express is the default and well-supported. Fastify can be adopted later if needed.

### 5. Hono

**Pros:**
- Ultra-fast
- Edge-compatible
- Small bundle size
- TypeScript-first

**Cons:**
- **New framework**: Less mature
- **Smaller ecosystem**: Fewer integrations
- **No NestJS integration**: Would need custom architecture
- **Limited patterns**: Need to build DI, guards, etc.

**Rejected because:** Too new and would require building too much infrastructure ourselves.

## Implementation Notes

### Creating a New Module

```bash
# Generate module, controller, service
nest g module tasks
nest g controller tasks
nest g service tasks

# Generate with spec files
nest g module tasks --spec
nest g controller tasks --spec
nest g service tasks --spec
```

### Module Structure

```
tasks/
├── tasks.module.ts       # Module definition
├── tasks.controller.ts   # HTTP endpoints
├── tasks.service.ts      # Business logic
├── tasks.repository.ts   # Database access (optional)
├── dto/
│   ├── create-task.dto.ts
│   ├── update-task.dto.ts
│   └── task-response.dto.ts
└── __tests__/
    ├── tasks.controller.spec.ts
    └── tasks.service.spec.ts
```

### REST Endpoint Conventions

```typescript
@Controller('api/v1/tasks')
export class TasksController {
  // List: GET /api/v1/tasks
  @Get()
  list(@Query() query: ListTasksDto) {}
  
  // Create: POST /api/v1/tasks
  @Post()
  create(@Body() dto: CreateTaskDto) {}
  
  // Get: GET /api/v1/tasks/:id
  @Get(':id')
  get(@Param('id') id: string) {}
  
  // Update: PATCH /api/v1/tasks/:id
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {}
  
  // Delete: DELETE /api/v1/tasks/:id
  @Delete(':id')
  delete(@Param('id') id: string) {}
}
```

### Error Handling

```typescript
// Use built-in HTTP exceptions
throw new NotFoundException('Task not found');
throw new BadRequestException('Invalid task data');
throw new UnauthorizedException('Not authorized');
throw new ForbiddenException('Insufficient permissions');

// Custom exception filter
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    
    // Log error
    logger.error({ exception }, 'Unhandled exception');
    
    // Return formatted error
    response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
    });
  }
}
```

## References

- [NestJS Documentation](https://docs.nestjs.com/)
- [REST API Best Practices](https://restfulapi.net/)
- [OpenAPI Specification](https://swagger.io/specification/)

