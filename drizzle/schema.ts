import { boolean, integer, json, numeric, pgEnum, pgTable, text, timestamp, varchar, date, time, real, index } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */

// Define enums
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const subscriptionPlanEnum = pgEnum("subscription_plan", ["FREE", "BASIC", "PRO", "ENTERPRISE"]);
export const personnelRoleEnum = pgEnum("personnel_role", ["applicator", "technician", "driver", "pilot", "ground_crew", "manager", "dispatcher"]);
export const statusEnum = pgEnum("status", ["active", "on_leave", "inactive"]);
export const jobTypeEnum = pgEnum("job_type", ["crop_dusting", "pest_control", "fertilization", "herbicide"]);
export const jobStatusEnum = pgEnum("job_status", ["pending", "ready", "in_progress", "completed", "cancelled"]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "urgent"]);
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant", "system"]);
export const fileTypeEnum = pgEnum("file_type", ["kml", "gpx", "geojson"]);

// New enums for expanded platform
export const orgModeEnum = pgEnum("org_mode", ["ag_aerial", "residential_pest", "both"]);
export const siteTypeEnum = pgEnum("site_type", ["field", "orchard", "vineyard", "pivot", "property", "commercial_building"]);
export const propertyTypeEnum = pgEnum("property_type", ["residential", "commercial", "multi_family", "industrial"]);
export const zoneTypeEnum = pgEnum("zone_type", ["interior", "exterior", "yard", "garage", "attic", "basement", "crawl_space", "perimeter", "custom"]);
export const equipmentTypeEnum = pgEnum("equipment_type", ["plane", "helicopter", "ground_rig", "truck", "backpack", "hand_sprayer", "ulv", "other"]);
export const equipmentStatusEnum = pgEnum("equipment_status", ["active", "maintenance", "inactive"]);
export const productTypeEnum = pgEnum("product_type", ["herbicide", "insecticide", "fungicide", "rodenticide", "adjuvant", "other"]);
export const signalWordEnum = pgEnum("signal_word", ["caution", "warning", "danger"]);
export const applicationMethodEnum = pgEnum("application_method", ["aerial", "ground_boom", "backpack", "hand_wand", "ulv", "chemigation", "other"]);
export const servicePlanTypeEnum = pgEnum("service_plan_type", ["monthly", "quarterly", "bi_monthly", "annual", "one_off"]);
export const servicePlanStatusEnum = pgEnum("service_plan_status", ["active", "paused", "cancelled", "completed"]);

// CRM enums for customer management
export const customerTypeEnum = pgEnum("customer_type", ["agricultural", "commercial", "residential", "government", "other"]);
export const accountStatusEnum = pgEnum("account_status", ["active", "inactive", "lead", "prospect"]);
export const preferredContactMethodEnum = pgEnum("preferred_contact_method", ["phone", "email", "text", "mail"]);

