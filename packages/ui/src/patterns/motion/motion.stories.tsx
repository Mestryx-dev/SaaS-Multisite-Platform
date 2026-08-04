import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { MotionPresence, MotionPress } from "./index";
import { Button } from "../../components/button";

const meta = { title: "Patterns/Motion" } satisfies Meta;
export default meta;
type Story = StoryObj;

export const PresenceAndPress: Story = {
  render: function MotionDemo() {
    const [show, setShow] = useState(true);
    return (
      <div className="grid max-w-sm gap-4 text-[var(--foreground)]">
        <MotionPress>
          <Button type="button" onClick={() => setShow((s) => !s)}>
            Toggle panel
          </Button>
        </MotionPress>
        <MotionPresence show={show}>
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--foreground)]">
            Intentional presence — respects prefers-reduced-motion.
          </div>
        </MotionPresence>
      </div>
    );
  },
  play: async () => {
    // Wait for enter animation so axe does not sample mid-opacity.
    await new Promise((r) => setTimeout(r, 500));
  },
};
