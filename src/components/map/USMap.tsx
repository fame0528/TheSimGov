'use client';

import React, { useState, memo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { Tooltip } from '@heroui/tooltip';
import { useRouter } from 'next/navigation';
import { PoliticalParty } from '@/types/politics';

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// State FIPS code to abbreviation mapping
const stateAbbreviations: Record<string, string> = {
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
  '56': 'WY'
};

// State names for display
const stateNames: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'DC': 'Washington D.C.', 'FL': 'Florida',
  'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana',
  'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine',
  'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire',
  'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota',
  'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island',
  'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin',
  'WY': 'Wyoming'
};

export interface StateData {
  code: string;
  name: string;
  controllingParty?: PoliticalParty;
  democraticInfluence?: number;
  republicanInfluence?: number;
  independentInfluence?: number;
  totalInfluence?: number;
  playerInfluence?: number;
}

export interface USMapProps {
  statesData?: StateData[];
  onStateClick?: (stateCode: string) => void;
  showTooltips?: boolean;
  height?: number;
}

// Party colors for the map
const partyColors: Record<PoliticalParty, string> = {
  [PoliticalParty.DEMOCRATIC]: '#3b82f6', // blue-500
  [PoliticalParty.REPUBLICAN]: '#ef4444', // red-500
  [PoliticalParty.INDEPENDENT]: '#a855f7', // purple-500
  [PoliticalParty.GREEN]: '#22c55e', // green-500
  [PoliticalParty.LIBERTARIAN]: '#f59e0b', // amber-500
  [PoliticalParty.OTHER]: '#6b7280', // gray-500
};

const USMap: React.FC<USMapProps> = memo(({ 
  statesData = [], 
  onStateClick,
  showTooltips = true,
  height = 500
}) => {
  const router = useRouter();
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  // Create a lookup map for state data
  const stateDataMap = React.useMemo(() => {
    const map = new Map<string, StateData>();
    statesData.forEach(state => {
      map.set(state.code, state);
    });
    return map;
  }, [statesData]);

  const getStateColor = (stateCode: string) => {
    const data = stateDataMap.get(stateCode);
    if (!data?.controllingParty) {
      return '#475569'; // slate-600 for unclaimed/neutral
    }
    return partyColors[data.controllingParty] || '#475569';
  };

  const getStateHoverColor = (stateCode: string) => {
    const baseColor = getStateColor(stateCode);
    // Lighten the color on hover
    if (baseColor === '#475569') return '#64748b'; // slate-500
    if (baseColor === '#3b82f6') return '#60a5fa'; // blue-400
    if (baseColor === '#ef4444') return '#f87171'; // red-400
    if (baseColor === '#a855f7') return '#c084fc'; // purple-400
    if (baseColor === '#22c55e') return '#4ade80'; // green-400
    if (baseColor === '#f59e0b') return '#fbbf24'; // amber-400
    if (baseColor === '#6b7280') return '#9ca3af'; // gray-400
    return baseColor;
  };

  const handleStateClick = (stateCode: string) => {
    if (onStateClick) {
      onStateClick(stateCode);
    } else {
      router.push(`/game/politics/states/${stateCode}`);
    }
  };

  const renderTooltipContent = (stateCode: string) => {
    const data = stateDataMap.get(stateCode);
    const stateName = stateNames[stateCode] || stateCode;

    if (!data) {
      return (
        <div className="p-2">
          <p className="font-semibold text-white">{stateName}</p>
          <p className="text-sm text-slate-400">No political data available</p>
        </div>
      );
    }

    return (
      <div className="p-2 min-w-[180px]">
        <p className="font-semibold text-white mb-2">{stateName}</p>
        {data.controllingParty && (
          <p className="text-sm mb-1">
            <span className="text-slate-400">Control:</span>{' '}
            <span style={{ color: partyColors[data.controllingParty] }}>
              {data.controllingParty}
            </span>
          </p>
        )}
        <div className="space-y-1 text-sm">
          {data.democraticInfluence !== undefined && (
            <div className="flex justify-between">
              <span className="text-blue-400">Democratic:</span>
              <span className="text-white">{data.democraticInfluence.toFixed(0)}%</span>
            </div>
          )}
          {data.republicanInfluence !== undefined && (
            <div className="flex justify-between">
              <span className="text-red-400">Republican:</span>
              <span className="text-white">{data.republicanInfluence.toFixed(0)}%</span>
            </div>
          )}
          {data.independentInfluence !== undefined && data.independentInfluence > 0 && (
            <div className="flex justify-between">
              <span className="text-purple-400">Independent:</span>
              <span className="text-white">{data.independentInfluence.toFixed(0)}%</span>
            </div>
          )}
          {data.playerInfluence !== undefined && data.playerInfluence > 0 && (
            <div className="flex justify-between border-t border-slate-600 pt-1 mt-1">
              <span className="text-green-400">Your Influence:</span>
              <span className="text-white">{data.playerInfluence.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full" style={{ height }}>
      <ComposableMap
        projection="geoAlbersUsa"
        width={980}
        height={551}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const stateCode = stateAbbreviations[geo.id] || geo.id;
              const isHovered = hoveredState === stateCode;

              const geography = (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isHovered ? getStateHoverColor(stateCode) : getStateColor(stateCode)}
                  stroke="#1e293b"
                  strokeWidth={0.5}
                  onMouseEnter={() => setHoveredState(stateCode)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => handleStateClick(stateCode)}
                  className="cursor-pointer outline-none focus:outline-none"
                />
              );

              if (showTooltips) {
                return (
                  <Tooltip
                    key={geo.rsmKey}
                    content={renderTooltipContent(stateCode)}
                    placement="top"
                    classNames={{
                      content: 'bg-slate-800 border border-slate-700',
                    }}
                  >
                    {geography}
                  </Tooltip>
                );
              }

              return geography;
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
});

USMap.displayName = 'USMap';

export default USMap;
