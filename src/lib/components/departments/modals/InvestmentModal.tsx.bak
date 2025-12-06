/**
 * @fileoverview Investment Creation Modal
 * @module lib/components/departments/modals/InvestmentModal
 * 
 * OVERVIEW:
 * Modal form for creating investments.
 * Zod validation, risk level selection, return projection.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { FormField } from '@/lib/components/shared';
import { InvestmentInputSchema } from '@/lib/validations/department';
import type { z } from 'zod';

type InvestmentInput = z.infer<typeof InvestmentInputSchema>;

interface InvestmentForm extends Omit<InvestmentInput, 'companyId'> {
  duration?: number;
}

export interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const INVESTMENT_TYPES = [
  { value: 'stocks', label: 'Stocks' },
  { value: 'bonds', label: 'Bonds' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'venture', label: 'Venture Capital' },
];

const RISK_LEVELS = [
  { value: 'low', label: 'Low Risk', color: 'success' as const },
  { value: 'medium', label: 'Medium Risk', color: 'warning' as const },
  { value: 'high', label: 'High Risk', color: 'danger' as const },
];

export function InvestmentModal({
  isOpen,
  onClose,
  onSuccess,
}: InvestmentModalProps) {
  const [formData, setFormData] = useState<InvestmentForm>({
    investmentType: 'stocks',
    amount: 0,
    riskLevel: 'medium',
    duration: 12,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Calculate expected return based on risk
  const expectedReturn = () => {
    const riskMultiplier = {
      low: 0.05,
      medium: 0.12,
      high: 0.25,
    }[formData.riskLevel];
    
    return formData.amount * riskMultiplier * ((formData.duration || 12) / 12);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setErrors({});

      // Validate with Zod (exclude UI-only fields)
      const { duration, ...apiData } = formData;
      const validated = InvestmentInputSchema.parse(apiData);

      // Submit to API
      const response = await fetch('/api/departments/finance/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Investment creation failed');
      }

      // Success
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        investmentType: 'stocks',
        amount: 0,
        riskLevel: 'medium',
        duration: 12,
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
          <h3 className="text-xl font-bold">Create Investment</h3>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField
              label="Investment Type"
              type="select"
              name="investmentType"
              value={formData.investmentType}
              onChange={(value) => setFormData({ ...formData, investmentType: value as 'stocks' | 'bonds' | 'real-estate' | 'venture' })}
              options={INVESTMENT_TYPES}
              error={errors.investmentType}
              required
            />

            <FormField
              label="Investment Amount"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={(value) => setFormData({ ...formData, amount: Number(value) })}
              placeholder="Enter amount"
              error={errors.amount}
              helperText="Minimum: $5,000"
              required
            />

            <FormField
              label="Risk Level"
              type="select"
              name="riskLevel"
              value={formData.riskLevel}
              onChange={(value) => setFormData({ ...formData, riskLevel: value as 'low' | 'medium' | 'high' })}
              options={RISK_LEVELS.map(r => ({ value: r.value, label: r.label }))}
              error={errors.riskLevel}
              required
            />

            <FormField
              label="Duration (months)"
              type="number"
              name="duration"
              value={formData.duration || 12}
              onChange={(value) => setFormData({ ...formData, duration: Number(value) })}
              placeholder="Enter duration"
              error={errors.duration}
              helperText="Minimum: 3 months"
              required
            />

            {formData.amount > 0 && (
              <div className="p-4 bg-default-100 rounded-lg">
                <p className="text-sm text-default-600 mb-2">Expected Return Projection:</p>
                <p className="text-2xl font-bold text-success">
                  ${expectedReturn().toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-default-500 mt-1">
                  Based on {formData.riskLevel} risk level over {formData.duration} months
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
            Create Investment
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
