import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import { Toaster, toast } from "./toast";

const meta = {
  title: "Components/Toast",
  component: Toaster,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof Toaster>;

export const Default: Story = {
  render: () => (
    <>
      <Toaster />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => toast.success("Order saved")}>
          Success
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => toast.error("Payment failed")}
        >
          Error
        </Button>
      </div>
    </>
  ),
};
