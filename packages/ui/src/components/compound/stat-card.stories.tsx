import type { Meta, StoryObj } from "@storybook/react";
import { StatCard } from "./stat-card";
import { Users, DollarSign, Activity, TrendingUp } from "lucide-react";

const meta = {
  title: "Compound/StatCard",
  component: StatCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Total Revenue",
    value: "$45,231.89",
  },
};

export const WithIcon: Story = {
  args: {
    label: "Total Users",
    value: "2,350",
    icon: <Users className="h-6 w-6" />,
  },
};

export const WithUpTrend: Story = {
  args: {
    label: "Active Users",
    value: "1,234",
    trend: {
      value: 12.5,
      direction: "up",
    },
    icon: <Activity className="h-6 w-6" />,
  },
};

export const WithDownTrend: Story = {
  args: {
    label: "Bounce Rate",
    value: "23.4%",
    trend: {
      value: 5.2,
      direction: "down",
    },
    icon: <TrendingUp className="h-6 w-6" />,
  },
};

export const Revenue: Story = {
  args: {
    label: "Monthly Revenue",
    value: "$12,345",
    trend: {
      value: 8.3,
      direction: "up",
    },
    icon: <DollarSign className="h-6 w-6" />,
  },
};

export const LargeNumber: Story = {
  args: {
    label: "Total Requests",
    value: "1,234,567",
    trend: {
      value: 23.1,
      direction: "up",
    },
  },
};

