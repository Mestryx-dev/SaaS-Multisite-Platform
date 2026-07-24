CREATE TABLE "site_banner" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"image_url" text,
	"href" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site" ADD COLUMN "cookie_consent_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "site" ADD COLUMN "cookie_policy_path" text DEFAULT '/privacy' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_banner" ADD CONSTRAINT "site_banner_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_banner" ADD CONSTRAINT "site_banner_site_id_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."site"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "site_banner_site_sort_uidx" ON "site_banner" USING btree ("site_id","sort_order","id");