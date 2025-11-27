/**
 * @fileoverview LandBrowser Component - Real estate property browsing and acquisition
 * @module components/ai/LandBrowser
 * @version 1.0.0
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Property catalog for browsing and acquiring real estate for AI data center construction.
 * Supports filtering by location, zoning, price range, power capacity, and property size.
 * Handles purchase, lease, and build-to-suit acquisition flows with budget validation.
 * 
 * FEATURES:
 * - Property catalog with grid layout (responsive)
 * - Advanced filters: location dropdown, zoning checkboxes, price/power/size sliders
 * - Property cards: size (sqft), power (MW), zoning badge, price display, "Acquire" button
 * - Acquisition modal: purchase/lease/buildToSuit tabs with cost breakdown
 * - Budget validation: error messages if insufficient company cash
 * - Map integration placeholder (react-simple-maps compatible)
 * - Empty state handling (no properties match filters)
 * 
 * USAGE:
 * <LandBrowser companyId="64a1b2c3d4e5f6g7h8i9j0k1" />
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
  Checkbox,
  CheckboxGroup,
  Stack,
  Badge,
  SimpleGrid,
  Card,
  CardBody,
  CardFooter,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  useDisclosure,
  Divider,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from '@chakra-ui/react';

/**
 * Property type from RealEstate model
 */
interface Property {
  _id: string;
  name: string;
  propertyType: string;
  location: {
    city: string;
    state: string;
  };
  landSizeAcres: number;
  buildableSqFt?: number;
  zoning: string;
  powerCapacityKW: number;
  purchasePrice?: number;
  assessedValue: number;
  status: string;
  waterAvailable: boolean;
  fiberConnectivity: boolean;
  powerRedundancy: boolean;
}

/**
 * LandBrowser Props
 */
interface LandBrowserProps {
  companyId: string;
}

/**
 * LandBrowser Component
 */
