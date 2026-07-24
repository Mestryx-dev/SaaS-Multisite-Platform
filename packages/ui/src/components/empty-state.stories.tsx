import type { Meta, StoryObj } from "@storybook/react-vite";
import { Package, Plus, Search } from "lucide-react";
import { platformGlobals } from "../../.storybook/theme";
import { Button } from "./button";
import { EmptyState } from "./empty-state";

const meta = {
  title: "Components/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  globals: platformGlobals,
  parameters: { layout: "centered" },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: { children: "No items — create your first record to get started." },
};

export const WithCta: Story = {
  name: "With title + CTA",
  render: () => (
    <EmptyState
      className="w-80"
      title="No products yet"
      description="Add a product to start selling on this site."
      action={
        <Button type="button" size="sm">
          Create product
        </Button>
      }
    />
  ),
};

export const WithIcon: Story = {
  name: "With icon (Stalwart)",
  render: () => (
    <EmptyState
      className="w-96"
      variant="plain"
      icon={<Search />}
      title="No results"
      description="Your search did not yield any results."
      action={
        <Button type="button" size="sm">
          <Plus className="size-3.5" aria-hidden />
          Create a new item
        </Button>
      }
    />
  ),
};

export const CatalogEmpty: Story = {
  render: () => (
    <EmptyState
      className="w-96"
      icon={<Package />}
      title="No products yet"
      description="Add a product to start selling on this organization."
      action={
        <Button type="button" size="sm">
          Create product
        </Button>
      }
    />
  ),
};
