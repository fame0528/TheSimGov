# Media Industry Legacy Parity Checklist

**FID:** FID-20251124-001  
**Date:** 2025-11-25  
**Purpose:** Establish exhaustive legacy feature inventory for Media industry (platforms, content, audience analytics, ads/campaigns, influencers, monetization, sponsorships, cross-platform analytics) to guarantee 100% parity and identify improvement opportunities before implementation.

---
## 1. Platforms
| Legacy Capability | Details | Status | Notes / Improvement |
|-------------------|---------|--------|---------------------|
| Create platform | POST /api/media/platforms (name, type, initial metrics) | Pending | Add validation schema + ownership guard |
| List platforms | GET /api/media/platforms (filter by company) | Pending | Add pagination + sorting |
| Engagement metrics | engagementRate, algorithmScore stored per platform | Pending | Move formulas to pure utils |
| Revenue metrics | monthlyRevenue, revenuePerFollower computed | Pending | Utility: derive revenuePerFollower consistently |
| Platform analytics aggregation | /api/media/platforms/analytics endpoint cross-compares | Pending | Normalize metrics across platform types |
| Best performer detection | Highest revenue / engagement / ROI | Pending | Parameterize thresholds & tie-breakers |
| Monetization tier assignment | monetizationTier per platform | Pending | Link to MonetizationSettings for consistency |

## 2. Content Management
| Legacy Capability | Details | Status | Notes / Improvement |
|-------------------|---------|--------|---------------------|
| Create content | POST /api/media/content (quality metrics + cost) | Pending | Add funds check, strict validation |
| List content | GET /api/media/content (pagination, filters) | Pending | Extend sorting (engagement, ROI) |
| Quality metrics | writingQuality, researchDepth, engagementPotential, factCheckScore | Pending | Deterministic scoring utility with seed |
| Performance snapshot init | views, watchTime, adRevenue baseline | Pending | Utility: initializePerformanceSnapshot() |
| Multi-platform distribution | Content associated with multiple platforms | Pending | Validate platform IDs + duplicate prevention |
| Virality calculation | Not isolated (implicit) | Missing | New utility: computeViralityScore(contentQuality, earlyEngagement) |
| Content ROI | AdRevenue vs productionCost | Pending | Utility: computeContentROI() |

## 3. Audience Analytics
| Legacy Capability | Details | Status | Notes / Improvement |
|-------------------|---------|--------|---------------------|
| Audience core analytics | /api/media/audience (singleton doc ensure) | Pending | Add upsert guard & concurrency control |
| Demographics segmentation | /api/media/audience/demographics (age, income, geo, political, gender + dominant) | Pending | Utility: dominantSegment(segments) |
| Growth metrics | /api/media/audience/growth (netGrowth, projections 1/3/6 months) | Pending | Utility: projectGrowth(current, rate, horizon) |
| Retention & churn | /api/media/audience/retention (retentionRate, churnRate) | Pending | Utility: computeRetentionChurn(active, lost) |
| Avg follower lifetime | Derived | Pending | Utility: estimateFollowerLifetime(retentionRate) |
| Lifetime value per follower (LTV) | Derived | Pending | Utility: computeFollowerLTV(avgRevenuePerFollower, retentionRate) |
| Loyal follower %, repeat visitor rate | Provided | Pending | Consolidate definitions + doc |
| Health flags | In growth endpoint | Pending | Formalize rules (threshold config) |

## 4. Advertising & Campaigns
| Legacy Capability | Details | Status | Notes / Improvement |
|-------------------|---------|--------|---------------------|
| Create ad campaign | POST /api/media/ads (budget, bidStrategy, platforms) | Pending | Validate platform existence & sufficient budget |
| List/filter campaigns | GET /api/media/ads (filters + sorting) | Pending | Add result pagination |
| Aggregate metrics | totalSpend, impressions, clicks, conversions, avgROAS | Pending | Utility: aggregateCampaignMetrics(campaigns) |
| ROAS calculation | Provided implicitly | Pending | Utility: computeROAS(revenue, spend) |
| Bid strategy handling | CPC/CPM decision | Pending | Utility: effectiveCPMRange(campaign) |
| Multi-platform allocation | Campaign across several platforms | Pending | Validate platform overlap, cost splits |

