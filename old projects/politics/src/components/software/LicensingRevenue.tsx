/**
 * @file src/components/software/LicensingRevenue.tsx
 * @description Licensing agreement management with royalty tracking and revenue analysis
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
  Input,
  Select,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react';
import { FaDollarSign, FaHandshake, FaChartLine, FaPlus, FaExclamationTriangle } from 'react-icons/fa';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LicensingRevenueProps {
  companyId: string;
}

export default function LicensingRevenue({ companyId }: LicensingRevenueProps) {
  const [loading, setLoading] = useState(true);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [patents, setPatents] = useState<any[]>([]);
  const [selectedPatent, setSelectedPatent] = useState<string>('');
  const [licenseeCompany, setLicenseeCompany] = useState('');
  const [licenseType, setLicenseType] = useState('Non-Exclusive');
  const [royaltyModel, setRoyaltyModel] = useState('Percentage');
  const [upfrontFee, setUpfrontFee] = useState(0);
  const [royaltyRate, setRoyaltyRate] = useState(5);
  const [termYears, setTermYears] = useState(5);
  const [territory, setTerritory] = useState('Worldwide');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    loadLicensingData();
  }, [companyId]);

  const loadLicensingData = async () => {
    setLoading(true);
    try {
      const [agreementsRes, patentsRes] = await Promise.all([
        fetch(`/api/innovation/licensing?companyId=${companyId}`),
        fetch(`/api/ai/research/patents?companyId=${companyId}&status=Approved`)
      ]);

      if (agreementsRes.ok) {
        const data = await agreementsRes.json();
        setAgreements(data.licensingAgreements || []);
      }

      if (patentsRes.ok) {
        const data = await patentsRes.json();
        setPatents(data.patents || []);
      }
    } catch (error) {
      console.error('Error loading licensing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgreement = async () => {
    if (!selectedPatent || !licenseeCompany) {
      toast({
        title: 'Error',
        description: 'Please select a patent and enter licensee company',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      const res = await fetch('/api/innovation/licensing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          patentId: selectedPatent,
          licenseeCompany,
          licenseType,
          royaltyModel,
          upfrontFee,
          royaltyRate,
          termYears,
          territory,
        })
      });

      if (res.ok) {
        toast({
          title: 'Agreement created',
          description: `License granted to ${licenseeCompany}`,
          status: 'success',
          duration: 5000,
        });
        onClose();
        loadLicensingData();
        resetForm();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create agreement',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const resetForm = () => {
    setSelectedPatent('');
    setLicenseeCompany('');
    setLicenseType('Non-Exclusive');
    setRoyaltyModel('Percentage');
    setUpfrontFee(0);
    setRoyaltyRate(5);
    setTermYears(5);
    setTerritory('Worldwide');
  };

  const totalRevenue = agreements.reduce((sum, a) => sum + (a.totalRevenue || a.upfrontFee || 0), 0);
  const activeAgreements = agreements.filter(a => {
    const endDate = new Date(a.endDate);
    return endDate > new Date();
  }).length;
  const exclusiveCount = agreements.filter(a => a.licenseType === 'Exclusive').length;
  const avgRoyaltyRate = agreements.length > 0
    ? agreements.reduce((sum, a) => sum + (a.royaltyRate || 0), 0) / agreements.length
    : 0;

  const revenueByType = [
    { 
      type: 'Exclusive', 
      revenue: agreements.filter(a => a.licenseType === 'Exclusive').reduce((s, a) => s + (a.totalRevenue || 0), 0) / 1000000
    },
    { 
      type: 'Non-Exclusive', 
      revenue: agreements.filter(a => a.licenseType === 'Non-Exclusive').reduce((s, a) => s + (a.totalRevenue || 0), 0) / 1000000
    },
  ];

  const revenueTimeline = agreements
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .reduce((acc: any[], agreement) => {
      const month = new Date(agreement.startDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const existing = acc.find(item => item.month === month);
      
      if (existing) {
        existing.revenue += (agreement.totalRevenue || agreement.upfrontFee || 0) / 1000000;
      } else {
        acc.push({
          month,
          revenue: (agreement.totalRevenue || agreement.upfrontFee || 0) / 1000000,
          cumulative: acc.length > 0 
            ? acc[acc.length - 1].cumulative + ((agreement.totalRevenue || agreement.upfrontFee || 0) / 1000000)
            : (agreement.totalRevenue || agreement.upfrontFee || 0) / 1000000
        });
      }
      
      return acc;
    }, []);

  const expiringAgreements = agreements.filter(a => {
    const endDate = new Date(a.endDate);
    const now = new Date();
    const daysUntilExpiry = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry > 0 && daysUntilExpiry <= 90;
  });

  if (loading) {
    return (
      <Box w="full" p={6} borderWidth={1} borderRadius="lg" bg="white">
        <VStack spacing={4}>
          <HStack>
            <FaHandshake size={20} />
            <Heading size="md">Licensing Revenue</Heading>
          </HStack>
          <Spinner size="lg" />
          <Text color="gray.500">Loading licensing data...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack spacing={6} w="full" align="stretch">
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Total Revenue</Text>
            <FaDollarSign color="gray" />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">${(totalRevenue / 1000000).toFixed(2)}M</Text>
          <Text fontSize="xs" color="gray.500">Lifetime</Text>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Active Agreements</Text>
            <FaHandshake color="gray" />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{activeAgreements}</Text>
          <Text fontSize="xs" color="gray.500">{agreements.length} total</Text>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Exclusive Licenses</Text>
            <FaChartLine color="gray" />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{exclusiveCount}</Text>
          <Text fontSize="xs" color="gray.500">Higher value</Text>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Avg Royalty Rate</Text>
            <FaDollarSign color="gray" />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{avgRoyaltyRate.toFixed(1)}%</Text>
          <Text fontSize="xs" color="gray.500">Of revenue</Text>
        </Box>
      </Grid>

      <HStack justify="space-between">
        <Heading size="md">Licensing Agreements</Heading>
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={onOpen}>
          New Agreement
        </Button>
      </HStack>

      {expiringAgreements.length > 0 && (
        <Box p={4} bg="orange.50" borderWidth={1} borderColor="orange.200" borderRadius="md">
          <HStack mb={2}>
            <FaExclamationTriangle color="orange" />
            <Text fontWeight="semibold" color="orange.800">
              {expiringAgreements.length} agreement{expiringAgreements.length !== 1 ? 's' : ''} expiring soon
            </Text>
          </HStack>
          <VStack align="stretch" spacing={2}>
            {expiringAgreements.map((agreement, idx) => {
              const daysLeft = Math.ceil((new Date(agreement.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <HStack key={idx} justify="space-between" p={2} bg="white" borderRadius="md">
                  <Text fontSize="sm">{agreement.licenseeCompany}</Text>
                  <Badge colorScheme="orange">{daysLeft} days left</Badge>
                </HStack>
              );
            })}
          </VStack>
        </Box>
      )}

      <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
        <Heading size="md" mb={4}>Active Licensing Agreements</Heading>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Licensee</Th>
              <Th>License Type</Th>
              <Th>Royalty Model</Th>
              <Th isNumeric>Upfront Fee</Th>
              <Th isNumeric>Total Revenue</Th>
              <Th>Term</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {agreements.map((agreement, idx) => {
              const isActive = new Date(agreement.endDate) > new Date();
              return (
                <Tr key={idx}>
                  <Td>{agreement.licenseeCompany || 'Unknown'}</Td>
                  <Td>
                    <Badge colorScheme={agreement.licenseType === 'Exclusive' ? 'purple' : 'blue'}>
                      {agreement.licenseType}
                    </Badge>
                  </Td>
                  <Td>{agreement.royaltyModel || 'Unknown'}</Td>
                  <Td isNumeric>${((agreement.upfrontFee || 0) / 1000).toFixed(0)}K</Td>
                  <Td isNumeric>${((agreement.totalRevenue || 0) / 1000).toFixed(0)}K</Td>
                  <Td>{agreement.termYears} years</Td>
                  <Td>
                    <Badge colorScheme={isActive ? 'green' : 'gray'}>
                      {isActive ? 'Active' : 'Expired'}
                    </Badge>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>

      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <Heading size="md" mb={4}>Revenue by License Type</Heading>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}M`} />
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ($M)" />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <Heading size="md" mb={4}>Cumulative Revenue</Heading>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTimeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}M`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Monthly Revenue ($M)" />
              <Line type="monotone" dataKey="cumulative" stroke="#10b981" name="Cumulative ($M)" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Grid>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Licensing Agreement</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Select Patent</FormLabel>
                <Select 
                  placeholder="Choose a patent" 
                  value={selectedPatent}
                  onChange={(e) => setSelectedPatent(e.target.value)}
                >
                  {patents.map(patent => (
                    <option key={patent.id} value={patent.id}>
                      {patent.patentId} - {patent.name || 'Unnamed'}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Licensee Company</FormLabel>
                <Input 
                  placeholder="Company name"
                  value={licenseeCompany}
                  onChange={(e) => setLicenseeCompany(e.target.value)}
                />
              </FormControl>

              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <FormControl>
                  <FormLabel>License Type</FormLabel>
                  <Select value={licenseType} onChange={(e) => setLicenseType(e.target.value)}>
                    <option value="Exclusive">Exclusive</option>
                    <option value="Non-Exclusive">Non-Exclusive</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Royalty Model</FormLabel>
                  <Select value={royaltyModel} onChange={(e) => setRoyaltyModel(e.target.value)}>
                    <option value="Fixed Fee">Fixed Fee</option>
                    <option value="Percentage">Percentage</option>
                    <option value="Per-Unit">Per-Unit</option>
                    <option value="Hybrid">Hybrid</option>
                  </Select>
                </FormControl>
              </Grid>

              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <FormControl>
                  <FormLabel>Upfront Fee ($)</FormLabel>
                  <NumberInput 
                    min={0} 
                    value={upfrontFee}
                    onChange={(_, val) => setUpfrontFee(val)}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Royalty Rate (%)</FormLabel>
                  <NumberInput 
                    min={0} 
                    max={100} 
                    value={royaltyRate}
                    onChange={(_, val) => setRoyaltyRate(val)}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </Grid>

              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <FormControl>
                  <FormLabel>Term (Years)</FormLabel>
                  <NumberInput 
                    min={1} 
                    max={20} 
                    value={termYears}
                    onChange={(_, val) => setTermYears(val)}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Territory</FormLabel>
                  <Select value={territory} onChange={(e) => setTerritory(e.target.value)}>
                    <option value="Worldwide">Worldwide</option>
                    <option value="North America">North America</option>
                    <option value="Europe">Europe</option>
                    <option value="Asia Pacific">Asia Pacific</option>
                  </Select>
                </FormControl>
              </Grid>

              <Box p={4} bg="blue.50" borderRadius="md">
                <Text fontWeight="semibold" mb={2}>Agreement Summary</Text>
                <VStack align="start" spacing={1} fontSize="sm">
                  <Text>Upfront Payment: ${upfrontFee.toLocaleString()}</Text>
                  <Text>Ongoing Royalties: {royaltyRate}% ({royaltyModel})</Text>
                  <Text>Term: {termYears} years ({licenseType})</Text>
                  <Text>Territory: {territory}</Text>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleCreateAgreement}>
              Create Agreement
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
