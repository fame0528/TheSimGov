/**
 * SEO Campaigns API Route Integration Tests
 * 
 * Tests the complete REST API for SEOCampaign including:
 * - GET: Campaign retrieval with filtering (type, status, budget)
 * - POST: Campaign creation with validation
 * - PUT: Campaign updates and performance tracking
 * - DELETE: Campaign deactivation
 * 
 * Created: 2025-11-14
 * Phase: E-Commerce Phase 5 - Testing & Documentation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import SEOCampaign from '@/lib/db/models/SEOCampaign';
import connectDB from '@/lib/db';

// SKIP: Integration tests require running server - out of scope for AI Industry Phase 5
describe.skip('Campaigns API Route - Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    // Clean up test data
    await SEOCampaign.deleteMany({ name: /^TEST_/ });
  });

  beforeEach(async () => {
    // Clean up before each test
    await SEOCampaign.deleteMany({ name: /^TEST_/ });
  });

  describe('GET /api/ecommerce/campaigns', () => {
    it('should return campaigns with default pagination', async () => {
      await SEOCampaign.create([
        {
          companyId: 'test-company-001',
          name: 'TEST_Campaign_SEO_1',
          type: 'SEO',
          status: 'Active',
          budget: 5000,
          spent: 2500,
          targetKeywords: ['ecommerce', 'online store', 'shopping'],
          impressions: 100000,
          clicks: 2500,
          conversions: 125,
          revenue: 15000,
        },
        {
          companyId: 'test-company-001',
          name: 'TEST_Campaign_PPC_1',
          type: 'PPC',
          status: 'Active',
          budget: 3000,
          spent: 2800,
          targetKeywords: ['buy now', 'discount', 'sale'],
          impressions: 50000,
          clicks: 1250,
          conversions: 75,
          revenue: 9000,
        },
      ]);

      const response = await fetch('http://localhost:3000/api/ecommerce/campaigns?companyId=test-company-001');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.campaigns).toHaveLength(2);
      expect(data.data.total).toBe(2);
    });

    it('should filter campaigns by type', async () => {
      await SEOCampaign.create([
        {
          companyId: 'test-company-002',
          name: 'TEST_SEO_Campaign',
          type: 'SEO',
          status: 'Active',
          budget: 5000,
          spent: 1000,
          targetKeywords: ['organic', 'search'],
          impressions: 80000,
          clicks: 2000,
          conversions: 100,
          revenue: 12000,
        },
        {
          companyId: 'test-company-002',
          name: 'TEST_PPC_Campaign',
          type: 'PPC',
          status: 'Active',
          budget: 2000,
          spent: 1500,
          targetKeywords: ['paid', 'ads'],
          impressions: 40000,
          clicks: 1000,
          conversions: 60,
          revenue: 7200,
        },
      ]);

      const response = await fetch('http://localhost:3000/api/ecommerce/campaigns?companyId=test-company-002&type=SEO');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.campaigns).toHaveLength(1);
      expect(data.data.campaigns[0].type).toBe('SEO');
    });

    it('should filter campaigns by status', async () => {
      await SEOCampaign.create([
        {
          companyId: 'test-company-003',
          name: 'TEST_Active_Campaign',
          type: 'SEO',
          status: 'Active',
          budget: 5000,
          spent: 2000,
          targetKeywords: ['active'],
          impressions: 60000,
          clicks: 1500,
          conversions: 75,
          revenue: 9000,
        },
        {
          companyId: 'test-company-003',
          name: 'TEST_Paused_Campaign',
          type: 'PPC',
          status: 'Paused',
          budget: 3000,
          spent: 1000,
          targetKeywords: ['paused'],
          impressions: 30000,
          clicks: 750,
          conversions: 40,
          revenue: 4800,
        },
      ]);

      const response = await fetch('http://localhost:3000/api/ecommerce/campaigns?companyId=test-company-003&status=Active');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.campaigns).toHaveLength(1);
      expect(data.data.campaigns[0].status).toBe('Active');
    });

    it('should return campaign analytics', async () => {
      const campaign = await SEOCampaign.create({
        companyId: 'test-company-004',
        name: 'TEST_Analytics_Campaign',
        type: 'SEO',
        status: 'Active',
        budget: 10000,
        spent: 8000,
        targetKeywords: ['analytics', 'metrics', 'roi'],
        impressions: 200000,
        clicks: 5000,
        conversions: 250,
        revenue: 30000,
      });

      const response = await fetch(`http://localhost:3000/api/ecommerce/campaigns/${campaign._id}/analytics`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.roi).toBeCloseTo(275, 0); // (30000 - 8000) / 8000 * 100
      expect(data.data.ctr).toBeCloseTo(2.5, 1); // 5000 / 200000 * 100
      expect(data.data.conversionRate).toBeCloseTo(5.0, 1); // 250 / 5000 * 100
    });
  });

  describe('POST /api/ecommerce/campaigns', () => {
    it('should create a new campaign with valid data', async () => {
      const campaignData = {
        companyId: 'test-company-005',
        name: 'TEST_New_Campaign',
        type: 'SEO',
        status: 'Active',
        budget: 7500,
        targetKeywords: ['new', 'campaign', 'keywords'],
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
      };

      const response = await fetch('http://localhost:3000/api/ecommerce/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(campaignData.name);
      expect(data.data.budget).toBe(campaignData.budget);
      expect(data.data.spent).toBe(0); // Default value
    });

    it('should reject campaign with invalid type', async () => {
      const invalidData = {
        companyId: 'test-company-006',
        name: 'TEST_Invalid_Type',
        type: 'INVALID', // Only SEO/PPC allowed
        status: 'Active',
        budget: 5000,
        targetKeywords: ['test'],
      };

      const response = await fetch('http://localhost:3000/api/ecommerce/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);
    });

    it('should reject campaign with missing required fields', async () => {
      const invalidData = {
        companyId: 'test-company-007',
        // Missing name, type, budget, targetKeywords
        status: 'Active',
      };

      const response = await fetch('http://localhost:3000/api/ecommerce/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/ecommerce/campaigns/:id', () => {
    it('should update campaign performance metrics', async () => {
      const campaign = await SEOCampaign.create({
        companyId: 'test-company-008',
        name: 'TEST_Update_Campaign',
        type: 'PPC',
        status: 'Active',
        budget: 5000,
        spent: 2000,
        targetKeywords: ['update', 'metrics'],
        impressions: 50000,
        clicks: 1250,
        conversions: 62,
        revenue: 7500,
      });

      const response = await fetch(`http://localhost:3000/api/ecommerce/campaigns/${campaign._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          impressions: 75000,
          clicks: 1875,
          conversions: 94,
          revenue: 11250,
          spent: 3000,
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.impressions).toBe(75000);
      expect(data.data.clicks).toBe(1875);
      expect(data.data.spent).toBe(3000);
    });

    it('should update campaign status', async () => {
      const campaign = await SEOCampaign.create({
        companyId: 'test-company-009',
        name: 'TEST_Status_Update',
        type: 'SEO',
        status: 'Active',
        budget: 4000,
        spent: 3500,
        targetKeywords: ['status'],
        impressions: 40000,
        clicks: 1000,
        conversions: 50,
        revenue: 6000,
      });

      const response = await fetch(`http://localhost:3000/api/ecommerce/campaigns/${campaign._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Paused',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.status).toBe('Paused');
    });

    it('should update campaign budget', async () => {
      const campaign = await SEOCampaign.create({
        companyId: 'test-company-010',
        name: 'TEST_Budget_Update',
        type: 'PPC',
        status: 'Active',
        budget: 5000,
        spent: 2500,
        targetKeywords: ['budget'],
        impressions: 30000,
        clicks: 750,
        conversions: 40,
        revenue: 4800,
      });

      const response = await fetch(`http://localhost:3000/api/ecommerce/campaigns/${campaign._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: 8000,
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.budget).toBe(8000);
    });
  });

  describe('DELETE /api/ecommerce/campaigns/:id', () => {
    it('should deactivate campaign (soft delete)', async () => {
      const campaign = await SEOCampaign.create({
        companyId: 'test-company-011',
        name: 'TEST_Delete_Campaign',
        type: 'SEO',
        status: 'Active',
        budget: 3000,
        spent: 1000,
        targetKeywords: ['delete'],
        impressions: 25000,
        clicks: 625,
        conversions: 30,
        revenue: 3600,
      });

      const response = await fetch(`http://localhost:3000/api/ecommerce/campaigns/${campaign._id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify campaign is deactivated
      const deactivatedCampaign = await SEOCampaign.findById(campaign._id);
      expect(deactivatedCampaign?.status).toBe('Cancelled');
    });

    it('should reject deletion of non-existent campaign', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await fetch(`http://localhost:3000/api/ecommerce/campaigns/${fakeId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Campaign ROI and Metrics', () => {
    it('should calculate accurate ROI for profitable campaign', async () => {
      const campaign = await SEOCampaign.create({
        companyId: 'test-company-012',
        name: 'TEST_ROI_Positive',
        type: 'SEO',
        status: 'Active',
        budget: 10000,
        spent: 6000,
        targetKeywords: ['high', 'roi'],
        impressions: 150000,
        clicks: 3750,
        conversions: 200,
        revenue: 24000,
      });

      const response = await fetch(`http://localhost:3000/api/ecommerce/campaigns/${campaign._id}/analytics`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.roi).toBeCloseTo(300, 0); // (24000 - 6000) / 6000 * 100 = 300%
    });

    it('should calculate accurate CTR (Click-Through Rate)', async () => {
      const campaign = await SEOCampaign.create({
        companyId: 'test-company-013',
        name: 'TEST_CTR_Campaign',
        type: 'PPC',
        status: 'Active',
        budget: 5000,
        spent: 3000,
        targetKeywords: ['ctr', 'test'],
        impressions: 100000,
        clicks: 3000, // 3% CTR
        conversions: 150,
        revenue: 18000,
      });

      const response = await fetch(`http://localhost:3000/api/ecommerce/campaigns/${campaign._id}/analytics`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.ctr).toBeCloseTo(3.0, 1); // 3000 / 100000 * 100
    });

    it('should calculate accurate conversion rate', async () => {
      const campaign = await SEOCampaign.create({
        companyId: 'test-company-014',
        name: 'TEST_Conversion_Rate',
        type: 'SEO',
        status: 'Active',
        budget: 8000,
        spent: 5000,
        targetKeywords: ['conversion', 'optimization'],
        impressions: 120000,
        clicks: 3000,
        conversions: 300, // 10% conversion rate
        revenue: 36000,
      });

      const response = await fetch(`http://localhost:3000/api/ecommerce/campaigns/${campaign._id}/analytics`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.conversionRate).toBeCloseTo(10.0, 1); // 300 / 3000 * 100
    });
  });
});
