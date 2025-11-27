/**
 * Reviews API Route Integration Tests
 * 
 * Tests the complete REST API for CustomerReview including:
 * - GET: Review retrieval with filtering (rating, verified, status)
 * - POST: Review submission with validation
 * - PUT: Review moderation (approve/reject), voting, reporting
 * - DELETE: Review deletion
 * 
 * Created: 2025-11-14
 * Phase: E-Commerce Phase 5 - Testing & Documentation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import CustomerReview from '@/lib/db/models/CustomerReview';
import connectDB from '@/lib/db';

// SKIP: Integration tests require running server - out of scope for AI Industry Phase 5
describe.skip('Reviews API Route - Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    // Clean up test data
    await CustomerReview.deleteMany({ reviewerName: /^TEST_/ });
  });

  beforeEach(async () => {
    // Clean up before each test
    await CustomerReview.deleteMany({ reviewerName: /^TEST_/ });
  });

  describe('GET /api/ecommerce/reviews', () => {
    it('should return reviews with default pagination', async () => {
      await CustomerReview.create([
        {
          companyId: 'test-company-001',
          productId: 'test-product-001',
          customerId: 'test-customer-001',
          reviewerName: 'TEST_Reviewer_1',
          rating: 5,
          title: 'Great product!',
          comment: 'Really satisfied with this purchase.',
          isVerifiedPurchase: true,
          moderationStatus: 'Approved',
        },
        {
          companyId: 'test-company-001',
          productId: 'test-product-001',
          customerId: 'test-customer-002',
          reviewerName: 'TEST_Reviewer_2',
          rating: 3,
          title: 'Average',
          comment: 'It works but nothing special.',
          isVerifiedPurchase: false,
          moderationStatus: 'Approved',
        },
      ]);

      const response = await fetch('http://localhost:3000/api/ecommerce/reviews?companyId=test-company-001&productId=test-product-001');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.reviews).toHaveLength(2);
      expect(data.data.total).toBe(2);
    });

    it('should filter reviews by rating', async () => {
      await CustomerReview.create([
        {
          companyId: 'test-company-002',
          productId: 'test-product-002',
          customerId: 'test-customer-003',
          reviewerName: 'TEST_Reviewer_3',
          rating: 5,
          title: 'Excellent!',
          comment: 'Best purchase ever.',
          moderationStatus: 'Approved',
        },
        {
          companyId: 'test-company-002',
          productId: 'test-product-002',
          customerId: 'test-customer-004',
          reviewerName: 'TEST_Reviewer_4',
          rating: 2,
          title: 'Disappointing',
          comment: 'Not worth the price.',
          moderationStatus: 'Approved',
        },
      ]);

      const response = await fetch('http://localhost:3000/api/ecommerce/reviews?companyId=test-company-002&productId=test-product-002&rating=5');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.reviews).toHaveLength(1);
      expect(data.data.reviews[0].rating).toBe(5);
    });

    it('should filter reviews by verified purchase status', async () => {
      await CustomerReview.create([
        {
          companyId: 'test-company-003',
          productId: 'test-product-003',
          customerId: 'test-customer-005',
          reviewerName: 'TEST_Reviewer_5',
          rating: 4,
          title: 'Good',
          comment: 'Actually bought this.',
          isVerifiedPurchase: true,
          moderationStatus: 'Approved',
        },
        {
          companyId: 'test-company-003',
          productId: 'test-product-003',
          customerId: 'test-customer-006',
          reviewerName: 'TEST_Reviewer_6',
          rating: 4,
          title: 'Good too',
          comment: 'Did not buy this.',
          isVerifiedPurchase: false,
          moderationStatus: 'Approved',
        },
      ]);

      const response = await fetch('http://localhost:3000/api/ecommerce/reviews?companyId=test-company-003&productId=test-product-003&verifiedOnly=true');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.reviews).toHaveLength(1);
      expect(data.data.reviews[0].isVerifiedPurchase).toBe(true);
    });

    it('should filter reviews by moderation status', async () => {
      await CustomerReview.create([
        {
          companyId: 'test-company-004',
          productId: 'test-product-004',
          customerId: 'test-customer-007',
          reviewerName: 'TEST_Reviewer_7',
          rating: 4,
          title: 'Pending Review',
          comment: 'Waiting for approval.',
          moderationStatus: 'Pending',
        },
        {
          companyId: 'test-company-004',
          productId: 'test-product-004',
          customerId: 'test-customer-008',
          reviewerName: 'TEST_Reviewer_8',
          rating: 5,
          title: 'Approved Review',
          comment: 'Already approved.',
          moderationStatus: 'Approved',
        },
      ]);

      const response = await fetch('http://localhost:3000/api/ecommerce/reviews?companyId=test-company-004&productId=test-product-004&status=Pending');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.reviews).toHaveLength(1);
      expect(data.data.reviews[0].moderationStatus).toBe('Pending');
    });
  });

  describe('POST /api/ecommerce/reviews', () => {
    it('should create a new review with valid data', async () => {
      const reviewData = {
        companyId: 'test-company-005',
        productId: 'test-product-005',
        customerId: 'test-customer-009',
        reviewerName: 'TEST_Reviewer_9',
        rating: 5,
        title: 'Amazing product!',
        comment: 'Exceeded all my expectations. Highly recommend!',
        isVerifiedPurchase: true,
      };

      const response = await fetch('http://localhost:3000/api/ecommerce/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.reviewerName).toBe(reviewData.reviewerName);
      expect(data.data.rating).toBe(reviewData.rating);
      expect(data.data.moderationStatus).toBe('Pending'); // New reviews pending by default
    });

    it('should reject review with invalid rating (out of 1-5 range)', async () => {
      const invalidData = {
        companyId: 'test-company-006',
        productId: 'test-product-006',
        customerId: 'test-customer-010',
        reviewerName: 'TEST_Reviewer_10',
        rating: 6, // Invalid: must be 1-5
        title: 'Invalid rating',
        comment: 'This should fail.',
      };

      const response = await fetch('http://localhost:3000/api/ecommerce/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);
    });

    it('should reject review with missing required fields', async () => {
      const invalidData = {
        companyId: 'test-company-007',
        productId: 'test-product-007',
        // Missing customerId, reviewerName, rating, title, comment
      };

      const response = await fetch('http://localhost:3000/api/ecommerce/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/ecommerce/reviews/:id', () => {
    it('should approve pending review', async () => {
      const review = await CustomerReview.create({
        companyId: 'test-company-008',
        productId: 'test-product-008',
        customerId: 'test-customer-011',
        reviewerName: 'TEST_Reviewer_11',
        rating: 4,
        title: 'Good product',
        comment: 'Worth the money.',
        moderationStatus: 'Pending',
      });

      const response = await fetch(`http://localhost:3000/api/ecommerce/reviews/${review._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'moderate',
          moderationStatus: 'Approved',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.moderationStatus).toBe('Approved');
    });

    it('should reject review with reason', async () => {
      const review = await CustomerReview.create({
        companyId: 'test-company-009',
        productId: 'test-product-009',
        customerId: 'test-customer-012',
        reviewerName: 'TEST_Reviewer_12',
        rating: 1,
        title: 'Spam review',
        comment: 'This is clearly spam content.',
        moderationStatus: 'Pending',
      });

      const response = await fetch(`http://localhost:3000/api/ecommerce/reviews/${review._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'moderate',
          moderationStatus: 'Rejected',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.moderationStatus).toBe('Rejected');
    });

    it('should mark review as helpful', async () => {
      const review = await CustomerReview.create({
        companyId: 'test-company-010',
        productId: 'test-product-010',
        customerId: 'test-customer-013',
        reviewerName: 'TEST_Reviewer_13',
        rating: 5,
        title: 'Helpful review',
        comment: 'Very detailed and useful.',
        moderationStatus: 'Approved',
        helpfulCount: 0,
      });

      const response = await fetch(`http://localhost:3000/api/ecommerce/reviews/${review._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          voteType: 'helpful',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.helpfulCount).toBe(1);
    });

    it('should mark review as not helpful', async () => {
      const review = await CustomerReview.create({
        companyId: 'test-company-011',
        productId: 'test-product-011',
        customerId: 'test-customer-014',
        reviewerName: 'TEST_Reviewer_14',
        rating: 2,
        title: 'Not helpful',
        comment: 'Vague and unclear.',
        moderationStatus: 'Approved',
        notHelpfulCount: 0,
      });

      const response = await fetch(`http://localhost:3000/api/ecommerce/reviews/${review._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          voteType: 'not_helpful',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.notHelpfulCount).toBe(1);
    });

    it('should report review and auto-unpublish after 5+ reports', async () => {
      const review = await CustomerReview.create({
        companyId: 'test-company-012',
        productId: 'test-product-012',
        customerId: 'test-customer-015',
        reviewerName: 'TEST_Reviewer_15',
        rating: 1,
        title: 'Abusive content',
        comment: 'This should be reported.',
        moderationStatus: 'Approved',
        reportCount: 4, // One more will trigger auto-unpublish
      });

      const response = await fetch(`http://localhost:3000/api/ecommerce/reviews/${review._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.reportCount).toBe(5);
      expect(data.data.moderationStatus).toBe('Pending'); // Auto-unpublished
    });
  });

  describe('DELETE /api/ecommerce/reviews/:id', () => {
    it('should delete review permanently', async () => {
      const review = await CustomerReview.create({
        companyId: 'test-company-013',
        productId: 'test-product-013',
        customerId: 'test-customer-016',
        reviewerName: 'TEST_Reviewer_16',
        rating: 3,
        title: 'To be deleted',
        comment: 'This review will be removed.',
        moderationStatus: 'Approved',
      });

      const response = await fetch(`http://localhost:3000/api/ecommerce/reviews/${review._id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify review is actually deleted
      const deletedReview = await CustomerReview.findById(review._id);
      expect(deletedReview).toBeNull();
    });

    it('should reject deletion of non-existent review', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await fetch(`http://localhost:3000/api/ecommerce/reviews/${fakeId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
    });
  });
});
