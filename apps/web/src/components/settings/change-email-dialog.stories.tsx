import type { Meta, StoryObj } from '@storybook/react';
import { ChangeEmailDialog } from './change-email-dialog';
import { fn } from 'storybook/test';

const meta = {
  title: 'Settings/ChangeEmailDialog',
  component: ChangeEmailDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls whether the dialog is open',
    },
    currentEmail: {
      control: 'text',
      description: 'Current email address of the user',
    },
  },
  args: {
    onOpenChange: fn(),
  },
} satisfies Meta<typeof ChangeEmailDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    currentEmail: 'user@example.com',
  },
};

export const Closed: Story = {
  args: {
    open: false,
    currentEmail: 'user@example.com',
  },
};

export const LongEmail: Story = {
  args: {
    open: true,
    currentEmail: 'very.long.email.address@subdomain.example.com',
  },
};

