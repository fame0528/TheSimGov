/**
 * Jest Test Environment Setup
 * 
 * OVERVIEW:
 * Configures global Jest test environment with Testing Library matchers
 * and global fetch mock for all test files.
 * 
 * Created: 2025-11-14
 * Updated: 2025-11-15
 * ECHO Phase: Test Infrastructure
 */

import '@testing-library/jest-dom';

// Setup global fetch mock with proper typing
global.fetch = jest.fn() as unknown as typeof fetch;

// Mock BSON to prevent ES module parsing issues
// When running with an in-memory MongoDB (TEST_MONGODB_MEMORY=true), do not mock
// `bson` so the real driver can communicate with the DB. Mocking breaks the
// runtime used by the MongoDB Node driver.
if (process.env.TEST_MONGODB_MEMORY !== 'true') {
  jest.mock('bson', () => ({
  ObjectId: jest.fn().mockImplementation((id) => ({
    toString: () => id || 'mock-object-id',
    toHexString: () => id || 'mock-object-id',
  })),
  Binary: jest.fn(),
  Code: jest.fn(),
  DBRef: jest.fn(),
  Decimal128: jest.fn(),
  Double: jest.fn(),
  Int32: jest.fn(),
  Long: jest.fn(),
  MaxKey: jest.fn(),
  MinKey: jest.fn(),
  Timestamp: jest.fn(),
  UUID: jest.fn(),
  BSONError: class BSONError extends Error {},
  BSONRegExp: jest.fn(),
  BSONSymbol: jest.fn(),
  BSONType: {},
  BSONValue: jest.fn(),
  onDemand: jest.fn(),
  deserialize: jest.fn(),
  deserializeStream: jest.fn(),
  serialize: jest.fn(),
  serializeWithBufferAndIndex: jest.fn(),
  calculateObjectSize: jest.fn(),
  setInternalBufferSize: jest.fn(),
  EJSON: {
    // Return a minimal JSON buffer to avoid recursive structures from topology
    serialize: jest.fn().mockImplementation(() => Buffer.from('{}', 'utf8')),
    parse: jest.fn().mockImplementation(() => ({})),
  },
  // Provide a minimal BSON object shape used by the `mongodb` driver
  // so that Jest can run tests without pulling in the real ESM-only `bson`.
  BSON: {
    onDemand: {
      parseToElements: jest.fn().mockReturnValue([]),
      NumberUtils: {
        getInt32LE: jest.fn().mockReturnValue(0),
        getFloat64LE: jest.fn().mockReturnValue(0),
        getBigInt64LE: jest.fn().mockReturnValue(0),
      },
      ByteUtils: {
        toUTF8: jest.fn().mockReturnValue(''),
      },
    },
    // Minimal serializer/deserializer for tests using MongoDB internal codepaths
    serialize: jest.fn().mockImplementation((doc: any) => {
      // Convert Maps to plain objects for serialization to bytes
      const obj = doc instanceof Map ? Object.fromEntries(doc) : doc;
      const json = JSON.stringify(obj);
      return Buffer.from(json, 'utf8');
    }),
    deserialize: jest.fn().mockImplementation((buf: Buffer) => {
      try {
        return JSON.parse(buf.toString('utf8'));
      } catch (e) {
        return {};
      }
    }),
  },
  }));
}

// Note: MongoDB connection mocking removed for integration tests
// Integration tests should use real database connections or proper test database

// Polyfill Next.js web APIs for route handler testing using undici
try {
  // undici provides web-standard Request/Response/Headers implementations
  // that are compatible with Next.js route handler expectations
  // Use require to keep this code compatible with Jest's module system
  // and avoid bundling the runtime during tests.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const undici = require('undici');
  if (typeof global.Request === 'undefined') global.Request = undici.Request;
  if (typeof global.Response === 'undefined') global.Response = undici.Response;
  if (typeof global.Headers === 'undefined') global.Headers = undici.Headers;
} catch (e) {
  // Fallback to no-op if undici is not available in this environment
  if (typeof global.Request === 'undefined') global.Request = (class {} as any);
  if (typeof global.Response === 'undefined') global.Response = (class {} as any);
  if (typeof global.Headers === 'undefined') global.Headers = (class extends Map {} as any);
}

// Polyfill TextEncoder/TextDecoder for some node packages used in tests
if (typeof (global as any).TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TextEncoder, TextDecoder } = require('util');
  (global as any).TextEncoder = TextEncoder;
  (global as any).TextDecoder = TextDecoder;
}
