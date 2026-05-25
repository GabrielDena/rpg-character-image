ALTER TABLE "display_state" ADD COLUMN "display_mode" varchar(10) DEFAULT 'scene' NOT NULL;--> statement-breakpoint
ALTER TABLE "display_state" ADD COLUMN "table_shape" varchar(10) DEFAULT 'round' NOT NULL;--> statement-breakpoint
ALTER TABLE "display_state" ADD COLUMN "table_seats" integer DEFAULT 4 NOT NULL;