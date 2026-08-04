ALTER TABLE "product" DROP CONSTRAINT "product_site_id_site_id_fk";
--> statement-breakpoint
DROP INDEX "product_site_slug_uidx";--> statement-breakpoint
DROP INDEX "product_site_sku_uidx";--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "site_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_site_id_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."site"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_org_slug_uidx" ON "product" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "product_org_sku_uidx" ON "product" USING btree ("organization_id","sku");