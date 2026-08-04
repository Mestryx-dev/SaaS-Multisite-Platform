import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const meta = {
  title: "Components/Popover",
  component: Popover,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Filters</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm font-medium">Quick filters</p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Decision: shared — harvest for PLP / admin toolbars.
        </p>
      </PopoverContent>
    </Popover>
  ),
};
