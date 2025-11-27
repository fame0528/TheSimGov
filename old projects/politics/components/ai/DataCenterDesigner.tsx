/**
 * @fileoverview DataCenterDesigner Component - Interactive data center design wizard
 * @module components/ai/DataCenterDesigner
 * @version 1.0.0
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Interactive wizard for designing AI data centers with Tier selection (I-IV),
 * cooling system configuration (Air/Liquid/Immersion), power infrastructure
 * setup (generators, UPS, redundancy), GPU cluster specification, and real-time
 * cost estimation with ROI calculator.
 * 
 * FEATURES:
 * - Tier certification selector with requirement tooltips
 * - Cooling system picker with PUE targets
 * - Power infrastructure configuration (generators, UPS, dual feeds, fuel)
 * - GPU cluster builder (A100-40GB/80GB, H100-80GB, B200-192GB)
 * - Real-time cost estimation (construction + equipment + compliance)
 * - 5-year ROI calculator with revenue/opex inputs
 * - Compliance certification tracker (SOC2, ISO27001, HIPAA, LEED, GDPR)
 * - Design validation (checks tier requirements before construction)
 * 
 * USAGE:
 * <DataCenterDesigner
 *   propertyId="64a1b2c3d4e5f6g7h8i9j0k1"
 *   onComplete={(design) => handleDesignComplete(design)}
 * />
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Select,
  NumberInput,
  NumberInputField,
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Badge,
  Divider,
  Tooltip,
  useToast,
  Card,
  CardBody,
} from '@chakra-ui/react';

/**
 * Tier certification levels
 */
const TIER_LEVELS = [
  { value: 'Tier I', uptime: '99.671%', redundancy: 'N', description: 'Basic capacity, no redundancy' },
  { value: 'Tier II', uptime: '99.741%', redundancy: 'N+1', description: 'Partial redundancy' },
  { value: 'Tier III', uptime: '99.982%', redundancy: 'N+1/2N', description: 'Concurrent maintainability' },
  { value: 'Tier IV', uptime: '99.995%', redundancy: '2N/2N+1', description: 'Fault tolerance' },
];

/**
 * Cooling system options with PUE targets
 */
const COOLING_TYPES = [
  { value: 'AirCooled', label: 'Air-Cooled (CRAC/CRAH)', pue: 1.6, costMultiplier: 1.0 },
  { value: 'LiquidCooled', label: 'Liquid-Cooled (Direct-to-Chip)', pue: 1.3, costMultiplier: 1.4 },
  { value: 'ImmersionCooled', label: 'Immersion-Cooled (Tanks)', pue: 1.1, costMultiplier: 1.8 },
];

/**
 * GPU cluster options with specifications
 */
const GPU_MODELS = [
  { value: 'A100-40GB', label: 'NVIDIA A100 (40GB)', powerPerGPU: 0.4, costPerGPU: 10000 },
  { value: 'A100-80GB', label: 'NVIDIA A100 (80GB)', powerPerGPU: 0.5, costPerGPU: 15000 },
  { value: 'H100-80GB', label: 'NVIDIA H100 (80GB)', powerPerGPU: 0.7, costPerGPU: 30000 },
  { value: 'B200-192GB', label: 'NVIDIA B200 (192GB)', powerPerGPU: 1.0, costPerGPU: 50000 },
];

/**
 * DataCenterDesigner Props
 */
interface DataCenterDesignerProps {
  propertyId: string;
  onComplete: (design: any) => void;
}

/**
 * DataCenterDesigner Component
 */
