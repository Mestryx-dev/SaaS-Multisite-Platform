/**
 * Dogfood seed — "Luna Bijoux" girly fantasy jewelry boutique.
 *
 *   pnpm --filter @mestryx/api db:seed
 *
 * Idempotent: re-run upserts org/site/products by slug/sku.
 */
import { config as loadDotenv } from "dotenv";
import { and, eq } from "drizzle-orm";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "../app.js";
import { createDb } from "./client.js";
import {
  category,
  mediaAsset,
  membership,
  merchantLegalProfile,
  organization,
  page,
  product,
  productCategory,
  productMedia,
  productVariant,
  shippingMethod,
  shippingZone,
  site,
  user,
} from "./schema.js";
import { loadConfig } from "../lib/config.js";
import { createAuth } from "../modules/identity/auth.js";
import { seedPlans } from "../modules/billing/routes.js";
import { ensureLegalPages } from "../modules/cms/legal-pages.js";
import { ensureDefaultVariant } from "../modules/commerce/catalog-routes.js";

// This file lives in apps/api/src/db → four levels up to repo root
const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../..");
loadDotenv({ path: resolve(repoRoot, ".env") });
loadDotenv({ path: resolve(process.cwd(), "../../.env") });
loadDotenv({ path: resolve(process.cwd(), ".env") });

const SEED_EMAIL = process.env.SEED_EMAIL ?? "demo@lunabijoux.local";
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "LunaBijoux2026!";
const ORG_SLUG = "luna-bijoux";
const SITE_SLUG = "luna";

type SeedProduct = {
  name: string;
  slug: string;
  sku: string;
  description: string;
  priceCents: number;
  compareAtCents?: number;
  stock: number;
  taxClass: "standard" | "reduced";
  imageUrl: string;
  seoTitle: string;
  seoDescription: string;
};

