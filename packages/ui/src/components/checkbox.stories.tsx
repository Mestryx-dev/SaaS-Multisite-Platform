import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Checkbox } from "./checkbox";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    onCheckedChange: fn(),
  },
  argTypes: {
    label: { control: "text" },
    disabled: { control: "boolean" },
    defaultChecked: { control: "boolean" },
  },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof Checkbox>;

export const WithLabel: Story = {
  args: { id: "invite", label: "Send invite email", defaultChecked: true },
};

export const Unchecked: Story = {
  args: { id: "opt", label: "Optional" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole("checkbox", { name: /optional/i });
    await expect(box).not.toBeChecked();
    await userEvent.click(box);
    await expect(box).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenCalled();
  },
};
