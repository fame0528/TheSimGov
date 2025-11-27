/**
 * Employee Management Page
 * Created: 2025-11-13
 * 
 * OVERVIEW:
 * Comprehensive employee management interface with filtering, sorting, search,
 * and bulk actions. Displays employee cards in grid layout with detailed metrics.
 * Integrates with all employee API endpoints for full CRUD operations.
 * 
 * FEATURES:
 * - Employee grid with EmployeeCard components
 * - Advanced filtering (role, performance, retention risk, status)
 * - Real-time search by name
 * - Sorting options (name, salary, performance, risk, hire date)
 * - Pagination controls
 * - Hire new employee modal
 * - Statistics dashboard
 * - Bulk actions support
 * - Responsive layout
 */

'use client';

import { useState, useEffect } from 'react';
import EmployeeCard from '@/components/employees/EmployeeCard'; // Path alias relies on tsconfig paths

interface Employee {
  _id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  role: string;
  experienceLevel: string;
  salary: number;
  bonus: number;
  equity: number;
  skills: Record<string, number>;
  skillCaps: Record<string, number>;
  averageSkill: number;
  loyalty: number;
  morale: number;
  satisfaction: number;
  performanceRating: number;
  retentionRisk: number;
  poachResistance: number;
  contractsCompleted: number;
  projectsCompleted: number;
  revenueGenerated: number;
  totalTrainingInvestment: number;
  certifications: string[];
  hiredAt: string;
  firedAt?: string;
  nextReviewDate: string;
  trainingCooldown?: string;
}

interface Statistics {
  total: number;
  active: number;
  inactive: number;
  avgSalary: number;
  avgPerformance: number;
  avgRetentionRisk: number;
  totalPayroll: number;
}

interface HireFormData {
  firstName: string;
  lastName: string;
  role: string;
  experienceLevel: string;
}

const ROLES = [
  'Lobbyist', 'Campaign Manager', 'Policy Analyst', 'Communications Director',
  'Field Organizer', 'Data Analyst', 'Finance Director', 'Legal Counsel',
  'Media Relations', 'Speechwriter', 'Opposition Researcher', 'Pollster',
  'Digital Strategist', 'Fundraising Coordinator', 'Volunteer Coordinator',
  'Press Secretary', 'Chief of Staff', 'Legislative Director', 'Political Director',
  'Compliance Officer'
];

const EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'expert', 'master', 'legendary'];

