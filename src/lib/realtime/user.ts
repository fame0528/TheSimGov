/**
 * @fileoverview User Real-time Utilities
 * @module lib/realtime/user
 * 
 * OVERVIEW:
 * Helper functions to emit real-time user updates via Socket.io.
 * Used by API routes to notify clients of cash changes.
 * 
 * @created 2025-12-02
 * @author ECHO v1.3.3
 */

import type { Server } from 'socket.io';

// Extend global to include io
declare global {
  // eslint-disable-next-line no-var
  var io: Server | undefined;
}

/**
 * Emit cash update to specific user
 * 
 * @param userId - User ID to notify
 * @param cash - New cash value
 */
export function emitCashUpdate(userId: string, cash: number): void {
    const io = global.io;

    if (!io) {
        console.warn('[User Realtime] Socket.io not initialized');
        return;
    }

    const userNamespace = io.of('/user');

    if (!userNamespace) {
        console.warn('[User Realtime] /user namespace not found');
        return;
    }

    // Emit to user's personal room
    userNamespace.to(`user-${userId}`).emit('user:cash:update', { cash });

    console.log(`[User Realtime] Emitted cash update to user-${userId}: $${cash}`);
}

/**
 * Emit general user data update to specific user
 * 
 * @param userId - User ID to notify
 * @param data - User data to send
 */
export function emitUserUpdate(userId: string, data: Record<string, unknown>): void {
    const io = global.io;

    if (!io) {
        console.warn('[User Realtime] Socket.io not initialized');
        return;
    }

    const userNamespace = io.of('/user');

    if (!userNamespace) {
        console.warn('[User Realtime] /user namespace not found');
        return;
    }

    // Emit to user's personal room
    userNamespace.to(`user-${userId}`).emit('user:update', data);

    console.log(`[User Realtime] Emitted user update to user-${userId}`);
}
