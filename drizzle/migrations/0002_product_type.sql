CREATE TABLE "product_type" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "product_product_type" (
  "product_id" text NOT NULL REFERENCES "product"("id") ON DELETE cascade,
  "product_type_id" text NOT NULL REFERENCES "product_type"("id") ON DELETE cascade,
  PRIMARY KEY ("product_id", "product_type_id")
);