## 5. Influencers
| Legacy Capability | Details | Status | Notes / Improvement |
|-------------------|---------|--------|---------------------|
| Create influencer deal | POST /api/media/influencers (compensation model) | Pending | Model types: Sponsored/Ambassador/Affiliate/PerformanceBased |
| Filter & sort influencer contracts | GET /api/media/influencers | Pending | Add pagination & ROI sorting |
| Compensation calculation | flatFee + perPost etc. | Pending | Utility: computeInfluencerCompensation(deal) |
| ROI & impressions aggregation | Provided | Pending | Utility: aggregateInfluencerMetrics(contracts) |
| Performance-based bonuses | Tracked partly | Pending | Add configurable bonus curve |

## 6. Monetization Settings
| Legacy Capability | Details | Status | Notes / Improvement |
|-------------------|---------|--------|---------------------|
| Fetch or create settings | GET /api/media/monetization (init if absent) | Pending | Add atomic create-if-absent transaction |
| Update strategy | PATCH /api/media/monetization (allowedFields array) | Pending | Replace ad-hoc whitelist with schema-driven diff |
| CPM maps | Per platform or tier | Pending | Utility: computeEffectiveCPM(tier, modifiers) |
| Subscription tiers | Pricing & benefits | Pending | Interface & validation module |
| Affiliate settings | Commission structures | Pending | Utility: computeAffiliateRevenue(sales, rate) |
| Churn metrics / ARR/MRR | Tracked fields | Pending | Utility: deriveARRMRR(subscriptions) |
| Profitability inference | Derived logic | Pending | Formalize with cost vs revenue threshold |

## 7. Sponsorships
| Legacy Capability | Details | Status | Notes / Improvement |
|-------------------|---------|--------|---------------------|
| Create sponsorship deal | POST /api/media/sponsorships | Pending | Validate exclusivityClause rules |
| List sponsorships by role/company | GET /api/media/sponsorships | Pending | Pagination & role filtering enhancement |
| Deal structures | Flat / Tiered / Performance-based | Pending | Utility: computeSponsorshipPayout(deal, performance) |
| Performance bonuses | Additional payouts | Pending | Shared bonus calculation pattern |
| Exclusivity enforcement | exclusivityClause | Pending | Cross-check overlapping sponsorships |

## 8. Cross-Platform & Aggregate Analytics
| Legacy Capability | Details | Status | Notes / Improvement |
|-------------------|---------|--------|---------------------|
| Revenue per follower | In platform analytics | Pending | Utility centralization |
| Engagement comparison | Across platforms | Pending | Unified normalization formula |
| ROI ranking | Highest return assets | Pending | Add tie-breaker & stability smoothing |
| Best performer determination | Based on metrics | Pending | Parameterize min sample sizes |