export const waitlist = pgTable("waitlist", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  message: text("message"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Waitlist = typeof waitlist.$inferSelect;
export type InsertWaitlist = typeof waitlist.$inferInsert;

export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  userRole: varchar("user_role", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  licenseNumber: varchar("license_number", { length: 50 }),
  commission: boolean("commission").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  roleIdx: index("users_role_idx").on(table.role),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Jobs V2 table - Comprehensive job management
export const jobsV2 = pgTable("jobs_v2", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orgId: integer("org_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  jobType: jobTypeEnum("job_type"),
  priority: priorityEnum("priority").default("medium"),
  status: jobStatusEnum("status").default("pending").notNull(),
  customerId: integer("customer_id"),
  personnelId: integer("personnel_id"),
  equipmentId: integer("equipment_id"),
  location: text("location"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  productId: integer("product_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("jobs_v2_org_id_idx").on(table.orgId),
  customerIdIdx: index("jobs_v2_customer_id_idx").on(table.customerId),
  statusIdx: index("jobs_v2_status_idx").on(table.status),
  scheduledStartIdx: index("jobs_v2_scheduled_start_idx").on(table.scheduledStart),
  personnelIdIdx: index("jobs_v2_personnel_id_idx").on(table.personnelId),
  orgStatusIdx: index("jobs_v2_org_status_idx").on(table.orgId, table.status),
  orgScheduledIdx: index("jobs_v2_org_scheduled_idx").on(table.orgId, table.scheduledStart),
}));

export type JobV2 = typeof jobsV2.$inferSelect;
export type InsertJobV2 = typeof jobsV2.$inferInsert;

// Organizations table with subscription management and mode selection
export const organizations = pgTable("organizations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zip_code", { length: 10 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 255 }),
  notes: text("notes"),
  // Stripe integration - store only IDs, not duplicate data
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  subscriptionPlan: varchar("subscription_plan", { length: 50 }).default("starter"), // starter, professional, enterprise
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("trialing"), // trialing, active, past_due, canceled, incomplete
  // AI Credit tracking
  aiCreditsTotal: integer("ai_credits_total").default(0).notNull(), // Total credits allocated this billing period
  aiCreditsUsed: integer("ai_credits_used").default(0).notNull(), // Credits consumed this period
  aiCreditsRollover: integer("ai_credits_rollover").default(0).notNull(), // Purchased add-on credits that don't expire
  billingPeriodStart: timestamp("billing_period_start"),
  billingPeriodEnd: timestamp("billing_period_end"),
  // Mode selection
  mode: orgModeEnum("mode").default("ag_aerial").notNull(),
  // Google Maps API key (user-configured)
  googleMapsApiKey: varchar("google_maps_api_key", { length: 255 }),
  featuresEnabled: json("features_enabled"), // ['service_plans', 'zones', 'load_sheets', 'flight_board']
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  ownerIdIdx: index("organizations_owner_id_idx").on(table.ownerId),
  subscriptionStatusIdx: index("organizations_subscription_status_idx").on(table.subscriptionStatus),
}));

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// Customers table
export const customers = pgTable("customers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  notes: text("notes"),
  // CRM fields
  companyName: text("company_name"),
  customerType: customerTypeEnum("customer_type").default("agricultural"),
  accountStatus: accountStatusEnum("account_status").default("active"),
  billingAddress: text("billing_address"),
  billingCity: varchar("billing_city", { length: 100 }),
  billingState: varchar("billing_state", { length: 50 }),
  billingZip: varchar("billing_zip", { length: 20 }),
  website: varchar("website", { length: 255 }),
  fax: varchar("fax", { length: 20 }),
  cellPhone: varchar("cell_phone", { length: 20 }),
  preferredContactMethod: preferredContactMethodEnum("preferred_contact_method"),
  taxId: varchar("tax_id", { length: 50 }),
  accountNumber: varchar("account_number", { length: 50 }),
  referralSource: varchar("referral_source", { length: 255 }),
  tags: json("tags"), // string array for flexible categorization
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("customers_org_id_idx").on(table.orgId),
  emailIdx: index("customers_email_idx").on(table.email),
  nameIdx: index("customers_name_idx").on(table.name),
}));

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// Sites table (fields for ag, properties for pest control)
export const sites = pgTable("sites", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  customerId: integer("customer_id").references(() => customers.id),
  name: varchar("name", { length: 255 }).notNull(),
  siteType: siteTypeEnum("site_type").notNull(),
  // Location
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  polygon: json("polygon"), // GeoJSON polygon for boundaries
  centerLat: numeric("center_lat", { precision: 10, scale: 8 }),
  centerLng: numeric("center_lng", { precision: 11, scale: 8 }),
  acres: numeric("acres", { precision: 10, scale: 2 }),
  // Ag-specific fields
  crop: varchar("crop", { length: 100 }),
  variety: varchar("variety", { length: 100 }),
  growthStage: varchar("growth_stage", { length: 50 }),
  // Sensitive areas nearby
  sensitiveAreas: json("sensitive_areas"), // [{type: 'bee_yard', distance: 500, notes: '...'}]
  annotations: json("annotations"), // Rich map annotation data (shapes, markers, text, icons with colors)
  // Pest control-specific fields
  propertyType: propertyTypeEnum("property_type"),
  units: integer("units").default(1),
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("sites_org_id_idx").on(table.orgId),
  customerIdIdx: index("sites_customer_id_idx").on(table.customerId),
  siteTypeIdx: index("sites_site_type_idx").on(table.siteType),
}));

export type Site = typeof sites.$inferSelect;
export type InsertSite = typeof sites.$inferInsert;

// Zones table (for pest control treatment areas)
export const zones = pgTable("zones", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  zoneType: zoneTypeEnum("zone_type").notNull(),
  description: text("description"),
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  siteIdIdx: index("zones_site_id_idx").on(table.siteId),
}));

export type Zone = typeof zones.$inferSelect;
export type InsertZone = typeof zones.$inferInsert;

// Equipment table (planes, trucks, rigs, backpacks)
export const equipment = pgTable("equipment", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  equipmentType: equipmentTypeEnum("equipment_type").notNull(),
  // Identification
  tailNumber: varchar("tail_number", { length: 50 }),
  licensePlate: varchar("license_plate", { length: 50 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  // Specifications
  tankCapacity: numeric("tank_capacity", { precision: 10, scale: 2 }),
  swathWidth: numeric("swath_width", { precision: 10, scale: 2 }),
  maxSpeed: numeric("max_speed", { precision: 10, scale: 2 }),
  // Status
  status: equipmentStatusEnum("status").default("active"),
  // Maintenance
  lastMaintenanceDate: date("last_maintenance_date"),
  nextMaintenanceDate: date("next_maintenance_date"),
  maintenanceNotes: text("maintenance_notes"),
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("equipment_org_id_idx").on(table.orgId),
  equipmentTypeIdx: index("equipment_type_idx").on(table.equipmentType),
  statusIdx: index("equipment_status_idx").on(table.status),
}));

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = typeof equipment.$inferInsert;

// Personnel table
export const personnel = pgTable("personnel", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  role: personnelRoleEnum("role").notNull(),
  status: statusEnum("status").default("active").notNull(),
  certifications: text("certifications"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("personnel_org_id_idx").on(table.orgId),
  roleIdx: index("personnel_role_idx").on(table.role),
  statusIdx: index("personnel_status_idx").on(table.status),
}));

export type Personnel = typeof personnel.$inferSelect;
export type InsertPersonnel = typeof personnel.$inferInsert;

