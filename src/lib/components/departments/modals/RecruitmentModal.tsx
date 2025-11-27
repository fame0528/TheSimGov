/**
 * @fileoverview Recruitment Campaign Modal
 * @module lib/components/departments/modals/RecruitmentModal
 * 
 * OVERVIEW:
 * Modal form for launching recruitment campaigns.
 * Position specifications, budget management, duration tracking.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { FormField } from '@/lib/components/shared';
import { CreateRecruitmentCampaignSchema } from '@/lib/validations/department';
import type { z } from 'zod';

type RecruitmentInput = z.infer<typeof CreateRecruitmentCampaignSchema>;

interface RecruitmentForm extends Omit<RecruitmentInput, 'companyId'> {
  requirements?: string;
}

export interface RecruitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecruitmentModal({
  isOpen,
  onClose,
  onSuccess,
}: RecruitmentModalProps) {
  const [formData, setFormData] = useState<RecruitmentForm>({
    role: '',
    positions: 1,
    budget: 10000,
    duration: 4,
    requirements: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setErrors({});

      // Validate with Zod (exclude UI-only fields)
      const { requirements, ...apiData } = formData;
      const validated = CreateRecruitmentCampaignSchema.parse(apiData);

      // Submit to API
      const response = await fetch('/api/departments/hr/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Recruitment campaign creation failed');
      }

      // Success
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        role: '',
        positions: 1,
        budget: 10000,
        duration: 4,
        requirements: '',
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
          <h3 className="text-xl font-bold">Launch Recruitment Campaign</h3>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField
              label="Role Title"
              type="text"
              name="role"
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value as string })}
              placeholder="e.g., Senior Software Engineer"
              error={errors.role}
              required
            />

            <FormField
              label="Number of Positions"
              type="number"
              name="positions"
              value={formData.positions}
              onChange={(value) => setFormData({ ...formData, positions: Number(value) })}
              placeholder="Enter number"
              error={errors.positions}
              helperText="How many people to hire"
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
              helperText="Total campaign budget (advertising, hiring bonuses, etc.)"
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
              label="Requirements"
              type="textarea"
              name="requirements"
              value={formData.requirements || ''}
              onChange={(value) => setFormData({ ...formData, requirements: value as string })}
              placeholder="Describe required skills, experience, and qualifications"
              error={errors.requirements}
              required
            />

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
