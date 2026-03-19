import { integer, pgEnum, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { organizations } from "./schema";
import { users } from "./schema";

/**
 * Organization Members Table
 * Links users to organizations with role-based access
 * Supports multi-tenant architecture where users can belong to one organization
 */

export const orgMemberRoleEnum = pgEnum("org_member_role", ["owner", "admin", "member", "viewer"]);
export const invitationStatusEnum = pgEnum("invitation_status", ["pending", "accepted", "declined", "expired"]);

// Organization Members - links users to organizations
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
});

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
});

export type OrganizationInvitation = typeof organizationInvitations.$inferSelect;
export type InsertOrganizationInvitation = typeof organizationInvitations.$inferInsert;
