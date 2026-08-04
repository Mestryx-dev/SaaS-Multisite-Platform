ALTER TABLE "store_order" ADD COLUMN "payment_provider" text;--> statement-breakpoint
ALTER TABLE "store_order" ADD COLUMN "stripe_payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "store_order" ADD COLUMN "stripe_checkout_session_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "store_order_stripe_payment_intent_uidx" ON "store_order" USING btree ("stripe_payment_intent_id");
