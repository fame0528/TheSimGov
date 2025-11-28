/**
 * @file src/realtime/index.ts
 * @description Barrel exports for realtime utilities (ECHO index file compliance).
 * @created 2025-11-27
 */
export { default as initSocket, initSocket as initSocketNamed } from './socketInit';
export * from './emitters';
