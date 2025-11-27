/**
 * @fileoverview Deterministic non-cryptographic hashing utility (FNV-1a 32-bit)
 * @module lib/utils/deterministicHash
 * @created 2025-11-25
 *
 * Provides stable numeric hashes for seed-based micro jitter without crypto overhead.
 */

/** Compute unsigned 32-bit FNV-1a hash for a UTF-16 JS string. */
export function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash >>> 0; // ensure unsigned
}

/** Normalize hash to [-1,1] float. */
export function hashToNormalizedRange(hash: number): number {
  return (hash / 0xffffffff) * 2 - 1;
}

/** Convenience: normalized FNV-1a over string. */
export function normalizedHash(input: string): number {
  return hashToNormalizedRange(fnv1a32(input));
}
