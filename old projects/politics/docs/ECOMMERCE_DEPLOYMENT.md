# 🚀 E-Commerce Game System Deployment Guide

**Version:** 1.0.0  
**Created:** 2025-11-14  
**ECHO Phase:** E-Commerce Phase 5 - Testing & Documentation  
**Context:** In-game economy system for political strategy game

---

## 📑 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [MongoDB Setup](#mongodb-setup)
4. [NextAuth Configuration](#nextauth-configuration)
5. [Local Development](#local-development)
6. [Production Deployment](#production-deployment)
7. [Security Checklist](#security-checklist)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software

| Software | Minimum Version | Purpose |
|----------|----------------|---------|
| **Node.js** | v18.0.0+ | Runtime environment |
| **npm** | v9.0.0+ | Package manager |
| **MongoDB** | v6.0.0+ | Database |
| **Git** | v2.30.0+ | Version control |

### Optional Tools

- **MongoDB Compass** - GUI for database management
- **Postman** - API testing
- **Docker** - Containerized deployment
- **PM2** - Production process manager

---

## ⚙️ Environment Configuration

### 1. Create Environment File

Create `.env.local` (development) and `.env.production` (production):

```bash
# .env.local (Development)

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/politics-dev
MONGODB_TEST_URI=mongodb://localhost:27017/politics-test

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-development-secret-key-min-32-chars

# Authentication Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email Service (Production only)
# SENDGRID_API_KEY=your-sendgrid-api-key
# EMAIL_FROM=noreply@yourdomain.com

# Game Configuration
# GAME_CURRENCY_NAME=PoliticalCredits
# STARTING_PLAYER_BALANCE=10000
# ENABLE_NPC_TRADERS=true

# Application Settings
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Feature Flags
ENABLE_AUTO_FULFILLMENT=true
ENABLE_REVIEW_MODERATION=true
ENABLE_ANALYTICS=true

# Rate Limiting (Production)
# RATE_LIMIT_WINDOW=60000
# RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Production Environment Variables

```bash
# .env.production

# MongoDB Connection (Atlas Recommended)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/politics-prod?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate-a-secure-random-32-char-string-here

# Authentication Providers
GOOGLE_CLIENT_ID=your-prod-google-client-id
GOOGLE_CLIENT_SECRET=your-prod-google-client-secret
GITHUB_CLIENT_ID=your-prod-github-client-id
GITHUB_CLIENT_SECRET=your-prod-github-client-secret

# Email Service
SENDGRID_API_KEY=SG.your-production-sendgrid-key
EMAIL_FROM=noreply@yourdomain.com

# Game Economy Configuration
GAME_CURRENCY_NAME=PoliticalCredits
STARTING_PLAYER_BALANCE=10000
ENABLE_NPC_TRADERS=true
MARKET_VOLATILITY_ENABLED=true

# Application Settings
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Feature Flags
ENABLE_AUTO_FULFILLMENT=true
ENABLE_REVIEW_MODERATION=true
ENABLE_ANALYTICS=true

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEW_RELIC_LICENSE_KEY=your-new-relic-license-key
```

### 3. Generate Secrets

```bash
# Generate NEXTAUTH_SECRET (32+ characters)
openssl rand -base64 32

# Generate API keys for testing
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🗄️ MongoDB Setup

### Local MongoDB Installation

**macOS (Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0
```

**Windows (MSI Installer):**
1. Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run installer with default settings
3. Start MongoDB service:
   ```powershell
   net start MongoDB
   ```

**Ubuntu:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### MongoDB Atlas (Cloud Production)

1. **Create Account**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Create Cluster**:
   - Cluster Tier: M10+ (production), M0 Free (development)
   - Region: Choose closest to your users
   - MongoDB Version: 6.0+

3. **Configure Network Access**:
   - Development: Allow your IP
   - Production: Restrict to server IPs or use VPC peering

4. **Create Database User**:
   ```
   Username: politics-app
   Password: [Generate strong password]
   Roles: readWrite on politics database
   ```

5. **Get Connection String**:
   ```
   mongodb+srv://politics-app:password@cluster.mongodb.net/politics-prod?retryWrites=true&w=majority
   ```

### Database Initialization

Run database setup scripts:

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed initial data (development only)
npm run db:seed
```

### Create Indexes

```javascript
// scripts/create-indexes.js
const { MongoClient } = require('mongodb');

async function createIndexes() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db();

  // ProductListing indexes
  await db.collection('productlistings').createIndexes([
    { key: { companyId: 1, isActive: 1 } },
    { key: { sku: 1 }, unique: true },
    { key: { category: 1 } },
    { key: { price: 1 } },
    { key: { averageRating: -1 } },
    { key: { name: 'text', description: 'text' } }
  ]);

  // Order indexes
  await db.collection('orders').createIndexes([
    { key: { companyId: 1, status: 1 } },
    { key: { customerId: 1 } },
    { key: { orderNumber: 1 }, unique: true },
    { key: { createdAt: -1 } }
  ]);

  // CustomerReview indexes
  await db.collection('customerreviews').createIndexes([
    { key: { companyId: 1, productId: 1 } },
    { key: { rating: 1 } },
    { key: { moderationStatus: 1 } },
    { key: { createdAt: -1 } }
  ]);

  // SEOCampaign indexes
  await db.collection('seocampaigns').createIndexes([
    { key: { companyId: 1, type: 1, status: 1 } },
    { key: { createdAt: -1 } }
  ]);

  console.log('✅ All indexes created successfully');
  await client.close();
}

createIndexes().catch(console.error);
```

Run the script:
```bash
node scripts/create-indexes.js
```

---

## 🔐 NextAuth Configuration

### 1. Install Dependencies

```bash
npm install next-auth
```

### 2. Configure Providers

Create `pages/api/auth/[...nextauth].ts`:

```typescript
import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Implement your authentication logic
        // Return user object or null
        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.companyId = user.companyId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.companyId = token.companyId;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
```

### 3. Protect API Routes

```typescript
// src/middleware/auth.ts
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export async function requireAuth(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return Response.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return session;
}
```

---

## 💻 Local Development

### 1. Install Dependencies

```bash
# Clone repository
git clone https://github.com/yourusername/politics.git
cd politics

# Install packages
npm install
```

### 2. Setup Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

### 3. Start Development Server

```bash
# Start MongoDB (if local)
brew services start mongodb-community@6.0  # macOS
# OR
sudo systemctl start mongod  # Linux

# Run development server
npm run dev
```

### 4. Access Application

- **Application**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs
- **MongoDB Compass**: mongodb://localhost:27017

### 5. Run Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

---

## 🌐 Production Deployment

### Option 1: Vercel (Recommended)

**Prerequisites:**
- MongoDB Atlas cluster
- Vercel account

**Steps:**

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Configure Project**:
   ```bash
   vercel
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add MONGODB_URI production
   vercel env add NEXTAUTH_SECRET production
   vercel env add NEXTAUTH_URL production
   # ... add all production environment variables
   ```

5. **Deploy**:
   ```bash
   vercel --prod
   ```

6. **Configure Custom Domain** (Vercel Dashboard):
   - Add your domain
   - Configure DNS settings
   - Enable SSL certificate

---

### Option 2: AWS EC2

**Prerequisites:**
- AWS account
- EC2 instance (t3.medium minimum)
- Security group with ports 22, 80, 443 open

**Steps:**

1. **Connect to EC2**:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install PM2**:
   ```bash
   sudo npm install -g pm2
   ```

4. **Clone Repository**:
   ```bash
   git clone https://github.com/yourusername/politics.git
   cd politics
   npm install
   ```

5. **Setup Environment**:
   ```bash
   nano .env.production
   # Paste production environment variables
   ```

6. **Build Application**:
   ```bash
   npm run build
   ```

7. **Start with PM2**:
   ```bash
   pm2 start npm --name "politics" -- start
   pm2 save
   pm2 startup
   ```

8. **Configure Nginx**:
   ```bash
   sudo apt-get install nginx
   sudo nano /etc/nginx/sites-available/politics
   ```

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/politics /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

9. **Setup SSL with Let's Encrypt**:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

### Option 3: Docker Container

**Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build Next.js application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
```

**Deploy:**

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 🛡️ Security Checklist

### Before Production Launch

- [ ] **Environment Variables**
  - [ ] All secrets in environment variables (not hardcoded)
  - [ ] `.env` files in `.gitignore`
  - [ ] Strong `NEXTAUTH_SECRET` (32+ characters)

- [ ] **Database Security**
  - [ ] MongoDB authentication enabled
  - [ ] Network access restricted to server IPs
  - [ ] Database backups configured (daily minimum)
  - [ ] Encryption at rest enabled

- [ ] **API Security**
  - [ ] All endpoints require authentication
  - [ ] Rate limiting implemented
  - [ ] Input validation on all endpoints
  - [ ] SQL/NoSQL injection protection
  - [ ] CORS configured properly

- [ ] **Application Security**
  - [ ] HTTPS enforced (SSL certificate)
  - [ ] Security headers configured (Helmet.js)
  - [ ] XSS protection enabled
  - [ ] CSRF tokens implemented
  - [ ] Content Security Policy (CSP) configured

- [ ] **Authentication**
  - [ ] Strong password requirements
  - [ ] Account lockout after failed attempts
  - [ ] Two-factor authentication (2FA) available
  - [ ] Session timeout configured
  - [ ] Secure cookie settings

- [ ] **Logging & Monitoring**
  - [ ] Error tracking (Sentry)
  - [ ] Performance monitoring (New Relic)
  - [ ] Security event logging
  - [ ] Regular security audits scheduled

---

## 📊 Monitoring & Maintenance

### Performance Monitoring

**New Relic Setup:**

```bash
npm install newrelic
```

```javascript
// newrelic.js
'use strict';

exports.config = {
  app_name: ['Politics E-Commerce'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxy-authorization',
    ]
  }
};
```

### Error Tracking

**Sentry Setup:**

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Database Backups

**Automated MongoDB Backups:**

```bash
# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="/backups/mongodb_$DATE"

# Upload to S3
aws s3 cp "/backups/mongodb_$DATE" s3://your-bucket/backups/ --recursive

# Keep last 30 days
find /backups -type d -mtime +30 -exec rm -rf {} +
```

**Cron Job (Daily at 2 AM):**

```cron
0 2 * * * /path/to/backup-script.sh
```

### Health Checks

Create `/api/health` endpoint:

```typescript
export async function GET() {
  const dbStatus = await checkDatabaseConnection();
  
  return Response.json({
    status: dbStatus ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
  });
}
```

---

## 🔧 Troubleshooting

### Common Issues

**1. MongoDB Connection Failed**

```
Error: MongoServerError: Authentication failed
```

**Solution:**
- Verify `MONGODB_URI` in `.env`
- Check MongoDB Atlas network access
- Ensure database user has correct permissions

---

**2. NextAuth Session Errors**

```
Error: [next-auth][error][JWT_SESSION_ERROR]
```

**Solution:**
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies and retry

---

**3. Build Failures**

```
Error: Cannot find module '@/models/ecommerce/ProductListing'
```

**Solution:**
- Run `npm install` to ensure dependencies are installed
- Check `tsconfig.json` paths configuration
- Verify file paths are correct (case-sensitive)

---

**4. API Rate Limiting**

```
Error: Too many requests
```

**Solution:**
- Implement exponential backoff in client
- Increase rate limits in production config
- Use API key rotation for high-volume clients

---

**5. Database Performance Issues**

**Symptoms:**
- Slow query responses
- High CPU usage

**Solution:**
- Check indexes are created (`npm run db:indexes`)
- Review slow query logs
- Consider database scaling (vertical/horizontal)
- Implement caching (Redis)

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [AWS EC2 User Guide](https://docs.aws.amazon.com/ec2/)

---

## 🚀 Post-Deployment Checklist

- [ ] Application accessible via HTTPS
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] Authentication working correctly
- [ ] API endpoints returning expected responses
- [ ] Error tracking configured (Sentry)
- [ ] Performance monitoring active (New Relic)
- [ ] Database backups scheduled
- [ ] Health checks passing
- [ ] SSL certificate valid
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Documentation updated

---

**Auto-generated by ECHO v1.0.0**  
**Last updated:** 2025-11-14
