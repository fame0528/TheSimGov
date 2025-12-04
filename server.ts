/**
 * @file server.ts
 * @description TypeScript custom Next.js + Socket.io bootstrap using typed initializer.
 * @created 2025-11-27
 *
 * OVERVIEW:
 *  - Boots Next.js application and attaches Socket.io via initSocket (TypeScript version).
 *  - Exposes global.io for emission from API routes/services.
 *  - Designed for dev usage with ts-node and prod via build:server script.
 */
import 'dotenv/config'; // Load environment variables from .env early (ECHO: complete context before use)
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import initSocket from './src/realtime/socketInit';
import { broadcastSystemEvent } from './src/realtime';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function start() {
  await app.prepare();
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  const { io } = initSocket(server, { dev });
  // Make globally accessible (declared in src/types/global.d.ts)
  (global as any).io = io;

  server.listen(port, () => {
    console.log(`\n🚀 TS Server ready at http://${hostname}:${port}\n🔌 Socket.io initialized (TypeScript)\n📊 Environment: ${dev ? 'development' : 'production'}\n🎮 Namespaces: /chat /elections /market /user (moderation active)\n`);
    // Emit a startup system event (ECHO: fast verification of emitter layer)
    broadcastSystemEvent({ type: 'achievement', achievementId: 'startup', userId: 'system', title: 'Server Online', rarity: 'common', timestamp: Date.now(), meta: { startedAt: new Date().toISOString() } }, { persist: false });
  });
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
