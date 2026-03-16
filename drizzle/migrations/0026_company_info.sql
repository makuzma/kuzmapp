CREATE TABLE "company_info" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL DEFAULT '',
  "phone" text NOT NULL DEFAULT '',
  "address" text NOT NULL DEFAULT '',
  "contact_person" text NOT NULL DEFAULT '',
  "logo_path" text,
  "updated_at" timestamp NOT NULL DEFAULT now()
);