## 9. Derived Metric Utility Targets (New Consolidation Layer)
| Metric | Proposed Utility Function | Inputs | Output |
|--------|---------------------------|--------|--------|
| growthRate | computeGrowthRate() | currentFollowers, previousFollowers | rate:number |
| netGrowth | computeNetGrowth() | newFollowers, lostFollowers | count:number |
| churnRate | computeChurnRate() | lostFollowers, startingFollowers | rate:number |
| retentionRate | computeRetentionRate() | retainedFollowers, startingFollowers | rate:number |
| avgFollowerLifetime | estimateFollowerLifetime() | retentionRate | months:number |
| followerLTV | computeFollowerLTV() | avgRevPerFollower, retentionRate | value:number |
| revenuePerFollower | computeRevenuePerFollower() | revenue, followers | value:number |
| viralityScore | computeViralityScore() | qualityMetrics, earlyEngagement | score:number |
| contentROI | computeContentROI() | adRevenue, productionCost | roi:number |
| effectiveCPMRange | computeEffectiveCPMRange() | campaignBudget, impressions, bidStrategy | {min:number,max:number} |
| ROAS | computeROAS() | revenue, spend | ratio:number |
| influencerCompensation | computeInfluencerCompensation() | dealModel, params | amount:number |
| affiliateRevenue | computeAffiliateRevenue() | sales, commissionRate | amount:number |
| sponsorshipPayout | computeSponsorshipPayout() | dealStruct, performanceMetrics | amount:number |
| campaignMetrics | aggregateCampaignMetrics() | campaigns[] | aggregate object |
| influencerMetrics | aggregateInfluencerMetrics() | contracts[] | aggregate object |
| monetizationARRMRR | deriveARRMRR() | subscriptions[] | {arr:number,mrr:number} |
| dominantSegment | dominantSegment() | segments[] | segment object |
| growthProjection | projectGrowth() | currentFollowers, growthRate, months | projected:number |
| healthFlags | computeAudienceHealthFlags() | growthRate, churnRate, engagement | flags[] |

## Utility Coverage Matrix (as of 2025-11-25)

| Utility Function / Metric         | Legacy Parity Requirement | Exists in Codebase | File/Module                  | Status   | Notes / Gaps / Next Action |
|-----------------------------------|--------------------------|--------------------|------------------------------|----------|---------------------------|
| calculateVirality                 | Yes (basic)              | Yes                | audience.ts                  | Exists   | Advanced/algorithmic version missing |
| calculateCohortRetention          | Yes                      | Partial            | audience.ts                  | Partial  | Needs cohort-based, time-windowed version |
| normalizeCrossPlatformMetrics     | Yes                      | No                 | —                            | Missing  | Required for multi-platform analytics |
| calculateEngagementVolatility     | Yes                      | No                 | —                            | Missing  | Needed for volatility/risk metrics |
| calculateInfluencerROI            | Yes                      | Partial            | advertising.ts, influencer.ts | Partial  | Needs deterministic, multi-touch attribution |
| calculateCPM                      | Yes                      | Yes                | advertising.ts, monetization.ts | Exists   | Review for DRY/centralization |
| calculateChurnForecast            | Yes                      | No                 | —                            | Missing  | Needed for predictive analytics |
| calculateContentAging             | Yes                      | No                 | —                            | Missing  | Needed for content decay/aging metrics |
| calculateAlgorithmAdaptationScore | No (improvement)         | No                 | —                            | Missing  | New: For platform algo adaptation |
| calculateSponsorshipValue         | Yes                      | Partial            | sponsorships.ts              | Partial  | Needs deterministic, DRY version |
| calculateMonetizationRisk         | No (improvement)         | No                 | —                            | Missing  | New: For monetization volatility |
| calculateAudienceGrowth           | Yes                      | Yes                | audience.ts                  | Exists   | Review for DRY/consistency |
| calculateAudienceDemographics     | Yes                      | Yes                | audience.ts                  | Exists   | Review for completeness |
| calculatePlatformAnalytics        | Yes                      | Yes                | platform.ts                  | Exists   | Review for DRY/consistency |
| calculateAdPerformance            | Yes                      | Yes                | advertising.ts               | Exists   | Review for DRY/consistency |
| calculateSubscriptionTierMetrics  | Yes                      | Partial            | monetization.ts              | Partial  | Needs deterministic, DRY version |

**Legend:**
- Exists: Fully implemented and matches legacy/requirements
- Partial: Exists but needs improvement for determinism, DRY, or completeness
- Missing: Not present, must be implemented

