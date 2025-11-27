# WebSocket Architecture - Development & Production

**Document Type:** Infrastructure Architecture  
**Created:** 2025-11-27  
**Status:** PLANNED  
**Priority:** CRITICAL (P0 Foundation)  
**Scope:** Real-time communication infrastructure for all domains  

---

## Overview

TheSimGov requires robust real-time communication for:
- **Election results** broadcasting (Politics)
- **Crime events** (turf wars, raids, marketplace updates)
- **Business metrics** (live revenue tracking)
- **Activity feed** updates (Engagement)
- **Bill votes** (Politics legislative sessions)
- **Achievement unlocks** (Engagement)

**Architecture Goals:**
1. **Free local development** - Zero hosting costs for dev/testing
2. **Production-ready scaling** - Handle 1000+ concurrent users
3. **Fallback polling** - Graceful degradation if WebSocket unavailable
4. **Multi-instance support** - Redis pub/sub for horizontal scaling
5. **Cost-effective** - Deploy on Railway/Render free/starter tiers

---

## Local Development Architecture

### Free Socket.io Server (server.js)

**Current Setup:**
- Express + Socket.io server in `server.js` (already exists)
- Runs on `localhost:3001` alongside Next.js dev server (`localhost:3000`)
- **Cost:** $0 (local machine)

**server.js Configuration:**
```javascript
// server.js (existing file)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.SOCKET_PORT || 3001;

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);
  
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_APP_URL 
        : 'http://localhost:3000',
      credentials: true
    },
    transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Namespaces for domain isolation
  const crimeNamespace = io.of('/crime');
  const politicsNamespace = io.of('/politics');
  const businessNamespace = io.of('/business');
  const engagementNamespace = io.of('/engagement');

  // Crime namespace events
  crimeNamespace.on('connection', (socket) => {
    console.log('Client connected to /crime namespace');
    
    socket.on('join-territory', (territoryId) => {
      socket.join(`territory-${territoryId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected from /crime');
    });
  });

  // Politics namespace events
  politicsNamespace.on('connection', (socket) => {
    console.log('Client connected to /politics namespace');
    
    socket.on('join-election', (electionId) => {
      socket.join(`election-${electionId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected from /politics');
    });
  });

  // Business namespace events
  businessNamespace.on('connection', (socket) => {
    console.log('Client connected to /business namespace');
    
    socket.on('join-company', (companyId) => {
      socket.join(`company-${companyId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected from /business');
    });
  });

  // Engagement namespace events (activity feed, achievements)
  engagementNamespace.on('connection', (socket) => {
    console.log('Client connected to /engagement namespace');
    
    socket.on('join-feed', (userId) => {
      socket.join(`user-${userId}`);
      socket.join('global-feed'); // All users see global feed
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected from /engagement');
    });
  });

  // Next.js request handling
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Socket.io server ready on http://localhost:${PORT}`);
    console.log(`> Namespaces: /crime, /politics, /business, /engagement`);
  });
});
```

**Development Commands:**
```bash
# Start Socket.io server (terminal 1)
npm run socket:dev

# Start Next.js dev server (terminal 2)
npm run dev

