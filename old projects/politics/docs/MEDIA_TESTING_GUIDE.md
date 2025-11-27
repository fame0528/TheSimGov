# Media Industry Testing Guide

**Created:** 2025-11-18  
**Feature:** Media Industry Batch 3 - Dashboard Integration  
**FID:** FID-20251117-MEDIA-003  
**Status:** Ready for User Testing

---

## 📋 Overview

This guide provides comprehensive testing workflows for the Media Industry feature. The Media dashboard integrates four core components: Influencer Marketplace, Sponsorship Management, Ad Campaign Builder, and Monetization Settings.

**Prerequisites:**
- Registered user account
- Media industry company created (navigate to `/companies` → Create Company → Select "Media")
- Starting capital: $10,000 seed - $11,500 startup costs = **$0 remaining** (requires capital injection for testing)

**Capital Injection for Testing:**
```bash
# After creating Media company, run:
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(async () => { const company = await mongoose.connection.collection('companies').findOne({ industry: 'Media' }); if (company) { await mongoose.connection.collection('companies').updateOne({ _id: company._id }, { \$set: { cash: 50000 } }); await mongoose.connection.collection('transactions').insertOne({ type: 'investment', amount: 50000, description: 'Testing capital injection', company: company._id, createdAt: new Date() }); console.log('✅ Company cash updated to $50,000'); } await mongoose.disconnect(); });"
```

---

## 🎯 Testing Workflows

### 1. Influencer Marketplace Testing

**Objective:** Verify influencer browsing, filtering, hiring workflow, and deal tracking.

#### Test Case 1.1: Browse Influencers
1. Navigate to `/media` (Media dashboard)
2. Click "Influencer Marketplace" tab
3. **Expected:** See list of available influencers with stats:
   - Profile picture placeholder
   - Influencer name
   - Niche/category
   - Follower count
   - Engagement rate (%)
   - Price per post ($)
4. **Verify:** At least 10+ influencers displayed
5. **Verify:** Influencers sorted by follower count (descending)

#### Test Case 1.2: Filter Influencers
1. Use niche filter dropdown (e.g., "Tech", "Fashion", "Gaming")
2. **Expected:** Influencer list updates to show only selected niche
3. Use follower count slider (e.g., 10k-100k)
4. **Expected:** List updates to show influencers within range
5. Use engagement rate filter (e.g., >5%)
6. **Expected:** List shows only high-engagement influencers
7. Reset filters
8. **Expected:** Full list restored

#### Test Case 1.3: Hire Influencer (3-Step Wizard)
1. Click "Hire" button on an influencer
2. **Step 1 - Deal Type:**
   - Select deal type: One-time / Monthly / Quarterly
   - Enter number of posts (e.g., 5)
   - **Expected:** Total cost calculated and displayed
3. **Step 2 - Content Specifications:**
   - Enter content guidelines (e.g., "Promote our new streaming platform")
   - Select platforms (Instagram, TikTok, YouTube)
   - Set hashtags/mentions
4. **Step 3 - Review & Confirm:**
   - **Expected:** Summary shows:
     - Influencer name + stats
     - Deal terms (posts, duration, cost)
     - Content requirements
   - Click "Confirm Deal"
5. **Expected:** Success toast notification
6. **Expected:** Company cash deducted by deal cost
7. **Verify API:** GET `/api/media/influencers` returns new deal
8. **Verify Database:** `influencerdeals` collection has new document

#### Test Case 1.4: Track Active Deals
1. After hiring influencer, refresh dashboard
2. **Expected:** Stats card shows "Influencer Deals: 1"
3. Navigate to Sponsorships tab, then back to Influencer Marketplace
4. **Expected:** Previously hired influencer marked as "Active Deal"

---

### 2. Sponsorship Dashboard Testing

**Objective:** Verify brand sponsorship deal management, deliverable tracking, and payment processing.

#### Test Case 2.1: View Sponsorships
1. Navigate to "Sponsorships" tab
2. **Expected:** Table displays all sponsorship deals:
   - Brand name
   - Deal value ($)
   - Duration (months)
   - Status (Active/Pending/Completed)
   - Deliverables progress (e.g., "3/5 completed")
