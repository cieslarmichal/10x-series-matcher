/**
 * Test Data Fixtures for E2E Tests
 *
 * Contains reusable test data for various test scenarios
 */

export const testUsers = {
  validUser: {
    name: 'Test User',
    email: 'test.user@example.com',
    password: 'TestPassword123!',
  },

  secondUser: {
    name: 'Second User',
    email: 'second.user@example.com',
    password: 'SecondPassword123!',
  },

  invalidEmail: {
    name: 'Invalid User',
    email: 'invalid-email',
    password: 'TestPassword123!',
  },

  weakPassword: {
    name: 'Weak Password User',
    email: 'weak@example.com',
    password: '123',
  },
};

export const testSeries = {
  breakingBad: {
    id: 1396,
    name: 'Breaking Bad',
  },

  betterCallSaul: {
    id: 60059,
    name: 'Better Call Saul',
  },

  theWire: {
    id: 1438,
    name: 'The Wire',
  },
};

export const testWatchRoom = {
  name: 'Test Watch Room',
  description: 'A test watch room for E2E testing',
};

/**
 * Helper to generate unique test data
 */
export function generateUniqueEmail(): string {
  const timestamp = Date.now();
  return `test.user.${timestamp}@example.com`;
}

export function generateUniqueRoomName(): string {
  const timestamp = Date.now();
  return `Test Room ${timestamp}`;
}
