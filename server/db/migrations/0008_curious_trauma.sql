CREATE TABLE "saved_scenes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"adventure_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"character_ids" uuid[] DEFAULT '{}' NOT NULL,
	"background_id" uuid,
	"display_mode" text DEFAULT 'scene' NOT NULL,
	"table_shape" text DEFAULT 'round' NOT NULL,
	"table_seats" integer DEFAULT 4 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_scenes" ADD CONSTRAINT "saved_scenes_adventure_id_adventures_id_fk" FOREIGN KEY ("adventure_id") REFERENCES "public"."adventures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_scenes" ADD CONSTRAINT "saved_scenes_background_id_backgrounds_id_fk" FOREIGN KEY ("background_id") REFERENCES "public"."backgrounds"("id") ON DELETE set null ON UPDATE no action;