// Job Statuses table - customizable per organization
export const jobStatuses = pgTable("job_statuses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  name: varchar("name", { length: 50 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(), // Hex color code
  displayOrder: integer("display_order").notNull(), // For sorting
  category: varchar("category", { length: 20 }).notNull(), // 'pending', 'active', 'completed' for dashboard grouping
  isDefault: boolean("is_default").default(false).notNull(), // Default status for new jobs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("job_statuses_org_id_idx").on(table.orgId),
}));

export type JobStatus = typeof jobStatuses.$inferSelect;
export type InsertJobStatus = typeof jobStatuses.$inferInsert;

// Job Status History table (audit trail for status changes)
export const jobStatusHistory = pgTable("job_status_history", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  jobId: integer("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  fromStatusId: integer("from_status_id").references(() => jobStatuses.id),
  toStatusId: integer("to_status_id").notNull().references(() => jobStatuses.id),
  changedByUserId: integer("changed_by_user_id").notNull().references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index("job_status_history_job_id_idx").on(table.jobId),
  createdAtIdx: index("job_status_history_created_at_idx").on(table.createdAt),
}));

export type JobStatusHistory = typeof jobStatusHistory.$inferSelect;
export type InsertJobStatusHistory = typeof jobStatusHistory.$inferInsert;

// Products table (EPA-registered chemical catalog)
export const productsNew = pgTable("products_new", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  epaRegNumber: varchar("epa_reg_number", { length: 50 }).notNull(),
  // Basic info
  brandName: varchar("brand_name", { length: 255 }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  manufacturer: varchar("manufacturer", { length: 255 }),
  // Active ingredients
  activeIngredients: json("active_ingredients"), // [{name: 'Glyphosate', percentage: 41.0}]
  // Classification
  productType: productTypeEnum("product_type").notNull(),
  signalWord: signalWordEnum("signal_word").notNull(),
  isRup: boolean("is_rup").default(false), // Restricted Use Pesticide
  // Use site flags
  indoorAllowed: boolean("indoor_allowed").default(false),
  outdoorAllowed: boolean("outdoor_allowed").default(true),
  aerialAllowed: boolean("aerial_allowed").default(false),
  groundBoomAllowed: boolean("ground_boom_allowed").default(true),
  backpackAllowed: boolean("backpack_allowed").default(false),
  handWandAllowed: boolean("hand_wand_allowed").default(false),
  ulvAllowed: boolean("ulv_allowed").default(false),
  chemigationAllowed: boolean("chemigation_allowed").default(false),
  // Use site categories
  useSites: json("use_sites"), // ['corn', 'soy', 'wheat', 'residential_indoor', 'residential_outdoor']
  // Label references
  labelPdfUrl: text("label_pdf_url"),
  sdsUrl: text("sds_url"),
  manufacturerUrl: text("manufacturer_url"),
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("products_new_org_id_idx").on(table.orgId),
  epaRegNumberIdx: index("products_new_epa_reg_number_idx").on(table.epaRegNumber),
  productTypeIdx: index("products_new_product_type_idx").on(table.productType),
}));

export type ProductNew = typeof productsNew.$inferSelect;
export type InsertProductNew = typeof productsNew.$inferInsert;

// ProductUse table (rate ranges by crop/pest)
export const productUse = pgTable("product_use", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  productId: integer("product_id").notNull().references(() => productsNew.id, { onDelete: "cascade" }),
  // Use context
  crop: varchar("crop", { length: 100 }),
  pest: varchar("pest", { length: 100 }),
  siteCategory: varchar("site_category", { length: 100 }),
  // Rate limits
  minRate: numeric("min_rate", { precision: 10, scale: 4 }),
  maxRate: numeric("max_rate", { precision: 10, scale: 4 }),
  rateUnit: varchar("rate_unit", { length: 50 }),
  // Application limits
  maxApplicationsPerSeason: integer("max_applications_per_season"),
  maxTotalPerSeason: numeric("max_total_per_season", { precision: 10, scale: 4 }),
  maxTotalUnit: varchar("max_total_unit", { length: 50 }),
  // Carrier volume
  minCarrierVolume: numeric("min_carrier_volume", { precision: 10, scale: 2 }),
  maxCarrierVolume: numeric("max_carrier_volume", { precision: 10, scale: 2 }),
  carrierUnit: varchar("carrier_unit", { length: 50 }),
  // Intervals
  phiDays: integer("phi_days"),
  reiHours: integer("rei_hours"),
  reentryConditions: text("reentry_conditions"),
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  productIdIdx: index("product_use_product_id_idx").on(table.productId),
}));

export type ProductUse = typeof productUse.$inferSelect;
export type InsertProductUse = typeof productUse.$inferInsert;

// Service Plans table (for recurring pest control services)
export const servicePlans = pgTable("service_plans", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  siteId: integer("site_id").references(() => sites.id),
  // Plan details
  planName: varchar("plan_name", { length: 255 }).notNull(),
  planType: servicePlanTypeEnum("plan_type").notNull(),
  // Scheduling
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  nextServiceDate: date("next_service_date"),
  // Service details
  defaultZones: json("default_zones"), // [zone_id1, zone_id2]
  defaultProducts: json("default_products"), // [{product_id, rate}]
  defaultTargetPests: json("default_target_pests"), // ['Ants', 'Spiders', 'Roaches']
  // Pricing
  pricePerService: numeric("price_per_service", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("USD"),
  // Status
  status: servicePlanStatusEnum("status").default("active"),
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("service_plans_org_id_idx").on(table.orgId),
  customerIdIdx: index("service_plans_customer_id_idx").on(table.customerId),
  statusIdx: index("service_plans_status_idx").on(table.status),
  nextServiceDateIdx: index("service_plans_next_service_date_idx").on(table.nextServiceDate),
}));

