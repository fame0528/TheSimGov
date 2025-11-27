/**
 * @file src/components/software/PatentPortfolio.tsx
 * @description Multi-jurisdictional patent filing and portfolio valuation
 * @created 2025-11-19
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Grid,
  Text,
  Heading,
  Badge,
  Button,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Checkbox,
  VStack as ChakraVStack,
} from '@chakra-ui/react';
import { FaShieldAlt, FaGlobe, FaDollarSign, FaClock, FaPlus } from 'react-icons/fa';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PatentPortfolioProps {
  companyId: string;
}

export default function PatentPortfolio({ companyId }: PatentPortfolioProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [patents, setPatents] = useState<any[]>([]);
  const [breakthroughs, setBreakthroughs] = useState<any[]>([]);
  const [selectedBreakthrough, setSelectedBreakthrough] = useState<any>(null);
  const [jurisdictions, setJurisdictions] = useState<string[]>([]);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const jurisdictionCosts: Record<string, number> = {
    'United States': 15000,
    'European Union': 25000,
    'China': 20000,
    'Japan': 18000,
    'South Korea': 12000,
    'Canada': 10000,
    'Australia': 8000,
  };

  useEffect(() => {
    loadPatentData();
  }, [companyId]);

  const loadPatentData = async () => {
    setLoading(true);
    try {
      const [patentsRes, breakthroughsRes] = await Promise.all([
        fetch(`/api/ai/research/patents?companyId=${companyId}`),
        fetch(`/api/ai/research/breakthroughs?companyId=${companyId}&patentable=true`)
      ]);

      if (patentsRes.ok) {
        const data = await patentsRes.json();
        setPatents(data.patents || []);
      }

      if (breakthroughsRes.ok) {
        const data = await breakthroughsRes.json();
        setBreakthroughs(data.breakthroughs || []);
      }
    } catch (error) {
      console.error('Error loading patent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFilingModal = (breakthrough: any) => {
    setSelectedBreakthrough(breakthrough);
    setJurisdictions(['United States']);
    setEstimatedCost(jurisdictionCosts['United States']);
    onOpen();
  };

  const handleJurisdictionToggle = (jurisdiction: string) => {
    const newJurisdictions = jurisdictions.includes(jurisdiction)
      ? jurisdictions.filter(j => j !== jurisdiction)
      : [...jurisdictions, jurisdiction];
    
    setJurisdictions(newJurisdictions);
    const cost = newJurisdictions.reduce((sum, j) => sum + jurisdictionCosts[j], 0);
    setEstimatedCost(cost);
  };

  const handleFilePatent = async () => {
    if (!selectedBreakthrough || jurisdictions.length === 0) {
      toast({
        title: 'Error',
        description: 'Select at least one jurisdiction',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      const res = await fetch('/api/ai/research/patents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          breakthroughId: selectedBreakthrough.id,
          jurisdictions,
          filingCost: estimatedCost,
        })
      });

      if (res.ok) {
        toast({
          title: 'Patent filed successfully',
          description: `Filed in ${jurisdictions.length} jurisdiction${jurisdictions.length > 1 ? 's' : ''}`,
          status: 'success',
          duration: 5000,
        });
        onClose();
        loadPatentData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to file patent',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const totalPatents = patents.length;
  const filedPatents = patents.filter(p => p.status === 'Filed' || p.status === 'UnderReview').length;
  const approvedPatents = patents.filter(p => p.status === 'Approved').length;
  const totalValue = patents.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
  const totalCost = patents.reduce((sum, p) => sum + (p.filingCost || 0), 0);

  const statusData = [
    { name: 'Filed', value: patents.filter(p => p.status === 'Filed').length },
    { name: 'Under Review', value: patents.filter(p => p.status === 'UnderReview').length },
    { name: 'Approved', value: patents.filter(p => p.status === 'Approved').length },
    { name: 'Rejected', value: patents.filter(p => p.status === 'Rejected').length },
  ];

  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'];

  const jurisdictionDistribution = Object.keys(jurisdictionCosts).map(jur => ({
    name: jur,
    count: patents.filter(p => p.jurisdictions?.includes(jur)).length
  }));

  if (loading) {
    return (
      <Box w="full" p={6} borderWidth={1} borderRadius="lg" bg="white">
        <VStack spacing={4}>
          <HStack>
            <FaShieldAlt size={20} />
            <Heading size="md">Patent Portfolio</Heading>
          </HStack>
          <Spinner size="lg" />
          <Text color="gray.500">Loading patent data...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack spacing={6} w="full" align="stretch">
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Total Patents</Text>
            <FaShieldAlt color="gray" />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{totalPatents}</Text>
          <Text fontSize="xs" color="gray.500">{approvedPatents} granted</Text>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">In Process</Text>
            <FaClock color="gray" />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{filedPatents}</Text>
          <Text fontSize="xs" color="gray.500">Filed or under review</Text>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Portfolio Value</Text>
            <FaDollarSign color="gray" />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">${(totalValue / 1000000).toFixed(1)}M</Text>
          <Text fontSize="xs" color="gray.500">Estimated</Text>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Total Cost</Text>
            <FaDollarSign color="gray" />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">${(totalCost / 1000).toFixed(0)}K</Text>
          <Text fontSize="xs" color="gray.500">Filing fees</Text>
        </Box>
      </Grid>

      <HStack spacing={2} mb={4}>
        <Button 
          onClick={() => setActiveTab('overview')} 
          colorScheme={activeTab === 'overview' ? 'blue' : 'gray'}
          size="sm"
        >
          Overview
        </Button>
        <Button 
          onClick={() => setActiveTab('breakthroughs')} 
          colorScheme={activeTab === 'breakthroughs' ? 'blue' : 'gray'}
          size="sm"
        >
          Research Patents ({breakthroughs.length})
        </Button>
        <Button 
          onClick={() => setActiveTab('filed')} 
          colorScheme={activeTab === 'filed' ? 'blue' : 'gray'}
          size="sm"
        >
          Filed ({filedPatents})
        </Button>
        <Button 
          onClick={() => setActiveTab('granted')} 
          colorScheme={activeTab === 'granted' ? 'blue' : 'gray'}
          size="sm"
        >
          Granted ({approvedPatents})
        </Button>
      </HStack>

      {activeTab === 'overview' && (
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
          <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
            <Heading size="md" mb={4}>Patent Status</Heading>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
            <Heading size="md" mb={4}>Jurisdictional Distribution</Heading>
            <VStack align="stretch" spacing={2}>
              {jurisdictionDistribution
                .filter(jur => jur.count > 0)
                .sort((a, b) => b.count - a.count)
                .map((jur, idx) => (
                  <HStack key={idx} justify="space-between" p={2} borderWidth={1} borderRadius="md">
                    <HStack>
                      <FaGlobe color="gray" />
                      <Text fontSize="sm">{jur.name}</Text>
                    </HStack>
                    <Badge colorScheme="blue">{jur.count} patent{jur.count !== 1 ? 's' : ''}</Badge>
                  </HStack>
                ))
              }
            </VStack>
          </Box>
        </Grid>
      )}

      {activeTab === 'breakthroughs' && (
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <Heading size="md" mb={4}>Patentable Breakthroughs</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Breakthrough</Th>
                <Th>Novelty</Th>
                <Th>Performance</Th>
                <Th>Discovery Date</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {breakthroughs.map((bt, idx) => (
                <Tr key={idx}>
                  <Td>{bt.name || 'Unnamed'}</Td>
                  <Td>
                    <Badge colorScheme={bt.noveltyScore >= 80 ? 'green' : 'blue'}>
                      {bt.noveltyScore || 75}
                    </Badge>
                  </Td>
                  <Td>+{bt.performanceGain || 0}%</Td>
                  <Td>{new Date(bt.discoveryDate).toLocaleDateString()}</Td>
                  <Td>
                    <Button 
                      size="sm" 
                      leftIcon={<FaPlus />}
                      onClick={() => handleOpenFilingModal(bt)}
                    >
                      File Patent
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {activeTab === 'filed' && (
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <Heading size="md" mb={4}>Patents in Process</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Patent ID</Th>
                <Th>Jurisdictions</Th>
                <Th>Status</Th>
                <Th isNumeric>Filing Cost</Th>
                <Th>Filed Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {patents.filter(p => p.status === 'Filed' || p.status === 'UnderReview').map((patent, idx) => (
                <Tr key={idx}>
                  <Td>{patent.patentId || `PAT-${idx + 1}`}</Td>
                  <Td>
                    <VStack align="start" spacing={1}>
                      {(patent.jurisdictions || []).map((jur: string, jIdx: number) => (
                        <Badge key={jIdx} size="sm">{jur}</Badge>
                      ))}
                    </VStack>
                  </Td>
                  <Td>
                    <Badge colorScheme={patent.status === 'UnderReview' ? 'orange' : 'blue'}>
                      {patent.status}
                    </Badge>
                  </Td>
                  <Td isNumeric>${((patent.filingCost || 0) / 1000).toFixed(0)}K</Td>
                  <Td>{new Date(patent.filingDate).toLocaleDateString()}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {activeTab === 'granted' && (
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <Heading size="md" mb={4}>Granted Patents</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Patent ID</Th>
                <Th>Jurisdictions</Th>
                <Th isNumeric>Estimated Value</Th>
                <Th>Strategic Tier</Th>
                <Th>Grant Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {patents.filter(p => p.status === 'Approved').map((patent, idx) => (
                <Tr key={idx}>
                  <Td>{patent.patentId || `PAT-${idx + 1}`}</Td>
                  <Td>
                    <VStack align="start" spacing={1}>
                      {(patent.jurisdictions || []).map((jur: string, jIdx: number) => (
                        <Badge key={jIdx} size="sm" colorScheme="green">{jur}</Badge>
                      ))}
                    </VStack>
                  </Td>
                  <Td isNumeric>${((patent.estimatedValue || 0) / 1000000).toFixed(1)}M</Td>
                  <Td>
                    <Badge colorScheme={patent.strategicTier === 'Core' ? 'purple' : 'blue'}>
                      {patent.strategicTier || 'Standard'}
                    </Badge>
                  </Td>
                  <Td>{patent.grantDate ? new Date(patent.grantDate).toLocaleDateString() : 'N/A'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>File Patent Application</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedBreakthrough && (
              <ChakraVStack spacing={4} align="stretch">
                <Box p={3} bg="blue.50" borderRadius="md">
                  <Text fontWeight="semibold">{selectedBreakthrough.name}</Text>
                  <Text fontSize="sm" color="gray.600">{selectedBreakthrough.description}</Text>
                </Box>

                <FormControl>
                  <FormLabel>Select Jurisdictions</FormLabel>
                  <VStack align="stretch" spacing={2}>
                    {Object.keys(jurisdictionCosts).map(jur => (
                      <Checkbox
                        key={jur}
                        isChecked={jurisdictions.includes(jur)}
                        onChange={() => handleJurisdictionToggle(jur)}
                      >
                        <HStack justify="space-between" w="full">
                          <Text>{jur}</Text>
                          <Text fontSize="sm" color="gray.600">${(jurisdictionCosts[jur] / 1000).toFixed(0)}K</Text>
                        </HStack>
                      </Checkbox>
                    ))}
                  </VStack>
                </FormControl>

                <Box p={4} bg="gray.50" borderRadius="md">
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Total Estimated Cost</Text>
                    <Text fontSize="xl" fontWeight="bold">${(estimatedCost / 1000).toFixed(0)}K</Text>
                  </HStack>
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    {jurisdictions.length} jurisdiction{jurisdictions.length !== 1 ? 's' : ''} selected
                  </Text>
                </Box>
              </ChakraVStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleFilePatent}>
              File Patent
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