export default function EmployeesPage() {
  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [minPerformance, setMinPerformance] = useState('');
  const [maxRetentionRisk, setMaxRetentionRisk] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Hire modal
  const [showHireModal, setShowHireModal] = useState(false);
  const [hiring, setHiring] = useState(false);
  const [hireForm, setHireForm] = useState<HireFormData>({
    firstName: '',
    lastName: '',
    role: ROLES[0],
    experienceLevel: 'entry',
  });

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      });

      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (includeInactive) params.append('includeInactive', 'true');
      if (minPerformance) params.append('minPerformance', minPerformance);
      if (maxRetentionRisk) params.append('maxRetentionRisk', maxRetentionRisk);

      const res = await fetch(`/api/employees?${params}`);
      const data = await res.json();

      if (data.success) {
        setEmployees(data.employees);
        setStatistics(data.statistics);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and filter changes
  useEffect(() => {
    fetchEmployees();
  }, [page, search, roleFilter, includeInactive, minPerformance, maxRetentionRisk, sortBy, sortOrder]);

  // Handle hire employee
  const handleHire = async () => {
    try {
      setHiring(true);
      const res = await fetch('/api/employees/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hireForm),
      });

      const data = await res.json();

      if (data.success) {
        setShowHireModal(false);
        setHireForm({
          firstName: '',
          lastName: '',
          role: ROLES[0],
          experienceLevel: 'entry',
        });
        fetchEmployees(); // Refresh list
      } else {
        alert(data.error || 'Failed to hire employee');
      }
    } catch (error) {
      console.error('Error hiring employee:', error);
      alert('Failed to hire employee');
    } finally {
      setHiring(false);
    }
  };

  // Handle fire employee
  const handleFire = async (employeeId: string) => {
    if (!confirm('Are you sure you want to terminate this employee?')) return;

    try {
      const res = await fetch(`/api/employees/${employeeId}/fire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Position eliminated' }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`Employee terminated. Severance: $${data.severance.amount.toFixed(2)}`);
        fetchEmployees(); // Refresh list
      } else {
        alert(data.error || 'Failed to terminate employee');
      }
    } catch (error) {
      console.error('Error firing employee:', error);
      alert('Failed to terminate employee');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <button
            onClick={() => setShowHireModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + Hire Employee
          </button>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="text-sm text-gray-600">Total Employees</div>
              <div className="text-2xl font-bold text-gray-900">{statistics.active}</div>
              <div className="text-xs text-gray-500">{statistics.inactive} inactive</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="text-sm text-gray-600">Avg Salary</div>
              <div className="text-2xl font-bold text-gray-900">
                ${(statistics.avgSalary / 1000).toFixed(0)}k
              </div>
              <div className="text-xs text-gray-500">
                ${(statistics.totalPayroll / 1000).toFixed(0)}k monthly payroll
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="text-sm text-gray-600">Avg Performance</div>
              <div className="text-2xl font-bold text-gray-900">
                {statistics.avgPerformance.toFixed(1)} ⭐
              </div>
              <div className="text-xs text-gray-500">out of 5.0</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="text-sm text-gray-600">Avg Retention Risk</div>
              <div className="text-2xl font-bold text-gray-900">
                {statistics.avgRetentionRisk.toFixed(0)}%
              </div>
              <div className={`text-xs ${statistics.avgRetentionRisk < 40 ? 'text-green-600' : statistics.avgRetentionRisk < 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {statistics.avgRetentionRisk < 40 ? 'Low risk' : statistics.avgRetentionRisk < 60 ? 'Medium risk' : 'High risk'}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Roles</option>
                {ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Performance Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Performance
              </label>
              <select
                value={minPerformance}
                onChange={(e) => {
                  setMinPerformance(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Any</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
              </select>
            </div>

            {/* Retention Risk Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Retention Risk
              </label>
              <select
                value={maxRetentionRisk}
                onChange={(e) => {
                  setMaxRetentionRisk(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Any</option>
                <option value="40">Low (&lt;40%)</option>
                <option value="60">Medium (&lt;60%)</option>
                <option value="80">High (&lt;80%)</option>
              </select>
            </div>
          </div>

          {/* Sort and Status */}
          <div className="mt-4 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="name">Name</option>
                <option value="salary">Salary</option>
                <option value="performance">Performance</option>
                <option value="risk">Retention Risk</option>
                <option value="hireDate">Hire Date</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => {
                  setIncludeInactive(e.target.checked);
                  setPage(1);
                }}
                className="rounded"
              />
              <span className="text-gray-700">Include inactive employees</span>
            </label>
          </div>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading employees...</div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No employees found. {!includeInactive && 'Try including inactive employees.'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {employees.map(employee => (
                <EmployeeCard
                  key={employee._id}
                  employee={employee}
                  onFire={() => handleFire(employee._id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Hire Modal */}
      {showHireModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Hire New Employee</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={hireForm.firstName}
                  onChange={(e) => setHireForm({ ...hireForm, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={hireForm.lastName}
                  onChange={(e) => setHireForm({ ...hireForm, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={hireForm.role}
                  onChange={(e) => setHireForm({ ...hireForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience Level
                </label>
                <select
                  value={hireForm.experienceLevel}
                  onChange={(e) => setHireForm({ ...hireForm, experienceLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {EXPERIENCE_LEVELS.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleHire}
                disabled={hiring || !hireForm.firstName || !hireForm.lastName}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hiring ? 'Hiring...' : 'Hire Employee'}
              </button>
              <button
                onClick={() => setShowHireModal(false)}
                disabled={hiring}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
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

/**
 * IMPLEMENTATION NOTES:
 * 
 * Layout:
 * - Responsive grid: 1 column mobile, 2 tablet, 3 desktop
 * - Max width container for readability
 * - Clean spacing and visual hierarchy
 * 
 * Statistics Dashboard:
 * - Real-time summary of workforce metrics
 * - Color-coded retention risk indicator
 * - Monthly payroll calculation
 * - Active/inactive employee counts
 * 
 * Filtering System:
 * - Search by name (real-time)
 * - Role dropdown (20 political roles)
 * - Performance rating filter (2-4+ stars)
 * - Retention risk filter (low/medium/high)
 * - Active/inactive toggle
 * 
 * Sorting:
 * - Name, salary, performance, retention risk, hire date
 * - Ascending/descending toggle
 * - Visual indicator (↑/↓)
 * 
 * Hire Modal:
 * - Simple form: first name, last name, role, experience
 * - Market salary calculated automatically
 * - Skills/talent randomized on backend
 * - Form validation
 * - Success/error handling
 * 
 * Fire Functionality:
 * - Confirmation dialog
 * - Severance calculation on backend
 * - Success message with severance amount
 * - Automatic list refresh
 * 
 * Pagination:
 * - 20 employees per page
 * - Previous/Next controls
 * - Page indicator
 * - Disabled states when at boundaries
 * 
 * Integration:
 * - EmployeeCard component for display
 * - All employee API endpoints (list, hire, fire)
 * - Real-time data refresh after actions
 * - Error handling with user feedback
 */
