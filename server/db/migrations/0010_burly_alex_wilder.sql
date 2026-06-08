CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"adventure_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_adventure_id_adventures_id_fk" FOREIGN KEY ("adventure_id") REFERENCES "public"."adventures"("id") ON DELETE cascade ON UPDATE no action;