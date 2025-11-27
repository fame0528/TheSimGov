/**
 * @file src/components/software/AIResearchDashboard.tsx
 * @description Comprehensive AI research project tracking with models, experiments, and talent
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
} from '@chakra-ui/react';
import { FaBrain, FaFlask, FaUsers, FaDollarSign } from 'react-icons/fa';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AIResearchDashboardProps {
  companyId: string;
}

export default function AIResearchDashboard({ companyId }: AIResearchDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [researchers, setResearchers] = useState<any[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [activeProjects, setActiveProjects] = useState(0);

  useEffect(() => {
    loadResearchData();
  }, [companyId]);

  const loadResearchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, modelsRes, experimentsRes, talentRes] = await Promise.all([
        fetch(`/api/ai/research/projects?companyId=${companyId}`),
        fetch(`/api/ai/research/models?companyId=${companyId}`),
        fetch(`/api/ai/research/experiments?companyId=${companyId}`),
        fetch(`/api/employees?companyId=${companyId}&department=AI Research`)
      ]);

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
        setActiveProjects(data.activeCount || 0);
        const budget = data.projects?.reduce((sum: number, p: any) => sum + (p.budget || 0), 0) || 0;
        setTotalBudget(budget);
      }

      if (modelsRes.ok) {
        const data = await modelsRes.json();
        setModels(data.models || []);
      }

      if (experimentsRes.ok) {
        const data = await experimentsRes.json();
        setExperiments(data.experiments || []);
      }

      if (talentRes.ok) {
        const data = await talentRes.json();
        setResearchers(data.employees || []);
      }
    } catch (error) {
      console.error('Error loading AI research data:', error);
    } finally {
      setLoading(false);
    }
  };

  const budgetByComplexity = [
    { name: 'Level 1', budget: projects.filter(p => p.complexity === 1).reduce((s, p) => s + (p.budget || 0), 0) / 1000000 },
    { name: 'Level 2', budget: projects.filter(p => p.complexity === 2).reduce((s, p) => s + (p.budget || 0), 0) / 1000000 },
    { name: 'Level 3', budget: projects.filter(p => p.complexity === 3).reduce((s, p) => s + (p.budget || 0), 0) / 1000000 },
    { name: 'Level 4', budget: projects.filter(p => p.complexity === 4).reduce((s, p) => s + (p.budget || 0), 0) / 1000000 },
    { name: 'Level 5', budget: projects.filter(p => p.complexity === 5).reduce((s, p) => s + (p.budget || 0), 0) / 1000000 },
  ];

  const projectTypeData = [
    { name: 'NLP', value: projects.filter(p => p.researchType === 'Natural Language Processing').length },
    { name: 'Computer Vision', value: projects.filter(p => p.researchType === 'Computer Vision').length },
    { name: 'Reinforcement Learning', value: projects.filter(p => p.researchType === 'Reinforcement Learning').length },
    { name: 'Generative AI', value: projects.filter(p => p.researchType === 'Generative AI').length },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  const talentByTier = researchers.reduce((acc: any, r: any) => {
    const tier = r.skillLevel || 'Junior';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <Box w="full" p={6} borderWidth={1} borderRadius="lg" bg="white">
        <VStack spacing={4}>
          <HStack>
            <FaBrain size={20} />
            <Heading size="md">AI Research Dashboard</Heading>
          </HStack>
          <Spinner size="lg" />
          <Text color="gray.500">Loading research data...</Text>
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
            <FaBrain color="gray" />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{activeProjects}</Text>
          <Text fontSize="xs" color="gray.500">{projects.length} total</Text>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Total Budget</Text>
            <FaDollarSign color="gray" />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">${(totalBudget / 1000000).toFixed(1)}M</Text>
          <Text fontSize="xs" color="gray.500">Allocated</Text>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">AI Models</Text>
            <FaFlask color="gray" />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{models.length}</Text>
          <Text fontSize="xs" color="gray.500">{experiments.length} experiments</Text>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Researchers</Text>
            <FaUsers color="gray" />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{researchers.length}</Text>
          <Text fontSize="xs" color="gray.500">Team size</Text>
        </Box>
      </Grid>

      <HStack spacing={2} mb={4}>
        <Button 
          onClick={() => setActiveTab('projects')} 
          colorScheme={activeTab === 'projects' ? 'blue' : 'gray'}
          size="sm"
        >
          Projects
        </Button>
        <Button 
          onClick={() => setActiveTab('models')} 
          colorScheme={activeTab === 'models' ? 'blue' : 'gray'}
          size="sm"
        >
          Models
        </Button>
        <Button 
          onClick={() => setActiveTab('experiments')} 
          colorScheme={activeTab === 'experiments' ? 'blue' : 'gray'}
          size="sm"
        >
          Experiments
        </Button>
        <Button 
          onClick={() => setActiveTab('talent')} 
          colorScheme={activeTab === 'talent' ? 'blue' : 'gray'}
          size="sm"
        >
          Talent
        </Button>
      </HStack>

      {activeTab === 'projects' && (
        <>
          <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
            <Heading size="md" mb={4}>Active Research Projects</Heading>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Project Name</Th>
                  <Th>Type</Th>
                  <Th>Complexity</Th>
                  <Th isNumeric>Budget ($M)</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {projects.map((project, idx) => (
                  <Tr key={idx}>
                    <Td>{project.name || 'Unnamed Project'}</Td>
                    <Td>{project.researchType || 'Unknown'}</Td>
                    <Td>
                      <Badge colorScheme={project.complexity >= 4 ? 'purple' : 'blue'}>
                        Level {project.complexity}
                      </Badge>
                    </Td>
                    <Td isNumeric>${((project.budget || 0) / 1000000).toFixed(2)}</Td>
                    <Td>
                      <Badge colorScheme={project.status === 'Active' ? 'green' : 'gray'}>
                        {project.status || 'Unknown'}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>

          <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
            <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
              <Heading size="md" mb={4}>Budget by Complexity</Heading>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetByComplexity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}M`} />
                  <Bar dataKey="budget" fill="#3b82f6" name="Budget ($M)" />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
              <Heading size="md" mb={4}>Project Type Distribution</Heading>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={projectTypeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {projectTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
        </>
      )}

      {activeTab === 'models' && (
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <Heading size="md" mb={4}>AI Models in Development</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Model Name</Th>
                <Th>Architecture</Th>
                <Th isNumeric>Parameters (M)</Th>
                <Th isNumeric>Accuracy (%)</Th>
                <Th isNumeric>Training Cost ($K)</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {models.map((model, idx) => (
                <Tr key={idx}>
                  <Td>{model.name || 'Unnamed Model'}</Td>
                  <Td>{model.architecture || 'Unknown'}</Td>
                  <Td isNumeric>{((model.parameters || 0) / 1000000).toFixed(0)}</Td>
                  <Td isNumeric>{(model.accuracy || 0).toFixed(1)}</Td>
                  <Td isNumeric>${((model.trainingCost || 0) / 1000).toFixed(0)}</Td>
                  <Td>
                    <Badge colorScheme={model.status === 'Training' ? 'blue' : 'green'}>
                      {model.status || 'Unknown'}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {activeTab === 'experiments' && (
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <Heading size="md" mb={4}>Recent Experiments</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Experiment ID</Th>
                <Th>Model</Th>
                <Th isNumeric>Val Accuracy (%)</Th>
                <Th isNumeric>Training Loss</Th>
                <Th isNumeric>Compute Cost ($K)</Th>
                <Th>Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {experiments.map((exp, idx) => (
                <Tr key={idx}>
                  <Td>{exp.experimentId || `EXP-${idx + 1}`}</Td>
                  <Td>{exp.modelName || 'Unknown'}</Td>
                  <Td isNumeric>{(exp.validationAccuracy || 0).toFixed(2)}</Td>
                  <Td isNumeric>{(exp.trainingLoss || 0).toFixed(4)}</Td>
                  <Td isNumeric>${((exp.computeCost || 0) / 1000).toFixed(1)}</Td>
                  <Td>{exp.date || 'Unknown'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {activeTab === 'talent' && (
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <Heading size="md" mb={4}>Research Talent Pipeline</Heading>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4} mb={6}>
            <Box p={4} borderWidth={1} borderRadius="md">
              <Text fontSize="sm" color="gray.500">Junior Researchers</Text>
              <Text fontSize="2xl" fontWeight="bold">{talentByTier['Junior'] || 0}</Text>
              <Badge colorScheme="blue">Entry Level</Badge>
            </Box>
            <Box p={4} borderWidth={1} borderRadius="md">
              <Text fontSize="sm" color="gray.500">Senior Researchers</Text>
              <Text fontSize="2xl" fontWeight="bold">{talentByTier['Senior'] || 0}</Text>
              <Badge colorScheme="green">Experienced</Badge>
            </Box>
            <Box p={4} borderWidth={1} borderRadius="md">
              <Text fontSize="sm" color="gray.500">Principal Researchers</Text>
              <Text fontSize="2xl" fontWeight="bold">{talentByTier['Principal'] || 0}</Text>
              <Badge colorScheme="purple">Expert</Badge>
            </Box>
          </Grid>

          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Tier</Th>
                <Th>Specialization</Th>
                <Th>Projects</Th>
                <Th isNumeric>Salary ($K)</Th>
              </Tr>
            </Thead>
            <Tbody>
              {researchers.map((researcher, idx) => (
                <Tr key={idx}>
                  <Td>{researcher.name || 'Unknown'}</Td>
                  <Td>
                    <Badge 
                      colorScheme={
                        researcher.skillLevel === 'Principal' ? 'purple' : 
                        researcher.skillLevel === 'Senior' ? 'green' : 'blue'
                      }
                    >
                      {researcher.skillLevel || 'Junior'}
                    </Badge>
                  </Td>
                  <Td>{researcher.specialization || 'General'}</Td>
                  <Td>{researcher.activeProjects || 0}</Td>
                  <Td isNumeric>${((researcher.salary || 0) / 1000).toFixed(0)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </VStack>
  );
}
