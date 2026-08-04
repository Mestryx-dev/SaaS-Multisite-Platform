import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "./button";
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";

const meta = {
  title: "Components/Command",
  component: CommandDialog,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof CommandDialog>;

export default meta;
type Story = StoryObj<typeof CommandDialog>;

export const Palette: Story = {
  render: function Render() {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open command
        </Button>
        <CommandDialog open={open} onOpenChange={setOpen} title="Jump to page">
          <CommandInput placeholder="Jump to…" />
          <CommandList>
            <CommandGroup heading="Navigation">
              <CommandItem>Dashboard</CommandItem>
              <CommandItem>Products</CommandItem>
              <CommandItem>Orders</CommandItem>
            </CommandGroup>
            <CommandGroup heading="Actions">
              <CommandItem>Create product</CommandItem>
              <CommandItem>Invite member</CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </>
    );
  },
};
