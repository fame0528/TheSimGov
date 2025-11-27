# 🧪 E-Commerce Testing Guide

**Version:** 1.0.0  
**Created:** 2025-11-14  
**ECHO Phase:** E-Commerce Phase 5 - Testing & Documentation

---

## 📑 Table of Contents

1. [Testing Overview](#testing-overview)
2. [Running Tests](#running-tests)
3. [Test Structure](#test-structure)
4. [Integration Tests](#integration-tests)
5. [Component Tests](#component-tests)
6. [Writing New Tests](#writing-new-tests)
7. [Mock Data Strategies](#mock-data-strategies)
8. [Coverage Reports](#coverage-reports)
9. [CI/CD Integration](#cicd-integration)
10. [Best Practices](#best-practices)

---

## 📊 Testing Overview

### Test Stack

| Tool | Purpose | Version |
|------|---------|---------|
| **Jest** | Test runner and assertion library | ^29.0.0 |
| **@jest/globals** | Jest globals (describe, it, expect) | ^29.0.0 |
| **React Testing Library** | Component testing utilities | ^14.0.0 |
| **@testing-library/react** | React-specific testing helpers | ^14.0.0 |
| **@testing-library/user-event** | User interaction simulation | ^14.0.0 |

### Test Categories

- **Integration Tests** (`__tests__/route.test.ts`) - API endpoint testing with MongoDB
- **Component Tests** (`__tests__/*.test.tsx`) - UI component rendering and interactions
- **Unit Tests** (`__tests__/utils.test.ts`) - Utility function testing (if applicable)

### Coverage Goals

| Metric | Target | Current |
|--------|--------|---------|
| **Statements** | 80%+ | TBD |
| **Branches** | 75%+ | TBD |
| **Functions** | 80%+ | TBD |
| **Lines** | 80%+ | TBD |

---

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- ProductCatalog.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render products"

# Run tests in specific directory
npm test -- src/app/api/ecommerce/products

# Run only integration tests
npm test -- route.test.ts

# Run only component tests
npm test -- components
```

### Advanced Options

```bash
# Run tests with verbose output
npm test -- --verbose

# Run tests with coverage threshold enforcement
npm test -- --coverage --coverageThreshold='{"global":{"branches":75,"functions":80,"lines":80,"statements":80}}'

# Run tests in CI mode (no watch, fails on errors)
npm test -- --ci --coverage --maxWorkers=2

# Update snapshots (if using snapshot testing)
npm test -- -u

# Run tests in specific environment
NODE_ENV=test npm test
```

---

## 📁 Test Structure

### Project Test Organization

```
src/
├── app/
│   └── api/
│       └── ecommerce/
│           ├── products/
│           │   └── __tests__/
│           │       └── route.test.ts        # Products API integration tests
│           ├── orders/
│           │   └── __tests__/
│           │       └── route.test.ts        # Orders API integration tests
│           ├── reviews/
│           │   └── __tests__/
│           │       └── route.test.ts        # Reviews API integration tests
│           ├── campaigns/
│           │   └── __tests__/
│           │       └── route.test.ts        # Campaigns API integration tests
│           └── analytics/
│               └── __tests__/
│                   └── route.test.ts        # Analytics API integration tests
└── components/
    └── ecommerce/
        └── __tests__/
            ├── ProductCatalog.test.tsx      # ProductCatalog component tests
            └── CheckoutFlow.test.tsx        # CheckoutFlow component tests
```

### Test File Naming

- **Integration Tests**: `route.test.ts` (API endpoint tests)
- **Component Tests**: `ComponentName.test.tsx` (React component tests)
- **Unit Tests**: `utilityName.test.ts` (utility function tests)

---

## 🔌 Integration Tests

### Structure Pattern

All integration tests follow this consistent pattern:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { connectDB } from '@/lib/mongodb';
import YourModel from '@/models/ecommerce/YourModel';

describe('API Endpoint Tests', () => {
  const TEST_COMPANY_ID = 'test-company-123';

  beforeAll(async () => {
    await connectDB(); // Connect to MongoDB
  });

  beforeEach(async () => {
    await YourModel.deleteMany({ companyId: TEST_COMPANY_ID }); // Clean up test data
  });

  afterAll(async () => {
    await YourModel.deleteMany({ companyId: TEST_COMPANY_ID }); // Final cleanup
  });

  it('should test something', async () => {
    // Test implementation
  });
});
```

### Example: Products API Integration Test

```typescript
describe('GET /api/ecommerce/products', () => {
  it('should retrieve products with pagination', async () => {
    // Arrange: Create test data
    await ProductListing.insertMany([
      {
        companyId: TEST_COMPANY_ID,
        name: 'Test Product 1',
        sku: 'TEST-001',
        price: 99.99,
        costPrice: 50.00,
        quantityAvailable: 100,
      },
      {
        companyId: TEST_COMPANY_ID,
        name: 'Test Product 2',
        sku: 'TEST-002',
        price: 149.99,
        costPrice: 75.00,
        quantityAvailable: 50,
      }
    ]);

    // Act: Make API request
    const response = await fetch(
      `http://localhost:3000/api/ecommerce/products?companyId=${TEST_COMPANY_ID}&page=1&limit=10`
    );
    const data = await response.json();

    // Assert: Verify response
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.products).toHaveLength(2);
    expect(data.data.total).toBe(2);
    expect(data.data.page).toBe(1);
    expect(data.data.limit).toBe(10);
  });

  it('should filter products by price range', async () => {
    // Test implementation with price filter
    const response = await fetch(
      `http://localhost:3000/api/ecommerce/products?companyId=${TEST_COMPANY_ID}&minPrice=100&maxPrice=200`
    );
    const data = await response.json();

    expect(data.data.products.every(p => p.price >= 100 && p.price <= 200)).toBe(true);
  });
});
```

### Testing Business Logic

**Example: Testing ROI Calculation in Campaigns**

```typescript
it('should calculate ROI correctly', async () => {
  const campaign = await SEOCampaign.create({
    companyId: TEST_COMPANY_ID,
    name: 'Test Campaign',
    type: 'SEO',
    budget: 10000,
    spent: 6000,
    revenue: 30000,
  });

  const response = await fetch(
    `http://localhost:3000/api/ecommerce/campaigns/${campaign._id}/analytics`
  );
  const data = await response.json();

  // ROI = ((revenue - spent) / spent) * 100
  // ROI = ((30000 - 6000) / 6000) * 100 = 400%
  expect(data.data.roi).toBeCloseTo(400, 1);
});
```

---

## 🎨 Component Tests

### Structure Pattern

Component tests use React Testing Library with ChakraProvider wrapper:

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import YourComponent from '../YourComponent';

// Mock global.fetch
beforeEach(() => {
  (global.fetch as jest.Mock) = jest.fn();
});

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(
      <ChakraProvider>
        <YourComponent />
      </ChakraProvider>
    );

    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Example: ProductCatalog Component Test

```typescript
describe('ProductCatalog Component', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          products: [
            {
              _id: 'prod-1',
              name: 'Test Product',
              price: 99.99,
              averageRating: 4.5,
            }
          ],
          total: 1,
          page: 1,
          limit: 50,
        }
      })
    });
  });

  it('should fetch and display products on mount', async () => {
    render(
      <ChakraProvider>
        <ProductCatalog companyId="test-123" />
      </ChakraProvider>
    );

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Verify API was called
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/ecommerce/products')
    );
  });

  it('should filter products by search term', async () => {
    render(
      <ChakraProvider>
        <ProductCatalog companyId="test-123" />
      </ChakraProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search products...');
    fireEvent.change(searchInput, { target: { value: 'wireless' } });

    // Wait for debounced search (300ms)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=wireless')
      );
    }, { timeout: 500 });
  });
});
```

### Testing User Interactions

**Example: Multi-Step Checkout Flow**

```typescript
describe('CheckoutFlow Component', () => {
  it('should navigate through checkout steps', async () => {
    render(
      <ChakraProvider>
        <CheckoutFlow initialCart={mockCart} />
      </ChakraProvider>
    );

    // Step 1: Cart Review
    expect(screen.getByText('Cart Review')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Continue to Shipping'));

    // Step 2: Shipping Address
    await waitFor(() => {
      expect(screen.getByText('Shipping Address')).toBeInTheDocument();
    });

    // Fill shipping form
    fireEvent.change(screen.getByLabelText('Street Address'), {
      target: { value: '123 Main St' }
    });
    fireEvent.change(screen.getByLabelText('City'), {
      target: { value: 'New York' }
    });

    fireEvent.click(screen.getByText('Continue to Payment'));

    // Step 3: Payment Method
    await waitFor(() => {
      expect(screen.getByText('Payment Method')).toBeInTheDocument();
    });

    // Select payment method
    fireEvent.click(screen.getByLabelText('Credit Card'));
    fireEvent.click(screen.getByText('Place Order'));

    // Step 4: Confirmation
    await waitFor(() => {
      expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
    });
  });
});
```

### Testing Timers (Debouncing)

**Example: Debounced Search**

```typescript
import { jest } from '@jest/globals';

describe('Debounced Search', () => {
  beforeEach(() => {
    jest.useFakeTimers(); // Enable fake timers
  });

  afterEach(() => {
    jest.useRealTimers(); // Restore real timers
  });

  it('should debounce search input', async () => {
    render(
      <ChakraProvider>
        <ProductCatalog companyId="test-123" />
      </ChakraProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search products...');

    // Type multiple characters quickly
    fireEvent.change(searchInput, { target: { value: 'w' } });
    fireEvent.change(searchInput, { target: { value: 'wi' } });
    fireEvent.change(searchInput, { target: { value: 'wir' } });

    // API should NOT be called yet
    expect(global.fetch).not.toHaveBeenCalled();

    // Fast-forward 300ms
    jest.advanceTimersByTime(300);

    // Now API should be called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=wir')
      );
    });
  });
});
```

---

## ✍️ Writing New Tests

### Integration Test Template

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { connectDB } from '@/lib/mongodb';
import YourModel from '@/models/ecommerce/YourModel';

describe('YourEndpoint API Tests', () => {
  const TEST_COMPANY_ID = 'test-company-' + Date.now();

  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await YourModel.deleteMany({ companyId: TEST_COMPANY_ID });
  });

  afterAll(async () => {
    await YourModel.deleteMany({ companyId: TEST_COMPANY_ID });
  });

  describe('GET /api/your-endpoint', () => {
    it('should retrieve data successfully', async () => {
      // Arrange
      await YourModel.create({ /* test data */ });

      // Act
      const response = await fetch(`http://localhost:3000/api/your-endpoint?companyId=${TEST_COMPANY_ID}`);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle errors correctly', async () => {
      const response = await fetch('http://localhost:3000/api/your-endpoint?companyId=invalid');
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/your-endpoint', () => {
    it('should create new record', async () => {
      const payload = { /* your data */ };

      const response = await fetch('http://localhost:3000/api/your-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data._id).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await fetch('http://localhost:3000/api/your-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });
});
```

### Component Test Template

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import YourComponent from '../YourComponent';

describe('YourComponent', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });
  });

  it('should render initial state', () => {
    render(
      <ChakraProvider>
        <YourComponent />
      </ChakraProvider>
    );

    expect(screen.getByText('Expected Heading')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    render(
      <ChakraProvider>
        <YourComponent />
      </ChakraProvider>
    );

    const button = screen.getByText('Click Me');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Success Message')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    render(
      <ChakraProvider>
        <YourComponent />
      </ChakraProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle errors gracefully', async () => {
    (global.fetch as jest.Mock) = jest.fn().mockRejectedValue(new Error('Network error'));

    render(
      <ChakraProvider>
        <YourComponent />
      </ChakraProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

---

## 🎭 Mock Data Strategies

### Consistent Test Data

**Use TEST_ prefix for all test data:**

```typescript
const TEST_COMPANY_ID = 'TEST_COMPANY_123';
const TEST_PRODUCT = {
  companyId: TEST_COMPANY_ID,
  name: 'TEST_Product_Wireless_Headphones',
  sku: 'TEST-WH-001',
  price: 99.99,
  costPrice: 50.00,
};
```

### Mock Fixtures

**Create reusable test fixtures:**

```typescript
// __tests__/fixtures/products.ts
export const mockProducts = [
  {
    _id: 'prod-1',
    name: 'Wireless Headphones',
    price: 99.99,
    averageRating: 4.5,
  },
  {
    _id: 'prod-2',
    name: 'Bluetooth Speaker',
    price: 49.99,
    averageRating: 4.0,
  }
];

// __tests__/fixtures/orders.ts
export const mockOrder = {
  _id: 'order-1',
  orderNumber: 'ORD-20251114-001',
  items: [
    {
      productId: 'prod-1',
      quantity: 2,
      unitPrice: 99.99,
      totalPrice: 199.98,
    }
  ],
  subtotal: 199.98,
  tax: 17.00,
  shippingCost: 0.00,
  totalAmount: 216.98,
};
```

### Fetch Mocking Patterns

**Success Response:**

```typescript
(global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({
    success: true,
    data: mockData
  })
});
```

**Error Response:**

```typescript
(global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
  ok: false,
  status: 400,
  json: async () => ({
    success: false,
    error: 'Validation error'
  })
});
```

**Network Error:**

```typescript
(global.fetch as jest.Mock) = jest.fn().mockRejectedValue(
  new Error('Network request failed')
);
```

---

## 📈 Coverage Reports

### Generate Coverage Report

```bash
npm run test:coverage
```

**Output:**

```
--------------------------|---------|----------|---------|---------|-------------------
File                      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------------|---------|----------|---------|---------|-------------------
All files                 |   85.42 |    78.26 |   88.89 |   85.42 |
 api/ecommerce/products   |   92.31 |    85.71 |   100   |   92.31 | 45-47
 api/ecommerce/orders     |   88.46 |    80.00 |   100   |   88.46 | 67-69
 components/ecommerce     |   81.25 |    75.00 |   83.33 |   81.25 | 102-110
