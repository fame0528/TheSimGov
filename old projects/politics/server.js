/**
 * @file server.js
 * @description Custom Next.js server with Socket.io integration
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Production-ready custom server that integrates Socket.io with Next.js 15.
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

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin: dev ? 'http://localhost:3000' : process.env.NEXTAUTH_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Socket.io namespaces for different game systems
  const chatNamespace = io.of('/chat');
  const electionsNamespace = io.of('/elections');
  const marketNamespace = io.of('/market');

  /**
   * Chat namespace - handles player messaging
   */
  chatNamespace.on('connection', (socket) => {
    console.log(`[Chat] Player connected: ${socket.id}`);

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-joined', { socketId: socket.id });
    });

    socket.on('send-message', ({ roomId, message, playerId }) => {
      chatNamespace.to(roomId).emit('receive-message', {
        message,
        playerId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Chat] Player disconnected: ${socket.id}`);
    });
  });

  /**
   * Elections namespace - handles voting and campaign events
   */
  electionsNamespace.on('connection', (socket) => {
    console.log(`[Elections] Player connected: ${socket.id}`);

    socket.on('cast-vote', ({ electionId, candidateId, playerId }) => {
      // Vote processing would be handled by API routes
      // Socket.io broadcasts the event for real-time updates
      electionsNamespace.emit('vote-cast', {
        electionId,
        candidateId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Elections] Player disconnected: ${socket.id}`);
    });
  });

  /**
   * Market namespace - handles real-time market updates
   */
  marketNamespace.on('connection', (socket) => {
    console.log(`[Market] Player connected: ${socket.id}`);

    socket.on('subscribe-market', ({ marketType }) => {
      socket.join(`market-${marketType}`);
    });

    socket.on('unsubscribe-market', ({ marketType }) => {
      socket.leave(`market-${marketType}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Market] Player disconnected: ${socket.id}`);
    });
  });

  // Start server
  server.listen(port, () => {
    console.log(`
🚀 Server ready at http://${hostname}:${port}
🔌 Socket.io ready for real-time connections
📊 Environment: ${dev ? 'development' : 'production'}
    `);
  });
});
