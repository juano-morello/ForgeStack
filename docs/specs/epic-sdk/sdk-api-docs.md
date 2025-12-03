# SDK Generator & API Documentation

**Epic:** SDK  
**Priority:** Phase 5A  
**Depends on:** NestJS API with documented endpoints  
**Status:** Draft

---

## Overview

This specification defines the implementation of **OpenAPI/Swagger documentation** and **auto-generated TypeScript SDK** for ForgeStack. These tools enable developers to easily integrate with the ForgeStack API through interactive documentation and type-safe client libraries.

### Key Components

1. **OpenAPI/Swagger Integration** – Document all API endpoints using `@nestjs/swagger`
2. **Interactive Documentation** – Swagger UI and ReDoc for API exploration
3. **TypeScript SDK Generation** – Auto-generated client from OpenAPI spec
4. **SDK Package** – Publish-ready `packages/sdk` with typed API client

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      NestJS API (apps/api)                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Controllers with Swagger Decorators                        │ │
│  │  @ApiTags, @ApiOperation, @ApiResponse, @ApiBearerAuth      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  OpenAPI Spec Generation (@nestjs/swagger)                  │ │
│  │  - /api/docs      → Swagger UI                              │ │
│  │  - /api/redoc     → ReDoc                                   │ │
│  │  - /api/openapi.json → OpenAPI 3.0 spec                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼ Export spec
┌─────────────────────────────────────────────────────────────────┐
│                   SDK Generation Pipeline                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  openapi-typescript-codegen / @hey-api/openapi-ts           │ │
│  │  - Generate TypeScript types                                 │ │
│  │  - Generate API client class                                 │ │
│  │  - Generate request/response models                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     packages/sdk                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ ForgeStack   │  │   Types &    │  │   Auth & Error       │   │
│  │ Client Class │  │   Models     │  │   Helpers            │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Principles

- **Documentation as code** – API docs generated from decorators, always in sync
- **Type safety** – SDK provides full TypeScript types for all endpoints
- **Developer experience** – Interactive docs, auto-completion, and helpful error messages
- **Automation** – SDK regenerated automatically when API changes

---

## Acceptance Criteria

### OpenAPI/Swagger Setup
- [ ] `@nestjs/swagger` installed and configured in `apps/api`
- [ ] OpenAPI 3.0 spec generated from NestJS decorators
- [ ] Swagger UI served at `/api/docs`
- [ ] ReDoc served at `/api/redoc`
- [ ] OpenAPI JSON exported at `/api/openapi.json`
- [ ] API title, version, and description configured

### Controller Documentation
- [ ] All controllers decorated with `@ApiTags('tag-name')`
- [ ] All endpoints decorated with `@ApiOperation({ summary, description })`
- [ ] All endpoints decorated with `@ApiResponse` for success and error cases
- [ ] Protected endpoints decorated with `@ApiBearerAuth()`
- [ ] Path parameters decorated with `@ApiParam`
- [ ] Query parameters decorated with `@ApiQuery`

### DTO Documentation
- [ ] All DTO properties decorated with `@ApiProperty()`
- [ ] Property types, descriptions, and examples specified
- [ ] Optional properties marked with `required: false`
- [ ] Enum values documented
- [ ] Nested objects properly documented
- [ ] Array types documented with `type: 'array'` and `items`

### Authentication Documentation
- [ ] Bearer auth scheme documented in OpenAPI spec
- [ ] Security requirements applied to protected endpoints
- [ ] Auth error responses documented (401, 403)
- [ ] X-Org-Id header documented for multi-tenant endpoints

### SDK Package Structure
- [ ] `packages/sdk` directory created with proper package.json
- [ ] TypeScript client generated from OpenAPI spec
- [ ] All endpoint methods generated with proper types
- [ ] Request/response types exported
- [ ] Package ready for npm publish

### SDK Features
- [ ] Typed API client class (`ForgeStackClient`)
- [ ] All endpoints available as methods
- [ ] Proper error handling with typed errors
- [ ] Request/response interceptors support
- [ ] Authentication helpers (token management)
- [ ] Pagination helpers for list endpoints
- [ ] Base URL configuration

---

## Tasks & Subtasks

### 1. Install Swagger Dependencies
- [ ] Add `@nestjs/swagger` to `apps/api`
- [ ] Add `swagger-ui-express` for Swagger UI
- [ ] Verify dependencies work with current NestJS version

### 2. Configure OpenAPI in main.ts
- [ ] Create SwaggerModule configuration
- [ ] Set API title: "ForgeStack API"
- [ ] Set API version from package.json
- [ ] Set API description
- [ ] Add bearer auth security scheme
- [ ] Add X-Org-Id header parameter documentation
- [ ] Configure servers (development, production)

