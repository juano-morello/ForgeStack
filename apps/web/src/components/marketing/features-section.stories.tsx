import type { Meta, StoryObj } from '@storybook/react';
import { FeaturesSection } from './features-section';

const meta = {
  title: 'Marketing/FeaturesSection',
  component: FeaturesSection,
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
} satisfies Meta<typeof FeaturesSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="marketing">
      <FeaturesSection />
    </div>
  ),
};

export const WithDarkBackground: Story = {
  render: () => (
    <div className="marketing bg-gradient-dark">
      <FeaturesSection />
    </div>
  ),
};

export const WithGridBackground: Story = {
  render: () => (
    <div className="marketing bg-grid">
      <FeaturesSection />
    </div>
  ),
};

