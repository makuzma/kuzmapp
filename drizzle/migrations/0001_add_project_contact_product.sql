ALTER TABLE "project" ADD COLUMN "contact_id" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "product_id" text;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_contact_id_customer_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."customer_contact"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;
