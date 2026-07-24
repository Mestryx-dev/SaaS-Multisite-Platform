export type StoreProduct = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  priceCents: number;
  compareAtCents?: number | null;
  currency: string;
  stock: number;
  imageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export function formatMoney(cents: number, currency = "eur"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function productJsonLd(product: StoreProduct, origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seoDescription ?? product.description ?? product.name,
    image: product.imageUrl ? [product.imageUrl] : undefined,
    sku: product.slug,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency.toUpperCase(),
      price: (product.priceCents / 100).toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${origin}/p/${product.slug}`,
    },
  };
}
