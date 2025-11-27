# 📦 E-Commerce Game System API Documentation

**Version:** 1.0.0  
**Base URL:** `/api/ecommerce`  
**Created:** 2025-11-14  
**ECHO Phase:** E-Commerce Phase 5 - Testing & Documentation  
**Context:** In-game marketplace and economy API for political strategy game

---

## 📑 Table of Contents

1. [Authentication](#authentication)
2. [Products API](#products-api)
3. [Orders API](#orders-api)
4. [Reviews API](#reviews-api)
5. [Campaigns API](#campaigns-api)
6. [Analytics API](#analytics-api)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## 🔐 Authentication

All E-Commerce API endpoints require company-level authentication. Include `companyId` in query parameters or request body.

**Development Mode:** Authentication checks are stubbed with TODO markers for production implementation.

**Production Requirements:**
- NextAuth.js session management
- Company ownership validation
- Role-based access control (RBAC) for administrative endpoints

---

## 🛍️ Products API

### Base Endpoint: `/api/ecommerce/products`

---

### **GET** `/api/ecommerce/products`

Retrieve products with advanced filtering, search, and pagination.

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `companyId` | String | ✅ Yes | Company identifier | `company-123` |
| `search` | String | No | Search products by name/description | `wireless headphones` |
| `category` | String | No | Filter by product category | `Electronics` |
| `minPrice` | Number | No | Minimum price filter (0-10000) | `50` |
| `maxPrice` | Number | No | Maximum price filter (0-10000) | `500` |
| `minRating` | Number | No | Minimum average rating (1-5) | `4` |
| `inStock` | Boolean | No | Show only in-stock products | `true` |
| `active` | Boolean | No | Show only active products | `true` |
| `featured` | Boolean | No | Show only featured products | `true` |
| `sortBy` | String | No | Sort field (createdAt/price/rating/name) | `price` |
| `sortOrder` | String | No | Sort direction (asc/desc) | `desc` |
| `page` | Number | No | Page number (default: 1) | `2` |
| `limit` | Number | No | Results per page (default: 50, max: 100) | `25` |

**Response:**

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "prod-001",
        "companyId": "company-123",
        "name": "Wireless Headphones",
        "sku": "WH-001",
        "description": "Premium noise-cancelling headphones",
        "category": "Electronics",
        "price": 299.99,
        "salePrice": 249.99,
        "costPrice": 150.00,
        "profitMargin": 40.0,
        "quantityAvailable": 50,
        "reorderPoint": 10,
        "supplier": "supplier-456",
        "images": ["https://cdn.example.com/product1.jpg"],
        "averageRating": 4.5,
        "reviewCount": 128,
        "isActive": true,
        "isFeatured": true,
        "createdAt": "2025-11-01T10:30:00.000Z",
        "updatedAt": "2025-11-10T15:45:00.000Z"
      }
    ],
    "total": 125,
    "page": 1,
    "limit": 50,
    "hasMore": true
  }
}
```

---

### **POST** `/api/ecommerce/products`

Create a new product listing.

**Request Body:**

```json
{
  "companyId": "company-123",
  "name": "New Product",
  "sku": "NP-001",
  "description": "Product description",
  "category": "Electronics",
  "price": 199.99,
  "costPrice": 100.00,
  "quantityAvailable": 100,
  "reorderPoint": 20,
  "supplier": "supplier-789",
  "images": ["https://cdn.example.com/new-product.jpg"],
  "isActive": true,
  "isFeatured": false
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "_id": "prod-new-001",
    "companyId": "company-123",
    "name": "New Product",
    "sku": "NP-001",
    "profitMargin": 49.975,
    "createdAt": "2025-11-14T12:00:00.000Z"
    // ... full product object
  }
}
```

---

### **PUT** `/api/ecommerce/products/:id`

Update an existing product.

**URL Parameters:**
- `id` - Product MongoDB ObjectId

**Request Body:** (partial updates allowed)

```json
{
  "price": 179.99,
  "quantityAvailable": 150,
  "salePrice": 159.99
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "prod-001",
    "price": 179.99,
    "quantityAvailable": 150,
    "profitMargin": 44.456,
    "updatedAt": "2025-11-14T12:30:00.000Z"
    // ... full updated product
  }
}
```

---

### **DELETE** `/api/ecommerce/products/:id`

Soft delete product (sets `isActive` to false).

**URL Parameters:**
- `id` - Product MongoDB ObjectId

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Product deactivated successfully"
}
```