### 3. Set Up Documentation Routes
- [ ] Mount Swagger UI at `/api/docs`
- [ ] Mount ReDoc at `/api/redoc`
- [ ] Expose OpenAPI JSON at `/api/openapi.json`
- [ ] Add custom CSS/branding (optional)
- [ ] Configure Swagger UI options (persistAuthorization, etc.)

### 4. Document Existing Controllers
- [ ] Add `@ApiTags` to all controllers
- [ ] Add `@ApiOperation` to all endpoints
- [ ] Add `@ApiResponse` for 200, 201, 400, 401, 403, 404, 500
- [ ] Add `@ApiBearerAuth()` to protected controllers
- [ ] Document path parameters with `@ApiParam`
- [ ] Document query parameters with `@ApiQuery`

### 5. Document DTOs
- [ ] Add `@ApiProperty` to all DTO fields
- [ ] Add `description` for each property
- [ ] Add `example` values for Swagger UI
- [ ] Mark optional fields with `required: false`
- [ ] Document enum values
- [ ] Document nested types

### 6. Create SDK Package Structure
- [ ] Create `packages/sdk` directory
- [ ] Create `package.json` with name `@forgestack/sdk`
- [ ] Configure TypeScript with `tsconfig.json`
- [ ] Set up build scripts
- [ ] Configure exports in package.json

### 7. Set Up SDK Generation
- [ ] Install `@hey-api/openapi-ts` or `openapi-typescript-codegen`
- [ ] Create generation script in `packages/sdk`
- [ ] Configure generator to output to `src/generated`
- [ ] Generate types, client, and models
- [ ] Add generation to build pipeline

### 8. Create SDK Wrapper
- [ ] Create `ForgeStackClient` class wrapping generated client
- [ ] Add authentication helper methods
- [ ] Add error handling utilities
- [ ] Add pagination helpers
- [ ] Add request/response interceptors
- [ ] Export all public types

### 9. Build and Publish Scripts
- [ ] Add `build` script to compile TypeScript
- [ ] Add `generate` script to regenerate from spec
- [ ] Add `prepublish` script to ensure build
- [ ] Configure npm publish settings
- [ ] Add README.md with usage examples

---

## Test Plan

### Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Swagger UI loads at `/api/docs` | Returns 200 with HTML |
| ReDoc loads at `/api/redoc` | Returns 200 with HTML |
| OpenAPI JSON at `/api/openapi.json` | Returns valid OpenAPI 3.0 spec |
| OpenAPI spec includes all endpoints | All routes documented |
| DTOs have all properties documented | All fields in schema |
| Auth endpoints marked with security | Security requirements present |

### Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| SDK client can be instantiated | Client created with base URL |
| SDK client calls health endpoint | Returns health response |
| SDK client handles auth token | Token included in headers |
| SDK client handles pagination | Pagination params work |
| SDK client handles errors | Typed error responses |
| SDK types match API responses | No type mismatches |

### E2E Test Scenarios

| Scenario | Steps | Expected |
|----------|-------|----------|
| Access Swagger UI | Navigate to `/api/docs` | Interactive docs displayed |
| Try endpoint in Swagger | Use "Try it out" feature | Request succeeds with response |
| Access ReDoc | Navigate to `/api/redoc` | Beautiful docs displayed |
| Download OpenAPI spec | GET `/api/openapi.json` | Valid JSON spec |
| Use SDK in app | Import and call endpoint | Typed response returned |

---

## Implementation Notes

### Project Structure

```
apps/api/src/
├── main.ts                    # Swagger setup
├── swagger/
│   └── swagger.config.ts      # Swagger configuration
└── modules/
    └── */
        ├── *.controller.ts    # Decorated with @Api* decorators
        └── dto/
            └── *.dto.ts       # Decorated with @ApiProperty

packages/sdk/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Main exports
│   ├── client.ts             # ForgeStackClient wrapper
│   ├── generated/            # Auto-generated code
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── services/
│   │   └── models/
│   └── utils/
│       ├── auth.ts           # Auth helpers
│       ├── errors.ts         # Error handling
│       └── pagination.ts     # Pagination helpers
├── scripts/
│   └── generate.ts           # SDK generation script
└── README.md
```

### Swagger Configuration

```typescript
// apps/api/src/main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('ForgeStack API')
    .setDescription('Multi-tenant SaaS platform API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addApiKey(
      { type: 'apiKey', name: 'X-Org-Id', in: 'header' },
      'X-Org-Id',
    )
    .addServer('http://localhost:4000', 'Development')
    .addServer('https://api.forgestack.io', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Export OpenAPI JSON
  app.getHttpAdapter().get('/api/openapi.json', (req, res) => {
    res.json(document);
  });

  await app.listen(4000);
}
```

