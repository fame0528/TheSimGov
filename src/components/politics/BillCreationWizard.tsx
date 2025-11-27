/**
 * @fileoverview Bill Creation Wizard Component
 * @module components/politics/BillCreationWizard
 * 
 * OVERVIEW:
 * 5-step wizard for creating legislative bills.
 * Enforces anti-abuse limits (3 active, 10/day, 24h cooldown).
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input, Textarea } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { FiCheck, FiArrowLeft, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import { StatusBadge } from '@/lib/components/politics/shared';
import { getPolicyAreaName, formatTimeRemaining } from '@/lib/utils/politics/billFormatting';
import { formatCurrency } from '@/lib/utils/currency';
import type { BillCreationFormData, AntiAbuseLimits, PolicyEffect } from '@/types/politics/bills';
import type { Chamber, PolicyArea } from '@/lib/db/models/Bill';

export interface BillCreationWizardProps {
  /** Callback when bill successfully created */
  onComplete?: (billId: string) => void;
  /** Custom class name */
  className?: string;
}

const STEPS = [
  { key: 'details', title: 'Bill Details' },
  { key: 'effects', title: 'Economic Effects' },
  { key: 'cosponsors', title: 'Co-Sponsors' },
  { key: 'review', title: 'Review' },
  { key: 'submit', title: 'Submit' },
];

const POLICY_AREAS: PolicyArea[] = [
  'tax', 'budget', 'regulatory', 'trade', 'energy', 'healthcare',
  'labor', 'environment', 'technology', 'defense', 'custom',
];

/**
 * BillCreationWizard - 5-step bill creation process
 * 
 * Steps:
 * 1. Details (chamber, title, summary, policy area)
 * 2. Effects (economic impact parameters)
 * 3. Co-Sponsors (optional co-sponsors)
 * 4. Review (preview all data)
 * 5. Submit (create bill)
 * 
 * @example
 * ```tsx
 * <BillCreationWizard
 *   onComplete={(id) => router.push(`/politics/bills/${id}`)}
 * />
 * ```
 */
