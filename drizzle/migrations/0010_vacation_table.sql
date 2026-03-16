CREATE TABLE IF NOT EXISTS "vacation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"description" text NOT NULL DEFAULT '',
	"created_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "vacation" ADD CONSTRAINT "vacation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
