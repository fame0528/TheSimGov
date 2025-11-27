/**
 * @file src/components/energy/EnvironmentalCompliance.tsx
 * @description Environmental compliance tracking and sustainability dashboard for Energy companies
 * @created 2025-11-18
 * 
 * OVERVIEW:
 * Comprehensive environmental compliance management dashboard enabling Energy companies to track emissions,
 * monitor regulatory compliance, manage sustainability initiatives, and generate environmental reports.
 * Displays real-time carbon footprint tracking, regulatory limit monitoring, renewable energy percentage,
 * compliance status by category, automated report generation, and sustainability investment tracking.
 * Integrates emissions calculations with regulatory frameworks for proactive compliance management.
 * 
 * COMPONENT ARCHITECTURE:
 * - Emissions tracking: Total carbon footprint, emissions by source (generation/extraction/refining)
 * - Compliance dashboard: Regulatory limits by jurisdiction, compliance percentage, violation alerts
 * - Sustainability metrics: Renewable energy %, carbon intensity, energy efficiency improvements
 * - Reporting system: Automated compliance report generation, regulatory submissions, audit history
 * - Investment tracking: Environmental investments (carbon capture, renewables, efficiency upgrades)
 * - Alerts system: Real-time compliance warnings, approaching limits, deadline reminders
 * - Analytics display: Emissions trends, compliance history, sustainability improvements
 * 
 * STATE MANAGEMENT:
 * - emissions: EmissionsData with CO₂ totals, trends, sources breakdown
 * - complianceStatus: ComplianceStatus with regulatory limits, violations, warnings
 * - reports: ComplianceReport[] with submission history and status
 * - sustainabilityMetrics: Renewable %, carbon intensity, efficiency improvements
 * - loading: Loading state during initial fetch
 * - isGenerating: Report generation in progress
 * 
 * API INTEGRATION:
 * - GET /api/energy/compliance/emissions - Fetch emissions data
 *   Response: { totalEmissions, emissionsBySource, trends, carbonIntensity }
 * - GET /api/energy/compliance/status - Get compliance status
 *   Response: { limits: RegulatoryLimit[], violations, warnings, compliancePercent }
 * - GET /api/energy/compliance/reports - Fetch compliance reports
 *   Response: { reports: ComplianceReport[], nextDeadlines, auditHistory }
 * - POST /api/energy/compliance/submit - Submit regulatory report
 *   Request: { reportType: string, period: string }
 *   Response: { reportId, submissionDate, confirmationNumber }
 * 
 * PROPS:
 * - companyId: Company ID for compliance data lookup
 * 
 * USAGE:
 * ```tsx
 * <EnvironmentalCompliance companyId="64f7a1b2c3d4e5f6g7h8i9j0" />
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Emissions calculations:
 *   - Power generation: kWh × emission factor (coal: 0.95 kg CO₂/kWh, gas: 0.45, renewables: 0)
 *   - Oil/gas extraction: Production × emission intensity (0.1-0.5 kg CO₂/barrel)
 *   - Refining: Throughput × process emissions (15-25 kg CO₂/barrel)
 *   - Fugitive emissions: Methane leaks × GWP factor (methane = 25× CO₂ over 100 years)
 * - Regulatory frameworks:
 *   - Federal: EPA Clean Air Act, GHG Reporting Rule (>25,000 tons CO₂e/year)
 *   - State: California AB32, RGGI states, individual state air quality standards
 *   - Local: Municipal air quality ordinances, zoning restrictions
 *   - International: Kyoto Protocol, Paris Agreement commitments
 * - Compliance categories:
 *   - Air quality: SO₂, NOₓ, PM2.5, PM10, ozone precursors
 *   - GHG emissions: CO₂, CH₄, N₂O, fluorinated gases
 *   - Water quality: Thermal pollution, chemical discharge, cooling water intake
 *   - Waste management: Hazardous waste, ash disposal, remediation
 *   - Land use: Habitat protection, cultural resources, visual impact
 * - Reporting requirements:
 *   - Annual GHG reports (EPA, March 31 deadline)
 *   - Quarterly emissions monitoring (state agencies)
 *   - Continuous emissions monitoring systems (CEMS) for large sources
 *   - Title V operating permits (5-year renewal cycle)
 * - Penalties/bonuses:
 *   - Violations: $25,000-$50,000 per day per violation (Clean Air Act)
 *   - Early compliance: Tax credits, expedited permitting, public recognition
 *   - Renewable energy credits: $10-$50 per MWh depending on state RPS
 * - Carbon intensity targets:
 *   - Coal plants: 800-1,000 g CO₂/kWh (baseline)
 *   - Gas plants: 400-500 g CO₂/kWh
 *   - Renewables: <50 g CO₂/kWh (lifecycle)
 *   - Grid average: 400-600 g CO₂/kWh (US), improving to 200-300 by 2035
 * - Renewable energy percentage:
 *   - State RPS requirements: 25-100% by 2030-2050
 *   - Federal production tax credits: Wind/solar incentives
 *   - Corporate goals: 50-100% renewable by 2030 (Fortune 500 trend)
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Badge,
  Button,
  FormControl,
  FormLabel,
  Select,
  VStack,
  HStack,
  useToast,
  Skeleton,
  Divider,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@chakra-ui/react';

/**
 * Compliance status enum
 */
