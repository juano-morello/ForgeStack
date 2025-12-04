import type { Meta, StoryObj } from '@storybook/react';
import { CodeBlock } from './code-block';

const meta = {
  title: 'Docs/CodeBlock',
  component: CodeBlock,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const bashCode = `npm install @forgestack/sdk
pnpm add @forgestack/sdk
yarn add @forgestack/sdk`;

const typescriptCode = `import { ForgeStackClient } from '@forgestack/sdk';

const client = new ForgeStackClient({
  apiKey: process.env.FORGESTACK_API_KEY,
  organizationId: process.env.FORGESTACK_ORG_ID,
});

const projects = await client.projects.list();`;

const jsonCode = `{
  "name": "My Project",
  "description": "A new project",
  "settings": {
    "public": true,
    "features": ["webhooks", "api-keys"]
  }
}`;

export const Bash: Story = {
  args: {
    language: 'bash',
    children: bashCode,
  },
};

export const TypeScript: Story = {
  args: {
    language: 'typescript',
    children: typescriptCode,
  },
};

export const JSON: Story = {
  args: {
    language: 'json',
    children: jsonCode,
  },
};

export const WithoutLanguage: Story = {
  args: {
    children: 'This is a code block without a language specified.',
  },
};

export const LongCode: Story = {
  args: {
    language: 'typescript',
    children: `import { ForgeStackClient } from '@forgestack/sdk';

const client = new ForgeStackClient({
  apiKey: process.env.FORGESTACK_API_KEY,
  organizationId: process.env.FORGESTACK_ORG_ID,
});

async function getAllProjects() {
  let page = 1;
  let hasMore = true;
  const allProjects = [];

  while (hasMore) {
    const response = await client.projects.list({ page, limit: 20 });
    allProjects.push(...response.data);
    hasMore = page < response.pagination.totalPages;
    page++;
  }

  return allProjects;
}

const projects = await getAllProjects();
console.log(\`Found \${projects.length} projects\`);`,
  },
};

