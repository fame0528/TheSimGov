/**
 * @fileoverview Create Distribution Route Modal Component
 * @module components/crime/modals/CreateRouteModal
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
import { Truck } from 'lucide-react';
// import { useCrime } from '@/hooks/useCrime'; // TODO: Add mutation functions

interface CreateRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const TRANSPORT_METHODS = [
  { key: 'Road', label: 'Road', description: 'Highway transport' },
  { key: 'Air', label: 'Air', description: 'Air freight' },
  { key: 'Rail', label: 'Rail', description: 'Rail transport' },
  { key: 'Courier', label: 'Courier', description: 'Postal service' },
];

export function CreateRouteModal({ isOpen, onClose, onSuccess }: CreateRouteModalProps) {
  // const { createRoute } = useCrime(); // TODO: Implement mutation function
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    method: 'Road',
    capacity: 100,
    costPerUnit: 50,
    speedDays: 3,
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Implement API call
      await fetch('/api/crime/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      // Reset form
      setFormData({
        origin: '',
        destination: '',
        method: 'Road',
        capacity: 100,
        costPerUnit: 50,
        speedDays: 3,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create route');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setFormData({
      origin: '',
      destination: '',
      method: 'Road',
      capacity: 100,
      costPerUnit: 50,
      speedDays: 3,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
      <ModalContent className="bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/20">
        <ModalHeader className="flex gap-2 items-center border-b border-white/10">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
            <Truck className="h-5 w-5 text-emerald-400" />
          </div>
          <span className="text-white font-bold">Create Distribution Route</span>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Origin"
                placeholder="Starting location"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                isRequired
              />

              <Input
                label="Destination"
                placeholder="Ending location"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                isRequired
              />
            </div>

            <Select
              label="Transport Method"
              placeholder="Select transport method"
              selectedKeys={[formData.method]}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              description="How goods are transported"
            >
              {TRANSPORT_METHODS.map((method) => (
                <SelectItem key={method.key}>
                  {method.label}
                </SelectItem>
              ))}
            </Select>

            <div>
              <Slider
                label="Capacity"
                value={formData.capacity}
                onChange={(value) => setFormData({ ...formData, capacity: value as number })}
                minValue={50}
                maxValue={500}
                step={25}
                showSteps
                marks={[
                  { value: 50, label: '50' },
                  { value: 200, label: '200' },
                  { value: 350, label: '350' },
                  { value: 500, label: '500' },
                ]}
                className="max-w-full"
              />
            </div>

            <div>
              <Slider
                label="Cost Per Unit ($)"
                value={formData.costPerUnit}
                onChange={(value) => setFormData({ ...formData, costPerUnit: value as number })}
                minValue={10}
                maxValue={200}
                step={10}
                showSteps
                marks={[
                  { value: 10, label: '$10' },
                  { value: 70, label: '$70' },
                  { value: 135, label: '$135' },
                  { value: 200, label: '$200' },
                ]}
                className="max-w-full"
              />
            </div>

            <div>
              <Slider
                label="Speed (Days)"
                value={formData.speedDays}
                onChange={(value) => setFormData({ ...formData, speedDays: value as number })}
                minValue={1}
                maxValue={14}
                step={1}
                showSteps
                marks={[
                  { value: 1, label: '1d' },
                  { value: 5, label: '5d' },
                  { value: 10, label: '10d' },
                  { value: 14, label: '14d' },
                ]}
                className="max-w-full"
                color={
                  formData.speedDays <= 3 ? 'success' :
                  formData.speedDays <= 7 ? 'warning' :
                  'danger'
                }
              />
            </div>

            <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-transparent backdrop-blur-xl border border-emerald-500/20 rounded-lg space-y-2">
              <h4 className="text-sm font-semibold text-white">Route Summary:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-400">Route:</span>
                  <span className="ml-2 font-medium text-white">
                    {formData.origin || '?'} → {formData.destination || '?'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Method:</span>
                  <span className="ml-2 font-medium text-white">{formData.method}</span>
                </div>
                <div>
                  <span className="text-slate-400">Capacity:</span>
                  <span className="ml-2 font-medium text-white">{formData.capacity} units</span>
                </div>
                <div>
                  <span className="text-slate-400">Speed:</span>
                  <span className="ml-2 font-medium text-white">{formData.speedDays} days</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">Cost:</span>
                  <span className="ml-2 font-medium text-white">${formData.costPerUnit}/unit</span>
                  <span className="text-slate-400 text-xs ml-2">
                    (${formData.costPerUnit * formData.capacity} total)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="border-t border-white/10">
          <Button variant="flat" onPress={handleClose} isDisabled={isSubmitting} className="text-slate-400 hover:text-white">
            Cancel
          </Button>
          <Button
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!formData.origin || !formData.destination || isSubmitting}
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold"
          >
            Create Route
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default CreateRouteModal;