export type ServicePlan = typeof servicePlans.$inferSelect;
export type InsertServicePlan = typeof servicePlans.$inferInsert;

// Jobs table (updated with new fields)
export const jobs = pgTable("jobs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  customerId: integer("customer_id").references(() => customers.id),
  siteId: integer("site_id").references(() => sites.id), // NEW: Link to site
  assignedPersonnelId: integer("assigned_personnel_id").references(() => personnel.id),
  equipmentId: integer("equipment_id").references(() => equipment.id), // NEW: Link to equipment
  servicePlanId: integer("service_plan_id").references(() => servicePlans.id), // NEW: Link to service plan
  productId: integer("product_id"), // Link to products_complete table (no FK constraint since it's a raw SQL table)
  title: text("title").notNull(),
  description: text("description"),
  jobType: jobTypeEnum("job_type").notNull(),
  statusId: integer("status_id").references(() => jobStatuses.id),
  priority: priorityEnum("priority").default("medium").notNull(),
  locationAddress: text("location_address"),
  locationLat: varchar("location_lat", { length: 50 }),
  locationLng: varchar("location_lng", { length: 50 }),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  actualStart: timestamp("actual_start"),
  actualEnd: timestamp("actual_end"),
  notes: text("notes"),
  // Agricultural details
  state: varchar("state", { length: 100 }),
  commodityCrop: varchar("commodity_crop", { length: 200 }),
  targetPest: varchar("target_pest", { length: 200 }),
  epaNumber: varchar("epa_number", { length: 100 }),
  applicationRate: varchar("application_rate", { length: 100 }),
  applicationMethod: varchar("application_method", { length: 100 }),
  chemicalProduct: varchar("chemical_product", { length: 200 }),
  // Crop specifics
  reEntryInterval: varchar("re_entry_interval", { length: 100 }),
  preharvestInterval: varchar("preharvest_interval", { length: 100 }),
  maxApplicationsPerSeason: varchar("max_applications_per_season", { length: 50 }),
  maxRatePerSeason: varchar("max_rate_per_season", { length: 100 }),
  methodsAllowed: varchar("methods_allowed", { length: 200 }),
  rate: varchar("rate", { length: 100 }),
  diluentAerial: varchar("diluent_aerial", { length: 100 }),
  diluentGround: varchar("diluent_ground", { length: 100 }),
  diluentChemigation: varchar("diluent_chemigation", { length: 100 }),
  genericConditions: text("generic_conditions"),
  // NEW: Additional fields
  acres: numeric("acres", { precision: 10, scale: 2 }),
  carrierVolume: numeric("carrier_volume", { precision: 10, scale: 2 }),
  carrierUnit: varchar("carrier_unit", { length: 50 }).default("GPA"),
  numLoads: integer("num_loads"),
  treatmentPolygon: json("treatment_polygon"), // GeoJSON polygon for treatment area
  zonesToTreat: json("zones_to_treat"), // [zone_id1, zone_id2]
  weatherConditions: varchar("weather_conditions", { length: 255 }),
  temperatureF: numeric("temperature_f", { precision: 5, scale: 2 }),
  windSpeedMph: numeric("wind_speed_mph", { precision: 5, scale: 2 }),
  windDirection: varchar("wind_direction", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("jobs_org_id_idx").on(table.orgId),
  customerIdIdx: index("jobs_customer_id_idx").on(table.customerId),
  statusIdIdx: index("jobs_status_id_idx").on(table.statusId),
  scheduledStartIdx: index("jobs_scheduled_start_idx").on(table.scheduledStart),
  assignedPersonnelIdIdx: index("jobs_assigned_personnel_id_idx").on(table.assignedPersonnelId),
  siteIdIdx: index("jobs_site_id_idx").on(table.siteId),
  orgStatusIdx: index("jobs_org_status_idx").on(table.orgId, table.statusId),
  orgScheduledIdx: index("jobs_org_scheduled_idx").on(table.orgId, table.scheduledStart),
}));

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

