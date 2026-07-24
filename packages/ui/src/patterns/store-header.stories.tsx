import type { Meta, StoryObj } from "@storybook/react-vite";
import { storefrontGlobals } from "../../.storybook/theme";
import { StoreHeader } from "./storefront";

const meta = {
  title: "Storefront/Header",
  globals: storefrontGlobals,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <StoreHeader brand="Luna Bijoux" cartCount={2} siteId="demo" />,
};
