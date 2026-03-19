/**
 * Test fixtures and data for E2E tests
 */

export const TEST_DATA = {
  // Test organization
  organization: {
    name: 'Test Spray Co',
    email: 'test@testsprayco.com',
  },

  // Test job data
  job: {
    title: 'E2E Test Job',
    description: 'Job created by E2E test',
    status: 'pending',
  },

  // Test customer data
  customer: {
    name: 'John Test',
    email: 'john.test@example.com',
    phone: '555-123-4567',
    address: '123 Test Farm Rd, Farmville, TX 75001',
  },

  // Test equipment
  equipment: {
    name: 'Test Drone X1',
    type: 'drone',
    registrationNumber: 'TEST-001',
  },

  // Test personnel
  personnel: {
    firstName: 'Test',
    lastName: 'Pilot',
    email: 'pilot@testsprayco.com',
    role: 'pilot',
  },
};

/**
 * Generate unique test data to avoid conflicts
 */
export function generateUniqueTestData(prefix: string = 'e2e') {
  const timestamp = Date.now();
  return {
    customer: {
      ...TEST_DATA.customer,
      name: `${prefix}-Customer-${timestamp}`,
      email: `${prefix}-customer-${timestamp}@test.com`,
    },
    job: {
      ...TEST_DATA.job,
      title: `${prefix}-Job-${timestamp}`,
    },
    equipment: {
      ...TEST_DATA.equipment,
      name: `${prefix}-Equipment-${timestamp}`,
      registrationNumber: `${prefix}-${timestamp}`,
    },
  };
}
