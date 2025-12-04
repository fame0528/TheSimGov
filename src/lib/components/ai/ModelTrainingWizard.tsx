/**
 * @fileoverview Model Training Wizard - Multi-Step Training Flow
 * @module lib/components/ai/ModelTrainingWizard
 * 
 * OVERVIEW:
 * Multi-step wizard for AI model training configuration and submission.
 * Guides users through data selection, architecture picker, training config, and deployment.
 * 
 * FEATURES:
 * - Step 1: Dataset Selection (quality, quantity, licensing costs)
 * - Step 2: Architecture Picker (Transformer/CNN/RNN/Diffusion/GAN with size tiers)
 * - Step 3: Training Configuration (compute allocation, time estimates, cost forecasting)
 * - Step 4: Deployment (API endpoint, scaling, monitoring)
 * - Real-time cost estimation (updates as user configures)
 * - Progress stepper indicator
 * - Navigation buttons (Back/Next/Submit)
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Select, SelectItem } from '@heroui/select';
import { Input } from '@heroui/input';
import { Progress } from '@heroui/progress';
import { Chip } from '@heroui/chip';
import { formatCurrency } from '@/lib/utils/formatting';

export interface ModelTrainingWizardProps {
  /** Training submission handler */
  onSubmit?: (config: TrainingConfig) => void;
  /** Cancel handler */
  onCancel?: () => void;
}

export interface TrainingConfig {
  // Dataset
  datasetSize: number;
  datasetQuality: 'low' | 'medium' | 'high' | 'premium';
  licensingCost: number;
  
  // Architecture
  architecture: 'Transformer' | 'CNN' | 'RNN' | 'Diffusion' | 'GAN';
  modelSize: 'Small' | 'Medium' | 'Large';
  parameters: number;
  
  // Training
  computeAllocation: number;
  estimatedTime: number;
  estimatedCost: number;
  
  // Deployment
  apiEndpoint: string;
  scalingPolicy: 'fixed' | 'auto';
  monitoring: boolean;
}

/**
 * Calculate model parameters based on architecture and size
 */
const calculateParameters = (architecture: string, size: string): number => {
  const baseParams = {
    'Transformer': { 'Small': 125_000_000, 'Medium': 1_000_000_000, 'Large': 7_000_000_000 },
    'CNN': { 'Small': 50_000_000, 'Medium': 200_000_000, 'Large': 800_000_000 },
    'RNN': { 'Small': 100_000_000, 'Medium': 500_000_000, 'Large': 2_000_000_000 },
    'Diffusion': { 'Small': 300_000_000, 'Medium': 1_500_000_000, 'Large': 6_000_000_000 },
    'GAN': { 'Small': 150_000_000, 'Medium': 750_000_000, 'Large': 3_000_000_000 },
  };
  return baseParams[architecture as keyof typeof baseParams]?.[size as keyof typeof baseParams['Transformer']] || 0;
};

/**
 * Calculate training cost
 */
const calculateCost = (
  datasetQuality: string,
  licensingCost: number,
  computeAllocation: number,
  parameters: number
): number => {
  const qualityCost = { 'low': 1000, 'medium': 5000, 'high': 25000, 'premium': 100000 };
  const computeCostPerHour = 50;
  const parameterMultiplier = parameters / 1_000_000_000; // Cost scales with model size
  
  return (
    (qualityCost[datasetQuality as keyof typeof qualityCost] || 0) +
    licensingCost +
    (computeAllocation * computeCostPerHour * parameterMultiplier)
  );
};

/**
 * ModelTrainingWizard Component
 * 
 * Multi-step wizard for configuring and submitting AI model training jobs.
 * 
 * @example
 * ```tsx
 * <ModelTrainingWizard
 *   onSubmit={(config) => submitTrainingJob(config)}
 *   onCancel={() => router.back()}
 * />
 * ```
 */
