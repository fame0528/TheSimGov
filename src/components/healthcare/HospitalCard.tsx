/**
 * @fileoverview Hospital Card Component
 * @description Reusable component for displaying hospital information and metrics
 * @version 1.0.0
 * @created 2025-11-24
 * @lastModified 2025-11-24
 * @author ECHO v1.3.0 Healthcare Component Library
 */

'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Button,
  Progress
} from '@heroui/react';
import {
  Building2,
  Users,
  DollarSign,
  Activity,
  Star,
  MapPin,
  Phone,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface Hospital {
  _id: string;
  name: string;
  type: string;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  capacity: {
    beds: number;
    icuBeds: number;
    emergencyRooms: number;
  };
  status: 'operational' | 'under-construction' | 'closed';
  quality: {
    overall: number;
    patientSatisfaction: number;
    safetyRating: number;
  };
  financials: {
    annualRevenue: number;
    annualExpenses: number;
    profitMargin: number;
  };
  contact: {
    phone: string;
    email: string;
  };
  specialties: string[];
  lastUpdated: string;
}

interface HospitalCardProps {
  hospital: Hospital;
  onViewDetails?: (hospitalId: string) => void;
  onEdit?: (hospitalId: string) => void;
  compact?: boolean;
}

export default function HospitalCard({ hospital, onViewDetails, onEdit, compact = false }: HospitalCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800';
      case 'under-construction': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
      <CardBody className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-sm">{hospital.name}</h3>
              <p className="text-xs text-gray-600">{hospital.location.city}, {hospital.location.state}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="flat" className={getStatusColor(hospital.status)}>
              {hospital.status}
            </Badge>
            <div className={`text-sm font-semibold ${getQualityColor(hospital.quality.overall)}`}>
              {hospital.quality.overall}/100
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
            <Building2 className="h-10 w-10 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">{hospital.name}</h3>
              <p className="flex items-center mt-1 text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                {hospital.location.city}, {hospital.location.state}
              </p>
            </div>
          </div>
          <Badge variant="flat" className={getStatusColor(hospital.status)}>
            {hospital.status.replace('-', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Capacity</p>
              <p className="font-semibold">{hospital.capacity.beds} beds</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="font-semibold">${hospital.financials.annualRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Quality Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Quality Score</span>
            </div>
            <span className={`font-semibold ${getQualityColor(hospital.quality.overall)}`}>
              {hospital.quality.overall}/100
            </span>
          </div>
          <Progress value={hospital.quality.overall} className="h-2" />
        </div>

        {/* Specialties */}
        <div>
          <p className="text-sm font-medium mb-2">Specialties</p>
          <div className="flex flex-wrap gap-1">
            {hospital.specialties.slice(0, 3).map((specialty, index) => (
              <Badge key={index} variant="flat" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {hospital.specialties.length > 3 && (
              <Badge variant="flat" className="text-xs">
                +{hospital.specialties.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{hospital.contact.phone}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Updated {new Date(hospital.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button
            variant="bordered"
            size="sm"
            onClick={() => onViewDetails?.(hospital._id)}
            className="flex-1"
          >
            View Details
          </Button>
          <Button
            variant="bordered"
            size="sm"
            onClick={() => onEdit?.(hospital._id)}
          >
            Edit
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}