// Applications table (historical records)
export const applications = pgTable("applications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  siteId: integer("site_id").references(() => sites.id),
  customerId: integer("customer_id").references(() => customers.id),
  // Personnel
  applicatorId: integer("applicator_id").references(() => personnel.id),
  supervisorId: integer("supervisor_id").references(() => personnel.id),
  // Equipment
  equipmentId: integer("equipment_id").references(() => equipment.id),
  // Application details
  applicationDate: date("application_date").notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  // Products applied
  productsApplied: json("products_applied"), // [{product_id, epa_reg_number, amount, unit, rate, carrier_volume}]
  // Area treated
  acresTreated: numeric("acres_treated", { precision: 10, scale: 2 }),
  areaUnit: varchar("area_unit", { length: 20 }).default("acres"),
  // Method
  applicationMethod: applicationMethodEnum("application_method").notNull(),
  // Conditions
  temperatureF: numeric("temperature_f", { precision: 5, scale: 2 }),
  windSpeedMph: numeric("wind_speed_mph", { precision: 5, scale: 2 }),
  windDirection: varchar("wind_direction", { length: 10 }),
  humidityPercent: numeric("humidity_percent", { precision: 5, scale: 2 }),
  weatherConditions: varchar("weather_conditions", { length: 255 }),
  // Target
  targetPest: varchar("target_pest", { length: 255 }),
  crop: varchar("crop", { length: 100 }),
  // Compliance
  phiDate: date("phi_date"),
  reiDatetime: timestamp("rei_datetime"),
  // Record keeping
  completedById: integer("completed_by_id").references(() => users.id),
  verifiedById: integer("verified_by_id").references(() => users.id),
  verificationDate: date("verification_date"),
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("applications_org_id_idx").on(table.orgId),
  jobIdIdx: index("applications_job_id_idx").on(table.jobId),
  siteIdIdx: index("applications_site_id_idx").on(table.siteId),
  applicationDateIdx: index("applications_application_date_idx").on(table.applicationDate),
}));

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

// Products table (legacy - keep for backward compatibility)
export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  epaNumber: varchar("epa_number", { length: 100 }),
  manufacturer: text("manufacturer"),
  activeIngredients: text("active_ingredients"),
  productType: varchar("product_type", { length: 100 }),
  applicationRate: text("application_rate"),
  safetyNotes: text("safety_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("products_org_id_idx").on(table.orgId),
  epaNumberIdx: index("products_epa_number_idx").on(table.epaNumber),
}));

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// AI Conversations table
export const aiConversations = pgTable("ai_conversations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("ai_conversations_org_id_idx").on(table.orgId),
  userIdIdx: index("ai_conversations_user_id_idx").on(table.userId),
}));

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = typeof aiConversations.$inferInsert;

// AI Messages table
export const aiMessages = pgTable("ai_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversation_id").notNull().references(() => aiConversations.id),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  conversationIdIdx: index("ai_messages_conversation_id_idx").on(table.conversationId),
}));

export type AiMessage = typeof aiMessages.$inferSelect;
export type InsertAiMessage = typeof aiMessages.$inferInsert;

// AI Usage tracking table
export const aiUsage = pgTable("ai_usage", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  userId: integer("user_id").notNull().references(() => users.id),
  conversationId: integer("conversation_id").references(() => aiConversations.id),
  model: varchar("model", { length: 100 }).notNull(),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  totalTokens: integer("total_tokens").notNull(),
  cost: varchar("cost", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("ai_usage_org_id_idx").on(table.orgId),
  userIdIdx: index("ai_usage_user_id_idx").on(table.userId),
  createdAtIdx: index("ai_usage_created_at_idx").on(table.createdAt),
}));

export type AiUsage = typeof aiUsage.$inferSelect;
export type InsertAiUsage = typeof aiUsage.$inferInsert;

// Maps table for KML/GPX/GeoJSON file uploads
export const maps = pgTable("maps", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  jobId: integer("job_id").references(() => jobsV2.id, { onDelete: "cascade" }), // Optional: for job-specific maps
  name: varchar("name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileKey: varchar("file_key", { length: 500 }).notNull(),
  fileType: fileTypeEnum("file_type").notNull(),
  fileSize: integer("file_size"), // Size in bytes
  uploadedBy: integer("uploaded_by").references(() => users.id),
  publicUrl: text("public_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("maps_org_id_idx").on(table.orgId),
  jobIdIdx: index("maps_job_id_idx").on(table.jobId),
}));

export type Map = typeof maps.$inferSelect;
export type InsertMap = typeof maps.$inferInsert;

// Integration tables for Zoho CRM and FieldPulse
export const integrationTypeEnum = pgEnum("integration_type", ["zoho_crm", "fieldpulse"]);
export const syncDirectionEnum = pgEnum("sync_direction", ["to_external", "from_external"]);
export const entityTypeEnum = pgEnum("entity_type", ["customer", "job", "personnel", "site"]);
export const syncOperationEnum = pgEnum("sync_operation", ["create", "update", "delete"]);
export const syncStatusEnum = pgEnum("sync_status", ["success", "error", "skipped"]);

export const integrationConnections = pgTable("integration_connections", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  integrationType: integrationTypeEnum("integration_type").notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  
  // Zoho CRM OAuth fields
  zohoClientId: varchar("zoho_client_id", { length: 255 }),
  zohoClientSecret: varchar("zoho_client_secret", { length: 255 }),
  zohoAccessToken: text("zoho_access_token"),
  zohoRefreshToken: text("zoho_refresh_token"),
  zohoTokenExpiresAt: timestamp("zoho_token_expires_at"),
  zohoDataCenter: varchar("zoho_data_center", { length: 50 }),
  
  // FieldPulse API Key
  fieldpulseApiKey: varchar("fieldpulse_api_key", { length: 255 }),
  
  // Sync settings
  syncCustomers: boolean("sync_customers").default(true),
  syncJobs: boolean("sync_jobs").default(true),
  syncPersonnel: boolean("sync_personnel").default(false),
  syncIntervalMinutes: integer("sync_interval_minutes").default(15),
  lastSyncAt: timestamp("last_sync_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  organizationIdIdx: index("integration_connections_organization_id_idx").on(table.organizationId),
}));