const CATALOG: SeedProduct[] = [
  {
    name: "Collier Lune Rosée",
    slug: "collier-lune-rosee",
    sku: "LUNA-COL-001",
    description:
      "Pendentif lune en alliage doré rose, chaîne fine et éclat nacré. Look soft girl parfait pour le quotidien.",
    priceCents: 2490,
    compareAtCents: 3200,
    stock: 48,
    taxClass: "standard",
    imageUrl:
      "https://images.unsplash.com/photo-1515562140607-ee22621dd758?w=800&q=80",
    seoTitle: "Collier Lune Rosée — Luna Bijoux",
    seoDescription: "Collier fantaisie lune rose dorée, style girly doux.",
  },
  {
    name: "Boucles Papillon Satin",
    slug: "boucles-papillon-satin",
    sku: "LUNA-ORE-002",
    description:
      "Papillons légers effet satin, clips doux. Idéales pour un look fairycore.",
    priceCents: 1890,
    stock: 60,
    taxClass: "standard",
    imageUrl:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
    seoTitle: "Boucles Papillon Satin — Luna Bijoux",
    seoDescription: "Boucles d'oreilles papillon fantaisie, ambiance girly.",
  },
  {
    name: "Bracelet Charms Cœur",
    slug: "bracelet-charms-coeur",
    sku: "LUNA-BRA-003",
    description:
      "Chaîne délicate avec charms cœur, étoile et perle. Empilable avec d'autres bracelets Luna.",
    priceCents: 2190,
    compareAtCents: 2790,
    stock: 55,
    taxClass: "standard",
    imageUrl:
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80",
    seoTitle: "Bracelet Charms Cœur — Luna Bijoux",
    seoDescription: "Bracelet charms cœur rose, bijou fantaisie girly.",
  },
  {
    name: "Bague Perle Nacrée",
    slug: "bague-perle-nacree",
    sku: "LUNA-BAG-004",
    description:
      "Perle nacrée montée sur anneau ajustable doré rose. Touche romantique instantanée.",
    priceCents: 1590,
    stock: 70,
    taxClass: "standard",
    imageUrl:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80",
    seoTitle: "Bague Perle Nacrée — Luna Bijoux",
    seoDescription: "Bague perle fantaisie, style soft glam.",
  },
  {
    name: "Collier Chaîne Étoile",
    slug: "collier-chaine-etoile",
    sku: "LUNA-COL-005",
    description:
      "Mini étoile scintillante sur chaîne fine. Layering friendly avec le Collier Lune.",
    priceCents: 1990,
    stock: 42,
    taxClass: "standard",
    imageUrl:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
    seoTitle: "Collier Chaîne Étoile — Luna Bijoux",
    seoDescription: "Collier étoile fantaisie, vibe celestial girly.",
  },
  {
    name: "Créoles Fleur de Cerisier",
    slug: "creoles-fleur-cerisier",
    sku: "LUNA-ORE-006",
    description:
      "Créoles moyennes ornées de fleurs roses. Printemps permanent, même en hiver.",
    priceCents: 2290,
    stock: 36,
    taxClass: "standard",
    imageUrl:
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&q=80",
    seoTitle: "Créoles Fleur de Cerisier — Luna Bijoux",
    seoDescription: "Créoles fleuries rose, bijoux fantaisie kawaii.",
  },
  {
    name: "Bracelet Tennis Rose",
    slug: "bracelet-tennis-rose",
    sku: "LUNA-BRA-007",
    description:
      "Rangée de cristaux rose pâle. Effet luxe soft pour soirées et selfies.",
    priceCents: 3490,
    compareAtCents: 4200,
    stock: 28,
    taxClass: "standard",
    imageUrl:
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80",
    seoTitle: "Bracelet Tennis Rose — Luna Bijoux",
    seoDescription: "Bracelet tennis cristaux roses, glam girly.",
  },
  {
    name: "Bague Duo Cœurs",
    slug: "bague-duo-coeurs",
    sku: "LUNA-BAG-008",
    description:
      "Deux petits cœurs entrelacés, finition or rose. Cadeau bestie ou crush.",
    priceCents: 1290,
    stock: 80,
    taxClass: "standard",
    imageUrl:
      "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&q=80",
    seoTitle: "Bague Duo Cœurs — Luna Bijoux",
    seoDescription: "Bague cœurs fantaisie, look cute & romantic.",
  },
  {
    name: "Set Collier + Boucles Aurora",
    slug: "set-aurora",
    sku: "LUNA-SET-009",
    description:
      "Parure aurora : collier + boucles assorties, dégradé rose-lilas. Prête pour un outfit complet.",
    priceCents: 4490,
    compareAtCents: 5490,
    stock: 22,
    taxClass: "standard",
    imageUrl:
      "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80",
    seoTitle: "Set Aurora — Luna Bijoux",
    seoDescription: "Parure bijoux fantaisie rose lilas, set collier et boucles.",
  },
  {
    name: "Collier Choker Velours Rose",
    slug: "choker-velours-rose",
    sku: "LUNA-CHO-010",
    description:
      "Choker velours rose poudré avec pendentif cœur. Mood coquette assumé.",
    priceCents: 1790,
    stock: 40,
    taxClass: "standard",
    imageUrl:
      "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&q=80",
    seoTitle: "Choker Velours Rose — Luna Bijoux",
    seoDescription: "Choker velours rose coquette, bijou fantaisie.",
  },
  {
    name: "Boucles Goutte Cristal",
    slug: "boucles-goutte-cristal",
    sku: "LUNA-ORE-011",
    description:
      "Gouttes cristal irisé qui captent la lumière. Effet fairy lights sur les oreilles.",
    priceCents: 2690,
    stock: 33,
    taxClass: "standard",
    imageUrl:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80",
    seoTitle: "Boucles Goutte Cristal — Luna Bijoux",
    seoDescription: "Boucles goutte cristal irisé, style fairy.",
  },
  {
    name: "Bracelet Perles Pastel",
    slug: "bracelet-perles-pastel",
    sku: "LUNA-BRA-012",
    description:
      "Perles roses, lilas et ivoire. Stackable, hypoallergénique (finition nickel-safe).",
    priceCents: 1490,
    stock: 65,
    taxClass: "standard",
    imageUrl:
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80",
    seoTitle: "Bracelet Perles Pastel — Luna Bijoux",
    seoDescription: "Bracelet perles pastel girly, bijou fantaisie.",
  },
  {
    name: "Bague Lune & Étoile",
    slug: "bague-lune-etoile",
    sku: "LUNA-BAG-013",
    description:
      "Open ring lune + étoile, ajustable. Pièce signature Luna Bijoux.",
    priceCents: 1890,
    stock: 50,
    taxClass: "standard",
    imageUrl:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80&sat=-20",
    seoTitle: "Bague Lune & Étoile — Luna Bijoux",
    seoDescription: "Bague lune étoile fantaisie, signature Luna.",
  },
  {
    name: "Collier Long Chaîne Perle",
    slug: "collier-long-perle",
    sku: "LUNA-COL-014",
    description:
      "Long collier perles roses à nouer ou porter en double. Soft glam office-to-evening.",
    priceCents: 2990,
    stock: 30,
    taxClass: "standard",
    imageUrl:
      "https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=800&q=80",
    seoTitle: "Collier Long Chaîne Perle — Luna Bijoux",
    seoDescription: "Long collier perles roses fantaisie.",
  },
  {
    name: "Barrette Nœud Satin",
    slug: "barrette-noeud-satin",
    sku: "LUNA-ACC-015",
    description:
      "Barrette nœud satin rose poudré. Accessoire cheveux matching la parure Aurora.",
    priceCents: 990,
    stock: 90,
    taxClass: "standard",
    imageUrl:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80",
    seoTitle: "Barrette Nœud Satin — Luna Bijoux",
    seoDescription: "Barrette nœud satin rose, accessoire girly.",
  },
  {
    name: "Anneau d'orteil Fleur",
    slug: "anneau-orteil-fleur",
    sku: "LUNA-TOE-016",
    description:
      "Mini fleur pour l'été, pieds nus & sandales. Détail kawaii beach-ready.",
    priceCents: 890,
    stock: 75,
    taxClass: "standard",
    imageUrl:
      "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80&hue=20",
    seoTitle: "Anneau d'orteil Fleur — Luna Bijoux",
    seoDescription: "Anneau orteil fleur fantaisie, summer girly.",
  },
];

