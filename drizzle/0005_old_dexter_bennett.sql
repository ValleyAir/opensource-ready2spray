ALTER TABLE "products_complete" ADD COLUMN "label_version" varchar(100);--> statement-breakpoint
ALTER TABLE "products_complete" ADD COLUMN "application_methods" text;--> statement-breakpoint
ALTER TABLE "products_complete" ADD COLUMN "mode_of_action" varchar(255);--> statement-breakpoint
ALTER TABLE "products_complete" ADD COLUMN "physical_state" varchar(100);--> statement-breakpoint
ALTER TABLE "products_complete" ADD COLUMN "formulation_type" varchar(100);--> statement-breakpoint
ALTER TABLE "products_complete" ADD COLUMN "toxic_to" varchar(255);--> statement-breakpoint
ALTER TABLE "products_complete" ADD COLUMN "rainfastness" varchar(255);--> statement-breakpoint
ALTER TABLE "products_complete" ADD COLUMN "federally_restricted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products_complete" ADD COLUMN "organic_certifications" varchar(255);--> statement-breakpoint
ALTER TABLE "products_complete" ADD COLUMN "posting_required" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products_complete" ADD COLUMN "avoid_grazing" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products_complete" ADD COLUMN "response_number" varchar(50);--> statement-breakpoint
ALTER TABLE "products_complete" ADD COLUMN "medical_number" varchar(50);--> statement-breakpoint
ALTER TABLE "products_complete" ADD COLUMN "general_notice" text;