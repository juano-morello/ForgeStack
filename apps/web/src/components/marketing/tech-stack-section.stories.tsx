import type { Meta, StoryObj } from '@storybook/react';
import { TechStackSection } from './tech-stack-section';

const meta = {
  title: 'Marketing/TechStackSection',
  component: TechStackSection,
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
} satisfies Meta<typeof TechStackSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="marketing">
      <TechStackSection />
    </div>
  ),
};

export const WithDarkBackground: Story = {
  render: () => (
    <div className="marketing bg-gradient-dark">
      <TechStackSection />
    </div>
  ),
};

export const WithContext: Story = {
  render: () => (
    <div className="marketing">
      {/* Show with some content above to demonstrate border-t */}
      <div className="py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Previous Section</h2>
        <p className="text-muted-foreground">
          This demonstrates how the tech stack section looks with content above it.
        </p>
      </div>
      <TechStackSection />
    </div>
  ),
};

