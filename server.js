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
   * Chat namespace - handles player messaging and clan communications
   */
  chatNamespace.on('connection', (socket) => {
    console.log(`[Chat] Player connected: ${socket.id}`);

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-joined', { socketId: socket.id });
      console.log(`[Chat] Player ${socket.id} joined room: ${roomId}`);
    });

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', { socketId: socket.id });
      console.log(`[Chat] Player ${socket.id} left room: ${roomId}`);
    });

    socket.on('send-message', ({ roomId, message, playerId, playerName }) => {
      chatNamespace.to(roomId).emit('receive-message', {
        message,
        playerId,
        playerName,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('typing-start', ({ roomId, playerId, playerName }) => {
      socket.to(roomId).emit('user-typing', { playerId, playerName });
    });

    socket.on('typing-stop', ({ roomId, playerId }) => {
      socket.to(roomId).emit('user-stop-typing', { playerId });
    });

    socket.on('disconnect', () => {
      console.log(`[Chat] Player disconnected: ${socket.id}`);
    });
  });

  /**
   * Elections namespace - handles voting and political campaign events
   */
  electionsNamespace.on('connection', (socket) => {
    console.log(`[Elections] Player connected: ${socket.id}`);

    socket.on('join-election', (electionId) => {
      socket.join(`election-${electionId}`);
      console.log(`[Elections] Player ${socket.id} joined election: ${electionId}`);
    });

    socket.on('leave-election', (electionId) => {
      socket.leave(`election-${electionId}`);
      console.log(`[Elections] Player ${socket.id} left election: ${electionId}`);
    });

    socket.on('cast-vote', ({ electionId, candidateId, playerId, companyId }) => {
      // Broadcast vote to all players monitoring this election
      electionsNamespace.to(`election-${electionId}`).emit('vote-cast', {
        electionId,
        candidateId,
        playerId,
        companyId,
        timestamp: new Date().toISOString(),
      });

      // Also emit to general elections room for dashboard updates
      electionsNamespace.emit('election-update', {
        electionId,
        type: 'vote',
        candidateId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('campaign-contribution', ({ electionId, candidateId, amount, contributorId }) => {
      electionsNamespace.to(`election-${electionId}`).emit('contribution-made', {
        electionId,
        candidateId,
        amount,
        contributorId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Elections] Player disconnected: ${socket.id}`);
    });
  });

  /**
   * Market namespace - handles real-time market updates and trading
   */
  marketNamespace.on('connection', (socket) => {
    console.log(`[Market] Player connected: ${socket.id}`);

    socket.on('subscribe-market', ({ marketType, companyId }) => {
      socket.join(`market-${marketType}`);
      socket.join(`company-${companyId}-market`);
      console.log(`[Market] Player ${socket.id} subscribed to market: ${marketType}`);
    });

    socket.on('unsubscribe-market', ({ marketType, companyId }) => {
      socket.leave(`market-${marketType}`);
      socket.leave(`company-${companyId}-market`);
      console.log(`[Market] Player ${socket.id} unsubscribed from market: ${marketType}`);
    });

    socket.on('place-order', ({ marketType, orderType, companyId, amount, price }) => {
      // Broadcast order to market participants
      marketNamespace.to(`market-${marketType}`).emit('order-placed', {
        marketType,
        orderType,
        companyId,
        amount,
        price,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('cancel-order', ({ marketType, orderId, companyId }) => {
      marketNamespace.to(`market-${marketType}`).emit('order-cancelled', {
        marketType,
        orderId,
        companyId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('market-data-request', ({ marketType }) => {
      // This would typically trigger a market data broadcast
      // In a real implementation, this might query market APIs
      socket.emit('market-data-update', {
        marketType,
        data: {}, // Market data would be populated here
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Market] Player disconnected: ${socket.id}`);
    });
  });

  // Store io instance globally for API routes to access
  global.io = io;

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