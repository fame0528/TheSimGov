/**
 * @fileoverview Pharmaceutical Card Component
 * @description Reusable component for displaying pharmaceutical drug information and pipeline status
 * @version 1.0.0
 * @created 2025-11-24
 * @lastModified 2025-11-24
 * @author ECHO v1.3.0 Healthcare Component Library
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardBody } from '@heroui/react';
import { Badge } from '@heroui/react';
import { Button } from '@heroui/react';
import { Progress } from '@heroui/react';
import {
  Pill,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Microscope,
  Shield
} from 'lucide-react';

interface Pharmaceutical {
  _id: string;
  name: string;
  genericName: string;
  therapeuticArea: string;
  pipeline: {
    phase: 'discovery' | 'preclinical' | 'phase1' | 'phase2' | 'phase3' | 'filing' | 'approved';
    status: 'active' | 'paused' | 'terminated' | 'approved';
    startDate: string;
    estimatedCompletion: string;
    successProbability: number;
  };
  patents: {
    primaryPatent: string;
    expires: string;
    additionalPatents: number;
  };
  financials: {
    developmentCost: number;
    projectedRevenue: number;
    marketValue: number;
  };
  regulatory: {
    fdaStatus: string;
    emaStatus: string;
    orphanDrug: boolean;
  };
  clinicalTrials: {
    totalTrials: number;
    completedTrials: number;
    ongoingTrials: number;
  };
  lastUpdated: string;
}

interface PharmaceuticalCardProps {
  pharmaceutical: Pharmaceutical;
  onViewDetails?: (pharmaId: string) => void;
  onEdit?: (pharmaId: string) => void;
  compact?: boolean;
}

export default function PharmaceuticalCard({
  pharmaceutical,
  onViewDetails,
  onEdit,
  compact = false
}: PharmaceuticalCardProps) {
  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'discovery': return 'bg-blue-100 text-blue-800';
      case 'preclinical': return 'bg-purple-100 text-purple-800';
      case 'phase1': return 'bg-yellow-100 text-yellow-800';
      case 'phase2': return 'bg-orange-100 text-orange-800';
      case 'phase3': return 'bg-red-100 text-red-800';
      case 'filing': return 'bg-indigo-100 text-indigo-800';
      case 'approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      case 'approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSuccessColor = (probability: number) => {
    if (probability >= 70) return 'text-green-600';
    if (probability >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPhaseProgress = (phase: string) => {
    const phases = ['discovery', 'preclinical', 'phase1', 'phase2', 'phase3', 'filing', 'approved'];
    const index = phases.indexOf(phase);
    return ((index + 1) / phases.length) * 100;
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Pill className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-semibold text-sm">{pharmaceutical.name}</h3>
                <p className="text-xs text-gray-600">{pharmaceutical.therapeuticArea}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getPhaseColor(pharmaceutical.pipeline.phase)}>
                {pharmaceutical.pipeline.phase}
              </Badge>
              <div className={`text-sm font-semibold ${getSuccessColor(pharmaceutical.pipeline.successProbability)}`}>
                {pharmaceutical.pipeline.successProbability}%
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Pill className="h-10 w-10 text-purple-600" />
            <div>
              <h3 className="text-lg">{pharmaceutical.name}</h3>
              <p className="flex items-center mt-1">
                <Target className="h-4 w-4 mr-1" />
                {pharmaceutical.therapeuticArea}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Badge className={getPhaseColor(pharmaceutical.pipeline.phase)}>
              {pharmaceutical.pipeline.phase.replace(/(\d)/, ' $1')}
            </Badge>
            <Badge className={getStatusColor(pharmaceutical.pipeline.status)}>
              {pharmaceutical.pipeline.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Pipeline Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Pipeline Progress</span>
            </div>
            <span className="text-sm text-gray-600">
              {getPhaseProgress(pharmaceutical.pipeline.phase).toFixed(0)}%
            </span>
          </div>
          <Progress value={getPhaseProgress(pharmaceutical.pipeline.phase)} className="h-2" />
        </div>

        {/* Success Probability */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Success Probability</span>
            </div>
            <span className={`font-semibold ${getSuccessColor(pharmaceutical.pipeline.successProbability)}`}>
              {pharmaceutical.pipeline.successProbability}%
            </span>
          </div>
          <Progress value={pharmaceutical.pipeline.successProbability} className="h-2" />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Market Value</p>
              <p className="font-semibold">${pharmaceutical.financials.marketValue.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Microscope className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Clinical Trials</p>
              <p className="font-semibold">{pharmaceutical.clinicalTrials.totalTrials}</p>
            </div>
          </div>
        </div>

        {/* Regulatory Status */}
        <div>
          <p className="text-sm font-medium mb-2">Regulatory Status</p>
          <div className="flex space-x-2">
            <Badge variant={pharmaceutical.regulatory.fdaStatus === 'approved' ? 'solid' : 'flat'}>
              FDA: {pharmaceutical.regulatory.fdaStatus}
            </Badge>
            <Badge variant={pharmaceutical.regulatory.emaStatus === 'approved' ? 'solid' : 'flat'}>
              EMA: {pharmaceutical.regulatory.emaStatus}
            </Badge>
            {pharmaceutical.regulatory.orphanDrug && (
              <Badge variant="flat" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Orphan Drug
              </Badge>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Started {new Date(pharmaceutical.pipeline.startDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Est. Complete {new Date(pharmaceutical.pipeline.estimatedCompletion).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button
            variant="bordered"
            size="sm"
            onClick={() => onViewDetails?.(pharmaceutical._id)}
            className="flex-1"
          >
            View Details
          </Button>
          <Button
            variant="bordered"
            size="sm"
            onClick={() => onEdit?.(pharmaceutical._id)}
          >
            Edit
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}