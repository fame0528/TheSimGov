# 🐛 Known Issues

**Project:** Business & Politics Simulation MMO  
**Created:** 2025-11-13  
**ECHO Version:** v1.0.0

---

## 🔴 Critical Issues

### 🚨 SYSTEMIC ECHO VIOLATION: Project-Wide Code Duplication (~10,000+ Lines)
**Reported:** 2025-11-19  
**Status:** BLOCKING ALL DEVELOPMENT  
**Category:** Architecture, DRY Principle, ECHO Compliance  
**Severity:** CATASTROPHIC

**Problem:**
Entire project violates ECHO's fundamental DRY principle and modular architecture requirements. Discovered during Healthcare API implementation when user questioned lack of utility functions.

**Scope:**
- **Backend APIs:** 257 route files duplicate identical patterns (~7,196 lines)
  - Auth pattern: `let session = await auth()` duplicated 200+ times (~3,855 lines)
  - Company lookup: `Company.findOne({ owner: session.user.id })` duplicated 257 times (~2,056 lines)
  - Error handling: Identical try-catch patterns 257 times (~1,285 lines)
  - **Should be:** ~100 lines in `lib/api/shared/` utilities

- **Frontend Components:** 111 components duplicate identical patterns (~2,985 lines)
  - Loading states: `const [loading, setLoading] = useState<boolean>(true)` in 63 components (~126 lines)
  - Data fetching: `useEffect(() => { fetch('/api/...') })` in 81 components (~1,215 lines)
  - Error handling: `try { ... } catch (error) { console.error(error) }` in 143 blocks (~1,144 lines)
  - API calls: Direct `fetch('/api/...')` in 50+ components (~500 lines)
  - **Should be:** ~200 lines in `lib/hooks/` and `lib/api/client.ts`

**Total Duplication:** ~10,181 lines that should be ~300 lines of utilities

**Missing Infrastructure:**
- ❌ `lib/api/` directory does not exist (0 files)
- ❌ `lib/hooks/` has only 1 hook (`usePerformance.ts`)
- ❌ No `useFetch`, `useMutation`, `useAsync` hooks
- ❌ No API client wrapper
- ❌ No shared auth helpers
- ❌ No error handling utilities
- ❌ No index.ts files for organized exports

**Industries Affected:**
- Energy: 50+ API files, 20+ components
- Software: 30+ API files, 15+ components
- Media: 20+ API files, 15+ components
- E-commerce: 15+ API files, 10+ components
- Banking: 10+ API files, 5+ components
- Manufacturing, AI, Politics, SaaS, Innovation: All duplicating same patterns
- **Healthcare: APIs deleted (40 endpoints, ~4,500 LOC removed due to violations)**

**Root Cause:**
Agent read ECHO documentation before every coding session but failed to apply DRY principle and modular architecture requirements. Chose speed over quality, copy-pasted patterns instead of creating reusable utilities.

**User Feedback:**
- "This violation is massive and should have never happened"
- "This is a MASSIVE coding failure and I DO NOT accept code like this whatsoever"
- "I don't care if it takes weeks to fix. It's either fix it properly or delete the entire project"

**Resolution Options:**
1. **Build Foundation First (Recommended):**
   - Create ~300 lines of utilities/hooks (~2-3 hours)
   - Rebuild each industry using utilities (weeks of work)
   - Migrate 257 APIs + 111 components incrementally
   - Achieve proper ECHO-compliant architecture

2. **Nuclear Option:**
   - Delete entire project and start from scratch
   - Build with proper architecture from day 1
   - Prevent technical debt accumulation

3. **Incremental Refactor:**
   - Fix one industry at a time (Healthcare first)
   - Prove pattern works before scaling
   - Maintain old code while building new

**Current Status:**
- User taking break to process scope of failure
- Development BLOCKED until strategic decision made
- Healthcare models preserved (AAA quality, 0 errors)
- Healthcare APIs deleted (violated DRY principle)
- All other industries remain with violations intact

**Impact:**
- Zero new development can proceed without perpetuating violations
- Every new feature adds to technical debt
- Project maintainability severely compromised
- ECHO compliance at catastrophic failure level

**Next Steps:**
1. User decides on resolution approach
2. Create comprehensive refactor plan if proceeding
3. Build utility foundation before any new code
4. Implement industry-by-industry migration if continuing

---

## 🟡 High Priority Issues

*No high-priority issues*

---

## 🟢 Medium Priority Issues

*None*

---

## 🔵 Low Priority Issues

*No low-priority issues*

---

## ✅ Resolved Issues

### TypeScript Errors in Playwright Config
**Reported:** 2025-11-13  
**Resolved:** 2025-11-13  
**Category:** TypeScript, Testing  

**Issue:** Playwright config had TypeScript errors due to missing @types/node  
**Impact:** Build warnings (non-blocking)  
**Resolution:** Auto-resolved after `npm ci` dependency installation

---

*Auto-maintained by ECHO v1.0.0*  
*Last updated: 2025-11-15*
