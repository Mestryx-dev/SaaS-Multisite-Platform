import type { Meta, StoryObj } from "@storybook/react-vite";
import { RefreshCw, Rocket, Search, ShieldCheck } from "lucide-react";
import { platformGlobals } from "../../.storybook/theme";
import { ActionTile, ActionTileGrid } from "./action-tile";

const meta = {
  title: "Patterns/ActionTile",
  component: ActionTile,
  globals: platformGlobals,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ActionTile>;
export default meta;
type Story = StoryObj<typeof ActionTile>;

export const Grid: Story = {
  render: () => (
    <ActionTileGrid>
      <ActionTile
        icon={<RefreshCw />}
        title="Reload configuration"
        description="Hot-reload config without restarting the process."
      />
      <ActionTile
        icon={<ShieldCheck />}
        title="Validate configuration"
        description="Check config for errors and missing settings."
      />
      <ActionTile
        icon={<Rocket />}
        title="Train classifier"
        description="Update spam models from recent labeled mail."
      />
      <ActionTile
        icon={<Search />}
        title="Reindex search"
        description="Rebuild the full-text index for this organization."
      />
    </ActionTileGrid>
  ),
};
