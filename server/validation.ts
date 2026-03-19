import { z } from "zod";

/**
 * Validation schemas for tRPC procedures
 * Provides type-safe input validation with helpful error messages
 */

// Email validation with proper format checking
export const emailSchema = z.string().email("Invalid email format").or(z.literal(""));

// Phone validation (flexible format)
export const phoneSchema = z.string().regex(
  /^[\d\s\-\(\)\+\.]*$/,
  "Phone number can only contain digits, spaces, dashes, parentheses, plus signs, and dots"
).or(z.literal(""));

// Date validation helper
export const dateStringSchema = z.string().refine(
  (val) => !val || !isNaN(Date.parse(val)),
  "Invalid date format"
);

// CRM field schemas (shared between create and update)
const crmFields = {
  companyName: z.string().optional(),
  customerType: z.enum(["agricultural", "commercial", "residential", "government", "other"]).optional(),
  accountStatus: z.enum(["active", "inactive", "lead", "prospect"]).optional(),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZip: z.string().optional(),
  website: z.string().optional(),
  fax: z.string().optional(),
  cellPhone: z.string().optional(),
  preferredContactMethod: z.enum(["phone", "email", "text", "mail"]).optional(),
  taxId: z.string().optional(),
  accountNumber: z.string().optional(),
  referralSource: z.string().optional(),
  tags: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
};

// Customer schemas
export const createCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
  ...crmFields,
});

export const updateCustomerSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Customer name is required").optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
  ...crmFields,
});

export const deleteCustomerSchema = z.object({
  id: z.number(),
});

// Personnel schemas
export const createPersonnelSchema = z.object({
  name: z.string().min(1, "Personnel name is required"),
  role: z.enum(["pilot", "ground_crew", "manager", "technician"]),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  status: z.enum(["active", "inactive", "on_leave"]).default("active"),
  pilotLicense: z.string().optional(),
  applicatorLicense: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePersonnelSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Personnel name is required").optional(),
  role: z.enum(["pilot", "ground_crew", "manager", "technician"]).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  status: z.enum(["active", "inactive", "on_leave"]).optional(),
  pilotLicense: z.string().optional(),
  applicatorLicense: z.string().optional(),
  notes: z.string().optional(),
});

export const deletePersonnelSchema = z.object({
  id: z.number(),
});

// Job schemas
export const createJobSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  description: z.string().optional(),
  jobType: z.enum(["crop_dusting", "pest_control", "fertilization", "herbicide"]),
  statusId: z.number().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  locationAddress: z.string().optional(),
  locationLat: z.string().optional(),
  locationLng: z.string().optional(),
  customerId: z.number().optional(),
  assignedPersonnelId: z.number().optional(),
  scheduledStart: dateStringSchema.optional(),
  scheduledEnd: dateStringSchema.optional(),
  // Agricultural details
  state: z.string().optional(),
  commodityCrop: z.string().optional(),
  targetPest: z.string().optional(),
  epaNumber: z.string().optional(),
  applicationRate: z.string().optional(),
  applicationMethod: z.string().optional(),
  chemicalProduct: z.string().optional(),
  // Crop specifics
  reEntryInterval: z.string().optional(),
  preharvestInterval: z.string().optional(),
  maxApplicationsPerSeason: z.string().optional(),
  maxRatePerSeason: z.string().optional(),
  methodsAllowed: z.string().optional(),
  rate: z.string().optional(),
  diluentAerial: z.string().optional(),
  diluentGround: z.string().optional(),
  diluentChemigation: z.string().optional(),
  genericConditions: z.string().optional(),
}).refine(
  (data) => {
    // If scheduledEnd is provided, ensure it's after scheduledStart
    if (data.scheduledStart && data.scheduledEnd) {
      const start = new Date(data.scheduledStart);
      const end = new Date(data.scheduledEnd);
      return end > start;
    }
    return true;
  },
  {
    message: "Scheduled end time must be after start time",
    path: ["scheduledEnd"],
  }
);

export const updateJobSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Job title is required").optional(),
  description: z.string().optional(),
  jobType: z.enum(["crop_dusting", "pest_control", "fertilization", "herbicide"]).optional(),
  statusId: z.number().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  locationAddress: z.string().optional(),
  locationLat: z.string().optional(),
  locationLng: z.string().optional(),
  customerId: z.number().optional(),
  assignedPersonnelId: z.number().optional(),
  scheduledStart: dateStringSchema.optional(),
  scheduledEnd: dateStringSchema.optional(),
  // Agricultural details
  state: z.string().optional(),
  commodityCrop: z.string().optional(),
  targetPest: z.string().optional(),
  epaNumber: z.string().optional(),
  applicationRate: z.string().optional(),
  applicationMethod: z.string().optional(),
  chemicalProduct: z.string().optional(),
  // Crop specifics
  reEntryInterval: z.string().optional(),
  preharvestInterval: z.string().optional(),
  maxApplicationsPerSeason: z.string().optional(),
  maxRatePerSeason: z.string().optional(),
  methodsAllowed: z.string().optional(),
  rate: z.string().optional(),
  diluentAerial: z.string().optional(),
  diluentGround: z.string().optional(),
  diluentChemigation: z.string().optional(),
  genericConditions: z.string().optional(),
}).refine(
  (data) => {
    // If scheduledEnd is provided, ensure it's after scheduledStart
    if (data.scheduledStart && data.scheduledEnd) {
      const start = new Date(data.scheduledStart);
      const end = new Date(data.scheduledEnd);
      return end > start;
    }
    return true;
  },
  {
    message: "Scheduled end time must be after start time",
    path: ["scheduledEnd"],
  }
);

