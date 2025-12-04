import type { Meta, StoryObj } from '@storybook/react';
import { PricingSection } from './pricing-section';

const meta = {
  title: 'Marketing/PricingSection',
  component: PricingSection,
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
} satisfies Meta<typeof PricingSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="marketing">
      <PricingSection />
    </div>
  ),
};

export const WithDarkBackground: Story = {
  render: () => (
    <div className="marketing bg-gradient-dark">
      <PricingSection />
    </div>
  ),
};

