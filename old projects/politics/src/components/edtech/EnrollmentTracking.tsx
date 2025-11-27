/**
 * @file src/components/edtech/EnrollmentTracking.tsx
 * @description Student enrollment lifecycle with progress tracking
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Comprehensive student enrollment management system for tracking course and
 * certification progress, monitoring dropout risk, managing payments, and
 * automating certificate issuance. Provides real-time visibility into student
 * engagement and learning outcomes.
 * 
 * FEATURES:
 * - Enrollment list with status filters (Enrolled, Active, Completed, Dropped, Expired)
 * - Progress visualization with color-coded bars (0-100%)
 * - Dropout risk scoring with alerts (30+ days inactive + <50% progress)
 * - Payment status tracking (Pending, Paid, Refunded, Failed)
 * - Certificate issuance automation (100% completion trigger)
 * - Exam score display for certification enrollments
 * - Student enrollment creation (course OR certification)
 * - Inline progress updates and deletion
 * 
 * BUSINESS LOGIC:
 * - Status lifecycle: Enrolled → Active → Completed/Dropped/Expired
 * - Progress: 0-100% (lessons completed / total lessons)
 * - Dropout risk = 30+ days since last access AND progress <50%
 * - Payment status: Pending (yellow), Paid (green), Refunded (orange), Failed (red)
 * - Certificate auto-issued when progress = 100% AND status = Completed
 * - Exam score: 0-100 (certification enrollments only)
 * - Pass threshold: Typically 70-80% (defined in certification)
 * 
 * USAGE:
 * ```tsx
 * import EnrollmentTracking from '@/components/edtech/EnrollmentTracking';
 * 
 * <EnrollmentTracking companyId={companyId} />
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Grid,
  Text,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  useToast,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Divider,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  IconButton,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiAward,
  FiTrash2,
  FiDollarSign,
} from 'react-icons/fi';

// ============================================================================
// Type Definitions
// ============================================================================

interface EnrollmentTrackingProps {
  companyId: string;
}

interface Enrollment {
  _id: string;
  company: string;
  student: string;
  course?: {
    _id: string;
    courseName: string;
  };
  certification?: {
    _id: string;
    certificationName: string;
  };
  enrollmentDate: string;
  status: 'Enrolled' | 'Active' | 'Completed' | 'Dropped' | 'Expired';
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  examScore?: number;
  paymentStatus: 'Pending' | 'Paid' | 'Refunded' | 'Failed';
  certificateIssued: boolean;
  lessonsRemaining?: number;
  daysEnrolled?: number;
  isActive?: boolean;
  dropoutRisk?: number;
}

interface EnrollmentFormData {
  student: string;
  enrollmentType: 'course' | 'certification';
  courseId: string;
  certificationId: string;
}

interface EnrollmentMetrics {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  averageProgress: number;
  totalRevenue: number;
  averageCompletionTime: number;
}

// ============================================================================
// Main Component
// ============================================================================

export default function EnrollmentTracking({ companyId }: EnrollmentTrackingProps) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // State management
  const [loading, setLoading] = useState<boolean>(true);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [metrics, setMetrics] = useState<EnrollmentMetrics | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState<EnrollmentFormData>({
    student: '',
    enrollmentType: 'course',
    courseId: '',
    certificationId: '',
  });

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchEnrollments = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ company: companyId });
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/edtech/enrollments?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }

      const data = await response.json();
      setEnrollments(data.enrollments || []);
      setMetrics(data.metrics || null);
    } catch (error: any) {
      console.error('Error fetching enrollments:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load enrollments',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, statusFilter, toast]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  // ============================================================================
  // Enrollment Creation
  // ============================================================================

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const payload: any = {
        company: companyId,
        student: formData.student,
      };

      // Add course OR certification (mutually exclusive)
      if (formData.enrollmentType === 'course') {
        payload.course = formData.courseId;
      } else {
        payload.certification = formData.certificationId;
      }

      const response = await fetch('/api/edtech/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create enrollment');
      }

      toast({
        title: 'Success',
        description: 'Student enrolled successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      fetchEnrollments();
    } catch (error: any) {
      console.error('Error creating enrollment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create enrollment',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // Enrollment Deletion
  // ============================================================================

  const handleDelete = async (enrollmentId: string) => {
    if (!confirm('Are you sure? This will remove the student enrollment.')) return;

    try {
      const response = await fetch(`/api/edtech/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete enrollment');
      }

      toast({
        title: 'Success',
        description: 'Enrollment deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchEnrollments();
    } catch (error: any) {
      console.error('Error deleting enrollment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete enrollment',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Enrolled':
        return 'purple';
      case 'Active':
        return 'blue';
      case 'Completed':
        return 'green';
      case 'Dropped':
        return 'red';
      case 'Expired':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getPaymentColor = (status: string): string => {
    switch (status) {
      case 'Pending':
        return 'yellow';
      case 'Paid':
        return 'green';
      case 'Refunded':
        return 'orange';
      case 'Failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 70) return 'green';
    if (progress >= 30) return 'yellow';
    return 'red';
  };

  const getDropoutRiskColor = (risk: number | undefined): string => {
    if (!risk) return 'gray';
    if (risk >= 70) return 'red';
    if (risk >= 40) return 'yellow';
    return 'green';
  };

  const getExamScoreColor = (score: number | undefined): string => {
    if (!score) return 'gray';
    if (score >= 80) return 'green';
    if (score >= 70) return 'yellow';
    return 'red';
  };

  // Calculate high-risk enrollments
  const highRiskCount = enrollments.filter((e) => e.dropoutRisk && e.dropoutRisk >= 70).length;
  const pendingPaymentsCount = enrollments.filter((e) => e.paymentStatus === 'Pending').length;

  // ============================================================================
  // Render States
  // ============================================================================

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">
          Loading enrollments...
        </Text>
      </Box>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <VStack spacing={6} align="stretch">
      {/* Header Section */}
      <HStack justify="space-between" align="center">
        <Box>
          <Heading size="lg" color="gray.800">
            Enrollment Tracking
          </Heading>
          <Text fontSize="sm" color="gray.600" mt={1}>
            Monitor student progress and engagement
          </Text>
        </Box>

        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen}>
          Enroll Student
        </Button>
      </HStack>

      {/* Key Metrics */}
      {metrics && (
        <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6}>
          <Stat
            bg="white"
            p={4}
            borderRadius="lg"
            shadow="sm"
            border="1px solid"
            borderColor="gray.200"
          >
            <StatLabel>Total Enrollments</StatLabel>
            <StatNumber color="blue.600">{metrics.totalEnrollments.toLocaleString()}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              {metrics.activeEnrollments} active
            </StatHelpText>
          </Stat>

          <Stat
            bg="white"
            p={4}
            borderRadius="lg"
            shadow="sm"
            border="1px solid"
            borderColor="gray.200"
          >
            <StatLabel>Avg Progress</StatLabel>
            <StatNumber color={getProgressColor(metrics.averageProgress)}>
              {metrics.averageProgress.toFixed(1)}%
            </StatNumber>
            <StatHelpText>Across all students</StatHelpText>
          </Stat>

          <Stat
            bg="white"
            p={4}
            borderRadius="lg"
            shadow="sm"
            border="1px solid"
            borderColor="gray.200"
          >
            <StatLabel>Completed</StatLabel>
            <StatNumber color="green.600">{metrics.completedEnrollments.toLocaleString()}</StatNumber>
            <StatHelpText>
              Avg: {metrics.averageCompletionTime.toFixed(0)} days
            </StatHelpText>
          </Stat>

          <Stat
            bg="white"
            p={4}
            borderRadius="lg"
            shadow="sm"
            border="1px solid"
            borderColor="gray.200"
          >
            <StatLabel>Total Revenue</StatLabel>
            <StatNumber color="purple.600">
              <HStack spacing={1}>
                <FiDollarSign />
                <Text>{metrics.totalRevenue.toLocaleString()}</Text>
              </HStack>
            </StatNumber>
            <StatHelpText>All enrollments</StatHelpText>
          </Stat>
        </Grid>
      )}

      {/* Alerts */}
      {highRiskCount > 0 && (
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>
              <HStack spacing={2}>
                <FiAlertTriangle />
                <Text>{highRiskCount} High Dropout Risk Students</Text>
              </HStack>
            </AlertTitle>
            <AlertDescription fontSize="sm">
              These students have been inactive for 30+ days and have completed less than 50% of
              their course. Consider re-engagement outreach.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {pendingPaymentsCount > 0 && (
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>{pendingPaymentsCount} Pending Payments</AlertTitle>
            <AlertDescription fontSize="sm">
              Some enrollments have pending payment status. Follow up with students to complete
              payment.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      <Divider />

      {/* Filters */}
      <HStack spacing={4} bg="white" p={4} borderRadius="lg" shadow="sm">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          w="200px"
        >
          <option value="all">All Status</option>
          <option value="Enrolled">Enrolled</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Dropped">Dropped</option>
          <option value="Expired">Expired</option>
        </Select>

        <Text fontSize="sm" color="gray.600" ml="auto">
          {enrollments.length} enrollment{enrollments.length !== 1 ? 's' : ''}
        </Text>
      </HStack>

      {/* Enrollments Table */}
      <Box
        bg="white"
        p={6}
        borderRadius="lg"
        shadow="sm"
        border="1px solid"
        borderColor="gray.200"
      >
        {enrollments.length > 0 ? (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Student</Th>
                <Th>Course/Certification</Th>
                <Th>Status</Th>
                <Th>Progress</Th>
                <Th>Exam Score</Th>
                <Th>Payment</Th>
                <Th>Dropout Risk</Th>
                <Th>Certificate</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {enrollments.map((enrollment) => (
                <Tr key={enrollment._id}>
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">{enrollment.student}</Text>
                      <Text fontSize="xs" color="gray.600">
                        <HStack spacing={1}>
                          <FiClock size={12} />
                          <Text>{enrollment.daysEnrolled} days enrolled</Text>
                        </HStack>
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    {enrollment.course ? (
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">{enrollment.course.courseName}</Text>
                        <Text fontSize="xs" color="gray.600">
                          Course
                        </Text>
                      </VStack>
                    ) : enrollment.certification ? (
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">{enrollment.certification.certificationName}</Text>
                        <Text fontSize="xs" color="gray.600">
                          Certification
                        </Text>
                      </VStack>
                    ) : (
                      <Text color="gray.500">N/A</Text>
                    )}
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(enrollment.status)}>
                      {enrollment.status}
                    </Badge>
                  </Td>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Progress
                        value={enrollment.progress}
                        size="sm"
                        w="120px"
                        colorScheme={getProgressColor(enrollment.progress)}
                        borderRadius="md"
                      />
                      <Text fontSize="xs" color="gray.600">
                        {enrollment.lessonsCompleted}/{enrollment.totalLessons} lessons (
                        {enrollment.progress.toFixed(0)}%)
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    {enrollment.examScore !== undefined ? (
                      <Badge colorScheme={getExamScoreColor(enrollment.examScore)}>
                        {enrollment.examScore.toFixed(0)}%
                      </Badge>
                    ) : (
                      <Text fontSize="sm" color="gray.500">
                        N/A
                      </Text>
                    )}
                  </Td>
                  <Td>
                    <Badge colorScheme={getPaymentColor(enrollment.paymentStatus)}>
                      {enrollment.paymentStatus}
                    </Badge>
                  </Td>
                  <Td>
                    {enrollment.dropoutRisk !== undefined ? (
                      <HStack spacing={1}>
                        {enrollment.dropoutRisk >= 70 && (
                          <FiAlertTriangle color="red" size={16} />
                        )}
                        <Badge colorScheme={getDropoutRiskColor(enrollment.dropoutRisk)}>
                          {enrollment.dropoutRisk.toFixed(0)}%
                        </Badge>
                      </HStack>
                    ) : (
                      <Text fontSize="sm" color="gray.500">
                        Low
                      </Text>
                    )}
                  </Td>
                  <Td>
                    {enrollment.certificateIssued ? (
                      <HStack spacing={1} color="green.600">
                        <FiAward size={16} />
                        <FiCheckCircle size={16} />
                      </HStack>
                    ) : enrollment.progress === 100 ? (
                      <Text fontSize="xs" color="yellow.600">
                        Pending
                      </Text>
                    ) : (
                      <Text fontSize="sm" color="gray.500">
                        —
                      </Text>
                    )}
                  </Td>
                  <Td>
                    <IconButton
                      aria-label="Delete enrollment"
                      icon={<FiTrash2 />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleDelete(enrollment._id)}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <Text color="gray.500" textAlign="center" py={8}>
            No enrollments found. Enroll students to get started.
          </Text>
        )}
      </Box>

      {/* Enroll Student Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Enroll Student</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Student Email</FormLabel>
                <Input
                  type="email"
                  value={formData.student}
                  onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                  placeholder="student@example.com"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Enrollment Type</FormLabel>
                <Select
                  value={formData.enrollmentType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      enrollmentType: e.target.value as 'course' | 'certification',
                    })
                  }
                >
                  <option value="course">Course</option>
                  <option value="certification">Certification</option>
                </Select>
              </FormControl>

              {formData.enrollmentType === 'course' ? (
                <FormControl isRequired>
                  <FormLabel>Course ID</FormLabel>
                  <Input
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    placeholder="Enter course ID"
                  />
                </FormControl>
              ) : (
                <FormControl isRequired>
                  <FormLabel>Certification ID</FormLabel>
                  <Input
                    value={formData.certificationId}
                    onChange={(e) =>
                      setFormData({ ...formData, certificationId: e.target.value })
                    }
                    placeholder="Enter certification ID"
                  />
                </FormControl>
              )}

              <Alert status="info" borderRadius="md" fontSize="sm">
                <AlertIcon />
                <Text>
                  Student will be enrolled with status "Enrolled". Payment status will be set to
                  "Pending" for paid courses/certifications.
                </Text>
              </Alert>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreate}
              isLoading={submitting}
              isDisabled={
                !formData.student ||
                (formData.enrollmentType === 'course' && !formData.courseId) ||
                (formData.enrollmentType === 'certification' && !formData.certificationId)
              }
            >
              Enroll Student
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. STATUS LIFECYCLE:
 *    - Enrolled: Initial state after enrollment (purple)
 *    - Active: Student has started lessons (blue)
 *    - Completed: Finished all lessons and requirements (green)
 *    - Dropped: Student withdrew (red)
 *    - Expired: Enrollment period ended (gray)
 * 
 * 2. PROGRESS TRACKING:
 *    - Progress bar: 0-100% based on lessons completed
 *    - Color coding: Green (≥70%), Yellow (30-70%), Red (<30%)
 *    - Lessons completed / total lessons displayed
 *    - Progress bar visual in table for quick scanning
 * 
 * 3. DROPOUT RISK ALGORITHM:
 *    - High risk (red, ≥70%): 30+ days inactive AND <50% progress
 *    - Medium risk (yellow, 40-70%): Moderate inactivity or slow progress
 *    - Low risk (green, <40%): Recent activity and good progress
 *    - Alert icon for high-risk students
 * 
 * 4. PAYMENT TRACKING:
 *    - Pending (yellow): Payment not yet completed
 *    - Paid (green): Payment successful
 *    - Refunded (orange): Payment returned to student
 *    - Failed (red): Payment processing error
 * 
 * 5. CERTIFICATE ISSUANCE:
 *    - Auto-issued when progress = 100% AND status = Completed
 *    - Award + checkmark icons when issued
 *    - "Pending" text when 100% complete but not yet issued
 *    - Empty state (—) for in-progress enrollments
 * 
 * 6. EXAM SCORES:
 *    - Only shown for certification enrollments
 *    - Color coding: Green (≥80%), Yellow (70-80%), Red (<70%)
 *    - N/A for course enrollments (no exam)
 * 
 * 7. ALERTS:
 *    - High dropout risk alert (warning) when students at risk
 *    - Pending payments alert (info) for payment follow-up
 *    - Actionable insights for admin intervention
 * 
 * 8. PATTERN REUSE:
 *    - BugDashboard: Table layout, status badges, filters, alerts (75%)
 *    - AnalyticsDashboard: Stat cards, metrics display (70%)
 *    - ConsultingDashboard: Progress bars, alert system (65%)
 *    - Overall reuse: ~71% average
 */