export default function LandBrowser({ companyId }: LandBrowserProps) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Properties state
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Company cash (for budget validation)
  const [companyCash, setCompanyCash] = useState(0);
  
  // Filters
  const [locationFilter, setLocationFilter] = useState('all');
  const [zoningFilter, setZoningFilter] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 10_000_000]);
  const [powerRange, setPowerRange] = useState([0, 50000]); // kW
  const [sizeRange, setSizeRange] = useState([0, 100]); // acres
  
  // Acquisition state
  const [acquisitionType, setAcquisitionType] = useState<'purchase' | 'lease' | 'buildToSuit'>('purchase');
  const [leaseTermMonths, setLeaseTermMonths] = useState(120); // 10 years default
  
  /**
   * Fetch properties on mount
   */
  useEffect(() => {
    fetchProperties();
    fetchCompanyCash();
  }, []);
  
  /**
   * Fetch properties from API
   */
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: 'Available',
      });
      
      if (locationFilter !== 'all') {
        params.append('state', locationFilter);
      }
      
      if (zoningFilter.length > 0) {
        zoningFilter.forEach((zone) => params.append('zoning', zone));
      }
      
      params.append('priceMin', priceRange[0].toString());
      params.append('priceMax', priceRange[1].toString());
      params.append('minPower', powerRange[0].toString());
      params.append('maxPower', powerRange[1].toString());
      params.append('minSize', (sizeRange[0] * 43560).toString()); // Convert acres to sqft
      params.append('maxSize', (sizeRange[1] * 43560).toString());
      
      const response = await fetch(`/api/ai/real-estate?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setProperties(data.properties);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error Loading Properties',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Fetch company cash for budget validation
   */
  const fetchCompanyCash = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      const data = await response.json();
      if (data.success) {
        setCompanyCash(data.company.cash);
      }
    } catch (error) {
      console.error('Error fetching company cash:', error);
    }
  };
  
  /**
   * Handle property acquisition
   */
  const handleAcquire = async () => {
    if (!selectedProperty) return;
    
    // Budget validation
    const cost = acquisitionType === 'purchase' 
      ? (selectedProperty.purchasePrice || selectedProperty.assessedValue)
      : acquisitionType === 'lease'
      ? (selectedProperty.purchasePrice || selectedProperty.assessedValue) * 0.02 // 2 months security deposit
      : (selectedProperty.purchasePrice || selectedProperty.assessedValue) * 0.1; // 10% design deposit for buildToSuit
    
    if (companyCash < cost) {
      toast({
        title: 'Insufficient Funds',
        description: `You need $${cost.toLocaleString()} but only have $${companyCash.toLocaleString()}`,
        status: 'error',
        duration: 5000,
      });
      return;
    }
    
    try {
      const response = await fetch('/api/ai/real-estate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedProperty._id,
          companyId,
          acquisitionType,
          leaseTermMonths: acquisitionType === 'lease' ? leaseTermMonths : undefined,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Property Acquired',
          description: `Successfully acquired ${selectedProperty.name}`,
          status: 'success',
          duration: 5000,
        });
        
        // Refresh properties and cash
        fetchProperties();
        fetchCompanyCash();
        onClose();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Acquisition Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };
  
  /**
   * Calculate acquisition cost
   */
  const calculateCost = (property: Property | null) => {
    if (!property) return 0;
    
    const basePrice = property.purchasePrice || property.assessedValue;
    
    switch (acquisitionType) {
      case 'purchase':
        return basePrice;
      case 'lease':
        return basePrice * 0.02; // 2 months security deposit
      case 'buildToSuit':
        return basePrice * 0.1; // 10% design deposit
      default:
        return 0;
    }
  };
  
  return (
    <Box maxW="1400px" mx="auto" p={6}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Real Estate Browser</Heading>
        
        {/* Filters */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">Filters</Heading>
              
              <HStack spacing={4} wrap="wrap">
                <Box flex={1} minW="200px">
                  <Text mb={2} fontSize="sm" fontWeight="medium">Location</Text>
                  <Select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                    <option value="all">All States</option>
                    <option value="CA">California</option>
                    <option value="TX">Texas</option>
                    <option value="NY">New York</option>
                    <option value="VA">Virginia</option>
                    <option value="WA">Washington</option>
                  </Select>
                </Box>
                
                <Box flex={1} minW="200px">
                  <Text mb={2} fontSize="sm" fontWeight="medium">Zoning</Text>
                  <CheckboxGroup value={zoningFilter} onChange={(values) => setZoningFilter(values as string[])}>
                    <Stack direction="row" spacing={4}>
                      <Checkbox value="Industrial">Industrial</Checkbox>
                      <Checkbox value="TechPark">Tech Park</Checkbox>
                      <Checkbox value="Commercial">Commercial</Checkbox>
                    </Stack>
                  </CheckboxGroup>
                </Box>
              </HStack>
              
              <Box>
                <Text mb={2} fontSize="sm" fontWeight="medium">
                  Price Range: ${(priceRange[0] / 1_000_000).toFixed(1)}M - ${(priceRange[1] / 1_000_000).toFixed(1)}M
                </Text>
                <Slider
                  min={0}
                  max={10_000_000}
                  step={100_000}
                  value={priceRange[1]}
                  onChange={(val) => setPriceRange([0, val])}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </Box>
              
              <HStack spacing={4}>
                <Box flex={1}>
                  <Text mb={2} fontSize="sm" fontWeight="medium">
                    Power Capacity: {powerRange[0]} - {powerRange[1]} kW
                  </Text>
                  <Slider
                    min={0}
                    max={50000}
                    step={1000}
                    value={powerRange[1]}
                    onChange={(val) => setPowerRange([0, val])}
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </Box>
                
                <Box flex={1}>
                  <Text mb={2} fontSize="sm" fontWeight="medium">
                    Land Size: {sizeRange[0]} - {sizeRange[1]} acres
                  </Text>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={sizeRange[1]}
                    onChange={(val) => setSizeRange([0, val])}
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </Box>
              </HStack>
              
              <Button colorScheme="blue" onClick={fetchProperties} isLoading={loading}>
                Apply Filters
              </Button>
            </VStack>
          </CardBody>
        </Card>
        
        {/* Properties Grid */}
        {properties.length === 0 ? (
          <Card>
            <CardBody>
              <Text textAlign="center" color="gray.500">
                No properties match your filters. Try adjusting your search criteria.
              </Text>
            </CardBody>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {properties.map((property) => (
              <Card key={property._id} variant="outline">
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <Heading size="sm">{property.name}</Heading>
                    
                    <Text fontSize="sm" color="gray.600">
                      {property.location.city}, {property.location.state}
                    </Text>
                    
                    <HStack spacing={2} wrap="wrap">
                      <Badge colorScheme="purple">{property.propertyType}</Badge>
                      <Badge colorScheme="green">{property.zoning}</Badge>
                    </HStack>
                    
                    <Divider />
                    
                    <HStack justify="space-between">
                      <Text fontSize="sm">Land Size:</Text>
                      <Text fontSize="sm" fontWeight="bold">
                        {property.landSizeAcres.toFixed(1)} acres
                      </Text>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text fontSize="sm">Power:</Text>
                      <Text fontSize="sm" fontWeight="bold">
                        {(property.powerCapacityKW / 1000).toFixed(1)} MW
                      </Text>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text fontSize="sm">Price:</Text>
                      <Text fontSize="lg" fontWeight="bold" color="blue.600">
                        ${((property.purchasePrice || property.assessedValue) / 1_000_000).toFixed(2)}M
                      </Text>
                    </HStack>
                    
                    <HStack spacing={2}>
                      {property.waterAvailable && <Badge colorScheme="blue">Water</Badge>}
                      {property.fiberConnectivity && <Badge colorScheme="cyan">Fiber</Badge>}
                      {property.powerRedundancy && <Badge colorScheme="orange">Dual Power</Badge>}
                    </HStack>
                  </VStack>
                </CardBody>
                
                <CardFooter>
                  <Button
                    colorScheme="blue"
                    w="full"
                    onClick={() => {
                      setSelectedProperty(property);
                      onOpen();
                    }}
                  >
                    Acquire Property
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </VStack>
      
      {/* Acquisition Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Acquire Property</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedProperty && (
              <VStack spacing={4} align="stretch">
                <Heading size="sm">{selectedProperty.name}</Heading>
                
                <Tabs onChange={(index) => setAcquisitionType(['purchase', 'lease', 'buildToSuit'][index] as any)}>
                  <TabList>
                    <Tab>Purchase</Tab>
                    <Tab>Lease</Tab>
                    <Tab>Build-to-Suit</Tab>
                  </TabList>
                  
                  <TabPanels>
                    <TabPanel>
                      <VStack align="stretch" spacing={3}>
                        <Text>Outright purchase of property with full ownership rights.</Text>
                        <HStack justify="space-between">
                          <Text fontWeight="bold">Purchase Price:</Text>
                          <Text fontSize="xl" color="blue.600">
                            ${((selectedProperty.purchasePrice || selectedProperty.assessedValue) / 1_000_000).toFixed(2)}M
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          Your Cash: ${(companyCash / 1_000_000).toFixed(2)}M
                        </Text>
                      </VStack>
                    </TabPanel>
                    
                    <TabPanel>
                      <VStack align="stretch" spacing={3}>
                        <Text>Long-term lease with monthly payments and annual escalation.</Text>
                        
                        <Box>
                          <Text mb={2} fontSize="sm" fontWeight="medium">
                            Lease Term: {(leaseTermMonths / 12).toFixed(0)} years
                          </Text>
                          <Slider
                            min={60}
                            max={300}
                            step={12}
                            value={leaseTermMonths}
                            onChange={(val) => setLeaseTermMonths(val)}
                          >
                            <SliderTrack>
                              <SliderFilledTrack />
                            </SliderTrack>
                            <SliderThumb />
                          </Slider>
                        </Box>
                        
                        <HStack justify="space-between">
                          <Text fontWeight="bold">Security Deposit:</Text>
                          <Text fontSize="xl" color="blue.600">
                            ${(calculateCost(selectedProperty) / 1_000_000).toFixed(2)}M
                          </Text>
                        </HStack>
                        
                        <Text fontSize="sm" color="gray.600">
                          Monthly Payment: ~${(((selectedProperty.purchasePrice || selectedProperty.assessedValue) * 0.01) / 1000).toFixed(0)}k
                        </Text>
                      </VStack>
                    </TabPanel>
                    
                    <TabPanel>
                      <VStack align="stretch" spacing={3}>
                        <Text>Developer builds data center to your specs, you lease upon completion.</Text>
                        <HStack justify="space-between">
                          <Text fontWeight="bold">Design Deposit:</Text>
                          <Text fontSize="xl" color="blue.600">
                            ${(calculateCost(selectedProperty) / 1_000_000).toFixed(2)}M
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          Construction timeline: 18-24 months
                        </Text>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
                
                <Divider />
                
                <Button colorScheme="blue" onClick={handleAcquire}>
                  Confirm Acquisition (${(calculateCost(selectedProperty) / 1_000_000).toFixed(2)}M)
                </Button>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
