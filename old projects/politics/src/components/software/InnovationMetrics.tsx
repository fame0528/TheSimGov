/**
 * @file src/components/software/InnovationMetrics.tsx
 * @description High-level innovation KPI dashboard with strategic insights
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
  Spinner,
} from '@chakra-ui/react';
import { FaLightbulb, FaAward, FaShieldAlt, FaDollarSign, FaArrowUp, FaArrowDown, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface InnovationMetricsProps {
  companyId: string;
}

export default function InnovationMetrics({ companyId }: InnovationMetricsProps) {
  const [loading, setLoading] = useState(true);
  const [totalProjects, setTotalProjects] = useState(0);
  const [activeProjects, setActiveProjects] = useState(0);
  const [totalBreakthroughs, setTotalBreakthroughs] = useState(0);
  const [patentableBreakthroughs, setPatentableBreakthroughs] = useState(0);
  const [totalPatents, setTotalPatents] = useState(0);
  const [approvedPatents, setApprovedPatents] = useState(0);
  const [licensingRevenue, setLicensingRevenue] = useState(0);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [filingCosts, setFilingCosts] = useState(0);
  const [brandValue, setBrandValue] = useState(0);

  useEffect(() => {
    loadInnovationMetrics();
  }, [companyId]);

  const loadInnovationMetrics = async () => {
    setLoading(true);
    try {
      const [projectsRes, patentsRes, licensingRes, trademarksRes] = await Promise.all([
        fetch(`/api/ai/research/projects?companyId=${companyId}`),
        fetch(`/api/ai/research/patents?companyId=${companyId}`),
        fetch(`/api/innovation/licensing?companyId=${companyId}`),
        fetch(`/api/innovation/trademarks?companyId=${companyId}`)
      ]);

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setTotalProjects(data.projects?.length || 0);
        setActiveProjects(data.activeCount || 0);
      }

      if (totalProjects > 0) {
        setTotalBreakthroughs(Math.floor(totalProjects * 0.15));
        setPatentableBreakthroughs(Math.floor(totalProjects * 0.15 * 0.25));
      }

      if (patentsRes.ok) {
        const data = await patentsRes.json();
        setTotalPatents(data.totalPatents || 0);
        const approved = data.patents?.filter((p: any) => p.status === 'Approved').length || 0;
        setApprovedPatents(approved);
        const totalValue = data.patents?.reduce((sum: number, p: any) => sum + (p.estimatedValue || 0), 0) || 0;
        setPortfolioValue(totalValue);
        const totalCost = data.patents?.reduce((sum: number, p: any) => sum + (p.filingCost || 0), 0) || 0;
        setFilingCosts(totalCost);
      }

      if (licensingRes.ok) {
        const data = await licensingRes.json();
        const revenue = data.licensingAgreements?.reduce((sum: number, a: any) => 
          sum + (a.totalRevenue || a.upfrontFee || 0), 0) || 0;
        setLicensingRevenue(revenue);
      }

      if (trademarksRes.ok) {
        const data = await trademarksRes.json();
        const value = data.trademarks?.reduce((sum: number, t: any) => sum + (t.brandValue || 0), 0) || 0;
        setBrandValue(value);
      }
    } catch (error) {
      console.error('Error loading innovation metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const breakthroughRate = activeProjects > 0 ? (totalBreakthroughs / activeProjects) * 100 : 0;
  const patentabilityRate = totalBreakthroughs > 0 ? (patentableBreakthroughs / totalBreakthroughs) * 100 : 0;
  const approvalRate = totalPatents > 0 ? (approvedPatents / totalPatents) * 100 : 0;
  const roi = filingCosts > 0 ? ((licensingRevenue + portfolioValue) / filingCosts) * 100 : 0;

  const funnelData = [
    { stage: 'Projects', count: totalProjects, conversion: 100 },
    { stage: 'Breakthroughs', count: totalBreakthroughs, conversion: breakthroughRate },
    { stage: 'Patentable', count: patentableBreakthroughs, conversion: patentabilityRate },
    { stage: 'Patents Filed', count: totalPatents, conversion: totalProjects > 0 ? (totalPatents / totalProjects) * 100 : 0 },
    { stage: 'Revenue', count: Math.floor(licensingRevenue / 100000), conversion: totalPatents > 0 ? (licensingRevenue / (totalPatents * 100000)) * 100 : 0 }
  ];

  const roiData = [
    { category: 'Filing Costs', value: filingCosts / 1000000 },
    { category: 'Portfolio Value', value: portfolioValue / 1000000 },
    { category: 'Licensing Revenue', value: licensingRevenue / 1000000 },
    { category: 'Brand Value', value: brandValue / 1000000 }
  ];

  const insights = [];
  if (breakthroughRate < 10) {
    insights.push({
      type: 'warning',
      title: 'Low breakthrough rate',
      description: `Current: ${breakthroughRate.toFixed(1)}%. Increase compute budget or project complexity.`,
      icon: FaExclamationCircle,
      color: 'orange'
    });
  } else {
    insights.push({
      type: 'success',
      title: 'Strong innovation pipeline',
      description: `${breakthroughRate.toFixed(1)}% breakthrough rate exceeds 10% target.`,
      icon: FaCheckCircle,
      color: 'green'
    });
  }

  if (patentabilityRate > 20 && totalPatents < 5) {
    insights.push({
      type: 'action',
      title: 'File more patents',
      description: `${patentabilityRate.toFixed(0)}% of breakthroughs are patentable.`,
      icon: FaAward,
      color: 'blue'
    });
  }

  if (approvedPatents >= 5 && licensingRevenue < 1000000) {
    insights.push({
      type: 'action',
      title: 'Pursue licensing opportunities',
      description: `${approvedPatents} granted patents available. Target: $1M+`,
      icon: FaDollarSign,
      color: 'blue'
    });
  }

  if (roi > 200) {
    insights.push({
      type: 'success',
      title: 'Excellent ROI',
      description: `${roi.toFixed(0)}% return demonstrates strong value creation.`,
      icon: FaArrowUp,
      color: 'green'
    });
  }

  if (loading) {
    return (
      <Box w="full" p={6} borderWidth={1} borderRadius="lg" bg="white">
        <VStack spacing={4}>
          <HStack>
            <FaAward size={20} />
            <Heading size="md">Innovation Metrics</Heading>
          </HStack>
          <Spinner size="lg" />
          <Text color="gray.500">Loading innovation metrics...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack spacing={6} w="full" align="stretch">
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Active Projects</Text>
            <FaLightbulb color="gray" />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{activeProjects}</Text>
          <Text fontSize="xs" color="gray.500">{totalProjects} total</Text>
          <HStack fontSize="xs" color="green.600" mt={1}>
            <FaArrowUp />
            <Text>Innovation pipeline</Text>
          </HStack>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Breakthroughs</Text>
            <FaAward color="gray" />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{totalBreakthroughs}</Text>
          <Text fontSize="xs" color="gray.500">{breakthroughRate.toFixed(1)}% rate</Text>
          <HStack fontSize="xs" color={breakthroughRate >= 10 ? 'green.600' : 'orange.600'} mt={1}>
            {breakthroughRate >= 10 ? <FaArrowUp /> : <FaArrowDown />}
            <Text>{breakthroughRate >= 10 ? 'Above' : 'Below'} target</Text>
          </HStack>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Patents</Text>
            <FaShieldAlt color="gray" />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{totalPatents}</Text>
          <Text fontSize="xs" color="gray.500">{approvedPatents} approved</Text>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Revenue</Text>
            <FaDollarSign color="gray" />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">${(licensingRevenue / 1000000).toFixed(1)}M</Text>
          <Text fontSize="xs" color="gray.500">ROI: {roi.toFixed(0)}%</Text>
        </Box>
      </Grid>

      {insights.length > 0 && (
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <Heading size="md" mb={4}>Strategic Insights</Heading>
          <VStack spacing={3} align="stretch">
            {insights.map((insight, idx) => {
              const Icon = insight.icon;
              return (
                <HStack key={idx} p={3} borderWidth={1} borderRadius="md" align="start">
                  <Box color={`${insight.color}.600`}>
                    <Icon size={20} />
                  </Box>
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontWeight="semibold">{insight.title}</Text>
                    <Text fontSize="sm" color="gray.600">{insight.description}</Text>
                  </VStack>
                </HStack>
              );
            })}
          </VStack>
        </Box>
      )}

      <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
        <Heading size="md" mb={4}>Innovation Funnel</Heading>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnelData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Count" />
            <Bar yAxisId="right" dataKey="conversion" fill="#10b981" name="Conversion %" />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
        <Heading size="md" mb={4}>Portfolio Value & ROI</Heading>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={roiData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}M`} />
            <Bar dataKey="value" fill="#8b5cf6" name="Value ($M)" />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
        <Heading size="md" mb={4}>Performance Summary</Heading>
        <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={3}>
          <Box>
            <Text fontSize="sm" color="gray.500">Breakthrough Rate</Text>
            <Text fontSize="lg" fontWeight="bold">{breakthroughRate.toFixed(1)}%</Text>
            <Badge colorScheme={breakthroughRate >= 10 ? 'green' : 'gray'}>
              {breakthroughRate >= 10 ? '✓ Target met' : 'Below target'}
            </Badge>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.500">Patentability</Text>
            <Text fontSize="lg" fontWeight="bold">{patentabilityRate.toFixed(0)}%</Text>
            <Badge colorScheme={patentabilityRate >= 20 ? 'green' : 'gray'}>
              {patentabilityRate >= 20 ? '✓ Strong IP' : 'Building'}
            </Badge>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.500">Approval Rate</Text>
            <Text fontSize="lg" fontWeight="bold">{approvalRate.toFixed(0)}%</Text>
            <Badge variant="outline">{approvedPatents}/{totalPatents}</Badge>
          </Box>
        </Grid>
        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
          <Box>
            <Text fontSize="sm" color="gray.500">Portfolio Value</Text>
            <Text fontSize="lg" fontWeight="bold">${((portfolioValue + brandValue) / 1000000).toFixed(1)}M</Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.500">ROI</Text>
            <Text fontSize="lg" fontWeight="bold" color="green.600">{roi.toFixed(0)}%</Text>
          </Box>
        </Grid>
      </Box>
    </VStack>
  );
}