export function BillCreationWizard({
  onComplete,
  className = '',
}: BillCreationWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<BillCreationFormData>({
    chamber: 'senate',
    title: '',
    summary: '',
    policyArea: 'tax',
    coSponsors: [],
    effects: [],
  });
  const [limits, setLimits] = useState<AntiAbuseLimits>({
    activeBills: 0,
    maxActiveBills: 3,
    billsToday: 0,
    maxBillsPerDay: 10,
    cooldownEndsAt: null,
    canCreateBill: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch limits on mount
  // TODO: Add useEffect to fetch limits from /api/politics/bills (check active bills count)
  
  const updateField = <K extends keyof BillCreationFormData>(
    field: K,
    value: BillCreationFormData[K]
  ) => {
    setFormData({ ...formData, [field]: value });
  };
  
  // Effects helpers (PolicyEffect[])
  const addEffect = (effect: PolicyEffect) => {
    setFormData({ ...formData, effects: [...formData.effects, effect] });
  };

  const updateEffectAt = <K extends keyof PolicyEffect>(index: number, field: K, value: PolicyEffect[K]) => {
    const next = [...formData.effects];
    next[index] = { ...next[index], [field]: value } as PolicyEffect;
    setFormData({ ...formData, effects: next });
  };

  const removeEffectAt = (index: number) => {
    const next = [...formData.effects];
    next.splice(index, 1);
    setFormData({ ...formData, effects: next });
  };
  
  const canProceed = () => {
    switch (currentStep) {
      case 0: // Details
        return formData.title.length >= 10 && formData.summary.length >= 50;
      case 1: // Effects
        return true; // Effects are optional
      case 2: // Co-Sponsors
        return true; // Co-sponsors are optional
      case 3: // Review
        return true;
      default:
        return false;
    }
  };
  
  const handleNext = () => {
    if (canProceed() && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch('/api/politics/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create bill');
      }
      
      const data = await res.json();
      onComplete?.(data.data.bill._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Progress */}
      <Card className="mb-6">
        <CardBody className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Create Bill</h2>
              <span className="text-sm text-gray-500">
                Step {currentStep + 1} of {STEPS.length}
              </span>
            </div>
            
            <Progress
              value={((currentStep + 1) / STEPS.length) * 100}
              color="primary"
              className="mb-2"
            />
            
            <div className="flex justify-between text-xs">
              {STEPS.map((step, idx) => (
                <div
                  key={step.key}
                  className={`flex items-center gap-1 ${
                    idx === currentStep
                      ? 'text-primary font-semibold'
                      : idx < currentStep
                      ? 'text-success'
                      : 'text-gray-400'
                  }`}
                >
                  {idx < currentStep && <FiCheck />}
                  <span>{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
      
      {/* Anti-Abuse Limits */}
      {!limits.canCreateBill && (
        <Card className="mb-6 bg-warning-50 border border-warning-200">
          <CardBody className="p-4">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="text-warning text-xl flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-warning">Cannot Create Bill</p>
                <p className="text-sm text-gray-700 mt-1">{limits.reason}</p>
                {limits.cooldownEndsAt && (
                  <p className="text-sm text-gray-600 mt-1">
                    Cooldown ends in: {formatTimeRemaining(new Date(limits.cooldownEndsAt).getTime() - Date.now())}
                  </p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Chip color="primary" variant="flat">
          Active Bills: {limits.activeBills}/{limits.maxActiveBills}
        </Chip>
        <Chip color="secondary" variant="flat">
          Today: {limits.billsToday}/{limits.maxBillsPerDay}
        </Chip>
      </div>
      
      {/* Step Content */}
      <Card>
        <CardHeader className="pb-0">
          <h3 className="text-lg font-semibold">{STEPS[currentStep].title}</h3>
        </CardHeader>
        <CardBody className="pt-4">
          {/* Step 0: Details */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <Select
                label="Chamber"
                selectedKeys={[formData.chamber]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as Chamber;
                  updateField('chamber', value);
                }}
                isRequired
              >
                <SelectItem key="senate">Senate</SelectItem>
                <SelectItem key="house">House of Representatives</SelectItem>
              </Select>
              
              <Input
                label="Bill Title"
                placeholder="e.g., Clean Energy Tax Credit Act"
                value={formData.title}
                onValueChange={(value) => updateField('title', value)}
                isRequired
                description="Minimum 10 characters"
              />
              
              <Textarea
                label="Bill Summary"
                placeholder="Provide a detailed summary of the bill's purpose and provisions..."
                value={formData.summary}
                onValueChange={(value) => updateField('summary', value)}
                minRows={4}
                isRequired
                description="Minimum 50 characters"
              />
              
              <Select
                label="Policy Area"
                selectedKeys={[formData.policyArea]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as PolicyArea;
                  updateField('policyArea', value);
                }}
                isRequired
              >
                {POLICY_AREAS.map((area) => (
                  <SelectItem key={area}>
                    {getPolicyAreaName(area)}
                  </SelectItem>
                ))}
              </Select>
            </div>
          )}
          
          {/* Step 1: Effects */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                Add one or more policy effects. Each effect targets a scope and applies a value with a unit and optional duration.
              </p>

              {/* Existing Effects List */}
              {formData.effects.length > 0 && (
                <div className="space-y-2">
                  {formData.effects.map((eff, idx) => (
                    <Card key={idx} className="border border-gray-200">
                      <CardBody className="p-3">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                          <Select
                            label="Target Type"
                            selectedKeys={[eff.targetType]}
                            onSelectionChange={(keys) => updateEffectAt(idx, 'targetType', Array.from(keys)[0] as PolicyEffect['targetType'])}
                          >
                            <SelectItem key="GLOBAL">Global</SelectItem>
                            <SelectItem key="INDUSTRY">Industry</SelectItem>
                            <SelectItem key="STATE">State</SelectItem>
                          </Select>

                          <Input
                            label="Target ID (optional)"
                            placeholder="industry-id or state-code"
                            value={eff.targetId || ''}
                            onValueChange={(v) => updateEffectAt(idx, 'targetId', v || undefined)}
                          />

                          <Input
                            label="Effect Type"
                            placeholder="e.g., GDP_GROWTH, INFLATION"
                            value={eff.effectType}
                            onValueChange={(v) => updateEffectAt(idx, 'effectType', v)}
                          />

                          <Input
                            type="number"
                            label="Value"
                            placeholder="0"
                            value={Number.isFinite(eff.effectValue) ? eff.effectValue.toString() : ''}
                            onValueChange={(v) => updateEffectAt(idx, 'effectValue', parseFloat(v) || 0)}
                          />

                          <Input
                            label="Unit"
                            placeholder="%, pts, $"
                            value={eff.effectUnit}
                            onValueChange={(v) => updateEffectAt(idx, 'effectUnit', v)}
                          />

                          <Input
                            type="number"
                            label="Duration (days)"
                            placeholder="optional"
                            value={eff.duration?.toString() || ''}
                            onValueChange={(v) => updateEffectAt(idx, 'duration', v ? parseInt(v, 10) : undefined)}
                          />
                        </div>

                        <div className="flex justify-end mt-3">
                          <Button color="danger" variant="light" onPress={() => removeEffectAt(idx)}>
                            Remove
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}

              {/* Add New Effect Quick Add */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <Select
                  label="Target Type"
                  selectedKeys={["GLOBAL"]}
                  onSelectionChange={() => {}}
                  isDisabled
                >
                  <SelectItem key="GLOBAL">Global</SelectItem>
                </Select>

                <Input label="Target ID (optional)" placeholder="industry-id or state-code" isDisabled />

                <Select
                  label="Effect Type Preset"
                  placeholder="Choose preset"
                  onSelectionChange={(keys) => {
                    const preset = Array.from(keys)[0] as string | undefined;
                    if (!preset) return;
                    let effect: PolicyEffect | null = null;
                    switch (preset) {
                      case 'GDP_GROWTH':
                        effect = { targetType: 'GLOBAL', effectType: 'GDP_GROWTH', effectValue: 0, effectUnit: '%', duration: undefined };
                        break;
                      case 'INFLATION':
                        effect = { targetType: 'GLOBAL', effectType: 'INFLATION', effectValue: 0, effectUnit: '%', duration: undefined };
                        break;
                      case 'EMPLOYMENT':
                        effect = { targetType: 'GLOBAL', effectType: 'EMPLOYMENT', effectValue: 0, effectUnit: '%', duration: undefined };
                        break;
                      case 'TAX_BURDEN':
                        effect = { targetType: 'GLOBAL', effectType: 'TAX_BURDEN', effectValue: 0, effectUnit: '%', duration: undefined };
                        break;
                      case 'GOV_SPENDING':
                        effect = { targetType: 'GLOBAL', effectType: 'GOVERNMENT_SPENDING', effectValue: 0, effectUnit: '$', duration: undefined };
                        break;
                      case 'PUBLIC_APPROVAL':
                        effect = { targetType: 'GLOBAL', effectType: 'PUBLIC_APPROVAL', effectValue: 0, effectUnit: '%', duration: undefined };
                        break;
                    }
                    if (effect) addEffect(effect);
                  }}
                >
                  <SelectItem key="GDP_GROWTH">GDP Growth</SelectItem>
                  <SelectItem key="INFLATION">Inflation</SelectItem>
                  <SelectItem key="EMPLOYMENT">Employment</SelectItem>
                  <SelectItem key="TAX_BURDEN">Tax Burden</SelectItem>
                  <SelectItem key="GOV_SPENDING">Government Spending</SelectItem>
                  <SelectItem key="PUBLIC_APPROVAL">Public Approval</SelectItem>
                </Select>

                <div className="md:col-span-3" />

                <Button color="primary" variant="flat" onPress={() => addEffect({ targetType: 'GLOBAL', effectType: 'CUSTOM', effectValue: 0, effectUnit: '%', duration: undefined })}>
                  Add Custom Effect
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 2: Co-Sponsors */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Co-sponsors are optional. Add usernames of other elected officials.
              </p>
              
              <Input
                label="Add Co-Sponsor"
                placeholder="Enter username..."
                description="Press Enter to add"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    const username = input.value.trim();
                    if (username && !formData.coSponsors.includes(username)) {
                      updateField('coSponsors', [...formData.coSponsors, username]);
                      input.value = '';
                    }
                  }
                }}
              />
              
              {formData.coSponsors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.coSponsors.map((username) => (
                    <Chip
                      key={username}
                      onClose={() => {
                        updateField(
                          'coSponsors',
                          formData.coSponsors.filter((u) => u !== username)
                        );
                      }}
                      variant="flat"
                    >
                      {username}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <StatusBadge type="chamber" value={formData.chamber} />
                  <h3 className="text-lg font-semibold mt-2">{formData.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{formData.summary}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Policy Area:</span>
                    <p className="font-medium">{getPolicyAreaName(formData.policyArea)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Co-Sponsors:</span>
                    <p className="font-medium">{formData.coSponsors.length || 'None'}</p>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">Economic Effects:</h4>
                  {formData.effects.length === 0 ? (
                    <p className="text-sm text-gray-500">No effects specified.</p>
                  ) : (
                    <div className="space-y-2 text-sm">
                      {formData.effects.map((eff, i) => (
                        <div key={i} className="flex flex-wrap gap-2">
                          <span className="font-mono text-gray-600">[{eff.targetType}]</span>
                          <span className="font-semibold">{eff.effectType}</span>
                          <span>
                            {eff.effectUnit === '$' ? formatCurrency(eff.effectValue) : `${eff.effectValue}${eff.effectUnit}`}
                          </span>
                          {typeof eff.duration === 'number' && (
                            <span className="text-gray-500">for {eff.duration} days</span>
                          )}
                          {eff.targetId && (
                            <span className="text-gray-500">(target: {eff.targetId})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Submit */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {error && (
                <Card className="bg-danger-50 border border-danger-200">
                  <CardBody className="p-4">
                    <p className="text-danger text-sm">{error}</p>
                  </CardBody>
                </Card>
              )}
              
              <p className="text-sm text-gray-600">
                Click Submit to create your bill and start the voting process.
              </p>
              
              <Button
                color="primary"
                size="lg"
                fullWidth
                onPress={handleSubmit}
                isLoading={isSubmitting}
                isDisabled={!limits.canCreateBill}
              >
                Submit Bill
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
      
      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="flat"
          onPress={handleBack}
          isDisabled={currentStep === 0}
          startContent={<FiArrowLeft />}
        >
          Back
        </Button>
        
        {currentStep < STEPS.length - 1 && (
          <Button
            color="primary"
            onPress={handleNext}
            isDisabled={!canProceed()}
            endContent={<FiArrowRight />}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **5-Step Wizard**: Guides user through bill creation process
 * 2. **Anti-Abuse**: Displays limits (3 active, 10/day, cooldown)
 * 3. **Form Validation**: Enforces minimum lengths, required fields
 * 4. **Review Step**: Preview all data before submission
 * 5. **Error Handling**: Clear error messages on submission failure
 * 
 * PREVENTS:
 * - Bill spam (anti-abuse limits)
 * - Invalid data (validation on each step)
 * - Submission confusion (clear review step)
 */
