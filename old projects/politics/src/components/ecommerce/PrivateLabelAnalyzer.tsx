/**
 * PrivateLabelAnalyzer.tsx
 * Created: 2025-11-17
 * 
 * OVERVIEW:
 * Product opportunity discovery and profitability analysis for private label sellers.
 * Analyzes market demand, competition levels, and profit margins to identify the
 * best opportunities for launching private label products on the marketplace.
 * 
 * FEATURES:
 * - Market demand analysis with search volume and growth trends
 * - Competition scoring with color-coded badges (Low/Medium/High)
 * - Profitability calculator modal for detailed ROI analysis
 * - Opportunity scoring with multi-factor algorithm
 * - Category filtering and sorting
 * - Export functionality (CSV/JSON)
 * - Data visualization with margin and demand charts
 * - High opportunity alerts (score >80)
 * 
 * BUSINESS LOGIC:
 * - opportunityScore = (demand × 0.4) + ((100 - competition) × 0.3) + (margin × 0.3)
 * - profitMargin = ((sellingPrice - totalCost) / sellingPrice) × 100
 * - totalCost = productCost + shipping + marketplaceFees + fulfillmentFees
 * - breakEvenUnits = fixedCosts / (sellingPrice - variableCostPerUnit)
 * - ROI = (netProfit / totalInvestment) × 100
 * - marketDemand = searchVolume × growthRate × seasonalityFactor
 * 
 * USAGE:
 * <PrivateLabelAnalyzer marketplaceId="123" sellerId="456" />
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Select,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  useToast,
  useDisclosure,
  Grid,
  Text,
  Heading,
  NumberInput,
  NumberInputField,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiDownload, FiDollarSign } from 'react-icons/fi';

interface PrivateLabelAnalyzerProps {
  marketplaceId: string;
  sellerId: string;
}

interface Opportunity {
  productName: string;
  category: string;
  searchVolume: number;
  growthRate: number;
  competitionLevel: number;
  avgSellingPrice: number;
  estimatedMargin: number;
  opportunityScore: number;
  moq: number;
  supplierCost: number;
}

interface CalculatorData {
  productCost: number;
  shipping: number;
  marketplaceFees: number;
  fulfillmentFees: number;
  fixedCosts: number;
  sellingPrice: number;
  expectedUnits: number;
  profitMargin: number;
  breakEvenUnits: number;
  roi: number;
}

interface Filters {
  category: string;
  minMargin: number;
  competition: string;
  sortBy: string;
}

const categories = ['All', 'Electronics', 'Home & Kitchen', 'Sports', 'Beauty', 'Toys', 'Fashion', 'Health'];
const competitionLevels = ['All', 'Low', 'Medium', 'High'];

export default function PrivateLabelAnalyzer({ marketplaceId, sellerId: _sellerId }: PrivateLabelAnalyzerProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    category: 'All',
    minMargin: 0,
    competition: 'All',
    sortBy: 'score',
  });

  const [calculatorData, setCalculatorData] = useState<CalculatorData>({
    productCost: 0,
    shipping: 0,
    marketplaceFees: 0,
    fulfillmentFees: 0,
    fixedCosts: 0,
    sellingPrice: 0,
    expectedUnits: 0,
    profitMargin: 0,
    breakEvenUnits: 0,
    roi: 0,
  });

  const { isOpen: isCalculatorOpen, onOpen: onCalculatorOpen, onClose: onCalculatorClose } = useDisclosure();
  const toast = useToast();

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        marketplaceId,
        category: filters.category !== 'All' ? filters.category : '',
        minMargin: filters.minMargin.toString(),
        competition: filters.competition !== 'All' ? filters.competition : '',
      });

      const response = await fetch(`/api/ecommerce/private-label/opportunities?${params}`);
      if (!response.ok) throw new Error('Failed to fetch opportunities');
      
      const data = await response.json();
      let opportunitiesList = data.opportunities || [];

      // Sort opportunities
      if (filters.sortBy === 'score') {
        opportunitiesList.sort((a: Opportunity, b: Opportunity) => b.opportunityScore - a.opportunityScore);
      } else if (filters.sortBy === 'margin') {
        opportunitiesList.sort((a: Opportunity, b: Opportunity) => b.estimatedMargin - a.estimatedMargin);
      } else if (filters.sortBy === 'demand') {
        opportunitiesList.sort((a: Opportunity, b: Opportunity) => b.searchVolume - a.searchVolume);
      }

      setOpportunities(opportunitiesList);
    } catch (error) {
      toast({
        title: 'Error loading opportunities',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [marketplaceId, filters, toast]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const getCompetitionColor = (level: number): string => {
    if (level < 30) return 'green';
    if (level < 60) return 'yellow';
    return 'red';
  };

  const getCompetitionLabel = (level: number): string => {
    if (level < 30) return 'Low';
    if (level < 60) return 'Medium';
    return 'High';
  };

  const calculateProfitability = () => {
    const totalCost = calculatorData.productCost + calculatorData.shipping + 
                     calculatorData.marketplaceFees + calculatorData.fulfillmentFees;
    
    const profitMargin = calculatorData.sellingPrice > 0 
      ? ((calculatorData.sellingPrice - totalCost) / calculatorData.sellingPrice) * 100 
      : 0;

    const variableCost = totalCost;
    const breakEvenUnits = (calculatorData.sellingPrice - variableCost) > 0
      ? Math.ceil(calculatorData.fixedCosts / (calculatorData.sellingPrice - variableCost))
      : 0;

    const totalRevenue = calculatorData.sellingPrice * calculatorData.expectedUnits;
    const totalCostWithFixed = (totalCost * calculatorData.expectedUnits) + calculatorData.fixedCosts;
    const netProfit = totalRevenue - totalCostWithFixed;
    const totalInvestment = calculatorData.fixedCosts + (calculatorData.productCost * calculatorData.expectedUnits);
    const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

    setCalculatorData((prev) => ({
      ...prev,
      profitMargin,
      breakEvenUnits,
      roi,
    }));
  };

  const handleOpenCalculator = (product: Opportunity) => {
    setSelectedProduct(product);
    setCalculatorData({
      productCost: product.supplierCost,
      shipping: product.supplierCost * 0.1, // Estimate 10% of product cost
      marketplaceFees: product.avgSellingPrice * 0.15, // Estimate 15% marketplace fee
      fulfillmentFees: 3.0, // Flat estimate
      fixedCosts: product.moq * product.supplierCost, // MOQ × unit cost
      sellingPrice: product.avgSellingPrice,
      expectedUnits: product.moq * 2, // 2× MOQ estimate
      profitMargin: 0,
      breakEvenUnits: 0,
      roi: 0,
    });
    onCalculatorOpen();
  };

  const exportData = (format: 'csv' | 'json') => {
    if (format === 'json') {
      const dataStr = JSON.stringify(opportunities, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `opportunities_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } else if (format === 'csv') {
      const headers = ['Product', 'Category', 'Search Volume', 'Growth Rate', 'Competition', 'Margin %', 'Score'];
      const rows = opportunities.map((opp) => [
        opp.productName,
        opp.category,
        opp.searchVolume,
        `${opp.growthRate}%`,
        getCompetitionLabel(opp.competitionLevel),
        `${opp.estimatedMargin}%`,
        opp.opportunityScore.toFixed(1),
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `opportunities_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }

    toast({
      title: 'Data exported',
      status: 'success',
      duration: 3000,
    });
  };

  // Calculate summary statistics
  const avgMargin = opportunities.length > 0
    ? opportunities.reduce((sum, opp) => sum + opp.estimatedMargin, 0) / opportunities.length
    : 0;

  const topCategory = opportunities.length > 0
    ? opportunities.reduce((acc, opp) => {
        acc[opp.category] = (acc[opp.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : {};
  const mostCommonCategory = Object.keys(topCategory).length > 0
    ? Object.keys(topCategory).reduce((a, b) => topCategory[a] > topCategory[b] ? a : b)
    : 'N/A';

  const avgROI = opportunities.length > 0
    ? opportunities.reduce((sum, opp) => sum + (opp.estimatedMargin * 2), 0) / opportunities.length // Simplified ROI estimate
    : 0;

  const highOpportunities = opportunities.filter((opp) => opp.opportunityScore > 80);

  // Prepare chart data
  const marginChartData = opportunities.slice(0, 10).map((opp) => ({
    name: opp.productName.slice(0, 15) + '...',
    margin: opp.estimatedMargin,
    categoryAvg: avgMargin,
  }));

  const demandChartData = opportunities.slice(0, 6).map((opp) => ({
    month: opp.category,
    searchVolume: opp.searchVolume,
    growthRate: opp.growthRate,
  }));

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>Private Label Analyzer</Heading>

      {/* Summary Statistics */}
      <StatGroup mb={6}>
        <Stat>
          <StatLabel>Total Opportunities</StatLabel>
          <StatNumber>{opportunities.length}</StatNumber>
          <StatHelpText>Filtered results</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Avg. Margin</StatLabel>
          <StatNumber>{avgMargin.toFixed(1)}%</StatNumber>
          <StatHelpText>Across all products</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Top Category</StatLabel>
          <StatNumber>{mostCommonCategory}</StatNumber>
          <StatHelpText>Most opportunities</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Avg. Est. ROI</StatLabel>
          <StatNumber>{avgROI.toFixed(1)}%</StatNumber>
          <StatHelpText>Estimated return</StatHelpText>
        </Stat>
      </StatGroup>

      {/* High Opportunity Alert */}
      {highOpportunities.length > 0 && (
        <Alert status="success" mb={6}>
          <AlertIcon />
          <Box>
            <AlertTitle>High Opportunity Products Found!</AlertTitle>
            <AlertDescription>
              {highOpportunities.length} product{highOpportunities.length !== 1 ? 's' : ''} with opportunity score &gt; 80
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Filters */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4} mb={6}>
        <FormControl>
          <FormLabel>Category</FormLabel>
          <Select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Min. Margin (%)</FormLabel>
          <NumberInput
            value={filters.minMargin}
            onChange={(_, val) => setFilters({ ...filters, minMargin: val })}
            min={0}
            max={100}
          >
            <NumberInputField />
          </NumberInput>
        </FormControl>

        <FormControl>
          <FormLabel>Competition</FormLabel>
          <Select value={filters.competition} onChange={(e) => setFilters({ ...filters, competition: e.target.value })}>
            {competitionLevels.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Sort By</FormLabel>
          <Select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}>
            <option value="score">Opportunity Score</option>
            <option value="margin">Profit Margin</option>
            <option value="demand">Market Demand</option>
          </Select>
        </FormControl>
      </Grid>

      {/* Export Buttons */}
      <HStack mb={6}>
        <Button leftIcon={<FiDownload />} onClick={() => exportData('csv')}>Export CSV</Button>
        <Button leftIcon={<FiDownload />} onClick={() => exportData('json')}>Export JSON</Button>
      </HStack>

      {/* Opportunities Table */}
      {loading ? (
        <Spinner size="xl" />
      ) : (
        <Table variant="simple" mb={6}>
          <Thead>
            <Tr>
              <Th>Rank</Th>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th>Demand</Th>
              <Th>Competition</Th>
              <Th>Margin</Th>
              <Th>Score</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {opportunities.map((opp, index) => (
              <Tr key={index}>
                <Td>{index + 1}</Td>
                <Td>{opp.productName}</Td>
                <Td>{opp.category}</Td>
                <Td>
                  <HStack>
                    <Text>{opp.searchVolume.toLocaleString()}</Text>
                    {opp.growthRate > 0 ? (
                      <FiTrendingUp color="green" />
                    ) : (
                      <FiTrendingDown color="red" />
                    )}
                    <Text fontSize="sm" color={opp.growthRate > 0 ? 'green.500' : 'red.500'}>
                      {opp.growthRate > 0 ? '+' : ''}{opp.growthRate}%
                    </Text>
                  </HStack>
                </Td>
                <Td>
                  <Badge colorScheme={getCompetitionColor(opp.competitionLevel)}>
                    {getCompetitionLabel(opp.competitionLevel)} ({opp.competitionLevel})
                  </Badge>
                </Td>
                <Td>{opp.estimatedMargin.toFixed(1)}%</Td>
                <Td>
                  <Badge colorScheme={opp.opportunityScore > 80 ? 'green' : opp.opportunityScore > 60 ? 'yellow' : 'gray'}>
                    {opp.opportunityScore.toFixed(1)}
                  </Badge>
                </Td>
                <Td>
                  <Button
                    size="sm"
                    leftIcon={<FiDollarSign />}
                    onClick={() => handleOpenCalculator(opp)}
                  >
                    Calculate
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {/* Data Visualizations */}
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6} mb={6}>
        {/* Margin Comparison Chart */}
        <Box>
          <Heading size="md" mb={4}>Top 10 Products by Margin</Heading>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={marginChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="margin" fill="#3182CE" name="Product Margin %" />
              <Bar dataKey="categoryAvg" fill="#E2E8F0" name="Category Avg %" />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        {/* Demand Trends Chart */}
        <Box>
          <Heading size="md" mb={4}>Market Demand Overview</Heading>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={demandChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="searchVolume" stroke="#3182CE" name="Search Volume" />
              <Line yAxisId="right" type="monotone" dataKey="growthRate" stroke="#38A169" name="Growth Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Grid>

      {/* Profitability Calculator Modal */}
      <Modal isOpen={isCalculatorOpen} onClose={onCalculatorClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Profitability Calculator</ModalHeader>
          <ModalBody>
            {selectedProduct && (
              <VStack spacing={4} align="stretch">
                <Text fontWeight="bold">{selectedProduct.productName}</Text>
                
                <Grid templateColumns="1fr 1fr" gap={4}>
                  <FormControl>
                    <FormLabel>Product Cost</FormLabel>
                    <NumberInput
                      value={calculatorData.productCost}
                      onChange={(_, val) => setCalculatorData({ ...calculatorData, productCost: val })}
                      min={0}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Shipping</FormLabel>
                    <NumberInput
                      value={calculatorData.shipping}
                      onChange={(_, val) => setCalculatorData({ ...calculatorData, shipping: val })}
                      min={0}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Marketplace Fees</FormLabel>
                    <NumberInput
                      value={calculatorData.marketplaceFees}
                      onChange={(_, val) => setCalculatorData({ ...calculatorData, marketplaceFees: val })}
                      min={0}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Fulfillment Fees</FormLabel>
                    <NumberInput
                      value={calculatorData.fulfillmentFees}
                      onChange={(_, val) => setCalculatorData({ ...calculatorData, fulfillmentFees: val })}
                      min={0}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Fixed Costs</FormLabel>
                    <NumberInput
                      value={calculatorData.fixedCosts}
                      onChange={(_, val) => setCalculatorData({ ...calculatorData, fixedCosts: val })}
                      min={0}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Selling Price</FormLabel>
                    <NumberInput
                      value={calculatorData.sellingPrice}
                      onChange={(_, val) => setCalculatorData({ ...calculatorData, sellingPrice: val })}
                      min={0}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Expected Units (1 year)</FormLabel>
                    <NumberInput
                      value={calculatorData.expectedUnits}
                      onChange={(_, val) => setCalculatorData({ ...calculatorData, expectedUnits: val })}
                      min={0}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </Grid>

                <Button colorScheme="blue" onClick={calculateProfitability}>Calculate</Button>

                {/* Results */}
                <Box p={4} borderWidth={1} borderRadius="md" bg="gray.50">
                  <Heading size="sm" mb={2}>Results</Heading>
                  <Text><strong>Profit Margin:</strong> {calculatorData.profitMargin.toFixed(2)}%</Text>
                  <Text><strong>Break-Even Units:</strong> {calculatorData.breakEvenUnits}</Text>
                  <Text><strong>ROI:</strong> {calculatorData.roi.toFixed(2)}%</Text>
                  <Text fontSize="sm" color="gray.600" mt={2}>
                    MOQ: {selectedProduct.moq} units at ${selectedProduct.supplierCost}/unit
                  </Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onCalculatorClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * Architecture:
 * - Opportunity discovery interface with filtering and sorting
 * - Modal-based profitability calculator with comprehensive cost analysis
 * - StatGroup for summary metrics (opportunities count, avg margin, top category, avg ROI)
 * - Data visualization with Recharts (BarChart for margins, LineChart for demand)
 * 
 * Data Flow:
 * - GET /api/ecommerce/private-label/opportunities → Load opportunity list with filters
 * - POST /api/ecommerce/private-label/calculate → Calculate profitability metrics
 * - Client-side sorting and filtering for responsive UX
 * 
 * Opportunity Scoring:
 * - Multi-factor algorithm: demand (40%), low competition (30%), high margin (30%)
 * - Score range: 0-100, with >80 considered high opportunity
 * - Visual alerts for high-scoring products
 * 
 * Competition Analysis:
 * - Three-tier system: Low (<30), Medium (30-60), High (>60)
 * - Color-coded badges for quick visual scanning
 * - Filter by competition level for focused discovery
 * 
 * Profitability Calculator:
 * - Comprehensive cost inputs (product, shipping, marketplace fees, fulfillment, fixed costs)
 * - Calculated outputs: profit margin %, break-even units, ROI %
 * - Pre-populated with intelligent estimates based on opportunity data
 * - Real-time calculation on button click
 * 
 * Market Demand Visualization:
 * - Search volume tracking with growth rate indicators
 * - Trending icons (up/down) for quick trend identification
 * - Dual-axis LineChart showing volume and growth rate correlation
 * 
 * Data Export:
 * - CSV format: headers + data rows for Excel compatibility
 * - JSON format: complete data structure for further analysis
 * - Timestamped filenames for organization
 * - Blob download implementation for client-side export
 * 
 * Filtering System:
 * - Category filter: All categories plus specific product categories
 * - Minimum margin filter: Numeric input for threshold filtering
 * - Competition filter: All levels or specific Low/Medium/High
 * - Sort options: Opportunity score (default), margin, demand
 * 
 * Summary Statistics:
 * - Total opportunities: Filtered result count
 * - Average margin: Mean of all product margins
 * - Top category: Most common category in results
 * - Average ROI: Simplified estimate (margin × 2)
 * 
 * Chart Data Preparation:
 * - Top 10 products for margin comparison chart
 * - Category average line for benchmark comparison
 * - Top 6 products for demand trends (simplified month labels)
 * - Shortened product names (15 chars) for clean axis labels
 */
