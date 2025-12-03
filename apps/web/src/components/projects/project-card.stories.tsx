import type { Meta, StoryObj } from '@storybook/react';
import { ProjectCard } from './project-card';

const meta: Meta<typeof ProjectCard> = {
  title: 'Projects/ProjectCard',
  component: ProjectCard,
  tags: ['autodocs'],
  argTypes: {
    onEdit: { action: 'edit clicked' },
    onDelete: { action: 'delete clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectCard>;

export const Default: Story = {
  args: {
    project: {
      id: '1',
      orgId: 'org-1',
      name: 'My Project',
      description: 'A sample project description',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
};

export const WithLongDescription: Story = {
  args: {
    project: {
      id: '2',
      orgId: 'org-1',
      name: 'Project With Long Description',
      description:
        'This is a very long project description that should be truncated when displayed in the card. It contains multiple sentences to demonstrate how the component handles overflow text gracefully.',
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
};

export const NoDescription: Story = {
  args: {
    project: {
      id: '3',
      orgId: 'org-1',
      name: 'Project Without Description',
      description: null,
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date('2024-01-01').toISOString(),
    },
  },
};

export const WithActions: Story = {
  args: {
    project: {
      id: '4',
      orgId: 'org-1',
      name: 'Editable Project',
      description: 'This project has edit and delete actions enabled',
      createdAt: new Date('2024-02-01').toISOString(),
      updatedAt: new Date('2024-02-15').toISOString(),
    },
    // Actions are defined in argTypes above
  },
};

export const RecentlyUpdated: Story = {
  args: {
    project: {
      id: '5',
      orgId: 'org-1',
      name: 'Recently Updated',
      description: 'This project was recently modified',
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
};

