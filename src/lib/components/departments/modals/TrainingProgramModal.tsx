/**
 * @fileoverview Training Program Creation Modal
 * @module lib/components/departments/modals/TrainingProgramModal
 * 
 * OVERVIEW:
 * Modal form for creating employee training programs.
 * 12-skill system integration, capacity management, cost estimation.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { FormField } from '@/lib/components/shared';
import { CreateTrainingProgramSchema } from '@/lib/validations/department';
import type { z } from 'zod';

type TrainingProgramInput = z.infer<typeof CreateTrainingProgramSchema>;

type TrainingProgramForm = Omit<TrainingProgramInput, 'companyId'>;

export interface TrainingProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SKILLS = [
  { value: 'analysis', label: 'Analysis' },
  { value: 'creativity', label: 'Creativity' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'technical', label: 'Technical' },
  { value: 'communication', label: 'Communication' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Finance' },
  { value: 'operations', label: 'Operations' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'innovation', label: 'Innovation' },
  { value: 'ethics', label: 'Ethics' },
];

export function TrainingProgramModal({
  isOpen,
  onClose,
  onSuccess,
}: TrainingProgramModalProps) {
  const [formData, setFormData] = useState<TrainingProgramForm>({
    name: '',
    skillTarget: 'leadership',
    duration: 4,
    capacity: 20,
    cost: 5000,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setErrors({});

      // Validate with Zod
      const validated = CreateTrainingProgramSchema.parse(formData);

      // Submit to API
      const response = await fetch('/api/departments/hr/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Training program creation failed');
      }

      // Success
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        skillTarget: 'leadership',
        duration: 4,
        capacity: 20,
        cost: 5000,
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
          <h3 className="text-xl font-bold">Create Training Program</h3>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField
              label="Program Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value as string })}
              placeholder="e.g., Advanced Leadership Development"
              error={errors.name}
              required
            />

            <FormField
              label="Skill Target"
              type="select"
              name="skillTarget"
              value={formData.skillTarget}
              onChange={(value) => setFormData({ ...formData, skillTarget: value as string })}
              options={SKILLS}
              error={errors.skillTarget}
              helperText="Primary skill this program will develop"
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
              helperText="Minimum: 1 week"
              required
            />

            <FormField
              label="Capacity"
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={(value) => setFormData({ ...formData, capacity: Number(value) })}
              placeholder="Enter max participants"
              error={errors.capacity}
              helperText="Maximum number of employees who can enroll"
              required
            />

            <FormField
              label="Budget"
              type="number"
              name="cost"
              value={formData.cost}
              onChange={(value) => setFormData({ ...formData, cost: Number(value) })}
              placeholder="Enter budget"
              error={errors.cost}
              helperText="Total program cost"
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
            Create Program
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
