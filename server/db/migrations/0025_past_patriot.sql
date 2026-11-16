CREATE TABLE "character_group_members" (
	"group_id" uuid NOT NULL,
	"character_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"adventure_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_group_members" ADD CONSTRAINT "character_group_members_group_id_character_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."character_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_group_members" ADD CONSTRAINT "character_group_members_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_groups" ADD CONSTRAINT "character_groups_adventure_id_adventures_id_fk" FOREIGN KEY ("adventure_id") REFERENCES "public"."adventures"("id") ON DELETE cascade ON UPDATE no action;