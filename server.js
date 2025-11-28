/**
 * @file server.js
 * @description Custom Next.js server with Socket.io integration for real-time multiplayer
 * @created 2025-11-24
 *
 * OVERVIEW:
 * Production-ready custom server that integrates Socket.io with Next.js 16.
 * Handles real-time game events, player interactions, and multiplayer dynamics.
 *
 * ARCHITECTURE:
 * - Next.js handles SSR/SSG and API routes
 * - Socket.io manages real-time bidirectional communication
 * - Namespaces organize different game systems (chat, elections, market)
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Delegate Socket.io setup to modular initializer (utility-first architecture)
  const { io } = require('./src/realtime/socketInit')(server, { dev });
  global.io = io; // expose for API route emission

  // Start server
  server.listen(port, () => {
    console.log(`
🚀 Server ready at http://${hostname}:${port}
🔌 Socket.io ready for real-time connections
📊 Environment: ${dev ? 'development' : 'production'}
🎮 Multiplayer systems: Chat, Elections, Market
    `);
  });
});