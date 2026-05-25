ALTER TABLE "display_state" ADD COLUMN "selected_background_id" uuid;--> statement-breakpoint
ALTER TABLE "display_state" ADD CONSTRAINT "display_state_selected_background_id_backgrounds_id_fk" FOREIGN KEY ("selected_background_id") REFERENCES "public"."backgrounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "display_state" DROP COLUMN "selected_background";