# Media Domain Implementation Plan

**FID:** FID-20251124-001  
**Created:** 2025-11-25  
**Status:** PLANNED  
**Priority:** HIGH  
**Estimated Duration:** 3 weeks (15 business days)

---

## Executive Summary

Complete implementation of media domain with 100% legacy parity, enhanced utilities, deterministic calculations, and comprehensive test coverage. Follows ECHO v1.3.0 utility-first, DRY, and AAA quality standards.

**Key Deliverables:**
1. Consolidated TypeScript domain types
2. 9 missing/enhanced utility functions
3. Backend-Frontend contract verification
4. Comprehensive test suite (>85% coverage)
5. Complete documentation guide
6. Production-ready media system

---

## Phase Breakdown

### 📋 Phase 0: Planning Complete ✅

**Duration:** 2 days  
**Status:** COMPLETED  
**Date:** 2025-11-23 to 2025-11-25

**Deliverables:**
- [x] Legacy media parity checklist
- [x] Current utilities analysis (full 1-EOF reads)
- [x] Models & routes analysis (complete reads)
- [x] Utility coverage matrix (Exists/Partial/Missing)
- [x] Backend-Frontend contract matrix
- [x] Domain types/interfaces specification
- [x] Missing utility specifications
- [x] Test strategy outline
- [x] Documentation outline
- [x] This implementation plan

**Artifacts:**
- `docs/MEDIA_PARITY_CHECKLIST_FID-20251124-001_20251125.md`
- `docs/MEDIA_DOMAIN_TYPES_FID-20251124-001_20251125.md`
- `docs/MEDIA_MISSING_UTILITIES_SPEC_FID-20251124-001_20251125.md`
- `docs/MEDIA_TEST_STRATEGY_FID-20251124-001_20251125.md`
- `docs/MEDIA_DOCUMENTATION_OUTLINE_FID-20251124-001_20251125.md`
- `docs/MEDIA_IMPLEMENTATION_PLAN_FID-20251124-001_20251125.md`

---

### 🏗️ Phase 1: Foundation (Types & Constants)

**Duration:** 1 day  
**Priority:** CRITICAL  
**Prerequisites:** Phase 0 complete  

**Objectives:**
- Implement consolidated TypeScript types
- Create media constants file
- Set up type exports and imports
- Verify type safety across codebase

**Tasks:**

1. **Create Core Types File** (2 hours)
   - File: `src/lib/types/media.ts`
   - Implement all interfaces from domain types spec
   - Export all types and type aliases
   - Add JSDoc documentation

2. **Create Constants File** (1 hour)
   - File: `src/lib/utils/media/mediaConstants.ts`
   - Platform scale ranges
   - Threshold values
   - Default parameters
   - Export all constants

3. **Update Existing Files** (3 hours)
   - Import types in all model files
   - Update Mongoose schemas to implement interfaces
   - Fix any type mismatches
   - Verify strict TypeScript compliance

4. **Type Verification** (2 hours)
   - Run TypeScript compiler
   - Fix all type errors
   - Ensure zero `any` types
   - Document any type workarounds

**Acceptance Criteria:**
- [ ] All types defined in `src/lib/types/media.ts`
- [ ] Constants defined in `mediaConstants.ts`
- [ ] All models implement type interfaces
- [ ] Zero TypeScript errors
- [ ] Zero `any` types used

**Estimated Time:** 8 hours (1 day)

---

### ⚙️ Phase 2: Utility Implementation (Missing Functions)

**Duration:** 5 days  
**Priority:** HIGH  
**Prerequisites:** Phase 1 complete

**Objectives:**
- Implement all missing utilities
- Enhance partial utilities
- Ensure deterministic behavior
- Maintain DRY compliance

**Tasks by Priority:**

#### **Week 1: Critical Utilities** (3 days)

**Day 1:**
1. **normalizeCrossPlatformMetrics** (4 hours)
   - Implement logarithmic/linear scaling
   - Platform-specific ranges from constants
   - Seeded random for variance
   - Unit tests (edge cases, determinism)

2. **calculateEngagementVolatility** (4 hours)
   - Standard deviation calculation
   - Coefficient of variation
   - Trend analysis (linear regression)
   - Risk level classification
   - Unit tests

**Day 2:**
3. **calculateCohortRetention (Enhanced)** (6 hours)
   - Cohort grouping by acquisition date
   - Time-windowed retention tracking
   - LTV prediction
   - Cohort performance analysis
   - Unit tests (complex scenarios)

