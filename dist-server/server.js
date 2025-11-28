"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
require("dotenv/config"); // Load environment variables from .env early (ECHO: complete context before use)
const http_1 = require("http");
const url_1 = require("url");
const next_1 = __importDefault(require("next"));
const socketInit_1 = __importDefault(require("./src/realtime/socketInit"));
const realtime_1 = require("./src/realtime");
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = (0, next_1.default)({ dev, hostname, port });
const handle = app.getRequestHandler();
async function start() {
    await app.prepare();
    const server = (0, http_1.createServer)(async (req, res) => {
        try {
            const parsedUrl = (0, url_1.parse)(req.url, true);
            await handle(req, res, parsedUrl);
        }
        catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('Internal server error');
        }
    });
    const { io } = (0, socketInit_1.default)(server, { dev });
    // Make globally accessible (declared in src/types/global.d.ts)
    global.io = io;
    server.listen(port, () => {
        console.log(`\n🚀 TS Server ready at http://${hostname}:${port}\n🔌 Socket.io initialized (TypeScript)\n📊 Environment: ${dev ? 'development' : 'production'}\n🎮 Namespaces: /chat /elections /market (moderation active)\n`);
        // Emit a startup system event (ECHO: fast verification of emitter layer)
        (0, realtime_1.broadcastSystemEvent)({ type: 'achievement', achievementId: 'startup', userId: 'system', title: 'Server Online', rarity: 'common', timestamp: Date.now(), meta: { startedAt: new Date().toISOString() } }, { persist: false });
    });
}
start().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map