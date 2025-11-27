

# Politics API Endpoints - Complete Reference

**Version:** 1.0.0  
**Last Updated:** November 25, 2025  
**Base URL:** `/api/politics`  
**ECHO Compliance:** ✅ AAA Quality Standards

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Endpoints](#endpoints)
   - [GET /states](#get-states)
   - [GET /leaderboard](#get-leaderboard)
   - [GET /elections/next](#get-electionsnext)
   - [GET /endorsements](#get-endorsements)
   - [GET /snapshots](#get-snapshots)
6. [Data Types](#data-types)
7. [Rate Limiting](#rate-limiting)
8. [Examples](#examples)

---

## Overview

The Politics API provides read-only access to political game mechanics including state influence metrics, company leaderboards, election projections, endorsements, and offline protection snapshots.

**Current Phase:** 001B - Read Endpoints  
**Features:** GET operations with query filtering and pagination  
**Future:** POST/PUT/DELETE operations for campaign management

---

## Authentication

**Current:** No authentication required (read-only endpoints)  
**Future:** NextAuth session required for write operations

---

## Response Format

All endpoints return standardized JSON responses with the following structure:

### Success Response

```typescript
{
  success: true,
  data: {
    // Endpoint-specific data
  },
  meta?: {
    // Optional metadata (pagination, etc.)
  }
}
```

### Error Response

```typescript
{
  success: false,
  error: {
    message: string,
    code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR',
    statusCode: number,
    details?: any[]  // Zod validation issues if applicable
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful request |
| 400 | Bad Request | Invalid query parameters |
| 404 | Not Found | Resource not found (e.g., invalid state code) |
| 500 | Internal Server Error | Unexpected server error |

### Error Codes

- `VALIDATION_ERROR` - Query parameter validation failed
- `NOT_FOUND` - Requested resource doesn't exist
- `INTERNAL_ERROR` - Unexpected server error

---

## Endpoints

### GET /states

Returns normalized state influence metrics derived from population, GDP, seats, and crime data.

**URL:** `/api/politics/states`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `stateCode` | string | No | - | Two-letter state code (e.g., "CA", "TX") |

#### Response Structure

**All States:**

```typescript
{
  success: true,
  data: {
    states: Array<{
      stateCode: string,              // Two-letter state abbreviation
      compositeInfluenceWeight: number, // Normalized composite influence (0-1 range)
      gdpShare: number,                // State's share of total GDP (0-1)
      populationShare: number,         // State's share of total population (0-1)
      seatShare: number,               // State's share of electoral seats (0-1)
      crimePercentile: number          // Crime index percentile (0-1, higher = more crime)
    }>
  }
}
```

**Single State:**

```typescript
{
  success: true,
  data: {
    state: {
      stateCode: string,
      compositeInfluenceWeight: number,
      gdpShare: number,
      populationShare: number,
      seatShare: number,
      crimePercentile: number
    }
  }
}
```

#### Field Descriptions

- **`compositeInfluenceWeight`**: Weighted composite of economic (GDP), demographic (population), political (seats), and crime factors. Used for political influence calculations.
- **`gdpShare`**: State's percentage of total US GDP (normalized 0-1)
- **`populationShare`**: State's percentage of total US population (normalized 0-1)
- **`seatShare`**: State's percentage of total electoral seats (House + Senate + Electoral) (normalized 0-1)
- **`crimePercentile`**: State's violent crime rate as percentile rank (0 = lowest crime, 1 = highest crime)

#### Examples

**Request:** `GET /api/politics/states`

**Response:**
```json
{
  "success": true,
  "data": {
    "states": [
      {
        "stateCode": "CA",
        "compositeInfluenceWeight": 0.1869,
        "gdpShare": 0.1481,
        "populationShare": 0.1169,
        "seatShare": 0.1007,
        "crimePercentile": 0.74
      },
      {
        "stateCode": "TX",
        "compositeInfluenceWeight": 0.1571,
        "gdpShare": 0.0978,
        "populationShare": 0.0912,
        "seatShare": 0.0746,
        "crimePercentile": 0.76
      }
      // ... 49 more states
    ]
  }
}
```

**Request:** `GET /api/politics/states?stateCode=NY`

**Response:**
```json
{
  "success": true,
  "data": {
    "state": {
      "stateCode": "NY",
      "compositeInfluenceWeight": 0.1140,
      "gdpShare": 0.0829,
      "populationShare": 0.0586,
      "seatShare": 0.0522,
      "crimePercentile": 0.54
    }
  }
}
```

#### Notes

- Returns exactly 51 entries (50 states + DC)
- States sorted by `compositeInfluenceWeight` descending
- All shares normalized to 0-1 range (divide by 100 for percentages)
- Case-insensitive state code matching (e.g., "ca" → "CA")

---

### GET /leaderboard

Returns companies ranked by total political influence (sum of all contributions).

**URL:** `/api/politics/leaderboard`

#### Query Parameters

None. Returns all companies sorted by influence descending.

#### Response Structure

```typescript
{
  success: true,
  data: {
    leaderboard: Array<{
      companyId: string,      // MongoDB ObjectId as string
      companyName: string,    // Company display name
      totalInfluence: number  // Sum of all political contributions
    }>
  }
}
```

#### Field Descriptions

- **`companyId`**: Unique company identifier (MongoDB ObjectId)
- **`companyName`**: Human-readable company name
- **`totalInfluence`**: Aggregate political influence from all contributions (donations, lobbying, etc.)

#### Examples

**Request:** `GET /api/politics/leaderboard`

**Response:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "companyId": "507f1f77bcf86cd799439011",
        "companyName": "MegaCorp Industries",
        "totalInfluence": 15420
      },
      {
        "companyId": "507f191e810c19729de860ea",
        "companyName": "TechGiant LLC",
        "totalInfluence": 12350
      }
      // ... more companies
    ]
  }
}
```

#### Notes

- Requires database connection (MongoDB)
- Aggregates `PoliticalContribution` collection by `companyId`
- Empty array returned if no contributions exist
- Company names resolved from `Company` collection

---

### GET /elections/next

Calculates the next election date for a specific political office type.

**URL:** `/api/politics/elections/next`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `kind` | string | **Yes** | - | Office type: "president", "senator", "house", "governor" |
| `fromWeek` | number | No | 0 | Starting game week (0-indexed) |
| `senateClass` | number | Conditional | - | Senate class (1, 2, or 3) - **required if kind=senator** |

#### Response Structure

```typescript
{
  success: true,
  data: {
    input: {
      kind: "president" | "senator" | "house" | "governor",
      fromWeek: number,
      senateClass?: 1 | 2 | 3,
      termYears: number  // Derived from office type
    },
    result: {
      nextWeek: number,     // Game week index of next election
      // Additional fields from describeNextElection() may appear
    }
  }
}
```

#### Election Cycles

| Office | Term Length | Cycle (weeks) | Notes |
|--------|-------------|---------------|-------|
| President | 4 years | 208 weeks | Every 4 game years |
| House | 2 years | 104 weeks | Every 2 game years |
| Governor | 2 or 4 years | 104 or 208 weeks | State-dependent |
| Senator | 6 years | 312 weeks | Staggered by class |

**Senate Classes:**
- Class 1: Offset +0 weeks
- Class 2: Offset +104 weeks  
- Class 3: Offset +208 weeks

#### Time Model

- **Acceleration:** 168× (1 real hour = 1 game week)
- **Game Year:** 52 weeks = 52 real hours
- **Week 0:** Game epoch (configurable start date)

#### Examples

**Request:** `GET /api/politics/elections/next?kind=president&fromWeek=100`

**Response:**
```json
{
  "success": true,
  "data": {
    "input": {
      "kind": "president",
      "fromWeek": 100,
      "termYears": 4
    },
    "result": {
      "nextWeek": 208
    }
  }
}
```

**Request:** `GET /api/politics/elections/next?kind=senator&senateClass=2&fromWeek=50`

**Response:**
```json
{
  "success": true,
  "data": {
    "input": {
      "kind": "senator",
      "fromWeek": 50,
      "senateClass": 2,
      "termYears": 6
    },
    "result": {
      "nextWeek": 104
    }
  }
}
```

#### Validation Errors

```json
{
  "success": false,
  "error": {
    "message": "Invalid query parameters",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "details": [
      {
        "code": "invalid_enum_value",
        "path": ["kind"],
        "message": "Invalid enum value. Expected 'president' | 'senator' | 'house' | 'governor'"
      }
    ]
  }
}
```

#### Notes

- `senateClass` mandatory when `kind=senator`
- `fromWeek` defaults to 0 (game epoch)
- Returns next election **strictly greater** than `fromWeek`
- Calculations are deterministic and pure (no database access)

---

### GET /endorsements

Returns paginated list of political endorsement stubs.

**URL:** `/api/politics/endorsements`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-indexed) |
| `pageSize` | number | No | 20 | Items per page (max 100) |

#### Response Structure

```typescript
{
  success: true,
  data: {
    page: number,
    pageSize: number,
    total: number,
    endorsements: Array<{
      endorsementId: string,
      companyId: string,
      candidateName: string,
      office: "president" | "senator" | "representative" | "governor",
      state: string,        // Two-letter state code
      tier: "bronze" | "silver" | "gold" | "platinum",
      week: number          // Game week when endorsement made
    }>
  },
  meta: {
    page: number,
    pageSize: number,
    total: number
  }
}
```

#### Field Descriptions

- **`endorsementId`**: Unique endorsement identifier
- **`companyId`**: Company that made the endorsement
- **`candidateName`**: Name of endorsed candidate
- **`office`**: Political office being sought
- **`state`**: State where candidate is running
- **`tier`**: Endorsement level (affects influence/cost)
- **`week`**: Game week when endorsement was created

#### Examples

**Request:** `GET /api/politics/endorsements?page=1&pageSize=5`

**Response:**
```json
{
  "success": true,
  "data": {
    "page": 1,
    "pageSize": 5,
    "total": 23,
    "endorsements": [
      {
        "endorsementId": "end:001",
        "companyId": "comp:001",
        "candidateName": "Jane Smith",
        "office": "senator",
        "state": "CA",
        "tier": "gold",
        "week": 104
      },
      {
        "endorsementId": "end:002",
        "companyId": "comp:002",
        "candidateName": "John Doe",
        "office": "governor",
        "state": "TX",
        "tier": "silver",
        "week": 98
      }
      // ... 3 more endorsements
    ]
  },
  "meta": {
    "page": 1,
    "pageSize": 5,
    "total": 23
  }
}
```

#### Pagination

- Page numbers are 1-indexed
- `pageSize` clamped to 1-100 range
- Pages beyond available data return empty array
- `total` reflects full dataset size (filtered if applicable)

#### Notes

- **Phase 001B Placeholder:** Currently returns static mock data
- Future implementation will query `Endorsement` collection
- Metadata duplicated in `data` and `meta` for client convenience

---

### GET /snapshots

Returns paginated influence snapshots with optional company filtering.

**URL:** `/api/politics/snapshots`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `companyId` | string | No | - | Filter by company ID |
| `page` | number | No | 1 | Page number (1-indexed) |
| `pageSize` | number | No | 10 | Items per page (max 50) |

#### Response Structure

```typescript
{
  success: true,
  data: {
    page: number,
    pageSize: number,
    total: number,
    snapshots: Array<{
      companyId: string,
      snapshot: {
        total: number,        // Total influence at capture time
        level: number,        // Company level (1-5)
        capturedAt: string    // ISO 8601 timestamp
      }
    }>
  },
  meta: {
    page: number,
    pageSize: number,
    total: number
  }
}
```

#### Field Descriptions

- **`companyId`**: Company identifier
- **`snapshot.total`**: Total political influence at snapshot time
- **`snapshot.level`**: Company level when snapshot was taken (1-5)
- **`snapshot.capturedAt`**: ISO 8601 timestamp of snapshot creation

#### Offline Protection

Snapshots serve the **offline fairness system**:
1. Player goes offline → influence calculation continues
2. Calculated influence compared against snapshot retention floor
3. Final influence = `max(calculated, previous * 0.9, levelMinimum)`
4. Prevents offline penalties beyond 10% decay

**Retention Formula:**
```typescript
retentionFloor = previousSnapshot.total * 0.9
levelFloor = LEVEL_MINIMUMS[level]  // [0, 10, 25, 50, 100, 200]
fairnessFloor = max(retentionFloor, levelFloor)
finalInfluence = max(currentCalculated, fairnessFloor)
```

#### Examples

**Request:** `GET /api/politics/snapshots?page=1&pageSize=3`

**Response:**
```json
{
  "success": true,
  "data": {
    "page": 1,
    "pageSize": 3,
    "total": 5,
    "snapshots": [
      {
        "companyId": "comp:TX-0001",
        "snapshot": {
          "total": 120,
          "level": 3,
          "capturedAt": "2025-11-25T21:33:38.835Z"
        }
      },
      {
        "companyId": "comp:CA-0002",
        "snapshot": {
          "total": 210,
          "level": 4,
          "capturedAt": "2025-11-25T21:33:38.835Z"
        }
      },
      {
        "companyId": "comp:FL-0003",
        "snapshot": {
          "total": 95,
          "level": 2,
          "capturedAt": "2025-11-25T21:33:38.835Z"
        }
      }
    ]
  },
  "meta": {
    "page": 1,
    "pageSize": 3,
    "total": 5
  }
}
```

**Request:** `GET /api/politics/snapshots?companyId=comp:NY-0004`

**Response:**
```json
{
  "success": true,
  "data": {
    "page": 1,
    "pageSize": 10,
    "total": 1,
    "snapshots": [
      {
        "companyId": "comp:NY-0004",
        "snapshot": {
          "total": 310,
          "level": 5,
          "capturedAt": "2025-11-25T21:33:38.835Z"
        }
      }
    ]
  },
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 1
  }
}
```

#### Notes

- **Phase 001B Placeholder:** Returns static mock data (5 entries)
- Future: Will query historical snapshots from `InfluenceSnapshot` collection
- `pageSize` max clamped to 50 (lower than endorsements for performance)
- Empty `companyId` treated as no filter (returns all snapshots)

---

## Data Types

### Common Types

```typescript
// State code (two-letter abbreviation)
type StateCode = string;  // "CA", "TX", "NY", etc.

// MongoDB ObjectId as string
type ObjectIdString = string;

// Game week index (0-indexed, 1 week = 1 real hour)
type GameWeekIndex = number;

// Political office types
type PoliticalOfficeKind = "president" | "senator" | "house" | "governor";

// Senate classes (staggered 6-year terms)
type SenateClass = 1 | 2 | 3;

// Endorsement tiers
type EndorsementTier = "bronze" | "silver" | "gold" | "platinum";

// Company levels
type CompanyLevel = 1 | 2 | 3 | 4 | 5;
```

### Response Envelope

```typescript
// Success envelope
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, any>;
}

// Error envelope
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR';
    statusCode: number;
    details?: any[];
  };
}
```

---

## Rate Limiting

**Current:** No rate limiting (read-only endpoints)  
**Future:** Planned rate limits for write operations:
- 100 requests/minute per IP
- 1000 requests/hour per authenticated user
- Burst allowance: 20 requests/second

---

## Examples

### TypeScript Client Usage

```typescript
// Fetch all state metrics
const statesResponse = await fetch('/api/politics/states');
const { data: { states } } = await statesResponse.json();

// Get single state
const caResponse = await fetch('/api/politics/states?stateCode=CA');
const { data: { state } } = await caResponse.json();

// Check leaderboard
const leaderboardResponse = await fetch('/api/politics/leaderboard');
const { data: { leaderboard } } = await leaderboardResponse.json();

// Calculate next presidential election
const electionResponse = await fetch(
  '/api/politics/elections/next?kind=president&fromWeek=100'
);
const { data: { result: { nextWeek } } } = await electionResponse.json();

// Get paginated endorsements
const endorsementsResponse = await fetch(
  '/api/politics/endorsements?page=2&pageSize=10'
);
const { data: { endorsements, total } } = await endorsementsResponse.json();

// Get company snapshots
const snapshotsResponse = await fetch(
  '/api/politics/snapshots?companyId=comp:001&page=1&pageSize=20'
);
const { data: { snapshots } } = await snapshotsResponse.json();
```

### Error Handling

```typescript
async function fetchStates(stateCode?: string) {
  const url = stateCode 
    ? `/api/politics/states?stateCode=${stateCode}`
    : '/api/politics/states';
  
  const response = await fetch(url);
  const json = await response.json();
  
  if (!json.success) {
    console.error('API Error:', json.error.message);
    if (json.error.code === 'VALIDATION_ERROR') {
      console.error('Validation issues:', json.error.details);
    }
    throw new Error(json.error.message);
  }
  
  return json.data;
}
```

---

## Appendices

### A. Time Model Reference

**Conversion Table:**

| Real Time | Game Time | Weeks |
|-----------|-----------|-------|
| 1 hour | 1 week | 1 |
| 1 day (24h) | 24 weeks | 24 |
| 1 week (168h) | 168 weeks | 168 |
| 52 hours | 1 game year | 52 |
| 104 hours | 2 game years | 104 |
| 208 hours | 4 game years | 208 |

**Election Cycles:**

| Office | Term | Real Time | Game Weeks |
|--------|------|-----------|------------|
| House | 2 years | ~4.3 days | 104 |
| President | 4 years | ~8.7 days | 208 |
| Senator | 6 years | ~13 days | 312 |
| Governor (2yr) | 2 years | ~4.3 days | 104 |
| Governor (4yr) | 4 years | ~8.7 days | 208 |

### B. Level Minimums (Offline Protection)

| Level | Minimum Influence |
|-------|-------------------|
| 1 | 0 |
| 2 | 10 |
| 3 | 25 |
| 4 | 50 |
| 5 | 100 |
| 6+ | 200 |

**Retention Factor:** 90% (0.9)  
**Formula:** `max(calculated, previous * 0.9, levelMinimum[level])`

### C. State Metrics Calculation

**Composite Influence Weight:**
```typescript
compositeInfluence = 
  0.3 * normalizedGDP +
  0.25 * normalizedPopulation +
  0.25 * normalizedSeats +
  0.2 * normalizedCrime
```

**Normalization:**
- All metrics normalized to 0-1 range via min-max scaling
- Sum of all state weights ≈ 1.0 (with rounding)
- Sorted descending by composite weight

---

## Changelog

### v1.0.0 (2025-11-25)

**Initial Release:**
- ✅ GET /states - State influence metrics
- ✅ GET /leaderboard - Company political influence rankings
- ✅ GET /elections/next - Election date calculations
- ✅ GET /endorsements - Political endorsement stubs (placeholder)
- ✅ GET /snapshots - Offline protection snapshots (placeholder)

**Features:**
- Standardized response envelopes (success/error)
- Zod validation for all query parameters
- Comprehensive error messages with validation details
- Pagination support (endorsements, snapshots)
- Performance optimization (<100ms for calculation endpoints)

**Known Issues:**
- Leaderboard requires MongoDB connection
- Endorsements/Snapshots return mock data (persistence pending)
- No write operations yet (Phase 002)

---

## Support

**Documentation Issues:** Report schema mismatches or unclear descriptions  
**API Bugs:** Report unexpected responses or validation errors  
**Feature Requests:** Suggest additional endpoints or query parameters

**Related Documentation:**
- `/docs/TIME_SYSTEM.md` - Detailed time acceleration model
- `/docs/POLITICS_SCALING.md` - Influence calculation formulas
- `/dev/QUICK_START.md` - Development session guide

---

**Generated by:** ECHO v1.3.0 with GUARDIAN Protocol  
**Documentation Standard:** AAA Quality with Complete Examples  
**Contract Status:** ✅ Validated against actual endpoint implementations
