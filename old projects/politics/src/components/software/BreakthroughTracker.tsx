/**
 * @file src/components/software/BreakthroughTracker.tsx
 * @description Track research breakthroughs with discovery probability and novelty scoring
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
  Progress,
  useToast,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react';
import { FaFlask, FaStar, FaShieldAlt, FaClock } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BreakthroughTrackerProps {
  companyId: string;
}

export default function BreakthroughTracker({ companyId }: BreakthroughTrackerProps) {
  const [loading, setLoading] = useState(true);
  const [breakthroughs, setBreakthroughs] = useState<any[]>([]);
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [computeBudget, setComputeBudget] = useState(1000000);
  const toast = useToast();

  useEffect(() => {
    loadBreakthroughData();
  }, [companyId]);

  const loadBreakthroughData = async () => {
    setLoading(true);
    try {
      const [projectsRes, breakthroughsRes] = await Promise.all([
        fetch(`/api/ai/research/projects?companyId=${companyId}&status=Active`),
        fetch(`/api/ai/research/breakthroughs?companyId=${companyId}`)
      ]);

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setActiveProjects(data.projects || []);
      }

      if (breakthroughsRes.ok) {
        const data = await breakthroughsRes.json();
        setBreakthroughs(data.breakthroughs || []);
      }
    } catch (error) {
      console.error('Error loading breakthrough data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscoveryProbability = (project: any) => {
    const baseProb = 0.15;
    const complexityBonus = (project.complexity || 1) * 0.03;
    const budgetBonus = (project.budget || 0) >= computeBudget ? 0.05 : 0;
    return Math.min((baseProb + complexityBonus + budgetBonus) * 100, 95);
  };

  const calculateNoveltyScore = (breakthrough: any) => {
    const baseScore = 70;
    const impactBonus = (breakthrough.performanceGain || 0) / 2;
    const efficiencyBonus = (breakthrough.efficiencyGain || 0) / 4;
    return Math.min(baseScore + impactBonus + efficiencyBonus, 100);
  };

  const isPatentable = (noveltyScore: number) => noveltyScore >= 75;

  const breakthroughTimeline = breakthroughs
    .sort((a, b) => new Date(a.discoveryDate).getTime() - new Date(b.discoveryDate).getTime())
    .map((bt, idx) => ({
      month: new Date(bt.discoveryDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      count: idx + 1,
      novelty: calculateNoveltyScore(bt)
    }));

  const handleAttemptDiscovery = async (projectId: string) => {
    try {
      const res = await fetch('/api/ai/research/breakthroughs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId, 
          companyId,
          computeBudget 
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          toast({
            title: 'Breakthrough discovered!',
            description: data.breakthrough.description,
            status: 'success',
            duration: 5000,
          });
          loadBreakthroughData();
        } else {
          toast({
            title: 'No breakthrough this time',
            description: 'Continue research efforts',
            status: 'info',
            duration: 3000,
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to attempt discovery',
        status: 'error',
        duration: 3000,
      });
    }
  };

  if (loading) {
    return (
      <Box w="full" p={6} borderWidth={1} borderRadius="lg" bg="white">
        <VStack spacing={4}>
          <HStack>
            <FaFlask size={20} />
            <Heading size="md">Breakthrough Tracker</Heading>
          </HStack>
          <Spinner size="lg" />
          <Text color="gray.500">Loading breakthrough data...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack spacing={6} w="full" align="stretch">
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Total Breakthroughs</Text>
            <FaFlask color="gray" />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{breakthroughs.length}</Text>
          <Text fontSize="xs" color="gray.500">All time</Text>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Patentable</Text>
            <FaShieldAlt color="gray" />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">
            {breakthroughs.filter(bt => isPatentable(calculateNoveltyScore(bt))).length}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {breakthroughs.length > 0 
              ? `${((breakthroughs.filter(bt => isPatentable(calculateNoveltyScore(bt))).length / breakthroughs.length) * 100).toFixed(0)}% of total`
              : 'No data'
            }
          </Text>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Avg Novelty</Text>
            <FaStar color="gray" />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">
            {breakthroughs.length > 0 
              ? (breakthroughs.reduce((sum, bt) => sum + calculateNoveltyScore(bt), 0) / breakthroughs.length).toFixed(0)
              : 0
            }
          </Text>
          <Text fontSize="xs" color="gray.500">Score (70-100)</Text>
        </Box>
      </Grid>

      <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
        <Heading size="md" mb={4}>Discovery Probability Calculator</Heading>
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
          <VStack align="stretch" spacing={4}>
            <FormControl>
              <FormLabel>Compute Budget ($M)</FormLabel>
              <NumberInput 
                value={computeBudget / 1000000} 
                min={0.1}
                step={0.1}
                onChange={(_, val) => setComputeBudget(val * 1000000)}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>

            {activeProjects.length > 0 && (
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Active Projects</Text>
                <VStack align="stretch" spacing={2}>
                  {activeProjects.map((project) => {
                    const probability = calculateDiscoveryProbability(project);
                    return (
                      <Box 
                        key={project.id} 
                        p={3} 
                        borderWidth={1} 
                        borderRadius="md"
                        bg={selectedProject === project.id ? 'blue.50' : 'white'}
                        cursor="pointer"
                        onClick={() => setSelectedProject(project.id)}
                      >
                        <HStack justify="space-between" mb={2}>
                          <Text fontWeight="medium">{project.name}</Text>
                          <Badge colorScheme={probability >= 20 ? 'green' : 'gray'}>
                            {probability.toFixed(0)}% chance
                          </Badge>
                        </HStack>
                        <Progress value={probability} colorScheme="blue" size="sm" />
                        <HStack fontSize="xs" color="gray.600" mt={1}>
                          <Text>Level {project.complexity}</Text>
                          <Text>•</Text>
                          <Text>${((project.budget || 0) / 1000000).toFixed(1)}M budget</Text>
                        </HStack>
                        {selectedProject === project.id && (
                          <Button 
                            mt={2} 
                            size="sm" 
                            colorScheme="blue"
                            leftIcon={<FaFlask />}
                            onClick={() => handleAttemptDiscovery(project.id)}
                            w="full"
                          >
                            Attempt Discovery
                          </Button>
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
            )}
          </VStack>

          <VStack align="stretch" spacing={3}>
            <Text fontSize="sm" fontWeight="medium">Discovery Factors</Text>
            <Box p={3} borderWidth={1} borderRadius="md">
              <HStack justify="space-between">
                <Text fontSize="sm">Base Probability</Text>
                <Text fontSize="sm" fontWeight="bold">15%</Text>
              </HStack>
            </Box>
            <Box p={3} borderWidth={1} borderRadius="md">
              <HStack justify="space-between">
                <Text fontSize="sm">Complexity Bonus</Text>
                <Text fontSize="sm" fontWeight="bold">+3% per level</Text>
              </HStack>
            </Box>
            <Box p={3} borderWidth={1} borderRadius="md">
              <HStack justify="space-between">
                <Text fontSize="sm">Budget Bonus</Text>
                <Text fontSize="sm" fontWeight="bold">+5% if ≥ target</Text>
              </HStack>
            </Box>
            <Box p={3} bg="blue.50" borderRadius="md">
              <Text fontSize="xs" color="gray.600">
                Higher complexity projects and sufficient compute budgets increase discovery probability. 
                Level 5 projects with adequate funding can achieve up to 35% chance.
              </Text>
            </Box>
          </VStack>
        </Grid>
      </Box>

      {breakthroughs.length > 0 && (
        <>
          <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
            <Heading size="md" mb={4}>Breakthrough Timeline</Heading>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={breakthroughTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="count" stroke="#3b82f6" name="Cumulative Count" />
                <Line yAxisId="right" type="monotone" dataKey="novelty" stroke="#10b981" name="Novelty Score" />
              </LineChart>
            </ResponsiveContainer>
          </Box>

          <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
            <Heading size="md" mb={4}>Recent Breakthroughs</Heading>
            <VStack align="stretch" spacing={3}>
              {breakthroughs.slice(0, 5).map((bt, idx) => {
                const noveltyScore = calculateNoveltyScore(bt);
                const patentable = isPatentable(noveltyScore);
                return (
                  <Box key={idx} p={4} borderWidth={1} borderRadius="md">
                    <HStack justify="space-between" mb={2}>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold">{bt.name || 'Unnamed Breakthrough'}</Text>
                        <Text fontSize="sm" color="gray.600">{bt.description || 'No description'}</Text>
                      </VStack>
                      <VStack align="end" spacing={1}>
                        <Badge colorScheme={patentable ? 'green' : 'gray'}>
                          {patentable ? 'Patentable' : 'Not Patentable'}
                        </Badge>
                        <HStack fontSize="xs" color="gray.500">
                          <FaClock />
                          <Text>{new Date(bt.discoveryDate).toLocaleDateString()}</Text>
                        </HStack>
                      </VStack>
                    </HStack>

                    <Grid templateColumns="repeat(3, 1fr)" gap={3} mt={3}>
                      <Box>
                        <Text fontSize="xs" color="gray.500">Novelty Score</Text>
                        <HStack>
                          <Text fontSize="lg" fontWeight="bold">{noveltyScore.toFixed(0)}</Text>
                          <FaStar color={noveltyScore >= 80 ? 'gold' : 'gray'} size={14} />
                        </HStack>
                        <Progress value={noveltyScore} colorScheme={noveltyScore >= 75 ? 'green' : 'gray'} size="sm" />
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.500">Performance Gain</Text>
                        <Text fontSize="lg" fontWeight="bold">+{bt.performanceGain || 0}%</Text>
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.500">Efficiency Gain</Text>
                        <Text fontSize="lg" fontWeight="bold">+{bt.efficiencyGain || 0}%</Text>
                      </Box>
                    </Grid>
                  </Box>
                );
              })}
            </VStack>
          </Box>
        </>
      )}
    </VStack>
  );
}
