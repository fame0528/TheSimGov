/**
 * @file components/map/USMap.tsx
 * @description Interactive SVG map of United States
 * @created 2025-11-13
 * @updated 2025-11-15
 * 
 * OVERVIEW:
 * Interactive US map using react-simple-maps with dual modes:
 * - Politics mode: Shows party control color coding
 * - Locations mode: Shows company locations with expansion capabilities
 * 
 * FEATURES:
 * - Dual mode support (politics/locations)
 * - State hover preview with economic data
 * - Click handling for state selection
 * - Color coding based on mode context
 * - Location creation modal (locations mode)
 * - Cost/benefit preview integration
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import type { GeographyType } from 'react-simple-maps';
import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
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
  Select,
  useToast,
  Spinner,
  Divider,
} from '@chakra-ui/react';
import { statesByAbbreviation } from '@/lib/seed';
import type { ICompanyLocation } from '@/lib/db/models/CompanyLocation';

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

/**
 * Location preview data structure from API
 */
interface LocationPreview {
  state: string;
  stateInfo: {
    name: string;
    population: number;
    gdpPerCapita: number;
    violentCrimeRate: number;
  };
  costs: Record<string, number>;
  benefits: Record<string, number>;
  totalCost: number;
}

/**
 * USMap component props
 * 
 * @param mode - Map display mode: 'politics' (default) or 'locations'
 * @param onStateClick - Callback when state is clicked (politics mode)
 * @param companyId - Company ID for location management (locations mode)
 * @param locations - Array of existing company locations (locations mode)
 * @param onLocationCreate - Callback when location is created (locations mode)
 */
interface USMapProps {
  mode?: 'politics' | 'locations';
  onStateClick?: (stateAbbr: string) => void;
  companyId?: string;
  locations?: ICompanyLocation[];
  onLocationCreate?: (location: ICompanyLocation) => void;
}

