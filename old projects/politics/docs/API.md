# 📚 API Documentation

**Project:** Business & Politics Simulation MMO  
**Created:** 2025-11-13  
**Version:** 0.1.0

---

## 🎯 Overview

This document describes the RESTful API endpoints and Socket.io events for the Business & Politics Simulation MMO.

**Base URL:** `http://localhost:3000/api`  
**Socket.io URL:** `http://localhost:3001`

---

## 🔐 Authentication

All authenticated endpoints require a valid session cookie from NextAuth.js.

### Authentication Flow
1. User registers via `/api/auth/register`
2. User logs in via NextAuth.js `/api/auth/signin`
3. Session cookie is set automatically
4. Protected routes check session via middleware

---

## 📍 API Endpoints

### Authentication Routes

#### POST /api/auth/register
Register a new player account.

**Request Body:**
```json
{
  "email": "string (email format)",
  "password": "string (min 8 characters)",
  "firstName": "string (2-50 characters)",
  "lastName": "string (2-50 characters)",
  "state": "string (US state name)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "firstName": "John",
    "lastName": "Smith",
    "state": "California",
    "localGovernment": {
      "county": "Los Angeles County",
      "city": "Los Angeles"
    }
  }
}
```

**Errors:**
- `400` - Invalid input (email already exists, weak password)
- `500` - Server error

---

### Company Routes

#### GET /api/companies
Get all companies owned by the authenticated user.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "companies": [
    {
      "id": "string",
      "name": "string",
      "industry": "construction|real-estate|crypto|stocks|retail|manufacturing|banking",
      "cashBalance": "number",
      "employees": "number",
      "createdAt": "ISO 8601 date"
    }
  ]
}
```

---

#### GET /api/companies/:id/level-info
Get company level information, upgrade eligibility, and political influence.

**Authentication:** Required (must own the company)

**Response (200 OK):**
```json
{
  "currentLevel": 3,
  "levelName": "Media Company",
  "experience": 4200,
  "experienceToNextLevel": 800,
  "totalRevenueGenerated": 1250000,
  "employees": 42,
  "cash": 275000,
  "leveledUpAt": "2025-11-15T18:22:31.000Z",
  "politicalInfluence": {
    "canDonateToCampaigns": true,
    "maxDonationAmount": 50000,
    "canLobby": true,
    "lobbyingPowerPoints": 10,
    "canInfluenceTradePolicy": false,
    "canInfluenceTaxPolicy": false,
    "governmentContractAccess": true,
    "canRunForOffice": true
  },
  "currentLevelConfig": {
    "levelName": "Media Company",
    "features": ["Professional production", "Multi-platform distribution"],
    "marketReach": "State",
    "maxEmployees": 200,
    "maxLocations": 4,
    "estimatedMonthlyRevenue": 180000,
    "profitMargin": 32
  },
  "nextLevelConfig": {
    "level": 4,
    "levelName": "National Media Network",
    "features": ["National reach", "Enterprise ops"],
    "marketReach": "National",
    "maxEmployees": 1000,
    "maxLocations": 12,
    "estimatedMonthlyRevenue": 1200000,
    "profitMargin": 28
  },
  "nextLevelPoliticalInfluence": {
    "canDonateToCampaigns": true,
    "maxDonationAmount": 500000,
    "canLobby": true,
    "lobbyingPowerPoints": 50,
    "canInfluenceTradePolicy": true,
    "canInfluenceTaxPolicy": true,
    "governmentContractAccess": true,
    "canRunForOffice": true
  },
  "upgrade": {
    "canUpgrade": false,
    "blockers": [
      "Need 800 more XP (4200/5000)",
      "Need $725,000 more cash for upgrade ($275,000/$1,000,000)"
    ],
    "requirements": {
      "xp": { "required": 5000, "current": 4200, "met": false },
      "employees": { "required": 50, "current": 42, "met": false },
      "revenue": { "required": 1200000, "current": 1250000, "met": true },
      "cash": { "required": 1000000, "current": 275000, "met": false }
    },
    "upgradeCost": 1000000,
    "nextLevel": 4
  }
}
```

**Errors:**
- `401` - Authentication required
- `403` - Unauthorized (not the owner)
- `404` - Company not found

---

#### POST /api/companies
Create a new company.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "string (3-50 characters)",
  "industry": "construction|real-estate|crypto|stocks|retail|manufacturing|banking",
  "archetype": "innovator|tycoon|ethical"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "company": {
    "id": "string",
    "name": "string",
    "industry": "string",
    "cashBalance": 10000,
    "employees": 0,
    "createdAt": "ISO 8601 date"
  }
}
```

**Errors:**
- `400` - Invalid input
- `401` - Unauthorized
- `409` - Company name already exists
- `500` - Server error

---

#### GET /api/companies/:id
Get details of a specific company.

**Authentication:** Required (must own the company)

**Response (200 OK):**
```json
{
  "company": {
    "id": "string",
    "name": "string",
    "industry": "string",
    "cashBalance": "number",
    "employees": [
      {
        "id": "string",
        "name": "string",
        "role": "string",
        "salary": "number",
        "skill": "number (1-100)"
      }
    ],
    "financials": {
      "revenue": "number",
      "expenses": "number",
      "profit": "number"
    },
    "createdAt": "ISO 8601 date"
  }
}
```

---

### Politics Routes

#### GET /api/politics/eligibility
Return level-derived political capabilities for a company.

**Authentication:** Required (must own the company)

**Query Parameters:**
- `companyId`: string (MongoDB ObjectId)

