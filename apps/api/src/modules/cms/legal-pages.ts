import { eq } from "drizzle-orm";
import type { Db } from "../../db/client.js";
import { page } from "../../db/schema.js";

/** Fixed legal slugs for storefront (FB-077). */
export const LEGAL_PAGE_SPECS = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    markdown:
      "# Privacy Policy\n\nReplace this draft with your privacy notice (GDPR).\n\nWe process account and order data to operate the shop.",
  },
  {
    slug: "terms",
    title: "Terms of Sale",
    markdown:
      "# Terms of Sale (CGV)\n\nReplace this draft with your terms of sale.\n\nOrders are confirmed when payment is captured.",
  },
  {
    slug: "legal",
    title: "Legal Notice",
    markdown:
      "# Legal Notice\n\nReplace this draft with company legal mentions (SIRET, address, contact).",
  },
] as const;

/** Idempotent: create missing published legal CMS pages for a site. */
export async function ensureLegalPages(db: Db, siteId: string) {
  const existing = await db
    .select({ slug: page.slug })
    .from(page)
    .where(eq(page.siteId, siteId));
  const have = new Set(existing.map((r) => r.slug));
  for (const spec of LEGAL_PAGE_SPECS) {
    if (have.has(spec.slug)) continue;
    await db.insert(page).values({
      siteId,
      slug: spec.slug,
      title: spec.title,
      status: "published",
      bodyJson: { markdown: spec.markdown },
      seoTitle: spec.title,
      seoDescription: `${spec.title} (draft — edit in admin)`,
      canonicalPath: `/${spec.slug}`,
    });
  }
}
