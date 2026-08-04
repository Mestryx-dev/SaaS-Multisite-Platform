import type { Meta, StoryObj } from "@storybook/react-vite";
import { storefrontGlobals } from "../../.storybook/theme";
import { Button, ButtonLink } from "../components/button";
import { Select } from "../components/select";
import {
  CartDrawer,
  CartLine,
  CategoryNav,
  CheckoutLayout,
  CollectionCard,
  CollectionGrid,
  OrderSummary,
  PlpToolbar,
  PriceDisplay,
  PriceRangeInputs,
  ProductCard,
  ProductGallery,
  ProductGrid,
  StoreFooter,
  StoreForm,
  StoreHeader,
  StoreHero,
  StoreMain,
  StoreSection,
  TrustStrip,
} from "./storefront";

/**
 * Full e-commerce vitrine presentation — Storybook default theme is storefront.
 * Walk: home window → collection PLP chrome → PDP → cart/checkout.
 */
const meta = {
  title: "Storefront/Vitrine",
  globals: storefrontGlobals,
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const DEMO_IMG = {
  hero: "https://images.unsplash.com/photo-1515562141203-7a88fb7ce338?w=1600",
  a: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800",
  b: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800",
  c: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800",
  d: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800",
};

export const BoutiqueHome: Story = {
  name: "01 · Boutique home (store window)",
  render: () => (
    <>
      <StoreHeader brand="Luna Bijoux" cartCount={2} siteId="demo" />
      <StoreHero
        variant="vitrine"
        title="Luna Bijoux"
        description="Colliers, bagues, bracelets et boucles d'oreilles fantaisie — soft, rose, fairy."
        imageUrl={DEMO_IMG.hero}
        actions={
          <ButtonLink
            href="#featured"
            className="bg-[var(--primary-foreground)] text-[var(--foreground)] hover:opacity-90"
          >
            Discover the selection
          </ButtonLink>
        }
      />
      <StoreMain className="ui-store-main--vitrine">
        <StoreSection
          title="Collections"
          description="Browse by piece — open a collection to filter and sort."
        >
          <CollectionGrid>
            <CollectionCard name="Colliers" slug="colliers" imageUrl={DEMO_IMG.a} />
            <CollectionCard name="Boucles" slug="boucles" imageUrl={DEMO_IMG.b} />
            <CollectionCard name="Bracelets" slug="bracelets" imageUrl={DEMO_IMG.c} />
          </CollectionGrid>
        </StoreSection>
        <StoreSection
          title="Selected for you"
          description="A curated window — not the full warehouse."
          action={
            <ButtonLink href="#plp" variant="ghost" size="sm">
              Shop all
            </ButtonLink>
          }
        >
          <div id="featured">
            <ProductGrid featured>
              <ProductCard
                name="Anneau d'orteil Fleur"
                slug="anneau"
                priceLabel="8,90 €"
                imageUrl={DEMO_IMG.a}
              />
              <ProductCard
                name="Barrette Nœud Satin"
                slug="barrette"
                priceLabel="9,90 €"
                imageUrl={DEMO_IMG.b}
              />
              <ProductCard
                name="Collier Long Chaîne Perle"
                slug="collier"
                priceLabel="14,90 €"
                imageUrl={DEMO_IMG.c}
              />
              <ProductCard
                name="Bague Lune & Étoile"
                slug="bague"
                priceLabel="18,90 €"
                compareAtLabel="24,90 €"
                badge="Sale"
                imageUrl={DEMO_IMG.d}
              />
            </ProductGrid>
          </div>
        </StoreSection>
        <TrustStrip />
      </StoreMain>
      <StoreFooter brand="Luna Bijoux" />
      <CartDrawer siteId="demo" />
    </>
  ),
};

export const CollectionPlp: Story = {
  name: "02 · Collection PLP (catalog)",
  render: () => (
    <>
      <StoreHeader brand="Luna Bijoux" cartCount={1} siteId="demo" />
      <StoreMain>
        <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
          Colliers
        </h1>
        <p className="mb-6 text-sm text-[var(--muted-foreground)]">
          4 pieces · <a href="#">Back to shop</a>
        </p>
        <CategoryNav
          items={[
            { name: "Colliers", slug: "colliers" },
            { name: "Boucles", slug: "boucles" },
            { name: "Bracelets", slug: "bracelets" },
          ]}
          activeSlug="colliers"
        />
        <StoreForm method="get" action="#" className="ui-store-form--plp">
          <PlpToolbar>
            <PriceRangeInputs minDefault="5" maxDefault="40" />
            <div className="ui-plp-toolbar-sort">
              <label className="ui-plp-toolbar-sort-label" htmlFor="sb-vitrine-sort">
                Sort
              </label>
              <Select
                id="sb-vitrine-sort"
                name="sort"
                defaultValue="newest"
                className="h-9 w-auto min-w-[11rem] shadow-none"
              >
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
        <ProductGrid>
          <ProductCard
            name="Collier Long Chaîne Perle"
            slug="collier"
            priceLabel="14,90 €"
            imageUrl={DEMO_IMG.c}
          />
          <ProductCard
            name="Collier Rose Soft"
            slug="rose"
            priceLabel="12,90 €"
            imageUrl={DEMO_IMG.hero}
          />
          <ProductCard
            name="Chaîne Fine Or"
            slug="chaine"
            priceLabel="19,90 €"
            imageUrl={DEMO_IMG.a}
          />
        </ProductGrid>
      </StoreMain>
      <StoreFooter brand="Luna Bijoux" />
    </>
  ),
};

export const ProductDetail: Story = {
  name: "03 · Product detail",
  render: () => (
    <>
      <StoreHeader brand="Luna Bijoux" cartCount={0} siteId="demo" />
      <StoreMain>
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <ProductGallery
            productName="Bague Lune & Étoile"
            images={[
              { id: "1", url: DEMO_IMG.d, alt: "Front" },
              { id: "2", url: DEMO_IMG.a, alt: "Detail" },
              { id: "3", url: DEMO_IMG.b, alt: "Lifestyle" },
            ]}
          />
          <div className="space-y-5">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
              Bague Lune & Étoile
            </h1>
            <PriceDisplay
              priceLabel="18,90 €"
              compareAtLabel="24,90 €"
              badge="Sale"
            />
            <p className="text-sm text-[var(--muted-foreground)] md:text-base">
              Soft fantasy ring — moon and star motif, everyday wear.
            </p>
            <TrustStrip />
            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="button">Add to cart</Button>
              <Button type="button" variant="ghost">
                Wishlist
              </Button>
            </div>
          </div>
        </div>
      </StoreMain>
      <StoreFooter brand="Luna Bijoux" />
    </>
  ),
};

export const CartAndCheckout: Story = {
  name: "04 · Cart & checkout",
  render: () => (
    <>
      <StoreHeader brand="Luna Bijoux" cartCount={2} siteId="demo" />
      <StoreMain>
        <h1 className="mb-8 font-[family-name:var(--font-display)] text-3xl font-semibold">
          Checkout
        </h1>
        <CheckoutLayout
          summary={
            <OrderSummary
              lines={[
                { label: "Bague Lune & Étoile × 1", value: "18,90 €" },
                { label: "Anneau d'orteil Fleur × 1", value: "8,90 €" },
                { label: "Shipping", value: "Calculated next" },
              ]}
              totalLabel="Estimated subtotal"
              totalValue="27,80 €"
            >
              <Button type="button" className="w-full">
                Place order
              </Button>
            </OrderSummary>
          }
        >
          <div className="space-y-4">
            <CartLine
              itemId="1"
              siteId="demo"
              name="Bague Lune & Étoile"
              href="#"
              imageUrl={DEMO_IMG.d}
              quantity={1}
              lineTotalLabel="18,90 €"
            />
            <CartLine
              itemId="2"
              siteId="demo"
              name="Anneau d'orteil Fleur"
              href="#"
              imageUrl={DEMO_IMG.a}
              quantity={1}
              lineTotalLabel="8,90 €"
            />
          </div>
        </CheckoutLayout>
      </StoreMain>
      <StoreFooter brand="Luna Bijoux" />
      <CartDrawer siteId="demo" />
    </>
  ),
};

/** Soft boutique chrome glass — header, PLP toolbar, open cart drawer. */
export const GlassChrome: Story = {
  name: "05 · Soft glass chrome",
  render: () => (
    <>
      <StoreHeader brand="Luna Bijoux" cartCount={2} siteId="demo" />
      <StoreMain>
        <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          Soft glass
        </h1>
        <p className="mb-6 text-sm text-[var(--muted-foreground)]">
          Apple-subtil chrome on header, PLP toolbar, and cart drawer — not on product
          media.
        </p>
        <StoreForm method="get" action="#" className="ui-store-form--plp">
          <PlpToolbar>
            <PriceRangeInputs minDefault="5" maxDefault="40" />
            <div className="ui-plp-toolbar-sort">
              <label className="ui-plp-toolbar-sort-label" htmlFor="sb-glass-sort">
                Sort
              </label>
              <Select
                id="sb-glass-sort"
                name="sort"
                defaultValue="newest"
                className="h-9 w-auto min-w-[11rem] shadow-none"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: low to high</option>
              </Select>
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Apply
            </Button>
          </PlpToolbar>
        </StoreForm>
        <ProductGrid>
          <ProductCard
            name="Collier Lune"
            slug="collier-lune"
            priceLabel="24,00 €"
            imageUrl={DEMO_IMG.a}
          />
          <ProductCard
            name="Bague Étoile"
            slug="bague-etoile"
            priceLabel="18,00 €"
            imageUrl={DEMO_IMG.b}
          />
        </ProductGrid>
      </StoreMain>
      <StoreFooter brand="Luna Bijoux" />
      <CartDrawer siteId="demo" open />
    </>
  ),
};