export type IntegrationConnection = typeof integrationConnections.$inferSelect;
export type InsertIntegrationConnection = typeof integrationConnections.$inferInsert;

export const integrationFieldMappings = pgTable("integration_field_mappings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  connectionId: integer("connection_id").notNull().references(() => integrationConnections.id),
  entityType: entityTypeEnum("entity_type").notNull(),
  ready2sprayField: varchar("ready2spray_field", { length: 100 }).notNull(),
  externalField: varchar("external_field", { length: 100 }).notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  connectionIdIdx: index("integration_field_mappings_connection_id_idx").on(table.connectionId),
}));

export type IntegrationFieldMapping = typeof integrationFieldMappings.$inferSelect;
export type InsertIntegrationFieldMapping = typeof integrationFieldMappings.$inferInsert;

export const integrationSyncLogs = pgTable("integration_sync_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  connectionId: integer("connection_id").notNull().references(() => integrationConnections.id),
  syncDirection: syncDirectionEnum("sync_direction").notNull(),
  entityType: entityTypeEnum("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  externalId: varchar("external_id", { length: 255 }),
  operation: syncOperationEnum("operation").notNull(),
  status: syncStatusEnum("status").notNull(),
  errorMessage: text("error_message"),
  requestData: json("request_data"),
  responseData: json("response_data"),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
}, (table) => ({
  connectionIdIdx: index("integration_sync_logs_connection_id_idx").on(table.connectionId),
  syncedAtIdx: index("integration_sync_logs_synced_at_idx").on(table.syncedAt),
}));

export type IntegrationSyncLog = typeof integrationSyncLogs.$inferSelect;
export type InsertIntegrationSyncLog = typeof integrationSyncLogs.$inferInsert;

export const integrationEntityMappings = pgTable("integration_entity_mappings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  connectionId: integer("connection_id").notNull().references(() => integrationConnections.id),
  entityType: entityTypeEnum("entity_type").notNull(),
  ready2sprayId: integer("ready2spray_id").notNull(),
  externalId: varchar("external_id", { length: 255 }).notNull(),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  connectionIdIdx: index("integration_entity_mappings_connection_id_idx").on(table.connectionId),
  externalIdIdx: index("integration_entity_mappings_external_id_idx").on(table.externalId),
}));

export type IntegrationEntityMapping = typeof integrationEntityMappings.$inferSelect;
export type InsertIntegrationEntityMapping = typeof integrationEntityMappings.$inferInsert;

// Maintenance task enums
export const maintenanceTaskTypeEnum = pgEnum("maintenance_task_type", ["inspection", "oil_change", "filter_replacement", "tire_rotation", "annual_certification", "engine_overhaul", "custom"]);
export const maintenanceFrequencyTypeEnum = pgEnum("maintenance_frequency_type", ["hours", "days", "months", "one_time"]);
export const maintenanceStatusEnum = pgEnum("maintenance_status", ["pending", "in_progress", "completed", "overdue"]);

export const maintenanceTasks = pgTable("maintenance_tasks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  equipmentId: integer("equipment_id").notNull().references(() => equipment.id, { onDelete: "cascade" }),
  taskName: varchar("task_name", { length: 255 }).notNull(),
  description: text("description"),
  taskType: maintenanceTaskTypeEnum("task_type").notNull(),
  frequencyType: maintenanceFrequencyTypeEnum("frequency_type").notNull(),
  frequencyValue: integer("frequency_value").notNull(),
  lastCompletedDate: timestamp("last_completed_date"),
  nextDueDate: timestamp("next_due_date"),
  isRecurring: boolean("is_recurring").default(true),
  estimatedCost: numeric("estimated_cost", { precision: 10, scale: 2 }),
  actualCost: numeric("actual_cost", { precision: 10, scale: 2 }),
  status: maintenanceStatusEnum("status").default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  equipmentIdIdx: index("maintenance_tasks_equipment_id_idx").on(table.equipmentId),
  statusIdx: index("maintenance_tasks_status_idx").on(table.status),
  nextDueDateIdx: index("maintenance_tasks_next_due_date_idx").on(table.nextDueDate),
}));

export type MaintenanceTask = typeof maintenanceTasks.$inferSelect;
export type InsertMaintenanceTask = typeof maintenanceTasks.$inferInsert;

// Audit Log table for tracking all user actions
export const auditActionEnum = pgEnum("audit_action", ["create", "update", "delete", "login", "logout", "role_change", "status_change", "export", "import", "view"]);
export const auditEntityTypeEnum = pgEnum("audit_entity_type", ["user", "customer", "personnel", "job", "site", "equipment", "product", "service_plan", "maintenance_task", "organization", "integration", "job_status"]);

