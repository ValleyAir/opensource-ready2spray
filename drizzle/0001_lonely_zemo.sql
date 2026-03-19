-- Create enums only if they don't exist
DO $$ BEGIN
 CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'declined', 'expired');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."org_member_role" AS ENUM('owner', 'admin', 'member', 'viewer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_invitations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "organization_invitations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organization_id" integer NOT NULL,
	"email" varchar(320) NOT NULL,
	"role" "org_member_role" DEFAULT 'member' NOT NULL,
	"invited_by" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_members" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "organization_members_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organization_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" "org_member_role" DEFAULT 'member' NOT NULL,
	"invited_by" integer,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"joined_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "subscription_plan" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "subscription_plan" SET DEFAULT 'starter';--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "subscription_plan" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "subscription_status" SET DEFAULT 'trialing';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" varchar(255);
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "ai_credits_total" integer DEFAULT 0 NOT NULL;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "ai_credits_used" integer DEFAULT 0 NOT NULL;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "ai_credits_rollover" integer DEFAULT 0 NOT NULL;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "billing_period_start" timestamp;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "billing_period_end" timestamp;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizations" DROP COLUMN IF EXISTS "subscription_id";
EXCEPTION
 WHEN undefined_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizations" ADD CONSTRAINT "organizations_stripe_customer_id_unique" UNIQUE("stripe_customer_id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
