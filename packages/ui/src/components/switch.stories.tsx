import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Label } from "./label";
import { Switch } from "./switch";

const meta = {
  title: "Components/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Switch id="commerce" defaultChecked />
      <Label htmlFor="commerce">Commerce module</Label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: /commerce module/i });
    await expect(control).toBeChecked();
    await userEvent.click(control);
    await expect(control).not.toBeChecked();
  },
};
