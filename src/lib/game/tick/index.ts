/**
 * @file src/lib/game/tick/index.ts
 * @description Barrel exports for game tick system
 */

// Core engine
export * from './tickEngine';
export { default as tickEngine } from './tickEngine';

// Tick processors
export * from './bankingProcessor';
export * from './empireProcessor';
export * from './energyProcessor';
export * from './manufacturingProcessor';
export * from './retailProcessor';
export * from './techProcessor';
export * from './mediaProcessor';
export * from './consultingProcessor';
export * from './healthcareProcessor';
export * from './crimeProcessor';
export * from './politicsProcessor';

export { default as bankingProcessor } from './bankingProcessor';
export { default as empireProcessor } from './empireProcessor';
export { default as energyProcessor } from './energyProcessor';
export { default as manufacturingProcessor } from './manufacturingProcessor';
export { default as retailProcessor } from './retailProcessor';
export { default as techProcessor } from './techProcessor';
export { default as mediaProcessor } from './mediaProcessor';
export { default as consultingProcessor } from './consultingProcessor';
export { default as healthcareProcessor } from './healthcareProcessor';
export { default as crimeProcessor } from './crimeProcessor';
export { default as politicsProcessor } from './politicsProcessor';
