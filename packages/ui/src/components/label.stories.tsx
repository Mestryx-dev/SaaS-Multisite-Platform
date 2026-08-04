import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./label";
import { Input } from "./input";

const meta = {
  title: "Components/Label",
  component: Label,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Label>;
export default meta;
type Story = StoryObj<typeof Label>;

export const WithInput: Story = {
  render: () => (
    <div className="max-w-sm">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};