export default function USMap({
  mode = 'politics',
  onStateClick,
  companyId,
  locations = [],
  onLocationCreate,
}: USMapProps) {
  const [tooltipContent, setTooltipContent] = useState('');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [preview, setPreview] = useState<LocationPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Form state for location creation
  const [locationType, setLocationType] = useState<'HQ' | 'Branch'>('Branch');
  const [address, setAddress] = useState('');

  /**
   * Check if company has location in given state
   */
  const hasLocationInState = (stateAbbr: string): boolean => {
    if (mode !== 'locations') return false;
    return locations.some((loc) => loc.state === stateAbbr);
  };

  /**
   * Get state fill color based on mode and context
   */
  const getStateColor = (stateAbbr: string | null): string => {
    if (mode === 'locations' && stateAbbr) {
      return hasLocationInState(stateAbbr) ? '#38a169' : '#4a5568'; // Green if has location, gray otherwise
    }
    // Politics mode - return gray for now
    // TODO: Add party control logic when political system is implemented
    return '#4a5568'; // ash_gray.600
  };

  /**
   * Fetch location preview data from API
   */
  const fetchPreview = async (stateAbbr: string) => {
    setIsLoadingPreview(true);
    try {
      const response = await fetch(`/api/locations/preview?state=${stateAbbr}`);
      if (!response.ok) {
        throw new Error('Failed to fetch preview');
      }
      const data = await response.json();
      setPreview(data);
    } catch (error) {
      console.error('Preview fetch error:', error);
      toast({
        title: 'Preview Error',
        description: 'Failed to load location preview',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  /**
   * Handle state click based on mode
   */
  const handleStateClick = async (stateAbbr: string) => {
    if (mode === 'politics' && onStateClick) {
      onStateClick(stateAbbr);
    } else if (mode === 'locations' && companyId) {
      setSelectedState(stateAbbr);
      setAddress(''); // Reset form
      await fetchPreview(stateAbbr);
      onOpen();
    }
  };

  // Generate a short list of 5 randomized addresses for the selected state
  const addressOptions = useMemo(() => {
    if (!selectedState) return [] as string[];

    const streetNames = [
      'Main', 'Market', 'Broadway', 'First', 'Second', 'Oak', 'Pine', 'Maple', 'Cedar', 'Elm',
      'Walnut', 'River', 'Lakeview', 'Hillcrest', 'Sunset', 'Willow', 'Lincoln', 'Center', 'Union', 'Park'
    ];
    const suffixes = ['St', 'Ave', 'Blvd', 'Rd', 'Ln', 'Way', 'Pl', 'Ct'];
    const cityVariants = ['City', 'Heights', 'Town', 'Harbor', 'Center', 'Gardens', 'Valley'];

    const options = new Set<string>();
    while (options.size < 5) {
      const num = Math.floor(100 + Math.random() * 8900);
      const street = streetNames[Math.floor(Math.random() * streetNames.length)];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      const city = `${statesByAbbreviation[selectedState].name} ${cityVariants[Math.floor(Math.random() * cityVariants.length)]}`;
      const zip = Math.floor(10000 + Math.random() * 89999);
      options.add(`${num} ${street} ${suffix}, ${city}, ${selectedState} ${zip}`);
    }

    return Array.from(options);
  }, [selectedState]);

  useEffect(() => {
    if (addressOptions.length > 0) setAddress(addressOptions[0]);
  }, [addressOptions]);

  /**
   * Create new location via API
   */
  const handleCreateLocation = async () => {
    if (!selectedState || !address.trim() || !companyId) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an address',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          type: locationType,
          address: address.trim(),
          state: selectedState,
          region: determineRegion(selectedState),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create location');
      }

      const { location, message } = await response.json();

      toast({
        title: 'Location Created',
        description: message,
        status: 'success',
        duration: 5000,
      });

      onClose();
      if (onLocationCreate) {
        onLocationCreate(location);
      }
    } catch (error) {
      console.error('Location creation error:', error);
      toast({
        title: 'Creation Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Determine US region from state abbreviation
   */
  const determineRegion = (stateAbbr: string): string => {
    const regions: Record<string, string[]> = {
      Northeast: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT', 'NJ', 'NY', 'PA'],
      Southeast: ['DE', 'FL', 'GA', 'MD', 'NC', 'SC', 'VA', 'WV', 'AL', 'KY', 'MS', 'TN', 'AR', 'LA'],
      Midwest: ['IL', 'IN', 'MI', 'OH', 'WI', 'IA', 'KS', 'MN', 'MO', 'NE', 'ND', 'SD'],
      Southwest: ['AZ', 'NM', 'OK', 'TX'],
      West: ['CO', 'ID', 'MT', 'NV', 'UT', 'WY', 'AK', 'CA', 'HI', 'OR', 'WA'],
    };

    for (const [region, states] of Object.entries(regions)) {
      if (states.includes(stateAbbr)) return region;
    }
    return 'Other';
  };

  /**
   * Format currency for display
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStateData = (geoId: string) => {
    const fipsToAbbr: Record<string, string> = {
      '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
      '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
      '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
      '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
      '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
      '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
      '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
      '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
      '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
      '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
      '56': 'WY',
    };

    const abbr = fipsToAbbr[geoId];
    return abbr ? statesByAbbreviation[abbr] : null;
  };

  return (
    <Box position="relative">
      <ComposableMap
        projection="geoAlbersUsa"
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }: { geographies: GeographyType[] }) =>
            geographies.map((geo: GeographyType) => {
              const stateData = geo.id ? getStateData(geo.id) : null;
              const stateAbbr = stateData?.abbreviation || null;
              
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getStateColor(stateAbbr)}
                  stroke="#141414"
                  strokeWidth={0.5}
                  style={{
                    default: {
                      outline: 'none',
                    },
                    hover: {
                      fill: '#00aef3',
                      outline: 'none',
                      cursor: 'pointer',
                    },
                    pressed: {
                      fill: '#0088cc',
                      outline: 'none',
                    },
                  }}
                  onMouseEnter={() => {
                    if (stateData) {
                      const hasLocation = mode === 'locations' && hasLocationInState(stateData.abbreviation);
                      setTooltipContent(
                        `${stateData.name} | Pop: ${(stateData.population / 1_000_000).toFixed(1)}M | GDP: $${(stateData.gdpMillions / 1000).toFixed(0)}B${hasLocation ? ' | ✓ Location' : ''}`
                      );
                    }
                  }}
                  onMouseLeave={() => {
                    setTooltipContent('');
                  }}
                  onClick={() => {
                    if (stateData) {
                      handleStateClick(stateData.abbreviation);
                    }
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltipContent && (
        <Box
          position="absolute"
          bottom={4}
          left="50%"
          transform="translateX(-50%)"
          bg="night.400"
          px={4}
          py={2}
          borderRadius="md"
          borderWidth={1}
          borderColor="picton_blue.500"
          zIndex={10}
        >
          <Text color="white" fontSize="sm" fontWeight="medium">
            {tooltipContent}
          </Text>
        </Box>
      )}

      {mode === 'locations' && (
        <Box position="absolute" top={4} right={4} bg="night.400" p={3} borderRadius="md" borderWidth={1} borderColor="night.300">
          <VStack align="start" spacing={2}>
            <HStack>
              <Box w={4} h={4} bg="#4a5568" borderRadius="sm" />
              <Text fontSize="xs" color="ash_gray.300">No Location</Text>
            </HStack>
            <HStack>
              <Box w={4} h={4} bg="#38a169" borderRadius="sm" />
              <Text fontSize="xs" color="ash_gray.300">Has Location</Text>
            </HStack>
          </VStack>
        </Box>
      )}

      {mode === 'locations' && (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent bg="night.500" borderColor="night.300" borderWidth={1}>
            <ModalHeader color="white">
              Expand to {preview?.stateInfo.name || selectedState}
            </ModalHeader>
            <ModalCloseButton color="ash_gray.300" />
            <ModalBody>
              {isLoadingPreview ? (
                <Box textAlign="center" py={8}>
                  <Spinner size="xl" color="picton_blue.500" />
                </Box>
              ) : preview ? (
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontSize="sm" color="ash_gray.300" mb={2}>State Information</Text>
                    <HStack spacing={4}>
                      <VStack align="start" spacing={1}>
                        <Text fontSize="xs" color="ash_gray.400">Population</Text>
                        <Text fontSize="md" color="white" fontWeight="medium">
                          {(preview.stateInfo.population / 1_000_000).toFixed(2)}M
                        </Text>
                      </VStack>
                      <VStack align="start" spacing={1}>
                        <Text fontSize="xs" color="ash_gray.400">GDP per Capita</Text>
                        <Text fontSize="md" color="white" fontWeight="medium">
                          {formatCurrency(preview.stateInfo.gdpPerCapita)}
                        </Text>
                      </VStack>
                      <VStack align="start" spacing={1}>
                        <Text fontSize="xs" color="ash_gray.400">Crime Rate</Text>
                        <Text fontSize="md" color="white" fontWeight="medium">
                          {preview.stateInfo.violentCrimeRate.toFixed(1)}
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>

                  <Divider borderColor="night.300" />

                  <Box>
                    <Text fontSize="sm" color="ash_gray.300" mb={2}>Expansion Costs</Text>
                    <VStack align="stretch" spacing={2}>
                      {Object.entries(preview.costs).map(([key, value]) => (
                        <HStack key={key} justify="space-between">
                          <Text fontSize="sm" color="ash_gray.400" textTransform="capitalize">
                            {key}
                          </Text>
                          <Text fontSize="sm" color="flame_orange.400" fontWeight="medium">
                            {formatCurrency(value)}
                          </Text>
                        </HStack>
                      ))}
                      <Divider borderColor="night.300" />
                      <HStack justify="space-between">
                        <Text fontSize="md" color="white" fontWeight="bold">Total Cost</Text>
                        <Text fontSize="md" color="flame_orange.500" fontWeight="bold">
                          {formatCurrency(preview.totalCost)}
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>

                  <Divider borderColor="night.300" />

                  <Box>
                    <Text fontSize="sm" color="ash_gray.300" mb={2}>Expected Benefits</Text>
                    <VStack align="stretch" spacing={2}>
                      {Object.entries(preview.benefits).map(([key, value]) => (
                        <HStack key={key} justify="space-between">
                          <Text fontSize="sm" color="ash_gray.400" textTransform="capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </Text>
                          <Badge colorScheme="green" fontSize="xs">
                            +{value}
                          </Badge>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>

                  <Divider borderColor="night.300" />

                  <FormControl isRequired>
                    <FormLabel color="ash_gray.300" fontSize="sm">Location Type</FormLabel>
                    <Select
                      value={locationType}
                      onChange={(e) => setLocationType(e.target.value as 'HQ' | 'Branch')}
                      bg="night.400"
                      borderColor="night.300"
                      color="white"
                      _hover={{ borderColor: 'picton_blue.500' }}
                    >
                      <option value="HQ">Headquarters</option>
                      <option value="Branch">Branch Office</option>
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color="ash_gray.300" fontSize="sm">Address</FormLabel>
                    <Select
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      bg="night.400"
                      borderColor="night.300"
                      color="white"
                      _hover={{ borderColor: 'picton_blue.500' }}
                      _focus={{ borderColor: 'picton_blue.500', boxShadow: '0 0 0 1px #00aef3' }}
                      placeholder="Select an address"
                    >
                      {addressOptions.map((opt, idx) => (
                        <option key={idx} value={opt} style={{ background: '#1A202C', color: '#FFFFFF' }}>
                          {opt}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </VStack>
              ) : (
                <Text color="ash_gray.400">Failed to load preview</Text>
              )}
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose} color="ash_gray.300">
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleCreateLocation}
                isLoading={isCreating}
                isDisabled={!address.trim() || isLoadingPreview}
              >
                Create Location
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
}
