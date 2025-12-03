import type { Meta, StoryObj } from '@storybook/react';
import { Callout } from './callout';

const meta = {
  title: 'Docs/Callout',
  component: Callout,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    type: 'info',
    title: 'Information',
    children: 'This is an informational callout with helpful details.',
  },
};

export const Warning: Story = {
  args: {
    type: 'warning',
    title: 'Warning',
    children: 'This is a warning callout. Please pay attention to this.',
  },
};

export const Error: Story = {
  args: {
    type: 'error',
    title: 'Error',
    children: 'This is an error callout. Something went wrong.',
  },
};

export const Success: Story = {
  args: {
    type: 'success',
    title: 'Success',
    children: 'This is a success callout. Everything worked!',
  },
};

export const WithoutTitle: Story = {
  args: {
    type: 'info',
    children: 'This callout has no title, just content.',
  },
};

export const LongContent: Story = {
  args: {
    type: 'info',
    title: 'Getting Started',
    children:
      'This is a longer callout with multiple sentences. It demonstrates how the component handles more content. The callout should expand to fit the content while maintaining proper spacing and readability. You can include important information here that users need to know.',
  },
};

