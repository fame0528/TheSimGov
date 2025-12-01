/**
 * @fileoverview Create Production Facility Modal Component
 * @module components/crime/modals/CreateFacilityModal
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 */

'use client';

import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Slider,
} from '@heroui/react';
import { Factory } from 'lucide-react';
// import { useCrime } from '@/hooks/useCrime'; // TODO: Add mutation functions

interface CreateFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const FACILITY_TYPES = [
  { key: 'Lab', label: 'Lab', description: 'Chemical synthesis and processing' },
  { key: 'Farm', label: 'Farm', description: 'Natural cultivation' },
  { key: 'Warehouse', label: 'Warehouse', description: 'Storage and distribution' },
];

export function CreateFacilityModal({ isOpen, onClose, onSuccess }: CreateFacilityModalProps) {
  // const { createFacility } = useCrime(); // TODO: Implement mutation function
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: 'Lab',
    location: '',
    capacity: 100,
    quality: 50,
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Implement API call
      await fetch('/api/crime/facilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      // Reset form
      setFormData({
        type: 'Lab',
        location: '',
        capacity: 100,
        quality: 50,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create facility');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setFormData({
      type: 'Lab',
      location: '',
      capacity: 100,
      quality: 50,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
      <ModalContent className="bg-gradient-to-br from-slate-900 to-slate-950 border border-blue-500/20">
        <ModalHeader className="flex gap-2 items-center border-b border-white/10">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10">
            <Factory className="h-5 w-5 text-blue-400" />
          </div>
          <span className="text-white font-bold">Create Production Facility</span>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            <Select
              label="Facility Type"
              placeholder="Select facility type"
              selectedKeys={[formData.type]}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              description="Choose the type of production facility"
            >
              {FACILITY_TYPES.map((type) => (
                <SelectItem key={type.key}>
                  {type.label}
                </SelectItem>
              ))}
            </Select>

            <Input
              label="Location"
              placeholder="Enter location (e.g., Industrial District, Rural Area)"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              description="Where this facility is located"
              isRequired
            />

            <div>
              <Slider
                label="Capacity"
                value={formData.capacity}
                onChange={(value) => setFormData({ ...formData, capacity: value as number })}
                minValue={50}
                maxValue={500}
                step={10}
                showSteps
                marks={[
                  { value: 50, label: '50' },
                  { value: 150, label: '150' },
                  { value: 250, label: '250' },
                  { value: 350, label: '350' },
                  { value: 500, label: '500' },
                ]}
                className="max-w-full"
              />
            </div>

            <div>
              <Slider
                label="Quality Level"
                value={formData.quality}
                onChange={(value) => setFormData({ ...formData, quality: value as number })}
                minValue={10}
                maxValue={100}
                step={5}
                showSteps
                marks={[
                  { value: 10, label: 'Low' },
                  { value: 35, label: 'Med' },
                  { value: 65, label: 'High' },
                  { value: 100, label: 'Max' },
                ]}
                className="max-w-full"
                color={
                  formData.quality >= 70 ? 'success' :
                  formData.quality >= 40 ? 'warning' :
                  'danger'
                }
              />
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent backdrop-blur-xl border border-blue-500/20 rounded-lg space-y-2">
              <h4 className="text-sm font-semibold text-white">Facility Details:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-400">Type:</span>
                  <span className="ml-2 font-medium text-white">{formData.type}</span>
                </div>
                <div>
                  <span className="text-slate-400">Capacity:</span>
                  <span className="ml-2 font-medium text-white">{formData.capacity} units</span>
                </div>
                <div>
                  <span className="text-slate-400">Quality:</span>
                  <span className="ml-2 font-medium text-white">{formData.quality}%</span>
                </div>
                <div>
                  <span className="text-slate-400">Location:</span>
                  <span className="ml-2 font-medium text-white">{formData.location || 'Not set'}</span>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="border-t border-white/10">
          <Button 
            variant="flat" 
            onPress={handleClose} 
            isDisabled={isSubmitting}
            className="text-slate-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!formData.location || isSubmitting}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold"
          >
            Create Facility
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default CreateFacilityModal;
