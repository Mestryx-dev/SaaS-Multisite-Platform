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
  coupon,
  customer,
  customerAddress,
  invoice,
  mediaAsset,
  membership,
  merchantLegalProfile,
  orderEvent,
  organization,
  page,
  product,
  productCategory,
  productMedia,
  productVariant,
  returnRequest,
  shippingMethod,
  shippingZone,
  site,
  storeOrder,
  storeOrderItem,
  user,
} from "./schema.js";
import { loadConfig } from "../lib/config.js";
import { createAuth } from "../modules/identity/auth.js";
import { seedPlans } from "../modules/billing/routes.js";
import { ensureLegalPages } from "../modules/cms/legal-pages.js";
import {
  ensureDefaultVariant,
  syncProductStockFromVariants,
} from "../modules/commerce/catalog-routes.js";

// This file lives in apps/api/src/db → four levels up to repo root
const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../..");
loadDotenv({ path: resolve(repoRoot, ".env") });
loadDotenv({ path: resolve(process.cwd(), "../../.env") });
loadDotenv({ path: resolve(process.cwd(), ".env") });

const SEED_EMAIL = process.env.SEED_EMAIL ?? "demo@lunabijoux.local";
/** Required — no default password in source (OSS / public-repo hygiene). */
const SEED_PASSWORD = process.env.SEED_PASSWORD?.trim() ?? "";
if (!SEED_PASSWORD) {
  throw new Error(
    "SEED_PASSWORD is required to run the Luna seed. Set it in your local .env (see .env.example). Never commit real passwords.",
  );
}
const ORG_SLUG = "luna-bijoux";
const SITE_SLUG = "luna";

type SeedVariant = {
  sku: string;
  options: Record<string, string>;
  stock: number;
  priceCents?: number;
  status?: "draft" | "active" | "archived";
};

