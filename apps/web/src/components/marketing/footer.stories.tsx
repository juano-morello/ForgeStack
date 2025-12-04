import type { Meta, StoryObj } from '@storybook/react';
import { Footer } from './footer';

const meta = {
  title: 'Marketing/Footer',
  component: Footer,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0a0f' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="marketing">
      <div className="min-h-screen" />
      <Footer />
    </div>
  ),
};

export const Standalone: Story = {
  render: () => (
    <div className="marketing">
      <Footer />
    </div>
  ),
};

