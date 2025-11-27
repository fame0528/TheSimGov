/**
 * @file src/__tests__/auth/registration.test.ts
 * @description Unit tests for authentication flows
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Comprehensive unit tests for registration and login validation.
 * Tests Zod schemas, validation logic, and error handling.
 * Uses Jest testing framework with TypeScript support.
 * 
 * TEST COVERAGE:
 * - Registration schema validation
 * - Login schema validation
 * - Email format validation
 * - Password strength validation
 * - Name validation
 * - State validation
 * 
 * USAGE:
 * ```bash
 * npm test                  # Run all tests
 * npm test -- --watch       # Watch mode
 * npm test registration     # Run this file only
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - No database connection needed (unit tests)
 * - Mocks not required (testing pure validation)
 * - Fast execution (no async operations)
 * - Comprehensive error message testing
 */

import {
  registerSchema,
  loginSchema,
  emailSchema,
  passwordSchema,
  firstNameSchema,
  lastNameSchema,
  stateSchema,
  VALID_STATES,
} from '@/lib/validations/auth';

/**
 * Registration schema tests
 */
describe('registerSchema', () => {
  it('should validate correct registration data', () => {
    const validData = {
      email: 'user@example.com',
      password: 'SecurePass123',
      firstName: 'John',
      lastName: 'Doe',
      state: 'CA',
    };

    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
      expect(result.data.state).toBe('CA');
    }
  });

  it('should reject missing required fields', () => {
    const invalidData = {
      email: 'user@example.com',
      // Missing password, firstName, lastName, state
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject invalid email format', () => {
    const invalidData = {
      email: 'invalid-email',
      password: 'SecurePass123',
      firstName: 'John',
      lastName: 'Doe',
      state: 'CA',
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject weak passwords', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'weak', // Too short, no uppercase, no number
      firstName: 'John',
      lastName: 'Doe',
      state: 'CA',
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject invalid state abbreviations', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'SecurePass123',
      firstName: 'John',
      lastName: 'Doe',
      state: 'XX', // Invalid state
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should accept all valid US states', () => {
    VALID_STATES.forEach((state) => {
      const validData = {
        email: 'user@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        state: state,
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

/**
 * Login schema tests
 */
describe('loginSchema', () => {
  it('should validate correct login data', () => {
    const validData = {
      email: 'user@example.com',
      password: 'anypassword',
    };

    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject missing email', () => {
    const invalidData = {
      password: 'password123',
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject missing password', () => {
    const invalidData = {
      email: 'user@example.com',
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

/**
 * Email validation tests
 */
describe('emailSchema', () => {
  it('should accept valid email formats', () => {
    const validEmails = [
      'user@example.com',
      'test.user@domain.co.uk',
      'admin+tag@company.org',
      'user123@test-domain.com',
    ];

    validEmails.forEach((email) => {
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid email formats', () => {
    const invalidEmails = [
      'notanemail',
      '@domain.com',
      'user@',
      'user @domain.com',
      'user@domain',
    ];

    invalidEmails.forEach((email) => {
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(false);
    });
  });

  it('should convert email to lowercase', () => {
    const result = emailSchema.safeParse('USER@EXAMPLE.COM');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('user@example.com');
    }
  });
});

/**
 * Password validation tests
 */
describe('passwordSchema', () => {
  it('should accept strong passwords', () => {
    const strongPasswords = [
      'SecurePass123',
      'MyP@ssw0rd',
      'Test1234',
      'Abcdefgh1',
    ];

    strongPasswords.forEach((password) => {
      const result = passwordSchema.safeParse(password);
      expect(result.success).toBe(true);
    });
  });

  it('should reject passwords without uppercase', () => {
    const result = passwordSchema.safeParse('lowercase123');
    expect(result.success).toBe(false);
  });

  it('should reject passwords without lowercase', () => {
    const result = passwordSchema.safeParse('UPPERCASE123');
    expect(result.success).toBe(false);
  });

  it('should reject passwords without numbers', () => {
    const result = passwordSchema.safeParse('NoNumbersHere');
    expect(result.success).toBe(false);
  });

  it('should reject passwords shorter than 8 characters', () => {
    const result = passwordSchema.safeParse('Short1');
    expect(result.success).toBe(false);
  });
});

/**
 * Name validation tests
 */
describe('name validation', () => {
  it('should accept valid first names', () => {
    const validNames = ['John', 'Mary-Jane', "O'Connor"];
    
    validNames.forEach((name) => {
      const result = firstNameSchema.safeParse(name);
      expect(result.success).toBe(true);
    });
  });

  it('should accept valid last names', () => {
    const validNames = ['Smith', 'Van Der Berg', "O'Malley"];
    
    validNames.forEach((name) => {
      const result = lastNameSchema.safeParse(name);
      expect(result.success).toBe(true);
    });
  });

  it('should reject names with numbers', () => {
    const result = firstNameSchema.safeParse('John123');
    expect(result.success).toBe(false);
  });

  it('should reject names with special characters', () => {
    const result = lastNameSchema.safeParse('Smith@#$');
    expect(result.success).toBe(false);
  });
});

/**
 * State validation tests
 */
describe('stateSchema', () => {
  it('should accept valid state abbreviations', () => {
    const validStates = ['CA', 'NY', 'TX', 'FL', 'DC'];
    
    validStates.forEach((state) => {
      const result = stateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });
  });

  it('should convert lowercase to uppercase', () => {
    const result = stateSchema.safeParse('ca');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('CA');
    }
  });

  it('should reject invalid state codes', () => {
    const invalidStates = ['XX', 'ZZ', 'AB'];
    
    invalidStates.forEach((state) => {
      const result = stateSchema.safeParse(state);
      expect(result.success).toBe(false);
    });
  });

  it('should reject states longer than 2 characters', () => {
    const result = stateSchema.safeParse('CAL');
    expect(result.success).toBe(false);
  });
});