type SeedProduct = {
  name: string;
  slug: string;
  sku: string;
  description: string;
  priceCents: number;
  compareAtCents?: number;
  /** Aggregate stock when no variants; ignored when variants are set (synced from variants). */
  stock: number;
  /** null = no alert; stock <= threshold → dashboard low-stock / “réappro” panel */
  lowStockThreshold?: number | null;
  status?: "draft" | "active" | "archived";
  taxClass: "standard" | "reduced";
  imageUrl: string;
  seoTitle: string;
  seoDescription: string;
  /** Color/size SKUs — drives the full inventory panel in admin Products. */
  variants?: SeedVariant[];
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
    lowStockThreshold: 10,
    status: "active",
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
      "Papillons légers effet satin, clips doux. Variantes couleur — stock mixte (en stock / bas / rupture).",
    priceCents: 1890,
    stock: 0, // synced from variants
    lowStockThreshold: 8,
    status: "active",
    taxClass: "standard",
    imageUrl:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
    seoTitle: "Boucles Papillon Satin — Luna Bijoux",
    seoDescription: "Boucles d'oreilles papillon fantaisie, ambiance girly.",
    variants: [
      {
        sku: "LUNA-ORE-002-ROSE",
        options: { color: "Rose poudré" },
        stock: 24,
        status: "active",
      },
      {
        sku: "LUNA-ORE-002-LILAS",
        options: { color: "Lilas" },
        stock: 5,
        status: "active",
      },
      {
        sku: "LUNA-ORE-002-OR",
        options: { color: "Or rose" },
        stock: 0,
        status: "active",
      },
      {
        sku: "LUNA-ORE-002-ARGENT",
        options: { color: "Argent" },
        stock: 0,
        status: "archived",
      },
    ],
  },
  {
    name: "Bracelet Charms Cœur",
    slug: "bracelet-charms-coeur",
    sku: "LUNA-BRA-003",
    description:
      "Chaîne délicate avec charms cœur, étoile et perle. Stock bas — réapprovisionnement entrepôt en cours.",
    priceCents: 2190,
    compareAtCents: 2790,
    stock: 3,
    lowStockThreshold: 12,
    status: "active",
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
      "Perle nacrée montée sur anneau ajustable. Variantes taille × couleur pour dogfood inventaire.",
    priceCents: 1590,
    stock: 0,
    lowStockThreshold: 6,
    status: "active",
    taxClass: "standard",
    imageUrl:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80",
    seoTitle: "Bague Perle Nacrée — Luna Bijoux",
    seoDescription: "Bague perle fantaisie, style soft glam.",
    variants: [
      {
        sku: "LUNA-BAG-004-S-ROSE",
        options: { size: "S", color: "Or rose" },
        stock: 18,
        status: "active",
      },
      {
        sku: "LUNA-BAG-004-M-ROSE",
        options: { size: "M", color: "Or rose" },
        stock: 4,
        status: "active",
      },
      {
        sku: "LUNA-BAG-004-L-ROSE",
        options: { size: "L", color: "Or rose" },
        stock: 0,
        status: "active",
      },
      {
        sku: "LUNA-BAG-004-M-ARGENT",
        options: { size: "M", color: "Argent" },
        stock: 12,
        status: "active",
      },
      {
        sku: "LUNA-BAG-004-M-OR",
        options: { size: "M", color: "Or jaune" },
        stock: 2,
        status: "draft",
      },
    ],
  },
  {
    name: "Collier Chaîne Étoile",
    slug: "collier-chaine-etoile",
    sku: "LUNA-COL-005",
    description:
      "Mini étoile scintillante sur chaîne fine. Rupture de stock — réassort prévu semaine prochaine.",
    priceCents: 1990,
    stock: 0,
    lowStockThreshold: 5,
    status: "active",
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
    lowStockThreshold: 8,
    status: "active",
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
      "Rangée de cristaux rose pâle. Variantes finition — une couleur en rupture.",
    priceCents: 3490,
    compareAtCents: 4200,
    stock: 0,
    lowStockThreshold: 10,
    status: "active",
    taxClass: "standard",
    imageUrl:
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80",
    seoTitle: "Bracelet Tennis Rose — Luna Bijoux",
    seoDescription: "Bracelet tennis cristaux roses, glam girly.",
    variants: [
      {
        sku: "LUNA-BRA-007-ROSE",
        options: { color: "Rose pâle" },
        stock: 14,
        status: "active",
      },
      {
        sku: "LUNA-BRA-007-CRYSTAL",
        options: { color: "Crystal clear" },
        stock: 0,
        status: "active",
      },
      {
        sku: "LUNA-BRA-007-CHAMPAGNE",
        options: { color: "Champagne" },
        stock: 7,
        status: "active",
      },
    ],
  },
  {
    name: "Bague Duo Cœurs",
    slug: "bague-duo-coeurs",
    sku: "LUNA-BAG-008",
    description:
      "Deux petits cœurs entrelacés, finition or rose. Cadeau bestie ou crush.",
    priceCents: 1290,
    stock: 80,
    lowStockThreshold: 15,
    status: "active",
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
      "Parure aurora : collier + boucles assorties. Stock critique — réappro urgent.",
    priceCents: 4490,
    compareAtCents: 5490,
    stock: 2,
    lowStockThreshold: 8,
    status: "active",
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
      "Choker velours rose poudré avec pendentif cœur. Brouillon catalogue — pas encore publié boutique.",
    priceCents: 1790,
    stock: 40,
    lowStockThreshold: 10,
    status: "draft",
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
      "Gouttes cristal irisé. Référence archivée (fin de collection).",
    priceCents: 2690,
    stock: 0,
    lowStockThreshold: null,
    status: "archived",
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
    lowStockThreshold: 12,
    status: "active",
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
    lowStockThreshold: 10,
    status: "active",
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
    lowStockThreshold: 8,
    status: "active",
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
    lowStockThreshold: 20,
    status: "active",
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
    lowStockThreshold: 15,
    status: "active",
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
    if (!existing.emailVerified) {
      await db
        .update(user)
        .set({ emailVerified: true, updatedAt: new Date() })
        .where(eq(user.id, existing.id));
      console.log(`Verified existing seed user: ${SEED_EMAIL}`);
      return { ...existing, emailVerified: true };
    }
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
  // Dogfood seed: Better Auth leaves email unverified; mark verified so admin console works.
  await db
    .update(user)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(user.email, SEED_EMAIL));
  const [created] = await db.select().from(user).where(eq(user.email, SEED_EMAIL)).limit(1);
  if (!created) throw new Error("User created but not found");
  console.log(`Created user (verified): ${SEED_EMAIL}`);
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
    const productStatus = item.status ?? "active";
    const lowStockThreshold =
      item.lowStockThreshold === undefined ? 10 : item.lowStockThreshold;
    const initialStock = item.variants?.length
      ? item.variants
          .filter((v) => (v.status ?? "active") === "active")
          .reduce((sum, v) => sum + v.stock, 0)
      : item.stock;

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
          stock: initialStock,
          lowStockThreshold,
          taxClass: item.taxClass,
          status: productStatus,
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
          stock: initialStock,
          lowStockThreshold,
          status: productStatus,
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

      if (item.variants?.length) {
        // Archive bare default SKU so color/size rows own inventory.
        await db
          .update(productVariant)
          .set({
            status: "archived",
            stock: 0,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(productVariant.productId, prodRow.id),
              eq(productVariant.sku, item.sku),
            ),
          );

        for (const v of item.variants) {
          const variantStatus = v.status ?? "active";
          const variantPrice = v.priceCents ?? item.priceCents;
          const [existingVariant] = await db
            .select()
            .from(productVariant)
            .where(
              and(
                eq(productVariant.productId, prodRow.id),
                eq(productVariant.sku, v.sku),
              ),
            )
            .limit(1);
          if (existingVariant) {
            await db
              .update(productVariant)
              .set({
                optionsJson: v.options,
                priceCents: variantPrice,
                stock: v.stock,
                status: variantStatus,
                updatedAt: new Date(),
              })
              .where(eq(productVariant.id, existingVariant.id));
          } else {
            await db.insert(productVariant).values({
              productId: prodRow.id,
              sku: v.sku,
              optionsJson: v.options,
              priceCents: variantPrice,
              stock: v.stock,
              status: variantStatus,
            });
          }
        }
        await syncProductStockFromVariants(db, prodRow.id);
      } else {
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
              status: productStatus === "archived" ? "archived" : "active",
              optionsJson: {},
              updatedAt: new Date(),
            })
            .where(eq(productVariant.id, variant.id));
        }
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

  // --- Demo commerce: customers, orders, tracking, returns (idempotent by publicId / email) ---
  const shopProducts = await db
    .select()
    .from(product)
    .where(and(eq(product.siteId, shop!.id), eq(product.status, "active")));
  const bySku = new Map(shopProducts.map((p) => [p.sku, p]));

  const methods = await db
    .select()
    .from(shippingMethod)
    .where(eq(shippingMethod.zoneId, zoneId!));
  const colissimo = methods.find((m) => m.name === "Colissimo") ?? methods[0];
  const relais = methods.find((m) => m.name === "Point Relais") ?? methods[1] ?? colissimo;

  let demoCouponId: string | undefined;
  {
    const [existingCoupon] = await db
      .select()
      .from(coupon)
      .where(
        and(eq(coupon.organizationId, org!.id), eq(coupon.code, "LUNA10")),
      )
      .limit(1);
    if (existingCoupon) {
      demoCouponId = existingCoupon.id;
    } else {
      const [created] = await db
        .insert(coupon)
        .values({
          organizationId: org!.id,
          code: "LUNA10",
          type: "percent",
          value: 1000,
          minSubtotalCents: 2000,
          maxRedemptions: 100,
          active: true,
        })
        .returning();
      demoCouponId = created!.id;
      console.log("Created coupon LUNA10 (−10%)");
    }
  }

  type DemoCustomer = {
    email: string;
    name: string;
    address: {
      label: string;
      line1: string;
      city: string;
      postalCode: string;
      country: string;
    };
  };

  const DEMO_CUSTOMERS: DemoCustomer[] = [
    {
      email: "camille.martin@example.com",
      name: "Camille Martin",
      address: {
        label: "Domicile",
        line1: "18 rue des Abbesses",
        city: "Paris",
        postalCode: "75018",
        country: "FR",
      },
    },
    {
      email: "lea.dubois@example.com",
      name: "Léa Dubois",
      address: {
        label: "Appartement",
        line1: "4 avenue Jean Jaurès",
        city: "Lyon",
        postalCode: "69007",
        country: "FR",
      },
    },
    {
      email: "sofia.nguyen@example.com",
      name: "Sofia Nguyen",
      address: {
        label: "Maison",
        line1: "22 quai des Chartrons",
        city: "Bordeaux",
        postalCode: "33000",
        country: "FR",
      },
    },
    {
      email: "emma.bernard@example.com",
      name: "Emma Bernard",
      address: {
        label: "Domicile",
        line1: "9 place du Capitole",
        city: "Toulouse",
        postalCode: "31000",
        country: "FR",
      },
    },
  ];

  const customerIds = new Map<string, string>();
  for (const c of DEMO_CUSTOMERS) {
    const [existing] = await db
      .select()
      .from(customer)
      .where(and(eq(customer.siteId, shop!.id), eq(customer.email, c.email)))
      .limit(1);
    let customerId = existing?.id;
    if (!existing) {
      const [created] = await db
        .insert(customer)
        .values({
          organizationId: org!.id,
          siteId: shop!.id,
          email: c.email,
          name: c.name,
        })
        .returning();
      customerId = created!.id;
      await db.insert(customerAddress).values({
        siteId: shop!.id,
        customerId: customerId!,
        label: c.address.label,
        name: c.name,
        line1: c.address.line1,
        city: c.address.city,
        postalCode: c.address.postalCode,
        country: c.address.country,
        isDefault: true,
      });
    }
    customerIds.set(c.email, customerId!);
  }
  console.log(`Demo customers ready: ${customerIds.size}`);

  type LineSpec = { sku: string; qty: number };
  type DemoOrder = {
    publicId: string;
    email: string;
    status: "pending_payment" | "paid" | "fulfilled" | "cancelled" | "refunded";
    lines: LineSpec[];
    shippingCents: number;
    methodId?: string;
    carrier?: string;
    trackingNumber?: string;
    couponCode?: string;
    discountCents?: number;
    daysAgo: number;
    events: Array<{ type: string; message: string; hoursAfter: number }>;
    return?: { reason: string; status: "requested" | "approved" | "rejected" };
    invoiceNumber?: string;
  };

  const addrFor = (email: string) => {
    const c = DEMO_CUSTOMERS.find((x) => x.email === email)!;
    return {
      name: c.name,
      line1: c.address.line1,
      city: c.address.city,
      postalCode: c.address.postalCode,
      country: c.address.country,
    };
  };

  const DEMO_ORDERS: DemoOrder[] = [
    {
      publicId: "ord_seed_luna_pending01",
      email: "camille.martin@example.com",
      status: "pending_payment",
      lines: [
        { sku: "LUNA-COL-001", qty: 1 },
        { sku: "LUNA-ORE-002", qty: 1 },
      ],
      shippingCents: 490,
      methodId: colissimo?.id,
      daysAgo: 0,
      events: [
        { type: "created", message: "Order placed — awaiting payment", hoursAfter: 0 },
      ],
    },
    {
      publicId: "ord_seed_luna_paid01",
      email: "lea.dubois@example.com",
      status: "paid",
      lines: [{ sku: "LUNA-BRA-003", qty: 1 }],
      shippingCents: 390,
      methodId: relais?.id,
      couponCode: "LUNA10",
      discountCents: 0,
      daysAgo: 1,
      events: [
        { type: "created", message: "Order placed", hoursAfter: 0 },
        { type: "paid", message: "Payment confirmed (demo)", hoursAfter: 1 },
      ],
      invoiceNumber: "LUNA-2026-0001",
    },
    {
      publicId: "ord_seed_luna_shipped01",
      email: "sofia.nguyen@example.com",
      status: "fulfilled",
      lines: [
        { sku: "LUNA-COL-001", qty: 1 },
        { sku: "LUNA-BAG-004", qty: 2 },
      ],
      shippingCents: 490,
      methodId: colissimo?.id,
      carrier: "Colissimo",
      trackingNumber: "8R12345678901",
      daysAgo: 5,
      events: [
        { type: "created", message: "Order placed", hoursAfter: 0 },
        { type: "paid", message: "Payment confirmed (demo)", hoursAfter: 2 },
        {
          type: "fulfilled",
          message: "Shipped via Colissimo · 8R12345678901",
          hoursAfter: 28,
        },
      ],
      invoiceNumber: "LUNA-2026-0002",
    },
    {
      publicId: "ord_seed_luna_shipped02",
      email: "emma.bernard@example.com",
      status: "fulfilled",
      lines: [{ sku: "LUNA-ORE-002", qty: 2 }],
      shippingCents: 490,
      methodId: colissimo?.id,
      carrier: "Colissimo",
      trackingNumber: "8R98765432109",
      daysAgo: 12,
      events: [
        { type: "created", message: "Order placed", hoursAfter: 0 },
        { type: "paid", message: "Payment confirmed (demo)", hoursAfter: 1 },
        {
          type: "fulfilled",
          message: "Shipped via Colissimo · 8R98765432109",
          hoursAfter: 30,
        },
        {
          type: "delivered",
          message: "Delivered (carrier scan — demo)",
          hoursAfter: 96,
        },
      ],
      return: {
        reason: "Taille / modèle ne convient pas — échange souhaité",
        status: "requested",
      },
      invoiceNumber: "LUNA-2026-0003",
    },
    {
      publicId: "ord_seed_luna_return_ok",
      email: "camille.martin@example.com",
      status: "fulfilled",
      lines: [{ sku: "LUNA-COL-001", qty: 1 }],
      shippingCents: 390,
      methodId: relais?.id,
      carrier: "Mondial Relay",
      trackingNumber: "MR4455667788",
      daysAgo: 20,
      events: [
        { type: "created", message: "Order placed", hoursAfter: 0 },
        { type: "paid", message: "Payment confirmed (demo)", hoursAfter: 1 },
        { type: "fulfilled", message: "Shipped via Mondial Relay", hoursAfter: 24 },
      ],
      return: {
        reason: "Article endommagé à la réception",
        status: "approved",
      },
      invoiceNumber: "LUNA-2026-0004",
    },
    {
      publicId: "ord_seed_luna_cancelled01",
      email: "lea.dubois@example.com",
      status: "cancelled",
      lines: [{ sku: "LUNA-BRA-003", qty: 1 }],
      shippingCents: 490,
      methodId: colissimo?.id,
      daysAgo: 3,
      events: [
        { type: "created", message: "Order placed", hoursAfter: 0 },
        {
          type: "cancelled",
          message: "Cancelled by customer before payment",
          hoursAfter: 4,
        },
      ],
    },
    {
      publicId: "ord_seed_luna_refunded01",
      email: "sofia.nguyen@example.com",
      status: "refunded",
      lines: [{ sku: "LUNA-ORE-002", qty: 1 }],
      shippingCents: 490,
      methodId: colissimo?.id,
      carrier: "Colissimo",
      trackingNumber: "8R55566677788",
      daysAgo: 25,
      events: [
        { type: "created", message: "Order placed", hoursAfter: 0 },
        { type: "paid", message: "Payment confirmed (demo)", hoursAfter: 1 },
        { type: "fulfilled", message: "Shipped", hoursAfter: 36 },
        {
          type: "refunded",
          message: "Refund issued after approved return (demo — no Stripe)",
          hoursAfter: 200,
        },
      ],
      return: {
        reason: "Allergie au métal — remboursement",
        status: "approved",
      },
      invoiceNumber: "LUNA-2026-0005",
    },
  ];

  // Resolve SKUs that may not exist (catalog slugs vary) — fall back to first products
  const fallbackSkus = shopProducts.slice(0, 4).map((p) => p.sku);
  const resolveSku = (sku: string) => {
    if (bySku.has(sku)) return sku;
    return fallbackSkus[0] ?? sku;
  };

  let ordersCreated = 0;
  for (const demo of DEMO_ORDERS) {
    const [existingOrder] = await db
      .select()
      .from(storeOrder)
      .where(eq(storeOrder.publicId, demo.publicId))
      .limit(1);
    if (existingOrder) continue;

    const lines = demo.lines.map((l) => {
      const sku = resolveSku(l.sku);
      const p = bySku.get(sku) ?? shopProducts[0]!;
      return { product: p, qty: l.qty, sku: p.sku, name: p.name, unit: p.priceCents };
    });
    const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
    let discount = demo.discountCents ?? 0;
    if (demo.couponCode === "LUNA10" && discount === 0) {
      discount = Math.round(subtotal * 0.1);
    }
    const shipping = demo.shippingCents;
    const tax = Math.round((subtotal - discount) * 0.2);
    const total = subtotal - discount + shipping + tax;
    const createdAt = new Date(Date.now() - demo.daysAgo * 24 * 60 * 60 * 1000);
    const address = addrFor(demo.email);

    const [order] = await db
      .insert(storeOrder)
      .values({
        publicId: demo.publicId,
        organizationId: org!.id,
        siteId: shop!.id,
        customerId: customerIds.get(demo.email),
        email: demo.email,
        status: demo.status,
        currency: "eur",
        subtotalCents: subtotal,
        discountCents: discount,
        shippingCents: shipping,
        taxCents: tax,
        totalCents: total,
        couponId: demo.couponCode === "LUNA10" ? demoCouponId : undefined,
        couponCode: demo.couponCode,
        shippingMethodId: demo.methodId,
        shippingAddressJson: address,
        billingAddressJson: address,
        carrier: demo.carrier,
        trackingNumber: demo.trackingNumber,
        paymentProvider: demo.status === "pending_payment" ? null : "demo",
        paidAt:
          demo.status === "paid" ||
          demo.status === "fulfilled" ||
          demo.status === "refunded"
            ? new Date(createdAt.getTime() + 60 * 60 * 1000)
            : null,
        fulfilledAt:
          demo.status === "fulfilled" || demo.status === "refunded"
            ? new Date(createdAt.getTime() + 28 * 60 * 60 * 1000)
            : null,
        cancelledAt:
          demo.status === "cancelled"
            ? new Date(createdAt.getTime() + 4 * 60 * 60 * 1000)
            : null,
        createdAt,
        updatedAt: createdAt,
      })
      .returning();

    for (const line of lines) {
      await db.insert(storeOrderItem).values({
        orderId: order!.id,
        productId: line.product.id,
        sku: line.sku,
        name: line.name,
        quantity: line.qty,
        unitPriceCents: line.unit,
        taxClass: line.product.taxClass ?? "standard",
      });
    }

    for (const ev of demo.events) {
      await db.insert(orderEvent).values({
        orderId: order!.id,
        type: ev.type,
        message: ev.message,
        createdAt: new Date(createdAt.getTime() + ev.hoursAfter * 60 * 60 * 1000),
      });
    }

    if (demo.return) {
      await db.insert(returnRequest).values({
        organizationId: org!.id,
        siteId: shop!.id,
        orderId: order!.id,
        reason: demo.return.reason,
        status: demo.return.status,
        itemsJson: lines.map((l) => ({
          sku: l.sku,
          name: l.name,
          quantity: l.qty,
        })),
        createdAt: new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000),
      });
    }

    if (
      demo.invoiceNumber &&
      (demo.status === "paid" ||
        demo.status === "fulfilled" ||
        demo.status === "refunded")
    ) {
      const [existingInv] = await db
        .select()
        .from(invoice)
        .where(
          and(
            eq(invoice.organizationId, org!.id),
            eq(invoice.number, demo.invoiceNumber),
          ),
        )
        .limit(1);
      if (!existingInv) {
        await db.insert(invoice).values({
          organizationId: org!.id,
          siteId: shop!.id,
          orderId: order!.id,
          number: demo.invoiceNumber,
          kind: "invoice",
          issuedAt: new Date(createdAt.getTime() + 2 * 60 * 60 * 1000),
          totalsJson: {
            subtotalCents: subtotal,
            discountCents: discount,
            shippingCents: shipping,
            taxCents: tax,
            totalCents: total,
            currency: "eur",
          },
          pdfReady: true,
        });
      }
    }

    ordersCreated += 1;
  }
  console.log(`Demo orders created this run: ${ordersCreated}`);

  console.log("");
  console.log("=== Luna Bijoux seed complete ===");
  console.log(`Products upserted: ${upserted}`);
  console.log(`Org:     Luna Bijoux (${ORG_SLUG})`);
  console.log(`Site:    ${shop!.name} slug=${SITE_SLUG}`);
  console.log(`Site ID: ${shop!.id}`);
  console.log("");
  console.log("Admin login:");
  console.log(`  email:    ${SEED_EMAIL}`);
  console.log("  password: (the SEED_PASSWORD you set in .env — not printed)");
  console.log(`  URL:      http://localhost:5174/sign-in`);
  console.log("");
  console.log("Demo commerce (Orders / Returns / tracking):");
  console.log("  pending · paid · fulfilled+tracking · return requested/approved · cancelled · refunded");
  console.log("  Coupon: LUNA10 (−10%)");
  console.log("");
  console.log("Demo inventory panel:");
  console.log("  in stock · low stock (réappro) · out of stock · draft · archived");
  console.log("  color/size variants on Papillon, Bague Perle, Tennis");
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