export const deleteJobSchema = z.object({
  id: z.number(),
});

// Job Status schemas
export const createJobStatusSchema = z.object({
  name: z.string().min(1, "Status name is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Color must be a valid hex code (e.g., #FF5733)"),
  displayOrder: z.number().int().min(0),
  category: z.enum(["pending", "active", "completed", "cancelled"]),
  isDefault: z.boolean().default(false),
});

export const updateJobStatusSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Status name is required").optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Color must be a valid hex code").optional(),
  displayOrder: z.number().int().min(0).optional(),
  category: z.enum(["pending", "active", "completed", "cancelled"]).optional(),
  isDefault: z.boolean().optional(),
});

export const deleteJobStatusSchema = z.object({
  id: z.number(),
});

export const reorderJobStatusesSchema = z.object({
  statusIds: z.array(z.number()).min(1, "At least one status ID is required"),
});

// Organization schemas
export const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  website: z.string().url("Invalid website URL").or(z.literal("")).optional(),
  notes: z.string().optional(),
  mode: z.enum(["ag_aerial", "residential_pest", "both"]).optional(),
  featuresEnabled: z.array(z.string()).optional(),
  googleMapsApiKey: z.string().optional(),
});

// Sites schemas
export const createSiteSchema = z.object({
  customerId: z.number().optional(),
  name: z.string().min(1, "Property name is required"),
  siteType: z.enum(["field", "orchard", "vineyard", "pivot", "property", "commercial_building"]),
  // Address fields (optional - can use GPS coordinates instead)
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  // GPS coordinate input (alternative to address)
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  polygon: z.any().optional(), // GeoJSON polygon
  centerLat: z.string().optional(),
  centerLng: z.string().optional(),
  acres: z.number().optional(),
  crop: z.string().optional(),
  variety: z.string().optional(),
  growthStage: z.string().optional(),
  sensitiveAreas: z.any().optional(), // JSON array
  annotations: z.any().optional(), // Rich map annotation data
  propertyType: z.enum(["residential", "commercial", "multi_family", "industrial"]).optional(),
  units: z.number().optional(),
  notes: z.string().optional(),
});

export const updateSiteSchema = z.object({
  id: z.number(),
  customerId: z.number().optional(),
  name: z.string().min(1, "Site name is required").optional(),
  siteType: z.enum(["field", "orchard", "vineyard", "pivot", "property", "commercial_building"]).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  polygon: z.any().optional(),
  centerLat: z.string().optional(),
  centerLng: z.string().optional(),
  acres: z.number().optional(),
  crop: z.string().optional(),
  variety: z.string().optional(),
  growthStage: z.string().optional(),
  sensitiveAreas: z.any().optional(),
  annotations: z.any().optional(), // Rich map annotation data
  propertyType: z.enum(["residential", "commercial", "multi_family", "industrial"]).optional(),
  units: z.number().optional(),
  notes: z.string().optional(),
});

export const deleteSiteSchema = z.object({
  id: z.number(),
});


// Integration schemas
export const createIntegrationConnectionSchema = z.object({
  integrationType: z.enum(['zoho_crm', 'fieldpulse']),
  zohoClientId: z.string().optional(),
  zohoClientSecret: z.string().optional(),
  fieldpulseApiKey: z.string().optional(),
  syncCustomers: z.boolean().optional(),
  syncJobs: z.boolean().optional(),
  syncPersonnel: z.boolean().optional(),
  syncIntervalMinutes: z.number().optional(),
});

export const updateIntegrationConnectionSchema = z.object({
  id: z.number(),
  isEnabled: z.boolean().optional(),
  zohoAccessToken: z.string().optional(),
  zohoRefreshToken: z.string().optional(),
  fieldpulseApiKey: z.string().optional(),
  syncCustomers: z.boolean().optional(),
  syncJobs: z.boolean().optional(),
  syncPersonnel: z.boolean().optional(),
  syncIntervalMinutes: z.number().optional(),
});

