import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menu } from "lucide-react";
import { platformGlobals } from "../../.storybook/theme";
import { Button } from "../components/button";
import { EmptyState } from "../components/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/tabs";
import { ListPanel } from "./list-panel";

const meta = {
  title: "Patterns/ListPanel",
  component: ListPanel,
  globals: platformGlobals,
} satisfies Meta<typeof ListPanel>;

export default meta;
type Story = StoryObj<typeof ListPanel>;

export const Default: Story = {
  render: () => (
    <ListPanel
      title="Orders"
      description="Organization order list."
      actions={<Button size="sm">Export</Button>}
    >
      <p className="px-4 py-6 text-sm text-[var(--muted-foreground)]">
        Table or empty state goes here.
      </p>
    </ListPanel>
  ),
};

/** Menus-like one-panel proof (Dokploy cleanliness). */
export const MenusLike: Story = {
  name: "Menus-like (Header | Footer)",
  render: () => (
    <ListPanel
      title="Menus"
      description="Header and footer links for the selected site."
      actions={
        <Button type="button" size="sm">
          Add item
        </Button>
      }
    >
      <Tabs defaultValue="header" className="px-4 pb-4 pt-3">
        <TabsList variant="pills">
          <TabsTrigger value="header">Header (0)</TabsTrigger>
          <TabsTrigger value="footer">Footer (0)</TabsTrigger>
        </TabsList>
        <TabsContent value="header" className="mt-0 pt-3">
          <EmptyState
            variant="plain"
            icon={<Menu />}
            title="No header items"
            description="Add a link to build this navigation tree."
            action={
              <Button type="button" size="sm">
                Add item
              </Button>
            }
          />
        </TabsContent>
        <TabsContent value="footer" className="mt-0 pt-3">
          <EmptyState
            variant="plain"
            icon={<Menu />}
            title="No footer items"
            description="Add a link to build this navigation tree."
          />
        </TabsContent>
      </Tabs>
    </ListPanel>
  ),
};
