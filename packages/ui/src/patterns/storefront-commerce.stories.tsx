import type { Meta, StoryObj } from "@storybook/react-vite";
import { storefrontGlobals } from "../../.storybook/theme";
import {
  CartDrawer,
  CartLine,
  CheckoutLayout,
  CheckoutSteps,
  OrderSummary,
  PdpLayout,
  PlpToolbar,
  PriceDisplay,
  PriceRangeInputs,
  ProductGallery,
  PromoBanners,
  StoreForm,
  StoreHeader,
  StoreMain,
  TrustStrip,
} from "./storefront";
import { Button } from "../components/button";
import { Select } from "../components/select";

const meta = {
  title: "Storefront/Commerce",
  globals: storefrontGlobals,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const HeaderScrollDock: Story = {
  name: "Header — flat vs scrolled dock",
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="min-h-[140vh] bg-[var(--background)]">
      <p className="px-4 py-2 text-xs text-[var(--muted-foreground)]">
        Flat at rest · Soft glass pill when <code>scrolled</code> (runtime: scroll island).
      </p>
      <StoreHeader
        brand="Luna Bijoux"
        cartCount={2}
        siteId="demo"
        searchPlaceholder="Search products…"
        cartLabel="Cart"
        wishlistLabel="Wishlist"
        accountLabel="Sign in"
      />
      <div className="h-8" />
      <StoreHeader
        brand="Luna Bijoux"
        cartCount={2}
        siteId="demo"
        scrolled
        searchPlaceholder="Search products…"
        cartLabel="Cart"
        wishlistLabel="Wishlist"
        accountLabel="Sign in"
      />
      <StoreMain>
        <p className="text-sm text-[var(--muted-foreground)]">Page content below…</p>
      </StoreMain>
    </div>
  ),
};

export const PlpFilters: Story = {
  name: "PLP filters",
  render: () => (
    <StoreMain>
      <StoreForm method="get" action="/" className="ui-store-form--plp">
        <PlpToolbar>
          <PriceRangeInputs minDefault="10" maxDefault="80" />
          <div className="ui-plp-toolbar-sort">
            <label className="ui-plp-toolbar-sort-label" htmlFor="sb-sort">
              Sort
            </label>
            <Select id="sb-sort" name="sort" defaultValue="newest" className="h-9 w-auto min-w-[11rem] shadow-none">
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </Select>
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Apply
          </Button>
        </PlpToolbar>
      </StoreForm>
    </StoreMain>
  ),
};

export const PdpAndCheckout: Story = {
  name: "PDP gallery & checkout",
  render: () => (
    <StoreMain>
      <TrustStrip
        items={[
          { title: "Free shipping", description: "On orders over threshold" },
          { title: "Easy returns", description: "30-day hassle-free returns" },
          { title: "Secure checkout", description: "Encrypted payment processing" },
        ]}
      />
      <section className="mb-12 grid gap-10 md:grid-cols-2">
        <ProductGallery
          productName="Pearl studs"
          images={[
            {
              id: "1",
              url: "https://images.unsplash.com/photo-1515562141203-7a88fb7ce338?w=600",
              alt: "Pearl studs front",
            },
            {
              id: "2",
              url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600",
              alt: "Pearl studs detail",
            },
          ]}
        />
        <div className="space-y-4">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
            Pearl studs
          </h1>
          <PriceDisplay priceLabel="€49" compareAtLabel="€65" badge="Sale" />
        </div>
      </section>
      <CheckoutLayout
        summary={
          <OrderSummary
            lines={[
              { label: "Subtotal", value: "€49" },
              { label: "Shipping", value: "€5" },
            ]}
            totalLabel="Total"
            totalValue="€54"
          />
        }
      >
        <div className="space-y-4">
          <CheckoutSteps
            steps={["Address", "Shipping", "Review"]}
            current={1}
          />
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">Your cart</h2>
          <CartLine
            itemId="line-1"
            siteId="site-demo"
            name="Pearl studs"
            href="/p/pearl-studs"
            imageUrl="https://images.unsplash.com/photo-1515562141203-7a88fb7ce338?w=200"
            quantity={1}
            lineTotalLabel="€49"
          />
        </div>
      </CheckoutLayout>
      <CartDrawer
        siteId="site-demo"
        title="Your cart"
        loadingLabel="Loading cart…"
        viewCartLabel="View cart"
        checkoutLabel="Checkout"
      />
    </StoreMain>
  ),
};

export const PromoAndPdp: Story = {
  name: "Promo banners + PDP layout",
  render: () => (
    <StoreMain>
      <PromoBanners
        banners={[
          {
            id: "1",
            title: "Summer edit",
            subtitle: "Soft gold & pearls",
            imageUrl:
              "https://images.unsplash.com/photo-1515562141203-7a88fb7ce338?w=800",
            href: "/?category=summer",
          },
          { id: "2", title: "Gift guide" },
        ]}
      />
      <PdpLayout
        media={
          <ProductGallery
            productName="Pearl studs"
            images={[
              {
                id: "1",
                url: "https://images.unsplash.com/photo-1515562141203-7a88fb7ce338?w=600",
                alt: "Pearl studs",
              },
            ]}
          />
        }
      >
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
          Pearl studs
        </h1>
        <PriceDisplay amount="€49" />
        <Button>Add to cart</Button>
      </PdpLayout>
    </StoreMain>
  ),
};