# Or start both concurrently
npm run dev:all  # Runs both servers via concurrently package
```

**package.json Scripts:**
```json
{
  "scripts": {
    "dev": "next dev",
    "socket:dev": "node server.js",
    "dev:all": "concurrently \"npm run dev\" \"npm run socket:dev\"",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  }
}
```

---

## Production Architecture (Railway/Render)

### Option 1: Railway Deployment (Recommended)

**Why Railway:**
- Hobby plan: $5/month (500 hours, enough for 24/7 small app)
- Automatic deployments from GitHub
- Built-in environment variables
- Redis addon available ($10/month for scaling)
- WebSocket support out-of-box

**Deployment Steps:**

1. **Create Railway Project**
   - Connect GitHub repo
   - Railway auto-detects Node.js app
   - Deploy from `main` branch

2. **Environment Variables** (Railway Dashboard):
   ```
   NODE_ENV=production
   SOCKET_PORT=3001
   NEXT_PUBLIC_APP_URL=https://thesimgov.up.railway.app
   NEXT_PUBLIC_SOCKET_URL=https://thesimgov.up.railway.app
   MONGODB_URI=<your-mongodb-atlas-connection-string>
   NEXTAUTH_SECRET=<generate-secret>
   NEXTAUTH_URL=https://thesimgov.up.railway.app
   ```

3. **Build Command**: `npm run build`
4. **Start Command**: `npm run start` (runs server.js in production mode)

5. **Domain Setup**:
   - Railway provides: `thesimgov.up.railway.app`
   - Custom domain: Configure DNS to point to Railway
   - SSL: Automatic via Railway

**Cost Estimate:**
- Hobby Plan: $5/month (single instance, up to 500 hours = 20.8 days)
- Pro Plan: $20/month (unlimited hours, better for 24/7)
- Redis (for scaling): $10/month addon
- **Total (starter):** $5-15/month

---

### Option 2: Render Deployment

**Why Render:**
- Free tier available (750 hours/month = 31 days at 24/7)
- Similar deployment flow to Railway
- WebSocket support included
- Redis addon available

**Deployment Steps:**

1. **Create Render Web Service**
   - Connect GitHub repo
   - Select "Node" environment
   - Build command: `npm run build`
   - Start command: `npm run start`

2. **Environment Variables** (Render Dashboard):
   - Same as Railway (above)
   - `NEXT_PUBLIC_SOCKET_URL`: Use Render URL

3. **Domain Setup**:
   - Render provides: `thesimgov.onrender.com`
   - Custom domain: Configure DNS
   - SSL: Automatic

**Cost Estimate:**
- Free Tier: $0/month (750 hours, spins down after 15 min inactivity)
- Starter: $7/month (always-on, 512MB RAM)
- Redis: $10/month addon
- **Total (starter):** $7-17/month

---

### Option 3: Vercel + Separate Socket.io Server

**Not Recommended** - Vercel doesn't support WebSocket on serverless functions. Would require:
- Deploy Next.js frontend to Vercel (free)
- Deploy Socket.io server to Railway/Render separately ($5-7/month)
- More complex architecture (2 services instead of 1)

---

## Client-Side Implementation

### Socket.io Client Setup

**Install Dependencies:**
```bash
npm install socket.io-client
```

**Client Wrapper** (`src/lib/socket.ts`):
```typescript
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// Connection manager
class SocketManager {
  private crimeSocket: Socket | null = null;
  private politicsSocket: Socket | null = null;
  private businessSocket: Socket | null = null;
  private engagementSocket: Socket | null = null;

