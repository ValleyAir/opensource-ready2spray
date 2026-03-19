CREATE TYPE "public"."ai_provider" AS ENUM('ollama', 'anthropic', 'forge');--> statement-breakpoint
CREATE TABLE "organization_ai_config" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "organization_ai_config_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organization_id" integer NOT NULL,
	"provider" "ai_provider" DEFAULT 'anthropic' NOT NULL,
	"chat_model" varchar(100),
	"analysis_model" varchar(100),
	"compliance_model" varchar(100),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pre_flight_checklists" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pre_flight_checklists_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"job_id" integer NOT NULL,
	"pilot_id" integer,
	"aircraft_id" integer,
	"checklist_data" json NOT NULL,
	"weather_snapshot" json,
	"signed_by" varchar(255),
	"signed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_ai_config" ADD CONSTRAINT "organization_ai_config_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_flight_checklists" ADD CONSTRAINT "pre_flight_checklists_job_id_jobs_v2_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs_v2"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_flight_checklists" ADD CONSTRAINT "pre_flight_checklists_pilot_id_personnel_id_fk" FOREIGN KEY ("pilot_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_flight_checklists" ADD CONSTRAINT "pre_flight_checklists_aircraft_id_equipment_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organization_ai_config_organization_id_idx" ON "organization_ai_config" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "pre_flight_checklists_job_id_idx" ON "pre_flight_checklists" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "ai_conversations_org_id_idx" ON "ai_conversations" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "ai_conversations_user_id_idx" ON "ai_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_messages_conversation_id_idx" ON "ai_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "ai_usage_org_id_idx" ON "ai_usage" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "ai_usage_user_id_idx" ON "ai_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_usage_created_at_idx" ON "ai_usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "api_keys_organization_id_idx" ON "api_keys" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "api_keys_key_prefix_idx" ON "api_keys" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX "api_usage_logs_api_key_id_idx" ON "api_usage_logs" USING btree ("api_key_id");--> statement-breakpoint
CREATE INDEX "api_usage_logs_created_at_idx" ON "api_usage_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "applications_org_id_idx" ON "applications" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "applications_job_id_idx" ON "applications" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "applications_site_id_idx" ON "applications" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "applications_application_date_idx" ON "applications" USING btree ("application_date");--> statement-breakpoint
CREATE INDEX "audit_logs_organization_id_idx" ON "audit_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_org_created_idx" ON "audit_logs" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "customers_org_id_idx" ON "customers" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customers_name_idx" ON "customers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "equipment_org_id_idx" ON "equipment" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "equipment_type_idx" ON "equipment" USING btree ("equipment_type");--> statement-breakpoint
CREATE INDEX "equipment_status_idx" ON "equipment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "integration_connections_organization_id_idx" ON "integration_connections" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "integration_entity_mappings_connection_id_idx" ON "integration_entity_mappings" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "integration_entity_mappings_external_id_idx" ON "integration_entity_mappings" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "integration_field_mappings_connection_id_idx" ON "integration_field_mappings" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "integration_sync_logs_connection_id_idx" ON "integration_sync_logs" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "integration_sync_logs_synced_at_idx" ON "integration_sync_logs" USING btree ("synced_at");--> statement-breakpoint
CREATE INDEX "job_shares_job_id_idx" ON "job_shares" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_status_history_job_id_idx" ON "job_status_history" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_status_history_created_at_idx" ON "job_status_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "job_statuses_org_id_idx" ON "job_statuses" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "jobs_org_id_idx" ON "jobs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "jobs_customer_id_idx" ON "jobs" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "jobs_status_id_idx" ON "jobs" USING btree ("status_id");--> statement-breakpoint
CREATE INDEX "jobs_scheduled_start_idx" ON "jobs" USING btree ("scheduled_start");--> statement-breakpoint
CREATE INDEX "jobs_assigned_personnel_id_idx" ON "jobs" USING btree ("assigned_personnel_id");--> statement-breakpoint
CREATE INDEX "jobs_site_id_idx" ON "jobs" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "jobs_org_status_idx" ON "jobs" USING btree ("org_id","status_id");--> statement-breakpoint
CREATE INDEX "jobs_org_scheduled_idx" ON "jobs" USING btree ("org_id","scheduled_start");--> statement-breakpoint
CREATE INDEX "jobs_v2_org_id_idx" ON "jobs_v2" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "jobs_v2_customer_id_idx" ON "jobs_v2" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "jobs_v2_status_idx" ON "jobs_v2" USING btree ("status");--> statement-breakpoint
CREATE INDEX "jobs_v2_scheduled_start_idx" ON "jobs_v2" USING btree ("scheduled_start");--> statement-breakpoint
CREATE INDEX "jobs_v2_personnel_id_idx" ON "jobs_v2" USING btree ("personnel_id");--> statement-breakpoint
CREATE INDEX "jobs_v2_org_status_idx" ON "jobs_v2" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "jobs_v2_org_scheduled_idx" ON "jobs_v2" USING btree ("org_id","scheduled_start");--> statement-breakpoint
CREATE INDEX "maintenance_tasks_equipment_id_idx" ON "maintenance_tasks" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "maintenance_tasks_status_idx" ON "maintenance_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "maintenance_tasks_next_due_date_idx" ON "maintenance_tasks" USING btree ("next_due_date");--> statement-breakpoint
CREATE INDEX "maps_org_id_idx" ON "maps" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "maps_job_id_idx" ON "maps" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "organization_invitations_organization_id_idx" ON "organization_invitations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_invitations_email_idx" ON "organization_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "organization_invitations_status_idx" ON "organization_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "organization_members_organization_id_idx" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_members_user_id_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organizations_owner_id_idx" ON "organizations" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "organizations_subscription_status_idx" ON "organizations" USING btree ("subscription_status");--> statement-breakpoint
CREATE INDEX "personnel_org_id_idx" ON "personnel" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "personnel_role_idx" ON "personnel" USING btree ("role");--> statement-breakpoint
CREATE INDEX "personnel_status_idx" ON "personnel" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_use_product_id_idx" ON "product_use" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "products_org_id_idx" ON "products" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "products_epa_number_idx" ON "products" USING btree ("epa_number");--> statement-breakpoint
CREATE INDEX "products_complete_org_id_idx" ON "products_complete" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "products_complete_nickname_idx" ON "products_complete" USING btree ("nickname");--> statement-breakpoint
CREATE INDEX "products_complete_epa_number_idx" ON "products_complete" USING btree ("epa_number");--> statement-breakpoint
CREATE INDEX "products_complete_status_idx" ON "products_complete" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_new_org_id_idx" ON "products_new" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "products_new_epa_reg_number_idx" ON "products_new" USING btree ("epa_reg_number");--> statement-breakpoint
CREATE INDEX "products_new_product_type_idx" ON "products_new" USING btree ("product_type");--> statement-breakpoint
CREATE INDEX "service_plans_org_id_idx" ON "service_plans" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "service_plans_customer_id_idx" ON "service_plans" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "service_plans_status_idx" ON "service_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "service_plans_next_service_date_idx" ON "service_plans" USING btree ("next_service_date");--> statement-breakpoint
CREATE INDEX "sites_org_id_idx" ON "sites" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "sites_customer_id_idx" ON "sites" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "sites_site_type_idx" ON "sites" USING btree ("site_type");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "zones_site_id_idx" ON "zones" USING btree ("site_id");