export const deleteIntegrationConnectionSchema = z.object({
  id: z.number(),
});

export const testFieldPulseSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
});

// Equipment Schemas
export const createEquipmentSchema = z.object({
  name: z.string().min(1, "Equipment name is required"),
  equipmentType: z.enum(["plane", "helicopter", "ground_rig", "truck", "backpack", "hand_sprayer", "ulv", "other"]),
  tailNumber: z.string().optional(),
  licensePlate: z.string().optional(),
  serialNumber: z.string().optional(),
  tankCapacity: z.string().optional(),
  swathWidth: z.string().optional(),
  maxSpeed: z.string().optional(),
  status: z.enum(["active", "maintenance", "inactive"]).optional(),
  lastMaintenanceDate: z.string().optional(),
  nextMaintenanceDate: z.string().optional(),
  maintenanceNotes: z.string().optional(),
  notes: z.string().optional(),
});

export const updateEquipmentSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  equipmentType: z.enum(["plane", "helicopter", "ground_rig", "truck", "backpack", "hand_sprayer", "ulv", "other"]).optional(),
  tailNumber: z.string().optional(),
  licensePlate: z.string().optional(),
  serialNumber: z.string().optional(),
  tankCapacity: z.string().optional(),
  swathWidth: z.string().optional(),
  maxSpeed: z.string().optional(),
  status: z.enum(["active", "maintenance", "inactive"]).optional(),
  lastMaintenanceDate: z.string().optional(),
  nextMaintenanceDate: z.string().optional(),
  maintenanceNotes: z.string().optional(),
  notes: z.string().optional(),
});

export const deleteEquipmentSchema = z.object({
  id: z.number(),
});

// ============================================================================
// Maintenance Tasks Validation
// ============================================================================

export const createMaintenanceTaskSchema = z.object({
  equipmentId: z.number().int().positive(),
  taskName: z.string().min(1).max(255),
  description: z.string().optional(),
  taskType: z.enum(["inspection", "oil_change", "filter_replacement", "tire_rotation", "annual_certification", "engine_overhaul", "custom"]),
  frequencyType: z.enum(["hours", "days", "months", "one_time"]),
  frequencyValue: z.number().int().positive(),
  lastCompletedDate: z.string().optional(),
  nextDueDate: z.string().optional(),
  isRecurring: z.boolean().default(true),
  estimatedCost: z.string().optional(),
  notes: z.string().optional(),
});

export const updateMaintenanceTaskSchema = z.object({
  id: z.number().int().positive(),
  taskName: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  taskType: z.enum(["inspection", "oil_change", "filter_replacement", "tire_rotation", "annual_certification", "engine_overhaul", "custom"]).optional(),
  frequencyType: z.enum(["hours", "days", "months", "one_time"]).optional(),
  frequencyValue: z.number().int().positive().optional(),
  lastCompletedDate: z.string().optional(),
  nextDueDate: z.string().optional(),
  isRecurring: z.boolean().optional(),
  estimatedCost: z.string().optional(),
  actualCost: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "overdue"]).optional(),
  notes: z.string().optional(),
});

export const completeMaintenanceTaskSchema = z.object({
  id: z.number().int().positive(),
  actualCost: z.string().optional(),
  notes: z.string().optional(),
});

// Service Plan schemas
export const createServicePlanSchema = z.object({
  customerId: z.number().min(1, "Customer is required"),
  siteId: z.number().optional(),
  planName: z.string().min(1, "Plan name is required"),
  planType: z.enum(["monthly", "quarterly", "bi_monthly", "annual", "one_off"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  nextServiceDate: z.string().optional(),
  defaultZones: z.array(z.number()).optional(),
  defaultProducts: z.array(z.object({
    productId: z.number(),
    rate: z.string(),
  })).optional(),
  defaultTargetPests: z.array(z.string()).optional(),
  pricePerService: z.string().optional(),
  currency: z.string().default("USD"),
  status: z.enum(["active", "paused", "cancelled", "completed"]).default("active"),
  notes: z.string().optional(),
});

export const updateServicePlanSchema = z.object({
  id: z.number(),
  customerId: z.number().optional(),
  siteId: z.number().optional(),
  planName: z.string().min(1, "Plan name is required").optional(),
  planType: z.enum(["monthly", "quarterly", "bi_monthly", "annual", "one_off"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  nextServiceDate: z.string().optional(),
  defaultZones: z.array(z.number()).optional(),
  defaultProducts: z.array(z.object({
    productId: z.number(),
    rate: z.string(),
  })).optional(),
  defaultTargetPests: z.array(z.string()).optional(),
  pricePerService: z.string().optional(),
  currency: z.string().optional(),
  status: z.enum(["active", "paused", "cancelled", "completed"]).optional(),
  notes: z.string().optional(),
});

export const deleteServicePlanSchema = z.object({
  id: z.number(),
});
