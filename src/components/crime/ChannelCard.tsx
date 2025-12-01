/**
 * @fileoverview Crime Laundering Channel Card Component
 * @module components/crime/ChannelCard
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardBody, Progress } from '@heroui/react';
import { DollarSign, Clock, AlertTriangle } from 'lucide-react';
import type { LaunderingChannelDTO } from '@/lib/dto/crime';

interface ChannelCardProps {
  channel: LaunderingChannelDTO;
  onClick?: (channelId: string) => void;
}

const getRiskColor = (risk: number): 'success' | 'warning' | 'danger' => {
  if (risk >= 60) return 'danger';
  if (risk >= 30) return 'warning';
  return 'success';
};

export function ChannelCard({ channel, onClick }: ChannelCardProps) {
  const totalProcessed = 0; // Will be calculated from backend
  const detectedCount = 0; // Will be calculated from backend

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      isPressable={!!onClick}
      onPress={() => onClick?.(channel.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between w-full">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="text-md font-semibold">{channel.method}</h3>
              <p className="text-xs text-gray-500">Laundering Channel</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardBody className="pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Throughput Cap</div>
            <div className="text-sm font-semibold">${channel.throughputCap.toLocaleString()}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Fee</div>
            <div className="text-sm font-semibold">{channel.feePercent}%</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-xs text-gray-500">Latency</div>
            <div className="text-sm font-semibold text-blue-700">{channel.latencyDays} days</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Processed</div>
            <div className="text-sm font-semibold">${totalProcessed.toLocaleString()}</div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Detection Risk</span>
            <span className="text-xs font-semibold">{channel.detectionRisk}%</span>
          </div>
          <Progress value={channel.detectionRisk} color={getRiskColor(channel.detectionRisk)} size="sm" />
        </div>

        {detectedCount > 0 && (
          <div className="flex items-center space-x-1 text-xs text-red-600">
            <AlertTriangle className="h-3 w-3" />
            <span>{detectedCount} transaction(s) detected</span>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default ChannelCard;
