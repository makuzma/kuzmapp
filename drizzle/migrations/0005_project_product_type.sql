ALTER TABLE "project" ADD COLUMN "product_type_id" text REFERENCES "product_type"("id") ON DELETE SET NULL;