--------------------------|---------|----------|---------|---------|-------------------
```

### Coverage Thresholds

**Configure in `jest.config.js`:**

```javascript
module.exports = {
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/app/api/': {
      branches: 80,
      functions: 90,
      lines: 85,
      statements: 85
    }
  }
};
```

### View HTML Coverage Report

```bash
npm run test:coverage
open coverage/lcov-report/index.html  # macOS
# OR
start coverage/lcov-report/index.html  # Windows
```

---

## 🔄 CI/CD Integration

### GitHub Actions

**`.github/workflows/test.yml`:**

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --ci --coverage --maxWorkers=2
        env:
          MONGODB_TEST_URI: ${{ secrets.MONGODB_TEST_URI }}

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

      - name: Check coverage thresholds
        run: npm test -- --coverage --coverageThreshold='{"global":{"branches":75,"functions":80,"lines":80,"statements":80}}'
```

### Pre-commit Hooks (Husky)

**Install Husky:**

```bash
npm install --save-dev husky lint-staged
npx husky install
```

**`.husky/pre-commit`:**

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
npm test -- --findRelatedTests --passWithNoTests
```

**`package.json`:**

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "npm test -- --findRelatedTests --passWithNoTests"
    ]
  }
}
```

---

## ✅ Best Practices

### 1. Test Isolation

