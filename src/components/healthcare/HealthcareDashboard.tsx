/**
 * @fileoverview Healthcare Industry Dashboard Component
 * @description Main dashboard for healthcare industry management and monitoring
 * @version 1.0.0
 * @created 2025-11-24
 * @lastModified 2025-11-24
 * @author ECHO v1.3.0 Healthcare Component Library
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Tabs,
  Tab,
  Badge,
  Button,
  Progress
} from '@heroui/react';
import {
  Building2,
  Stethoscope,
  Pill,
  Microscope,
  Shield,
  Activity,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

// Types for healthcare data
interface HealthcareMetrics {
  hospitals: {
    total: number;
    operational: number;
    averageQuality: number;
    totalRevenue: number;
  };
  clinics: {
    total: number;
    operational: number;
    averageEfficiency: number;
    totalRevenue: number;
  };
  pharmaceuticals: {
    total: number;
    inDevelopment: number;
    approved: number;
    totalValue: number;
  };
  devices: {
    total: number;
    approved: number;
    totalRevenue: number;
    averageReimbursement: number;
  };
  research: {
    total: number;
    active: number;
    completed: number;
    successRate: number;
  };
  insurance: {
    total: number;
    totalMembers: number;
    totalPremiums: number;
    claimRatio: number;
  };
}

interface HealthcareDashboardProps {
  companyId?: string;
  onSectorSelect?: (sector: string) => void;
}

export default function HealthcareDashboard({ companyId, onSectorSelect }: HealthcareDashboardProps) {
  const [metrics, setMetrics] = useState<HealthcareMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchHealthcareMetrics();
  }, [companyId]);

  const fetchHealthcareMetrics = async () => {
    try {
      setLoading(true);
      // Fetch metrics from all healthcare APIs
      const [
        hospitalsRes,
        clinicsRes,
        pharmaRes,
        devicesRes,
        researchRes,
        insuranceRes
      ] = await Promise.all([
        fetch(`/api/healthcare/hospitals?company=${companyId}`),
        fetch(`/api/healthcare/clinics?company=${companyId}`),
        fetch(`/api/healthcare/pharmaceuticals?company=${companyId}`),
        fetch(`/api/healthcare/devices?company=${companyId}`),
        fetch(`/api/healthcare/research?company=${companyId}`),
        fetch(`/api/healthcare/insurance?company=${companyId}`)
      ]);

      const [
        hospitals,
        clinics,
        pharma,
        devices,
        research,
        insurance
      ] = await Promise.all([
        hospitalsRes.json(),
        clinicsRes.json(),
        pharmaRes.json(),
        devicesRes.json(),
        researchRes.json(),
        insuranceRes.json()
      ]);

      // Calculate aggregated metrics
      const aggregatedMetrics: HealthcareMetrics = {
        hospitals: {
          total: hospitals.length,
          operational: hospitals.filter((h: any) => h.status === 'operational').length,
          averageQuality: hospitals.reduce((sum: number, h: any) => sum + (h.quality?.overall || 0), 0) / hospitals.length || 0,
          totalRevenue: hospitals.reduce((sum: number, h: any) => sum + (h.financials?.annualRevenue || 0), 0)
        },
        clinics: {
          total: clinics.length,
          operational: clinics.filter((c: any) => c.status === 'operational').length,
          averageEfficiency: clinics.reduce((sum: number, c: any) => sum + (c.performance?.efficiency || 0), 0) / clinics.length || 0,
          totalRevenue: clinics.reduce((sum: number, c: any) => sum + (c.financials?.annualRevenue || 0), 0)
        },
        pharmaceuticals: {
          total: pharma.length,
          inDevelopment: pharma.filter((p: any) => p.pipeline?.status === 'development').length,
          approved: pharma.filter((p: any) => p.pipeline?.status === 'approved').length,
          totalValue: pharma.reduce((sum: number, p: any) => sum + (p.financials?.marketValue || 0), 0)
        },
        devices: {
          total: devices.length,
          approved: devices.filter((d: any) => d.regulatory?.status === 'approved').length,
          totalRevenue: devices.reduce((sum: number, d: any) => sum + (d.financials?.annualRevenue || 0), 0),
          averageReimbursement: devices.reduce((sum: number, d: any) => sum + (d.reimbursement?.rate || 0), 0) / devices.length || 0
        },
        research: {
          total: research.length,
          active: research.filter((r: any) => r.status === 'active').length,
          completed: research.filter((r: any) => r.status === 'completed').length,
          successRate: research.filter((r: any) => r.results?.success).length / research.length * 100 || 0
        },
        insurance: {
          total: insurance.length,
          totalMembers: insurance.reduce((sum: number, i: any) => sum + (i.enrollment?.totalMembers || 0), 0),
          totalPremiums: insurance.reduce((sum: number, i: any) => sum + (i.financials?.annualPremiumRevenue || 0), 0),
          claimRatio: insurance.reduce((sum: number, i: any) => sum + (i.claims?.totalPaid || 0), 0) / insurance.reduce((sum: number, i: any) => sum + (i.financials?.annualPremiumRevenue || 0), 0) * 100 || 0
        }
      };

      setMetrics(aggregatedMetrics);
    } catch (error) {
      console.error('Error fetching healthcare metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading healthcare metrics...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">Unable to load healthcare metrics</p>
            <Button onClick={fetchHealthcareMetrics} className="mt-4">
              Retry
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Healthcare Industry Dashboard</h1>
          <p className="text-gray-400 mt-1">Comprehensive healthcare sector management and analytics</p>
        </div>
        <div className="flex space-x-2">
          <Badge variant="flat" className="px-3 py-1 bg-green-900/30 text-green-400">
            <Activity className="h-4 w-4 mr-1" />
            Operational
          </Badge>
          <Button onClick={fetchHealthcareMetrics} variant="bordered" className="border-slate-600 text-gray-300">
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards - AAA Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-4 bg-slate-800/50 border border-slate-700">
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-xl bg-blue-900/30 text-blue-400">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400">Total Facilities</p>
            <p className="text-2xl font-bold mt-1 text-white">
              {metrics.hospitals.total + metrics.clinics.total}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.hospitals.operational + metrics.clinics.operational} operational
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-slate-800/50 border border-slate-700">
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-xl bg-green-900/30 text-green-400">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400">Total Revenue</p>
            <p className="text-2xl font-bold mt-1 text-white">
              ${(metrics.hospitals.totalRevenue + metrics.clinics.totalRevenue + metrics.devices.totalRevenue + metrics.insurance.totalPremiums).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Annual healthcare revenue
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-slate-800/50 border border-slate-700">
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-xl bg-purple-900/30 text-purple-400">
              <Microscope className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400">Active Research</p>
            <p className="text-2xl font-bold mt-1 text-white">{metrics.research.active}</p>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.research.successRate.toFixed(1)}% success rate
            </p>
          </div>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tab key="overview" title="Overview">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Healthcare Portfolio Summary */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Healthcare Portfolio</h3>
                  <p className="text-sm text-gray-600">Complete overview of healthcare assets</p>
                </CardHeader>
                <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <span>Hospitals</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{metrics.hospitals.total}</div>
                    <div className="text-sm text-gray-500">{metrics.hospitals.operational} operational</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="h-5 w-5 text-green-600" />
                    <span>Clinics</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{metrics.clinics.total}</div>
                    <div className="text-sm text-gray-500">{metrics.clinics.operational} operational</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Pill className="h-5 w-5 text-purple-600" />
                    <span>Pharmaceuticals</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{metrics.pharmaceuticals.total}</div>
                    <div className="text-sm text-gray-500">{metrics.pharmaceuticals.approved} approved</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    <span>Insurance</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{metrics.insurance.total}</div>
                    <div className="text-sm text-gray-500">{metrics.insurance.totalMembers.toLocaleString()} members</div>
                  </div>
                </div>
                </CardBody>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Performance Metrics</h3>
                <p className="text-sm text-gray-600">Key performance indicators</p>
              </CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Hospital Quality</span>
                    <span>{metrics.hospitals.averageQuality.toFixed(1)}/100</span>
                  </div>
                  <Progress value={metrics.hospitals.averageQuality} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Clinic Efficiency</span>
                    <span>{metrics.clinics.averageEfficiency.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.clinics.averageEfficiency} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Research Success Rate</span>
                    <span>{metrics.research.successRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.research.successRate} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Insurance Claim Ratio</span>
                    <span>{metrics.insurance.claimRatio.toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(metrics.insurance.claimRatio, 100)} className="h-2" />
                </div>
              </CardBody>
            </Card>
          </div>
          </div>
        </Tab>

        {/* Individual sector tabs would go here - simplified for brevity */}
        <Tab key="hospitals" title="Hospitals">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Hospital Management</h3>
              <p className="text-sm text-gray-600">Manage hospital facilities and operations</p>
            </CardHeader>
            <CardBody>
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Hospital management interface coming soon</p>
                <Button onClick={() => onSectorSelect?.('hospitals')}>
                  Manage Hospitals
                </Button>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="clinics" title="Clinics">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Clinic Management</h3>
              <p className="text-sm text-gray-600">Manage clinic operations and patient care</p>
            </CardHeader>
            <CardBody>
              <div className="text-center py-8">
                <Stethoscope className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Clinic management interface coming soon</p>
                <Button onClick={() => onSectorSelect?.('clinics')}>
                  Manage Clinics
                </Button>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="pharma" title="Pharma">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Pharmaceutical Management</h3>
              <p className="text-sm text-gray-600">Manage drug development and pipeline</p>
            </CardHeader>
            <CardBody>
              <div className="text-center py-8">
                <Pill className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Pharmaceutical management interface coming soon</p>
                <Button onClick={() => onSectorSelect?.('pharmaceuticals')}>
                  Manage Pharmaceuticals
                </Button>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="devices" title="Devices">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Medical Device Management</h3>
              <p className="text-sm text-gray-600">Manage medical devices and regulatory compliance</p>
            </CardHeader>
            <CardBody>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Medical device management interface coming soon</p>
                <Button onClick={() => onSectorSelect?.('devices')}>
                  Manage Devices
                </Button>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="research" title="Research">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Research Management</h3>
              <p className="text-sm text-gray-600">Manage clinical trials and research projects</p>
            </CardHeader>
            <CardBody>
              <div className="text-center py-8">
                <Microscope className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Research management interface coming soon</p>
                <Button onClick={() => onSectorSelect?.('research')}>
                  Manage Research
                </Button>
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}