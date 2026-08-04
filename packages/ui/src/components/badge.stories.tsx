import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge";

const meta = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    tone: {
      control: "select",
      options: ["default", "success", "danger", "muted", "info"],
    },
    children: { control: "text" },
  },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = { args: { children: "Active" } };
export const Success: Story = { args: { children: "done", tone: "success" } };
export const Danger: Story = { args: { children: "Failed", tone: "danger" } };
export const Muted: Story = { args: { children: "Application", tone: "muted" } };
export const Info: Story = { args: { children: "Leader", tone: "info" } };
