/**
 * @fileoverview Medical Device Management Component
 * @description Complete medical device catalog, FDA approval tracking, and lifecycle management
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
import { Plus, FileText, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';

/**
 * Medical Device Interface
 * Defines structure for medical device data from API
 */
interface MedicalDevice {
  _id: string;
  name: string;
  deviceType: 'diagnostic' | 'therapeutic' | 'monitoring' | 'surgical' | 'implantable';
  classification: 'class_i' | 'class_ii' | 'class_iii';
  intendedUse: string;
  regulatory: {
    fdaStatus: 'development' | 'premarket' | 'clinical_trials' | 'review' | 'approved' | 'monitoring';
    clearanceNumber?: string;
    approvalDate?: string;
  };
  market: {
    launchDate?: string;
    annualRevenue: number;
    marketShare: number;
  };
  reimbursement: {
    averageRate: number;
    coverage: string[];
  };
}

interface MedicalDeviceManagerProps {
  companyId: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * MedicalDeviceManager Component
 * Manages medical device catalog, FDA approvals, and device lifecycle
 * 
 * Features:
 * - Device catalog table with regulatory status
 * - FDA approval workflow tracking
 * - Create device modal with classification
 * - Revenue and market share metrics
 * - Device lifecycle management
 * 
 * @param companyId - ID of the company owning devices
 */
export default function MedicalDeviceManager({ companyId }: MedicalDeviceManagerProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedDevice, setSelectedDevice] = useState<MedicalDevice | null>(null);

