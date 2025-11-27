/**
 * @file app/(game)/ai-companies/[id]/page.tsx
 * @description AI Company detail with models management
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import {
  Box, Heading, Text, VStack, HStack, Badge, Button, Input, Select, NumberInput, NumberInputField,
  Spinner, useToast, Divider
} from '@chakra-ui/react';
import TopMenu from '@/components/layout/TopMenu';
import StatusBar from '@/components/layout/StatusBar';
import { useSession } from 'next-auth/react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AICompanyDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const toast = useToast();
  const { data: session, status } = useSession();
  const { data, error, mutate, isLoading } = useSWR(id ? `/api/ai/companies/${id}` : null, fetcher);

  // New model form state
  const [name, setName] = useState('');
  const [architecture, setArchitecture] = useState<'Transformer' | 'CNN' | 'RNN' | 'Diffusion' | 'GAN'>('Transformer');
  const [size, setSize] = useState<'Small' | 'Medium' | 'Large'>('Small');
  const [parameters, setParameters] = useState<number>(7_000_000_000);
  const [dataset, setDataset] = useState('Common Crawl');
  const [datasetSize, setDatasetSize] = useState<number>(50);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect handled upstream, keep simple here
    }
  }, [status]);

  if (status === 'loading' || isLoading) return <Box minH="100vh" bg="night.500" display="flex" alignItems="center" justifyContent="center"><Spinner /></Box>;
  if (error) return <Box p={8}><Text color="red_cmyk.500">Failed to load company</Text></Box>;
  if (!data?.company) return null;

  const { company, models, aggregates } = data;

  const createModel = async () => {
    try {
      setCreating(true);
      const res = await fetch('/api/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company._id, name, architecture, size, parameters, dataset, datasetSize })
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to create model');
      toast({ title: 'Model created', status: 'success' });
      setName('');
      mutate();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, status: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const advanceTraining = async (modelId: string, inc = 5) => {
    const res = await fetch(`/api/ai/models/${modelId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'advanceTraining', progressIncrement: inc })
    });
    const payload = await res.json();
    if (!res.ok) {
      toast({ title: 'Training error', description: payload.error || 'Failed', status: 'error' });
    } else {
      mutate();
    }
  };

  const deployModel = async (modelId: string) => {
    const res = await fetch(`/api/ai/models/${modelId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deploy', deploy: true })
    });
    if (!res.ok) {
      const p = await res.json();
      toast({ title: 'Deploy error', description: p.error || 'Failed', status: 'error' });
    } else {
      toast({ title: 'Model deployed', status: 'success' });
      mutate();
    }
  };

  return (
    <Box minH="100vh" bg="night.500">
      <TopMenu user={session!.user} />
      <Box px={6} py={6} pb={20}>
        <VStack spacing={6} align="stretch" maxW="1040px" mx="auto">
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <HStack>
                <Heading color="white">{company.name}</Heading>
                <Badge colorScheme="blue">{company.industry}</Badge>
              </HStack>
              <HStack spacing={6}>
                <Text color="ash_gray.400">Cash: ${company.cash.toLocaleString()}</Text>
                <Text color="ash_gray.400">Employees: {company.employees}</Text>
                <Text color="ash_gray.400">Reputation: {company.reputation}</Text>
              </HStack>
            </VStack>
          </HStack>

          {/* AI Metrics Overview */}
          {aggregates && (
            <Box p={5} bg="night.400" borderRadius="xl" border="1px solid" borderColor="ash_gray.800">
              <Heading size="md" color="white" mb={4}>AI Metrics</Heading>
              <HStack spacing={8} wrap="wrap">
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="picton_blue.500">{aggregates.totalModels || 0}</Text>
                  <Text fontSize="sm" color="ash_gray.400">Total Models</Text>
                </VStack>
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="gold.500">{aggregates.trainingModels || 0}</Text>
                  <Text fontSize="sm" color="ash_gray.400">Training</Text>
                </VStack>
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="green.400">{aggregates.deployedModels || 0}</Text>
                  <Text fontSize="sm" color="ash_gray.400">Deployed</Text>
                </VStack>
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="white">${aggregates.averageTrainingCost?.toLocaleString() || 0}</Text>
                  <Text fontSize="sm" color="ash_gray.400">Avg Training Cost</Text>
                </VStack>
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="white">${aggregates.totalTrainingCost?.toLocaleString() || 0}</Text>
                  <Text fontSize="sm" color="ash_gray.400">Total Training Cost</Text>
                </VStack>
                {aggregates.bestModelAccuracy > 0 && (
                  <VStack align="start" spacing={0}>
                    <Text fontSize="2xl" fontWeight="bold" color="picton_blue.400">{(aggregates.bestModelAccuracy * 100).toFixed(1)}%</Text>
                    <Text fontSize="sm" color="ash_gray.400">Best Model: {aggregates.bestModelName}</Text>
                  </VStack>
                )}
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="white">{company.researchPoints || 0}</Text>
                  <Text fontSize="sm" color="ash_gray.400">Research Points</Text>
                </VStack>
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="white">#{company.industryRanking || 999}</Text>
                  <Text fontSize="sm" color="ash_gray.400">Industry Ranking</Text>
                </VStack>
              </HStack>
            </Box>
          )}

          <Divider borderColor="ash_gray.800" />

          {/* Create Model */}
          <Box p={5} bg="night.400" borderRadius="xl" border="1px solid" borderColor="ash_gray.800">
            <Heading size="md" color="white" mb={3}>Create AI Model</Heading>
            <HStack spacing={3} wrap="wrap">
              <Input placeholder="Model name" value={name} onChange={(e) => setName(e.target.value)} bg="night.300" color="white" />
              <Select value={architecture} onChange={(e) => setArchitecture(e.target.value as any)} bg="night.300" color="white">
                <option value="Transformer" style={{ backgroundColor: '#1a1a1a' }}>Transformer</option>
                <option value="CNN" style={{ backgroundColor: '#1a1a1a' }}>CNN</option>
                <option value="RNN" style={{ backgroundColor: '#1a1a1a' }}>RNN</option>
                <option value="Diffusion" style={{ backgroundColor: '#1a1a1a' }}>Diffusion</option>
                <option value="GAN" style={{ backgroundColor: '#1a1a1a' }}>GAN</option>
              </Select>
              <Select value={size} onChange={(e) => setSize(e.target.value as any)} bg="night.300" color="white">
                <option value="Small" style={{ backgroundColor: '#1a1a1a' }}>Small</option>
                <option value="Medium" style={{ backgroundColor: '#1a1a1a' }}>Medium</option>
                <option value="Large" style={{ backgroundColor: '#1a1a1a' }}>Large</option>
              </Select>
              <NumberInput value={parameters} min={1_000_000} onChange={(_, v) => setParameters(v)}>
                <NumberInputField bg="night.300" color="white" />
              </NumberInput>
              <Input placeholder="Dataset" value={dataset} onChange={(e) => setDataset(e.target.value)} bg="night.300" color="white" />
              <NumberInput value={datasetSize} min={0} onChange={(_, v) => setDatasetSize(v)}>
                <NumberInputField bg="night.300" color="white" />
              </NumberInput>
              <Button isLoading={creating} onClick={createModel} bg="picton_blue.500" color="white" _hover={{ bg: 'picton_blue.600' }}>Create</Button>
            </HStack>
          </Box>

          {/* Models list */}
          <VStack spacing={4} align="stretch">
            {models?.map((m: any) => (
              <Box key={m._id} p={5} bg="night.400" borderRadius="xl" border="1px solid" borderColor="ash_gray.800">
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Heading size="sm" color="white">{m.name}</Heading>
                      <Badge>{m.architecture}</Badge>
                      <Badge>{m.size}</Badge>
                      <Badge colorScheme={m.status === 'Deployed' ? 'green' : m.status === 'Completed' ? 'yellow' : 'blue'}>{m.status}</Badge>
                    </HStack>
                    <HStack spacing={6}>
                      <Text color="ash_gray.400">Progress: {m.trainingProgress}%</Text>
                      <Text color="ash_gray.400">Training Cost: ${m.trainingCost?.toLocaleString?.() || 0}</Text>
                      <Text color="ash_gray.400">Parameters: {(m.parameters / 1_000_000_000).toFixed(1)}B</Text>
                    </HStack>
                    {m.status === 'Deployed' && m.apiEndpoint && (
                      <Text fontSize="sm" color="picton_blue.400" fontFamily="monospace">{m.apiEndpoint}</Text>
                    )}
                    {m.benchmarkScores && (m.benchmarkScores.accuracy > 0 || m.status === 'Completed' || m.status === 'Deployed') && (
                      <HStack spacing={4} pt={1}>
                        <Text fontSize="xs" color="green.400">Accuracy: {(m.benchmarkScores.accuracy * 100).toFixed(2)}%</Text>
                        <Text fontSize="xs" color="ash_gray.400">Perplexity: {m.benchmarkScores.perplexity?.toFixed(2) || 0}</Text>
                        <Text fontSize="xs" color="ash_gray.400">F1: {m.benchmarkScores.f1Score?.toFixed(3) || 0}</Text>
                        <Text fontSize="xs" color="ash_gray.400">Latency: {m.benchmarkScores.inferenceLatency?.toFixed(0) || 0}ms</Text>
                      </HStack>
                    )}
                  </VStack>
                  <HStack>
                    {m.status === 'Training' && (
                      <Button size="sm" onClick={() => advanceTraining(m._id, 5)} bg="gold.500" _hover={{ bg: 'gold.600' }}>Advance 5%</Button>
                    )}
                    {m.status === 'Completed' && (
                      <Button size="sm" onClick={() => deployModel(m._id)} bg="picton_blue.500" color="white">Deploy</Button>
                    )}
                  </HStack>
                </HStack>
              </Box>
            ))}
            {models?.length === 0 && (
              <Text color="ash_gray.400">No models yet. Create your first model above.</Text>
            )}
          </VStack>
        </VStack>
      </Box>
      <StatusBar />
    </Box>
  );
}
