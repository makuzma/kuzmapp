CREATE TABLE "berechnungsschema" (
  "id" text PRIMARY KEY NOT NULL,
  "customer_id" text NOT NULL REFERENCES "customer"("id") ON DELETE CASCADE,
  "product_id" text NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "product_type_id" text NOT NULL REFERENCES "product_type"("id") ON DELETE CASCADE,
  "entries" json NOT NULL DEFAULT '{}',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE("customer_id", "product_id", "product_type_id")
);
