/**
 * @fileoverview Interactive US Map Page
 * @module app/game/map/page
 * 
 * OVERVIEW:
 * Interactive US map showing states with political data.
 * Click states to navigate to state detail pages.
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, Spinner } from '@heroui/react';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import { PoliticalParty } from '@/types/politics';

import type { StateData, USMapProps } from '@/components/map';

// Dynamically import the map to avoid SSR issues with react-simple-maps
const USMapComponent = dynamic<USMapProps>(
  () => import('@/components/map').then((m) => m.USMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px]">
        <Spinner size="lg" label="Loading map..." />
      </div>
    ),
  }
);

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MapPage() {
  const router = useRouter();

  // Fetch state metrics
  const { data: statesData, isLoading } = useSWR('/api/politics/states', fetcher);

  const states = statesData?.data?.states || [];

  // Transform API data to StateData format for the map component
  const mapStatesData: StateData[] = useMemo(() => {
    return states.map((s: any) => ({
      code: s.stateCode,
      name: s.stateName || s.stateCode,
      controllingParty: s.dominantParty as PoliticalParty | undefined,
      democraticInfluence: s.democraticInfluence,
      republicanInfluence: s.republicanInfluence,
      independentInfluence: s.independentInfluence,
      totalInfluence: s.totalInfluence,
      playerInfluence: s.playerInfluence,
    }));
  }, [states]);

  // Count states by party control
  const partyCounts = useMemo(() => {
    const counts = { republican: 0, democratic: 0, independent: 0, neutral: 0 };
    states.forEach((s: any) => {
      if (s.dominantParty === PoliticalParty.REPUBLICAN) counts.republican++;
      else if (s.dominantParty === PoliticalParty.DEMOCRATIC) counts.democratic++;
      else if (s.dominantParty === PoliticalParty.INDEPENDENT) counts.independent++;
      else counts.neutral++;
    });
    return counts;
  }, [states]);

  const handleStateClick = (stateCode: string) => {
    router.push(`/game/politics/states/${stateCode}`);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
            United States Map
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Interactive political landscape - click on states for details
          </p>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 py-8">
        {/* Legend */}
        <Card className="mb-6 bg-slate-800/50 border border-slate-700/50">
          <CardBody className="py-4">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-red-500" />
                <span className="text-sm text-white">Republican Control</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-500" />
                <span className="text-sm text-white">Democratic Control</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-purple-500" />
                <span className="text-sm text-white">Split Control</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-slate-600" />
                <span className="text-sm text-white">Neutral/Swing</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Map Container */}
        <Card className="bg-slate-800/50 border border-slate-700/50 overflow-hidden">
          <CardBody className="p-0 relative">
            {isLoading ? (
              <div className="flex items-center justify-center h-[600px]">
                <Spinner size="lg" label="Loading map data..." />
              </div>
            ) : (
              <USMapComponent
                statesData={mapStatesData}
                onStateClick={handleStateClick}
                showTooltips={true}
                height={600}
              />
            )}
          </CardBody>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card className="bg-slate-800/50 border border-slate-700/50">
            <CardBody className="p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">Total States</p>
              <p className="text-2xl font-bold text-white">51</p>
            </CardBody>
          </Card>
          <Card className="bg-red-900/30 border border-red-500/30">
            <CardBody className="p-4 text-center">
              <p className="text-xs text-red-300 mb-1">Republican</p>
              <p className="text-2xl font-bold text-red-400">{partyCounts.republican > 0 ? partyCounts.republican : '--'}</p>
            </CardBody>
          </Card>
          <Card className="bg-blue-900/30 border border-blue-500/30">
            <CardBody className="p-4 text-center">
              <p className="text-xs text-blue-300 mb-1">Democratic</p>
              <p className="text-2xl font-bold text-blue-400">{partyCounts.democratic > 0 ? partyCounts.democratic : '--'}</p>
            </CardBody>
          </Card>
          <Card className="bg-purple-900/30 border border-purple-500/30">
            <CardBody className="p-4 text-center">
              <p className="text-xs text-purple-300 mb-1">Swing/Neutral</p>
              <p className="text-2xl font-bold text-purple-400">{partyCounts.neutral > 0 ? partyCounts.neutral : 51}</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