export function ModelTrainingWizard({
  onSubmit,
  onCancel,
}: ModelTrainingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form state
  const [datasetSize, setDatasetSize] = useState(1_000_000);
  const [datasetQuality, setDatasetQuality] = useState<'low' | 'medium' | 'high' | 'premium'>('medium');
  const [licensingCost, setLicensingCost] = useState(0);
  const [architecture, setArchitecture] = useState<'Transformer' | 'CNN' | 'RNN' | 'Diffusion' | 'GAN'>('Transformer');
  const [modelSize, setModelSize] = useState<'Small' | 'Medium' | 'Large'>('Small');
  const [computeAllocation, setComputeAllocation] = useState(100);
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [scalingPolicy, setScalingPolicy] = useState<'fixed' | 'auto'>('auto');
  const [monitoring, setMonitoring] = useState(true);

  // Calculated values
  const parameters = calculateParameters(architecture, modelSize);
  const estimatedTime = Math.ceil((parameters / 1_000_000_000) * 10); // ~10 hours per billion parameters
  const estimatedCost = calculateCost(datasetQuality, licensingCost, computeAllocation, parameters);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit({
        datasetSize,
        datasetQuality,
        licensingCost,
        architecture,
        modelSize,
        parameters,
        computeAllocation,
        estimatedTime,
        estimatedCost,
        apiEndpoint,
        scalingPolicy,
        monitoring,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">🧠 Model Training Wizard</h2>
        <p className="text-default-500">Configure and submit a new AI model training job</p>
      </div>

      {/* Progress Stepper */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
          <span className="text-sm text-default-500">
            {currentStep === 1 && 'Dataset Selection'}
            {currentStep === 2 && 'Architecture'}
            {currentStep === 3 && 'Training Configuration'}
            {currentStep === 4 && 'Deployment'}
          </span>
        </div>
        <Progress 
          value={(currentStep / totalSteps) * 100} 
          color="primary" 
          size="sm"
        />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold">
            {currentStep === 1 && '📊 Step 1: Dataset Selection'}
            {currentStep === 2 && '🏗️ Step 2: Model Architecture'}
            {currentStep === 3 && '⚡ Step 3: Training Configuration'}
            {currentStep === 4 && '🚀 Step 4: Deployment Settings'}
          </h3>
        </CardHeader>
        <CardBody>
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Dataset Size</label>
                <Input
                  type="number"
                  value={datasetSize.toString()}
                  onValueChange={(value) => setDatasetSize(parseInt(value) || 0)}
                  endContent={<span className="text-default-400">samples</span>}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Dataset Quality</label>
                <Select
                  selectedKeys={[datasetQuality]}
                  onSelectionChange={(keys) => setDatasetQuality(String(Array.from(keys)[0]) as 'low' | 'medium' | 'high' | 'premium')}
                >
                <SelectItem key="low">Low ($1k - basic quality)</SelectItem>
                <SelectItem key="medium">Medium ($5k - clean data)</SelectItem>
                <SelectItem key="high">High ($25k - curated data)</SelectItem>
                <SelectItem key="premium">Premium ($100k - expert labeled)</SelectItem>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Licensing Cost</label>
                <Input
                  type="number"
                  value={licensingCost.toString()}
                  onValueChange={(value) => setLicensingCost(parseInt(value) || 0)}
                  startContent={<span className="text-default-400">$</span>}
                  description="Additional cost for proprietary datasets"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Architecture Type</label>
                <Select
                  selectedKeys={[architecture]}
                  onSelectionChange={(keys) => setArchitecture(String(Array.from(keys)[0]) as 'Transformer' | 'CNN' | 'RNN' | 'Diffusion' | 'GAN')}
                >
                <SelectItem key="Transformer">Transformer (LLMs, NLP)</SelectItem>
                <SelectItem key="CNN">CNN (Computer Vision)</SelectItem>
                <SelectItem key="RNN">RNN (Sequential Data)</SelectItem>
                <SelectItem key="Diffusion">Diffusion (Image Generation)</SelectItem>
                <SelectItem key="GAN">GAN (Generative Models)</SelectItem>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Model Size</label>
                <Select
                  selectedKeys={[modelSize]}
                  onSelectionChange={(keys) => setModelSize(String(Array.from(keys)[0]) as 'Small' | 'Medium' | 'Large')}
                >
                <SelectItem key="Small">Small (125M - 300M params)</SelectItem>
                <SelectItem key="Medium">Medium (1B - 1.5B params)</SelectItem>
                <SelectItem key="Large">Large (6B - 7B params)</SelectItem>
                </Select>
              </div>
              <div className="bg-default-100 p-4 rounded-lg">
                <p className="text-sm font-medium mb-1">Model Parameters</p>
                <p className="text-2xl font-bold text-primary">
                  {(parameters / 1_000_000_000).toFixed(2)}B
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Compute Allocation (GPU Hours)</label>
                <Input
                  type="number"
                  value={computeAllocation.toString()}
                  onValueChange={(value) => setComputeAllocation(parseInt(value) || 0)}
                  endContent={<span className="text-default-400">hours</span>}
                  description="Number of GPU hours to allocate"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-default-100 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-1">Estimated Time</p>
                  <p className="text-2xl font-bold text-warning">{estimatedTime}h</p>
                  <p className="text-xs text-default-500 mt-1">Training duration</p>
                </div>
                <div className="bg-default-100 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-1">Estimated Cost</p>
                  <p className="text-2xl font-bold text-danger">{formatCurrency(estimatedCost)}</p>
                  <p className="text-xs text-default-500 mt-1">Total training cost</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">API Endpoint Name</label>
                <Input
                  type="text"
                  value={apiEndpoint}
                  onValueChange={setApiEndpoint}
                  placeholder="my-model-api"
                  description="Endpoint will be /api/ai/models/{endpoint}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Scaling Policy</label>
                <Select
                  selectedKeys={[scalingPolicy]}
                  onSelectionChange={(keys) => setScalingPolicy(String(Array.from(keys)[0]) as 'fixed' | 'auto')}
                >
                <SelectItem key="fixed">Fixed (constant replicas)</SelectItem>
                <SelectItem key="auto">Auto (scale based on demand)</SelectItem>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={monitoring}
                  onChange={(e) => setMonitoring(e.target.checked)}
                  className="rounded"
                />
                <label className="text-sm">Enable monitoring and alerts</label>
              </div>
              <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border-2 border-primary">
                <h4 className="font-semibold mb-2">Training Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-default-600">Architecture:</span>
                    <Chip size="sm">{architecture}</Chip>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-600">Model Size:</span>
                    <span className="font-medium">{modelSize} ({(parameters / 1_000_000_000).toFixed(2)}B params)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-600">Dataset Quality:</span>
                    <Chip size="sm" color={datasetQuality === 'premium' ? 'success' : 'default'}>{datasetQuality}</Chip>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-600">Estimated Time:</span>
                    <span className="font-medium">{estimatedTime} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-600">Total Cost:</span>
                    <span className="font-bold text-danger">{formatCurrency(estimatedCost)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="flat"
          onPress={currentStep === 1 ? onCancel : handleBack}
        >
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </Button>
        <Button
          color="primary"
          onPress={currentStep === totalSteps ? handleSubmit : handleNext}
        >
          {currentStep === totalSteps ? 'Submit Training Job' : 'Next'}
        </Button>
      </div>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Multi-Step Flow**: 4 steps (Dataset → Architecture → Training → Deployment)
 * 2. **Progress Indicator**: Visual stepper showing current step and completion %
 * 3. **Real-Time Calculations**: Cost and time estimates update as user configures
 * 4. **Architecture Options**: Transformer, CNN, RNN, Diffusion, GAN with size tiers
 * 5. **Dataset Quality**: Low/Medium/High/Premium with different costs
 * 6. **Deployment Config**: API endpoint, scaling policy, monitoring toggle
 * 7. **Summary Review**: Final step shows complete training configuration
 * 8. **Navigation**: Back/Next/Submit buttons with proper state management
 * 
 * ADAPTED FROM:
 * - DataCenterDesigner.tsx wizard pattern and multi-section flow
 * - HeroUI Select, Input, Progress components
 * - Real-time cost calculation pattern from old GPU cluster builder
 */