### Controller Decoration Example

```typescript
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  @Get()
  @ApiOperation({ summary: 'List all projects in organization' })
  @ApiResponse({ status: 200, description: 'Projects retrieved', type: [ProjectDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll() {}

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project found', type: ProjectDto })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id') id: string) {}
}
```

### DTO Decoration Example

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Project name',
    example: 'My Awesome Project',
    minLength: 1,
    maxLength: 255,
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Project description',
    example: 'A project for building awesome things',
  })
  description?: string;

  @ApiProperty({
    description: 'Project status',
    enum: ['active', 'archived', 'deleted'],
    example: 'active',
  })
  status: 'active' | 'archived' | 'deleted';
}
```

### SDK Generation Script

```typescript
// packages/sdk/scripts/generate.ts
import { createClient } from '@hey-api/openapi-ts';

async function generate() {
  await createClient({
    input: 'http://localhost:4000/api/openapi.json',
    output: './src/generated',
    client: 'fetch',
    types: {
      dates: 'types+transform',
    },
  });
}

generate();
```

### SDK Client Wrapper

```typescript
// packages/sdk/src/client.ts
import { client } from './generated';

export interface ForgeStackConfig {
  baseUrl: string;
  token?: string;
  orgId?: string;
}

export class ForgeStackClient {
  constructor(private config: ForgeStackConfig) {
    client.setConfig({
      baseUrl: config.baseUrl,
    });

    if (config.token) {
      this.setToken(config.token);
    }

    if (config.orgId) {
      this.setOrgId(config.orgId);
    }
  }

  setToken(token: string) {
    client.interceptors.request.use((req) => {
      req.headers.set('Authorization', `Bearer ${token}`);
      return req;
    });
  }

  setOrgId(orgId: string) {
    client.interceptors.request.use((req) => {
      req.headers.set('X-Org-Id', orgId);
      return req;
    });
  }

  // Re-export all generated services
  get projects() { return projectsService; }
  get organizations() { return organizationsService; }
  get users() { return usersService; }
}
```

### SDK Package.json

```json
{
  "name": "@forgestack/sdk",
  "version": "0.1.0",
  "description": "TypeScript SDK for ForgeStack API",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "generate": "tsx scripts/generate.ts",
    "prepublishOnly": "npm run generate && npm run build"
  },
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "peerDependencies": {},
  "devDependencies": {
    "@hey-api/openapi-ts": "^0.x",
    "tsup": "^8.x",
    "tsx": "^4.x",
    "typescript": "^5.x"
  }
}
```

### ReDoc Setup (Alternative to Swagger UI)

```typescript
// Option 1: Using redoc-express
import * as redoc from 'redoc-express';

app.use('/api/redoc', redoc({
  title: 'ForgeStack API',
  specUrl: '/api/openapi.json',
}));

// Option 2: Simple HTML redirect
app.getHttpAdapter().get('/api/redoc', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>ForgeStack API - ReDoc</title></head>
      <body>
        <redoc spec-url="/api/openapi.json"></redoc>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
      </body>
    </html>
  `);
});
```

---

## Dependencies

- **@nestjs/swagger** – OpenAPI/Swagger integration for NestJS
- **swagger-ui-express** – Swagger UI middleware
- **@hey-api/openapi-ts** – TypeScript SDK generator (or openapi-typescript-codegen)
- **tsup** – TypeScript bundler for SDK package
- **NestJS API with controllers** – Must have endpoints to document

---

## Deliverables

1. ✅ Swagger UI accessible at `/api/docs`
2. ✅ ReDoc accessible at `/api/redoc`
3. ✅ OpenAPI 3.0 spec at `/api/openapi.json`
4. ✅ `packages/sdk` with generated TypeScript client
5. ✅ SDK build and publish scripts
6. ✅ All existing endpoints documented
7. ✅ All DTOs documented with examples

---

## Security Considerations

1. **API key exposure** – Swagger UI should not persist tokens in production
2. **Production access** – Consider disabling Swagger UI in production or adding auth
3. **Sensitive fields** – Mark sensitive DTO fields with `@ApiHideProperty()`
4. **Rate limiting** – Document rate limit headers in responses
5. **CORS** – SDK requests must respect CORS configuration

---

## Future Enhancements (Out of Scope)

- Multiple SDK languages (Python, Go, Ruby)
- API versioning in OpenAPI spec
- Webhook event documentation
- GraphQL schema generation
- SDK auto-publish on API changes
- Changelog generation from spec diffs

---

*End of spec*

