/**
 * @file components/ai/ManufacturingDashboard.tsx
 * @description Hardware manufacturing operations dashboard
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Comprehensive dashboard for Hardware manufacturing companies showing:
 * - Production capacity utilization and forecasts
 * - Supply chain status with lead times
 * - Inventory levels and carrying costs
 * - Quality control metrics with defect tracking
 * - Bill of Materials (BOM) cost breakdown
 * - Manufacturing cost per unit trends
 * - Warranty reserve tracking
 * 
 * Used for Hardware subcategory companies (Repair Shop → Global Hardware Leader).
 * 
 * @implementation FID-20251115-AI-003
 */

'use client';

import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Text,
  Heading,
  Badge,
  VStack,
  HStack,
  Divider,
  Card,
  CardBody,
  Alert,
  AlertIcon,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react';
import {
  calculateManufacturingCost,
  estimateSupplyChainLead,
  calculateInventoryCarryCost,
  validateQualityControl,
  calculateBOM,
  estimateProductionCapacity,
  calculateWarrantyReserve
} from '@/lib/utils/ai/hardwareIndustry';

/**
 * Hardware company data interface
 */
export interface HardwareCompanyData {
  // Manufacturing costs
  materialCost: number;
  laborCost: number;
  overheadAllocation: number;
  qualityControlCost: number;

  // Bill of Materials
  bomComponents: Array<{
    name: string;
    quantity: number;
    unitCost: number;
  }>;

  // Production facility
  facility: {
    shiftsPerDay: 1 | 2 | 3;
    workersPerShift: number;
    unitsPerWorkerPerHour: number;
    operatingHoursPerShift: number;
    efficiencyRate: number;
  };
  workingDaysPerMonth: number;

  // Supply chain
  suppliers: Array<{
    supplier: string;
    leadDays: number;
    international: boolean;
  }>;
  supplyChainComplexity: number; // 1.0-2.0

  // Inventory
  inventory: Array<{
    componentName: string;
    unitsOnHand: number;
    unitCost: number;
    monthsInStorage: number;
  }>;

  // Quality Control
  qualityControl: {
    unitsInspected: number;
    unitsDefective: number;
    acceptableDefectRate: number;
  };

  // Warranty
  warranty: {
    unitsSold: number;
    historicalFailureRate: number;
    averageRepairCost: number;
    warrantyPeriodMonths: number;
  };
}

/**
 * Props for ManufacturingDashboard component
 */
export interface ManufacturingDashboardProps {
  companyData: HardwareCompanyData;
  companyName?: string;
  showSupplyChain?: boolean;
  showInventory?: boolean;
  showWarranty?: boolean;
}

/**
 * Manufacturing Dashboard Component
 * 
 * @description Displays comprehensive hardware manufacturing metrics with
 * operational insights and production efficiency tracking.
 * 
 * @example
 * <ManufacturingDashboard 
 *   companyData={companyData} 
 *   companyName="HardwareCo Inc"
 *   showSupplyChain={true}
 *   showInventory={true}
 *   showWarranty={true}
 * />
 */