**Day 3:**
4. **calculateInfluencerROI (Enhanced)** (6 hours)
   - Multi-touch attribution models
   - Last/First/Linear/Time-decay attribution
   - Payback period calculation
   - Lifetime value ROI
   - Unit tests (attribution scenarios)

#### **Week 2: High Priority Utilities** (2 days)

**Day 4:**
5. **calculateChurnForecast** (6 hours)
   - Exponential smoothing
   - Trend + seasonal components
   - Confidence interval calculation
   - Risk score computation
   - Unit tests (forecasting accuracy)

**Day 5:**
6. **calculateContentAging** (3 hours)
   - Decay curve fitting (exponential/linear/log)
   - Half-life calculation
   - Shelf life projection
   - Revitalization potential
   - Unit tests

7. **calculateMonetizationRisk** (3 hours)
   - Revenue volatility (CV)
   - Diversification (HHI)
   - Concentration risk
   - Sustainability score
   - Unit tests

#### **Week 3: Enhancements** (Optional, if time permits)

**Day 6-7:** (If Phase 3-4 ahead of schedule)
8. **calculateAlgorithmAdaptationScore** (4 hours)
9. **calculateAdvancedVirality** (4 hours)

**Acceptance Criteria:**
- [ ] All missing utilities implemented
- [ ] All enhanced utilities upgraded
- [ ] Deterministic behavior (seed support)
- [ ] DRY compliance (zero duplication)
- [ ] JSDoc documentation complete
- [ ] Unit tests passing (>95% coverage)

**Estimated Time:** 40 hours (5 days)

---

### ✅ Phase 3: Testing & Quality Assurance

**Duration:** 3 days  
**Priority:** HIGH  
**Prerequisites:** Phase 2 complete (can start partially during Phase 2)

**Objectives:**
- Achieve >85% overall test coverage
- Achieve >95% critical utility coverage
- Verify deterministic behavior
- Test all edge cases

**Tasks:**

**Day 1: Existing Utilities** (8 hours)
1. **advertising.test.ts**
   - Test calculateROAS, calculateCTR, calculateCPA, calculateCPM
   - Edge cases, determinism, boundaries
   - Coverage: >95%

2. **audience.test.ts**
   - Test audience growth, retention, demographics
   - Edge cases, integration tests
   - Coverage: >95%

**Day 2: Content & Platform** (8 hours)
3. **content.test.ts**
   - Test engagement rate, virality, quality score
   - Monetization potential
   - Coverage: >95%

4. **platform.test.ts**
   - Test platform analytics
   - Algorithm score
   - Coverage: >90%

**Day 3: New Utilities** (8 hours)
5. **crossPlatform.test.ts**
   - Test normalization across platforms
   - Coverage: >95%

6. **analytics.test.ts**
   - Test volatility, forecasting, aging
   - Risk assessment
   - Coverage: >95%

7. **Integration Tests**
   - Utility composition
   - End-to-end workflows
   - Performance benchmarks

**Continuous Tasks:**
- Run tests after each utility implementation
- Fix failing tests immediately
- Monitor coverage metrics
- Update test fixtures as needed

**Acceptance Criteria:**
- [ ] Overall coverage ≥85%
- [ ] Critical utilities coverage ≥95%
- [ ] All edge cases tested
- [ ] Determinism verified
- [ ] Performance benchmarks met
- [ ] Zero flaky tests
- [ ] CI/CD pipeline passing

**Estimated Time:** 24 hours (3 days)

---

### 🔗 Phase 4: Contract Verification & Integration

**Duration:** 2 days  
**Priority:** MEDIUM  
**Prerequisites:** Phase 1-2 complete

**Objectives:**
- Verify backend-frontend contracts
- Update API routes with new utilities
- Ensure type consistency
- Test integration points

**Tasks:**

**Day 1: Backend Integration** (8 hours)
1. **Update API Routes** (6 hours)
   - Integrate new utilities into route handlers
   - Replace inline calculations with utilities
   - Add proper error handling
   - Type all responses

2. **Contract Verification** (2 hours)
   - Verify request/response shapes match matrix
   - Check status codes consistency
   - Validate error formats

**Day 2: Frontend Integration** (8 hours)
3. **Identify Frontend Components** (2 hours)
   - Locate media dashboard components (legacy)
   - Map API calls to backend endpoints
   - Identify missing frontend implementations

4. **Frontend Type Safety** (4 hours)
   - Export API types for frontend
   - Create typed API client functions
   - Verify type consistency

5. **Integration Tests** (2 hours)
   - Test API route responses
   - Validate frontend-backend integration
   - End-to-end user flow tests

