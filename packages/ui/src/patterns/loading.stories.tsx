import type { Meta, StoryObj } from "@storybook/react-vite";
import { platformGlobals, storefrontGlobals } from "../../.storybook/theme";
import { Button } from "../components/button";
import {
  FormSkeleton,
  LoadingBlock,
  LoadingOverlay,
  PageSkeleton,
  TableSkeleton,
} from "./loading";
import { TableFrame } from "./table-frame";

const meta = {
  title: "Patterns/Loading",
  globals: platformGlobals,
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Table: Story = {
  name: "TableSkeleton",
  render: () => (
    <div className="p-6">
      <TableFrame>
        <TableSkeleton rows={5} columns={4} />
      </TableFrame>
      <p className="mt-3 text-xs text-[var(--muted-foreground)]">
        Animations pause when prefers-reduced-motion is set.
      </p>
    </div>
  ),
};

export const Form: Story = {
  name: "FormSkeleton",
  render: () => (
    <div className="max-w-md p-6">
      <FormSkeleton fields={3} />
    </div>
  ),
};

export const Page: Story = {
  name: "PageSkeleton",
  render: () => (
    <div className="p-6">
      <PageSkeleton tableRows={4} />
    </div>
  ),
};

export const Block: Story = {
  name: "LoadingBlock",
  render: () => (
    <div className="p-6">
      <LoadingBlock label="Loading orders…" />
    </div>
  ),
};

export const Overlay: Story = {
  name: "LoadingOverlay",
  render: () => (
    <div className="relative mx-auto mt-8 h-48 max-w-md rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-sm text-[var(--muted-foreground)]">Panel content underneath</p>
      <Button size="sm" className="mt-2" disabled>
        Save
      </Button>
      <LoadingOverlay label="Saving…" />
    </div>
  ),
};

/** Dual-theme proof: same skeleton under Soft boutique tokens.
 * Prefer dedicated Storefront/Loading stories for Soft boutique splash + cart. */
export const StorefrontProof: Story = {
  name: "Storefront theme proof",
  globals: storefrontGlobals,
  render: () => (
    <div className="space-y-4 p-6">
      <p className="text-sm text-[var(--muted-foreground)]">
        See also <strong>Storefront/Loading</strong> for Soft boutique page splash,
        cart inline, and PLP grid skeleton.
      </p>
      <TableFrame>
        <TableSkeleton rows={3} columns={3} shimmer />
      </TableFrame>
    </div>
  ),
};
