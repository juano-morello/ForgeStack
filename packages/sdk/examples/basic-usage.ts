/**
 * Basic Usage Example for ForgeStack SDK
 * 
 * This example demonstrates how to use the ForgeStack SDK
 * to interact with the ForgeStack API.
 */

import { ForgeStackClient } from '../src';

// Initialize the client
const client = new ForgeStackClient({
  baseUrl: 'https://api.forgestack.io/api/v1',
  accessToken: 'your-access-token',
  orgId: 'your-org-id',
  onError: (error) => {
    console.error('API Error:', error.message);
  },
});

async function main() {
  try {
    // List organizations
    console.log('Fetching organizations...');
    const orgs = await client.listOrganizations({ page: 1, limit: 10 });
    console.log(`Found ${orgs.total} organizations`);

    // Create a project
    console.log('\nCreating a new project...');
    const project = await client.createProject({
      name: 'My New Project',
      description: 'A sample project created via SDK',
    });
    console.log(`Created project: ${project.name} (${project.id})`);

    // List projects
    console.log('\nFetching projects...');
    const projects = await client.listProjects({ page: 1, limit: 10 });
    console.log(`Found ${projects.total} projects`);

    // Update the project
    console.log('\nUpdating project...');
    const updatedProject = await client.updateProject(project.id, {
      description: 'Updated description',
    });
    console.log(`Updated project: ${updatedProject.name}`);

    // Get dashboard summary
    console.log('\nFetching dashboard summary...');
    const dashboard = await client.getDashboardSummary();
    console.log(`Dashboard stats:`, dashboard.stats);

    // Create an API key
    console.log('\nCreating API key...');
    const apiKey = await client.createApiKey({
      name: 'SDK Test Key',
      scopes: ['projects:read', 'projects:write'],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    });
    console.log(`Created API key: ${apiKey.name} (${apiKey.keyPrefix}...)`);
    console.log(`Full key (save this!): ${apiKey.key}`);

    // List API keys
    console.log('\nFetching API keys...');
    const apiKeys = await client.listApiKeys();
    console.log(`Found ${apiKeys.total} API keys`);

    // Health check
    console.log('\nChecking API health...');
    const health = await client.healthCheck();
    console.log(`API status: ${health.status}`);

    // Clean up - delete the project
    console.log('\nCleaning up...');
    await client.deleteProject(project.id);
    console.log('Project deleted');

    // Revoke the API key
    await client.revokeApiKey(apiKey.id);
    console.log('API key revoked');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
main();

