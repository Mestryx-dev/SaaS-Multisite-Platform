import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScrollArea } from "./scroll-area";

const meta = {
  title: "Components/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof ScrollArea>;

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-40 w-64 rounded-[var(--radius)] border border-[var(--border)] p-3">
      <div className="space-y-2 text-sm">
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i}>Nav item {i + 1}</p>
        ))}
      </div>
    </ScrollArea>
  ),
};
