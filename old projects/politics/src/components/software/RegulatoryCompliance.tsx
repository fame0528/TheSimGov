/**
 * @file src/components/software/RegulatoryCompliance.tsx
 * @description Compliance monitoring dashboard for AI research and brand protection
 * @created 2025-11-19
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Grid, Text, Heading, Badge, Progress, Spinner,
  Tabs, TabList, TabPanels, Tab, TabPanel, Alert, AlertIcon,
} from '@chakra-ui/react';
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaClock, FaFileAlt, FaBuilding, FaCalendar } from 'react-icons/fa';

interface Project {
  _id: string;
  type: string;
  status: string;
  complexity: number;
  description?: string;
}

interface Trademark {
  _id?: string;
  trademarkName: string;
  trademarkType: string;
  jurisdiction: string;
  classesCount: number;
  registrationCost?: number;
  brandValue?: number;
  status: string;
  registrationDate?: string;
  renewalDate?: string;
}

interface RegulatoryComplianceProps {
  companyId: string;
}

export default function RegulatoryCompliance({ companyId }: RegulatoryComplianceProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [trademarks, setTrademarks] = useState<Trademark[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('Active');
  const [activeProjectCount, setActiveProjectCount] = useState(0);
  const [complianceRate, setComplianceRate] = useState(100);
  const [expiringTrademarks, setExpiringTrademarks] = useState(0);
  const [totalBrandValue, setTotalBrandValue] = useState(0);

  useEffect(() => {
    loadComplianceData();
  }, [companyId, statusFilter]);

  const loadComplianceData = async () => {
    setLoading(true);
    try {
      const [projectsRes, trademarksRes] = await Promise.all([
        fetch(`/api/ai/research/projects?companyId=${companyId}${statusFilter ? `&status=${statusFilter}` : ''}`),
        fetch(`/api/innovation/trademarks?companyId=${companyId}`)
      ]);

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
        const activeCount = data.projects?.filter((p: Project) => p.status === 'Active').length || 0;
        setActiveProjectCount(activeCount);
        const rate = data.projects?.length > 0 ? (data.projects.filter((p: Project) => p.status === 'Active' || p.status === 'Completed').length / data.projects.length) * 100 : 100;
        setComplianceRate(rate);
      }

      if (trademarksRes.ok) {
        const data = await trademarksRes.json();
        setTrademarks(data.trademarks || []);
        const now = new Date();
        const oneEightyDaysFromNow = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
        const expiring = data.trademarks?.filter((t: Trademark) => {
          if (!t.renewalDate) return false;
          const renewalDate = new Date(t.renewalDate);
          return renewalDate <= oneEightyDaysFromNow && renewalDate > now;
        }).length || 0;
        setExpiringTrademarks(expiring);
        const totalValue = data.trademarks?.reduce((sum: number, t: Trademark) => sum + (t.brandValue || 0), 0) || 0;
        setTotalBrandValue(totalValue);
      }
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box w="full" p={6} borderWidth={1} borderRadius="lg" bg="white">
        <VStack spacing={4}>
          <HStack><FaShieldAlt size={20} /><Heading size="md">Regulatory Compliance</Heading></HStack>
          <Spinner size="lg" />
          <Text color="gray.500">Loading compliance data...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack spacing={6} w="full" align="stretch">
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}><Text fontSize="sm" fontWeight="medium">Active Projects</Text><FaFileAlt color="gray" /></HStack>
          <VStack align="start" spacing={1}><Text fontSize="2xl" fontWeight="bold">{activeProjectCount}</Text><Text fontSize="xs" color="gray.500">{projects.length} total projects</Text></VStack>
        </Box>
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}><Text fontSize="sm" fontWeight="medium">Compliance Rate</Text><FaCheckCircle color="gray" /></HStack>
          <VStack align="start" spacing={1}><Text fontSize="2xl" fontWeight="bold" color="green.600">{complianceRate.toFixed(0)}%</Text><Progress value={complianceRate} colorScheme="green" size="sm" w="full" mt={2} /></VStack>
        </Box>
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}><Text fontSize="sm" fontWeight="medium">Trademark Renewals</Text><FaExclamationTriangle color="orange" /></HStack>
          <VStack align="start" spacing={1}><Text fontSize="2xl" fontWeight="bold" color="orange.600">{expiringTrademarks}</Text><Text fontSize="xs" color="gray.500">Expiring within 180 days</Text></VStack>
        </Box>
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}><Text fontSize="sm" fontWeight="medium">Brand Value</Text><FaBuilding color="gray" /></HStack>
          <VStack align="start" spacing={1}><Text fontSize="2xl" fontWeight="bold">${(totalBrandValue / 1000000).toFixed(1)}M</Text><Text fontSize="xs" color="gray.500">{trademarks.length} registered trademarks</Text></VStack>
        </Box>
      </Grid>

      <Tabs index={activeTab} onChange={setActiveTab}>
        <TabList><Tab>Overview</Tab><Tab>Projects</Tab><Tab>Trademarks</Tab></TabList>
        <TabPanels>
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
                <Heading size="md" mb={4}>Compliance Status Overview</Heading>
                <Text fontSize="sm" color="gray.600" mb={4}>Current regulatory adherence across all initiatives</Text>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <HStack justify="space-between" mb={2}><Text fontSize="sm" fontWeight="medium">Active Projects Documentation</Text><Text fontSize="sm" color="gray.500">{activeProjectCount} projects</Text></HStack>
                    <Progress value={complianceRate} colorScheme="green" size="sm" />
                    <Text fontSize="xs" color="gray.500" mt={1}>{complianceRate >= 90 ? '✓ Excellent compliance' : complianceRate >= 70 ? '⚠ Review needed' : '⚠ Action required'}</Text>
                  </Box>
                  <Box>
                    <HStack justify="space-between" mb={2}><Text fontSize="sm" fontWeight="medium">Trademark Renewal Status</Text><Text fontSize="sm" color="gray.500">{trademarks.length} trademarks</Text></HStack>
                    <Progress value={trademarks.length > 0 ? ((trademarks.length - expiringTrademarks) / trademarks.length) * 100 : 100} colorScheme="blue" size="sm" />
                    <Text fontSize="xs" color="gray.500" mt={1}>{expiringTrademarks === 0 ? '✓ All renewals current' : `⚠ ${expiringTrademarks} renewal(s) needed`}</Text>
                  </Box>
                  <Box>
                    <HStack justify="space-between" mb={2}><Text fontSize="sm" fontWeight="medium">AI Ethics Reviews</Text><Text fontSize="sm" color="gray.500">Required for complexity ≥4</Text></HStack>
                    <Progress value={projects.filter(p => p.complexity >= 4).length > 0 ? 85 : 100} colorScheme="purple" size="sm" />
                    <Text fontSize="xs" color="gray.500" mt={1}>✓ Ethics compliance tracking active</Text>
                  </Box>
                </VStack>
              </Box>
              {(expiringTrademarks > 0 || complianceRate < 90) && (
                <Alert status="warning" borderRadius="lg">
                  <AlertIcon />
                  <Box flex="1"><Text fontWeight="bold">Compliance Alerts</Text>
                    <VStack align="start" spacing={1} mt={2}>
                      {expiringTrademarks > 0 && <HStack><FaClock /><Text fontSize="sm">{expiringTrademarks} trademark(s) expiring soon</Text></HStack>}
                      {complianceRate < 90 && <HStack><FaFileAlt /><Text fontSize="sm">Project documentation review needed</Text></HStack>}
                    </VStack>
                  </Box>
                </Alert>
              )}
            </VStack>
          </TabPanel>

          <TabPanel>
            <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
              <Heading size="md" mb={2}>Active Research Projects</Heading>
              <Text fontSize="sm" color="gray.600" mb={4}>Compliance monitoring for AI/ML initiatives</Text>
              <HStack spacing={2} mb={4}>
                {['Active', 'Completed', 'Cancelled'].map(status => (
                  <Badge key={status} colorScheme={statusFilter === status ? 'blue' : 'gray'} cursor="pointer" onClick={() => setStatusFilter(status)} px={3} py={1}>{status}</Badge>
                ))}
              </HStack>
              {projects.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {projects.map((project) => (
                    <Box key={project._id} p={4} borderWidth={1} borderRadius="lg">
                      <HStack justify="space-between" mb={2}>
                        <HStack><FaFileAlt /><Text fontWeight="semibold">{project.type}</Text><Badge colorScheme="gray">Complexity {project.complexity}/5</Badge></HStack>
                        <Badge colorScheme={project.status === 'Active' ? 'green' : 'gray'}>{project.status}</Badge>
                      </HStack>
                      <Text fontSize="xs" color="gray.600" mb={2}>{project.description || 'No description'}</Text>
                      <HStack spacing={2}>
                        <Badge colorScheme="green" fontSize="xs"><HStack spacing={1}><FaCheckCircle size={10} /><Text>Documentation</Text></HStack></Badge>
                        {project.complexity >= 4 && <Badge colorScheme="blue" fontSize="xs"><HStack spacing={1}><FaShieldAlt size={10} /><Text>Ethics Review</Text></HStack></Badge>}
                        {project.complexity >= 3 && <Badge colorScheme="purple" fontSize="xs"><HStack spacing={1}><FaFileAlt size={10} /><Text>Safety Audit</Text></HStack></Badge>}
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              ) : <Text textAlign="center" py={8} color="gray.500">No {statusFilter.toLowerCase()} projects</Text>}
            </Box>
          </TabPanel>

          <TabPanel>
            <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
              <Heading size="md" mb={2}>Trademark Registrations</Heading>
              <Text fontSize="sm" color="gray.600" mb={4}>Brand protection and renewal tracking</Text>
              {trademarks.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {trademarks.map((trademark, idx) => {
                    const isExpiringSoon = trademark.renewalDate && new Date(trademark.renewalDate) <= new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
                    return (
                      <Box key={idx} p={4} borderWidth={1} borderRadius="lg" bg={isExpiringSoon ? 'orange.50' : 'white'} borderColor={isExpiringSoon ? 'orange.200' : 'gray.200'}>
                        <HStack justify="space-between" mb={2}>
                          <HStack><FaBuilding /><Text fontWeight="semibold">{trademark.trademarkName}</Text><Badge colorScheme="gray">{trademark.trademarkType}</Badge>
                            {isExpiringSoon && <Badge colorScheme="red"><HStack spacing={1}><FaExclamationTriangle size={10} /><Text>Renewal Due</Text></HStack></Badge>}
                          </HStack>
                          <Badge colorScheme={trademark.status === 'Active' ? 'green' : 'gray'}>{trademark.status}</Badge>
                        </HStack>
                        <HStack spacing={4} fontSize="xs" color="gray.600" mb={1}>
                          <Text>Jurisdiction: {trademark.jurisdiction}</Text>
                          <Text>Classes: {trademark.classesCount}</Text>
                          {trademark.brandValue && <Text>Value: ${(trademark.brandValue / 1000000).toFixed(1)}M</Text>}
                        </HStack>
                        {trademark.renewalDate && <HStack fontSize="xs" color="gray.600"><FaCalendar /><Text>Renewal: {new Date(trademark.renewalDate).toLocaleDateString()}</Text></HStack>}
                      </Box>
                    );
                  })}
                </VStack>
              ) : <Text textAlign="center" py={8} color="gray.500">No trademark registrations</Text>}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
}
