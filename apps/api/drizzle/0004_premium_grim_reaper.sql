CREATE TYPE "public"."invoice_kind" AS ENUM('invoice', 'credit_note');--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"number" text NOT NULL,
	"kind" "invoice_kind" DEFAULT 'invoice' NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"totals_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"pdf_ready" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchant_legal_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"legal_name" text NOT NULL,
	"siret" text,
	"vat_number" text,
	"address_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"invoice_prefix" text DEFAULT 'INV' NOT NULL,
	"rcs" text,
	"capital" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_order" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "store_order" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_site_id_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."site"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_order_id_store_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."store_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_legal_profile" ADD CONSTRAINT "merchant_legal_profile_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_event" ADD CONSTRAINT "order_event_order_id_store_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."store_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_order_uidx" ON "invoice" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_org_number_uidx" ON "invoice" USING btree ("organization_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "merchant_legal_org_uidx" ON "merchant_legal_profile" USING btree ("organization_id");