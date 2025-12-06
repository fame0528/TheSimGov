/**
 * @fileoverview Research Project Modal
 * @module lib/components/departments/modals/ResearchProjectModal
 * 
 * OVERVIEW:
 * Modal form for launching R&D research projects.
 * Innovation category selection, success probability, budget management.
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

interface ResearchProjectInput {
  name: string;
  category: 'Product' | 'Process' | 'Technology' | 'Patent';
  budget: number;
  successChance: number;
}

export interface ResearchProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: 'Product', label: 'Product Innovation' },
  { value: 'Process', label: 'Process Improvement' },
  { value: 'Technology', label: 'Technology Development' },
  { value: 'Patent', label: 'Patent Research' },
];

export function ResearchProjectModal({
  isOpen,
  onClose,
  onSuccess,
}: ResearchProjectModalProps) {
  const [formData, setFormData] = useState<ResearchProjectInput>({
    name: '',
    category: 'Product',
    budget: 50000,
    successChance: 65,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Calculate innovation points based on budget and success chance
  const calculateInnovationPoints = () => {
    return Math.floor((formData.budget / 1000) * (formData.successChance / 100));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setErrors({});

      // Basic validation
      if (!formData.name) throw new Error('Project name is required');
      if (formData.budget < 10000) throw new Error('Minimum budget is $10,000');
      if (formData.successChance < 1 || formData.successChance > 100) {
        throw new Error('Success chance must be between 1-100%');
      }

      // Submit to API
      const response = await fetch('/api/departments/rd/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Research project creation failed');
      }

      // Success
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        category: 'Product',
        budget: 50000,
        successChance: 65,
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
          <h3 className="text-xl font-bold">Launch Research Project</h3>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField
              label="Project Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value as string })}
              placeholder="e.g., Next-Gen Battery Technology"
              error={errors.name}
              required
            />

            <FormField
              label="Research Category"
              type="select"
              name="category"
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value as ResearchProjectInput['category'] })}
              options={CATEGORIES}
              error={errors.category}
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
              helperText="Minimum: $10,000"
              required
            />

            <FormField
              label="Success Probability (%)"
              type="number"
              name="successChance"
              value={formData.successChance}
              onChange={(value) => setFormData({ ...formData, successChance: Number(value) })}
              placeholder="Enter probability"
              error={errors.successChance}
              helperText="Estimated success chance (1-100%)"
              required
            />

            {formData.budget > 0 && formData.successChance > 0 && (
              <div className="p-4 bg-default-100 rounded-lg">
                <p className="text-sm text-default-600 mb-2">Potential Innovation Points:</p>
                <p className="text-2xl font-bold text-primary">
                  {calculateInnovationPoints()} IP
                </p>
                <p className="text-xs text-default-700 mt-1">
                  Based on {formData.successChance}% success probability
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
            Launch Project
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