  connect(namespace: 'crime' | 'politics' | 'business' | 'engagement'): Socket {
    const socketKey = `${namespace}Socket` as keyof this;
    
    if (this[socketKey] && (this[socketKey] as Socket).connected) {
      return this[socketKey] as Socket;
    }

    const socket = io(`${SOCKET_URL}/${namespace}`, {
      transports: ['websocket', 'polling'], // Fallback to polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socket.on('connect', () => {
      console.log(`Connected to /${namespace} namespace`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Disconnected from /${namespace}:`, reason);
    });

    socket.on('connect_error', (error) => {
      console.error(`Connection error on /${namespace}:`, error);
    });

    this[socketKey] = socket as any;
    return socket;
  }

  disconnect(namespace: 'crime' | 'politics' | 'business' | 'engagement') {
    const socketKey = `${namespace}Socket` as keyof this;
    const socket = this[socketKey] as Socket | null;
    
    if (socket) {
      socket.disconnect();
      this[socketKey] = null as any;
    }
  }

  disconnectAll() {
    this.disconnect('crime');
    this.disconnect('politics');
    this.disconnect('business');
    this.disconnect('engagement');
  }
}

export const socketManager = new SocketManager();
```

**Usage in Components:**
```typescript
// Example: Politics election results component
import { useEffect, useState } from 'react';
import { socketManager } from '@/lib/socket';

export default function ElectionResults({ electionId }: { electionId: string }) {
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const socket = socketManager.connect('politics');

    // Join election room
    socket.emit('join-election', electionId);

    // Listen for live results
    socket.on('election:results-update', (data) => {
      console.log('Live results:', data);
      setResults(data);
    });

    socket.on('election:race-called', (data) => {
      console.log('Race called:', data);
      // Trigger celebration animation
    });

    // Cleanup on unmount
    return () => {
      socket.off('election:results-update');
      socket.off('election:race-called');
      socketManager.disconnect('politics');
    };
  }, [electionId]);

  return (
    <div>
      {results && (
        <div>
          <h2>Live Election Results</h2>
          {/* Render results */}
        </div>
      )}
    </div>
  );
}
```

---

## Fallback Polling Strategy

### When to Use Polling
- WebSocket connection fails (corporate firewalls, network restrictions)
- Client device doesn't support WebSocket (rare, but possible)
- Graceful degradation for better UX

### Polling Implementation

**API Route** (`/api/polling/election-results`):
```typescript
// pages/api/polling/election-results.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { Election } from '@/models/Election';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { electionId } = req.query;
  const { lastUpdate } = req.body; // Client sends last update timestamp

  // ETag caching: Only return new data if changed since lastUpdate
  const election = await Election.findById(electionId).lean();
  if (!election) return res.status(404).json({ error: 'Not found' });

  if (election.updatedAt.toISOString() === lastUpdate) {
    return res.status(304).end(); // Not modified
  }

  res.setHeader('ETag', election.updatedAt.toISOString());
  res.status(200).json(election);
}
```

**Client Polling Hook** (`src/hooks/usePolling.ts`):
```typescript
import { useEffect, useState, useCallback } from 'react';

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  interval: number = 5000, // Poll every 5 seconds
  enabled: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const poll = useCallback(async () => {
    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (!enabled) return;

    poll(); // Initial fetch

    const intervalId = setInterval(poll, interval);

    return () => clearInterval(intervalId);
  }, [poll, interval, enabled]);

  return { data, error, refetch: poll };
}
```

**Usage with Fallback:**
```typescript
// Component with WebSocket + polling fallback
import { useEffect, useState } from 'react';
import { socketManager } from '@/lib/socket';
import { usePolling } from '@/hooks/usePolling';

export default function ElectionResults({ electionId }: { electionId: string }) {
  const [useWebSocket, setUseWebSocket] = useState(true);
  const [results, setResults] = useState<any>(null);

  // Polling fallback (only enabled if WebSocket fails)
  const { data: pollingData } = usePolling(
    () => fetch(`/api/polling/election-results?electionId=${electionId}`).then(r => r.json()),
    5000,
    !useWebSocket // Enable polling only if WebSocket disabled
  );

  useEffect(() => {
    if (!useWebSocket) {
      setResults(pollingData);
      return;
    }

    const socket = socketManager.connect('politics');

    socket.emit('join-election', electionId);

    socket.on('election:results-update', (data) => {
      setResults(data);
    });

    socket.on('connect_error', () => {
      console.warn('WebSocket failed, falling back to polling');
      setUseWebSocket(false); // Activate polling
    });

    return () => {
      socket.off('election:results-update');
      socketManager.disconnect('politics');
    };
  }, [electionId, useWebSocket, pollingData]);

  return <div>{/* Render results */}</div>;
}
```

---

## Scaling with Redis Pub/Sub

### Why Redis Needed
- **Multi-Instance Problem**: Railway/Render can run multiple app instances for scaling
- **Socket.io Rooms**: Rooms are in-memory, not shared across instances
- **Solution**: Redis pub/sub broadcasts events to all instances

### Redis Setup (Railway Addon)

**Install Dependencies:**
```bash
npm install redis @socket.io/redis-adapter
```

**server.js with Redis:**
```javascript
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

// ... existing code ...

app.prepare().then(async () => {
  const server = express();
  const httpServer = http.createServer(server);
  
  const io = new Server(httpServer, { /* ... existing config ... */ });

  // Redis adapter for multi-instance support
  if (process.env.REDIS_URL) {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));
    console.log('> Redis adapter connected for multi-instance scaling');
  }

  // ... rest of server code ...
});
```

**Environment Variable:**
```
REDIS_URL=redis://default:password@redis-host:6379
```

**Cost:** $10/month (Railway Redis addon)

---

## Performance Targets

### Latency
- **Event Broadcast**: < 100ms from server emit to client receive
- **Connection Time**: < 2s from page load to socket connected
- **Reconnection**: < 3s after disconnect

### Throughput
- **Concurrent Connections**: 1000+ users (single instance)
- **Events per Second**: 10,000+ (Redis pub/sub scales to millions)
- **Rooms per Namespace**: Unlimited (Redis-backed)

### Reliability
- **Uptime**: 99.9% (Railway/Render SLA)
- **Reconnection Success**: 95%+ (auto-retry with exponential backoff)
- **Fallback Activation**: < 5s to switch to polling after WebSocket failure

---

## Cost Summary

### Development
- **Local**: $0/month (free server.js on localhost)

### Production (Starter)
- **Railway Hobby**: $5/month (500 hours, suitable for low-traffic)
- **Render Free**: $0/month (750 hours, spins down after inactivity)
- **Redis**: $10/month (only needed for scaling beyond 1 instance)

### Production (Recommended for 24/7)
- **Railway Pro**: $20/month (unlimited hours, always-on)
- **Render Starter**: $7/month (always-on, 512MB RAM)
- **Redis**: $10/month (if scaling needed)
- **Total**: $17-30/month for always-on production with scaling

### Production (Growth - 5000+ users)
- **Railway Pro**: $20/month (app server)
- **Railway Redis**: $10/month (pub/sub)
- **Horizontal Scaling**: +$20/month per additional instance
- **Total**: $50-70/month for 5000+ concurrent users

---

## Migration Path

### Phase 0: Local Development (Current)
- ✅ server.js with Socket.io namespaces
- ✅ Localhost:3001 for dev
- **Cost:** $0

### Phase 1: MVP Production (P0-Alpha)
- Deploy to Railway/Render (single instance)
- No Redis (rooms work on single instance)
- **Cost:** $5-7/month

### Phase 2: Beta Scaling (100-500 users)
- Add Redis adapter (Railway addon)
- Monitor performance, add instance if needed
- **Cost:** $15-25/month

### Phase 3: Production Scaling (500+ users)
- Multi-instance deployment with Redis pub/sub
- Load balancer (Railway handles automatically)
- **Cost:** $30-70/month depending on user count

---

## Security Considerations

### Authentication
- Verify NextAuth session before allowing Socket.io connection
- Middleware to check user permissions for namespace access

```javascript
// server.js authentication middleware
const { getServerSession } = require('next-auth');

politicsNamespace.use(async (socket, next) => {
  const session = await getServerSession(socket.request);
  if (!session) {
    return next(new Error('Unauthorized'));
  }
  socket.userId = session.user.id;
  next();
});
```

### Rate Limiting
- Limit events per user (prevent spam)
- Socket.io built-in rate limiting

```javascript
socket.on('vote-cast', async (data) => {
  // Rate limit: 1 vote per bill per user
  const existingVote = await checkExistingVote(socket.userId, data.billId);
  if (existingVote) {
    return socket.emit('error', { message: 'Already voted on this bill' });
  }
  // Process vote...
});
```

### Data Validation
- Validate all client events with Zod schemas
- Prevent malicious event payloads

---

## Monitoring & Logging

### Metrics to Track
- Connected clients per namespace
- Events per second
- Average event latency
- Disconnection rate
- Reconnection attempts

### Logging
```javascript
// Log important events
io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] Client connected: ${socket.id}`);
  
  socket.on('disconnect', (reason) => {
    console.log(`[${new Date().toISOString()}] Client disconnected: ${socket.id}, Reason: ${reason}`);
  });
});
```

### Railway/Render Dashboard
- Built-in metrics (CPU, memory, network)
- Logs accessible via dashboard or CLI
- Alerts for downtime, high resource usage

---

**Status:** PLANNED - Ready for implementation  
**Recommendation:** Start with Railway Hobby ($5/month) for P0-Alpha, add Redis when scaling beyond 100 concurrent users  
**Next Steps:** Deploy server.js to Railway, configure environment variables, test WebSocket + polling fallback  
**Created:** 2025-11-27
