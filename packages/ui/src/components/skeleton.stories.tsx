import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./skeleton";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    variant: { control: "select", options: ["pulse", "shimmer"] },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Lines: Story = {
  render: () => (
    <div className="max-w-sm space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
};

export const Card: Story = {
  render: () => (
    <div className="w-64 space-y-3 rounded-[var(--radius)] border border-[var(--border)] p-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
};

export const Shimmer: Story = {
  render: () => (
    <div className="max-w-sm space-y-2">
      <Skeleton variant="shimmer" className="h-4 w-3/4" />
      <Skeleton variant="shimmer" className="h-4 w-full" />
      <Skeleton variant="shimmer" className="h-10 w-full" />
    </div>
  ),
};
