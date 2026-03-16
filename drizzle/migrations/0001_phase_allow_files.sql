ALTER TABLE "time_phase" ADD COLUMN "allow_files" boolean DEFAULT false NOT NULL;
ALTER TABLE "time_entry" ADD COLUMN "file_path" text;
