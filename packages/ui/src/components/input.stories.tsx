import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Input } from "./input";

const meta = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    type: {
      control: "select",
      options: ["text", "email", "password", "search", "number"],
    },
  },
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: "you@example.com", type: "email", "aria-label": "Email" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: /email/i });
    await userEvent.clear(input);
    await userEvent.type(input, "mestryx@example.com");
    await expect(input).toHaveValue("mestryx@example.com");
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled",
    disabled: true,
    "aria-label": "Disabled email",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: /disabled email/i });
    await expect(input).toBeDisabled();
  },
};
