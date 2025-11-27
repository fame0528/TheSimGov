/**
 * @file components/ai/AITeamComposition.tsx
 * @description AI team analytics dashboard with skill heatmap and diversity metrics
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Comprehensive team composition analytics for AI companies. Displays skill heatmap,
 * role distribution, PhD percentage, domain expertise coverage, skill gap analysis,
 * and recommended hires. Helps identify team strengths, weaknesses, and hiring needs.
 * 
 * KEY FEATURES:
 * - Interactive skill heatmap (12 skills × N employees)
 * - Role distribution pie chart visualization
 * - PhD percentage and research metrics
 * - Domain expertise coverage (NLP, CV, RL, etc.)
 * - Skill gap analysis with actionable recommendations
 * - Team average metrics (satisfaction, productivity, retention risk)
 * - Recommended hires based on gaps
 * - Export team composition report
 * 
 * USAGE:
 * ```tsx
 * import AITeamComposition from '@/components/ai/AITeamComposition';
 * 
 * <AITeamComposition
 *   companyId="64f1a2b3c4d5e6f7g8h9i0j1"
 *   employees={aiEmployees}
 * />
 * ```
 * 
 * PROPS:
 * - companyId: string (MongoDB ObjectId of AI company)
 * - employees: AIEmployee[] (array of AI employees)
 * 
 * SKILL HEATMAP:
 * - Color scale: Red (0-40), Yellow (41-70), Green (71-100)
 * - Hover shows exact skill value
 * - Highlights team strengths and weaknesses
 * - Sortable by employee or skill
 * 
 * DIVERSITY METRICS:
 * - Role distribution (MLEngineer, ResearchScientist, DataEngineer, MLOps, PM)
 * - PhD percentage (target: 15-25% for research-focused teams)
 * - Domain expertise coverage (all 6 domains represented?)
 * - Experience distribution (Junior/Mid/Senior/Expert)
 * 
 * SKILL GAP ANALYSIS:
 * - Identifies skills below team average
 * - Recommends training for existing employees
 * - Suggests hires to fill critical gaps
 * - Prioritizes based on business needs
 * 
 * IMPLEMENTATION NOTES:
 * - Chakra UI v2 with responsive grid layout
 * - Real-time calculations (no API calls needed for analysis)
 * - Color-coded visualizations for quick insights
 * - Exportable as JSON or CSV (future enhancement)
 * - Integrates with AITalentBrowser for recommended hires
 */

'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Grid,
  Heading,
  Text,
  Badge,
  HStack,
  Card,
  CardHeader,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  Tooltip,
  Progress,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';

// Type definitions
interface AIEmployee {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  hasPhD?: boolean;
  domainExpertise?: string;
  publications?: number;
  hIndex?: number;
  technical: number;
  sales: number;
  leadership: number;
  finance: number;
  marketing: number;
  operations: number;
  research: number;
  compliance: number;
  communication: number;
  creativity: number;
  analytical: number;
  customerService: number;
  satisfaction: number;
  productivity: number;
  retentionRisk: number;
  yearsOfExperience: number;
}

interface AITeamCompositionProps {
  companyId: string;
  employees: AIEmployee[];
}

interface SkillGap {
  skill: string;
  teamAverage: number;
  targetAverage: number;
  gap: number;
  recommendation: string;
}

