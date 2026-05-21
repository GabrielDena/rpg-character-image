ALTER TABLE "characters" ADD COLUMN "type" varchar(3) DEFAULT 'npc' NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "playbook" varchar(255);--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "avatar_path" text;