export default function DataCenterDesigner({ propertyId, onComplete }: DataCenterDesignerProps) {
  const toast = useToast();
  
  // Design state
  const [tierLevel, setTierLevel] = useState('Tier I');
  const [coolingType, setCoolingType] = useState('AirCooled');
  const [totalSqFt, setTotalSqFt] = useState(10000);
  const [whiteSpaceSqFt, setWhiteSpaceSqFt] = useState(6000);
  const [rackCount, setRackCount] = useState(100);
  const [rackCapacityKW, setRackCapacityKW] = useState(15);
  
  // Power infrastructure
  const [generatorCount, setGeneratorCount] = useState(1);
  const [generatorCapacityKW, setGeneratorCapacityKW] = useState(2000);
  const fuelType = 'Diesel';
  const fuelCapacityHours = 24;
  const [upsCount, setUpsCount] = useState(2);
  const upsCapacityKW = 1500;
  const [batteryRuntimeMinutes, setBatteryRuntimeMinutes] = useState(15);
  const [utilityFeeds, setUtilityFeeds] = useState(1);
  
  // GPU clusters
  const [gpuClusters, setGpuClusters] = useState<Array<{ model: string; count: number }>>([
    { model: 'H100-80GB', count: 256 },
  ]);
  
  // Certifications
  const certifications: string[] = [];
  
  // ROI inputs
  const [monthlyRevenue, setMonthlyRevenue] = useState(500000);
  const [monthlyOpex, setMonthlyOpex] = useState(150000);
  
  // Calculated values
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  
  /**
   * Calculate total build cost
   */
  useEffect(() => {
    const cooling = COOLING_TYPES.find((c) => c.value === coolingType);
    const baseCostPerSqFt = 450; // Base construction cost
    
    const constructionCost = totalSqFt * baseCostPerSqFt * (cooling?.costMultiplier || 1.0);
    
    const powerCost =
      generatorCount * generatorCapacityKW * 500 + // Generators: $500/kW
      upsCount * upsCapacityKW * 300; // UPS: $300/kW
    
    const gpuCost = gpuClusters.reduce((total, cluster) => {
      const model = GPU_MODELS.find((m) => m.value === cluster.model);
      return total + (model?.costPerGPU || 0) * cluster.count;
    }, 0);
    
    const complianceCost = certifications.length * 50000; // $50k per certification
    
    const total = constructionCost + powerCost + gpuCost + complianceCost;
    setEstimatedCost(total);
  }, [
    coolingType,
    totalSqFt,
    generatorCount,
    generatorCapacityKW,
    upsCount,
    upsCapacityKW,
    gpuClusters,
    certifications,
  ]);
  
  /**
   * Validate tier requirements
   */
  useEffect(() => {
    const issues: string[] = [];
    
    if (tierLevel === 'Tier II') {
      if (generatorCount < 1) issues.push('Tier II requires at least 1 backup generator');
      if (upsCount < 1) issues.push('Tier II requires at least 1 UPS system');
    }
    
    if (tierLevel === 'Tier III') {
      if (utilityFeeds < 2) issues.push('Tier III requires dual utility feeds');
      if (generatorCount < 1) issues.push('Tier III requires backup generators');
      if (batteryRuntimeMinutes < 10) issues.push('Tier III requires 10+ min UPS runtime');
    }
    
    if (tierLevel === 'Tier IV') {
      if (utilityFeeds < 2) issues.push('Tier IV requires dual utility feeds');
      if (generatorCount < 2) issues.push('Tier IV requires redundant generators');
      if (upsCount < 2) issues.push('Tier IV requires redundant UPS systems');
      if (batteryRuntimeMinutes < 15) issues.push('Tier IV requires 15+ min UPS runtime');
    }
    
    setValidationIssues(issues);
  }, [tierLevel, generatorCount, upsCount, utilityFeeds, batteryRuntimeMinutes]);
  
  /**
   * Calculate ROI
   */
  const calculateROI = () => {
    const annualRevenue = monthlyRevenue * 12;
    const annualOpex = monthlyOpex * 12;
    const annualProfit = annualRevenue - annualOpex;
    const paybackYears = estimatedCost / annualProfit;
    const fiveYearROI = ((annualProfit * 5 - estimatedCost) / estimatedCost) * 100;
    
    return { annualProfit, paybackYears, fiveYearROI };
  };
  
  /**
   * Handle design submission
   */
  const handleSubmit = () => {
    if (validationIssues.length > 0) {
      toast({
        title: 'Validation Failed',
        description: validationIssues[0],
        status: 'error',
        duration: 5000,
      });
      return;
    }
    
    const design = {
      propertyId,
      tierLevel,
      coolingType,
      totalSqFt,
      whiteSpaceSqFt,
      rackCount,
      rackCapacityKW,
      powerRedundancy: tierLevel === 'Tier IV' ? '2N+1' : tierLevel === 'Tier III' ? 'N+1' : 'N',
      generators: { count: generatorCount, capacityKW: generatorCapacityKW, fuelType, fuelCapacityHours },
      ups: { count: upsCount, capacityKW: upsCapacityKW, batteryRuntimeMinutes, technology: 'Lithium' },
      utilityFeeds,
      gpuClusters: gpuClusters.map((cluster) => {
        const model = GPU_MODELS.find((m) => m.value === cluster.model);
        return {
          model: cluster.model,
          count: cluster.count,
          rackCount: Math.ceil(cluster.count / 8), // 8 GPUs per rack typical
          powerDrawKW: cluster.count * (model?.powerPerGPU || 0.5),
          utilizationPercent: 0,
        };
      }),
      buildCost: estimatedCost,
      certifications: certifications.map((name) => ({
        name,
        issuer: 'Pending',
        issuedDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        certificationNumber: 'PENDING',
        status: 'Active',
      })),
    };
    
    onComplete(design);
  };
  
  const roi = calculateROI();
  const cooling = COOLING_TYPES.find((c) => c.value === coolingType);
  const totalGPUs = gpuClusters.reduce((sum, cluster) => sum + cluster.count, 0);
  const totalPowerKW = gpuClusters.reduce((sum, cluster) => {
    const model = GPU_MODELS.find((m) => m.value === cluster.model);
    return sum + cluster.count * (model?.powerPerGPU || 0.5);
  }, 0);
  
  return (
    <Box maxW="1200px" mx="auto" p={6}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">Data Center Designer</Heading>
        
        {/* Tier Selection */}
        <Card>
          <CardBody>
            <FormControl>
              <FormLabel>Tier Certification</FormLabel>
              <RadioGroup value={tierLevel} onChange={setTierLevel}>
                <Stack direction="column" spacing={3}>
                  {TIER_LEVELS.map((tier) => (
                    <Tooltip key={tier.value} label={tier.description} placement="right">
                      <HStack>
                        <Radio value={tier.value}>{tier.value}</Radio>
                        <Badge colorScheme="blue">{tier.uptime} uptime</Badge>
                        <Badge colorScheme="green">{tier.redundancy} redundancy</Badge>
                      </HStack>
                    </Tooltip>
                  ))}
                </Stack>
              </RadioGroup>
            </FormControl>
          </CardBody>
        </Card>
        
        {/* Physical Specs */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">Physical Specifications</Heading>
              
              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Total Area (sqft)</FormLabel>
                  <NumberInput value={totalSqFt} onChange={(_, val) => setTotalSqFt(val)} min={5000} max={500000}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                
                <FormControl>
                  <FormLabel>White Space (sqft)</FormLabel>
                  <NumberInput value={whiteSpaceSqFt} onChange={(_, val) => setWhiteSpaceSqFt(val)} min={2000} max={totalSqFt}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </HStack>
              
              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Rack Count</FormLabel>
                  <NumberInput value={rackCount} onChange={(_, val) => setRackCount(val)} min={10} max={5000}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Rack Capacity (kW)</FormLabel>
                  <NumberInput value={rackCapacityKW} onChange={(_, val) => setRackCapacityKW(val)} min={5} max={50}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
        
        {/* Cooling System */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">Cooling System</Heading>
              
              <FormControl>
                <FormLabel>Cooling Technology</FormLabel>
                <RadioGroup value={coolingType} onChange={setCoolingType}>
                  <Stack direction="column" spacing={3}>
                    {COOLING_TYPES.map((type) => (
                      <HStack key={type.value}>
                        <Radio value={type.value}>{type.label}</Radio>
                        <Badge colorScheme="purple">PUE {type.pue}</Badge>
                        <Badge colorScheme="orange">Cost: {(type.costMultiplier * 100).toFixed(0)}%</Badge>
                      </HStack>
                    ))}
                  </Stack>
                </RadioGroup>
              </FormControl>
              
              <Text fontSize="sm" color="gray.600">
                Target PUE: {cooling?.pue || 1.6} (Power Usage Effectiveness)
              </Text>
            </VStack>
          </CardBody>
        </Card>
        
        {/* Power Infrastructure */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">Power Infrastructure</Heading>
              
              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Generators</FormLabel>
                  <NumberInput value={generatorCount} onChange={(_, val) => setGeneratorCount(val)} min={0} max={10}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Generator Capacity (kW)</FormLabel>
                  <NumberInput value={generatorCapacityKW} onChange={(_, val) => setGeneratorCapacityKW(val)} min={500} max={10000}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </HStack>
              
              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>UPS Units</FormLabel>
                  <NumberInput value={upsCount} onChange={(_, val) => setUpsCount(val)} min={1} max={10}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Battery Runtime (min)</FormLabel>
                  <NumberInput value={batteryRuntimeMinutes} onChange={(_, val) => setBatteryRuntimeMinutes(val)} min={5} max={60}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </HStack>
              
              <FormControl>
                <FormLabel>Utility Feeds</FormLabel>
                <NumberInput value={utilityFeeds} onChange={(_, val) => setUtilityFeeds(val)} min={1} max={4}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>
        
        {/* GPU Clusters */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">GPU Clusters</Heading>
              
              <Text fontSize="sm">Total GPUs: {totalGPUs} | Total Power: {totalPowerKW.toFixed(1)} kW</Text>
              
              {gpuClusters.map((cluster, idx) => (
                <HStack key={idx} spacing={4}>
                  <FormControl flex={2}>
                    <FormLabel>GPU Model</FormLabel>
                    <Select
                      value={cluster.model}
                      onChange={(e) => {
                        const updated = [...gpuClusters];
                        updated[idx].model = e.target.value;
                        setGpuClusters(updated);
                      }}
                    >
                      {GPU_MODELS.map((model) => (
                        <option key={model.value} value={model.value}>
                          {model.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl flex={1}>
                    <FormLabel>Count</FormLabel>
                    <NumberInput
                      value={cluster.count}
                      onChange={(_, val) => {
                        const updated = [...gpuClusters];
                        updated[idx].count = val;
                        setGpuClusters(updated);
                      }}
                      min={1}
                      max={10000}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </HStack>
              ))}
            </VStack>
          </CardBody>
        </Card>
        
        {/* Cost Estimation */}
        <Card bg="blue.50">
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">Cost Estimation</Heading>
              
              <HStack justify="space-between">
                <Text fontWeight="bold">Total Build Cost:</Text>
                <Text fontSize="2xl" color="blue.600">
                  ${(estimatedCost / 1_000_000).toFixed(2)}M
                </Text>
              </HStack>
              
              <Divider />
              
              <Heading size="sm">5-Year ROI Projection</Heading>
              
              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Monthly Revenue</FormLabel>
                  <NumberInput value={monthlyRevenue} onChange={(_, val) => setMonthlyRevenue(val)} min={0}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Monthly OpEx</FormLabel>
                  <NumberInput value={monthlyOpex} onChange={(_, val) => setMonthlyOpex(val)} min={0}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </HStack>
              
              <HStack justify="space-between">
                <Text>Annual Profit:</Text>
                <Text fontWeight="bold">${(roi.annualProfit / 1_000_000).toFixed(2)}M</Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text>Payback Period:</Text>
                <Text fontWeight="bold">{roi.paybackYears.toFixed(1)} years</Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text>5-Year ROI:</Text>
                <Text fontWeight="bold" color={roi.fiveYearROI > 0 ? 'green.600' : 'red.600'}>
                  {roi.fiveYearROI.toFixed(1)}%
                </Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
        
        {/* Validation Issues */}
        {validationIssues.length > 0 && (
          <Card bg="red.50" borderColor="red.300" borderWidth={2}>
            <CardBody>
              <VStack align="stretch" spacing={2}>
                <Heading size="sm" color="red.600">
                  Validation Issues
                </Heading>
                {validationIssues.map((issue, idx) => (
                  <Text key={idx} fontSize="sm" color="red.700">
                    • {issue}
                  </Text>
                ))}
              </VStack>
            </CardBody>
          </Card>
        )}
        
        {/* Submit */}
        <Button
          colorScheme="blue"
          size="lg"
          onClick={handleSubmit}
          isDisabled={validationIssues.length > 0}
        >
          Complete Design (${(estimatedCost / 1_000_000).toFixed(2)}M)
        </Button>
      </VStack>
    </Box>
  );
}
