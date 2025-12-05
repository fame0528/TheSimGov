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
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: 'bg-slate-900 border border-white/10',
        header: 'border-b border-white/10',
        footer: 'border-t border-white/10',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-blue-400" />
          <span>Travel to Another State</span>
        </ModalHeader>

        <ModalBody className="py-4">
          {/* Current Location */}
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <MapPin className="h-5 w-5 text-blue-400" />
            <span className="text-slate-400">Current Location:</span>
            <span className="font-semibold text-white">{currentState}</span>
            <span className="text-slate-500 ml-auto">
              Cash: {formatCurrency(playerCash)}
            </span>
          </div>

          {/* Search */}
          <Input
            placeholder="Search states..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<Search className="h-4 w-4 text-slate-400" />}
            classNames={{
              input: 'bg-transparent',
              inputWrapper: 'bg-white/5 border border-white/10',
            }}
          />

          {/* State Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4 max-h-[400px] overflow-y-auto">
            {filteredStates.map((state) => {
              const isAffordable = playerCash >= state.cost;
              const isSelected = selectedState === state.code;

              return (
                <Card
                  key={state.code}
                  isPressable
                  isHoverable
                  className={`
                    ${isSelected ? 'border-2 border-blue-500 bg-blue-500/10' : 'border border-white/10 bg-white/5'}
                    ${!isAffordable ? 'opacity-50' : ''}
                    transition-all
                  `}
                  onPress={() => isAffordable && setSelectedState(state.code)}
                >
                  <CardBody className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-white">{state.code}</p>
                        <p className="text-xs text-slate-400">{state.name}</p>
                      </div>
                      {!isAffordable && (
                        <Chip size="sm" color="danger" variant="flat">
                          $$$
                        </Chip>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(state.cost)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {state.time}h
                      </span>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>

          {/* Selected State Summary */}
          {selectedInfo && selectedState && (
            <Card className="mt-4 bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent border border-blue-500/20">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Traveling to</p>
                    <p className="text-2xl font-bold text-white">
                      {ALL_STATES.find(s => s.code === selectedState)?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Distance</p>
                    <p className="text-xl font-semibold text-blue-400">
                      {selectedInfo.distance.toLocaleString()} miles
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Cost</p>
                    <p className={`text-lg font-semibold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(selectedInfo.cost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Travel Time</p>
                    <p className="text-lg font-semibold text-white">
                      {selectedInfo.time} hours
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Heat Reduction</p>
                    <p className="text-lg font-semibold text-green-400">
                      -5%
                    </p>
                  </div>
                </div>

                {!canAfford && (
                  <div className="mt-4 flex items-center gap-2 text-red-400 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      Insufficient funds. You need {formatCurrency(selectedInfo.cost - playerCash)} more.
                    </span>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            variant="flat"
            onPress={onClose}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            isDisabled={!selectedState || !canAfford || isLoading}
            isLoading={isLoading}
            startContent={!isLoading && <Plane className="h-4 w-4" />}
            onPress={() => selectedState && onSelectState(selectedState)}
          >
            {isLoading ? 'Traveling...' : 'Travel Now'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
