CREATE TABLE "tracking_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"adventure_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" varchar(20) DEFAULT 'tag' NOT NULL,
	"value" real,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tracking_cards" ADD CONSTRAINT "tracking_cards_adventure_id_adventures_id_fk" FOREIGN KEY ("adventure_id") REFERENCES "public"."adventures"("id") ON DELETE cascade ON UPDATE no action;