---

## 📦 Orders API

### Base Endpoint: `/api/ecommerce/orders`

---

### **GET** `/api/ecommerce/orders`

Retrieve orders with filtering and pagination.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `companyId` | String | ✅ Yes | Company identifier |
| `customerId` | String | No | Filter by customer |
| `status` | String | No | Order status (Pending/Processing/Shipped/Delivered/Cancelled) |
| `page` | Number | No | Page number |
| `limit` | Number | No | Results per page |

**Response:**

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "order-001",
        "orderNumber": "ORD-20251114-001",
        "companyId": "company-123",
        "customerId": "customer-456",
        "customerEmail": "customer@example.com",
        "items": [
          {
            "productId": "prod-001",
            "productName": "Wireless Headphones",
            "quantity": 2,
            "unitPrice": 249.99,
            "totalPrice": 499.98
          }
        ],
        "subtotal": 499.98,
        "tax": 42.50,
        "shippingCost": 0.00,
        "totalAmount": 542.48,
        "status": "Processing",
        "paymentMethod": "Credit Card",
        "shippingAddress": {
          "street": "123 Main St",
          "city": "New York",
          "state": "NY",
          "zipCode": "10001",
          "country": "USA"
        },
        "trackingNumber": "TRACK-12345",
        "createdAt": "2025-11-14T10:00:00.000Z"
      }
    ],
    "total": 47,
    "page": 1,
    "limit": 50
  }
}
```

---

### **POST** `/api/ecommerce/orders`

Create a new order with optional auto-fulfillment.

**Request Body:**

```json
{
  "companyId": "company-123",
  "customerId": "customer-456",
  "customerEmail": "customer@example.com",
  "items": [
    {
      "productId": "prod-001",
      "productName": "Wireless Headphones",
      "quantity": 2,
      "unitPrice": 249.99,
      "totalPrice": 499.98
    }
  ],
  "subtotal": 499.98,
  "tax": 42.50,
  "shippingCost": 0.00,
  "totalAmount": 542.48,
  "paymentMethod": "Credit Card",
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "autoFulfill": true
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "_id": "order-new-001",
    "orderNumber": "ORD-20251114-047",
    "status": "Processing",
    "trackingNumber": "TRACK-20251114-047",
    "estimatedDelivery": "2025-11-21T10:00:00.000Z",
    "createdAt": "2025-11-14T12:00:00.000Z"
    // ... full order object
  }
}
```

**Auto-Fulfillment Logic:**
- Free shipping for orders > $100
- Automatic status progression: Pending → Processing → Shipped → Delivered
- Tracking number generation
- Estimated delivery calculation (3-7 days)

---

### **PUT** `/api/ecommerce/orders/:id`

Update order status, shipping address, or tracking information.

**Request Body:**

```json
{
  "status": "Shipped",
  "trackingNumber": "TRACK-67890"
}
```

**Response:** `200 OK`

---

### **DELETE** `/api/ecommerce/orders/:id`

Cancel order (sets status to "Cancelled").

**Restrictions:**
- Cannot cancel orders with status "Shipped" or "Delivered"

**Response:** `200 OK`

---

## ⭐ Reviews API

### Base Endpoint: `/api/ecommerce/reviews`

---

### **GET** `/api/ecommerce/reviews`

Retrieve product reviews with filtering.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `companyId` | String | ✅ Yes | Company identifier |
| `productId` | String | ✅ Yes | Product identifier |
| `rating` | Number | No | Filter by rating (1-5) |
| `verifiedOnly` | Boolean | No | Show only verified purchases |
| `status` | String | No | Moderation status (Pending/Approved/Rejected) |
| `page` | Number | No | Page number |
| `limit` | Number | No | Results per page (default: 10) |

**Response:**

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "review-001",
        "productId": "prod-001",
        "customerId": "customer-456",
        "reviewerName": "John Doe",
        "rating": 5,
        "title": "Excellent product!",
        "comment": "Best headphones I've ever owned.",
        "isVerifiedPurchase": true,
        "moderationStatus": "Approved",
        "helpfulCount": 24,
        "notHelpfulCount": 2,
        "reportCount": 0,
        "createdAt": "2025-11-10T14:30:00.000Z"
      }
    ],
    "total": 128,
    "averageRating": 4.5,
    "page": 1,
    "limit": 10
  }
}
```

