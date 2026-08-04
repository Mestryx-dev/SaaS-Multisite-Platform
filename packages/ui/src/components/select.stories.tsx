import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./label";
import { Select } from "./select";

const meta = {
  title: "Components/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <div className="max-w-sm space-y-2">
      <Label htmlFor="sb-role">Role</Label>
      <Select id="sb-role" defaultValue="editor" className="max-w-sm">
        <option value="admin">Admin</option>
        <option value="editor">Editor</option>
        <option value="viewer">Viewer</option>
      </Select>
    </div>
  ),
};
