CREATE TABLE "ai_conversations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_conversations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"org_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"title" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_messages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"conversation_id" integer NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_usage_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"org_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"conversation_id" integer,
	"model" varchar(100) NOT NULL,
	"input_tokens" integer NOT NULL,
	"output_tokens" integer NOT NULL,
	"total_tokens" integer NOT NULL,
	"cost" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "api_keys_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organization_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"key_hash" varchar(255) NOT NULL,
	"key_prefix" varchar(20) NOT NULL,
	"permissions" json NOT NULL,
	"scopes" json,
	"rate_limit" integer DEFAULT 1000,
	"last_used_at" timestamp,
	"usage_count" integer DEFAULT 0,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_usage_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "api_usage_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"api_key_id" integer NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"method" varchar(10) NOT NULL,
	"status_code" integer,
	"response_time" integer,
	"ip_address" varchar(45),
	"user_agent" text,
	"request_body" json,
	"response_body" json,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "applications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"org_id" integer NOT NULL,
	"job_id" integer NOT NULL,
	"site_id" integer,
	"customer_id" integer,
	"applicator_id" integer,
	"supervisor_id" integer,
	"equipment_id" integer,
	"application_date" date NOT NULL,
	"start_time" time,
	"end_time" time,
	"products_applied" json,
	"acres_treated" numeric(10, 2),
	"area_unit" varchar(20) DEFAULT 'acres',
	"application_method" "application_method" NOT NULL,
	"temperature_f" numeric(5, 2),
	"wind_speed_mph" numeric(5, 2),
	"wind_direction" varchar(10),
	"humidity_percent" numeric(5, 2),
	"weather_conditions" varchar(255),
	"target_pest" varchar(255),
	"crop" varchar(100),
	"phi_date" date,
	"rei_datetime" timestamp,
	"completed_by_id" integer,
	"verified_by_id" integer,
	"verification_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organization_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"action" "audit_action" NOT NULL,
	"entity_type" "audit_entity_type" NOT NULL,
	"entity_id" integer,
	"entity_name" varchar(255),
	"changes" json,
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "customers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"org_id" integer NOT NULL,
	"name" text NOT NULL,
	"email" varchar(320),
	"phone" varchar(20),
	"address" text,
	"city" varchar(100),
	"state" varchar(50),
	"zip_code" varchar(20),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "equipment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"org_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"equipment_type" "equipment_type" NOT NULL,
	"tail_number" varchar(50),
	"license_plate" varchar(50),
	"serial_number" varchar(100),
	"tank_capacity" numeric(10, 2),
	"swath_width" numeric(10, 2),
	"max_speed" numeric(10, 2),
	"status" "equipment_status" DEFAULT 'active',
	"last_maintenance_date" date,
	"next_maintenance_date" date,
	"maintenance_notes" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_connections" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "integration_connections_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organization_id" integer NOT NULL,
	"integration_type" "integration_type" NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"zoho_client_id" varchar(255),
	"zoho_client_secret" varchar(255),
	"zoho_access_token" text,
	"zoho_refresh_token" text,
	"zoho_token_expires_at" timestamp,
	"zoho_data_center" varchar(50),
	"fieldpulse_api_key" varchar(255),
	"sync_customers" boolean DEFAULT true,
	"sync_jobs" boolean DEFAULT true,
	"sync_personnel" boolean DEFAULT false,
	"sync_interval_minutes" integer DEFAULT 15,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_entity_mappings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "integration_entity_mappings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"connection_id" integer NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"ready2spray_id" integer NOT NULL,
	"external_id" varchar(255) NOT NULL,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_field_mappings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "integration_field_mappings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"connection_id" integer NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"ready2spray_field" varchar(100) NOT NULL,
	"external_field" varchar(100) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_sync_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "integration_sync_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"connection_id" integer NOT NULL,
	"sync_direction" "sync_direction" NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" integer NOT NULL,
	"external_id" varchar(255),
	"operation" "sync_operation" NOT NULL,
	"status" "sync_status" NOT NULL,
	"error_message" text,
	"request_data" json,
	"response_data" json,
	"synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_shares" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "job_shares_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"job_id" integer NOT NULL,
	"share_token" varchar(64) NOT NULL,
	"title" varchar(255),
	"expires_at" timestamp,
	"view_count" integer DEFAULT 0,
	"allow_downloads" boolean DEFAULT true NOT NULL,
	"password" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"last_accessed_at" timestamp,
	CONSTRAINT "job_shares_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "job_status_history" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "job_status_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"job_id" integer NOT NULL,
	"from_status_id" integer,
	"to_status_id" integer NOT NULL,
	"changed_by_user_id" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_statuses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "job_statuses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"org_id" integer NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" varchar(7) NOT NULL,
	"display_order" integer NOT NULL,
	"category" varchar(20) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "jobs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"org_id" integer NOT NULL,
	"customer_id" integer,
	"site_id" integer,
	"assigned_personnel_id" integer,
	"equipment_id" integer,
	"service_plan_id" integer,
	"product_id" integer,
	"title" text NOT NULL,
	"description" text,
	"job_type" "job_type" NOT NULL,
	"status_id" integer,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"location_address" text,
	"location_lat" varchar(50),
	"location_lng" varchar(50),
	"scheduled_start" timestamp,
	"scheduled_end" timestamp,
	"actual_start" timestamp,
	"actual_end" timestamp,
	"notes" text,
	"state" varchar(100),
	"commodity_crop" varchar(200),
	"target_pest" varchar(200),
	"epa_number" varchar(100),
	"application_rate" varchar(100),
	"application_method" varchar(100),
	"chemical_product" varchar(200),
	"re_entry_interval" varchar(100),
	"preharvest_interval" varchar(100),
	"max_applications_per_season" varchar(50),
	"max_rate_per_season" varchar(100),
	"methods_allowed" varchar(200),
	"rate" varchar(100),
	"diluent_aerial" varchar(100),
	"diluent_ground" varchar(100),
	"diluent_chemigation" varchar(100),
	"generic_conditions" text,
	"acres" numeric(10, 2),
	"carrier_volume" numeric(10, 2),
	"carrier_unit" varchar(50) DEFAULT 'GPA',
	"num_loads" integer,
	"zones_to_treat" json,
	"weather_conditions" varchar(255),
	"temperature_f" numeric(5, 2),
	"wind_speed_mph" numeric(5, 2),
	"wind_direction" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs_v2" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "jobs_v2_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"org_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"job_type" "job_type",
	"priority" "priority" DEFAULT 'medium',
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"customer_id" integer,
	"personnel_id" integer,
	"equipment_id" integer,
	"location" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"scheduled_start" timestamp,
	"scheduled_end" timestamp,
	"product_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_tasks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "maintenance_tasks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"equipment_id" integer NOT NULL,
	"task_name" varchar(255) NOT NULL,
	"description" text,
	"task_type" "maintenance_task_type" NOT NULL,
	"frequency_type" "maintenance_frequency_type" NOT NULL,
	"frequency_value" integer NOT NULL,
	"last_completed_date" timestamp,
	"next_due_date" timestamp,
	"is_recurring" boolean DEFAULT true,
	"estimated_cost" numeric(10, 2),
	"actual_cost" numeric(10, 2),
	"status" "maintenance_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maps" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "maps_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"org_id" integer NOT NULL,
	"job_id" integer,
	"name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_key" varchar(500) NOT NULL,
	"file_type" "file_type" NOT NULL,
	"file_size" integer,
	"uploaded_by" integer,
	"public_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "organizations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"owner_id" integer NOT NULL,
	"address" text,
	"city" varchar(100),
	"state" varchar(2),
	"zip_code" varchar(10),
	"phone" varchar(20),
	"email" varchar(320),
	"website" varchar(255),
	"notes" text,
	"stripe_customer_id" varchar(255),
	"subscription_id" varchar(255),
	"subscription_plan" "subscription_plan" DEFAULT 'FREE' NOT NULL,
	"subscription_status" varchar(50) DEFAULT 'active',
	"mode" "org_mode" DEFAULT 'ag_aerial' NOT NULL,
	"features_enabled" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personnel" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "personnel_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"org_id" integer NOT NULL,
	"name" text NOT NULL,
	"email" varchar(320),
	"phone" varchar(20),
	"role" "personnel_role" NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"certifications" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_use" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_use_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" integer NOT NULL,
	"crop" varchar(100),
	"pest" varchar(100),
	"site_category" varchar(100),
	"min_rate" numeric(10, 4),
	"max_rate" numeric(10, 4),
	"rate_unit" varchar(50),
	"max_applications_per_season" integer,
	"max_total_per_season" numeric(10, 4),
	"max_total_unit" varchar(50),
	"min_carrier_volume" numeric(10, 2),
	"max_carrier_volume" numeric(10, 2),
	"carrier_unit" varchar(50),
	"phi_days" integer,
	"rei_hours" integer,
	"reentry_conditions" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"org_id" integer NOT NULL,
	"name" text NOT NULL,
	"epa_number" varchar(100),
	"manufacturer" text,
	"active_ingredients" text,
	"product_type" varchar(100),
	"application_rate" text,
	"safety_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products_complete" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "products_complete_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"org_id" integer NOT NULL,
	"nickname" varchar(255) NOT NULL,
	"description" text,
	"epa_number" varchar(50),
	"manufacturer" varchar(255),
	"product_type" varchar(50),
	"chemical_type" varchar(50),
	"category" varchar(100),
	"status" varchar(20) DEFAULT 'active',
	"default_applied_input" numeric(10, 4),
	"default_unit_applied" varchar(20),
	"base_unit" varchar(20),
	"application_rate_per_acre" numeric(10, 4),
	"field_application_price" numeric(10, 2),
	"minimum_charge" numeric(10, 2),
	"commission" varchar(50),
	"commission_paid" numeric(10, 4),
	"extra_commission_percent" numeric(5, 2),
	"unit_cost" numeric(10, 2),
	"reorder_qty" numeric(10, 4),
	"vendors" text,
	"otc_chemical_sale_price" numeric(10, 2),
	"density_conversion_rate" numeric(10, 6),
	"density_unit_from" varchar(20),
	"density_unit_to" varchar(20),
	"is_restricted" boolean DEFAULT false,
	"dont_split_billing" boolean DEFAULT false,
	"is_inventory_item" boolean DEFAULT false,
	"is_discountable" boolean DEFAULT false,
	"show_on_job_schedule" boolean DEFAULT false,
	"is_diluent" boolean DEFAULT false,
	"apply_as_liquid" boolean DEFAULT false,
	"label_signal_word" varchar(20),
	"hours_reentry" numeric(10, 2),
	"days_preharvest" numeric(10, 2),
	"crop_overrides" json,
	"sensitive_crops" json,
	"reentry_ppe" text,
	"additional_restrictions" text,
	"active_ingredients" text,
	"extracted_from_screenshot" boolean DEFAULT false,
	"screenshot_url" text,
	"extraction_confidence" numeric(3, 2),
	"last_verified_at" timestamp,
	"last_verified_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE "products_new" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "products_new_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"org_id" integer NOT NULL,
	"epa_reg_number" varchar(50) NOT NULL,
	"brand_name" varchar(255) NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"manufacturer" varchar(255),
	"active_ingredients" json,
	"product_type" "product_type" NOT NULL,
	"signal_word" "signal_word" NOT NULL,
	"is_rup" boolean DEFAULT false,
	"indoor_allowed" boolean DEFAULT false,
	"outdoor_allowed" boolean DEFAULT true,
	"aerial_allowed" boolean DEFAULT false,
	"ground_boom_allowed" boolean DEFAULT true,
	"backpack_allowed" boolean DEFAULT false,
	"hand_wand_allowed" boolean DEFAULT false,
	"ulv_allowed" boolean DEFAULT false,
	"chemigation_allowed" boolean DEFAULT false,
	"use_sites" json,
	"label_pdf_url" text,
	"sds_url" text,
	"manufacturer_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_plans" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "service_plans_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"org_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"site_id" integer,
	"plan_name" varchar(255) NOT NULL,
	"plan_type" "service_plan_type" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"next_service_date" date,
	"default_zones" json,
	"default_products" json,
	"default_target_pests" json,
	"price_per_service" numeric(10, 2),
	"currency" varchar(10) DEFAULT 'USD',
	"status" "service_plan_status" DEFAULT 'active',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sites_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"org_id" integer NOT NULL,
	"customer_id" integer,
	"name" varchar(255) NOT NULL,
	"site_type" "site_type" NOT NULL,
	"address" text,
	"city" varchar(100),
	"state" varchar(50),
	"zip_code" varchar(20),
	"polygon" json,
	"center_lat" numeric(10, 8),
	"center_lng" numeric(11, 8),
	"acres" numeric(10, 2),
	"crop" varchar(100),
	"variety" varchar(100),
	"growth_stage" varchar(50),
	"sensitive_areas" json,
	"property_type" "property_type",
	"units" integer DEFAULT 1,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"user_role" varchar(20),
	"phone" varchar(20),
	"license_number" varchar(50),
	"commission" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "waitlist_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"company" varchar(255),
	"phone" varchar(50),
	"message" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "zones_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"site_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"zone_type" "zone_type" NOT NULL,
	"description" text,
	"special_instructions" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicator_id_personnel_id_fk" FOREIGN KEY ("applicator_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_supervisor_id_personnel_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_completed_by_id_users_id_fk" FOREIGN KEY ("completed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_verified_by_id_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_entity_mappings" ADD CONSTRAINT "integration_entity_mappings_connection_id_integration_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."integration_connections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_field_mappings" ADD CONSTRAINT "integration_field_mappings_connection_id_integration_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."integration_connections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_sync_logs" ADD CONSTRAINT "integration_sync_logs_connection_id_integration_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."integration_connections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_shares" ADD CONSTRAINT "job_shares_job_id_jobs_v2_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs_v2"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_shares" ADD CONSTRAINT "job_shares_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_status_history" ADD CONSTRAINT "job_status_history_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_status_history" ADD CONSTRAINT "job_status_history_from_status_id_job_statuses_id_fk" FOREIGN KEY ("from_status_id") REFERENCES "public"."job_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_status_history" ADD CONSTRAINT "job_status_history_to_status_id_job_statuses_id_fk" FOREIGN KEY ("to_status_id") REFERENCES "public"."job_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_status_history" ADD CONSTRAINT "job_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_statuses" ADD CONSTRAINT "job_statuses_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_assigned_personnel_id_personnel_id_fk" FOREIGN KEY ("assigned_personnel_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_service_plan_id_service_plans_id_fk" FOREIGN KEY ("service_plan_id") REFERENCES "public"."service_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_status_id_job_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."job_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maps" ADD CONSTRAINT "maps_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maps" ADD CONSTRAINT "maps_job_id_jobs_v2_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs_v2"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maps" ADD CONSTRAINT "maps_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_use" ADD CONSTRAINT "product_use_product_id_products_new_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products_new"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products_complete" ADD CONSTRAINT "products_complete_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products_complete" ADD CONSTRAINT "products_complete_last_verified_by_users_id_fk" FOREIGN KEY ("last_verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products_complete" ADD CONSTRAINT "products_complete_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products_new" ADD CONSTRAINT "products_new_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_plans" ADD CONSTRAINT "service_plans_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_plans" ADD CONSTRAINT "service_plans_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_plans" ADD CONSTRAINT "service_plans_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;
