CREATE TYPE "public"."coupon_type" AS ENUM('percent', 'fixed');--> statement-breakpoint
CREATE TABLE "coupon" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" text NOT NULL,
	"type" "coupon_type" NOT NULL,
	"value" integer NOT NULL,
	"min_subtotal_cents" integer,
	"max_redemptions" integer,
	"redemption_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "invoice_order_uidx";--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "parent_invoice_id" uuid;--> statement-breakpoint
ALTER TABLE "merchant_legal_profile" ADD COLUMN "credit_note_prefix" text DEFAULT 'AV' NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "low_stock_threshold" integer;--> statement-breakpoint
ALTER TABLE "store_order" ADD COLUMN "discount_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "store_order" ADD COLUMN "coupon_id" uuid;--> statement-breakpoint
ALTER TABLE "store_order" ADD COLUMN "coupon_code" text;--> statement-breakpoint
ALTER TABLE "store_order" ADD COLUMN "carrier" text;--> statement-breakpoint
ALTER TABLE "store_order" ADD COLUMN "tracking_number" text;--> statement-breakpoint
ALTER TABLE "store_order" ADD COLUMN "fulfilled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_org_code_uidx" ON "coupon" USING btree ("organization_id","code");--> statement-breakpoint
ALTER TABLE "store_order" ADD CONSTRAINT "store_order_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE set null ON UPDATE no action;