export const auditLogs = pgTable("audit_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  userId: integer("user_id").notNull().references(() => users.id),
  action: auditActionEnum("action").notNull(),
  entityType: auditEntityTypeEnum("entity_type").notNull(),
  entityId: integer("entity_id"),
  entityName: varchar("entity_name", { length: 255 }),
  changes: json("changes"), // { before: {}, after: {} }
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: json("metadata"), // Additional context data
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  organizationIdIdx: index("audit_logs_organization_id_idx").on(table.organizationId),
  userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
  actionIdx: index("audit_logs_action_idx").on(table.action),
  orgCreatedIdx: index("audit_logs_org_created_idx").on(table.organizationId, table.createdAt),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// Products Complete table - comprehensive product database with AI extraction support
export const productsComplete = pgTable("products_complete", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  
  // Basic Information
  nickname: varchar("nickname", { length: 255 }).notNull(), // Searchable product name
  description: text("description"),
  epaNumber: varchar("epa_number", { length: 50 }),
  manufacturer: varchar("manufacturer", { length: 255 }),
  productType: varchar("product_type", { length: 50 }), // Chemical, Fertilizer, etc.
  chemicalType: varchar("chemical_type", { length: 50 }), // Liquid, Granular, etc.
  category: varchar("category", { length: 100 }),
  status: varchar("status", { length: 20 }).default("active"),
  
  // Application Details
  defaultAppliedInput: numeric("default_applied_input", { precision: 10, scale: 4 }),
  defaultUnitApplied: varchar("default_unit_applied", { length: 20 }), // OZ-LIQ, GAL, etc.
  baseUnit: varchar("base_unit", { length: 20 }), // GL, BU, EA, OZ-LIQ, PT, QT, etc.
  applicationRatePerAcre: numeric("application_rate_per_acre", { precision: 10, scale: 4 }),
  fieldApplicationPrice: numeric("field_application_price", { precision: 10, scale: 2 }),
  
  // Pricing & Inventory
  minimumCharge: numeric("minimum_charge", { precision: 10, scale: 2 }),
  commission: varchar("commission", { length: 50 }),
  commissionPaid: numeric("commission_paid", { precision: 10, scale: 4 }),
  extraCommissionPercent: numeric("extra_commission_percent", { precision: 5, scale: 2 }),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }),
  reorderQty: numeric("reorder_qty", { precision: 10, scale: 4 }),
  vendors: text("vendors"),
  otcChemicalSalePrice: numeric("otc_chemical_sale_price", { precision: 10, scale: 2 }),
  densityConversionRate: numeric("density_conversion_rate", { precision: 10, scale: 6 }),
  densityUnitFrom: varchar("density_unit_from", { length: 20 }),
  densityUnitTo: varchar("density_unit_to", { length: 20 }),
  
  // Settings (Boolean flags)
  isRestricted: boolean("is_restricted").default(false),
  dontSplitBilling: boolean("dont_split_billing").default(false),
  isInventoryItem: boolean("is_inventory_item").default(false),
  isDiscountable: boolean("is_discountable").default(false),
  showOnJobSchedule: boolean("show_on_job_schedule").default(false),
  isDiluent: boolean("is_diluent").default(false),
  applyAsLiquid: boolean("apply_as_liquid").default(false),
  
  // Safety & Compliance
  labelSignalWord: varchar("label_signal_word", { length: 20 }), // DANGER, WARNING, CAUTION
  hoursReentry: numeric("hours_reentry", { precision: 10, scale: 2 }),
  daysPreharvest: numeric("days_preharvest", { precision: 10, scale: 2 }),
  cropOverrides: json("crop_overrides"), // [{crop: "Corn", days: 30}, ...]
  sensitiveCrops: json("sensitive_crops"), // ["Tomatoes", "Grapes", ...]
  reentryPpe: text("reentry_ppe"),
  additionalRestrictions: text("additional_restrictions"),
  activeIngredients: text("active_ingredients"),

  // Extended Label Fields (AI extraction)
  labelVersion: varchar("label_version", { length: 100 }),
  applicationMethods: text("application_methods"),
  modeOfAction: varchar("mode_of_action", { length: 255 }),
  physicalState: varchar("physical_state", { length: 100 }),
  formulationType: varchar("formulation_type", { length: 100 }),
  toxicTo: varchar("toxic_to", { length: 255 }),
  rainfastness: varchar("rainfastness", { length: 255 }),
  federallyRestricted: boolean("federally_restricted").default(false),
  organicCertifications: varchar("organic_certifications", { length: 255 }),
  postingRequired: boolean("posting_required").default(false),
  avoidGrazing: boolean("avoid_grazing").default(false),
  responseNumber: varchar("response_number", { length: 50 }),
  medicalNumber: varchar("medical_number", { length: 50 }),
  generalNotice: text("general_notice"),

  // AI Extraction metadata
  extractedFromScreenshot: boolean("extracted_from_screenshot").default(false),
  screenshotUrl: text("screenshot_url"),
  extractionConfidence: numeric("extraction_confidence", { precision: 3, scale: 2 }), // 0.00 to 1.00
  lastVerifiedAt: timestamp("last_verified_at"),
  lastVerifiedBy: integer("last_verified_by").references(() => users.id),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
}, (table) => ({
  orgIdIdx: index("products_complete_org_id_idx").on(table.orgId),
  nicknameIdx: index("products_complete_nickname_idx").on(table.nickname),
  epaNumberIdx: index("products_complete_epa_number_idx").on(table.epaNumber),
  statusIdx: index("products_complete_status_idx").on(table.status),
}));

export type ProductComplete = typeof productsComplete.$inferSelect;
export type InsertProductComplete = typeof productsComplete.$inferInsert;


// API Keys for external integrations
export const apiKeyPermissionEnum = pgEnum("api_key_permission", ["read", "write", "delete", "admin"]);

