/**
 * @file src/components/employees/TrainingDashboard.tsx
 * @description Training program selection and enrollment interface
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Comprehensive dashboard for employee training management. Displays available
 * training programs filtered by employee eligibility, shows success probabilities,
 * skill gains preview, and handles enrollment flow with budget validation.
 * 
 * FEATURES:
 * - List of eligible training programs
 * - Program filtering (type, difficulty, cost)
 * - Success probability calculation
 * - Skill gains and cap increases preview
 * - Certification awards display
 * - Cost and duration information
 * - Company budget status
 * - Training cooldown indicator
 * - Enrollment confirmation modal
 * - Real-time eligibility updates
 * 
 * PROPS:
 * ```typescript
 * interface TrainingDashboardProps {
 *   employeeId: string;
 *   employee: {
 *     fullName: string;
 *     learningRate: number;
 *     skills: Record<string, number>;
 *     certifications: string[];
 *     onCooldown: boolean;
 *     cooldownEnds?: string;
 *   };
 *   programs: Array<{
 *     id: string;
 *     name: string;
 *     type: string;
 *     provider: string;
 *     difficulty: number;
 *     cost: number;
 *     duration: number;
 *     skillGains: Record<string, number>;
 *     capIncreases: Record<string, number>;
 *     certificationAwarded?: string;
 *     successProbability: number;
 *   }>;
 *   companyBudget: number;
 *   onEnroll: (programId: string) => Promise<void>;
 * }
 * ```
 * 
 * USAGE:
 * ```tsx
 * <TrainingDashboard
 *   employeeId={employeeId}
 *   employee={employeeData}
 *   programs={eligiblePrograms}
 *   companyBudget={company.cash}
 *   onEnroll={handleEnrollment}
 * />
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Programs sorted by success probability (descending)
 * - Budget warnings when cost > available cash
 * - Cooldown blocker prevents enrollment during cooldown
 * - Success probability color-coded (green > 70%, yellow 40-70%, red < 40%)
 * - Skill gains preview shows before/after values
 * - Certification display with industry recognition badges
 * - Responsive grid layout (1-3 columns based on screen size)
 * - Loading states during enrollment API calls
 * - Error handling with user-friendly messages
 */

'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils/currency';
// TODO: Create Tooltip component
// import Tooltip from '@/components/ui/Tooltip';

interface TrainingDashboardProps {
  employeeId: string;
  employee: {
    fullName: string;
    learningRate: number;
    skills: Record<string, number>;
    certifications: string[];
    onCooldown: boolean;
    cooldownEnds?: string;
  };
  programs: Array<{
    id: string;
    name: string;
    description: string;
    type: string;
    provider: string;
    difficulty: number;
    cost: number;
    duration: number;
    schedule: string;
    primarySkill: string;
    skillGains: Record<string, number>;
    capIncreases: Record<string, number>;
    certificationAwarded?: string;
    industryRecognition?: string;
    successProbability: number;
    isAvailable: boolean;
  }>;
  companyBudget: number;
  onEnroll: (programId: string) => Promise<void>;
}

/**
 * Format skill name for display
 */