**Next Actions:**
- Prioritize implementation of all Missing and Partial utilities before endpoint refactors.
- Ensure all metrics are deterministic, DRY, and composable.
- Centralize error shape and runtime validation for all utilities.
## 10. Data Model Entities (To Validate / Create or Extend)
| Entity | Legacy Fields (Observed) | Improvement Targets |
|--------|--------------------------|---------------------|
| Platform | name, type, followers, monthlyRevenue, engagementRate, algorithmScore, monetizationTier | Add createdAt, updatedAt, index on company+type |
| MediaContent | title, platforms[], productionCost, quality metrics, performanceSnapshotId | Add status (draft/published), tags[] |
| ContentPerformanceSnapshot | views, watchTime, adRevenue, engagementRate | Add initialCTR, retentionCurve[] |
| AudienceProfile | followerCounts, segmentDistributions, growthHistory[], retentionStats, projections | Add versioning, computedAt timestamp |
| AdCampaign | name, budget, spend, bidStrategy, impressions, clicks, conversions, revenue | Add status (active/paused/completed), pacing fields |
| InfluencerDeal | influencerId, modelType, flatFee, perPostFee, performanceMetrics | Add contractTerm, exclusivity, cancellationFee |
| MonetizationSettings | subscriptionTiers[], cpmMap{}, affiliateConfig, churnStats, profitability | Add revisionHistory, effectiveDate |
| SponsorshipContract | sponsorId, dealStructure, baseFee, performanceBonuses[], exclusivityClause | Add renewalDate, penaltyClauses |

## 11. Gaps / Missing / Improvement Opportunities
| Gap Type | Description | Action |
|----------|-------------|--------|
| Missing Virality Utility | No explicit virality formula | Introduce computeViralityScore() with documented factors |
| Inconsistent ROAS calc | Embedded logic | Extract computeROAS() |
| Whitelist field patching | Monetization PATCH uses manual allowedFields array | Replace with schema diff + validation layer |
| Lack of deterministic seeds | Some analytics influenced by implicit randomness | Introduce optional seed parameter across utilities |
| Sparse pagination | Listing endpoints missing robust pagination/sorting | Add standard query schema (page, perPage, sort, filter) |
| Performance snapshot duplication risk | Initialization performed inline | Provide dedicated initializer utility |
| No central constants | Thresholds (health flags etc.) hard-coded | Create mediaConstants.ts with documented tunables |
| Limited error consistency | Different error shapes per endpoint | Standardize error response contract { error: string, code: string } |
| Cross-platform normalization absent | Simple comparisons may favor large platforms | Add normalizeMetric(value, followerCount) utility |

## 12. Acceptance Criteria Alignment (Pre-Implementation)
- All rows in sections 1–8 have Status updated to Exists after implementation
- All utilities in section 9 implemented as pure deterministic functions with tests (>85% coverage)
- Data models in section 10 finalized with indexed fields & timestamps
- Gaps in section 11 each have a tracked resolution PR / commit
- Error responses standardized across all 7 media API directories
- Contract matrix will show 100% coverage for 7 backend directories vs 8 frontend components

## 13. Verification Plan
| Step | Verification Activity | Tooling |
|------|-----------------------|---------|
| 1 | Read all existing media utility + route + model files (1-EOF) | read_file batch protocol |
| 2 | Update Status column (Exists/Partial/Missing) | Manual review + matrix update |
| 3 | Generate Backend-Frontend Contract Matrix | Dual-loading protocol tools |
| 4 | Implement missing utilities & models | Code generation + tests |
| 5 | Run test suite for new media utilities | Jest tests |
| 6 | Perform DRY audit (search for duplicate logic) | grep_search for key patterns |
| 7 | Final parity confirmation | Compare with legacy docs: MEDIA_TESTING_GUIDE.md |

## 14. Risk & Mitigation
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Scope creep in utility layer | Delays core endpoints | Freeze initial utility list (section 9) before coding |
| Hidden legacy edge cases | Incorrect parity assumption | Cross-check against MEDIA_TESTING_GUIDE.md after initial reads |
| Inconsistent error handling | Frontend integration friction | Introduce shared error helper & enforce in routes |
| Performance with large analytics | Slow dashboards | Precompute + cache heavy aggregates |
| Overlapping sponsorship exclusivity | Logic conflicts | Enforce unique active sponsorship per exclusivity scope |