---

### **POST** `/api/ecommerce/reviews`

Submit a new product review.

**Request Body:**

```json
{
  "companyId": "company-123",
  "productId": "prod-001",
  "customerId": "customer-456",
  "reviewerName": "Jane Smith",
  "rating": 4,
  "title": "Great value",
  "comment": "Good quality for the price.",
  "isVerifiedPurchase": true
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "_id": "review-new-001",
    "moderationStatus": "Pending",
    "createdAt": "2025-11-14T12:00:00.000Z"
    // ... full review object
  }
}
```

---

### **PUT** `/api/ecommerce/reviews/:id`

Moderate review, vote helpful/not helpful, or report abuse.

**Moderation (Admin Only):**

```json
{
  "action": "moderate",
  "moderationStatus": "Approved"
}
```

**Voting:**

```json
{
  "action": "vote",
  "voteType": "helpful"
}
```

**Reporting:**

```json
{
  "action": "report"
}
```

**Auto-Unpublish:** Reviews with 5+ reports automatically return to "Pending" status.

**Response:** `200 OK`

---

### **DELETE** `/api/ecommerce/reviews/:id`

Permanently delete a review.

**Response:** `200 OK`

---

## 📊 Campaigns API

### Base Endpoint: `/api/ecommerce/campaigns`

---

### **GET** `/api/ecommerce/campaigns`

Retrieve SEO/PPC campaigns.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `companyId` | String | ✅ Yes | Company identifier |
| `type` | String | No | Campaign type (SEO/PPC) |
| `status` | String | No | Campaign status (Active/Paused/Completed/Cancelled) |

**Response:**

```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "_id": "campaign-001",
        "name": "Black Friday SEO Campaign",
        "type": "SEO",
        "status": "Active",
        "budget": 10000,
        "spent": 6500,
        "targetKeywords": ["black friday", "deals", "discounts"],
        "impressions": 250000,
        "clicks": 6250,
        "conversions": 312,
        "revenue": 37440,
        "roi": 476.0,
        "ctr": 2.5,
        "conversionRate": 4.99,
        "createdAt": "2025-11-01T00:00:00.000Z"
      }
    ],
    "total": 8
  }
}
```

---

### **GET** `/api/ecommerce/campaigns/:id/analytics`

Get detailed analytics for a specific campaign.

**Response:**

```json
{
  "success": true,
  "data": {
    "roi": 476.0,
    "ctr": 2.5,
    "conversionRate": 4.99,
    "costPerClick": 1.04,
    "costPerAcquisition": 20.83,
    "budgetUtilization": 65.0,
    "keywordPerformance": [
      {
        "keyword": "black friday",
        "impressions": 100000,
        "clicks": 2500,
        "conversions": 150,
        "ctr": 2.5
      }
    ]
  }
}
```

---

### **POST** `/api/ecommerce/campaigns`

Create a new marketing campaign.

**Request Body:**

```json
{
  "companyId": "company-123",
  "name": "Holiday PPC Campaign",
  "type": "PPC",
  "status": "Active",
  "budget": 5000,
  "targetKeywords": ["holiday gifts", "christmas deals"]
}
```

