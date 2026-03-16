CREATE TABLE "company_info" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"contact_person" text DEFAULT '' NOT NULL,
	"logo_path" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_billing" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"data" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_watchlist" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"symbol" text NOT NULL,
	"name" text NOT NULL,
	"exchange" text DEFAULT '' NOT NULL,
	"currency" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stock_watchlist_user_id_symbol_unique" UNIQUE("user_id","symbol")
);
--> statement-breakpoint
CREATE TABLE "time_phase_subcategory" (
	"id" text PRIMARY KEY NOT NULL,
	"phase_id" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_comment" ADD COLUMN "reply_to_id" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "project_phase" ADD COLUMN "active_subcategory_ids" json DEFAULT '[]'::json NOT NULL;--> statement-breakpoint
ALTER TABLE "time_entry" ADD COLUMN "subcategory_ids" json DEFAULT '[]'::json NOT NULL;--> statement-breakpoint
ALTER TABLE "vacation" ADD COLUMN "half_day_date" text;--> statement-breakpoint
ALTER TABLE "project_billing" ADD CONSTRAINT "project_billing_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_watchlist" ADD CONSTRAINT "stock_watchlist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_phase_subcategory" ADD CONSTRAINT "time_phase_subcategory_phase_id_time_phase_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."time_phase"("id") ON DELETE cascade ON UPDATE no action;