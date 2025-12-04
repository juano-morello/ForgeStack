import type { Meta, StoryObj } from '@storybook/react';
import { MarketingNav } from './marketing-nav';

const meta = {
  title: 'Marketing/MarketingNav',
  component: MarketingNav,
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
} satisfies Meta<typeof MarketingNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="marketing min-h-screen">
      <MarketingNav />
      <div className="pt-32 px-4 text-center">
        <h1 className="text-4xl font-bold">Scroll to see nav background change</h1>
        <div className="h-[200vh]" />
      </div>
    </div>
  ),
};

export const Scrolled: Story = {
  render: () => (
    <div className="marketing min-h-screen">
      <MarketingNav />
      <div className="pt-32 px-4 text-center">
        <h1 className="text-4xl font-bold">Navigation with scrolled state</h1>
      </div>
    </div>
  ),
};

