import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./empty-state";
import { Button } from "../button";
import { FileText, Users, Inbox } from "lucide-react";

const meta = {
  title: "Compound/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "No items found",
    description: "Get started by creating your first item.",
  },
};

export const WithIcon: Story = {
  args: {
    icon: <FileText className="h-6 w-6" />,
    title: "No documents",
    description: "You haven't created any documents yet.",
  },
};

export const WithAction: Story = {
  args: {
    icon: <Users className="h-6 w-6" />,
    title: "No team members",
    description: "Invite team members to collaborate on projects.",
    action: <Button>Invite Team Member</Button>,
  },
};

export const NoProjects: Story = {
  args: {
    icon: <Inbox className="h-6 w-6" />,
    title: "No projects yet",
    description:
      "Create your first project to get started with deployments and collaboration.",
    action: (
      <>
        <Button variant="outline" className="mr-2">
          Import Project
        </Button>
        <Button>Create Project</Button>
      </>
    ),
  },
};

export const WithoutDescription: Story = {
  args: {
    icon: <FileText className="h-6 w-6" />,
    title: "No results",
    action: <Button variant="outline">Clear Filters</Button>,
  },
};

