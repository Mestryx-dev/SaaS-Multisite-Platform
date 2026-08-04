import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text, Muted } from "./text";

const meta = {
  title: "Components/Text",
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const BodyAndMuted: Story = {
  render: () => (
    <div className="space-y-2">
      <Text>Primary body text</Text>
      <Muted>Secondary muted text</Muted>
    </div>
  ),
};
