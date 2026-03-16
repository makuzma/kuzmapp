CREATE TABLE "project_billing" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "data" json NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