**✅ DO:**
- Clean up test data in `beforeEach` and `afterAll`
- Use unique identifiers (timestamps, UUIDs)
- Never rely on test execution order

**❌ DON'T:**
- Share state between tests
- Assume previous test results
- Leave test data in database

---

### 2. Descriptive Test Names

**✅ DO:**

```typescript
it('should calculate free shipping for orders over $100', async () => { /* ... */ });
it('should reject review with rating outside 1-5 range', async () => { /* ... */ });
```

**❌ DON'T:**

```typescript
it('test 1', async () => { /* ... */ });
it('works', async () => { /* ... */ });
```

---

### 3. AAA Pattern (Arrange, Act, Assert)

**✅ DO:**

```typescript
it('should filter products by category', async () => {
  // Arrange
  await ProductListing.insertMany([
    { category: 'Electronics', name: 'Product 1' },
    { category: 'Clothing', name: 'Product 2' }
  ]);

  // Act
  const response = await fetch('/api/products?category=Electronics');
  const data = await response.json();

  // Assert
  expect(data.data.products).toHaveLength(1);
  expect(data.data.products[0].category).toBe('Electronics');
});
```

---

### 4. Mock External Dependencies

**✅ DO:**

```typescript
// Mock fetch API
(global.fetch as jest.Mock) = jest.fn().mockResolvedValue({ /* ... */ });

// Mock third-party libraries
jest.mock('stripe', () => ({
  charges: {
    create: jest.fn().mockResolvedValue({ id: 'charge_123' })
  }
}));
```

---

### 5. Test Edge Cases

**Test:**
- Empty states (no data)
- Error states (network failures, validation errors)
- Boundary values (min/max prices, ratings)
- Invalid inputs (malformed data, missing fields)
- Concurrent operations (race conditions)

---

### 6. Avoid Test Duplication

**❌ DON'T:**

```typescript
it('should filter by Electronics', async () => { /* ... */ });
it('should filter by Clothing', async () => { /* ... */ });
it('should filter by Books', async () => { /* ... */ });
```

**✅ DO:**

```typescript
it.each([
  ['Electronics', 5],
  ['Clothing', 3],
  ['Books', 7]
])('should filter products by category %s and return %i results', async (category, expectedCount) => {
  const response = await fetch(`/api/products?category=${category}`);
  const data = await response.json();
  expect(data.data.products).toHaveLength(expectedCount);
});
```

---

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [E-Commerce API Documentation](./ECOMMERCE_API.md)
- [Deployment Guide](./ECOMMERCE_DEPLOYMENT.md)

---

**Auto-generated by ECHO v1.0.0**  
**Last updated:** 2025-11-14
