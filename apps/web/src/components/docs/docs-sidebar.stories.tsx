import type { Meta, StoryObj } from '@storybook/react';
import { DocsSidebar } from './docs-sidebar';

const meta = {
  title: 'Docs/DocsSidebar',
  component: DocsSidebar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DocsSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