**Acceptance Criteria:**
- [ ] All routes use utility functions (no inline calculations)
- [ ] Backend-Frontend contract matrix 100% verified
- [ ] Type safety enforced across API boundary
- [ ] Integration tests passing
- [ ] No API breaking changes

**Estimated Time:** 16 hours (2 days)

---

### 📚 Phase 5: Documentation

**Duration:** 2 days  
**Priority:** MEDIUM  
**Prerequisites:** Phase 1-4 complete

**Objectives:**
- Complete Media Utilities Guide
- API documentation
- Migration guide
- Usage examples

**Tasks:**

**Day 1: Utilities Guide** (8 hours)
1. **Core Sections** (4 hours)
   - Overview & Introduction
   - Core Concepts (determinism, categories)
   - Function Reference (all utilities)

2. **Mathematical Formulas** (2 hours)
   - Document all formulas
   - Algorithm explanations
   - Complexity analysis

3. **Error Handling** (2 hours)
   - Error types and codes
   - Validation rules
   - Recovery strategies

**Day 2: Advanced Documentation** (8 hours)
4. **Extension Patterns** (2 hours)
   - Creating new utilities
   - Composition patterns
   - Plugin architecture

5. **Performance & Optimization** (2 hours)
   - Caching strategies
   - Batch processing
   - Benchmarks

6. **Troubleshooting & FAQ** (2 hours)
   - Common issues
   - Debug strategies
   - FAQ section

7. **Migration Guide** (2 hours)
   - Legacy to new utilities
   - Breaking changes
   - Examples

**Acceptance Criteria:**
- [ ] Complete `/docs/MEDIA_UTILITIES_GUIDE.md`
- [ ] All utilities documented
- [ ] Code examples provided
- [ ] Migration guide complete
- [ ] FAQ comprehensive
- [ ] Reviewed and polished

**Estimated Time:** 16 hours (2 days)

---

### 🚀 Phase 6: Deployment & Validation

**Duration:** 2 days  
**Priority:** HIGH  
**Prerequisites:** All previous phases complete

**Objectives:**
- Final quality assurance
- Performance validation
- Production readiness checklist
- Deployment

**Tasks:**

**Day 1: Final QA** (8 hours)
1. **Code Review** (3 hours)
   - Full codebase review
   - DRY compliance audit
   - Type safety verification
   - Security review

2. **Performance Testing** (3 hours)
   - Load testing on utilities
   - API route performance
   - Database query optimization
   - Caching verification

3. **ECHO Compliance Audit** (2 hours)
   - Verify all ECHO standards met
   - Check GUARDIAN compliance
   - Documentation completeness
   - Test coverage verification

**Day 2: Deployment** (8 hours)
4. **Pre-Deployment Checklist** (2 hours)
   - [ ] All tests passing
   - [ ] Coverage ≥85%
   - [ ] TypeScript strict mode passing
   - [ ] No console.log/debugger statements
   - [ ] Environment variables configured
   - [ ] Database migrations ready

5. **Deployment** (2 hours)
   - Run database migrations (if any)
   - Deploy to staging
   - Smoke tests on staging
   - Deploy to production (if approved)

6. **Post-Deployment Validation** (2 hours)
   - Monitor error rates
   - Verify API responses
   - Check performance metrics
   - User acceptance testing

7. **Completion Report** (2 hours)
   - Generate COMPLETION_REPORT
   - Document lessons learned
   - Update metrics
   - Archive FID

**Acceptance Criteria:**
- [ ] All tests passing in production
- [ ] No critical errors
- [ ] Performance within SLA
- [ ] Documentation published
- [ ] Completion report generated
- [ ] FID marked COMPLETED

**Estimated Time:** 16 hours (2 days)

---

## Timeline Summary

| Phase | Duration | Start | End | Status |
|-------|----------|-------|-----|--------|
| Phase 0: Planning | 2 days | Nov 23 | Nov 25 | ✅ COMPLETED |
| Phase 1: Foundation | 1 day | Nov 26 | Nov 26 | PLANNED |
| Phase 2: Utilities | 5 days | Nov 27 | Dec 3 | PLANNED |
| Phase 3: Testing | 3 days | Nov 29* | Dec 5 | PLANNED |
| Phase 4: Integration | 2 days | Dec 4 | Dec 5 | PLANNED |
| Phase 5: Documentation | 2 days | Dec 6 | Dec 9 | PLANNED |
| Phase 6: Deployment | 2 days | Dec 10 | Dec 11 | PLANNED |
| **TOTAL** | **15 days** | **Nov 23** | **Dec 11** | **ON TRACK** |