export default function AITeamComposition({
  companyId: _companyId, // Future use: Track company for analytics
  employees,
}: AITeamCompositionProps) {
  const [sortBy, setSortBy] = useState<'name' | 'role'>('role');

  // Calculate team metrics
  const teamMetrics = useMemo(() => {
    if (employees.length === 0) {
      return {
        totalEmployees: 0,
        phdCount: 0,
        phdPercentage: 0,
        avgSatisfaction: 0,
        avgProductivity: 0,
        avgRetentionRisk: 0,
        totalPublications: 0,
        avgHIndex: 0,
        roleDistribution: {} as Record<string, number>,
        domainCoverage: {} as Record<string, number>,
        experienceDistribution: {
          junior: 0,
          mid: 0,
          senior: 0,
          expert: 0,
        },
      };
    }

    const phdCount = employees.filter((e) => e.hasPhD).length;
    const totalPublications = employees.reduce((sum, e) => sum + (e.publications || 0), 0);
    const totalHIndex = employees.reduce((sum, e) => sum + (e.hIndex || 0), 0);

    // Role distribution
    const roleDistribution: Record<string, number> = {};
    employees.forEach((e) => {
      roleDistribution[e.role] = (roleDistribution[e.role] || 0) + 1;
    });

    // Domain coverage
    const domainCoverage: Record<string, number> = {};
    employees.forEach((e) => {
      if (e.domainExpertise) {
        domainCoverage[e.domainExpertise] = (domainCoverage[e.domainExpertise] || 0) + 1;
      }
    });

    // Experience distribution
    const experienceDistribution = {
      junior: employees.filter((e) => e.yearsOfExperience < 3).length,
      mid: employees.filter((e) => e.yearsOfExperience >= 3 && e.yearsOfExperience < 7).length,
      senior: employees.filter((e) => e.yearsOfExperience >= 7 && e.yearsOfExperience < 15).length,
      expert: employees.filter((e) => e.yearsOfExperience >= 15).length,
    };

    return {
      totalEmployees: employees.length,
      phdCount,
      phdPercentage: (phdCount / employees.length) * 100,
      avgSatisfaction: Math.round(
        employees.reduce((sum, e) => sum + e.satisfaction, 0) / employees.length
      ),
      avgProductivity: Math.round(
        employees.reduce((sum, e) => sum + e.productivity, 0) / employees.length
      ),
      avgRetentionRisk: Math.round(
        employees.reduce((sum, e) => sum + e.retentionRisk, 0) / employees.length
      ),
      totalPublications,
      avgHIndex: phdCount > 0 ? Math.round(totalHIndex / phdCount) : 0,
      roleDistribution,
      domainCoverage,
      experienceDistribution,
    };
  }, [employees]);

  // Calculate skill averages
  const skillAverages = useMemo(() => {
    if (employees.length === 0) return {};

    const skills = [
      'technical',
      'analytical',
      'research',
      'creativity',
      'communication',
      'leadership',
      'operations',
      'compliance',
    ] as const;

    const averages: Record<string, number> = {};

    skills.forEach((skill) => {
      const sum = employees.reduce((acc, emp) => acc + emp[skill], 0);
      averages[skill] = Math.round(sum / employees.length);
    });

    return averages;
  }, [employees]);

  // Identify skill gaps
  const skillGaps = useMemo((): SkillGap[] => {
    const gaps: SkillGap[] = [];
    const targetAverages: Record<string, number> = {
      technical: 75,
      analytical: 75,
      research: 70,
      creativity: 65,
      communication: 60,
      leadership: 60,
      operations: 55,
      compliance: 55,
    };

    Object.entries(targetAverages).forEach(([skill, target]) => {
      const current = skillAverages[skill] || 0;
      const gap = target - current;

      if (gap > 0) {
        gaps.push({
          skill: skill.charAt(0).toUpperCase() + skill.slice(1),
          teamAverage: current,
          targetAverage: target,
          gap,
          recommendation: generateGapRecommendation(skill, gap),
        });
      }
    });

    return gaps.sort((a, b) => b.gap - a.gap); // Sort by gap size (largest first)
  }, [skillAverages]);

  // Sorted employees
  const sortedEmployees = useMemo(() => {
    const sorted = [...employees];
    if (sortBy === 'name') {
      sorted.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else {
      sorted.sort((a, b) => a.role.localeCompare(b.role));
    }
    return sorted;
  }, [employees, sortBy]);

  return (
    <Box p={6}>
      {/* Header */}
      <Heading size="lg" mb={6}>
        AI Team Composition Analytics
      </Heading>

      {/* Summary Stats */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(5, 1fr)' }} gap={4} mb={6}>
        <Stat>
          <StatLabel>Total Team</StatLabel>
          <StatNumber>{teamMetrics.totalEmployees}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>PhD Percentage</StatLabel>
          <StatNumber>{teamMetrics.phdPercentage.toFixed(1)}%</StatNumber>
          <StatHelpText>
            {teamMetrics.phdCount} of {teamMetrics.totalEmployees}
          </StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Avg Satisfaction</StatLabel>
          <StatNumber color={teamMetrics.avgSatisfaction >= 70 ? 'green.500' : 'orange.500'}>
            {teamMetrics.avgSatisfaction}
          </StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Avg Productivity</StatLabel>
          <StatNumber color={teamMetrics.avgProductivity >= 70 ? 'green.500' : 'orange.500'}>
            {teamMetrics.avgProductivity}
          </StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Retention Risk</StatLabel>
          <StatNumber color={teamMetrics.avgRetentionRisk < 40 ? 'green.500' : 'orange.500'}>
            {teamMetrics.avgRetentionRisk}
          </StatNumber>
        </Stat>
      </Grid>

      {/* Role Distribution */}
      <Card mb={6}>
        <CardHeader>
          <Heading size="md">Role Distribution</Heading>
        </CardHeader>
        <CardBody>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(5, 1fr)' }} gap={4}>
            {Object.entries(teamMetrics.roleDistribution).map(([role, count]) => (
              <Box key={role}>
                <Text fontWeight="semibold" fontSize="sm" mb={1}>
                  {role}
                </Text>
                <Progress
                  value={(count / teamMetrics.totalEmployees) * 100}
                  colorScheme="blue"
                  size="lg"
                  mb={1}
                />
                <Text fontSize="sm" color="gray.600">
                  {count} ({Math.round((count / teamMetrics.totalEmployees) * 100)}%)
                </Text>
              </Box>
            ))}
          </Grid>
        </CardBody>
      </Card>

      {/* Domain Expertise Coverage */}
      <Card mb={6}>
        <CardHeader>
          <Heading size="md">Domain Expertise Coverage</Heading>
        </CardHeader>
        <CardBody>
          <HStack spacing={3} flexWrap="wrap">
            {['NLP', 'ComputerVision', 'ReinforcementLearning', 'GenerativeAI', 'Speech', 'Robotics'].map((domain) => {
              const count = teamMetrics.domainCoverage[domain] || 0;
              return (
                <Tag
                  key={domain}
                  size="lg"
                  colorScheme={count > 0 ? 'green' : 'gray'}
                >
                  {domain}: {count}
                </Tag>
              );
            })}
          </HStack>
        </CardBody>
      </Card>

      {/* Skill Gap Analysis */}
      {skillGaps.length > 0 && (
        <Card mb={6}>
          <CardHeader>
            <Heading size="md">Skill Gap Analysis</Heading>
          </CardHeader>
          <CardBody>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Skill</Th>
                  <Th isNumeric>Team Avg</Th>
                  <Th isNumeric>Target</Th>
                  <Th isNumeric>Gap</Th>
                  <Th>Recommendation</Th>
                </Tr>
              </Thead>
              <Tbody>
                {skillGaps.map((gap) => (
                  <Tr key={gap.skill}>
                    <Td fontWeight="semibold">{gap.skill}</Td>
                    <Td isNumeric color={gap.teamAverage >= 70 ? 'green.600' : 'orange.600'}>
                      {gap.teamAverage}
                    </Td>
                    <Td isNumeric>{gap.targetAverage}</Td>
                    <Td isNumeric fontWeight="bold" color="red.600">
                      -{gap.gap}
                    </Td>
                    <Td fontSize="sm">{gap.recommendation}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Skill Heatmap */}
      <Card>
        <CardHeader>
          <HStack justify="space-between">
            <Heading size="md">Team Skill Heatmap</Heading>
            <HStack>
              <Text fontSize="sm" mr={2}>
                Sort by:
              </Text>
              <Button
                size="sm"
                variant={sortBy === 'name' ? 'solid' : 'outline'}
                onClick={() => setSortBy('name')}
              >
                Name
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'role' ? 'solid' : 'outline'}
                onClick={() => setSortBy('role')}
              >
                Role
              </Button>
            </HStack>
          </HStack>
        </CardHeader>
        <CardBody>
          {employees.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              <AlertDescription>
                No AI employees to analyze. Hire team members to see skill heatmap.
              </AlertDescription>
            </Alert>
          ) : (
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th position="sticky" left={0} bg="white" zIndex={1}>
                      Employee
                    </Th>
                    <Th>Role</Th>
                    <Th isNumeric>Tech</Th>
                    <Th isNumeric>Analytical</Th>
                    <Th isNumeric>Research</Th>
                    <Th isNumeric>Creative</Th>
                    <Th isNumeric>Comm</Th>
                    <Th isNumeric>Lead</Th>
                    <Th isNumeric>Ops</Th>
                    <Th isNumeric>Compliance</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {sortedEmployees.map((emp) => (
                    <Tr key={emp._id}>
                      <Td position="sticky" left={0} bg="white" zIndex={1} fontWeight="semibold">
                        <HStack spacing={2}>
                          <Text>{emp.fullName}</Text>
                          {emp.hasPhD && <Badge colorScheme="purple" fontSize="xs">PhD</Badge>}
                        </HStack>
                      </Td>
                      <Td fontSize="xs">{emp.role}</Td>
                      <SkillCell value={emp.technical} />
                      <SkillCell value={emp.analytical} />
                      <SkillCell value={emp.research} />
                      <SkillCell value={emp.creativity} />
                      <SkillCell value={emp.communication} />
                      <SkillCell value={emp.leadership} />
                      <SkillCell value={emp.operations} />
                      <SkillCell value={emp.compliance} />
                    </Tr>
                  ))}
                  {/* Team Average Row */}
                  <Tr fontWeight="bold" bg="gray.50">
                    <Td position="sticky" left={0} bg="gray.50" zIndex={1}>
                      Team Average
                    </Td>
                    <Td>—</Td>
                    <Td isNumeric>{skillAverages.technical}</Td>
                    <Td isNumeric>{skillAverages.analytical}</Td>
                    <Td isNumeric>{skillAverages.research}</Td>
                    <Td isNumeric>{skillAverages.creativity}</Td>
                    <Td isNumeric>{skillAverages.communication}</Td>
                    <Td isNumeric>{skillAverages.leadership}</Td>
                    <Td isNumeric>{skillAverages.operations}</Td>
                    <Td isNumeric>{skillAverages.compliance}</Td>
                  </Tr>
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>
    </Box>
  );
}

/**
 * Skill cell component with color coding
 */
function SkillCell({ value }: { value: number }) {
  const getColor = (val: number): string => {
    if (val >= 80) return 'green.100';
    if (val >= 60) return 'yellow.100';
    if (val >= 40) return 'orange.100';
    return 'red.100';
  };

  const getTextColor = (val: number): string => {
    if (val >= 80) return 'green.800';
    if (val >= 60) return 'yellow.800';
    if (val >= 40) return 'orange.800';
    return 'red.800';
  };

  return (
    <Tooltip label={`Skill: ${value}/100`}>
      <Td
        isNumeric
        bg={getColor(value)}
        color={getTextColor(value)}
        fontWeight="semibold"
      >
        {value}
      </Td>
    </Tooltip>
  );
}

/**
 * Generate recommendation for skill gap
 */
function generateGapRecommendation(skill: string, gap: number): string {
  if (gap >= 20) {
    return `Critical gap. Hire ${skill}-focused specialist immediately.`;
  } else if (gap >= 10) {
    return `Moderate gap. Invest in ${skill} training or hire mid-level talent.`;
  } else {
    return `Small gap. Upskill existing team through training programs.`;
  }
}
