'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { formatCurrency } from '@/lib/utils/formatting';

// NOTE: Phase 3 Model Detail Page
// Dynamic route page showing individual model training progress and actions.
// Real implementation would fetch from /api/ai/models/[id] endpoint.

interface ModelDetail {
  id: string;
  name: string;
  architecture: string;
  modelSize: string;
  parameters: number;
  status: 'Training' | 'Deployed' | 'Failed';
  progress: number;
  datasetQuality: string;
  computeAllocation: number;
  estimatedTime: number;
  timeRemaining: number;
  estimatedCost: number;
  costSpent: number;
  apiEndpoint?: string;
  scalingPolicy?: string;
  monitoring: boolean;
  createdAt: Date;
  deployedAt?: Date;
}

export default function ModelDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const { id } = use(params);

  // Placeholder model data (real implementation would fetch from API)
  const model: ModelDetail = {
    id,
    name: 'GPT-Style Language Model',
    architecture: 'Transformer',
    modelSize: 'Large',
    parameters: 7_000_000_000,
    status: 'Training',
    progress: 65,
    datasetQuality: 'high',
    computeAllocation: 100,
    estimatedTime: 70,
    timeRemaining: 24,
    estimatedCost: 285000,
    costSpent: 185000,
    apiEndpoint: 'gpt-language-api',
    scalingPolicy: 'auto',
    monitoring: true,
    createdAt: new Date('2025-11-20'),
  };

  const handleTrain = () => {
    console.log('Resume training for model:', id);
  };

  const handleDeploy = () => {
    console.log('Deploy model:', id);
    router.push('/ai/models');
  };

  const handleDelete = () => {
    if (confirm(`Delete model "${model.name}"?`)) {
      console.log('Delete model:', id);
      router.push('/ai/models');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{model.name}</h1>
          <p className="text-default-700 mt-1">
            {model.architecture} • {model.modelSize} • {(model.parameters / 1_000_000_000).toFixed(2)}B parameters
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="flat" onPress={() => router.push('/ai/models')}>
            Back to Models
          </Button>
          <Chip size="lg" color={
            model.status === 'Deployed' ? 'success' :
            model.status === 'Training' ? 'primary' : 'danger'
          }>
            {model.status}
          </Chip>
        </div>
      </div>

      {/* Training Progress */}
      {model.status === 'Training' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Training Progress</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span>Progress</span>
                <span className="font-bold">{model.progress}%</span>
              </div>
              <Progress value={model.progress} color="primary" size="md" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-default-100 p-4 rounded-lg">
                <p className="text-sm text-default-700">Time Remaining</p>
                <p className="text-2xl font-bold text-warning">{model.timeRemaining}h</p>
              </div>
              <div className="bg-default-100 p-4 rounded-lg">
                <p className="text-sm text-default-700">Cost Spent</p>
                <p className="text-2xl font-bold text-danger">{formatCurrency(model.costSpent)}</p>
                <p className="text-xs text-default-700 mt-1">of {formatCurrency(model.estimatedCost)}</p>
              </div>
              <div className="bg-default-100 p-4 rounded-lg">
                <p className="text-sm text-default-700">Compute Allocated</p>
                <p className="text-2xl font-bold text-success">{model.computeAllocation} GPU-hours</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Model Configuration */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Model Configuration</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-default-700">Architecture</p>
              <p className="font-bold">{model.architecture}</p>
            </div>
            <div>
              <p className="text-sm text-default-700">Model Size</p>
              <p className="font-bold">{model.modelSize}</p>
            </div>
            <div>
              <p className="text-sm text-default-700">Parameters</p>
              <p className="font-bold">{(model.parameters / 1_000_000_000).toFixed(2)}B</p>
            </div>
            <div>
              <p className="text-sm text-default-700">Dataset Quality</p>
              <Chip size="sm" color={model.datasetQuality === 'premium' ? 'success' : 'primary'}>
                {model.datasetQuality}
              </Chip>
            </div>
            {model.apiEndpoint && (
              <>
                <div>
                  <p className="text-sm text-default-700">API Endpoint</p>
                  <p className="font-mono text-sm">/api/ai/models/{model.apiEndpoint}</p>
                </div>
                <div>
                  <p className="text-sm text-default-700">Scaling Policy</p>
                  <Chip size="sm">{model.scalingPolicy}</Chip>
                </div>
              </>
            )}
            <div>
              <p className="text-sm text-default-700">Monitoring</p>
              <Chip size="sm" color={model.monitoring ? 'success' : 'default'}>
                {model.monitoring ? 'Enabled' : 'Disabled'}
              </Chip>
            </div>
            <div>
              <p className="text-sm text-default-700">Created</p>
              <p className="font-bold">{model.createdAt.toLocaleDateString()}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Actions</h2>
        </CardHeader>
        <CardBody>
          <div className="flex gap-2">
            {model.status === 'Training' && (
              <Button color="primary" onPress={handleTrain}>
                Resume Training
              </Button>
            )}
            {model.status === 'Training' && model.progress === 100 && (
              <Button color="success" onPress={handleDeploy}>
                Deploy Model
              </Button>
            )}
            <Button color="danger" variant="flat" onPress={handleDelete}>
              Delete Model
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
