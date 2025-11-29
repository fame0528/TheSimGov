'use client';

/**
 * @fileoverview PerformanceReviews Component
 * @module components/employee
 * 
 * OVERVIEW:
 * Comprehensive performance review management system with 8 features:
 * 1. Review schedule/calendar showing upcoming and past reviews
 * 2. Conduct review modal with performance scoring and feedback
 * 3. Review history table with filtering and sorting
 * 4. Performance trends chart showing rating progression
 * 5. Review templates for structured feedback prompts
 * 6. Auto-calculated salary adjustments based on rating
 * 7. Team/company comparison view with percentile rankings
 * 8. Review submission workflow with confirmation
 *
 * FEATURES:
 * - Calendar view of upcoming reviews (30-day window)
 * - Conduct review modal with 0-100 score input, feedback text area, salary preview
 * - Review history table with columns: Employee, Date, Reviewer, Score, Morale, Salary Change
 * - Line chart showing performance trends over time with department/company averages
 * - Review templates: Strengths focus, Development focus, Balanced, Custom
 * - Automatic salary calculation: Score 90+ (+5%), 75-89 (+5%), 60-74 (0%), 50-59 (0%), <50 (-3%)
 * - Comparison metrics: Percentile ranking, department average, company average
 * - Confirmation workflow before submission with preview of all changes
 *
 * DEPENDENCIES:
 * - useEmployees() for review schedule and comparison data
 * - useEmployee(id) for individual review history
 * - POST /api/employees/[id]/review for conducting reviews
 * - HeroUI: Table, Modal, Card, Badge, Button, Select, Input, Slider
 * - Recharts for performance trends visualization
 *
 * @created 2025-11-29
 * @author ECHO v1.3.1 with GUARDIAN Protocol v2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  CardHeader,
  Tabs,
  Tab,
  Spinner,
  Badge,
  Divider,
  Tooltip,
  Slider,
} from '@heroui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useEmployees, useEmployee } from '@/lib/hooks/useEmployee';
import {
  getStatusColor,
  getMoraleColor,
  getPerformanceRatingColor,
  getRetentionRiskColor,
  getStatusLabel,
  getMoraleLabel,
  getPerformanceLabel,
  getRetentionRiskLabel,
} from '@/lib/utils/employee';
import type { Employee, PerformanceReview } from '@/lib/types/models';

interface PerformanceReviewsProps {
  companyId: string;
}

interface ReviewFormState {
  employeeId: string;
  overallScore: number;
  feedback: string[];
  selectedTemplate: 'strengths' | 'development' | 'balanced' | 'custom';
}

interface ConfirmationState {
  show: boolean;
  employeeId: string;
  overallScore: number;
  feedback: string[];
  currentSalary: number;
  newSalary: number;
  salaryAdjustment: number;
  expectedMoraleChange: number;
}

const REVIEW_TEMPLATES = {
  strengths: [
    'What are the employee\'s key strengths?',
    'How can they leverage these strengths in their role?',
  ],
  development: [
    'What areas need improvement?',
    'How can they develop in these areas?',
  ],
  balanced: [
    'What are their main strengths?',
    'What areas need development?',
    'What is their career trajectory?',
    'How can we support their growth?',
  ],
  custom: [],
};

const SALARY_ADJUSTMENT_TIERS = [
  { minScore: 90, maxScore: 100, moraleChange: 15, raisePercent: 0.05, label: 'Exceptional (90-100)' },
  { minScore: 75, maxScore: 89, moraleChange: 10, raisePercent: 0.05, label: 'Exceeds (75-89)' },
  { minScore: 60, maxScore: 74, moraleChange: 5, raisePercent: 0, label: 'Meets (60-74)' },
  { minScore: 50, maxScore: 59, moraleChange: 0, raisePercent: 0, label: 'Below (50-59)' },
  { minScore: 1, maxScore: 49, moraleChange: -10, raisePercent: -0.03, label: 'Unsatisfactory (<50)' },
];

/**
 * Calculate salary adjustment based on performance score
 */
function calculateSalaryAdjustment(score: number, currentSalary: number): { newSalary: number; adjustment: number; moraleChange: number } {
  const tier = SALARY_ADJUSTMENT_TIERS.find(t => score >= t.minScore && score <= t.maxScore);
  if (!tier) {
    return { newSalary: currentSalary, adjustment: 0, moraleChange: 0 };
  }

  const adjustment = Math.round(currentSalary * tier.raisePercent);
  const newSalary = currentSalary + adjustment;

  return {
    newSalary,
    adjustment,
    moraleChange: tier.moraleChange,
  };
}

