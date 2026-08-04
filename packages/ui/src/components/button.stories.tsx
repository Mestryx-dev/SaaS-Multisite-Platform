import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button, ButtonLink } from "./button";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "destructive", "outline"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    disabled: { control: "boolean" },
    children: { control: "text" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { children: "Primary", variant: "primary" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /primary/i });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Secondary: Story = { args: { children: "Secondary", variant: "secondary" } };
export const Ghost: Story = { args: { children: "Ghost", variant: "ghost" } };
export const Destructive: Story = { args: { children: "Delete", variant: "destructive" } };
export const Outline: Story = { args: { children: "Outline", variant: "outline" } };

export const Disabled: Story = {
  args: { children: "Disabled", disabled: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /disabled/i });
    await expect(button).toBeDisabled();
    // Native disabled + pointer-events:none — click must not invoke handler.
    await userEvent.click(button, { pointerEventsCheck: 0 });
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Small: Story = { args: { children: "Small", size: "sm" } };
export const AsLink: Story = {
  render: () => (
    <ButtonLink href="#" variant="primary">
      Link button
    </ButtonLink>
  ),
};

export const AsChild: Story = {
  render: () => (
    <Button asChild variant="outline">
      <a href="#slot">Slotted link</a>
    </Button>
  ),
};