export default function ManufacturingDashboard({
  companyData,
  companyName = 'Your Company',
  showSupplyChain = true,
  showInventory = true,
  showWarranty = true
}: ManufacturingDashboardProps) {
  // Calculate manufacturing cost
  const mfgCost = calculateManufacturingCost(
    companyData.materialCost,
    companyData.laborCost,
    companyData.overheadAllocation,
    companyData.qualityControlCost
  );

  // Calculate BOM
  const bom = calculateBOM(companyData.bomComponents);

  // Calculate production capacity
  const capacity = estimateProductionCapacity(
    companyData.facility,
    companyData.workingDaysPerMonth
  );

  // Supply chain analysis
  const supplyChain = showSupplyChain 
    ? estimateSupplyChainLead(
        companyData.suppliers,
        companyData.supplyChainComplexity
      )
    : null;

  // Inventory carrying costs
  const inventoryCosts = showInventory && companyData.inventory.length > 0
    ? companyData.inventory.map(item =>
        calculateInventoryCarryCost(
          item.unitsOnHand,
          item.unitCost,
          item.monthsInStorage
        )
      )
    : [];

  const totalInventoryCarryingCost = inventoryCosts.reduce(
    (sum, cost) => sum + cost.totalCost,
    0
  );

  const totalInventoryValue = inventoryCosts.reduce(
    (sum, cost) => sum + cost.inventoryValue,
    0
  );

  // Quality control validation
  const qc = validateQualityControl(
    companyData.qualityControl.unitsDefective,
    companyData.qualityControl.unitsInspected,
    companyData.qualityControl.acceptableDefectRate
  );

  // Warranty reserve
  const warranty = showWarranty
    ? calculateWarrantyReserve(
        companyData.warranty.unitsSold,
        companyData.warranty.historicalFailureRate,
        companyData.warranty.averageRepairCost,
        companyData.warranty.warrantyPeriodMonths
      )
    : null;

  // Helper: Format currency
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(2)}`;
  };

  // Helper: Get QC severity color
  const getQCColor = (severity: string): string => {
    switch (severity) {
      case 'Excellent': return 'green';
      case 'Good': return 'blue';
      case 'Acceptable': return 'yellow';
      case 'Warning': return 'orange';
      case 'Critical': return 'red';
      default: return 'gray';
    }
  };

  // Helper: Get warranty severity color
  const getWarrantySeverityColor = (severity: string): string => {
    switch (severity) {
      case 'Low': return 'green';
      case 'Moderate': return 'yellow';
      case 'High': return 'orange';
      case 'Critical': return 'red';
      default: return 'gray';
    }
  };

  return (
    <VStack spacing={6} align="stretch" w="full">
      {/* Header */}
      <HStack justify="space-between" align="center">
        <Heading size="lg">{companyName} - Manufacturing Operations</Heading>
        <Badge
          colorScheme={qc.passed ? 'green' : 'red'}
          fontSize="lg"
          px={4}
          py={2}
          borderRadius="md"
        >
          QC Status: {qc.passed ? 'PASSED' : 'FAILED'}
        </Badge>
      </HStack>

      <Divider />

      {/* Quality Control Alerts */}
      {!qc.passed && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertDescription>
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold">Quality Control FAILED</Text>
              {qc.recommendations.map((rec, idx) => (
                <Text key={idx} fontSize="sm">• {rec}</Text>
              ))}
            </VStack>
          </AlertDescription>
        </Alert>
      )}

      {/* Manufacturing Cost Breakdown */}
      <Card>
        <CardBody>
          <Heading size="md" mb={4}>Manufacturing Cost per Unit</Heading>
          <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4}>
            <Stat>
              <StatLabel>Total Cost</StatLabel>
              <StatNumber fontSize="2xl">{formatCurrency(mfgCost.totalCost)}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Materials</StatLabel>
              <StatNumber>{formatCurrency(mfgCost.breakdown.materials)}</StatNumber>
              <StatHelpText>{mfgCost.costPercentages.materials.toFixed(1)}%</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Labor</StatLabel>
              <StatNumber>{formatCurrency(mfgCost.breakdown.labor)}</StatNumber>
              <StatHelpText>{mfgCost.costPercentages.labor.toFixed(1)}%</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Overhead</StatLabel>
              <StatNumber>{formatCurrency(mfgCost.breakdown.overhead)}</StatNumber>
              <StatHelpText>{mfgCost.costPercentages.overhead.toFixed(1)}%</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Quality Control</StatLabel>
              <StatNumber>{formatCurrency(mfgCost.breakdown.qualityControl)}</StatNumber>
              <StatHelpText>{mfgCost.costPercentages.qualityControl.toFixed(1)}%</StatHelpText>
            </Stat>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Production Capacity */}
      <Card>
        <CardBody>
          <Heading size="md" mb={4}>Production Capacity</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Stat>
              <StatLabel>Monthly Capacity</StatLabel>
              <StatNumber>{capacity.monthlyCapacity.toLocaleString()} units</StatNumber>
              <StatHelpText>
                {companyData.facility.shiftsPerDay} shifts, {companyData.facility.efficiencyRate * 100}% efficiency
              </StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Daily Capacity</StatLabel>
              <StatNumber>{capacity.dailyCapacity.toLocaleString()} units</StatNumber>
              <StatHelpText>{companyData.workingDaysPerMonth} working days/month</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Hourly Rate</StatLabel>
              <StatNumber>{capacity.hourlyCapacity.toLocaleString()} units</StatNumber>
              <StatHelpText>{companyData.facility.workersPerShift} workers/shift</StatHelpText>
            </Stat>
          </SimpleGrid>

          <Divider my={4} />

          <Box>
            <Text fontWeight="medium" mb={2}>Capacity Utilization Scenarios</Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Box p={3} bg="green.50" borderRadius="md" borderWidth="1px" borderColor="green.200">
                <Text fontSize="sm" color="gray.600">50% Utilization</Text>
                <Text fontSize="xl" fontWeight="bold" color="green.700">
                  {capacity.utilizationScenarios.at50Percent.toLocaleString()} units/mo
                </Text>
              </Box>
              <Box p={3} bg="yellow.50" borderRadius="md" borderWidth="1px" borderColor="yellow.200">
                <Text fontSize="sm" color="gray.600">75% Utilization</Text>
                <Text fontSize="xl" fontWeight="bold" color="yellow.700">
                  {capacity.utilizationScenarios.at75Percent.toLocaleString()} units/mo
                </Text>
              </Box>
              <Box p={3} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
                <Text fontSize="sm" color="gray.600">100% Utilization</Text>
                <Text fontSize="xl" fontWeight="bold" color="blue.700">
                  {capacity.utilizationScenarios.at100Percent.toLocaleString()} units/mo
                </Text>
              </Box>
            </SimpleGrid>
          </Box>
        </CardBody>
      </Card>

      {/* Supply Chain */}
      {supplyChain && showSupplyChain && (
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Supply Chain Lead Times</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>Total Lead Time</Text>
                <Text fontSize="3xl" fontWeight="bold">{supplyChain.totalDays} days</Text>
                <VStack align="start" mt={3} spacing={1}>
                  <Text fontSize="sm">• Supplier lead: {supplyChain.breakdown.longestSupplierLead} days</Text>
                  <Text fontSize="sm">• Customs clearance: {supplyChain.breakdown.customsClearance} days</Text>
                  <Text fontSize="sm">• Buffer time: {supplyChain.breakdown.bufferDays} days</Text>
                  <Text fontSize="sm">• Complexity adjustment: {supplyChain.breakdown.complexityAdjustment} days</Text>
                </VStack>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>Critical Path Suppliers</Text>
                <VStack align="start" spacing={2}>
                  {supplyChain.criticalPath.map((supplier, idx) => (
                    <Badge key={idx} colorScheme="orange" px={2} py={1}>
                      {supplier}
                    </Badge>
                  ))}
                </VStack>
                <Divider my={3} />
                <Text fontSize="xs" color="gray.500" mb={2}>Recommendations:</Text>
                <VStack align="start" spacing={1}>
                  {supplyChain.recommendations.map((rec, idx) => (
                    <Text key={idx} fontSize="xs">• {rec}</Text>
                  ))}
                </VStack>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>
      )}

      {/* Bill of Materials */}
      <Card>
        <CardBody>
          <Heading size="md" mb={4}>Bill of Materials (BOM)</Heading>
          <HStack justify="space-between" mb={4}>
            <Stat>
              <StatLabel>Total BOM Cost</StatLabel>
              <StatNumber>{formatCurrency(bom.totalCost)}</StatNumber>
              <StatHelpText>
                Raw materials: {formatCurrency(bom.rawMaterialCost)} + Markup: {formatCurrency(bom.markup)}
              </StatHelpText>
            </Stat>
          </HStack>

          <TableContainer>
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Component</Th>
                  <Th isNumeric>Quantity</Th>
                  <Th isNumeric>Unit Cost</Th>
                  <Th isNumeric>Line Cost</Th>
                  <Th isNumeric>% of Total</Th>
                </Tr>
              </Thead>
              <Tbody>
                {bom.components
                  .sort((a, b) => b.lineCost - a.lineCost)
                  .map((comp, idx) => (
                    <Tr key={idx}>
                      <Td fontWeight="medium">{comp.name}</Td>
                      <Td isNumeric>{comp.quantity}</Td>
                      <Td isNumeric>{formatCurrency(comp.unitCost)}</Td>
                      <Td isNumeric fontWeight="bold">{formatCurrency(comp.lineCost)}</Td>
                      <Td isNumeric>
                        <Badge colorScheme={comp.percentOfTotal > 20 ? 'red' : 'gray'}>
                          {comp.percentOfTotal.toFixed(1)}%
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>

      {/* Inventory Carrying Costs */}
      {showInventory && inventoryCosts.length > 0 && (
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Inventory Carrying Costs</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={4}>
              <Stat>
                <StatLabel>Total Inventory Value</StatLabel>
                <StatNumber>{formatCurrency(totalInventoryValue)}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Total Carrying Cost</StatLabel>
                <StatNumber>{formatCurrency(totalInventoryCarryingCost)}</StatNumber>
                <StatHelpText>Storage + Insurance + Obsolescence + Opportunity</StatHelpText>
              </Stat>
            </SimpleGrid>

            <TableContainer>
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Component</Th>
                    <Th isNumeric>Units</Th>
                    <Th isNumeric>Value</Th>
                    <Th isNumeric>Months Held</Th>
                    <Th isNumeric>Carrying Cost</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {companyData.inventory.map((item, idx) => {
                    const cost = inventoryCosts[idx];
                    return (
                      <Tr key={idx}>
                        <Td fontWeight="medium">{item.componentName}</Td>
                        <Td isNumeric>{item.unitsOnHand.toLocaleString()}</Td>
                        <Td isNumeric>{formatCurrency(cost.inventoryValue)}</Td>
                        <Td isNumeric>
                          <Badge colorScheme={item.monthsInStorage > 6 ? 'red' : 'green'}>
                            {item.monthsInStorage}
                          </Badge>
                        </Td>
                        <Td isNumeric fontWeight="bold">{formatCurrency(cost.totalCost)}</Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>
      )}

      {/* Quality Control */}
      <Card>
        <CardBody>
          <Heading size="md" mb={4}>Quality Control</Heading>
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
            <Stat>
              <StatLabel>Defect Rate</StatLabel>
              <StatNumber>
                <Badge 
                  colorScheme={getQCColor(qc.severity)} 
                  fontSize="2xl"
                >
                  {qc.defectRatePercent.toFixed(2)}%
                </Badge>
              </StatNumber>
              <StatHelpText>{qc.severity}</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Units Inspected</StatLabel>
              <StatNumber>{qc.totalInspected.toLocaleString()}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Defective Units</StatLabel>
              <StatNumber>{qc.unitsDefective.toLocaleString()}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Acceptable Threshold</StatLabel>
              <StatNumber>{(qc.threshold * 100).toFixed(2)}%</StatNumber>
              <StatHelpText>
                {qc.passed ? 'Within limits ✓' : 'Exceeded ✗'}
              </StatHelpText>
            </Stat>
          </SimpleGrid>

          <Progress
            value={(qc.defectRate / qc.threshold) * 100}
            colorScheme={qc.passed ? 'green' : 'red'}
            size="lg"
            mt={4}
            borderRadius="md"
          />
          <Text fontSize="xs" color="gray.500" mt={1}>
            {qc.passed 
              ? `${((1 - qc.defectRate / qc.threshold) * 100).toFixed(1)}% below threshold`
              : `${((qc.defectRate / qc.threshold - 1) * 100).toFixed(1)}% over threshold`
            }
          </Text>
        </CardBody>
      </Card>

      {/* Warranty Reserve */}
      {warranty && showWarranty && (
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Warranty Reserve Fund</Heading>
            <Alert status={warranty.severity === 'Critical' ? 'error' : warranty.severity === 'High' ? 'warning' : 'info'} mb={4}>
              <AlertIcon />
              <AlertDescription>
                Warranty Severity: <strong>{warranty.severity}</strong>
                {warranty.severity === 'Critical' && ' - Immediate action required!'}
              </AlertDescription>
            </Alert>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={4}>
              <Stat>
                <StatLabel>Required Reserve</StatLabel>
                <StatNumber fontSize="2xl">{formatCurrency(warranty.requiredReserve)}</StatNumber>
                <StatHelpText>
                  <Badge colorScheme={getWarrantySeverityColor(warranty.severity)}>
                    {warranty.severity}
                  </Badge>
                </StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Expected Claims</StatLabel>
                <StatNumber>{warranty.expectedClaims.toLocaleString()}</StatNumber>
                <StatHelpText>
                  {((warranty.expectedClaims / companyData.warranty.unitsSold) * 100).toFixed(2)}% of {companyData.warranty.unitsSold.toLocaleString()} sold
                </StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Avg Repair Cost</StatLabel>
                <StatNumber>{formatCurrency(warranty.averageRepairCost)}</StatNumber>
                <StatHelpText>Per warranty claim</StatHelpText>
              </Stat>
            </SimpleGrid>

            <Box p={4} bg="gray.50" borderRadius="md">
              <Text fontWeight="medium" mb={2}>Reserve Breakdown:</Text>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                <Box>
                  <Text fontSize="sm" color="gray.600">Materials</Text>
                  <Text fontWeight="bold">{formatCurrency(warranty.breakdown.materialsCost)}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">Labor</Text>
                  <Text fontWeight="bold">{formatCurrency(warranty.breakdown.laborCost)}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">Shipping</Text>
                  <Text fontWeight="bold">{formatCurrency(warranty.breakdown.shippingCost)}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">Overhead</Text>
                  <Text fontWeight="bold">{formatCurrency(warranty.breakdown.overhead)}</Text>
                </Box>
              </SimpleGrid>
            </Box>

            <Divider my={4} />

            <Text fontSize="sm" fontWeight="medium" mb={2}>Recommendations:</Text>
            <VStack align="start" spacing={1}>
              {warranty.recommendations.map((rec, idx) => (
                <Text key={idx} fontSize="sm">• {rec}</Text>
              ))}
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Fully responsive design optimized for manufacturing dashboards
 * 2. Real-time calculations using hardwareIndustry.ts utilities
 * 3. Comprehensive table views for BOM and inventory tracking
 * 4. Alert system for critical quality and warranty issues
 * 5. Color-coded severity indicators (green/yellow/orange/red)
 * 6. Detailed breakdowns for cost analysis
 * 7. Production capacity scenario modeling
 * 8. Supply chain critical path visualization
 * 9. TypeScript strict mode compliant
 * 10. Accessible and performant
 * 
 * USAGE EXAMPLE:
 * 
 * import ManufacturingDashboard from '@/components/ai/ManufacturingDashboard';
 * 
 * const companyData = {
 *   materialCost: 45.50,
 *   laborCost: 12.00,
 *   overheadAllocation: 8.50,
 *   qualityControlCost: 2.00,
 *   bomComponents: [
 *     { name: 'PCB Board', quantity: 1, unitCost: 12.50 },
 *     { name: 'Resistor 10K', quantity: 20, unitCost: 0.05 }
 *   ],
 *   facility: {
 *     shiftsPerDay: 2,
 *     workersPerShift: 50,
 *     unitsPerWorkerPerHour: 4,
 *     operatingHoursPerShift: 8,
 *     efficiencyRate: 0.85
 *   },
 *   // ... other data
 * };
 * 
 * <ManufacturingDashboard 
 *   companyData={companyData}
 *   companyName="HardwareCo Manufacturing"
 *   showSupplyChain={true}
 *   showInventory={true}
 *   showWarranty={true}
 * />
 */
