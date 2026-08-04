import type { Meta, StoryObj } from "@storybook/react-vite";
import { platformGlobals } from "../../.storybook/theme";
import { Dropzone } from "./dropzone";

const meta = {
  title: "Patterns/Dropzone",
  component: Dropzone,
  globals: platformGlobals,
} satisfies Meta<typeof Dropzone>;

export default meta;
type Story = StoryObj<typeof Dropzone>;

export const Default: Story = {};
