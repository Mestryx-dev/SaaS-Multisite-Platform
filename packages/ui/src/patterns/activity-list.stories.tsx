import type { Meta, StoryObj } from "@storybook/react-vite";
import { platformGlobals } from "../../.storybook/theme";
import { ActivityList } from "./activity-list";

const meta = {
  title: "Patterns/ActivityList",
  component: ActivityList,
  globals: platformGlobals,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ActivityList>;
export default meta;
type Story = StoryObj<typeof ActivityList>;

export const Recent: Story = {
  args: {
    items: [
      {
        id: "1",
        title: "Web",
        subtitle: "AllAboard monorepo — dev",
        meta: "done",
        statusTone: "ok",
        statusLabel: "done",
        trailing: "logs →",
      },
      {
        id: "2",
        title: "API",
        subtitle: "AllAboard monorepo — production",
        meta: "pending",
        statusTone: "warn",
        statusLabel: "pending",
        trailing: "logs →",
      },
    ],
  },
};