**Response:** `201 Created`

---

### **PUT** `/api/ecommerce/campaigns/:id`

Update campaign metrics or status.

**Request Body:**

```json
{
  "impressions": 300000,
  "clicks": 7500,
  "conversions": 375,
  "revenue": 45000,
  "spent": 7000
}
```

**Response:** `200 OK`

---

### **DELETE** `/api/ecommerce/campaigns/:id`

Cancel campaign (sets status to "Cancelled").

**Response:** `200 OK`

---

## 📈 Analytics API

### Base Endpoint: `/api/ecommerce/analytics`

---

### **GET** `/api/ecommerce/analytics?type=customer-ltv`

Customer Lifetime Value analysis with RFM segmentation.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `companyId` | String | ✅ Yes | Company identifier |
| `type` | String | ✅ Yes | Analytics type (`customer-ltv`) |
| `period` | String | No | Time period (last_7_days/last_30_days/last_90_days/all_time) |

**Response:**

```json
{
  "success": true,
  "data": {
    "topCustomers": [
      {
        "customerId": "customer-001",
        "name": "John Doe",
        "totalSpent": 5420.00,
        "orderCount": 18,
        "averageOrderValue": 301.11,
        "predictedLTV": 12500.00,
        "segment": "Champions"
      }
    ],
    "segmentation": [
      {
        "segment": "Champions",
        "count": 45,
        "value": 243000.00
      },
      {
        "segment": "Loyal Customers",
        "count": 120,
        "value": 420000.00
      },
      {
        "segment": "At Risk",
        "count": 30,
        "value": 75000.00
      }
    ]
  }
}
```

---

### **GET** `/api/ecommerce/analytics?type=product-performance`

Product performance metrics and inventory turnover.

**Response:**

```json
{
  "success": true,
  "data": {
    "topProducts": [
      {
        "productId": "prod-001",
        "name": "Wireless Headphones",
        "revenue": 62497.50,
        "unitsSold": 250,
        "turnoverRate": 8.5
      }
    ],
    "salesByCategory": [
      {
        "name": "Electronics",
        "revenue": 524000.00,
        "units": 1842
      }
    ]
  }
}
```

---

### **GET** `/api/ecommerce/analytics?type=revenue-forecast`

30-day revenue forecast with exponential smoothing.

**Response:**

```json
{
  "success": true,
  "data": {
    "forecast": [
      {
        "date": "2025-11-15",
        "actual": 15420.00,
        "predicted": 15800.00
      },
      {
        "date": "2025-11-16",
        "actual": 0,
        "predicted": 16100.00
      }
      // ... 30 days
    ],
    "growthRate": 12.5,
    "confidenceLevel": "High"
  }
}
```

---

### **GET** `/api/ecommerce/analytics?type=sales-report`

Comprehensive sales metrics summary.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalRevenue": 542487.50,
    "totalOrders": 1842,
    "averageOrderValue": 294.56,
    "activeCustomers": 456
  }
}
```

---

## ⚠️ Error Handling

All endpoints return consistent error responses:

**Error Response Format:**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PRODUCT_ID",
    "message": "Product ID must be a valid MongoDB ObjectId",
    "statusCode": 400
  }
}
```

**Common Error Codes:**

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request parameters |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `DUPLICATE_SKU` | SKU already exists |
| 500 | `INTERNAL_ERROR` | Server error |

---

## 🚦 Rate Limiting

**Development:** No rate limiting implemented  
**Production Recommendations:**
- 100 requests/minute per API key
- 1000 requests/hour per company
- Burst allowance: 20 requests/second

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1699999999
```

---

## 📚 Additional Resources

- [E-Commerce Testing Guide](./ECOMMERCE_TESTING.md)
- [Deployment Guide](./ECOMMERCE_DEPLOYMENT.md)
- [Database Schemas](../src/models/ecommerce/)
- [Business Logic Services](../src/services/ecommerce/)

---

**Auto-generated by ECHO v1.0.0**  
**Last updated:** 2025-11-14