type ComplianceStatusType = 'Compliant' | 'Warning' | 'NonCompliant';

/**
 * Report status enum
 */
type ReportStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

/**
 * EmissionsData interface
 */
interface EmissionsData {
  totalEmissions: number;
  emissionsBySource: {
    powerGeneration: number;
    oilGasExtraction: number;
    refining: number;
    fugitive: number;
  };
  trends: {
    month: string;
    emissions: number;
  }[];
  carbonIntensity: number;
  renewablePercent: number;
}

/**
 * RegulatoryLimit interface
 */
interface RegulatoryLimit {
  _id: string;
  category: string;
  jurisdiction: 'Federal' | 'State' | 'Local';
  pollutant: string;
  limit: number;
  currentLevel: number;
  unit: string;
  complianceStatus: ComplianceStatusType;
  nextReview: Date;
}

/**
 * ComplianceReport interface
 */
interface ComplianceReport {
  _id: string;
  company: string;
  reportType: string;
  period: string;
  status: ReportStatus;
  submissionDate?: Date;
  confirmationNumber?: string;
  nextDeadline?: Date;
}

/**
 * ComplianceStatus interface
 */
interface ComplianceStatus {
  limits: RegulatoryLimit[];
  violations: number;
  warnings: number;
  compliancePercent: number;
}

/**
 * SustainabilityMetrics interface
 */
interface SustainabilityMetrics {
  renewablePercent: number;
  carbonIntensity: number;
  efficiencyImprovement: number;
  environmentalInvestment: number;
}

/**
 * EnvironmentalCompliance component props
 */
interface EnvironmentalComplianceProps {
  companyId: string;
}

/**
 * EnvironmentalCompliance component
 * 
 * @description
 * Environmental compliance tracking dashboard for emissions monitoring, regulatory compliance,
 * sustainability metrics, and automated reporting with real-time alerts
 * 
 * @param {EnvironmentalComplianceProps} props - Component props
 * @returns {JSX.Element} EnvironmentalCompliance component
 */
