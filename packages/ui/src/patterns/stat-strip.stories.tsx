import type { Meta, StoryObj } from "@storybook/react-vite";
import { platformGlobals } from "../../.storybook/theme";
import { StatStrip } from "./stat-strip";

const meta = {
  title: "Patterns/StatStrip",
  component: StatStrip,
  globals: platformGlobals,
} satisfies Meta<typeof StatStrip>;

export default meta;
type Story = StoryObj<typeof StatStrip>;

export const Dashboard: Story = {
  args: {
    items: [
      {
        label: "Orders today",
        value: "24",
        hint: "+12% vs yesterday",
        accent: true,
      },
      {
        label: "Pending payment",
        value: "3",
        hint: "12 orders total",
        bullet: { current: 3, target: 12, caption: "3 of 12" },
      },
      {
        label: "Low stock",
        value: "7",
        hint: "SKUs below threshold",
        bullet: { current: 7, target: 48, caption: "7 of 48" },
      },
      { label: "Open returns", value: "3" },
    ],
  },
};

export const WithBullets: Story = {
  name: "With KPI bullets",
  args: {
    items: [
      {
        label: "Pending payment",
        value: "3",
        bullet: { current: 3, target: 12, caption: "3 pending of 12" },
      },
      {
        label: "Low stock",
        value: "1",
        bullet: { current: 1, target: 24, caption: "1 alert of 24" },
      },
    ],
  },
};
