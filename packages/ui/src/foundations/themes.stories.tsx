import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { Input } from "../components/input";

const meta = {
  title: "Foundations/Themes",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function ThemePanel({
  theme,
  label,
  children,
}: {
  theme: "platform" | "storefront";
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      data-theme={theme}
      className="min-h-[50vh] flex-1 p-6"
      style={{
        background: "var(--background)",
        color: "var(--foreground)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <p className="mb-4 text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </p>
      <p
        className="mb-6 text-2xl font-semibold tracking-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Display specimen
      </p>
      <div className="flex max-w-sm flex-col gap-4">{children}</div>
    </div>
  );
}

export const SideBySide: Story = {
  render: () => (
    <div className="flex min-h-screen flex-col md:flex-row">
      <ThemePanel theme="platform" label="platform (admin)">
        <Card>
          <p className="text-sm font-medium">Card</p>
          <Input placeholder="you@example.com" />
          <Button>Primary</Button>
        </Card>
      </ThemePanel>
      <ThemePanel theme="storefront" label="storefront (shop)">
        <Card>
          <p className="text-sm font-medium">Card</p>
          <Input placeholder="you@example.com" />
          <Button>Primary</Button>
        </Card>
      </ThemePanel>
    </div>
  ),
};
