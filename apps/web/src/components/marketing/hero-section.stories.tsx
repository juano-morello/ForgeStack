import type { Meta, StoryObj } from '@storybook/react';
import { HeroSection } from './hero-section';

const meta = {
  title: 'Marketing/HeroSection',
  component: HeroSection,
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
} satisfies Meta<typeof HeroSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="marketing">
      <HeroSection />
    </div>
  ),
};

export const WithNavigation: Story = {
  render: () => (
    <div className="marketing">
      <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border" />
      <HeroSection />
    </div>
  ),
};

