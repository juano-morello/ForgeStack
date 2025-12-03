import type { Meta, StoryObj } from "@storybook/react";
import { PageHeader } from "./page-header";
import { Button } from "../button";

const meta = {
  title: "Compound/PageHeader",
  component: PageHeader,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Projects",
    description: "Manage your projects and deployments",
  },
};

export const WithActions: Story = {
  args: {
    title: "Projects",
    description: "Manage your projects and deployments",
    actions: (
      <>
        <Button variant="outline">Import</Button>
        <Button>New Project</Button>
      </>
    ),
  },
};

export const WithoutDescription: Story = {
  args: {
    title: "Dashboard",
    actions: <Button>Create</Button>,
  },
};

export const LongTitle: Story = {
  args: {
    title: "Project Management and Deployment Dashboard",
    description:
      "View, manage, and deploy all your projects from this central dashboard. Monitor performance, track deployments, and collaborate with your team.",
    actions: (
      <>
        <Button variant="outline">Settings</Button>
        <Button>New Project</Button>
      </>
    ),
  },
};

