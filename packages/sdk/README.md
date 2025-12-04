# @forgestack/sdk

TypeScript SDK for the ForgeStack API.

## Installation

```bash
npm install @forgestack/sdk
# or
pnpm add @forgestack/sdk
```

## Usage

```typescript
import { ForgeStackClient } from '@forgestack/sdk';

const client = new ForgeStackClient({
  baseUrl: 'https://api.forgestack.io/api/v1',
  accessToken: 'your-access-token',
  orgId: 'your-org-id',
});

// List projects
const { items: projects } = await client.listProjects();

// Create a project
const project = await client.createProject({
  name: 'My Project',
  description: 'A new project',
});
```

## Configuration

The SDK client accepts the following configuration options:

```typescript
interface ForgeStackConfig {
  baseUrl: string;           // API base URL
  apiKey?: string;           // API key for authentication
  accessToken?: string;      // Access token for authentication
  orgId?: string;            // Organization ID for multi-tenant requests
  onError?: (error: Error) => void; // Error handler callback
}
```

## API Reference

### Organizations

- `listOrganizations(params?)` - List all organizations
- `createOrganization(data)` - Create a new organization
- `getOrganization(id)` - Get organization by ID
- `updateOrganization(id, data)` - Update an organization
- `deleteOrganization(id)` - Delete an organization

### Projects

- `listProjects(params?)` - List all projects
- `createProject(data)` - Create a new project
- `getProject(id)` - Get project by ID
- `updateProject(id, data)` - Update a project
- `deleteProject(id)` - Delete a project

### API Keys

- `listApiKeys()` - List all API keys
- `createApiKey(data)` - Create a new API key
- `getApiKey(id)` - Get API key by ID
- `updateApiKey(id, data)` - Update an API key
- `revokeApiKey(id)` - Revoke an API key
- `rotateApiKey(id)` - Rotate an API key

### Dashboard

- `getDashboardSummary()` - Get dashboard summary

### Health

- `healthCheck()` - Check API health

### Context Management

- `setOrganization(orgId)` - Set the organization context
- `setAccessToken(token)` - Set the access token
- `setApiKey(apiKey)` - Set the API key

## Examples

### Using with Access Token

```typescript
const client = new ForgeStackClient({
  baseUrl: 'https://api.forgestack.io/api/v1',
  accessToken: 'your-access-token',
  orgId: 'org-123',
});

const projects = await client.listProjects({ page: 1, limit: 10 });
```

### Using with API Key

```typescript
const client = new ForgeStackClient({
  baseUrl: 'https://api.forgestack.io/api/v1',
  apiKey: 'fsk_your_api_key',
  orgId: 'org-123',
});

const project = await client.getProject('project-id');
```

### Error Handling

```typescript
const client = new ForgeStackClient({
  baseUrl: 'https://api.forgestack.io/api/v1',
  accessToken: 'your-access-token',
  onError: (error) => {
    console.error('API Error:', error.message);
  },
});

try {
  await client.createProject({ name: 'My Project' });
} catch (error) {
  // Handle error
}
```

### Switching Organizations

```typescript
const client = new ForgeStackClient({
  baseUrl: 'https://api.forgestack.io/api/v1',
  accessToken: 'your-access-token',
});

// Work with org 1
client.setOrganization('org-1');
const org1Projects = await client.listProjects();

// Switch to org 2
client.setOrganization('org-2');
const org2Projects = await client.listProjects();
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions for all API methods and responses.

```typescript
import type { Project, CreateProjectRequest } from '@forgestack/sdk';

const projectData: CreateProjectRequest = {
  name: 'My Project',
  description: 'A sample project',
};

const project: Project = await client.createProject(projectData);
```

## License

MIT