export const apiKeys = pgTable("api_keys", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  keyHash: varchar("key_hash", { length: 255 }).notNull(), // bcrypt hash of the API key
  keyPrefix: varchar("key_prefix", { length: 20 }).notNull(), // First 8 chars for identification (e.g., "rts_live_")
  permissions: json("permissions").notNull(), // Array of permission strings
  scopes: json("scopes"), // Optional: specific resource scopes
  rateLimit: integer("rate_limit").default(1000), // Requests per hour
  lastUsedAt: timestamp("last_used_at"),
  usageCount: integer("usage_count").default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
}, (table) => ({
  organizationIdIdx: index("api_keys_organization_id_idx").on(table.organizationId),
  keyPrefixIdx: index("api_keys_key_prefix_idx").on(table.keyPrefix),
}));

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

// Job Shares for public access
export const jobShares = pgTable("job_shares", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  jobId: integer("job_id").notNull().references(() => jobsV2.id, { onDelete: "cascade" }),
  shareToken: varchar("share_token", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 255 }),
  expiresAt: timestamp("expires_at"),
  viewCount: integer("view_count").default(0),
  allowDownloads: boolean("allow_downloads").default(true).notNull(),
  password: varchar("password", { length: 255 }), // Optional password protection (hashed)
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  lastAccessedAt: timestamp("last_accessed_at"),
}, (table) => ({
  jobIdIdx: index("job_shares_job_id_idx").on(table.jobId),
}));

export type JobShare = typeof jobShares.$inferSelect;
export type InsertJobShare = typeof jobShares.$inferInsert;

// API Usage Logs for tracking and analytics
export const apiUsageLogs = pgTable("api_usage_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  apiKeyId: integer("api_key_id").notNull().references(() => apiKeys.id, { onDelete: "cascade" }),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  statusCode: integer("status_code"),
  responseTime: integer("response_time"), // milliseconds
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  requestBody: json("request_body"),
  responseBody: json("response_body"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  apiKeyIdIdx: index("api_usage_logs_api_key_id_idx").on(table.apiKeyId),
  createdAtIdx: index("api_usage_logs_created_at_idx").on(table.createdAt),
}));

export type ApiUsageLog = typeof apiUsageLogs.$inferSelect;
export type InsertApiUsageLog = typeof apiUsageLogs.$inferInsert;

// Organization Members - Multi-tenant user-organization relationships
export const orgMemberRoleEnum = pgEnum("org_member_role", ["owner", "admin", "member", "viewer"]);
export const invitationStatusEnum = pgEnum("invitation_status", ["pending", "accepted", "declined", "expired"]);

export const organizationMembers = pgTable("organization_members", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: orgMemberRoleEnum("role").default("member").notNull(),
  invitedBy: integer("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  joinedAt: timestamp("joined_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  organizationIdIdx: index("organization_members_organization_id_idx").on(table.organizationId),
  userIdIdx: index("organization_members_user_id_idx").on(table.userId),
}));

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type InsertOrganizationMember = typeof organizationMembers.$inferInsert;

// Organization Invitations - for inviting users to join organizations
export const organizationInvitations = pgTable("organization_invitations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 320 }).notNull(),
  role: orgMemberRoleEnum("role").default("member").notNull(),
  invitedBy: integer("invited_by").notNull().references(() => users.id),
  token: varchar("token", { length: 255 }).notNull().unique(), // Unique invitation token
  status: invitationStatusEnum("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at").notNull(), // Invitations expire after 7 days
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  organizationIdIdx: index("organization_invitations_organization_id_idx").on(table.organizationId),
  emailIdx: index("organization_invitations_email_idx").on(table.email),
  statusIdx: index("organization_invitations_status_idx").on(table.status),
}));

export type OrganizationInvitation = typeof organizationInvitations.$inferSelect;
export type InsertOrganizationInvitation = typeof organizationInvitations.$inferInsert;

// Organization AI Configuration
export const aiProviderEnum = pgEnum("ai_provider", ["ollama", "anthropic", "forge"]);

export const organizationAiConfig = pgTable("organization_ai_config", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  provider: aiProviderEnum("provider").default("anthropic").notNull(),
  chatModel: varchar("chat_model", { length: 100 }),
  analysisModel: varchar("analysis_model", { length: 100 }),
  complianceModel: varchar("compliance_model", { length: 100 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  organizationIdIdx: index("organization_ai_config_organization_id_idx").on(table.organizationId),
}));

export type OrganizationAiConfig = typeof organizationAiConfig.$inferSelect;
export type InsertOrganizationAiConfig = typeof organizationAiConfig.$inferInsert;

// Pre-Flight Checklists
export const preFlightChecklists = pgTable("pre_flight_checklists", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  jobId: integer("job_id").notNull().references(() => jobsV2.id, { onDelete: "cascade" }),
  pilotId: integer("pilot_id").references(() => personnel.id),
  aircraftId: integer("aircraft_id").references(() => equipment.id),
  checklistData: json("checklist_data").notNull(),
  weatherSnapshot: json("weather_snapshot"),
  signedBy: varchar("signed_by", { length: 255 }),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index("pre_flight_checklists_job_id_idx").on(table.jobId),
}));

export type PreFlightChecklist = typeof preFlightChecklists.$inferSelect;
export type InsertPreFlightChecklist = typeof preFlightChecklists.$inferInsert;
