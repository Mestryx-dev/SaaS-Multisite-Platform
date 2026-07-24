import type { Meta, StoryObj } from "@storybook/react-vite";
import { platformGlobals } from "../../.storybook/theme";
import { SearchField } from "./search-field";

const meta = {
  title: "Components/SearchField",
  component: SearchField,
  tags: ["autodocs"],
  globals: platformGlobals,
  parameters: { layout: "centered" },
} satisfies Meta<typeof SearchField>;
export default meta;
type Story = StoryObj<typeof SearchField>;

export const Default: Story = {
  args: { placeholder: "Search", "aria-label": "Search" },
};

export const Pill: Story = {
  args: {
    pill: true,
    placeholder: "Search",
    "aria-label": "Search",
    className: "w-64",
  },
};
