import type { Meta, StoryObj } from "@storybook/react-vite";
import { platformGlobals } from "../../.storybook/theme";
import { Button } from "./button";
import { Card } from "./card";
import { Input } from "./input";
import { Label } from "./label";
import { Text, Muted } from "./text";

const meta = {
  title: "Components/Card",
  component: Card,
  globals: platformGlobals,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "select",
      options: ["panel", "ghost"],
    },
  },
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof Card>;

export const Panel: Story = {
  render: () => (
    <Card className="max-w-sm" variant="panel">
      <Text className="font-semibold">Panel card</Text>
      <Muted>Bordered surface for forms / settings. Radius from --radius (8px platform).</Muted>
      <Button size="sm">Save</Button>
    </Card>
  ),
};

export const Ghost: Story = {
  render: () => (
    <Card className="max-w-sm" variant="ghost">
      <Text className="font-semibold">Ghost card</Text>
      <Muted>Padding only — use inside lists instead of nesting panel Cards.</Muted>
    </Card>
  ),
};

export const AntiNesting: Story = {
  name: "Anti nesting",
  render: () => (
    <div className="max-w-lg space-y-4">
      <p className="text-xs text-[var(--muted-foreground)]">
        Decision: platform-biased — one panel Card for the form; list rows stay flat (no Card-in-Card).
      </p>
      <Card variant="panel">
        <Text className="font-semibold">Create organization</Text>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Acme" />
        </div>
        <Button size="sm">Create</Button>
      </Card>
      <ul className="divide-y divide-[var(--border)] rounded-[var(--radius)] border border-[var(--border)]">
        <li className="px-4 py-3 text-sm">Acme Corp</li>
        <li className="px-4 py-3 text-sm">Luna Bijoux</li>
      </ul>
    </div>
  ),
};

/** @deprecated Prefer Panel */
export const Default: Story = Panel;