3. **Verify:** Active deals highlighted with green badge
4. **Verify:** Completed deals show checkmark icon

#### Test Case 2.2: Create New Sponsorship (Manual Test Data)
**Note:** Currently no UI for creating sponsorships (backend API exists). Test via API:
```bash
curl -X POST http://localhost:3000/api/media/sponsorships \
  -H "Content-Type: application/json" \
  -d '{
    "company": "<COMPANY_ID>",
    "brandName": "Nike",
    "dealValue": 25000,
    "duration": 6,
    "deliverables": ["Instagram post", "YouTube video", "Blog article"],
    "status": "Active"
  }'
```

#### Test Case 2.3: Track Deliverables
1. Click "View Details" on an active sponsorship
2. **Expected:** Modal/expanded view shows:
   - Full deliverables list with checkboxes
   - Completion percentage
   - Next milestone date
   - Payment schedule
3. Mark a deliverable as complete (checkbox)
4. **Expected:** Progress bar updates
5. **Expected:** Completion percentage recalculates
6. **Verify:** If all deliverables complete → Status changes to "Completed"

#### Test Case 2.4: Payment Tracking
1. View sponsorship with payment schedule
2. **Expected:** Payment milestones displayed:
   - Initial payment (30% upfront)
   - Milestone payments (40% mid-way)
   - Final payment (30% on completion)
3. **Verify:** Payments automatically processed when milestones hit
4. **Verify:** Company cash increases on payment receipt
5. **Verify:** Transaction log records sponsorship revenue

---

### 3. Ad Campaign Builder Testing

**Objective:** Verify multi-platform ad campaign creation, targeting, budget management, and ROAS tracking.

#### Test Case 3.1: Create Ad Campaign (Wizard Flow)
1. Navigate to "Ad Campaigns" tab
2. Click "Create New Campaign" button
3. **Step 1 - Campaign Basics:**
   - Enter campaign name (e.g., "Q1 Brand Awareness")
   - Select objective: Awareness / Consideration / Conversion
   - Set start/end dates
4. **Step 2 - Platform Selection:**
   - Select platforms: Facebook / Instagram / TikTok / YouTube / Google Ads
   - **Expected:** Each platform shows:
     - Audience reach estimate
     - CPM range
     - Minimum budget
   - Allocate budget per platform (e.g., Facebook: $5k, Instagram: $3k)
5. **Step 3 - Targeting:**
   - Set demographics: Age range, gender, location
   - Select interests/behaviors
   - **Expected:** Audience size estimate updates in real-time
6. **Step 4 - Creative Upload:**
   - Upload ad creatives (images/videos)
   - Enter ad copy and headlines
   - Preview ad placement on each platform
7. **Step 5 - Budget & Bidding:**
   - Set total campaign budget (sum of platform allocations)
   - Choose bidding strategy: CPC / CPM / CPA
   - Set daily budget caps
   - **Expected:** ROAS calculator shows projected return
8. **Review & Launch:**
   - **Expected:** Campaign summary displays all settings
   - Click "Launch Campaign"
9. **Expected:** Success notification
10. **Verify:** Company cash deducted by total budget
11. **Verify API:** GET `/api/ecommerce/ads` returns new campaign

#### Test Case 3.2: Monitor Campaign Performance
1. After creating campaign, view campaign list
2. **Expected:** Campaign card shows:
   - Campaign name + status (Running/Paused/Completed)
   - Budget spent / Total budget
   - Impressions count
   - Clicks count
   - CTR (Click-Through Rate %)
   - ROAS (Return on Ad Spend)
3. Click "View Analytics"
4. **Expected:** Detailed dashboard with:
   - Performance graphs (impressions/clicks over time)
   - Platform breakdown (which platform performing best)
   - Demographic insights
   - Creative performance comparison

#### Test Case 3.3: Pause/Resume Campaign
1. Click "Pause" on running campaign
2. **Expected:** Status changes to "Paused"
3. **Verify:** No further budget spend while paused
4. Click "Resume"
5. **Expected:** Status back to "Running"

