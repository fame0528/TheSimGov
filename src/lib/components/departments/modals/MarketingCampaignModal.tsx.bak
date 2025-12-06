/**
 * @fileoverview Marketing Campaign Modal
 * @module lib/components/departments/modals/MarketingCampaignModal
 * 
 * OVERVIEW:
 * Modal form for launching marketing campaigns.
 * Campaign type selection, budget allocation, ROI projection.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { FormField } from '@/lib/components/shared';
import type { z } from 'zod';

// Campaign type matching API validation
type CampaignType = 'Digital' | 'Print' | 'TV' | 'Social Media' | 'Event';

interface CampaignInput {
  name: string;
  campaignType: CampaignType;
  budget: number;
  duration: number;
  targetAudience: string;
}

export interface MarketingCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CAMPAIGN_TYPES = [
  { value: 'Digital', label: 'Digital Marketing' },
  { value: 'Print', label: 'Print Media' },
  { value: 'TV', label: 'Television' },
  { value: 'Social Media', label: 'Social Media' },
  { value: 'Event', label: 'Event Marketing' },
];

export function MarketingCampaignModal({
  isOpen,
  onClose,
  onSuccess,
}: MarketingCampaignModalProps) {
  const [formData, setFormData] = useState<CampaignInput>({
    name: '',
    campaignType: 'Digital',
    budget: 25000,
    duration: 8,
    targetAudience: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Estimate ROI based on campaign type
  const estimateROI = () => {
    const roiMultipliers: Record<CampaignType, number> = {
      'Digital': 3.5,
      'Print': 1.8,
      'TV': 2.2,
      'Social Media': 4.0,
      'Event': 2.8,
    };
    
    return formData.budget * roiMultipliers[formData.campaignType];
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setErrors({});

      // Basic validation
      if (!formData.name) throw new Error('Campaign name is required');
      if (!formData.targetAudience) throw new Error('Target audience is required');
      if (formData.budget < 5000) throw new Error('Minimum budget is $5,000');
      if (formData.duration < 1) throw new Error('Duration must be at least 1 week');

      // Submit to API
      const response = await fetch('/api/departments/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Campaign creation failed');
      }

      // Success
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        campaignType: 'Digital',
        budget: 25000,
        duration: 8,
        targetAudience: '',
      });
    } catch (err) {
      if (err instanceof Error) {
        setErrors({ submit: err.message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
      <ModalContent>
        <ModalHeader>
          <h3 className="text-xl font-bold">Launch Marketing Campaign</h3>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField
              label="Campaign Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value as string })}
              placeholder="e.g., Summer Product Launch"
              error={errors.name}
              required
            />

            <FormField
              label="Campaign Type"
              type="select"
              name="campaignType"
              value={formData.campaignType}
              onChange={(value) => setFormData({ ...formData, campaignType: value as CampaignType })}
              options={CAMPAIGN_TYPES}
              error={errors.campaignType}
              required
            />

            <FormField
              label="Budget"
              type="number"
              name="budget"
              value={formData.budget}
              onChange={(value) => setFormData({ ...formData, budget: Number(value) })}
              placeholder="Enter budget"
              error={errors.budget}
              helperText="Minimum: $5,000"
              required
            />

            <FormField
              label="Duration (weeks)"
              type="number"
              name="duration"
              value={formData.duration}
              onChange={(value) => setFormData({ ...formData, duration: Number(value) })}
              placeholder="Enter duration"
              error={errors.duration}
              helperText="Campaign duration"
              required
            />

            <FormField
              label="Target Audience"
              type="textarea"
              name="targetAudience"
              value={formData.targetAudience}
              onChange={(value) => setFormData({ ...formData, targetAudience: value as string })}
              placeholder="Describe your target audience demographics and characteristics"
              error={errors.targetAudience}
              required
            />

            {formData.budget > 0 && (
              <div className="p-4 bg-default-100 rounded-lg">
                <p className="text-sm text-default-600 mb-2">Estimated ROI:</p>
                <p className="text-2xl font-bold text-success">
                  ${estimateROI().toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-default-500 mt-1">
                  Based on {formData.campaignType} campaign performance metrics
                </p>
              </div>
            )}

            {errors.submit && (
              <div className="text-danger text-sm">{errors.submit}</div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            onPress={handleSubmit}
            isLoading={submitting}
          >
            Launch Campaign
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
