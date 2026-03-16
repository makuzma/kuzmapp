CREATE TABLE "time_phase_subcategory" (
  "id" text PRIMARY KEY NOT NULL,
  "phase_id" text NOT NULL REFERENCES "time_phase"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now()
);