  // Fetch devices using SWR
  const { data: devices, error, mutate } = useSWR<MedicalDevice[]>(
    `/api/healthcare/devices?company=${companyId}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  // Form state for new device
  const [formData, setFormData] = useState({
    name: '',
    deviceType: 'diagnostic' as const,
    classification: 'class_i' as const,
    intendedUse: '',
    fdaStatus: 'development' as const
  });

  /**
   * Handle device creation
   * Posts new device to API with optimistic UI update
   */
  const handleCreateDevice = async () => {
    try {
      const response = await fetch('/api/healthcare/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          company: companyId,
          regulatory: {
            fdaStatus: formData.fdaStatus
          },
          market: {
            annualRevenue: 0,
            marketShare: 0
          },
          reimbursement: {
            averageRate: 0,
            coverage: []
          }
        })
      });

      if (response.ok) {
        mutate(); // Revalidate data
        onClose();
        // Reset form
        setFormData({
          name: '',
          deviceType: 'diagnostic',
          classification: 'class_i',
          intendedUse: '',
          fdaStatus: 'development'
        });
      }
    } catch (error) {
      console.error('Error creating device:', error);
    }
  };

  /**
   * Get FDA status chip color
   */
  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'approved': return 'success';
      case 'review': return 'primary';
      case 'clinical_trials': return 'secondary';
      case 'development': return 'warning';
      default: return 'default';
    }
  };

  /**
   * Get FDA status icon
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'review': return <Clock className="h-4 w-4" />;
      case 'clinical_trials': return <FileText className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (error) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Error loading medical devices</p>
            <Button onClick={() => mutate()} className="mt-4">Retry</Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!devices) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading devices...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Calculate summary metrics
  const approvedDevices = devices.filter(d => d.regulatory.fdaStatus === 'approved').length;
  const totalRevenue = devices.reduce((sum, d) => sum + (d.market?.annualRevenue || 0), 0);
  const averageMarketShare = devices.length > 0
    ? devices.reduce((sum, d) => sum + (d.market?.marketShare || 0), 0) / devices.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Medical Device Catalog</h2>
          <p className="text-gray-600 mt-1">Manage devices, FDA approvals, and market performance</p>
        </div>
        <Button color="primary" onPress={onOpen} startContent={<Plus className="h-4 w-4" />}>
          New Device
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="text-sm text-gray-600">Total Devices</div>
            <div className="text-2xl font-bold mt-1">{devices.length}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-sm text-gray-600">FDA Approved</div>
            <div className="text-2xl font-bold mt-1 text-green-600">{approvedDevices}</div>
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
            <div className="text-sm text-gray-600">Avg Market Share</div>
            <div className="text-2xl font-bold mt-1">{averageMarketShare.toFixed(1)}%</div>
          </CardBody>
        </Card>
      </div>

      {/* Device Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Device Portfolio</h3>
        </CardHeader>
        <CardBody>
          <Table aria-label="Medical devices table">
            <TableHeader>
              <TableColumn>DEVICE NAME</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>CLASSIFICATION</TableColumn>
              <TableColumn>FDA STATUS</TableColumn>
              <TableColumn>REVENUE</TableColumn>
              <TableColumn>MARKET SHARE</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No devices yet. Create your first medical device.">
              {devices.map((device) => (
                <TableRow key={device._id}>
                  <TableCell>
                    <div className="font-medium">{device.name}</div>
                    <div className="text-sm text-gray-500">{device.intendedUse}</div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{device.deviceType.replace('_', ' ')}</span>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat">
                      {device.classification.toUpperCase().replace('_', ' ')}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={getStatusColor(device.regulatory.fdaStatus)}
                      variant="flat"
                      startContent={getStatusIcon(device.regulatory.fdaStatus)}
                    >
                      {device.regulatory.fdaStatus.replace('_', ' ').toUpperCase()}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    ${(device.market?.annualRevenue || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={device.market?.marketShare || 0}
                        className="max-w-[100px]"
                        size="sm"
                      />
                      <span className="text-sm">{(device.market?.marketShare || 0).toFixed(1)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Create Device Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>Create New Medical Device</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Device Name"
                placeholder="Enter device name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
              />

              <Select
                label="Device Type"
                selectedKeys={[formData.deviceType]}
                onChange={(e) => setFormData({ ...formData, deviceType: e.target.value as typeof formData.deviceType })}
                isRequired
              >
                <SelectItem key="diagnostic">Diagnostic</SelectItem>
                <SelectItem key="therapeutic">Therapeutic</SelectItem>
                <SelectItem key="monitoring">Monitoring</SelectItem>
                <SelectItem key="surgical">Surgical</SelectItem>
                <SelectItem key="implantable">Implantable</SelectItem>
              </Select>

              <Select
                label="FDA Classification"
                selectedKeys={[formData.classification]}
                onChange={(e) => setFormData({ ...formData, classification: e.target.value as typeof formData.classification })}
                isRequired
              >
                <SelectItem key="class_i">Class I (Low Risk)</SelectItem>
                <SelectItem key="class_ii">Class II (Moderate Risk)</SelectItem>
                <SelectItem key="class_iii">Class III (High Risk)</SelectItem>
              </Select>

              <Input
                label="Intended Use"
                placeholder="Describe the device's intended medical purpose"
                value={formData.intendedUse}
                onChange={(e) => setFormData({ ...formData, intendedUse: e.target.value })}
                isRequired
              />

              <Select
                label="FDA Status"
                selectedKeys={[formData.fdaStatus]}
                onChange={(e) => setFormData({ ...formData, fdaStatus: e.target.value as typeof formData.fdaStatus })}
                isRequired
              >
                <SelectItem key="development">Development</SelectItem>
                <SelectItem key="premarket">Pre-market</SelectItem>
                <SelectItem key="clinical_trials">Clinical Trials</SelectItem>
                <SelectItem key="review">FDA Review</SelectItem>
                <SelectItem key="approved">Approved</SelectItem>
                <SelectItem key="monitoring">Post-Market Monitoring</SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>Cancel</Button>
            <Button
              color="primary"
              onPress={handleCreateDevice}
              isDisabled={!formData.name || !formData.intendedUse}
            >
              Create Device
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
