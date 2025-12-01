/**
 * @fileoverview Create Laundering Channel Modal Component
 * @module components/crime/modals/CreateChannelModal
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
  Select,
  SelectItem,
  Slider,
} from '@heroui/react';
import { DollarSign } from 'lucide-react';
// import { useCrime } from '@/hooks/useCrime'; // TODO: Add mutation functions

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const LAUNDERING_METHODS = [
  { key: 'ShellCompany', label: 'Shell Company', description: 'Offshore entity' },
  { key: 'CashBusiness', label: 'Cash Business', description: 'High-volume cash operations' },
  { key: 'Cryptocurrency', label: 'Cryptocurrency', description: 'Digital currency mixing' },
  { key: 'TradeBased', label: 'Trade Based', description: 'Invoice manipulation' },
  { key: 'Counterfeit', label: 'Counterfeit', description: 'Fake documentation' },
];

export function CreateChannelModal({ isOpen, onClose, onSuccess }: CreateChannelModalProps) {
  // const { createChannel } = useCrime(); // TODO: Implement mutation function
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    method: 'ShellCompany',
    throughputCap: 50000,
    feePercent: 15,
    latencyDays: 7,
  });

  const effectiveFee = (formData.throughputCap * formData.feePercent) / 100;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Implement API call
      await fetch('/api/crime/laundering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      // Reset form
      setFormData({
        method: 'ShellCompany',
        throughputCap: 50000,
        feePercent: 15,
        latencyDays: 7,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create channel');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setFormData({
      method: 'ShellCompany',
      throughputCap: 50000,
      feePercent: 15,
      latencyDays: 7,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
      <ModalContent className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/20">
        <ModalHeader className="flex gap-2 items-center border-b border-white/10">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10">
            <DollarSign className="h-5 w-5 text-amber-400" />
          </div>
          <span className="text-white font-bold">Create Laundering Channel</span>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            <Select
              label="Laundering Method"
              placeholder="Select method"
              selectedKeys={[formData.method]}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              description="How funds are laundered"
            >
              {LAUNDERING_METHODS.map((method) => (
                <SelectItem key={method.key}>
                  {method.label}
                </SelectItem>
              ))}
            </Select>

            <div>
              <Slider
                label="Throughput Cap ($)"
                value={formData.throughputCap}
                onChange={(value) => setFormData({ ...formData, throughputCap: value as number })}
                minValue={10000}
                maxValue={500000}
                step={10000}
                showSteps
                marks={[
                  { value: 10000, label: '$10k' },
                  { value: 150000, label: '$150k' },
                  { value: 300000, label: '$300k' },
                  { value: 500000, label: '$500k' },
                ]}
                className="max-w-full"
              />
            </div>

            <div>
              <Slider
                label="Fee Percentage (%)"
                value={formData.feePercent}
                onChange={(value) => setFormData({ ...formData, feePercent: value as number })}
                minValue={5}
                maxValue={50}
                step={5}
                showSteps
                marks={[
                  { value: 5, label: '5%' },
                  { value: 20, label: '20%' },
                  { value: 35, label: '35%' },
                  { value: 50, label: '50%' },
                ]}
                className="max-w-full"
                color={
                  formData.feePercent <= 15 ? 'success' :
                  formData.feePercent <= 30 ? 'warning' :
                  'danger'
                }
              />
            </div>

            <div>
              <Slider
                label="Latency (Days)"
                value={formData.latencyDays}
                onChange={(value) => setFormData({ ...formData, latencyDays: value as number })}
                minValue={1}
                maxValue={30}
                step={1}
                showSteps
                marks={[
                  { value: 1, label: '1d' },
                  { value: 10, label: '10d' },
                  { value: 20, label: '20d' },
                  { value: 30, label: '30d' },
                ]}
                className="max-w-full"
                color={
                  formData.latencyDays <= 7 ? 'success' :
                  formData.latencyDays <= 14 ? 'warning' :
                  'danger'
                }
              />
            </div>

            <div className="p-4 bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent backdrop-blur-xl border border-amber-500/20 rounded-lg space-y-2">
              <h4 className="text-sm font-semibold text-white">Channel Summary:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-400">Method:</span>
                  <span className="ml-2 font-medium text-white">
                    {LAUNDERING_METHODS.find(m => m.key === formData.method)?.label}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Throughput:</span>
                  <span className="ml-2 font-medium text-white">${formData.throughputCap.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400">Fee:</span>
                  <span className="ml-2 font-medium text-white">{formData.feePercent}%</span>
                </div>
                <div>
                  <span className="text-slate-400">Latency:</span>
                  <span className="ml-2 font-medium text-white">{formData.latencyDays} days</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">Effective Fee:</span>
                  <span className="ml-2 font-semibold text-amber-400">
                    ${effectiveFee.toLocaleString()} per max transaction
                  </span>
                </div>
              </div>

              <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-400">
                <strong>Note:</strong> Lower fees and latency increase detection risk. Higher throughput caps are more suspicious.
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
            isDisabled={isSubmitting}
            className="bg-gradient-to-br from-amber-500 to-amber-600 text-white font-semibold"
          >
            Create Channel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default CreateChannelModal;
