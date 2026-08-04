import type { Meta, StoryObj } from "@storybook/react-vite";
import { storefrontGlobals } from "../../.storybook/theme";
import { ProductCard, ProductGrid, StoreHero, StoreMain } from "./storefront";

const meta = {
  title: "Storefront/ProductCard",
  globals: storefrontGlobals,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Grid: Story = {
  render: () => (
    <StoreMain>
      <StoreHero title="New arrivals" description="Storefront display uses Fraunces." />
      <ProductGrid>
        <ProductCard
          name="Pearl studs"
          slug="pearl-studs"
          priceLabel="€49"
          compareAtLabel="€65"
          badge="Sale"
        />
        <ProductCard name="Gold ring" slug="gold-ring" priceLabel="€120" />
        <ProductCard name="Silver chain" slug="silver-chain" priceLabel="€85" badge="New" />
      </ProductGrid>
    </StoreMain>
  ),
};
