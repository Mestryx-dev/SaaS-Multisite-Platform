CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"site_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"options_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"price_cents" integer NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"status" "product_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_site_id_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."site"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "category_org_slug_uidx" ON "category" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "product_category_uidx" ON "product_category" USING btree ("product_id","category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variant_sku_uidx" ON "product_variant" USING btree ("product_id","sku");--> statement-breakpoint
INSERT INTO "product_variant" ("product_id", "sku", "options_json", "price_cents", "stock", "status")
SELECT "id", "sku", '{}'::jsonb, "price_cents", "stock", CASE WHEN "status" = 'archived' THEN 'archived'::"product_status" ELSE 'active'::"product_status" END
FROM "product";--> statement-breakpoint
DROP INDEX IF EXISTS "cart_item_cart_product_uidx";--> statement-breakpoint
ALTER TABLE "cart_item" ADD COLUMN "variant_id" uuid;--> statement-breakpoint
UPDATE "cart_item" ci
SET "variant_id" = pv."id"
FROM "product_variant" pv
WHERE pv."product_id" = ci."product_id";--> statement-breakpoint
DELETE FROM "cart_item" WHERE "variant_id" IS NULL;--> statement-breakpoint
ALTER TABLE "cart_item" ALTER COLUMN "variant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cart_item_cart_variant_uidx" ON "cart_item" USING btree ("cart_id","variant_id");--> statement-breakpoint
ALTER TABLE "store_order_item" ADD COLUMN "variant_id" uuid;--> statement-breakpoint
UPDATE "store_order_item" oi
SET "variant_id" = pv."id"
FROM "product_variant" pv
WHERE oi."product_id" IS NOT NULL AND pv."product_id" = oi."product_id";--> statement-breakpoint
ALTER TABLE "store_order_item" ADD CONSTRAINT "store_order_item_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE set null ON UPDATE no action;
