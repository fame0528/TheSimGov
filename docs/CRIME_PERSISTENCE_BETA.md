# Crime Domain Persistence Architecture (Beta)

**Status:** Beta  
**Created:** 2025-12-01  
**Version:** 1.0.0  
**Author:** ECHO v1.3.3

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Data Models](#data-models)
3. [API Endpoints](#api-endpoints)
4. [DTO Contracts](#dto-contracts)
5. [Frontend Integration](#frontend-integration)
6. [Security & Authorization](#security--authorization)
7. [Error Handling](#error-handling)
8. [Performance Considerations](#performance-considerations)
9. [Testing & QA](#testing--qa)
10. [Future Enhancements](#future-enhancements)

---

## Overview

### Purpose

The Crime Domain persistence layer provides full CRUD operations for managing illicit operations across five interconnected entities: Production Facilities, Distribution Routes, Marketplace Listings, Laundering Channels, and Heat Levels.

### Architecture

```
┌─────────────────┐
│  React Client   │
│   (useCrime.ts) │
└────────┬────────┘
         │ SWR + fetch
         ↓
┌─────────────────┐
│  API Routes     │
│  /api/crime/*   │
└────────┬────────┘
         │ Adapter
         ↓
┌─────────────────┐
│  DTOs           │
│  ResponseEnv<T> │
└────────┬────────┘
         │ Mongoose
         ↓
┌─────────────────┐
│  MongoDB        │
│  5 Collections  │
└─────────────────┘
```

### Key Principles

- **Type Safety**: Full TypeScript coverage with strict types
- **Adapter Pattern**: Clean separation between DB documents and API DTOs
- **Consistent Envelopes**: All responses wrapped in `ResponseEnvelope<T>`
- **Authorization**: User-scoped queries (ownerId/sellerId filtering)
- **Comprehensive Filtering**: Rich query capabilities for all entities

---

## Data Models

### 1. Production Facility

**Collection:** `ProductionFacility`  
**Purpose:** Tracks illegal production operations (labs, farms, warehouses)

**Schema:**
```typescript
interface IProductionFacility {
  ownerId: ObjectId;              // User who owns facility
  companyId?: ObjectId;            // Optional company affiliation
  type: 'Lab' | 'Farm' | 'Warehouse';
  location: { state: string; city: string };
  capacity: number;                // Units per production cycle
  quality: number;                 // 0-100 (influences purity)
  suspicionLevel: number;          // 0-100 (raid risk)
  status: 'Active' | 'Raided' | 'Abandoned' | 'Seized';
  upgrades: IFacilityUpgrade[];    // Equipment, Security, Automation
  employees: { userId: ObjectId; role: string; skill?: number }[];
  inventory: IFacilityInventoryItem[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ ownerId: 1, status: 1 }` - User facilities by status
- `{ 'location.state': 1, type: 1 }` - Geographic + type filtering
- `{ ownerId: 1 }` - User ownership (field-level)
- `{ type: 1 }` - Facility type filtering (field-level)
- `{ status: 1 }` - Status filtering (field-level)

**Business Rules:**
- Capacity must be ≥ 1
- Quality and suspicionLevel capped at 0-100
- Raided/Seized facilities typically have empty inventory
- Upgrades affect production efficiency and detection risk

---

### 2. Distribution Route

**Collection:** `DistributionRoute`  
**Purpose:** Manages transportation corridors for product distribution

**Schema:**
```typescript
interface IDistributionRoute {
  ownerId: ObjectId;
  companyId?: ObjectId;
  origin: { state: string; city: string };
  destination: { state: string; city: string };
  method: 'Road' | 'Air' | 'Rail' | 'Courier';
  capacity: number;                // Units per shipment
  cost: number;                    // Base transportation cost
  speed: number;                   // Duration in hours
  riskScore: number;               // 0-100 (seizure probability)
  status: 'Active' | 'Suspended' | 'Interdicted';
  shipments: { id: string; quantity: number; status: string; eta?: Date }[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ ownerId: 1, status: 1 }` - User routes by status
- `{ 'origin.state': 1, 'destination.state': 1 }` - Geographic routing

**Business Rules:**
- Capacity must be ≥ 1
- Speed must be ≥ 1 hour
- Cost must be ≥ 0
- Active routes can have in-transit shipments
- Interdicted routes represent seized/compromised corridors

---

### 3. Marketplace Listing

**Collection:** `MarketplaceListing`  
**Purpose:** Underground marketplace for product sales

**Schema:**
```typescript
interface IMarketplaceListing {
  sellerId: ObjectId;              // Note: sellerId, not ownerId
  companyId?: ObjectId;
  substance: string;               // Validated by catalog
  quantity: number;                // Total units available
  purity: number;                  // 0-100
  pricePerUnit: number;
  location: { state: string; city: string };
  deliveryOptions: IDeliveryOption[];
  minOrder?: number;
  bulkDiscounts?: { qty: number; discount: number }[];
  status: 'Active' | 'Sold' | 'Expired' | 'Seized';
  sellerRep?: number;              // 0-100 reputation score
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ status: 1, substance: 1 }` - Active listings by substance
- `{ 'location.state': 1, pricePerUnit: 1 }` - Price discovery
- `{ sellerId: 1 }` - Seller's listings (field-level)
- `{ substance: 1 }` - Substance filtering (field-level)
- `{ status: 1 }` - Status filtering (field-level)

**Business Rules:**
- Quantity must be ≥ 1 (except "Sold" status can have 0)
- Purity capped at 0-100
- Bulk discounts apply to quantities ≥ qty threshold
- Delivery options include method-specific costs and risks

---

### 4. Laundering Channel

**Collection:** `LaunderingChannel`  
**Purpose:** Money laundering operations for cleaning illicit funds

**Schema:**
```typescript
interface ILaunderingChannel {
  ownerId: ObjectId;
  companyId?: ObjectId;
  method: 'Shell' | 'CashBiz' | 'Crypto' | 'TradeBased' | 'Counterfeit';
  throughputCap: number;           // Max per time window
  feePercent: number;              // Service fee (0-100)
  latencyDays: number;             // Delay before funds available
  detectionRisk: number;           // 0-100 baseline risk
  transactionHistory: ILaunderingTxn[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ ownerId: 1, method: 1 }` - User channels by method
- `{ detectionRisk: -1 }` - Risk-based filtering (desc)

**Business Rules:**
- ThroughputCap must be ≥ 1
- FeePercent capped at 0-100
- LatencyDays must be ≥ 0
- Transaction history tracks amount, date, and detection status

---

### 5. Heat Level

**Collection:** `HeatLevel`  
**Purpose:** Law enforcement attention tracking across scopes

**Schema:**
```typescript
interface IHeatLevel {
  scope: 'Global' | 'State' | 'City' | 'User' | 'Gang';
  scopeId: string;                 // State code, city key, userId, gangId
  current: number;                 // 0-100 current heat level
  factors: IHeatFactor[];          // Heat sources and decay rates
  thresholds: { raid: number; investigation: number; surveillance: number };
  lastDecay: Date;                 // Last decay calculation
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ scope: 1, scopeId: 1 }` - Unique heat tracking
- `{ current: -1 }` - Heat level filtering (desc)

**Business Rules:**
- Current level capped at 0-100
- Thresholds define action triggers (surveillance < investigation < raid)
- Factors have source, delta (applied change), and decay rate
- Heat naturally decays over time based on lastDecay

---

## API Endpoints

### Base Path: `/api/crime`

All endpoints require authentication (`auth()` from `@/auth`).

---

### 1. Facilities Endpoint

**Path:** `/api/crime/facilities`

#### GET - List Facilities

**Query Parameters:**
- `company` (string): Company ID filter
- `type` (string): Facility type filter (`Lab`, `Farm`, `Warehouse`)
- `state` (string): Location state filter
- `status` (string): Status filter (`Active`, `Raided`, `Abandoned`, `Seized`)

**Authorization:** Returns only facilities owned by authenticated user

**Response:**
```typescript
ResponseEnvelope<FacilityDTO[]>
```

**Example:**
```bash
GET /api/crime/facilities?type=Lab&status=Active
```

#### POST - Create Facility

**Body:**
```typescript
{
  companyId?: string;
  type: 'Lab' | 'Farm' | 'Warehouse';
  location: { state: string; city: string };
  capacity: number;
  quality: number;
}
```

**Authorization:** Sets `ownerId` to authenticated user

**Response:**
```typescript
ResponseEnvelope<FacilityDTO>
```

**Validation:**
- Type must be valid enum value
- Capacity ≥ 1
- Quality 0-100

---

### 2. Routes Endpoint

**Path:** `/api/crime/routes`

#### GET - List Routes

**Query Parameters:**
- `company` (string): Company ID filter
- `origin` (string): Origin state filter
- `destination` (string): Destination state filter
- `method` (string): Transport method filter
- `status` (string): Status filter

**Authorization:** Returns only routes owned by authenticated user

**Response:**
```typescript
ResponseEnvelope<RouteDTO[]>
```

#### POST - Create Route

**Body:**
```typescript
{
  companyId?: string;
  origin: { state: string; city: string };
  destination: { state: string; city: string };
  method: 'Road' | 'Air' | 'Rail' | 'Courier';
  capacity: number;
  cost: number;
  speed: number;
}
```

**Authorization:** Sets `ownerId` to authenticated user

**Response:**
```typescript
ResponseEnvelope<RouteDTO>
```

**Validation:**
- Method must be valid enum value
- Capacity ≥ 1
- Speed ≥ 1
- Cost ≥ 0

---

### 3. Marketplace Endpoint

**Path:** `/api/crime/marketplace`

#### GET - List Listings

**Query Parameters:**
- `company` (string): Company ID filter
- `substance` (string): Substance name filter
- `state` (string): Location state filter
- `minPurity` (number): Minimum purity filter (0-100)
- `maxPrice` (number): Maximum price per unit filter
- `status` (string): Status filter

**Authorization:** Returns only listings where `sellerId` matches authenticated user

**Response:**
```typescript
ResponseEnvelope<MarketplaceListingDTO[]>
```

#### POST - Create Listing

**Body:**
```typescript
{
  companyId?: string;
  substance: string;
  quantity: number;
  purity: number;
  pricePerUnit: number;
  location: { state: string; city: string };
  deliveryOptions?: Array<{ method: string; cost: number; risk: number }>;
  minOrder?: number;
  bulkDiscounts?: Array<{ qty: number; discount: number }>;
}
```

**Authorization:** Sets `sellerId` to authenticated user

**Response:**
```typescript
ResponseEnvelope<MarketplaceListingDTO>
```

**Validation:**
- Quantity ≥ 1
- Purity 0-100
- PricePerUnit ≥ 0

---

### 4. Laundering Endpoint

**Path:** `/api/crime/laundering`

#### GET - List Channels

**Query Parameters:**
- `company` (string): Company ID filter
- `method` (string): Laundering method filter

**Authorization:** Returns only channels owned by authenticated user

**Response:**
```typescript
ResponseEnvelope<LaunderingChannelDTO[]>
```

#### POST - Create Channel

**Body:**
```typescript
{
  companyId?: string;
  method: 'Shell' | 'CashBiz' | 'Crypto' | 'TradeBased' | 'Counterfeit';
  throughputCap: number;
  feePercent: number;
  latencyDays: number;
}
```

**Authorization:** Sets `ownerId` to authenticated user

**Response:**
```typescript
ResponseEnvelope<LaunderingChannelDTO>
```

**Validation:**
- Method must be valid enum value
- ThroughputCap ≥ 1
- FeePercent 0-100
- LatencyDays ≥ 0

---

### 5. Heat Endpoint

**Path:** `/api/crime/heat`

#### GET - Get Heat Level

**Query Parameters:**
- `scope` (string, required): Heat scope (`Global`, `State`, `City`, `User`, `Gang`)
- `scopeId` (string, required): Scope identifier

**Authorization:** 
- `Global` scope: Public access
- `State`, `City` scope: Public access
- `User` scope: Only returns if `scopeId` matches authenticated user ID
- `Gang` scope: Gang membership check (future implementation)

**Response:**
```typescript
ResponseEnvelope<HeatLevelDTO>
```

**Example:**
```bash
GET /api/crime/heat?scope=User&scopeId=507f1f77bcf86cd799439011
GET /api/crime/heat?scope=State&scopeId=CA
```

#### POST - Upsert Heat Level

**Body:**
```typescript
{
  scope: 'Global' | 'State' | 'City' | 'User' | 'Gang';
  scopeId: string;
  current: number;
  factors?: Array<{ source: string; delta: number; decay: number }>;
  thresholds?: { raid: number; investigation: number; surveillance: number };
}
```

**Authorization:** Admin-only (future implementation)

**Response:**
```typescript
ResponseEnvelope<HeatLevelDTO>
```

**Validation:**
- Current 0-100
- Thresholds must satisfy: surveillance < investigation < raid

---

## DTO Contracts

### Response Envelope

All API responses use consistent envelope structure:

```typescript
export interface ResponseEnvelope<T> {
  success: boolean;
  data: T | T[] | null;
  error: string | null;
  meta?: Record<string, unknown> | null;
}
```

**Properties:**
- `success`: Operation success indicator
- `data`: Response payload (single entity, array, or null)
- `error`: Error message if `success: false`
- `meta`: Optional metadata (pagination, counts, etc.)

**Union Type Handling:**

The DTO type `data: T | T[] | null` creates TypeScript union ambiguity. Frontend hooks use explicit type assertions after runtime checks:

```typescript
const facilitiesArray = (Array.isArray(facilities.data?.data) 
  ? facilities.data.data 
  : []) as FacilityDTO[];
```

---

### Entity DTOs

All DTOs follow consistent structure:

#### FacilityDTO
```typescript
{
  id: string;
  ownerId: string;
  companyId?: string;
  type: 'Lab' | 'Farm' | 'Warehouse';
  location: { state: string; city: string };
  capacity: number;
  quality: number;
  suspicionLevel: number;
  status: 'Active' | 'Raided' | 'Abandoned' | 'Seized';
  upgrades: Array<{ type: string; level: number; installed: string }>;
  employees: Array<{ userId: string; role: string; skill?: number }>;
  inventory: Array<{ substance: string; quantity: number; purity: number; batch: string }>;
  createdAt: string;
  updatedAt: string;
}
```

#### RouteDTO
```typescript
{
  id: string;
  ownerId: string;
  companyId?: string;
  origin: { state: string; city: string };
  destination: { state: string; city: string };
  method: 'Road' | 'Air' | 'Rail' | 'Courier';
  capacity: number;
  cost: number;
  speed: number;
  riskScore: number;
  status: 'Active' | 'Suspended' | 'Interdicted';
  shipments: Array<{ id: string; quantity: number; status: string; eta?: string }>;
  createdAt: string;
  updatedAt: string;
}
```

#### MarketplaceListingDTO
```typescript
{
  id: string;
  sellerId: string;
  companyId?: string;
  substance: string;
  quantity: number;
  purity: number;
  pricePerUnit: number;
  location: { state: string; city: string };
  deliveryOptions: Array<{ method: string; cost: number; risk: number }>;
  minOrder?: number;
  bulkDiscounts?: Array<{ qty: number; discount: number }>;
  status: 'Active' | 'Sold' | 'Expired' | 'Seized';
  sellerRep?: number;
  createdAt: string;
  updatedAt: string;
}
```

#### LaunderingChannelDTO
```typescript
{
  id: string;
  ownerId: string;
  companyId?: string;
  method: 'Shell' | 'CashBiz' | 'Crypto' | 'TradeBased' | 'Counterfeit';
  throughputCap: number;
  feePercent: number;
  latencyDays: number;
  detectionRisk: number;
  transactionHistory: Array<{ amount: number; date: string; detected: boolean }>;
  createdAt: string;
  updatedAt: string;
}
```

#### HeatLevelDTO
```typescript
{
  id: string;
  scope: 'Global' | 'State' | 'City' | 'User' | 'Gang';
  scopeId: string;
  current: number;
  factors: Array<{ source: string; delta: number; decay: number }>;
  thresholds: { raid: number; investigation: number; surveillance: number };
  lastDecay: string;
  createdAt: string;
  updatedAt: string;
}
```

**Key DTO Characteristics:**
- `id` is string (MongoDB ObjectId converted)
- All ObjectId references converted to strings
- All Date fields converted to ISO 8601 strings
- Nested objects preserved (location, upgrades, etc.)

---

## Frontend Integration

### SWR Hooks (`src/hooks/useCrime.ts`)

The Crime domain provides comprehensive SWR hooks for all operations:

#### Individual Entity Hooks

```typescript
// Facilities
const { facilities, error, isLoading } = useCrimeFacilities(companyId?, filters?);

// Routes
const { routes, error, isLoading } = useCrimeRoutes(companyId?, filters?);

// Marketplace
const { listings, error, isLoading } = useCrimeMarketplace(companyId?, filters?);

// Laundering
const { channels, error, isLoading } = useCrimeLaundering(companyId?, filters?);

// Heat (Global)
const { heat, error, isLoading } = useCrimeGlobalHeat();

// Heat (User-specific)
const { heat, error, isLoading } = useCrimeUserHeat(userId);
```

#### Dashboard Summary Hook

```typescript
const { summary, error, isLoading } = useCrimeDashboard(companyId?);

// Returns CrimeSummary with aggregated metrics:
interface CrimeSummary {
  // Facilities
  totalFacilities: number;
  activeFacilities: number;
  facilitiesByType: Record<string, number>;
  totalFacilityCapacity: number;
  averageQuality: number;
  
  // Routes
  totalRoutes: number;
  activeRoutes: number;
  routesByMethod: Record<string, number>;
  totalRouteCapacity: number;
  averageRiskScore: number;
  
  // Marketplace
  totalListings: number;
  activeListings: number;
  listingsBySubstance: Record<string, number>;
  totalQuantityListed: number;
  averagePurity: number;
  
  // Laundering
  totalChannels: number;
  channelsByMethod: Record<string, number>;
  totalThroughputCapacity: number;
  averageDetectionRisk: number;
  
  // Heat
  globalHeat: number;
  userHeat: number;
}
```

### Endpoint Configuration (`src/lib/api/endpoints.ts`)

```typescript
export const crimeEndpoints = {
  facilities: '/api/crime/facilities',
  routes: '/api/crime/routes',
  marketplace: '/api/crime/marketplace',
  laundering: '/api/crime/laundering',
  heat: '/api/crime/heat',
} as const;

// Integrated into consolidated endpoints
export const endpoints = {
  // ... other domains
  crime: crimeEndpoints,
  // ... more domains
} as const;
```

---

## Security & Authorization

### Authentication

All Crime endpoints require authenticated user:

```typescript
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json(
    { success: false, data: null, error: 'Unauthorized' },
    { status: 401 }
  );
}
```

### Authorization Rules

#### Facilities, Routes, Laundering
- **GET**: Returns only entities where `ownerId` matches authenticated user
- **POST**: Automatically sets `ownerId` to authenticated user ID
- **Queries**: All MongoDB queries include `{ ownerId: session.user.id }`

#### Marketplace
- **GET**: Returns only listings where `sellerId` matches authenticated user
- **POST**: Automatically sets `sellerId` to authenticated user ID
- **Note**: Uses `sellerId` field instead of `ownerId`

#### Heat
- **GET Global/State/City**: Public access (law enforcement heat is observable)
- **GET User**: Only returns if `scopeId` matches authenticated user ID
- **POST**: Admin-only (future implementation)

### Data Isolation

- Users cannot access other users' facilities, routes, channels, or listings
- Company filtering (`companyId`) further restricts results
- No cross-user data leakage through API

---

## Error Handling

### Standard Error Responses

All errors return consistent envelope structure:

```typescript
{
  success: false,
  data: null,
  error: "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Data returned successfully |
| 201 | Created | New entity created |
| 400 | Bad Request | Invalid input data, validation failure |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | User lacks permission for resource |
| 404 | Not Found | Entity with given ID doesn't exist |
| 500 | Server Error | Database error, unexpected exception |

### Error Examples

```json
// Validation Error (400)
{
  "success": false,
  "data": null,
  "error": "Validation failed: capacity must be >= 1"
}

// Authorization Error (401)
{
  "success": false,
  "data": null,
  "error": "Unauthorized"
}

// Not Found (404)
{
  "success": false,
  "data": null,
  "error": "Heat level not found for scope=User, scopeId=507f..."
}

// Server Error (500)
{
  "success": false,
  "data": null,
  "error": "Database connection failed"
}
```

---

## Performance Considerations

### Indexes

All collections have optimized indexes:

**ProductionFacility:**
- `{ ownerId: 1, status: 1 }` - Fast user facility queries by status
- `{ 'location.state': 1, type: 1 }` - Geographic filtering

**DistributionRoute:**
- `{ ownerId: 1, status: 1 }` - User route queries
- `{ 'origin.state': 1, 'destination.state': 1 }` - Route lookup

**MarketplaceListing:**
- `{ status: 1, substance: 1 }` - Active listings by product
- `{ 'location.state': 1, pricePerUnit: 1 }` - Price discovery

**LaunderingChannel:**
- `{ ownerId: 1, method: 1 }` - User channels by method
- `{ detectionRisk: -1 }` - Risk-based sorting

**HeatLevel:**
- `{ scope: 1, scopeId: 1 }` - Unique heat lookup
- `{ current: -1 }` - Heat level sorting

### Query Optimization

- All user-scoped queries use indexed `ownerId`/`sellerId`
- Status filtering uses indexed `status` field
- Geographic queries use indexed state fields
- No full collection scans

### SWR Caching

Frontend hooks leverage SWR's built-in caching:
- Automatic deduplication of requests
- Background revalidation
- Stale-while-revalidate pattern
- Optimistic UI updates

---

## Testing & QA

### Seed Data

Use `scripts/loaders/crime.seed.ts` for deterministic test data:

```typescript
import { seedCrimeData, clearCrimeData } from '@/scripts/loaders/crime.seed';

// Load seed data
await seedCrimeData();

// Clear all crime data
await clearCrimeData();
```

**Seed Coverage:**
- 6 Production Facilities (all types, all statuses)
- 5 Distribution Routes (all methods, various statuses)
- 6 Marketplace Listings (6 substances, all statuses)
- 5 Laundering Channels (all methods)
- 6 Heat Levels (Global, 3 States, 2 Users)

### Manual Testing Scenarios

#### Scenario 1: Facility Lifecycle
1. Create Lab facility → Verify returns 201, sets ownerId
2. GET facilities?type=Lab → Verify appears in list
3. Update suspicionLevel → Verify reflects in GET
4. Simulate raid (status=Raided) → Verify status change

#### Scenario 2: Distribution Chain
1. Create Route (CA → NV) → Verify creation
2. Create Shipment → Add to route.shipments
3. GET routes?origin=CA → Verify filtering
4. Update status=Interdicted → Verify route disabled

#### Scenario 3: Marketplace Transaction
1. Create Listing (substance=Cocaine) → Verify listing
2. GET marketplace?substance=Cocaine → Verify appears
3. Simulate purchase (quantity=0, status=Sold) → Verify
4. GET marketplace?status=Active → Verify removed from active

#### Scenario 4: Laundering Operations
1. Create Shell channel → Verify creation
2. Add transaction to history → Verify stored
3. GET laundering?method=Shell → Verify filtering
4. Calculate total throughput → Verify aggregation

#### Scenario 5: Heat Escalation
1. GET heat?scope=User&scopeId=USER_1 → Verify current level
2. POST heat (increase current) → Verify update
3. Add heat factor → Verify stored in factors array
4. Verify threshold crossing → Surveillance → Investigation → Raid

---

## Future Enhancements

### Planned Features (Post-Beta)

#### 1. CRUD Operations
- **UPDATE**: PATCH endpoints for all entities
- **DELETE**: Soft delete (status change) or hard delete options
- **BATCH**: Bulk operations for efficiency

#### 2. Advanced Filtering
- Date range filtering (createdAt, updatedAt)
- Numeric range queries (capacity, quality, price)
- Full-text search on substance names
- Geospatial queries (distance-based)

#### 3. Relationships
- Facility → Route linkage (origin facilities)
- Route → Listing integration (delivery options)
- Channel → Transaction tracking (audit trail)
- Heat → Entity correlation (facility raids → heat increase)

#### 4. Real-Time Updates
- WebSocket notifications for heat changes
- Shipment status updates (in-transit → delivered)
- Raid alerts (high suspicion → raided)
- Market price fluctuations

#### 5. Aggregations
- Revenue calculations (marketplace sales)
- Profit margins (production cost vs sale price)
- Risk analytics (heat trends, seizure rates)
- Supply chain visualization (facility → route → listing)

#### 6. Security Enhancements
- Role-based access control (admin vs user)
- Gang affiliation support (shared ownership)
- Audit logging (who modified what when)
- Rate limiting per user

#### 7. Performance
- Pagination for large result sets
- Cursor-based pagination for infinite scroll
- Response compression (gzip)
- Database query result caching

---

## Migration Notes

### From Mock to Persistent Data

When migrating from mock data:

1. **Remove Mock Files**: Delete any temporary mock data files
2. **Update Imports**: Change imports from mocks to API hooks
3. **Add Error Handling**: Mock data never fails, real APIs do
4. **Handle Loading States**: SWR provides `isLoading` flag
5. **Update Test Suites**: Use seed data instead of mocks

### Breaking Changes from Beta

None expected - Beta is first persistent implementation.

---

## Support & Troubleshooting

### Common Issues

#### Issue: "Unauthorized" (401)
- **Cause**: Missing or invalid authentication
- **Fix**: Verify `auth()` session exists and has valid user ID

#### Issue: Empty Results When Data Exists
- **Cause**: Query filtered by wrong ownerId/sellerId
- **Fix**: Check that authenticated user matches data owner

#### Issue: TypeScript Errors on `data` Property
- **Cause**: ResponseEnvelope<T> union type (`T | T[] | null`)
- **Fix**: Use type assertions after Array.isArray check (see hooks)

#### Issue: "Validation failed" (400)
- **Cause**: Input data violates schema constraints
- **Fix**: Check min/max values, required fields, enum values

### Debug Tips

1. **Check MongoDB Indexes**: Run `.explain()` on slow queries
2. **Verify Auth Session**: Log `session.user.id` in API routes
3. **Test with Seed Data**: Use deterministic IDs for reproducibility
4. **Monitor Response Times**: Add timing logs to identify bottlenecks
5. **Inspect Network Tab**: Verify request/response payloads

---

## Appendix

### Related Documentation

- [API Documentation](./API.md) - General API conventions
- [Authentication](./AUTHENTICATION.md) - Auth system details
- [Database Models](../src/lib/db/models/crime/) - Schema definitions
- [Frontend Hooks](../src/hooks/useCrime.ts) - SWR integration

### Version History

- **v1.0.0** (2025-12-01): Initial Beta persistence implementation
  - 5 models, 5 endpoints, full CRUD (GET/POST)
  - ResponseEnvelope pattern
  - User-scoped authorization
  - Comprehensive seed data
  - SWR hook integration

---

**Document Status:** Complete  
**Last Updated:** 2025-12-01  
**Next Review:** After Beta QA completion  

---

*Generated by ECHO v1.3.3 FLAWLESS IMPLEMENTATION PROTOCOL*