#### Test Case 3.4: Budget Adjustment
1. Click "Edit Budget" on active campaign
2. Increase total budget (e.g., $10k → $15k)
3. **Expected:** Company cash deducted by difference ($5k)
4. **Verify:** Campaign continues with new budget
5. **Verify:** Transaction log records budget adjustment

---

### 4. Monetization Settings Testing

**Objective:** Verify CPM rate configuration, revenue strategy selection, and analytics display.

#### Test Case 4.1: View Current Monetization Settings
1. Navigate to "Monetization" tab
2. **Expected:** Dashboard displays:
   - Current CPM rate (base rate per 1,000 views)
   - Active revenue strategy (Ads / Subscriptions / Hybrid)
   - Demographic multipliers (e.g., 18-24: 1.2x, 25-34: 1.5x)
   - Monthly Recurring Revenue (MRR)
   - Annual Recurring Revenue (ARR)

#### Test Case 4.2: Configure CPM Rates
1. Click "Edit CPM Settings"
2. **Expected:** Form displays:
   - Base CPM rate slider ($1 - $50)
   - Premium content toggle (2x multiplier)
   - Geographic multipliers (US: 2.5x, EU: 2.0x, etc.)
3. Adjust base CPM from $5 → $10
4. Enable premium content toggle
5. Click "Save Settings"
6. **Expected:** Success notification
7. **Verify:** Dashboard reflects new CPM rate
8. **Verify API:** GET `/api/media/monetization?companyId=<ID>` returns updated settings

#### Test Case 4.3: Select Revenue Strategy
1. View available strategies:
   - **Ad-Supported:** Free content, 100% ad revenue
   - **Subscription:** Paid content, no ads, recurring revenue
   - **Hybrid:** Freemium model, ads + subscription tiers
2. Click "Switch to Subscription Strategy"
3. **Expected:** Modal shows:
   - Projected subscriber count based on reputation
   - Subscription price options ($5, $10, $15/month)
   - Churn rate estimate
   - MRR/ARR projections
4. Set subscription price: $9.99/month
5. Click "Activate Subscription Model"
6. **Expected:** Revenue strategy updates
7. **Verify:** Dashboard now shows subscriber count and MRR

#### Test Case 4.4: View Monetization Analytics
1. Scroll to analytics section
2. **Expected:** Charts display:
   - Revenue over time (last 30 days)
   - Revenue breakdown by source (Ads / Subscriptions / Sponsorships)
   - Top-performing content types
   - Audience demographics contributing most revenue
3. Filter by date range (e.g., Last 7 days, Last quarter)
4. **Expected:** Charts update with filtered data

---

## 🔍 Integration Testing Checklist

### Cross-Component Integration
- [ ] **Influencer → Sponsorships:** Hiring influencer creates sponsorship-like deal
- [ ] **Ads → Monetization:** Campaign spend affects company cash, revenue tracked in monetization
- [ ] **Sponsorships → Monetization:** Sponsorship payments increase MRR/ARR
- [ ] **All → Dashboard Stats:** Stats cards update in real-time after any action

### API Endpoint Verification
- [ ] `GET /api/media/influencers` - List influencer deals
- [ ] `POST /api/media/influencers` - Create influencer deal
- [ ] `GET /api/media/sponsorships` - List sponsorships
- [ ] `POST /api/media/sponsorships` - Create sponsorship
- [ ] `PUT /api/media/sponsorships/:id` - Update sponsorship deliverables
- [ ] `GET /api/ecommerce/ads` - List ad campaigns (shared with E-Commerce)
- [ ] `POST /api/ecommerce/ads` - Create ad campaign
- [ ] `PUT /api/ecommerce/ads/:id` - Update campaign (pause/resume/budget)
- [ ] `GET /api/media/monetization?companyId=<ID>` - Get monetization settings
- [ ] `PUT /api/media/monetization` - Update CPM/strategy settings
- [ ] `GET /api/companies/my-companies` - Fetch user's companies (used by dashboard)

### Database Validation
- [ ] `influencerdeals` collection stores hired influencers
- [ ] `sponsorships` collection stores brand deals
- [ ] `adcampaigns` collection stores advertising campaigns
- [ ] `monetizationsettings` collection stores CPM/strategy config
- [ ] `transactions` collection logs all financial operations
- [ ] `companies` collection cash field updates correctly

