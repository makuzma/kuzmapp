ALTER TABLE "vacation" ADD COLUMN "approved" boolean NOT NULL DEFAULT false;
ALTER TABLE "vacation" ADD COLUMN "approved_by" text;
ALTER TABLE "vacation" ADD CONSTRAINT "vacation_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