## 16. Backend-Frontend Contract Matrix (as of 2025-11-25)

| Endpoint                        | Method | Request Body / Params                  | Response Shape / Status | Notes |
|----------------------------------|--------|----------------------------------------|------------------------|-------|
| /api/media/platforms             | GET    | ?platformType, ?isActive, ?limit, ?offset | { platforms: [...], portfolioInsights, pagination } / 200 | Auth required, paginated, filters supported |
| /api/media/platforms             | POST   | { platformType, platformName, ... }    | { platform, calculatedMetrics } / 201 | Validates required fields, duplicate check |
| /api/media/content               | GET    | ?status, ?type, ?platform, ?minEngagement, ?sortBy, ?sortOrder, ?limit, ?offset | { content: [...], pagination, portfolioAnalytics } / 200 | Auth required, multi-filter, analytics included |
| /api/media/content               | POST   | { title, type, platforms, ... }        | { content, calculatedAnalytics } / 201 | Validates required fields, populates refs |
| /api/media/audience              | GET    | ?platform, ?segment, ?minSize, ?maxSize, ?sortBy, ?sortOrder, ?limit, ?offset | { audiences: [...], pagination, summary } / 200 | Auth required, segmentation, analytics included |
| /api/media/audience              | POST   | { platform, segment, size, ... }       | { audience, calculatedAnalytics } / 201 | Validates required fields |
| /api/media/ads                   | GET    | ?status, ?platform, ?type, ?limit, ?offset | { campaigns: [...], pagination } / 200 | Auth required, campaign analytics |
| /api/media/ads                   | POST   | { platform, name, type, biddingModel, ... } | { campaign, calculatedMetrics } / 201 | Validates required fields |
| /api/media/influencers           | GET    | ?status, ?dealType, ?niche, ?limit, ?offset | { contracts: [...], pagination } / 200 | Auth required, contract analytics |
| /api/media/influencers           | POST   | { influencer, dealType, compensation, ... } | { contract, calculatedMetrics } / 201 | Validates required fields |
| /api/media/monetization          | GET    | —                                      | { settings, calculatedMetrics, recommendations } / 200 | Auth required, creates default if missing |
| /api/media/monetization          | POST   | { isActive, defaultCPM, ... }          | { settings, calculatedMetrics, recommendations, message } / 201/200 | Upsert, flexible fields |
| /api/media/sponsorships          | GET    | ?status, ?dealStructure, ?limit, ?offset | { deals: [...], pagination } / 200 | Auth required, deal analytics |
| /api/media/sponsorships          | POST   | { sponsor, dealValue, dealStructure, duration, requiredMentions, ... } | { deal, calculatedMetrics } / 201 | Validates required fields |

**Coverage:** 100% of backend endpoints mapped. Frontend component integration pending (to be dual-loaded and mapped in next phase).

**Contract Matrix Notes:**
- All endpoints require authentication and return standardized error shape: `{ error: string }` with appropriate status code.
- Pagination, filtering, and analytics are consistently supported across GET endpoints.
- POST endpoints validate required fields and return created resource with calculated metrics/analytics.
- Status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 404 (not found), 409 (conflict), 500 (server error).
- Next: Map frontend component API usage to backend endpoints for full contract verification.
## 15. Next Actions (Sequenced)
1. Read current media utilities (Todo 2)  
2. Read all media route handlers & models (Todo 3)  
3. Populate Status column with Exists/Partial/Missing  
4. Build feature matrix from checklist (Todo 4)  
5. Define TypeScript domain interfaces (Todo 5)  
6. Draft deterministic utility function specs (Todo 6)  
7. Contract matrix (Todo 7)  
8. Test strategy & documentation outline (Todos 8–9)  
9. Assemble full FID implementation plan (Todo 10)  

---
**Footer:** Generated under ECHO v1.3.0 (GUARDIAN active). All items subject to DRY & utility-first enforcement. No code will be written prior to complete context loading & matrix verification.