### Authentication & Authorization
- [ ] Unauthenticated users redirected to `/login`
- [ ] Users can only access their own companies' data
- [ ] API endpoints require valid session (NextAuth)
- [ ] No data leakage between different companies

### Error Handling
- [ ] Insufficient funds → Clear error message (e.g., "Cannot hire influencer: insufficient cash")
- [ ] API failures → User-friendly error toast
- [ ] Network errors → Retry mechanism or fallback UI
- [ ] Invalid form inputs → Validation messages before submission

### Performance
- [ ] Dashboard loads in < 2 seconds
- [ ] Stats cards fetch data in parallel (not sequential)
- [ ] Component tabs lazy-load content (not all at once)
- [ ] Large data sets (100+ influencers) paginated properly

---

## 🐛 Known Limitations & Future Enhancements

### Current Limitations
1. **No Influencer Creation UI:** Influencers are currently mock/seed data. Future: Admin panel to add influencers or NPC-generated influencers.
2. **No Sponsorship Creation UI:** Sponsorships created via API only. Future: "Create Sponsorship Deal" wizard in dashboard.
3. **Shared Ad Campaigns:** Uses E-Commerce ad system (`/api/ecommerce/ads`). Future: Media-specific ad types (e.g., native ads, influencer collaborations).
4. **Static ROAS Calculation:** ROAS currently estimated, not real-time. Future: Integrate with game analytics for actual conversion tracking.
5. **No Real-Time Updates:** Stats cards require manual refresh. Future: WebSocket/polling for live updates.

### Planned Enhancements (Future FIDs)
- **Phase 4:** Influencer reputation system (loyalty, past performance ratings)
- **Phase 5:** Content calendar integration (schedule posts, track publishing)
- **Phase 6:** Multi-company collaboration (co-sponsorships, cross-promotion)
- **Phase 7:** Advanced analytics (A/B testing, cohort analysis, predictive revenue)
- **Phase 8:** NPC influencers with AI-generated profiles and dynamic pricing

---

## ✅ Testing Completion Checklist

### Pre-Testing Setup
- [ ] Database: `power` database configured in `.env`
- [ ] Server: Next.js dev server running (`npm run dev`)
- [ ] Account: Fresh user registered at `/register`
- [ ] Company: Media company created with capital injection ($50k)

### Phase 2: Manual Testing
- [ ] Test Case 1.1-1.4: Influencer Marketplace (all passing)
- [ ] Test Case 2.1-2.4: Sponsorship Dashboard (all passing)
- [ ] Test Case 3.1-3.4: Ad Campaign Builder (all passing)
- [ ] Test Case 4.1-4.4: Monetization Settings (all passing)

### Integration Verification
- [ ] All API endpoints functional (11 total)
- [ ] Database collections populated correctly
- [ ] Authentication/authorization working
- [ ] Error handling graceful
- [ ] Performance acceptable (< 2s load times)

### Phase 3: Documentation
- [x] Testing guide created (`MEDIA_TESTING_GUIDE.md`)
- [ ] Completion report generated
- [ ] Known issues documented
- [ ] Future enhancements listed

### Final Sign-Off
- [ ] All critical workflows tested and passing
- [ ] No blocking bugs discovered
- [ ] Documentation comprehensive and accurate
- [ ] Feature ready for production deployment

---

## 📝 Bug Report Template

If issues discovered during testing, use this format:

```markdown
### Bug: [Brief Description]

**Severity:** Critical / High / Medium / Low  
**Component:** Influencer Marketplace / Sponsorships / Ads / Monetization  
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:** [What should happen]  
**Actual Behavior:** [What actually happens]  
**Error Message:** [If any]  
**Browser/Environment:** [Chrome/Firefox/Safari, OS]  
**Screenshot:** [If applicable]

**Proposed Fix:** [Optional - suggest solution]
```

---

**Testing Status:** ⏳ Awaiting User Testing  
**Last Updated:** 2025-11-18  
**Tester:** [Your Name]  
**ECHO Version:** v1.0.0

---

*This guide is part of FID-20251117-MEDIA-003 Media Industry Batch 3 implementation.*
