/**
 * @fileoverview State Selector Modal - Travel between states
 * @module components/crime/trading/StateSelector
 * 
 * OVERVIEW:
 * Modal for selecting travel destination. Shows all 50 states + DC with
 * estimated travel cost and time based on distance from current location.
 * 
 * @created 2025-12-04
 * @author ECHO v1.4.0 FLAWLESS PROTOCOL
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Card,
  CardBody,
  Chip,
  Spinner,
} from '@heroui/react';
import {
  Search,
  MapPin,
  DollarSign,
  Clock,
  Plane,
  AlertTriangle,
} from 'lucide-react';
import { ALL_STATES } from '@/lib/types/crime-mmo';
import type { StateCode } from '@/lib/types/crime';

/**
 * State coordinate data for distance calculations
 * Approximate center coordinates for each state
 */
const STATE_COORDS: Record<StateCode, { lat: number; lng: number }> = {
  AL: { lat: 32.8, lng: -86.8 },
  AK: { lat: 64.0, lng: -153.0 },
  AZ: { lat: 34.3, lng: -111.7 },
  AR: { lat: 34.8, lng: -92.2 },
  CA: { lat: 36.8, lng: -119.4 },
  CO: { lat: 39.0, lng: -105.5 },
  CT: { lat: 41.6, lng: -72.7 },
  DE: { lat: 39.0, lng: -75.5 },
  DC: { lat: 38.9, lng: -77.0 },
  FL: { lat: 28.1, lng: -81.6 },
  GA: { lat: 33.0, lng: -83.5 },
  HI: { lat: 20.8, lng: -156.3 },
  ID: { lat: 44.2, lng: -114.5 },
  IL: { lat: 40.0, lng: -89.2 },
  IN: { lat: 39.8, lng: -86.3 },
  IA: { lat: 42.0, lng: -93.5 },
  KS: { lat: 38.5, lng: -98.4 },
  KY: { lat: 37.8, lng: -85.8 },
  LA: { lat: 31.0, lng: -92.0 },
  ME: { lat: 45.4, lng: -69.2 },
  MD: { lat: 39.0, lng: -76.8 },
  MA: { lat: 42.2, lng: -71.5 },
  MI: { lat: 44.2, lng: -85.4 },
  MN: { lat: 46.3, lng: -94.3 },
  MS: { lat: 32.7, lng: -89.7 },
  MO: { lat: 38.4, lng: -92.5 },
  MT: { lat: 47.0, lng: -109.6 },
  NE: { lat: 41.5, lng: -99.8 },
  NV: { lat: 39.5, lng: -116.9 },
  NH: { lat: 43.7, lng: -71.6 },
  NJ: { lat: 40.2, lng: -74.7 },
  NM: { lat: 34.5, lng: -106.1 },
  NY: { lat: 42.9, lng: -75.5 },
  NC: { lat: 35.6, lng: -79.8 },
  ND: { lat: 47.5, lng: -100.5 },
  OH: { lat: 40.4, lng: -82.8 },
  OK: { lat: 35.6, lng: -97.5 },
  OR: { lat: 44.0, lng: -120.5 },
  PA: { lat: 40.9, lng: -77.8 },
  RI: { lat: 41.7, lng: -71.5 },
  SC: { lat: 33.9, lng: -80.9 },
  SD: { lat: 44.4, lng: -100.2 },
  TN: { lat: 35.9, lng: -86.4 },
  TX: { lat: 31.5, lng: -99.4 },
  UT: { lat: 39.3, lng: -111.7 },
  VT: { lat: 44.1, lng: -72.7 },
  VA: { lat: 37.5, lng: -78.8 },
  WA: { lat: 47.4, lng: -120.5 },
  WV: { lat: 38.6, lng: -80.6 },
  WI: { lat: 44.6, lng: -89.7 },
  WY: { lat: 43.0, lng: -107.5 },
};

/**
 * Calculate distance between two states in miles
 */
