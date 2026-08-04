import type { Meta, StoryObj } from "@storybook/react-vite";
import { storefrontGlobals } from "../../.storybook/theme";
import { CartDrawer, StoreHeader, StoreMain } from "./storefront";
import {
  StoreLoading,
  StoreProductGridSkeleton,
} from "./storefront-loading";

const meta = {
  title: "Storefront/Loading",
  globals: storefrontGlobals,
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const PageSplash: Story = {
  name: "Page splash",
  render: () => (
    <StoreLoading
      variant="page"
      brand="Luna Bijoux"
      label="Preparing your store…"
    />
  ),
};

export const PageSplashGeneric: Story = {
  name: "Page splash — no brand",
  render: () => (
    <StoreLoading variant="page" label="Loading store…" />
  ),
};

export const InlineCart: Story = {
  name: "Cart drawer inline",
  render: () => (
    <div className="relative min-h-[28rem] bg-[var(--background)]">
      <StoreHeader
        brand="Luna Bijoux"
        cartCount={1}
        siteId="demo"
        searchPlaceholder="Search products…"
        cartLabel="Cart"
        wishlistLabel="Wishlist"
        accountLabel="Sign in"
      />
      <StoreMain>
        <p className="text-sm text-[var(--muted-foreground)]">
          Cart body uses the same Soft boutique loader as runtime{" "}
          <code>store-chrome.js</code> (EN demo labels).
        </p>
      </StoreMain>
      <CartDrawer
        siteId="demo"
        open
        title="Your cart"
        loadingLabel="Loading cart…"
        viewCartLabel="View cart"
        checkoutLabel="Checkout"
        closeLabel="Close"
      />
    </div>
  ),
};

export const InlineStandalone: Story = {
  name: "Inline block",
  parameters: { layout: "centered" },
  render: () => (
    <div className="w-80 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]">
      <StoreLoading variant="inline" label="Loading cart…" />
    </div>
  ),
};

export const ProductGrid: Story = {
  name: "PLP grid skeleton",
  render: () => (
    <StoreMain>
      <h1
        className="mb-6 text-2xl font-semibold tracking-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Catalog
      </h1>
      <StoreProductGridSkeleton cards={6} />
    </StoreMain>
  ),
};