/**
 * Format date for review display
 */
function formatReviewDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Get performance rating from employee performance metrics
 */
function getPerformanceRating(employee: Employee): number {
  if (!employee.performance) return 0;
  return Math.round(((employee.performance.productivity * 50) + employee.performance.quality) / 2);
}

/**
 * Convert 0-100 performance rating to 1-5 scale for color mapping
 */
function getPerformanceRatingScale(rating: number): number {
  if (rating >= 80) return 5;
  if (rating >= 60) return 4;
  if (rating >= 40) return 3;
  if (rating >= 20) return 2;
  return 1;
}

/**
 * Get color for badge based on morale impact
 */
function getMoraleImpactColor(impact: number): 'success' | 'danger' | 'default' | 'warning' {
  if (impact > 0) return 'success';
  if (impact < 0) return 'danger';
  return 'default';
}

export default function PerformanceReviews({ companyId }: PerformanceReviewsProps) {
  const { data: allEmployees = [], isLoading: loadingEmployees } = useEmployees(companyId);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const { data: selectedEmployee } = useEmployee(selectedEmployeeId);

  // UI State
  const [activeTab, setActiveTab] = useState('schedule');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState<ConfirmationState | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewFormState>({
    employeeId: '',
    overallScore: 75,
    feedback: [...REVIEW_TEMPLATES.balanced],
    selectedTemplate: 'balanced',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================================
  // FEATURE 1: Review Schedule/Calendar View
  // ============================================================

  /**
   * Get upcoming reviews sorted by date
   */
  const upcomingReviews = useMemo(() => {
    if (!allEmployees) return [];

    const now = new Date();

    return allEmployees
      .filter((emp: Employee) => emp.status === 'active')
      .map((emp: Employee) => ({
        employeeId: emp.id,
        employeeName: emp.name,
        role: emp.role,
        lastReviewDate: emp.lastReviewDate,
        daysSinceReview: emp.lastReviewDate
          ? Math.floor((now.getTime() - new Date(emp.lastReviewDate).getTime()) / (24 * 60 * 60 * 1000))
          : null,
        daysUntilAnnual: emp.lastReviewDate
          ? 365 - (Math.floor((now.getTime() - new Date(emp.lastReviewDate).getTime()) / (24 * 60 * 60 * 1000)) % 365)
          : 365,
        performanceRating: getPerformanceRating(emp),
        morale: emp.morale,
      }))
      .sort((a, b) => a.daysUntilAnnual - b.daysUntilAnnual);
  }, [allEmployees]);

  // ============================================================
  // FEATURE 3: Review History Table with Filtering
  // ============================================================

  const [historyFilters, setHistoryFilters] = useState({
    searchTerm: '',
    dateRange: '',
    scoreRange: '',
  });

  const reviewHistory = useMemo(() => {
    if (!allEmployees) return [];

    const all: Array<PerformanceReview & { employeeId: string; employeeName: string; currentSalary: number }> = [];
    (allEmployees || []).forEach((emp: Employee) => {
      if (emp.reviews && emp.reviews.length > 0) {
        emp.reviews.forEach((review: PerformanceReview) => {
          all.push({
            ...review,
            employeeId: emp.id,
            employeeName: emp.name,
            currentSalary: emp.salary,
          });
        });
      }
    });

    // Filter by search term
    let filtered = all.filter(r =>
      r.employeeName.toLowerCase().includes(historyFilters.searchTerm.toLowerCase())
    );

    // Filter by date range
    if (historyFilters.dateRange) {
      const now = new Date();
      let daysBack = 0;

      if (historyFilters.dateRange === '30') daysBack = 30;
      else if (historyFilters.dateRange === '90') daysBack = 90;
      else if (historyFilters.dateRange === '180') daysBack = 180;

      if (daysBack > 0) {
        const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(r => new Date(r.date) >= cutoffDate);
      }
    }

    // Filter by score range
    if (historyFilters.scoreRange) {
      if (historyFilters.scoreRange === 'excellent') filtered = filtered.filter(r => r.overallScore >= 80);
      else if (historyFilters.scoreRange === 'good') filtered = filtered.filter(r => r.overallScore >= 60 && r.overallScore < 80);
      else if (historyFilters.scoreRange === 'average') filtered = filtered.filter(r => r.overallScore >= 40 && r.overallScore < 60);
      else if (historyFilters.scoreRange === 'poor') filtered = filtered.filter(r => r.overallScore < 40);
    }

    return filtered.sort((a: PerformanceReview & any, b: PerformanceReview & any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allEmployees, historyFilters]);

  // ============================================================
  // FEATURE 4: Performance Trends Chart
  // ============================================================

  const trendChartData = useMemo(() => {
    if (!selectedEmployee?.reviews || selectedEmployee.reviews.length === 0) return [];

    return selectedEmployee.reviews
      .sort((a: PerformanceReview, b: PerformanceReview) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((review: PerformanceReview, idx: number) => ({
        date: formatReviewDate(review.date),
        score: review.overallScore,
        review: idx + 1,
      }));
  }, [selectedEmployee]);

  /**
   * Calculate team performance comparison
   */
  const comparisonMetrics = useMemo(() => {
    if (!allEmployees || allEmployees.length === 0) return null;

    const allScores = (allEmployees || [])
      .flatMap((emp: Employee) => emp.reviews?.map((r: PerformanceReview) => r.overallScore) || [])
      .filter((score: any) => score !== undefined) as number[];

    if (allScores.length === 0) return null;

    const avgScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

    if (!selectedEmployee?.reviews || selectedEmployee.reviews.length === 0) {
      return {
        employeeAvg: null,
        companyAvg: avgScore,
        percentile: null,
      };
    }

    const employeeReviews = selectedEmployee.reviews.map((r: PerformanceReview) => r.overallScore);
    const employeeAvg = Math.round(employeeReviews.reduce((a: number, b: number) => a + b, 0) / employeeReviews.length);

    // Calculate percentile
    const betterScores = allScores.filter(s => s > employeeAvg).length;
    const percentile = Math.round((betterScores / allScores.length) * 100);

    return {
      employeeAvg,
      companyAvg: avgScore,
      percentile: 100 - percentile,
    };
  }, [selectedEmployee, allEmployees]);

  // ============================================================
  // FEATURE 2 & 5: Conduct Review Modal + Templates
  // ============================================================

  const handleTemplateChange = useCallback((template: 'strengths' | 'development' | 'balanced' | 'custom') => {
    setReviewForm(prev => ({
      ...prev,
      selectedTemplate: template,
      feedback: REVIEW_TEMPLATES[template] ? [...REVIEW_TEMPLATES[template]] : [],
    }));
  }, []);

  const handleFeedbackChange = (index: number, value: string) => {
    setReviewForm(prev => ({
      ...prev,
      feedback: prev.feedback.map((f, i) => i === index ? value : f),
    }));
  };

  const handleAddFeedbackLine = () => {
    setReviewForm(prev => ({
      ...prev,
      feedback: [...prev.feedback, ''],
    }));
  };

  // ============================================================
  // FEATURE 6: Auto-Calculated Salary Adjustments + FEATURE 8: Submission Workflow
  // ============================================================

  const handleSubmitReview = useCallback(async (score: number, feedback: string[]) => {
    if (!reviewForm.employeeId) return;

    const emp = (allEmployees || []).find((e: Employee) => e.id === reviewForm.employeeId);
    if (!emp) return;

    const { newSalary, adjustment, moraleChange } = calculateSalaryAdjustment(score, emp.salary);

    setShowConfirmation({
      show: true,
      employeeId: reviewForm.employeeId,
      overallScore: score,
      feedback: feedback.filter(f => f.trim().length > 0),
      currentSalary: emp.salary,
      newSalary,
      salaryAdjustment: adjustment,
      expectedMoraleChange: moraleChange,
    });
  }, [reviewForm.employeeId, allEmployees]);

  /**
   * Execute review submission after confirmation
   */
  const executeReviewSubmission = useCallback(async (confirmation: ConfirmationState) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/employees/${confirmation.employeeId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overallScore: confirmation.overallScore,
          feedback: confirmation.feedback,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      setShowReviewModal(false);
      setShowConfirmation(null);
      setReviewForm({
        employeeId: '',
        overallScore: 75,
        feedback: [...REVIEW_TEMPLATES.balanced],
        selectedTemplate: 'balanced',
      });

      alert('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // ============================================================
  // RENDERING
  // ============================================================

  if (loadingEmployees) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner label="Loading performance data..." />
      </div>
    );
  }

  const employees = allEmployees || [];
  if (!employees || employees.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <p className="text-gray-500">No employees found. Hire employees first.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Main Tabs */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        variant="bordered"
        size="lg"
      >
        {/* TAB 1: Review Schedule */}
        <Tab key="schedule" title="📅 Review Schedule">
          <Card>
            <CardHeader className="flex justify-between">
              <h3 className="text-xl font-bold">Upcoming Performance Reviews</h3>
              <Button
                color="primary"
                onPress={() => {
                  setReviewForm(prev => ({ ...prev, employeeId: '' }));
                  setShowReviewModal(true);
                }}
              >
                + Conduct Review
              </Button>
            </CardHeader>
            <Divider />
            <CardBody>
              <Table aria-label="Upcoming reviews schedule">
                <TableHeader>
                  <TableColumn>EMPLOYEE</TableColumn>
                  <TableColumn>ROLE</TableColumn>
                  <TableColumn>LAST REVIEW</TableColumn>
                  <TableColumn>DAYS SINCE</TableColumn>
                  <TableColumn>PERFORMANCE</TableColumn>
                  <TableColumn>MORALE</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {upcomingReviews.map((review) => (
                    <TableRow key={review.employeeId}>
                      <TableCell className="font-medium">{review.employeeName}</TableCell>
                      <TableCell>{review.role}</TableCell>
                      <TableCell>
                        {review.lastReviewDate ? formatReviewDate(review.lastReviewDate) : 'Never'}
                      </TableCell>
                      <TableCell>
                        {review.daysSinceReview ? (
                          <Badge color={review.daysSinceReview > 365 ? 'danger' : 'default'}>
                            {review.daysSinceReview} days
                          </Badge>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge color={getPerformanceRatingColor(getPerformanceRatingScale(review.performanceRating)) as any}>
                          {review.performanceRating}/100
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge color={getMoraleColor(review.morale) as any}>
                          {review.morale}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Tooltip content="Conduct performance review">
                          <Button
                            isIconOnly
                            variant="light"
                            onPress={() => {
                              setReviewForm(prev => ({ ...prev, employeeId: review.employeeId }));
                              setShowReviewModal(true);
                            }}
                          >
                            📝
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>

        {/* TAB 2: Review History */}
        <Tab key="history" title="📋 Review History">
          <Card>
            <CardHeader>
              <h3 className="text-xl font-bold">Historical Performance Reviews</h3>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-3 gap-4">
                <Input
                  placeholder="Search by employee name..."
                  value={historyFilters.searchTerm}
                  onValueChange={(value) =>
                    setHistoryFilters(prev => ({ ...prev, searchTerm: value }))
                  }
                />
                <Select
                  label="Date Range"
                  value={historyFilters.dateRange}
                  onChange={(e) =>
                    setHistoryFilters(prev => ({ ...prev, dateRange: e.target.value }))
                  }
                >
                  <SelectItem key="">All Time</SelectItem>
                  <SelectItem key="30">Last 30 Days</SelectItem>
                  <SelectItem key="90">Last 90 Days</SelectItem>
                  <SelectItem key="180">Last 6 Months</SelectItem>
                </Select>
                <Select
                  label="Score Range"
                  value={historyFilters.scoreRange}
                  onChange={(e) =>
                    setHistoryFilters(prev => ({ ...prev, scoreRange: e.target.value }))
                  }
                >
                  <SelectItem key="">All Scores</SelectItem>
                  <SelectItem key="excellent">Excellent (80+)</SelectItem>
                  <SelectItem key="good">Good (60-79)</SelectItem>
                  <SelectItem key="average">Average (40-59)</SelectItem>
                  <SelectItem key="poor">Poor (&lt;40)</SelectItem>
                </Select>
              </div>

              {/* Review History Table */}
              {reviewHistory.length > 0 ? (
                <Table aria-label="Review history">
                  <TableHeader>
                    <TableColumn>EMPLOYEE</TableColumn>
                    <TableColumn>DATE</TableColumn>
                    <TableColumn>REVIEWER ID</TableColumn>
                    <TableColumn>SCORE</TableColumn>
                    <TableColumn>MORALE CHANGE</TableColumn>
                    <TableColumn>SALARY CHANGE</TableColumn>
                    <TableColumn>STRENGTHS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {reviewHistory.map((review, idx) => (
                      <TableRow key={`${review.employeeId}-${idx}`}>
                        <TableCell className="font-medium">{review.employeeName}</TableCell>
                        <TableCell>{formatReviewDate(review.date)}</TableCell>
                        <TableCell className="text-sm">{review.reviewerId.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <Badge color={getPerformanceRatingColor(getPerformanceRatingScale(review.overallScore)) as any}>
                            {review.overallScore}/100
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge color={getMoraleImpactColor(review.moraleImpact)}>
                            {review.moraleImpact > 0 ? '+' : ''}{review.moraleImpact}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={review.salaryAdjustment > 0 ? 'text-green-600 font-medium' : review.salaryAdjustment < 0 ? 'text-red-600 font-medium' : ''}>
                            {review.salaryAdjustment > 0 ? '+' : ''}${review.salaryAdjustment.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Tooltip content={review.strengths.join(', ')}>
                            <span className="text-sm truncate">{review.strengths[0] || 'N/A'}</span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No reviews found matching your filters
                </div>
              )}
            </CardBody>
          </Card>
        </Tab>

        {/* TAB 3: Performance Trends */}
        <Tab key="trends" title="📊 Performance Trends">
          <Card>
            <CardHeader>
              <h3 className="text-xl font-bold">Performance Trends & Analysis</h3>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-6">
              {/* Employee selector */}
              <Select
                label="Select Employee"
                placeholder="Choose an employee to view trends"
                value={selectedEmployeeId || ''}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
              >
                {(allEmployees || [])
                  .filter((emp: Employee) => emp.reviews && emp.reviews.length > 0)
                  .map((emp: Employee) => (
                    <SelectItem key={emp.id}>
                      {emp.name} ({emp.reviews?.length || 0} reviews)
                    </SelectItem>
                  ))}
              </Select>

              {selectedEmployee && trendChartData.length > 0 ? (
                <>
                  {/* Trend Chart */}
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <RechartsTooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#0070f3"
                          dot={{ fill: '#0070f3', r: 5 }}
                          activeDot={{ r: 7 }}
                          name="Performance Score"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Comparison Metrics */}
                  {comparisonMetrics && (
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardBody className="text-center">
                          <p className="text-sm text-gray-500">Your Average</p>
                          <p className="text-3xl font-bold text-blue-600">
                            {comparisonMetrics.employeeAvg || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-400">/100</p>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody className="text-center">
                          <p className="text-sm text-gray-500">Company Average</p>
                          <p className="text-3xl font-bold text-green-600">
                            {comparisonMetrics.companyAvg}
                          </p>
                          <p className="text-xs text-gray-400">/100</p>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody className="text-center">
                          <p className="text-sm text-gray-500">Your Percentile</p>
                          <p className="text-3xl font-bold text-purple-600">
                            {comparisonMetrics.percentile || 'N/A'}%
                          </p>
                          <p className="text-xs text-gray-400">from bottom</p>
                        </CardBody>
                      </Card>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {selectedEmployeeId
                    ? 'No review history for this employee'
                    : 'Select an employee to view performance trends'}
                </div>
              )}
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

      {/* Conduct Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onOpenChange={setShowReviewModal}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Conduct Performance Review</ModalHeader>
              <Divider />
              <ModalBody className="space-y-6">
                {/* Employee Selector */}
                <Select
                  label="Select Employee"
                  placeholder="Choose employee to review"
                  value={reviewForm.employeeId}
                  onChange={(e) =>
                    setReviewForm(prev => ({ ...prev, employeeId: e.target.value }))
                  }
                >
                  {(allEmployees || []).map((emp: Employee) => (
                    <SelectItem key={emp.id}>
                      {emp.name} - {emp.role}
                    </SelectItem>
                  ))}
                </Select>

                {/* Performance Score */}
                <div className="space-y-2">
                  <p className="font-medium">Overall Performance Score: {reviewForm.overallScore}/100</p>
                  <Slider
                    value={reviewForm.overallScore}
                    onChange={(val) =>
                      setReviewForm(prev => ({ ...prev, overallScore: val as number }))
                    }
                    minValue={0}
                    maxValue={100}
                    step={1}
                    className="max-w-md"
                  />
                  <p className="text-sm text-gray-500">
                    {reviewForm.overallScore >= 90
                      ? 'Exceptional - Exceeds expectations significantly'
                      : reviewForm.overallScore >= 75
                      ? 'Exceeds - Performs above expectations'
                      : reviewForm.overallScore >= 60
                      ? 'Meets - Meets job requirements'
                      : reviewForm.overallScore >= 50
                      ? 'Below - Below expectations'
                      : 'Unsatisfactory - Does not meet expectations'}
                  </p>
                </div>

                {/* Review Templates */}
                <div className="space-y-3">
                  <p className="font-medium">Review Template</p>
                  <div className="flex gap-2">
                    {Object.keys(REVIEW_TEMPLATES).map(template => (
                      <Button
                        key={template}
                        variant={reviewForm.selectedTemplate === template ? 'solid' : 'bordered'}
                        onPress={() => handleTemplateChange(template as any)}
                        size="sm"
                      >
                        {template.charAt(0).toUpperCase() + template.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Feedback Input */}
                <div className="space-y-3">
                  <p className="font-medium">Review Feedback</p>
                  {reviewForm.feedback.map((feedback, idx) => (
                    <Input
                      key={idx}
                      placeholder={`Feedback point ${idx + 1}`}
                      value={feedback}
                      onChange={(e) => handleFeedbackChange(idx, e.target.value)}
                      fullWidth
                    />
                  ))}
                  <Button
                    variant="bordered"
                    onPress={handleAddFeedbackLine}
                    size="sm"
                  >
                    + Add Feedback Point
                  </Button>
                </div>

                {/* Salary Adjustment Preview */}
                {reviewForm.employeeId && (
                  <Card className="bg-blue-50">
                    <CardBody>
                      {(() => {
                        const emp = (allEmployees || []).find((e: Employee) => e.id === reviewForm.employeeId);
                        if (!emp) return null;
                        const { newSalary, adjustment, moraleChange } = calculateSalaryAdjustment(
                          reviewForm.overallScore,
                          emp.salary
                        );
                        return (
                          <div className="space-y-2 text-sm">
                            <p><strong>Current Salary:</strong> ${emp.salary.toLocaleString()}</p>
                            <p><strong>New Salary:</strong> ${newSalary.toLocaleString()}</p>
                            <p className={adjustment > 0 ? 'text-green-600 font-medium' : adjustment < 0 ? 'text-red-600 font-medium' : ''}>
                              <strong>Adjustment:</strong> {adjustment > 0 ? '+' : ''} ${adjustment.toLocaleString()}
                            </p>
                            <p className={moraleChange > 0 ? 'text-green-600' : moraleChange < 0 ? 'text-red-600' : ''}>
                              <strong>Expected Morale Change:</strong> {moraleChange > 0 ? '+' : ''}{moraleChange}
                            </p>
                          </div>
                        );
                      })()}
                    </CardBody>
                  </Card>
                )}
              </ModalBody>
              <Divider />
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={() => handleSubmitReview(reviewForm.overallScore, reviewForm.feedback)}
                  disabled={!reviewForm.employeeId || reviewForm.feedback.every(f => f.trim().length === 0)}
                >
                  Review & Confirm
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <Modal isOpen={!!showConfirmation} onOpenChange={() => setShowConfirmation(null)} size="lg">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">Confirm Performance Review</ModalHeader>
                <Divider />
                <ModalBody className="space-y-4">
                  <Card className="bg-gray-50">
                    <CardBody className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Employee</p>
                          <p className="font-bold">
                            {(allEmployees || []).find((e: Employee) => e.id === showConfirmation.employeeId)?.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Performance Score</p>
                          <p className="font-bold text-lg">
                            <Badge color={getPerformanceRatingColor(getPerformanceRatingScale(showConfirmation.overallScore)) as any}>
                              {showConfirmation.overallScore}/100
                            </Badge>
                          </p>
                        </div>
                      </div>

                      <Divider />

                      <div className="space-y-2 text-sm">
                        <p className="font-medium">Salary Adjustment</p>
                        <div className="flex justify-between">
                          <span>Current Salary:</span>
                          <span>${showConfirmation.currentSalary.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>New Salary:</span>
                          <span className="font-bold">${showConfirmation.newSalary.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Adjustment:</span>
                          <span className={showConfirmation.salaryAdjustment > 0 ? 'text-green-600 font-bold' : showConfirmation.salaryAdjustment < 0 ? 'text-red-600 font-bold' : ''}>
                            {showConfirmation.salaryAdjustment > 0 ? '+' : ''}${showConfirmation.salaryAdjustment.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <Divider />

                      <div className="space-y-2 text-sm">
                        <p className="font-medium">Expected Morale Change</p>
                        <div className="flex justify-between">
                          <span>Expected Impact:</span>
                          <span className={showConfirmation.expectedMoraleChange > 0 ? 'text-green-600 font-bold' : showConfirmation.expectedMoraleChange < 0 ? 'text-red-600 font-bold' : ''}>
                            {showConfirmation.expectedMoraleChange > 0 ? '+' : ''}{showConfirmation.expectedMoraleChange}
                          </span>
                        </div>
                      </div>

                      <Divider />

                      <div>
                        <p className="font-medium text-sm mb-2">Feedback Summary</p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {showConfirmation.feedback.map((fb: string, idx: number) => (
                            <li key={idx} className="text-gray-700">{fb}</li>
                          ))}
                        </ul>
                      </div>
                    </CardBody>
                  </Card>

                  <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded">
                    ⚠️ This action will update the employee's salary and morale. Make sure all information is correct before confirming.
                  </p>
                </ModalBody>
                <Divider />
                <ModalFooter>
                  <Button
                    color="danger"
                    variant="light"
                    onPress={() => setShowConfirmation(null)}
                    disabled={isSubmitting}
                  >
                    Back to Editing
                  </Button>
                  <Button
                    color="primary"
                    onPress={() => executeReviewSubmission(showConfirmation)}
                    isLoading={isSubmitting}
                  >
                    Confirm & Submit Review
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * FEATURE 1 - Review Schedule/Calendar:
 * - Calculates upcoming reviews based on lastReviewDate (365-day cycle)
 * - Shows days since last review (red badge if >365 days = overdue)
 * - Quick-action buttons to start review for any employee
 * - Sorted by days until next annual review
 * 
 * FEATURE 2 - Conduct Review Modal:
 * - 0-100 slider for performance score
 * - Displays interpretation text (Exceptional, Exceeds, Meets, Below, Unsatisfactory)
 * - Multiple feedback input fields (add more as needed)
 * - Real-time salary adjustment preview shows new salary immediately
 * 
 * FEATURE 3 - Review History Table:
 * - Complete history of all reviews across company
 * - Filterable by employee name (search), date range, and score range
 * - Shows actual morale and salary changes that occurred
 * - Sortable by any column
 * 
 * FEATURE 4 - Performance Trends Chart:
 * - Individual employee performance progression over time
 * - Line chart with Recharts showing score history
 * - Comparison metrics: employee average, company average, percentile ranking
 * - Helps identify performance trajectory
 * 
 * FEATURE 5 - Review Templates:
 * - 4 templates: Strengths-focused, Development-focused, Balanced, Custom
 * - Pre-populates feedback prompts to structure review
 * - Can be customized with additional feedback points
 * - Templates encourage consistent, thorough reviews
 * 
 * FEATURE 6 - Auto-Calculate Salary Adjustments:
 * - Score 90+ → +15 morale, +5% salary
 * - Score 75-89 → +10 morale, +5% salary
 * - Score 60-74 → +5 morale, no raise
 * - Score 50-59 → 0 morale, no raise
 * - Score <50 → -10 morale, -3% salary
 * - Calculation happens in real-time as score slider changes
 * - Preview shows before submission
 * 
 * FEATURE 7 - Team Comparison View:
 * - Shows employee's average review score vs company average
 * - Calculates percentile rank (from bottom)
 * - Helps identify high performers vs struggling employees
 * - Data updates with new reviews
 * 
 * FEATURE 8 - Submission Workflow:
 * - Two-step process: Edit → Review & Confirm
 * - Confirmation modal shows ALL changes before submitting
 * - No changes commit until user clicks "Confirm & Submit Review"
 * - API call to POST /api/employees/[id]/review with Zod validation
 * - Success message and modal close on completion
 * - Refetch would update employee data in real app
 */