**Response (200 OK):**
```json
{
  "companyId": "665f1a...",
  "level": 3,
  "politicalInfluence": {
    "canDonateToCampaigns": true,
    "maxDonationAmount": 50000,
    "canLobby": true,
    "lobbyingPowerPoints": 10,
    "canInfluenceTradePolicy": false,
    "canInfluenceTaxPolicy": false,
    "governmentContractAccess": true,
    "canRunForOffice": true
  },
  "allowedActions": [
    "Donate up to $50,000",
    "Engage in lobbying",
    "Run for public office"
  ]
}
```

**Errors:**
- `400` - Missing/invalid `companyId`
- `401` - Authentication required
- `403` - Unauthorized (not the owner)
- `404` - Company not found

---

### Employee Routes

#### POST /api/companies/:companyId/employees
Hire a new employee.

**Authentication:** Required (must own the company)

**Request Body:**
```json
{
  "role": "string",
  "salary": "number (min 30000)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "employee": {
    "id": "string",
    "name": "string (generated NPC name)",
    "role": "string",
    "salary": "number",
    "skill": "number (random 40-90)",
    "loyalty": "number (random 50-80)"
  }
}
```

---

#### DELETE /api/companies/:companyId/employees/:employeeId
Fire an employee.

**Authentication:** Required (must own the company)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Employee terminated"
}
```

---

### Elections Routes

#### GET /api/elections
Get current and past elections (local, state, and federal levels).

**Authentication:** Required

**Query Parameters:**
- `level`: "local" | "state" | "federal" (optional, defaults to user's level)
- `state`: US state name (required for state-level elections)

**Response (200 OK):**
```json
{
  "current": {
    "id": "string",
    "level": "local|state|federal",
    "state": "California",
    "office": "mayor|city-council|county-supervisor|state-assembly|state-senate|governor|us-house|us-senate|president",
    "district": "string (if applicable)",
    "status": "campaigning|voting|complete",
    "startDate": "ISO 8601 date",
    "endDate": "ISO 8601 date",
    "candidates": [
      {
        "playerId": "string",
        "firstName": "string",
        "lastName": "string",
        "votes": "number",
        "campaignSpending": "number",
        "party": "string"
      }
    ]
  },
  "past": []
}
```

---

#### POST /api/elections/:electionId/vote
Cast a vote in an election.

**Authentication:** Required

**Request Body:**
```json
{
  "candidateId": "string (playerId)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Vote recorded"
}
```

**Errors:**
- `400` - Already voted in this election
- `404` - Election not found or not active
- `500` - Server error

---

### Policies Routes

#### GET /api/policies
Get active policies (local, state, or federal level).

**Authentication:** Required

**Query Parameters:**
- `level`: "local" | "state" | "federal" (optional, defaults to all)
- `state`: US state name (required for state-level policies)

**Response (200 OK):**
```json
{
  "policies": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "level": "local|state|federal",
      "state": "California",
      "jurisdiction": "Los Angeles" (if local),
      "category": "tax|regulation|subsidy|tariff|zoning|labor|environmental",
      "effect": {
        "taxRate": "number",
        "industryBoost": "string",
        "scope": "local|state|federal"
      },
      "proposedBy": "string (playerId)",
      "proposerFirstName": "string",
      "proposerLastName": "string",
      "status": "active|pending|rejected",
      "votes": {
        "yes": "number",
        "no": "number",
        "abstain": "number"
      },
      "createdAt": "ISO 8601 date"
    }
  ]
}
```

---

### Market Routes

#### GET /api/market/:marketType
Get current market data.

**Authentication:** Required

**Parameters:**
- `marketType`: stocks | crypto | real-estate

**Response (200 OK):**
```json
{
  "market": {
    "type": "string",
    "assets": [
      {
        "id": "string",
        "name": "string",
        "currentPrice": "number",
        "priceChange24h": "number",
        "volume": "number"
      }
    ],
    "timestamp": "ISO 8601 date"
  }
}
```

---

## 🔌 Socket.io Events

### Chat Namespace (`/chat`)

#### Client Events

**join-room**
```javascript
socket.emit('join-room', roomId: string);
```

**send-message**
```javascript
socket.emit('send-message', {
  roomId: string,
  message: string,
  playerId: string
});
```

#### Server Events

**receive-message**
```javascript
socket.on('receive-message', (data: {
  message: string,
  playerId: string,
  timestamp: string
}) => {
  // Handle incoming message
});
```

**user-joined**
```javascript
socket.on('user-joined', (data: { socketId: string }) => {
  // Handle user joining room
});
```

---

### Elections Namespace (`/elections`)

#### Client Events

**cast-vote**
```javascript
socket.emit('cast-vote', {
  electionId: string,
  candidateId: string,
  playerId: string
});
```

#### Server Events

**vote-cast**
```javascript
socket.on('vote-cast', (data: {
  electionId: string,
  candidateId: string,
  timestamp: string
}) => {
  // Handle vote notification
});
```

---

### Market Namespace (`/market`)

#### Client Events

**subscribe-market**
```javascript
socket.emit('subscribe-market', {
  marketType: 'stocks' | 'crypto' | 'real-estate'
});
```

**unsubscribe-market**
```javascript
socket.emit('unsubscribe-market', {
  marketType: string
});
```

#### Server Events

**market-update**
```javascript
socket.on('market-update', (data: {
  marketType: string,
  assetId: string,
  newPrice: number,
  timestamp: string
}) => {
  // Handle price update
});
```

---

## 📊 Rate Limiting

- **API Routes:** 100 requests per minute per IP
- **Socket.io Events:** 50 events per second per connection

---

## 🔒 Security

- All API routes validate input with Zod schemas
- MongoDB injection prevention via Mongoose
- CORS configured for allowed origins only
- Socket.io requires valid session for protected namespaces

---

*Auto-maintained by ECHO v1.0.0*  
*Last updated: 2025-11-13*  
*This is a living document - update as API evolves*
