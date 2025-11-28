"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPLEMENTATION NOTES:
// 1. Utilities will ensure numeric invariants (e.g., clamp compositeInfluenceWeight into [0,1]).
// 2. All percent-like final outputs should standardize representation (choose decimal 0..1 internally, convert to whole % at presentation layer).
// 3. Micro-jitter must never push final below floor or above ceiling; apply jitter before clamp then clamp.
// 4. successfulLobbies currently informational; future phases may convert to momentum term.
// 5. previousSnapshotInfluence fairness floor uses retention factor (e.g., 0.9) defined in constants.
// 6. playerInfluenceScore may be provided pre or post clamp; caller must be explicit to avoid double compression.
// 7. Lobbying difficulty base values sourced from spec parity mapping; constants file centralizes tunables.
//# sourceMappingURL=politicsInfluence.js.map