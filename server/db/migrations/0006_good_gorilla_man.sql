ALTER TABLE "display_state" ALTER COLUMN "gallery_fit_mode" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "display_state" ALTER COLUMN "gallery_fit_mode" SET DEFAULT 'cover';--> statement-breakpoint
ALTER TABLE "display_state" ALTER COLUMN "display_mode" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "display_state" ALTER COLUMN "display_mode" SET DEFAULT 'scene';--> statement-breakpoint
ALTER TABLE "display_state" ALTER COLUMN "table_shape" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "display_state" ALTER COLUMN "table_shape" SET DEFAULT 'round';