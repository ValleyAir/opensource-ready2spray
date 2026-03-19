import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Waitlist Router", () => {
  it("should add email to waitlist", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const uniqueEmail = `test${Date.now()}@example.com`;
    const result = await caller.waitlist.add({
      email: uniqueEmail,
      name: "New User",
      company: "Test Company"
    });

    expect(result.success).toBe(true);
  });

  it("should list waitlist entries", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.waitlist.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Customers Router", () => {
  it("should create a customer", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.customers.create({
      name: "Test Customer",
      contactName: "John Doe",
      email: "john@testcustomer.com",
      phone: "555-1234",
      address: "123 Test St",
      notes: "Test notes"
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe("Test Customer");
  });

  it("should list customers", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.customers.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Personnel Router", () => {
  it("should create personnel", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.personnel.create({
      name: "Test Pilot",
      role: "pilot",
      email: "pilot@test.com",
      phone: "555-5678"
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe("Test Pilot");
    expect(result.role).toBe("pilot");
  });

  it("should list personnel", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.personnel.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Equipment Router", () => {
  it("should create equipment", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.equipment.create({
      name: "Test Aircraft",
      type: "Aircraft",
      registrationNumber: "N12345",
      manufacturer: "Cessna",
      model: "182"
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe("Test Aircraft");
  });

  it("should list equipment", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.equipment.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Sites Router", () => {
  it("should create a site", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sites.create({
      name: "Test Farm",
      address: "456 Farm Road",
      acres: "250"
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe("Test Farm");
  });

  it("should list sites", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sites.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Products Router", () => {
  it("should create a product", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.products.create({
      productName: "Test Herbicide",
      epaRegistrationNumber: "12345-67",
      manufacturer: "Test Chem Co",
      rei: "12 hours",
      phi: "7 days"
    });

    expect(result.id).toBeDefined();
    expect(result.productName).toBe("Test Herbicide");
  });

  it("should list products", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.products.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Jobs Router", () => {
  it("should list jobs", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.jobs.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Job Statuses Router", () => {
  it("should list job statuses", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.jobStatuses.list();
    expect(Array.isArray(result)).toBe(true);
  });
});
