import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "./stack";

const meta = {
  title: "Components/Stack",
  component: Stack,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Stack>;
export default meta;
type Story = StoryObj<typeof Stack>;

export const Medium: Story = {
  render: () => (
    <Stack gap="md">
      <div className="rounded-[var(--radius)] bg-[var(--muted)] p-2">One</div>
      <div className="rounded-[var(--radius)] bg-[var(--muted)] p-2">Two</div>
      <div className="rounded-[var(--radius)] bg-[var(--muted)] p-2">Three</div>
    </Stack>
  ),
};
