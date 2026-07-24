import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../components/button";
import { platformGlobals } from "../../.storybook/theme";
import { PageHeader } from "./page-header";

const meta = {
  title: "Patterns/PageHeader",
  component: PageHeader,
  globals: platformGlobals,
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    eyebrow: "Commerce",
    title: "Products",
    description: "Manage catalog for the active site.",
    actions: (
      <>
        <Button variant="secondary" size="sm">
          Import
        </Button>
        <Button size="sm">Add product</Button>
      </>
    ),
  },
};

export const TitleOnly: Story = {
  args: {
    title: "Products",
  },
};
