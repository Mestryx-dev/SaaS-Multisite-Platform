import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../components/button";
import { storefrontGlobals } from "../../.storybook/theme";
import { StoreHero } from "./storefront";

const meta = {
  title: "Storefront/Hero",
  component: StoreHero,
  globals: storefrontGlobals,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof StoreHero>;

export default meta;
type Story = StoryObj<typeof StoreHero>;

export const Default: Story = {
  render: () => (
    <StoreHero
      title="Luna Atelier"
      description="Soft goods for everyday ritual — brand-first, full-bleed hero."
      actions={
        <>
          <Button>Shop new</Button>
          <Button variant="outline">Lookbook</Button>
        </>
      }
    />
  ),
};

export const Vitrine: Story = {
  name: "Vitrine (image)",
  render: () => (
    <StoreHero
      variant="vitrine"
      title="Luna Bijoux"
      description="Colliers, bagues, bracelets — soft, rose, fairy."
      imageUrl="https://images.unsplash.com/photo-1515562141203-7a88fb7ce338?w=1600"
      actions={<Button className="bg-[var(--primary-foreground)] text-[var(--foreground)]">Discover</Button>}
    />
  ),
};
