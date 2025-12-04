/**
 * @fileoverview Hospital Operations Management Component
 * @description Hospital oversight, department management, and capacity planning
 * @version 1.0.0
 * @created 2025-11-25
 * @lastModified 2025-11-25
 * @author ECHO v1.3.0 Healthcare Component Library
 */

'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Chip,
  Progress,
  useDisclosure,
  Tabs,
  Tab
} from '@heroui/react';
import { Plus, Building2, Bed, Users, Award, TrendingUp, AlertCircle } from 'lucide-react';

interface Hospital {
  _id: string;
  name: string;
  location: {
    city: string;
    state: string;
  };
  hospitalType: 'general' | 'specialized' | 'teaching' | 'research' | 'trauma' | 'pediatric';
  capacity: {
    totalBeds: number;
    occupiedBeds: number;
    icuBeds: number;
    emergencyBeds: number;
  };
  departments: Array<{
    name: string;
    head: string;
    staff: number;
  }>;
  performance: {
    patientSatisfaction: number;
    readmissionRate: number;
    mortalityRate: number;
  };
  quality: {
    overall: number;
    safetyScore: number;
    certifications: string[];
  };
  financials: {
    annualRevenue: number;
    operatingMargin: number;
  };
}

interface HospitalOperationsProps {
  companyId: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * HospitalOperations Component
 * Comprehensive hospital management and operational oversight
 * 
 * Features:
 * - Hospital overview cards with metrics
 * - Department management
 * - Bed capacity tracking
 * - Quality and safety monitoring
 * - Financial performance
 * 
 * @param companyId - ID of the company owning hospitals
 */
export default function HospitalOperations({ companyId }: HospitalOperationsProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: hospitals, error, mutate } = useSWR<Hospital[]>(
    `/api/healthcare/hospitals?company=${companyId}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    hospitalType: 'general' as const,
    totalBeds: 100,
    icuBeds: 10
  });

  const handleCreateHospital = async () => {
    try {
      const response = await fetch('/api/healthcare/hospitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          company: companyId,
          location: {
            city: formData.city,
            state: formData.state
          },
          capacity: {
            totalBeds: formData.totalBeds,
            occupiedBeds: 0,
            icuBeds: formData.icuBeds,
            emergencyBeds: Math.floor(formData.totalBeds * 0.1)
          },
          departments: [],
          performance: {
            patientSatisfaction: 0,
            readmissionRate: 0,
            mortalityRate: 0
          },
          quality: {
            overall: 0,
            safetyScore: 0,
            certifications: []
          },
          financials: {
            annualRevenue: 0,
            operatingMargin: 0
          }
        })
      });

      if (response.ok) {
        mutate();
        onClose();
        setFormData({
          name: '',
          city: '',
          state: '',
          hospitalType: 'general',
          totalBeds: 100,
          icuBeds: 10
        });
      }
    } catch (error) {
      console.error('Error creating hospital:', error);
    }
  };

  if (!hospitals) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading hospitals...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Calculate summary metrics
  const totalBeds = hospitals.reduce((sum, h) => sum + (h.capacity?.totalBeds || 0), 0);
  const totalRevenue = hospitals.reduce((sum, h) => sum + (h.financials?.annualRevenue || 0), 0);
  const avgQuality = hospitals.length > 0
    ? hospitals.reduce((sum, h) => sum + (h.quality?.overall || 0), 0) / hospitals.length
    : 0;
  const avgOccupancy = hospitals.length > 0
    ? hospitals.reduce((sum, h) => {
        const occupied = h.capacity?.occupiedBeds || 0;
        const total = h.capacity?.totalBeds || 1;
        return sum + (occupied / total * 100);
      }, 0) / hospitals.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hospital Operations</h2>
          <p className="text-gray-600 mt-1">Manage hospital network and operational performance</p>
        </div>
        <Button color="primary" onPress={onOpen} startContent={<Plus className="h-4 w-4" />}>
          New Hospital
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              <div className="text-sm text-gray-600">Total Hospitals</div>
            </div>
            <div className="text-2xl font-bold mt-1">{hospitals.length}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <Bed className="h-5 w-5 text-green-500" />
              <div className="text-sm text-gray-600">Total Beds</div>
            </div>
            <div className="text-2xl font-bold mt-1">{totalBeds.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">
              {avgOccupancy.toFixed(0)}% avg occupancy
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div className="text-sm text-gray-600">Annual Revenue</div>
            </div>
            <div className="text-2xl font-bold mt-1">${totalRevenue.toLocaleString()}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <div className="text-sm text-gray-600">Avg Quality Score</div>
            </div>
            <div className="text-2xl font-bold mt-1">{avgQuality.toFixed(1)}</div>
            <Progress
              value={avgQuality}
              className="mt-2"
              size="sm"
              color={avgQuality > 80 ? 'success' : avgQuality > 60 ? 'primary' : 'warning'}
            />
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            <Tab key="overview" title="Overview" />
            <Tab key="capacity" title="Capacity" />
            <Tab key="quality" title="Quality & Safety" />
          </Tabs>
        </CardHeader>
        <CardBody>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hospitals.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No hospitals yet. Create your first hospital.
                </div>
              ) : (
                hospitals.map((hospital) => (
                  <Card key={hospital._id}>
                    <CardBody>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-lg">{hospital.name}</h4>
                          <p className="text-sm text-gray-500">
                            {hospital.location.city}, {hospital.location.state}
                          </p>
                          <Chip size="sm" variant="flat" className="mt-2">
                            {hospital.hospitalType.replace('_', ' ').toUpperCase()}
                          </Chip>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold">{hospital.capacity?.totalBeds || 0}</div>
                            <div className="text-xs text-gray-500">Total Beds</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-blue-600">{hospital.capacity?.occupiedBeds || 0}</div>
                            <div className="text-xs text-gray-500">Occupied</div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Quality Score</span>
                            <span>{(hospital.quality?.overall || 0).toFixed(0)}</span>
                          </div>
                          <Progress value={hospital.quality?.overall || 0} size="sm" color="primary" />
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'capacity' && (
            <div className="space-y-4">
              {hospitals.map((hospital) => {
                const occupancyRate = (hospital.capacity?.occupiedBeds || 0) / (hospital.capacity?.totalBeds || 1) * 100;
                return (
                  <Card key={hospital._id}>
                    <CardBody>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold">{hospital.name}</h4>
                          <p className="text-sm text-gray-500">
                            {hospital.location.city}, {hospital.location.state}
                          </p>
                        </div>
                        <Chip
                          color={occupancyRate > 90 ? 'danger' : occupancyRate > 75 ? 'warning' : 'success'}
                          variant="flat"
                        >
                          {occupancyRate.toFixed(0)}% Occupied
                        </Chip>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold">{hospital.capacity?.totalBeds || 0}</div>
                          <div className="text-sm text-gray-500">Total Beds</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{hospital.capacity?.occupiedBeds || 0}</div>
                          <div className="text-sm text-gray-500">Occupied</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">{hospital.capacity?.icuBeds || 0}</div>
                          <div className="text-sm text-gray-500">ICU Beds</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-orange-600">{hospital.capacity?.emergencyBeds || 0}</div>
                          <div className="text-sm text-gray-500">Emergency</div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}

          {activeTab === 'quality' && (
            <div className="space-y-4">
              {hospitals.map((hospital) => (
                <Card key={hospital._id}>
                  <CardBody>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">{hospital.name}</h4>
                        <p className="text-sm text-gray-500">Quality Metrics</p>
                      </div>
                      <Chip
                        color={
                          (hospital.quality?.overall || 0) > 80 ? 'success' :
                          (hospital.quality?.overall || 0) > 60 ? 'primary' : 'warning'
                        }
                        variant="flat"
                      >
                        Score: {(hospital.quality?.overall || 0).toFixed(0)}
                      </Chip>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Safety Score</span>
                          <span className="text-sm font-medium">{(hospital.quality?.safetyScore || 0).toFixed(0)}</span>
                        </div>
                        <Progress value={hospital.quality?.safetyScore || 0} size="sm" color="success" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Patient Satisfaction</span>
                          <span className="text-sm font-medium">{(hospital.performance?.patientSatisfaction || 0).toFixed(0)}%</span>
                        </div>
                        <Progress value={hospital.performance?.patientSatisfaction || 0} size="sm" color="primary" />
                      </div>
                      {hospital.quality?.certifications && hospital.quality.certifications.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {hospital.quality.certifications.map((cert, idx) => (
                            <Chip key={idx} size="sm" variant="flat" color="secondary">
                              {cert}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create Hospital Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>Create New Hospital</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Hospital Name"
                placeholder="Enter hospital name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  isRequired
                />
                <Input
                  label="State"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  isRequired
                />
              </div>

              <Select
                label="Hospital Type"
                selectedKeys={[formData.hospitalType]}
                onChange={(e) => setFormData({ ...formData, hospitalType: e.target.value as typeof formData.hospitalType })}
                isRequired
              >
                <SelectItem key="general">General Hospital</SelectItem>
                <SelectItem key="specialized">Specialized</SelectItem>
                <SelectItem key="teaching">Teaching Hospital</SelectItem>
                <SelectItem key="research">Research Hospital</SelectItem>
                <SelectItem key="trauma">Trauma Center</SelectItem>
                <SelectItem key="pediatric">Pediatric Hospital</SelectItem>
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Total Beds"
                  type="number"
                  placeholder="100"
                  value={formData.totalBeds.toString()}
                  onChange={(e) => setFormData({ ...formData, totalBeds: parseInt(e.target.value) || 100 })}
                  isRequired
                />
                <Input
                  label="ICU Beds"
                  type="number"
                  placeholder="10"
                  value={formData.icuBeds.toString()}
                  onChange={(e) => setFormData({ ...formData, icuBeds: parseInt(e.target.value) || 10 })}
                  isRequired
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>Cancel</Button>
            <Button
              color="primary"
              onPress={handleCreateHospital}
              isDisabled={!formData.name || !formData.city || !formData.state}
            >
              Create Hospital
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
