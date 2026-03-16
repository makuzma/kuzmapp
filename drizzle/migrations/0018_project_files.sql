CREATE TABLE "project_file" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "original_name" text NOT NULL,
  "file_path" text NOT NULL,
  "mime_type" text NOT NULL DEFAULT '',
  "file_size" integer NOT NULL DEFAULT 0,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "created_at" timestamp NOT NULL DEFAULT now()
);
