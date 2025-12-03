import type { Meta, StoryObj } from '@storybook/react';
import { CTASection } from './cta-section';

const meta = {
  title: 'Marketing/CTASection',
  component: CTASection,
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
} satisfies Meta<typeof CTASection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="marketing">
      <CTASection />
    </div>
  ),
};

export const WithDarkBackground: Story = {
  render: () => (
    <div className="marketing bg-gradient-dark">
      <CTASection />
    </div>
  ),
};

