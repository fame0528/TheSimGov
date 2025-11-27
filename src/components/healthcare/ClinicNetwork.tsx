/**
 * @fileoverview Clinic Network Management Component
 * @description Clinic creation, patient volume tracking, and revenue analytics
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
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
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
  useDisclosure
} from '@heroui/react';
import { Plus, MapPin, Users, DollarSign, TrendingUp, Activity } from 'lucide-react';

interface Clinic {
  _id: string;
  name: string;
  location: {
    city: string;
    state: string;
  };
  clinicType: 'primary_care' | 'urgent_care' | 'specialty' | 'outpatient' | 'diagnostic';
  specializations: string[];
  capacity: {
    dailyPatients: number;
    currentPatients: number;
  };
  performance: {
    patientVolume: number;
    efficiency: number;
  };
  financials: {
    annualRevenue: number;
    revenuePerPatient: number;
  };
}

interface ClinicNetworkProps {
  companyId: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * ClinicNetwork Component
 * Manages clinic network operations and patient care
 * 
 * Features:
 * - Clinic list with location and metrics
 * - Patient volume tracking
 * - Revenue per patient analytics
 * - Capacity utilization monitoring
 * 
 * @param companyId - ID of the company owning clinics
 */
export default function ClinicNetwork({ companyId }: ClinicNetworkProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const { data: clinics, error, mutate } = useSWR<Clinic[]>(
    `/api/healthcare/clinics?company=${companyId}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    clinicType: 'primary_care' as const,
    dailyCapacity: 50
  });

  const handleCreateClinic = async () => {
    try {
      const response = await fetch('/api/healthcare/clinics', {
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
            dailyPatients: formData.dailyCapacity,
            currentPatients: 0
          },
          performance: {
            patientVolume: 0,
            efficiency: 0
          },
          financials: {
            annualRevenue: 0,
            revenuePerPatient: 0
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
          clinicType: 'primary_care',
          dailyCapacity: 50
        });
      }
    } catch (error) {
      console.error('Error creating clinic:', error);
    }
  };

  if (!clinics) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading clinics...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  const totalRevenue = clinics.reduce((sum, c) => sum + (c.financials?.annualRevenue || 0), 0);
  const totalPatients = clinics.reduce((sum, c) => sum + (c.performance?.patientVolume || 0), 0);
  const avgEfficiency = clinics.length > 0
    ? clinics.reduce((sum, c) => sum + (c.performance?.efficiency || 0), 0) / clinics.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clinic Network</h2>
          <p className="text-gray-600 mt-1">Manage clinic operations and patient care</p>
        </div>
        <Button color="primary" onPress={onOpen} startContent={<Plus className="h-4 w-4" />}>
          New Clinic
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="text-sm text-gray-600">Total Clinics</div>
            <div className="text-2xl font-bold mt-1">{clinics.length}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-sm text-gray-600">Total Patients</div>
            <div className="text-2xl font-bold mt-1">{totalPatients.toLocaleString()}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-sm text-gray-600">Total Revenue</div>
            <div className="text-2xl font-bold mt-1">${totalRevenue.toLocaleString()}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-sm text-gray-600">Avg Efficiency</div>
            <div className="text-2xl font-bold mt-1">{avgEfficiency.toFixed(1)}%</div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Clinic Portfolio</h3>
        </CardHeader>
        <CardBody>
          <Table aria-label="Clinics table">
            <TableHeader>
              <TableColumn>CLINIC NAME</TableColumn>
              <TableColumn>LOCATION</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>PATIENT VOLUME</TableColumn>
              <TableColumn>REVENUE</TableColumn>
              <TableColumn>EFFICIENCY</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No clinics yet. Create your first clinic.">
              {clinics.map((clinic) => (
                <TableRow key={clinic._id}>
                  <TableCell>
                    <div className="font-medium">{clinic.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{clinic.location.city}, {clinic.location.state}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat">
                      {clinic.clinicType.replace('_', ' ').toUpperCase()}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>{(clinic.performance?.patientVolume || 0).toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    ${(clinic.financials?.annualRevenue || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={clinic.performance?.efficiency || 0}
                        className="max-w-[100px]"
                        size="sm"
                        color={
                          (clinic.performance?.efficiency || 0) > 80 ? 'success' :
                          (clinic.performance?.efficiency || 0) > 60 ? 'primary' : 'warning'
                        }
                      />
                      <span className="text-sm">{(clinic.performance?.efficiency || 0).toFixed(0)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>Create New Clinic</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Clinic Name"
                placeholder="Enter clinic name"
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
                label="Clinic Type"
                selectedKeys={[formData.clinicType]}
                onChange={(e) => setFormData({ ...formData, clinicType: e.target.value as any })}
                isRequired
              >
                <SelectItem key="primary_care">Primary Care</SelectItem>
                <SelectItem key="urgent_care">Urgent Care</SelectItem>
                <SelectItem key="specialty">Specialty</SelectItem>
                <SelectItem key="outpatient">Outpatient</SelectItem>
                <SelectItem key="diagnostic">Diagnostic</SelectItem>
              </Select>

              <Input
                label="Daily Patient Capacity"
                type="number"
                placeholder="50"
                value={formData.dailyCapacity.toString()}
                onChange={(e) => setFormData({ ...formData, dailyCapacity: parseInt(e.target.value) || 50 })}
                isRequired
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>Cancel</Button>
            <Button
              color="primary"
              onPress={handleCreateClinic}
              isDisabled={!formData.name || !formData.city || !formData.state}
            >
              Create Clinic
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
