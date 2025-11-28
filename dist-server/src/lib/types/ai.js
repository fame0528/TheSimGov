"use strict";
/**
 * @fileoverview AI/Technology Industry Type Definitions
 * @module lib/types/ai
 *
 * OVERVIEW:
 * TypeScript types and interfaces for AI model training, research projects,
 * and AGI development. Provides type safety for Technology industry operations.
 *
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Type Safety**: Strict TypeScript types prevent runtime errors
 * 2. **Reuse Legacy Types**: Ported from legacy AIModel.ts + AIResearchProject.ts
 * 3. **Benchmark Standards**: Industry-standard metrics (accuracy, perplexity, F1, latency)
 * 4. **Input Validation**: Separate types for creation vs updates
 * 5. **Nested Objects**: Performance gains, breakthroughs, patents well-structured
 *
 * USAGE:
 * ```ts
 * import { AIModel, AITrainingStatus, BenchmarkScores } from '@/lib/types/ai';
 *
 * const model: AIModel = {
 *   id: '123',
 *   companyId: 'abc',
 *   name: 'GPT-Clone-v1',
 *   architecture: 'Transformer',
 *   size: 'Medium',
 *   parameters: 50_000_000_000,
 *   status: 'Training',
 *   trainingProgress: 45,
 *   benchmarkScores: { accuracy: 0, perplexity: 0, f1Score: 0, inferenceLatency: 0 },
 *   // ... other fields
 * };
 * ```
 *
 * REUSE:
 * - Reuses Department system patterns (type segregation, input types)
 * - Reuses validation approach (separate input vs entity types)
 * - Follows existing naming conventions (companyId, status enums)
 */
//# sourceMappingURL=ai.js.map