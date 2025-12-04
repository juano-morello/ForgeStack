import type { Meta, StoryObj } from '@storybook/react';
import { ChangePasswordDialog } from './change-password-dialog';
import { fn } from 'storybook/test';

const meta = {
  title: 'Settings/ChangePasswordDialog',
  component: ChangePasswordDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls whether the dialog is open',
    },
  },
  args: {
    onOpenChange: fn(),
  },
} satisfies Meta<typeof ChangePasswordDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
  },
};

export const Closed: Story = {
  args: {
    open: false,
  },
};

