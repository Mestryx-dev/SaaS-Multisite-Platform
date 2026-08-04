import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./label";
import { RadioGroup, RadioGroupItem } from "./radio-group";

const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="standard" className="grid gap-3">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="standard" id="r1" />
        <Label htmlFor="r1">Standard shipping</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="express" id="r2" />
        <Label htmlFor="r2">Express</Label>
      </div>
    </RadioGroup>
  ),
};
