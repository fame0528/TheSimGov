/**
 * @fileoverview Create Marketplace Listing Modal Component
 * @module components/crime/modals/CreateListingModal
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
  Slider,
} from '@heroui/react';
import { ShoppingBag } from 'lucide-react';
// import { useCrime } from '@/hooks/useCrime'; // TODO: Add mutation functions

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateListingModal({ isOpen, onClose, onSuccess }: CreateListingModalProps) {
  // const { createListing } = useCrime(); // TODO: Implement mutation function
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    substanceName: '',
    location: '',
    quantity: 100,
    purity: 75,
    pricePerUnit: 100,
  });

  const totalValue = formData.quantity * formData.pricePerUnit;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Implement API call
      await fetch('/api/crime/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      // Reset form
      setFormData({
        substanceName: '',
        location: '',
        quantity: 100,
        purity: 75,
        pricePerUnit: 100,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setFormData({
      substanceName: '',
      location: '',
      quantity: 100,
      purity: 75,
      pricePerUnit: 100,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
      <ModalContent className="bg-gradient-to-br from-slate-900 to-slate-950 border border-violet-500/20">
        <ModalHeader className="flex gap-2 items-center border-b border-white/10">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-600/10">
            <ShoppingBag className="h-5 w-5 text-violet-400" />
          </div>
          <span className="text-white font-bold">Create Marketplace Listing</span>
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
                label="Substance Name"
                placeholder="Product name"
                value={formData.substanceName}
                onChange={(e) => setFormData({ ...formData, substanceName: e.target.value })}
                description="What you're selling"
                isRequired
                classNames={{
                  label: "text-white/80",
                  input: "text-white placeholder:text-slate-500",
                  inputWrapper: "bg-slate-800/50 border-slate-700 hover:border-violet-500/50 group-data-[focus=true]:border-violet-500",
                  description: "text-slate-400"
                }}
              />

              <Input
                label="Location"
                placeholder="Pickup location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                description="Where the product is"
                isRequired
                classNames={{
                  label: "text-white/80",
                  input: "text-white placeholder:text-slate-500",
                  inputWrapper: "bg-slate-800/50 border-slate-700 hover:border-violet-500/50 group-data-[focus=true]:border-violet-500",
                  description: "text-slate-400"
                }}
              />
            </div>

            <div>
              <Slider
                label="Quantity"
                value={formData.quantity}
                onChange={(value) => setFormData({ ...formData, quantity: value as number })}
                minValue={10}
                maxValue={1000}
                step={10}
                showSteps
                marks={[
                  { value: 10, label: '10' },
                  { value: 250, label: '250' },
                  { value: 500, label: '500' },
                  { value: 750, label: '750' },
                  { value: 1000, label: '1k' },
                ]}
                className="max-w-full"
                classNames={{
                  label: "text-white/80",
                  value: "text-white",
                  mark: "text-slate-400"
                }}
              />
            </div>

            <div>
              <Slider
                label="Purity (%)"
                value={formData.purity}
                onChange={(value) => setFormData({ ...formData, purity: value as number })}
                minValue={10}
                maxValue={100}
                step={5}
                showSteps
                marks={[
                  { value: 10, label: '10%' },
                  { value: 35, label: '35%' },
                  { value: 65, label: '65%' },
                  { value: 100, label: '100%' },
                ]}
                className="max-w-full"
                classNames={{
                  label: "text-white/80",
                  value: "text-white",
                  mark: "text-slate-400"
                }}
                color={
                  formData.purity >= 80 ? 'success' :
                  formData.purity >= 50 ? 'warning' :
                  'danger'
                }
              />
            </div>

            <div>
              <Slider
                label="Price Per Unit ($)"
                value={formData.pricePerUnit}
                onChange={(value) => setFormData({ ...formData, pricePerUnit: value as number })}
                minValue={10}
                maxValue={500}
                step={10}
                showSteps
                marks={[
                  { value: 10, label: '$10' },
                  { value: 150, label: '$150' },
                  { value: 300, label: '$300' },
                  { value: 500, label: '$500' },
                ]}
                className="max-w-full"
                classNames={{
                  label: "text-white/80",
                  value: "text-white",
                  mark: "text-slate-400"
                }}
              />
            </div>

            <div className="p-4 bg-gradient-to-br from-violet-500/10 via-violet-600/5 to-transparent backdrop-blur-xl border border-violet-500/20 rounded-lg space-y-2">
              <h4 className="text-sm font-semibold text-white">Listing Summary:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-400">Product:</span>
                  <span className="ml-2 font-medium text-white">{formData.substanceName || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Location:</span>
                  <span className="ml-2 font-medium text-white">{formData.location || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Quantity:</span>
                  <span className="ml-2 font-medium text-white">{formData.quantity} units</span>
                </div>
                <div>
                  <span className="text-slate-400">Purity:</span>
                  <span className="ml-2 font-medium text-white">{formData.purity}%</span>
                </div>
                <div>
                  <span className="text-slate-400">Unit Price:</span>
                  <span className="ml-2 font-medium text-white">${formData.pricePerUnit}</span>
                </div>
                <div>
                  <span className="text-slate-400">Total Value:</span>
                  <span className="ml-2 font-semibold text-emerald-400">${totalValue.toLocaleString()}</span>
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
            isDisabled={!formData.substanceName || !formData.location || isSubmitting}
            className="bg-gradient-to-br from-violet-500 to-violet-600 text-white font-semibold"
          >
            Create Listing
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default CreateListingModal;
