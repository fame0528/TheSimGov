// Global type declarations for realtime server availability
import type { Server as SocketIOServer } from 'socket.io';

declare global {
  // Expose Socket.io instance for API routes or utility emission helpers
  // This is set in the custom server bootstrap once initSocket returns.
  // Guarded as optional to allow conditional initialization during tests.
  // Avoid redeclaration errors by using var.
  // eslint-disable-next-line no-var
  var io: SocketIOServer | undefined;
}

export {};