CREATE TABLE "time_entry_category" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "time_entry" ADD COLUMN "category_id" text REFERENCES "time_entry_category"("id") ON DELETE SET NULL;
