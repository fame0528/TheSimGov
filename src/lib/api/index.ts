/**
 * @fileoverview API Infrastructure Exports
 * @module lib/api
 * 
 * OVERVIEW:
 * Central export point for all API infrastructure.
 * Provides clean imports: import { apiClient, ApiError, endpoints } from '@/lib/api'
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

export { apiClient } from './apiClient';
export { ApiError } from './errors';
export { endpoints } from './endpoints';