async function ensureUser(app: ReturnType<typeof createApp>, db: ReturnType<typeof createDb>["db"]) {
  const [existing] = await db.select().from(user).where(eq(user.email, SEED_EMAIL)).limit(1);
  if (existing) {
    console.log(`User already exists: ${SEED_EMAIL}`);
    return existing;
  }

  const res = await app.request("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      name: "Luna Demo",
    }),
  });
  if (res.status >= 400) {
    const body = await res.text();
    throw new Error(`Sign-up failed (${res.status}): ${body}`);
  }
  const [created] = await db.select().from(user).where(eq(user.email, SEED_EMAIL)).limit(1);
  if (!created) throw new Error("User created but not found");
  console.log(`Created user: ${SEED_EMAIL}`);
  return created;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const { db, client } = createDb(databaseUrl);
  await seedPlans(db);

  const config = loadConfig();
  const auth = createAuth(db, config);
  const app = createApp({ db, auth, config });

  const seedUser = await ensureUser(app, db);

  let [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.slug, ORG_SLUG))
    .limit(1);

  if (!org) {
    [org] = await db
      .insert(organization)
      .values({
        name: "Luna Bijoux",
        slug: ORG_SLUG,
        planId: "pro",
        modulesAllowed: ["cms", "commerce"],
      })
      .returning();
    console.log(`Created organization: ${org!.name}`);
  } else {
    await db
      .update(organization)
      .set({
        name: "Luna Bijoux",
        modulesAllowed: ["cms", "commerce"],
        planId: "pro",
        updatedAt: new Date(),
      })
      .where(eq(organization.id, org.id));
    console.log(`Updated organization: ${org.name}`);
  }

  const [mem] = await db
    .select()
    .from(membership)
    .where(
      and(eq(membership.organizationId, org!.id), eq(membership.userId, seedUser.id)),
    )
    .limit(1);
  if (!mem) {
    await db.insert(membership).values({
      organizationId: org!.id,
      userId: seedUser.id,
      role: "owner",
    });
    console.log("Membership owner linked");
  }

  let [shop] = await db
    .select()
    .from(site)
    .where(and(eq(site.organizationId, org!.id), eq(site.slug, SITE_SLUG)))
    .limit(1);

  if (!shop) {
    [shop] = await db
      .insert(site)
      .values({
        organizationId: org!.id,
        name: "Luna Bijoux",
        slug: SITE_SLUG,
        status: "live",
        defaultLocale: "fr",
        seoDefaultTitle: "Luna Bijoux — Bijoux fantaisie girly",
        seoDefaultDescription:
          "Colliers, bagues, bracelets et boucles d'oreilles fantaisie — soft, rose, fairy.",
        llmsIntro:
          "Luna Bijoux is a girly fantasy jewelry boutique: rose gold tones, moons, hearts, pearls.",
        themeJson: {
          version: 2,
          preset: "luna",
          mood: "girly-fantasy",
        },
      })
      .returning();
    console.log(`Created site: ${shop!.slug}`);
  } else {
    await db
      .update(site)
      .set({
        name: "Luna Bijoux",
        status: "live",
        seoDefaultTitle: "Luna Bijoux — Bijoux fantaisie girly",
        seoDefaultDescription:
          "Colliers, bagues, bracelets et boucles d'oreilles fantaisie — soft, rose, fairy.",
        llmsIntro:
          "Luna Bijoux is a girly fantasy jewelry boutique: rose gold tones, moons, hearts, pearls.",
        themeJson: {
          version: 2,
          preset: "luna",
          mood: "girly-fantasy",
        },
        updatedAt: new Date(),
      })
      .where(eq(site.id, shop.id));
    console.log(`Updated site: ${shop.slug}`);
  }

  const [home] = await db
    .select()
    .from(page)
    .where(and(eq(page.siteId, shop!.id), eq(page.slug, "accueil")))
    .limit(1);
  if (!home) {
    await db.insert(page).values({
      siteId: shop!.id,
      slug: "accueil",
      title: "Bienvenue chez Luna",
      status: "published",
      bodyJson: {
        blocks: [
          {
            type: "hero",
            text: "Bijoux fantaisie soft & fairy — faites briller votre vibe girly.",
          },
        ],
      },
      seoTitle: "Luna Bijoux — Accueil",
      seoDescription: "Boutique bijoux fantaisie girly.",
    });
    console.log("Published page /accueil");
  }

  await ensureLegalPages(db, shop!.id);
  console.log("Ensured legal pages privacy/terms/legal");

  let upserted = 0;
  for (const item of CATALOG) {
    const [existing] = await db
      .select()
      .from(product)
      .where(and(eq(product.siteId, shop!.id), eq(product.sku, item.sku)))
      .limit(1);

    let productId = existing?.id;
    if (existing) {
      await db
        .update(product)
        .set({
          organizationId: org!.id,
          siteId: shop!.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          priceCents: item.priceCents,
          compareAtCents: item.compareAtCents ?? null,
          stock: item.stock,
          taxClass: item.taxClass,
          status: "active",
          imageUrl: item.imageUrl,
          seoTitle: item.seoTitle,
          seoDescription: item.seoDescription,
          currency: "eur",
          updatedAt: new Date(),
        })
        .where(eq(product.id, existing.id));
    } else {
      const [created] = await db
        .insert(product)
        .values({
          organizationId: org!.id,
          siteId: shop!.id, // published on Luna storefront
          name: item.name,
          slug: item.slug,
          sku: item.sku,
          description: item.description,
          priceCents: item.priceCents,
          compareAtCents: item.compareAtCents ?? null,
          currency: "eur",
          taxClass: item.taxClass,
          stock: item.stock,
          status: "active",
          imageUrl: item.imageUrl,
          seoTitle: item.seoTitle,
          seoDescription: item.seoDescription,
        })
        .returning();
      productId = created!.id;
    }
    const [prodRow] = await db
      .select()
      .from(product)
      .where(eq(product.id, productId!))
      .limit(1);
    if (prodRow) {
      await ensureDefaultVariant(db, prodRow);
      const [variant] = await db
        .select()
        .from(productVariant)
        .where(eq(productVariant.productId, prodRow.id))
        .limit(1);
      if (variant) {
        await db
          .update(productVariant)
          .set({
            priceCents: item.priceCents,
            stock: item.stock,
            status: "active",
            updatedAt: new Date(),
          })
          .where(eq(productVariant.id, variant.id));
      }
    }
    upserted += 1;
  }

  const seedCategories = [
    { name: "Colliers", slug: "colliers" },
    { name: "Boucles", slug: "boucles" },
    { name: "Bracelets", slug: "bracelets" },
  ];
  for (const cat of seedCategories) {
    const [existingCat] = await db
      .select()
      .from(category)
      .where(
        and(eq(category.organizationId, org!.id), eq(category.slug, cat.slug)),
      )
      .limit(1);
    if (!existingCat) {
      await db.insert(category).values({
        organizationId: org!.id,
        siteId: shop!.id,
        name: cat.name,
        slug: cat.slug,
      });
    }
  }

  const [colliers] = await db
    .select()
    .from(category)
    .where(
      and(eq(category.organizationId, org!.id), eq(category.slug, "colliers")),
    )
    .limit(1);
  if (colliers) {
    const collierProducts = await db
      .select()
      .from(product)
      .where(and(eq(product.siteId, shop!.id), eq(product.organizationId, org!.id)));
    for (const p of collierProducts.filter((x) => x.slug.includes("collier"))) {
      const [link] = await db
        .select()
        .from(productCategory)
        .where(
          and(
            eq(productCategory.productId, p.id),
            eq(productCategory.categoryId, colliers.id),
          ),
        )
        .limit(1);
      if (!link) {
        await db.insert(productCategory).values({
          productId: p.id,
          categoryId: colliers.id,
        });
      }
    }
  }

  const [legal] = await db
    .select()
    .from(merchantLegalProfile)
    .where(eq(merchantLegalProfile.organizationId, org!.id))
    .limit(1);
  if (!legal) {
    await db.insert(merchantLegalProfile).values({
      organizationId: org!.id,
      legalName: "Luna Bijoux SAS",
      siret: "12345678900012",
      vatNumber: "FR12123456789",
      invoicePrefix: "LUNA",
      rcs: "RCS Paris 123 456 789",
      capital: "10 000 €",
      addressJson: {
        line1: "12 rue des Perles",
        city: "Paris",
        postalCode: "75003",
        country: "FR",
      },
    });
    console.log("Created merchant legal profile");
  } else {
    await db
      .update(merchantLegalProfile)
      .set({
        legalName: "Luna Bijoux SAS",
        siret: "12345678900012",
        vatNumber: "FR12123456789",
        invoicePrefix: "LUNA",
        updatedAt: new Date(),
      })
      .where(eq(merchantLegalProfile.id, legal.id));
    console.log("Updated merchant legal profile");
  }

  const [existingZone] = await db
    .select()
    .from(shippingZone)
    .where(
      and(
        eq(shippingZone.organizationId, org!.id),
        eq(shippingZone.name, "France & Belgique"),
      ),
    )
    .limit(1);
  let zoneId = existingZone?.id;
  if (!existingZone) {
    const [zone] = await db
      .insert(shippingZone)
      .values({
        organizationId: org!.id,
        siteId: shop!.id,
        name: "France & Belgique",
        countriesJson: ["FR", "BE"],
      })
      .returning();
    zoneId = zone!.id;
    console.log("Created shipping zone France & Belgique");
  }
  const [existingMethod] = await db
    .select()
    .from(shippingMethod)
    .where(eq(shippingMethod.zoneId, zoneId!))
    .limit(1);
  if (!existingMethod) {
    await db.insert(shippingMethod).values({
      zoneId: zoneId!,
      name: "Colissimo",
      priceCents: 490,
      currency: "eur",
      active: true,
      sortOrder: 0,
    });
    await db.insert(shippingMethod).values({
      zoneId: zoneId!,
      name: "Point Relais",
      priceCents: 390,
      currency: "eur",
      active: true,
      sortOrder: 1,
    });
    console.log("Created shipping methods (Colissimo / Point Relais)");
  }

  const [featured] = await db
    .select()
    .from(product)
    .where(and(eq(product.siteId, shop!.id), eq(product.sku, CATALOG[0]!.sku)))
    .limit(1);
  if (featured?.imageUrl) {
    const extraUrl =
      "https://images.unsplash.com/photo-1515562140607-ee22621dd758?w=800";
    const existingLinks = await db
      .select()
      .from(productMedia)
      .where(eq(productMedia.productId, featured.id));
    if (existingLinks.length === 0) {
      for (const [i, url] of [featured.imageUrl, extraUrl].entries()) {
        const [asset] = await db
          .insert(mediaAsset)
          .values({
            organizationId: org!.id,
            siteId: shop!.id,
            key: `seed/${featured.sku}-${i}`,
            url,
            contentType: "image/jpeg",
          })
          .returning();
        await db.insert(productMedia).values({
          productId: featured.id,
          assetId: asset!.id,
          sortOrder: i,
          alt: featured.name,
        });
      }
      console.log(`Seeded gallery for ${featured.sku}`);
    }
  }

  console.log("");
  console.log("=== Luna Bijoux seed complete ===");
  console.log(`Products upserted: ${upserted}`);
  console.log(`Org:     Luna Bijoux (${ORG_SLUG})`);
  console.log(`Site:    ${shop!.name} slug=${SITE_SLUG}`);
  console.log(`Site ID: ${shop!.id}`);
  console.log("");
  console.log("Admin login:");
  console.log(`  email:    ${SEED_EMAIL}`);
  console.log(`  password: ${SEED_PASSWORD}`);
  console.log(`  URL:      http://localhost:5174/sign-in`);
  console.log("");
  console.log("Storefront (add to repo .env then restart web):");
  console.log(`  WEB_DEV_SITE_ID=${shop!.id}`);
  console.log(`  Shop:     http://localhost:3002/`);
  console.log(`  Products: http://localhost:5174/products (org Luna Bijoux)`);
  console.log("");

  await client.end({ timeout: 5 });
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