function calculateDistance(from: StateCode, to: StateCode): number {
  const fromCoords = STATE_COORDS[from];
  const toCoords = STATE_COORDS[to];
  
  if (!fromCoords || !toCoords) return 1000;
  
  // Haversine formula
  const R = 3959; // Earth radius in miles
  const dLat = (toCoords.lat - fromCoords.lat) * Math.PI / 180;
  const dLng = (toCoords.lng - fromCoords.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(fromCoords.lat * Math.PI / 180) * Math.cos(toCoords.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return Math.round(R * c);
}

/**
 * Calculate travel cost based on distance
 */
function calculateTravelCost(distance: number): number {
  // Base cost $50 + $0.10 per mile
  const baseCost = 50;
  const perMile = 0.10;
  return Math.round(baseCost + (distance * perMile));
}

/**
 * Calculate travel time in hours based on distance
 */
function calculateTravelTime(distance: number): number {
  // Average 60 mph driving
  const avgSpeed = 60;
  return Math.round((distance / avgSpeed) * 10) / 10;
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface StateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: StateCode;
  playerCash: number;
  onSelectState: (state: StateCode) => void;
  isLoading?: boolean;
}

export function StateSelector({
  isOpen,
  onClose,
  currentState,
  playerCash,
  onSelectState,
  isLoading = false,
}: StateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<StateCode | null>(null);

  // Filter and sort states
  const filteredStates = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    return ALL_STATES
      .filter(state => state.code !== currentState)
      .filter(state => 
        state.code.toLowerCase().includes(query) ||
        state.name.toLowerCase().includes(query)
      )
      .map(state => ({
        ...state,
        distance: calculateDistance(currentState, state.code),
        cost: calculateTravelCost(calculateDistance(currentState, state.code)),
        time: calculateTravelTime(calculateDistance(currentState, state.code)),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [currentState, searchQuery]);

  // Get selected state info
  const selectedInfo = selectedState ? {
    distance: calculateDistance(currentState, selectedState),
    cost: calculateTravelCost(calculateDistance(currentState, selectedState)),
    time: calculateTravelTime(calculateDistance(currentState, selectedState)),
  } : null;

  const canAfford = selectedInfo ? playerCash >= selectedInfo.cost : false;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      placement="center"
      scrollBehavior="inside"
      classNames={{
        base: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/20 shadow-2xl',
        header: 'border-b border-white/10 bg-slate-800/50',
        body: 'bg-slate-900/50',
        footer: 'border-t border-white/10 bg-slate-800/50',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-3 text-white">
          <Plane className="h-6 w-6 text-blue-400" />
          <span className="text-xl font-bold">Travel to Another State</span>
        </ModalHeader>

        <ModalBody className="py-6 space-y-6">
          {/* Current Location */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-xl border border-blue-500/30 shadow-lg">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/20">
                    <MapPin className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Current Location</p>
                    <p className="text-2xl font-black text-white">{currentState}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Available Cash</p>
                  <p className="text-2xl font-black text-green-400">
                    {formatCurrency(playerCash)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Search */}
          <Input
            placeholder="Search states by name or code..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<Search className="h-5 w-5 text-slate-400" />}
            size="lg"
            classNames={{
              input: 'text-white font-medium',
              inputWrapper: 'bg-slate-800/50 border border-white/20 hover:border-blue-500/50 transition-colors',
            }}
          />

          {/* State Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Select Destination</h3>
              <Chip size="md" className="bg-slate-700/50 text-slate-300 border border-white/10">
                {filteredStates.length} states
              </Chip>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
              {filteredStates.map((state) => {
                const isAffordable = playerCash >= state.cost;
                const isSelected = selectedState === state.code;

                return (
                  <Card
                    key={state.code}
                    isPressable
                    isHoverable
                    className={`
                      ${isSelected 
                        ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-500/20 to-blue-600/10 shadow-lg shadow-blue-500/30' 
                        : 'border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:border-blue-500/50'}
                      ${!isAffordable ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'}
                      transition-all duration-300
                    `}
                    onPress={() => isAffordable && setSelectedState(state.code)}
                  >
                    <CardBody className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-lg font-black text-white">{state.code}</p>
                          <p className="text-xs text-slate-300 font-medium">{state.name}</p>
                        </div>
                        {!isAffordable && (
                          <Chip size="sm" className="bg-red-500/20 text-red-400 border border-red-500/30">
                            💰
                          </Chip>
                        )}
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <DollarSign className="h-3.5 w-3.5 text-green-400" />
                          <span className="text-green-400 font-bold">{formatCurrency(state.cost)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className="h-3.5 w-3.5 text-blue-400" />
                          <span className="text-blue-400 font-bold">{state.time}h</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-400 font-medium">{state.distance}mi</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Selected State Summary */}
          {selectedInfo && selectedState && (
            <Card className="bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-slate-800/50 backdrop-blur-xl border border-blue-500/30 shadow-xl">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm font-medium text-blue-300 uppercase tracking-wider mb-1">Traveling to</p>
                    <p className="text-3xl font-black text-white">
                      {ALL_STATES.find(s => s.code === selectedState)?.name}
                    </p>
                    <p className="text-lg text-slate-400 mt-1">{selectedState}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-500/20 border border-blue-500/30">
                    <Plane className="h-10 w-10 text-blue-400" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Distance</p>
                    <p className="text-2xl font-black text-blue-400">
                      {selectedInfo.distance.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">miles</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Travel Time</p>
                    <p className="text-2xl font-black text-white">
                      {selectedInfo.time}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">hours</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Heat Reduction</p>
                    <p className="text-2xl font-black text-green-400">
                      -5%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">bonus</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-6 w-6 text-green-400" />
                      <div>
                        <p className="text-sm text-slate-400">Travel Cost</p>
                        <p className={`text-2xl font-black ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(selectedInfo.cost)}
                        </p>
                      </div>
                    </div>
                    {canAfford ? (
                      <Chip size="lg" className="bg-green-500/20 text-green-400 border border-green-500/30 font-bold">
                        ✓ Affordable
                      </Chip>
                    ) : (
                      <Chip size="lg" className="bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                        ✗ Too Expensive
                      </Chip>
                    )}
                  </div>
                </div>

                {!canAfford && (
                  <div className="mt-4 flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-400 mb-1">Insufficient Funds</p>
                      <p className="text-sm text-red-300">
                        You need {formatCurrency(selectedInfo.cost - playerCash)} more to travel to this state.
                      </p>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </ModalBody>

        <ModalFooter className="gap-3">
          <Button
            variant="flat"
            onPress={onClose}
            className="bg-slate-700/50 text-white hover:bg-slate-700 font-bold"
            size="lg"
          >
            Cancel
          </Button>
          <Button
            color="primary"
            isDisabled={!selectedState || !canAfford || isLoading}
            isLoading={isLoading}
            startContent={!isLoading && <Plane className="h-5 w-5" />}
            onPress={() => selectedState && onSelectState(selectedState)}
            className="font-bold text-white"
            size="lg"
          >
            {isLoading ? 'Traveling...' : 'Travel Now'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
