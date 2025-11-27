/**
 * @fileoverview Employee Hire Wizard
 * @module app/(game)/employees/hire
 * 
 * OVERVIEW:
 * Multi-step hiring process with marketplace candidates.
 * Browse NPCs, negotiate salary, confirm hire with cost preview.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  Progress,
  Chip,
  Divider,
  Alert,
  Slider,
} from '@heroui/react';
import { DashboardLayout } from '@/lib/components/layouts';
import { LoadingSpinner, ErrorMessage, Card } from '@/lib/components/shared';
import { EmployeeCard, SkillsChart } from '@/lib/components/employee';
import { useAPI } from '@/lib/hooks/useAPI';
import { useHireEmployee } from '@/lib/hooks/useEmployee';
import { useCompany } from '@/lib/hooks/useCompany';
import { formatCurrency } from '@/lib/utils';
import { endpoints } from '@/lib/api/endpoints';
import type { Employee } from '@/lib/types';

/**
 * Hire Wizard Page
 * 
 * STEPS:
 * 1. Browse marketplace candidates (NPC generation)
 * 2. Select candidate and negotiate salary
 * 3. Review and confirm hire (with cash validation)
 * 
 * FEATURES:
 * - Company level-scaled candidates
 * - Salary negotiation within acceptable range
 * - Cost preview (first week upfront)
 * - Cash validation before hire
 * - Error handling for failed hires
 */
/**
 * Hire Employee Content Component
 * Wrapped in Suspense to handle useSearchParams
 */
function HireEmployeeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId');

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [negotiatedSalary, setNegotiatedSalary] = useState<number>(0);

  const { data: company } = useCompany(companyId || null);
  const { data: candidates, isLoading: candidatesLoading, error: candidatesError } = useAPI<any[]>(
    companyId ? `${endpoints.employees.marketplace}?companyId=${companyId}` : null
  );
  // Hook usage for hiring actions (previously missing causing undefined identifiers)
  const { mutate: hireEmployee, isLoading: isHiring, error: hireError } = useHireEmployee();
  const handleSelectCandidate = (candidate: any) => {
    setSelectedCandidate(candidate);
    setNegotiatedSalary(candidate.salaryExpectation);
    setStep(2);
  };

  /**
   * Handle hire confirmation
   */
  const handleConfirmHire = async () => {
    if (!companyId || !selectedCandidate) return;

    const hireCost = Math.round(negotiatedSalary / 52); // Weekly salary

    // Validate cash
    if (company && company.cash < hireCost) {
      return; // Alert will show
    }

    hireEmployee({
      companyId,
      name: selectedCandidate.name,
      role: selectedCandidate.role,
      salary: negotiatedSalary,
      skills: selectedCandidate.skills,
    });
  };

  /**
   * Calculate salary range
   */
  const getSalaryRange = (candidate: any) => {
    const min = Math.round(candidate.salaryExpectation * 0.85);
    const max = Math.round(candidate.salaryExpectation * 1.15);
    return { min, max };
  };

  if (!companyId) {
    return (
      <DashboardLayout title="Hire Employee" subtitle="No Company Selected">
        <Card>
          <div className="flex flex-col gap-4 py-8 items-center">
            <p className="text-lg text-default-600">
              Select a company first to hire employees.
            </p>
            <Button color="primary" onPress={() => router.push('/companies')}>
              Go to Companies
            </Button>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  const hireCost = selectedCandidate ? Math.round(negotiatedSalary / 52) : 0;
  const canAfford = company ? company.cash >= hireCost : false;

  return (
    <DashboardLayout
      title="Hire Employee"
      subtitle={
        step === 1 ? 'Browse Candidates' :
        step === 2 ? 'Negotiate Salary' :
        'Confirm Hire'
      }
    >
      <div className="flex flex-col gap-6">
        {/* Progress Indicator */}
        <Card>
          <div className="flex gap-4 justify-center items-center">
            <Chip color={step >= 1 ? 'primary' : 'default'}>1. Select Candidate</Chip>
            <Progress value={step >= 2 ? 100 : 0} size="sm" color="primary" className="flex-1" />
            <Chip color={step >= 2 ? 'primary' : 'default'}>2. Negotiate</Chip>
            <Progress value={step >= 3 ? 100 : 0} size="sm" color="primary" className="flex-1" />
            <Chip color={step >= 3 ? 'primary' : 'default'}>3. Confirm</Chip>
          </div>
        </Card>

        {/* Step 1: Browse Candidates */}
        {step === 1 && (
          <>
            {candidatesLoading && <LoadingSpinner size="lg" message="Generating candidates..." />}
            
            {candidatesError && <ErrorMessage error={candidatesError} />}

            {!candidatesLoading && !candidatesError && candidates && candidates.length === 0 && (
              <Card>
                <p className="text-lg text-default-600">
                  No candidates available. Try again later.
                </p>
              </Card>
            )}

            {!candidatesLoading && !candidatesError && candidates && candidates.length > 0 && (
              <>
                <Alert color="primary">
                  {candidates.length} candidates available. Quality scales with your company level ({company?.level || 1}).
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {candidates.map((candidate, idx) => (
                    <div key={idx}>
                      <EmployeeCard
                        employee={candidate}
                        onClick={() => handleSelectCandidate(candidate)}
                      />
                      <Button
                        color="primary"
                        size="sm"
                        className="w-full mt-2"
                        onPress={() => handleSelectCandidate(candidate)}
                      >
                        Select Candidate
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex justify-between">
              <Button variant="flat" onPress={() => router.push(`/employees?companyId=${companyId}`)}>
                Cancel
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Negotiate Salary */}
        {step === 2 && selectedCandidate && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Candidate Overview */}
              <Card title="Candidate Profile">
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-2xl font-bold">{selectedCandidate.name}</p>
                    <p className="text-lg text-default-600">
                      {selectedCandidate.role}
                    </p>
                  </div>

                  <Divider />

                  <SkillsChart skills={selectedCandidate.skills} />
                </div>
              </Card>

              {/* Salary Negotiation */}
              <Card title="Salary Negotiation">
                <div className="flex flex-col gap-6">
                  <div>
                    <p className="text-sm text-default-600 mb-2">
                      Salary Expectation: {formatCurrency(selectedCandidate.salaryExpectation)}
                    </p>
                    <p className="text-sm text-default-600">
                      Acceptable Range: {formatCurrency(getSalaryRange(selectedCandidate).min)} - {formatCurrency(getSalaryRange(selectedCandidate).max)}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Offered Salary</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(negotiatedSalary)}
                      </span>
                    </div>
                    <Slider
                      value={negotiatedSalary}
                      onChange={(value) => setNegotiatedSalary(value as number)}
                      minValue={getSalaryRange(selectedCandidate).min}
                      maxValue={getSalaryRange(selectedCandidate).max}
                      step={1000}
                      className="max-w-full"
                    />
                  </div>

                  <Divider />

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-default-600">
                        Annual Salary
                      </span>
                      <span className="font-semibold">{formatCurrency(negotiatedSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-default-600">
                        Weekly Cost
                      </span>
                      <span className="font-semibold">{formatCurrency(Math.round(negotiatedSalary / 52))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-bold">
                        Upfront Cost (Week 1)
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(hireCost)}
                      </span>
                    </div>
                  </div>

                  {company && company.cash < hireCost && (
                    <Alert color="danger">
                      Insufficient funds. You have {formatCurrency(company.cash)} but need {formatCurrency(hireCost)}.
                    </Alert>
                  )}
                </div>
              </Card>
            </div>

            <div className="flex justify-between">
              <Button variant="flat" onPress={() => setStep(1)}>
                Back to Candidates
              </Button>
              <Button color="primary" onPress={() => setStep(3)}>
                Continue to Review
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Confirm Hire */}
        {step === 3 && selectedCandidate && (
          <>
            <Card title="Confirm Hire">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-default-600">Candidate</p>
                    <p className="text-lg font-bold">{selectedCandidate.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-600">Role</p>
                    <p className="text-lg font-bold">{selectedCandidate.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-600">Annual Salary</p>
                    <p className="text-lg font-bold">{formatCurrency(negotiatedSalary)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-600">Upfront Cost</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(hireCost)}
                    </p>
                  </div>
                </div>

                <Divider />

                {company && (
                  <div className="flex justify-between">
                    <span>Company Cash</span>
                    <span className="font-bold">{formatCurrency(company.cash)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>After Hire</span>
                  <span className={`font-bold ${canAfford ? 'text-success' : 'text-danger'}`}>
                    {formatCurrency((company?.cash || 0) - hireCost)}
                  </span>
                </div>

                {!canAfford && (
                  <Alert color="danger">
                    Insufficient funds to complete hire.
                  </Alert>
                )}

                {hireError && <ErrorMessage error={hireError} />}
              </div>
            </Card>

            <div className="flex justify-between">
              <Button variant="flat" onPress={() => setStep(2)} isDisabled={isHiring}>
                Back to Negotiate
              </Button>
              <Button
                color="success"
                onPress={handleConfirmHire}
                isLoading={isHiring}
                isDisabled={!canAfford}
              >
                Confirm Hire
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

/**
 * Employee Hire Wizard
 */
export default function HireEmployeePage() {
  return (
    <DashboardLayout
      title="Hire Employee"
      subtitle="Browse and hire new employees for your company"
      maxWidth="container.xl"
    >
      <Suspense fallback={<LoadingSpinner />}>
        <HireEmployeeContent />
      </Suspense>
    </DashboardLayout>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Multi-Step Flow**: Clear progression through hiring process
 * 2. **Marketplace Scaling**: Company level determines candidate quality
 * 3. **Salary Negotiation**: Slider within acceptable range
 * 4. **Cost Validation**: Upfront cash check before hire
 * 5. **Error Handling**: Clear feedback on failures
 * 
 * PREVENTS:
 * - Hiring without sufficient funds
 * - Confusing salary ranges
 * - Poor candidate evaluation
 */