*Note: Phase 3 can start partially during Phase 2 (parallel test development)

---

## Resource Allocation

### Time Budget

- **Foundation:** 8 hours
- **Utilities:** 40 hours
- **Testing:** 24 hours
- **Integration:** 16 hours
- **Documentation:** 16 hours
- **Deployment:** 16 hours
- **TOTAL:** 120 hours (15 days)

### Parallelization Opportunities

- Phase 3 can overlap with Phase 2 (write tests as utilities complete)
- Phase 5 can overlap with Phase 4 (document as you integrate)
- Multiple utilities in Phase 2 can be implemented in parallel (if resources available)

---

## Risk Management

### Identified Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Complex utilities take longer than estimated | Medium | Medium | Prioritize critical utilities (Phase 2 Week 1) |
| Type inconsistencies across codebase | Low | Medium | Phase 1 type foundation reduces risk |
| Test coverage gaps | Low | High | Continuous testing during Phase 2-3 |
| Frontend integration issues | Medium | Medium | Contract matrix already defined |
| Performance degradation | Low | High | Performance tests in Phase 3 |
| Scope creep (additional utilities) | Medium | Low | Freeze utility list (9 functions defined) |

### Contingency Plans

**If Behind Schedule:**
1. Defer optional enhancements (Phase 2, Day 6-7)
2. Reduce documentation depth (focus on critical sections)
3. Extend timeline by 2-3 days

**If Ahead of Schedule:**
1. Implement optional enhancements (Algorithm Adaptation, Advanced Virality)
2. Add extra test cases
3. Polish documentation

---

## Success Metrics

### Quantitative Targets

- [ ] **Code Coverage:** ≥85% overall, ≥95% critical utilities
- [ ] **TypeScript Errors:** 0
- [ ] **Test Pass Rate:** 100%
- [ ] **Performance:** All utilities <100ms for standard datasets
- [ ] **Documentation:** 100% function coverage
- [ ] **API Contract Coverage:** 100% (14/14 endpoints)

### Qualitative Targets

- [ ] **DRY Compliance:** Zero code duplication
- [ ] **Type Safety:** Zero `any` types
- [ ] **Determinism:** All utilities support seeding
- [ ] **Maintainability:** Code is self-documenting with JSDoc
- [ ] **Extensibility:** Extension patterns documented
- [ ] **User Experience:** Clear error messages, sensible defaults

---

## Dependencies

### External Dependencies

- None (all code is self-contained)

### Internal Dependencies

- TypeScript 5.x
- Jest 29.x
- Mongoose 8.x
- Next.js 14.x
- Existing political utilities (for pattern reference)

### Blocking Dependencies

- Phase 1 blocks all other phases
- Phase 2 blocks Phase 3-4
- Phase 3-4 block Phase 6

---

## Communication Plan

### Status Updates

- **Daily:** Progress updates in dev/progress.md
- **Phase Complete:** Update todo list, chat summary
- **Blockers:** Immediate notification
- **Completion:** Full completion report

### Stakeholder Communication

- **Planning Complete:** Present this implementation plan
- **Mid-Point (Phase 3):** Progress review, coverage metrics
- **Pre-Deployment:** Final review, deployment approval
- **Post-Deployment:** Completion report, lessons learned

---

## Approval & Sign-Off

### Ready to Proceed When:

- [x] Planning phase complete
- [x] All planning documents reviewed
- [x] Implementation plan approved
- [x] Resources allocated

### Phase Gate Reviews

Each phase requires sign-off before proceeding to next:

- [ ] **Phase 1 Complete:** Types verified, zero TS errors
- [ ] **Phase 2 Complete:** All utilities implemented, tests passing
- [ ] **Phase 3 Complete:** Coverage targets met
- [ ] **Phase 4 Complete:** Integration verified
- [ ] **Phase 5 Complete:** Documentation complete
- [ ] **Phase 6 Complete:** Production deployment successful

---

## Next Steps

**Immediate Actions (Ready to Execute):**

1. **User approval:** Review and approve this implementation plan
2. **Start Phase 1:** Create types and constants files
3. **Set up tracking:** Initialize progress tracking in dev/progress.md
4. **Begin implementation:** Execute Phase 1 tasks

**Command to Start:**
```bash
# User says "proceed" or "code" to begin Phase 1
```

---

**Footer:** Generated under ECHO v1.3.0 (GUARDIAN active). Implementation plan follows utility-first, DRY, AAA quality standards. All phases structured for systematic execution with clear acceptance criteria and success metrics. Ready for approval and execution.
