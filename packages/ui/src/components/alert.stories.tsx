import type { Meta, StoryObj } from "@storybook/react-vite";
import { platformGlobals } from "../../.storybook/theme";
import { Alert } from "./alert";

const meta = {
  title: "Components/Alert",
  component: Alert,
  tags: ["autodocs"],
  globals: platformGlobals,
  parameters: { layout: "centered" },
  argTypes: {
    tone: {
      control: "select",
      options: ["error", "info", "warning"],
    },
    children: { control: "text" },
  },
} satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof Alert>;

export const Error: Story = {
  args: { children: "Something went wrong.", tone: "error" },
};
export const Info: Story = {
  args: { children: "Stripe test mode is active.", tone: "info" },
};
export const Warning: Story = {
  name: "Warning banner",
  args: {
    tone: "warning",
    title: "Enterprise feature",
    children: (
      <>
        This feature is only available on a higher plan.{" "}
        <a href="#" className="underline">
          Request trial
        </a>
        .
      </>
    ),
    onDismiss: () => undefined,
  },
};
