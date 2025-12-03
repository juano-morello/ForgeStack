import type { Meta, StoryObj } from "@storybook/react";
import { ConfirmDialog } from "./confirm-dialog";
import { useState } from "react";
import { Button } from "../button";

const meta = {
  title: "Compound/ConfirmDialog",
  component: ConfirmDialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Are you sure?"
          description="This action cannot be undone."
          onConfirm={() => {
            console.log("Confirmed");
            setOpen(false);
          }}
        />
      </>
    );
  },
};

export const Destructive: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete Item
        </Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Delete item?"
          description="This will permanently delete the item. This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="destructive"
          onConfirm={() => {
            console.log("Item deleted");
            setOpen(false);
          }}
        />
      </>
    );
  },
};

export const CustomLabels: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Publish Changes</Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Publish changes?"
          description="This will make your changes visible to all users."
          confirmLabel="Publish"
          cancelLabel="Keep Editing"
          onConfirm={() => {
            console.log("Published");
            setOpen(false);
          }}
        />
      </>
    );
  },
};

export const LongDescription: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Delete Account</Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Delete your account?"
          description="This will permanently delete your account and all associated data. All your projects, deployments, and settings will be lost. This action cannot be undone and you will need to create a new account if you want to use the service again."
          confirmLabel="Delete Account"
          variant="destructive"
          onConfirm={() => {
            console.log("Account deleted");
            setOpen(false);
          }}
        />
      </>
    );
  },
};

