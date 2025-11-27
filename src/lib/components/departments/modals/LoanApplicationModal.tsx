/**
 * @fileoverview Loan Application Modal
 * @module lib/components/departments/modals/LoanApplicationModal
 * 
 * OVERVIEW:
 * Modal form for applying for business loans.
 * Zod validation, HeroUI components, complete error handling.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { FormField } from '@/lib/components/shared';
import { LoanApplicationSchema } from '@/lib/validations/department';
import type { z } from 'zod';

type LoanApplicationInput = z.infer<typeof LoanApplicationSchema>;

// Form state includes UI-only fields
interface LoanApplicationForm extends LoanApplicationInput {
  purpose?: string;
  collateral?: string;
}

export interface LoanApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LOAN_TYPES = [
  { value: 'working-capital', label: 'Working Capital' },
  { value: 'expansion', label: 'Business Expansion' },
  { value: 'equipment', label: 'Equipment Purchase' },
  { value: 'bridge', label: 'Bridge Loan' },
];

export function LoanApplicationModal({
  isOpen,
  onClose,
  onSuccess,
}: LoanApplicationModalProps) {
  const [formData, setFormData] = useState<LoanApplicationForm>({
    companyId: '',
    loanType: 'working-capital',
    amount: 0,
    termMonths: 12,
    purpose: '',
    collateral: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setErrors({});

      // Validate with Zod
      const validated = LoanApplicationSchema.parse(formData);

      // Submit to API
      const response = await fetch('/api/departments/finance/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Loan application failed');
      }

      // Success - close modal and refresh
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        companyId: '',
        loanType: 'working-capital',
        amount: 0,
        termMonths: 12,
        purpose: '',
        collateral: '',
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
          <h3 className="text-xl font-bold">Apply for Business Loan</h3>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField
              label="Loan Type"
              type="select"
              name="loanType"
              value={formData.loanType}
              onChange={(value) => setFormData({ ...formData, loanType: value as 'working-capital' | 'expansion' | 'equipment' | 'bridge' })}
              options={LOAN_TYPES}
              error={errors.loanType}
              required
            />

            <FormField
              label="Loan Amount"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={(value) => setFormData({ ...formData, amount: Number(value) })}
              placeholder="Enter amount"
              error={errors.amount}
              helperText="Minimum: $10,000"
              required
            />

            <FormField
              label="Purpose"
              type="textarea"
              name="purpose"
              value={formData.purpose || ''}
              onChange={(value) => setFormData({ ...formData, purpose: value as string })}
              placeholder="Describe how you will use this loan"
              error={errors.purpose}
              required
            />

            <FormField
              label="Collateral"
              type="textarea"
              name="collateral"
              value={formData.collateral || ''}
              onChange={(value) => setFormData({ ...formData, collateral: value as string })}
              placeholder="Describe assets offered as collateral"
              error={errors.collateral}
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
            Submit Application
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
