# 🔐 Authentication System

**Project:** Business & Politics Simulation MMO  
**Created:** 2025-11-13  
**Version:** 0.1.0

---

## 🎯 Overview

The authentication system uses **NextAuth.js v5 (Auth.js)** for secure session management with character name-based player identification.

---

## 🔑 Key Features

- ✅ Email + password registration
- ✅ First name and last name (player's in-game identity)
- ✅ State selection (determines local government)
- ✅ Secure password hashing (bcrypt, 12 rounds)
- ✅ JWT-based session management
- ✅ Protected routes via middleware
- ✅ Server and client-side session access

---

## 🚀 Registration Flow

### 1. User Provides Information
```javascript
{
  email: "john.smith@example.com",
  password: "SecurePassword123!",
  firstName: "John",
  lastName: "Smith",
  state: "California" // US state selection
}
```

### 2. System Validates Name
```javascript
// Names: 2-50 characters each, letters only
// Full name displayed as "firstName lastName"
// Each player gets one character per account
fullName: "John Smith" // Computed from firstName + lastName
```

### 3. Password is Hashed
```javascript
import bcrypt from 'bcryptjs';

const hashedPassword = await bcrypt.hash(password, 12);
// Never store plain text passwords!
```

### 4. User Document Created
```javascript
{
  _id: ObjectId,
  firstName: "John",
  lastName: "Smith",
  email: "john.smith@example.com",
  password: "$2a$12$...", // hashed
  state: "California",
  localGovernment: {
    county: "Los Angeles County",
    city: "Los Angeles"
  },
  politicalLevel: "local", // Can progress to federal
  createdAt: ISODate,
  updatedAt: ISODate
}
```

---

## 🔒 Login Flow

### 1. User Submits Credentials
```javascript
{
  email: "john.smith@example.com",
  password: "SecurePassword123!"
}
```

### 2. NextAuth.js Validates
```javascript
// In /app/api/auth/[...nextauth]/route.ts
authorize: async (credentials) => {
  // Find user by email
  const user = await User.findOne({ email: credentials.email });
  
  // Compare passwords
  const isValid = await bcrypt.compare(
    credentials.password,
    user.password
  );
  
  if (!isValid) return null;
  
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    state: user.state
  };
}
```

### 3. Session Created
```javascript
{
  user: {
    id: "user_id",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@example.com",
    state: "California"
  },
  expires: "2025-12-13T..." // 30 days
}
```

---

## 🛡️ Protected Routes

### Server-Side Protection (Proxy)

This project follows Next.js 16 guidance and uses `proxy.ts` (replacing the legacy middleware file) to protect server-side routes. The `proxy.ts` file runs at the edge and uses `next-auth`'s `getToken()` to check sessions.

```typescript
// proxy.ts
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;

  const publicRoutes = ['/', '/login', '/register'];
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

  const isProtectedRoute = !isPublicRoute && !request.nextUrl.pathname.startsWith('/api');

  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### API Route Protection
```typescript
// /app/api/companies/route.ts
import { getServerSession } from 'next-auth';

export async function GET() {
  const session = await getServerSession();
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Fetch user's companies...
}
```

### Client Component Protection
```typescript
'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export function ProtectedComponent() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <Spinner />;
  if (status === 'unauthenticated') redirect('/login');
  
  return <div>Welcome {session.user.firstName} {session.user.lastName}!</div>;
}
```

---

## 🔐 Security Best Practices

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Password Hashing
```typescript
import bcrypt from 'bcryptjs';

// 12 rounds = ~250ms hash time (good balance)
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

### Session Security
- JWT tokens signed with secret
- Tokens expire after 30 days
- Refresh tokens not implemented (future enhancement)
- HTTPS required in production
- Secure cookies (httpOnly, sameSite)

---

## 📊 Database Schema

### User Model (Mongoose)
```typescript
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
    select: false, // Don't return by default
  },
  state: {
    type: String,
    required: true,
    enum: ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
    index: true,
  },
  localGovernment: {
    county: String,
    city: String,
  },
  politicalLevel: {
    type: String,
    enum: ['local', 'state', 'federal'],
    default: 'local',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export const User = mongoose.model('User', UserSchema);
```

---

## 🔄 Session Management

### Server-Side Session Access
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function ServerComponent() {
  const session = await getServerSession(authOptions);
  
  return <div>Hello {session?.user.firstName} {session?.user.lastName}</div>;
}
```

### Client-Side Session Access
```typescript
'use client';

import { useSession } from 'next-auth/react';

export function ClientComponent() {
  const { data: session } = useSession();
  
  return <div>Hello {session?.user.firstName} {session?.user.lastName}</div>;
}
```

### API Route Session Access
```typescript
import { getServerSession } from 'next-auth';

export async function GET() {
  const session = await getServerSession();
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  // Use userId to fetch user-specific data...
}
```

---

## 🧪 Testing Authentication

### Unit Tests
```typescript
import { hash, compare } from 'bcryptjs';

describe('Password Hashing', () => {
  it('should hash password correctly', async () => {
    const password = 'TestPassword123!';
    const hashed = await hash(password, 12);
    
    expect(hashed).not.toBe(password);
    expect(await compare(password, hashed)).toBe(true);
  });
});
```

### E2E Tests
```typescript
import { test, expect } from '@playwright/test';

test('user can register and login', async ({ page }) => {
  // Register
  await page.goto('/register');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'TestPassword123!');
  await page.fill('[name="firstName"]', 'Test');
  await page.fill('[name="lastName"]', 'User');
  await page.selectOption('[name="state"]', 'California');
  await page.click('button[type="submit"]');
  
  // Should redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
});
```

---

## 🚀 Future Enhancements

### Planned Features
- [ ] Two-factor authentication (2FA)
- [ ] OAuth providers (Google, Discord, Steam)
- [ ] Email verification
- [ ] Password reset flow
- [ ] Account deletion
- [ ] Session management (view/revoke sessions)
- [ ] Rate limiting on login attempts
- [ ] CAPTCHA for registration

---

## 📝 Environment Variables

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/business-politics-mmo
```

---

## 🔗 Related Documentation

- [API Documentation](./API.md)
- [Architecture Documentation](../dev/architecture.md)
- [NextAuth.js Documentation](https://next-auth.js.org/)

---

*Auto-maintained by ECHO v1.0.0*  
*Last updated: 2025-11-13*
