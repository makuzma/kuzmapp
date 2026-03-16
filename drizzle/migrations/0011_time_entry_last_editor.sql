ALTER TABLE "time_entry" ADD COLUMN IF NOT EXISTS "last_edited_by_user_id" text REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
