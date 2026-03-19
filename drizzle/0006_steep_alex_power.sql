CREATE TYPE "public"."account_status" AS ENUM('active', 'inactive', 'lead', 'prospect');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('agricultural', 'commercial', 'residential', 'government', 'other');--> statement-breakpoint
CREATE TYPE "public"."preferred_contact_method" AS ENUM('phone', 'email', 'text', 'mail');--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "company_name" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "customer_type" "customer_type" DEFAULT 'agricultural';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "account_status" "account_status" DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "billing_address" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "billing_city" varchar(100);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "billing_state" varchar(50);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "billing_zip" varchar(20);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "website" varchar(255);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "fax" varchar(20);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "cell_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "preferred_contact_method" "preferred_contact_method";--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "tax_id" varchar(50);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "account_number" varchar(50);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "referral_source" varchar(255);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "tags" json;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "annotations" json;