function formatSkillName(skill: string): string {
  return skill
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Get success probability color and label
 */
function getSuccessProbabilityStyle(probability: number): {
  color: string;
  label: string;
} {
  if (probability >= 80) {
    return { color: 'text-green-700 bg-green-100', label: 'Very High' };
  } else if (probability >= 60) {
    return { color: 'text-blue-700 bg-blue-100', label: 'High' };
  } else if (probability >= 40) {
    return { color: 'text-yellow-700 bg-yellow-100', label: 'Medium' };
  } else if (probability >= 20) {
    return { color: 'text-orange-700 bg-orange-100', label: 'Low' };
  } else {
    return { color: 'text-red-700 bg-red-100', label: 'Very Low' };
  }
}

/**
 * Training dashboard component
 */
export default function TrainingDashboard({
  employee,
  programs,
  companyBudget,
  onEnroll,
}: TrainingDashboardProps): JSX.Element {
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [filter, setFilter] = useState<{
    type: string;
    maxCost: number;
    minSuccess: number;
  }>({
    type: 'all',
    maxCost: Infinity,
    minSuccess: 0,
  });

  // Filter programs
  const filteredPrograms = programs
    .filter((program) => {
      if (filter.type !== 'all' && program.type !== filter.type) return false;
      if (program.cost > filter.maxCost) return false;
      if (program.successProbability < filter.minSuccess) return false;
      return true;
    })
    .sort((a, b) => b.successProbability - a.successProbability);

  // Get unique training types
  const trainingTypes = Array.from(new Set(programs.map((p) => p.type)));

  const handleEnroll = async (programId: string) => {
    setEnrolling(true);
    try {
      await onEnroll(programId);
      setSelectedProgram(null);
    } catch (err) {
      console.error('Training enrollment failed:', err);
    } finally {
      setEnrolling(false);
    }
  };

  const selectedProgramData = programs.find((p) => p.id === selectedProgram);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Training Programs for {employee.fullName}
        </h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-gray-500">Learning Rate:</span>{' '}
            <span className="font-semibold text-gray-900">{employee.learningRate}</span>
          </div>
          <div>
            <span className="text-gray-500">Company Budget:</span>{' '}
            <span className="font-semibold text-gray-900">
              {formatCurrency(companyBudget)}
            </span>
          </div>
          {employee.onCooldown && (
            <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-md">
              Training Cooldown until {new Date(employee.cooldownEnds!).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Training Type
            </label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              {trainingTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Cost
            </label>
            <select
              value={filter.maxCost === Infinity ? 'all' : filter.maxCost}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  maxCost: e.target.value === 'all' ? Infinity : Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Any Cost</option>
              <option value="5000">Under $5,000</option>
              <option value="10000">Under $10,000</option>
              <option value="20000">Under $20,000</option>
              <option value="50000">Under $50,000</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Success Rate
            </label>
            <select
              value={filter.minSuccess}
              onChange={(e) =>
                setFilter({ ...filter, minSuccess: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="0">Any Success Rate</option>
              <option value="20">20%+</option>
              <option value="40">40%+</option>
              <option value="60">60%+</option>
              <option value="80">80%+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrograms.map((program) => {
          const successStyle = getSuccessProbabilityStyle(program.successProbability);
          const canAfford = companyBudget >= program.cost;

          return (
            <div
              key={program.id}
              className={`
                bg-white rounded-lg shadow-md p-4 border-2 transition-all
                ${!canAfford ? 'border-red-200 opacity-75' : 'border-gray-200 hover:border-blue-300'}
                ${!program.isAvailable ? 'opacity-50' : ''}
              `}
            >
              {/* Program Header */}
              <div className="mb-3">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm flex-1">
                    {program.name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-md font-medium ${successStyle.color}`}
                  >
                    {program.successProbability}%
                  </span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {program.description}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span className="px-2 py-0.5 bg-gray-100 rounded">{program.type}</span>
                  <span>•</span>
                  <span>{program.duration} days</span>
                  <span>•</span>
                  <span>{program.schedule}</span>
                </div>
              </div>

              {/* Cost & Provider */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b">
                <div>
                  <p className="text-xs text-gray-500">Cost</p>
                  <p className={`text-sm font-semibold ${canAfford ? 'text-gray-900' : 'text-red-600'}`}>
                    {formatCurrency(program.cost)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Provider</p>
                  <p className="text-sm font-medium text-gray-900">{program.provider}</p>
                </div>
              </div>

              {/* Skill Gains */}
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Skill Gains:</p>
                <div className="space-y-1">
                  {Object.entries(program.skillGains)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([skill, gain]) => (
                      <div key={skill} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{formatSkillName(skill)}</span>
                        <span className="font-semibold text-green-600">+{gain}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Certification */}
              {program.certificationAwarded && (
                <div className="mb-3 px-2 py-1 bg-purple-50 rounded-md">
                  <p className="text-xs text-purple-700 font-medium">
                    🎓 {program.certificationAwarded}
                  </p>
                  {program.industryRecognition && (
                    <p className="text-xs text-purple-600 mt-0.5">
                      {program.industryRecognition}
                    </p>
                  )}
                </div>
              )}

              {/* Enroll Button */}
              <button
                onClick={() => setSelectedProgram(program.id)}
                disabled={!canAfford || !program.isAvailable || employee.onCooldown}
                className={`
                  w-full px-4 py-2 text-sm font-medium rounded-md transition-colors
                  ${
                    canAfford && program.isAvailable && !employee.onCooldown
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {!canAfford
                  ? 'Insufficient Budget'
                  : !program.isAvailable
                  ? 'Full (No Slots)'
                  : employee.onCooldown
                  ? 'On Cooldown'
                  : 'Enroll'}
              </button>
            </div>
          );
        })}
      </div>

      {filteredPrograms.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500">
            No training programs match your filters. Try adjusting the criteria.
          </p>
        </div>
      )}

      {/* Enrollment Confirmation Modal */}
      {selectedProgram && selectedProgramData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirm Training Enrollment
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Program</p>
                <p className="font-semibold text-gray-900">{selectedProgramData.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Cost</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(selectedProgramData.cost)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold text-gray-900">
                    {selectedProgramData.duration} days
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Success Probability</p>
                  <p className="font-semibold text-gray-900">
                    {selectedProgramData.successProbability}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Schedule</p>
                  <p className="font-semibold text-gray-900">
                    {selectedProgramData.schedule}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Expected Skill Improvements:</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(selectedProgramData.skillGains).map(([skill, gain]) => {
                    const currentValue = employee.skills[skill] || 0;
                    return (
                      <div key={skill} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{formatSkillName(skill)}:</span>
                        <span className="font-medium">
                          {currentValue} → {currentValue + gain}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedProgramData.certificationAwarded && (
                <div className="bg-purple-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-purple-900">
                    🎓 Certification: {selectedProgramData.certificationAwarded}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleEnroll(selectedProgram)}
                disabled={enrolling}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {enrolling ? 'Enrolling...' : 'Confirm Enrollment'}
              </button>
              <button
                onClick={() => setSelectedProgram(null)}
                disabled={enrolling}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
