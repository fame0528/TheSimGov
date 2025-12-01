/**
 * @fileoverview Crime Heat Display Component
 * @module components/crime/HeatDisplay
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardBody, Progress, Chip } from '@heroui/react';
import { Flame, ShieldAlert, Eye, TrendingUp } from 'lucide-react';
import type { HeatLevelDTO } from '@/lib/dto/crime';

interface HeatDisplayProps {
  heat: HeatLevelDTO;
  compact?: boolean;
}

const getHeatColor = (level: number): 'success' | 'warning' | 'danger' => {
  if (level >= 60) return 'danger';
  if (level >= 40) return 'warning';
  return 'success';
};

const getHeatLabel = (level: number): string => {
  if (level >= 80) return 'Critical';
  if (level >= 60) return 'High';
  if (level >= 40) return 'Elevated';
  if (level >= 20) return 'Moderate';
  return 'Low';
};

export function HeatDisplay({ heat, compact = false }: HeatDisplayProps) {
  const heatColor = getHeatColor(heat.current);
  const heatLabel = getHeatLabel(heat.current);

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-red-50">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Flame className={`h-6 w-6 ${heat.current >= 60 ? 'text-red-600' : 'text-orange-600'}`} />
              <div>
                <div className="text-sm text-gray-600">{heat.scope} Heat</div>
                <div className="text-2xl font-bold">{heat.current}%</div>
              </div>
            </div>
            <Chip color={heatColor} variant="flat">
              {heatLabel}
            </Chip>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-red-50">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-3">
          <Flame className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="text-lg font-semibold">Heat Level</h3>
            <p className="text-sm text-gray-500">{heat.scope}: {heat.scopeId}</p>
          </div>
        </div>
      </CardHeader>

      <CardBody className="pt-0 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Current Heat</span>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-red-700">{heat.current}%</span>
              <Chip size="sm" color={heatColor} variant="flat">
                {heatLabel}
              </Chip>
            </div>
          </div>
          <Progress 
            value={heat.current} 
            color={heatColor}
            size="lg"
            className="h-3"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-yellow-50 rounded border border-yellow-200">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Eye className="h-3 w-3 text-yellow-700" />
            </div>
            <div className="text-xs text-gray-500">Surveillance</div>
            <div className="text-sm font-semibold text-yellow-700">40%</div>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded border border-orange-200">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <ShieldAlert className="h-3 w-3 text-orange-700" />
            </div>
            <div className="text-xs text-gray-500">Investigation</div>
            <div className="text-sm font-semibold text-orange-700">70%</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded border border-red-200">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Flame className="h-3 w-3 text-red-700" />
            </div>
            <div className="text-xs text-gray-500">Raid</div>
            <div className="text-sm font-semibold text-red-700">90%</div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default HeatDisplay;