export default function EnvironmentalCompliance({
  companyId,
}: EnvironmentalComplianceProps): JSX.Element {
  const toast = useToast();
  const { isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose } = useDisclosure();

  // State management
  const [emissions, setEmissions] = useState<EmissionsData | null>(null);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [sustainabilityMetrics, setSustainabilityMetrics] = useState<SustainabilityMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [reportType, setReportType] = useState<string>('GHG_Annual');
  const [reportPeriod, setReportPeriod] = useState<string>('2025');

  /**
   * Fetch all compliance data
   */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [emissionsRes, statusRes, reportsRes] = await Promise.all([
        fetch(`/api/energy/compliance/emissions?company=${companyId}`),
        fetch(`/api/energy/compliance/status?company=${companyId}`),
        fetch(`/api/energy/compliance/reports?company=${companyId}`),
      ]);

      const [emissionsData, statusData, reportsData] = await Promise.all([
        emissionsRes.json(),
        statusRes.json(),
        reportsRes.json(),
      ]);

      setEmissions(emissionsData);
      setComplianceStatus(statusData);
      setReports(reportsData.reports || []);

      // Calculate sustainability metrics
      if (emissionsData && statusData) {
        setSustainabilityMetrics({
          renewablePercent: emissionsData.renewablePercent || 0,
          carbonIntensity: emissionsData.carbonIntensity || 0,
          efficiencyImprovement: 0, // Would come from historical comparison
          environmentalInvestment: 0, // Would come from finance data
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error loading data',
        description: error.message || 'Failed to fetch compliance data',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch data on mount
   */
  useEffect(() => {
    fetchData();
  }, [companyId]);

  /**
   * Handle report submission
   */
  const handleSubmitReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/energy/compliance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: companyId,
          reportType,
          period: reportPeriod,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Report submitted',
          description: `Confirmation: ${data.confirmationNumber}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        fetchData();
        onReportClose();
      } else {
        toast({
          title: 'Submission failed',
          description: data.error || 'Operation failed',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Network error',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Get compliance badge color
   */
  const getComplianceColor = (status: ComplianceStatusType): string => {
    switch (status) {
      case 'Compliant': return 'green';
      case 'Warning': return 'yellow';
      case 'NonCompliant': return 'red';
      default: return 'gray';
    }
  };

  /**
   * Get report status color
   */
  const getReportStatusColor = (status: ReportStatus): string => {
    switch (status) {
      case 'Approved': return 'green';
      case 'Submitted': return 'blue';
      case 'Draft': return 'gray';
      case 'Rejected': return 'red';
      default: return 'gray';
    }
  };

  /**
   * Render loading skeletons
   */
  const renderSkeletons = () => (
    <VStack spacing={6} align="stretch">
      <Grid templateColumns="repeat(4, 1fr)" gap={4}>
        <Skeleton height="100px" />
        <Skeleton height="100px" />
        <Skeleton height="100px" />
        <Skeleton height="100px" />
      </Grid>
      <Skeleton height="400px" />
    </VStack>
  );

  if (loading) {
    return renderSkeletons();
  }

  return (
    <Box>
      {/* Compliance Alerts */}
      {complianceStatus && complianceStatus.violations > 0 && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Non-Compliance Alert</AlertTitle>
            <AlertDescription>
              {complianceStatus.violations} active violation{complianceStatus.violations > 1 ? 's' : ''} detected. Immediate action required.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {complianceStatus && complianceStatus.warnings > 0 && complianceStatus.violations === 0 && (
        <Alert status="warning" mb={4}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Compliance Warning</AlertTitle>
            <AlertDescription>
              {complianceStatus.warnings} limit{complianceStatus.warnings > 1 ? 's' : ''} approaching threshold. Review required.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Overview Stats */}
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Emissions</StatLabel>
              <StatNumber fontSize="lg">
                {emissions?.totalEmissions.toLocaleString() || 'N/A'} tons
              </StatNumber>
              <StatHelpText>CO₂ equivalent per year</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Compliance Rate</StatLabel>
              <StatNumber fontSize="lg" color={
                (complianceStatus?.compliancePercent || 0) >= 95 ? 'green.500' : 'yellow.500'
              }>
                {complianceStatus?.compliancePercent.toFixed(1) || 'N/A'}%
              </StatNumber>
              <StatHelpText>
                {complianceStatus?.violations || 0} violation{(complianceStatus?.violations || 0) !== 1 ? 's' : ''}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Renewable Energy</StatLabel>
              <StatNumber fontSize="lg" color="green.500">
                {sustainabilityMetrics?.renewablePercent.toFixed(1) || 'N/A'}%
              </StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                Of total generation
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Carbon Intensity</StatLabel>
              <StatNumber fontSize="lg">
                {sustainabilityMetrics?.carbonIntensity.toFixed(0) || 'N/A'}
              </StatNumber>
              <StatHelpText>g CO₂/kWh</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Tabbed Interface */}
      <Tabs variant="enclosed" colorScheme="green">
        <TabList>
          <Tab>Emissions Tracking</Tab>
          <Tab>Compliance Status</Tab>
          <Tab>Reports</Tab>
        </TabList>

        <TabPanels>
          {/* Emissions Tracking Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              {/* Emissions by Source */}
              <Card>
                <CardHeader>
                  <Heading size="sm">Emissions by Source</Heading>
                </CardHeader>
                <CardBody>
                  {emissions ? (
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <Box p={4} borderWidth={1} borderRadius="md">
                        <VStack align="stretch" spacing={2}>
                          <HStack justify="space-between">
                            <Text fontWeight="medium">Power Generation</Text>
                            <Text color="orange.500">
                              {emissions.emissionsBySource.powerGeneration.toLocaleString()} tons
                            </Text>
                          </HStack>
                          <Progress
                            value={(emissions.emissionsBySource.powerGeneration / emissions.totalEmissions) * 100}
                            colorScheme="orange"
                            size="sm"
                          />
                          <Text fontSize="xs" color="gray.600">
                            {((emissions.emissionsBySource.powerGeneration / emissions.totalEmissions) * 100).toFixed(1)}% of total
                          </Text>
                        </VStack>
                      </Box>

                      <Box p={4} borderWidth={1} borderRadius="md">
                        <VStack align="stretch" spacing={2}>
                          <HStack justify="space-between">
                            <Text fontWeight="medium">Oil & Gas Extraction</Text>
                            <Text color="blue.500">
                              {emissions.emissionsBySource.oilGasExtraction.toLocaleString()} tons
                            </Text>
                          </HStack>
                          <Progress
                            value={(emissions.emissionsBySource.oilGasExtraction / emissions.totalEmissions) * 100}
                            colorScheme="blue"
                            size="sm"
                          />
                          <Text fontSize="xs" color="gray.600">
                            {((emissions.emissionsBySource.oilGasExtraction / emissions.totalEmissions) * 100).toFixed(1)}% of total
                          </Text>
                        </VStack>
                      </Box>

                      <Box p={4} borderWidth={1} borderRadius="md">
                        <VStack align="stretch" spacing={2}>
                          <HStack justify="space-between">
                            <Text fontWeight="medium">Refining</Text>
                            <Text color="purple.500">
                              {emissions.emissionsBySource.refining.toLocaleString()} tons
                            </Text>
                          </HStack>
                          <Progress
                            value={(emissions.emissionsBySource.refining / emissions.totalEmissions) * 100}
                            colorScheme="purple"
                            size="sm"
                          />
                          <Text fontSize="xs" color="gray.600">
                            {((emissions.emissionsBySource.refining / emissions.totalEmissions) * 100).toFixed(1)}% of total
                          </Text>
                        </VStack>
                      </Box>

                      <Box p={4} borderWidth={1} borderRadius="md">
                        <VStack align="stretch" spacing={2}>
                          <HStack justify="space-between">
                            <Text fontWeight="medium">Fugitive Emissions</Text>
                            <Text color="red.500">
                              {emissions.emissionsBySource.fugitive.toLocaleString()} tons
                            </Text>
                          </HStack>
                          <Progress
                            value={(emissions.emissionsBySource.fugitive / emissions.totalEmissions) * 100}
                            colorScheme="red"
                            size="sm"
                          />
                          <Text fontSize="xs" color="gray.600">
                            {((emissions.emissionsBySource.fugitive / emissions.totalEmissions) * 100).toFixed(1)}% of total
                          </Text>
                        </VStack>
                      </Box>
                    </Grid>
                  ) : (
                    <Text color="gray.500">No emissions data available.</Text>
                  )}
                </CardBody>
              </Card>

              {/* Emissions Trends */}
              {emissions && emissions.trends && emissions.trends.length > 0 && (
                <Card>
                  <CardHeader>
                    <Heading size="sm">Emissions Trends</Heading>
                  </CardHeader>
                  <CardBody>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Period</Th>
                          <Th isNumeric>Emissions (tons CO₂e)</Th>
                          <Th isNumeric>Change</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {emissions.trends.map((trend, index) => {
                          const prevEmissions = index > 0 ? emissions.trends[index - 1].emissions : trend.emissions;
                          const change = ((trend.emissions - prevEmissions) / prevEmissions) * 100;
                          return (
                            <Tr key={trend.month}>
                              <Td>{trend.month}</Td>
                              <Td isNumeric>{trend.emissions.toLocaleString()}</Td>
                              <Td isNumeric>
                                {index > 0 && (
                                  <HStack spacing={1} justify="flex-end">
                                    <StatArrow type={change > 0 ? 'increase' : 'decrease'} />
                                    <Text color={change > 0 ? 'red.500' : 'green.500'}>
                                      {Math.abs(change).toFixed(1)}%
                                    </Text>
                                  </HStack>
                                )}
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </TabPanel>

          {/* Compliance Status Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="sm">Regulatory Limits</Heading>
              </CardHeader>
              <CardBody>
                {complianceStatus && complianceStatus.limits.length > 0 ? (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Category</Th>
                        <Th>Jurisdiction</Th>
                        <Th>Pollutant</Th>
                        <Th isNumeric>Current Level</Th>
                        <Th isNumeric>Limit</Th>
                        <Th>Status</Th>
                        <Th>Next Review</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {complianceStatus.limits.map((limit) => (
                        <Tr key={limit._id}>
                          <Td fontWeight="medium">{limit.category}</Td>
                          <Td>
                            <Badge size="sm" colorScheme={
                              limit.jurisdiction === 'Federal' ? 'purple' :
                              limit.jurisdiction === 'State' ? 'blue' : 'green'
                            }>
                              {limit.jurisdiction}
                            </Badge>
                          </Td>
                          <Td>{limit.pollutant}</Td>
                          <Td isNumeric>{limit.currentLevel.toLocaleString()}</Td>
                          <Td isNumeric>
                            <HStack spacing={2} justify="flex-end">
                              <Progress
                                value={(limit.currentLevel / limit.limit) * 100}
                                size="sm"
                                colorScheme={
                                  (limit.currentLevel / limit.limit) > 1.0 ? 'red' :
                                  (limit.currentLevel / limit.limit) > 0.85 ? 'yellow' : 'green'
                                }
                                w="60px"
                              />
                              <Text fontSize="xs">{limit.limit.toLocaleString()} {limit.unit}</Text>
                            </HStack>
                          </Td>
                          <Td>
                            <Badge colorScheme={getComplianceColor(limit.complianceStatus)} size="sm">
                              {limit.complianceStatus}
                            </Badge>
                          </Td>
                          <Td fontSize="xs">
                            {new Date(limit.nextReview).toLocaleDateString()}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                ) : (
                  <Text color="gray.500">No regulatory limits tracked.</Text>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* Reports Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Heading size="sm">Compliance Reports</Heading>
                <Button colorScheme="green" size="sm" onClick={onReportOpen}>
                  Generate Report
                </Button>
              </HStack>

              <Card>
                <CardBody>
                  {reports.length > 0 ? (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Report Type</Th>
                          <Th>Period</Th>
                          <Th>Status</Th>
                          <Th>Submission Date</Th>
                          <Th>Confirmation</Th>
                          <Th>Next Deadline</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {reports.map((report) => (
                          <Tr key={report._id}>
                            <Td fontWeight="medium">{report.reportType}</Td>
                            <Td>{report.period}</Td>
                            <Td>
                              <Badge colorScheme={getReportStatusColor(report.status)} size="sm">
                                {report.status}
                              </Badge>
                            </Td>
                            <Td fontSize="xs">
                              {report.submissionDate
                                ? new Date(report.submissionDate).toLocaleDateString()
                                : 'Not submitted'}
                            </Td>
                            <Td fontSize="xs">{report.confirmationNumber || 'N/A'}</Td>
                            <Td fontSize="xs">
                              {report.nextDeadline
                                ? new Date(report.nextDeadline).toLocaleDateString()
                                : 'N/A'}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Text color="gray.500">No compliance reports found.</Text>
                  )}
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Generate Report Modal */}
      <Modal isOpen={isReportOpen} onClose={onReportClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Generate Compliance Report</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Report Type</FormLabel>
                <Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                  <option value="GHG_Annual">GHG Annual Report (EPA)</option>
                  <option value="GHG_Quarterly">GHG Quarterly Report (State)</option>
                  <option value="AirQuality_Monthly">Air Quality Monthly Report</option>
                  <option value="WaterQuality_Quarterly">Water Quality Quarterly Report</option>
                  <option value="TitleV_Annual">Title V Operating Permit Annual Report</option>
                  <option value="RPS_Annual">Renewable Portfolio Standard Annual Report</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Reporting Period</FormLabel>
                <Select value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)}>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2025-Q4">2025 Q4</option>
                  <option value="2025-Q3">2025 Q3</option>
                  <option value="2025-Nov">November 2025</option>
                  <option value="2025-Oct">October 2025</option>
                </Select>
              </FormControl>

              <Divider />

              <Text fontSize="sm" color="gray.600">
                This will generate and submit the compliance report to the appropriate regulatory agency.
                Review carefully before submission.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onReportClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleSubmitReport}
              isLoading={isGenerating}
              loadingText="Generating..."
            >
              Generate & Submit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
