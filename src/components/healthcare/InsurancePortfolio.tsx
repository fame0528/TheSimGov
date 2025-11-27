/**
 * @fileoverview Insurance Portfolio Management Component
 * @description Insurance plan management, claims tracking, and risk assessment
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
import { Plus, Shield, Users, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

interface InsuranceCompany {
  _id: string;
  name: string;
  insuranceType: 'HMO' | 'PPO' | 'EPO' | 'POS' | 'Medicare' | 'Medicaid' | 'ACA';
  marketSegment: 'individual' | 'group' | 'medicare' | 'medicaid' | 'exchange';
  enrollment: {
    totalMembers: number;
    individual: number;
    group: number;
  };
  financials: {
    annualPremiumRevenue: number;
    annualClaimsPaid: number;
    administrativeCosts: number;
  };
  claims: {
    totalClaims: number;
    averageClaimAmount: number;
    denialRate: number;
  };
  quality: {
    ncqaRating: string;
    starRating: number;
    satisfactionScore: number;
  };
  metrics?: {
    claimRatios: number;
    underwritingProfit: number;
    riskPoolStability: string;
    memberSatisfaction: number;
  };
}

interface InsurancePortfolioProps {
  companyId: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * InsurancePortfolio Component
 * Comprehensive insurance plan and risk management
 * 
 * Features:
 * - Insurance plan catalog
 * - Claims processing dashboard
 * - Risk pool monitoring
 * - Premium optimization
 * - Member satisfaction tracking
 * 
 * @param companyId - ID of the company owning insurance plans
 */
export default function InsurancePortfolio({ companyId }: InsurancePortfolioProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { data: response, error, mutate } = useSWR<{ insurance: InsuranceCompany[]; summary: any }>(
    `/api/healthcare/insurance?company=${companyId}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const [formData, setFormData] = useState({
    name: '',
    insuranceType: 'PPO' as const,
    marketSegment: 'group' as const
  });

  const handleCreateInsurance = async () => {
    try {
      const apiResponse = await fetch('/api/healthcare/insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          company: companyId,
          enrollment: {
            totalMembers: 0,
            individual: 0,
            group: 0
          },
          financials: {
            annualPremiumRevenue: 0,
            annualClaimsPaid: 0,
            administrativeCosts: 0
          },
          claims: {
            totalClaims: 0,
            averageClaimAmount: 0,
            denialRate: 0
          },
          quality: {
            ncqaRating: 'Not Rated',
            starRating: 0,
            satisfactionScore: 0
          }
        })
      });

      if (apiResponse.ok) {
        mutate();
        onClose();
        setFormData({
          name: '',
          insuranceType: 'PPO',
          marketSegment: 'group'
        });
      }
    } catch (error) {
      console.error('Error creating insurance:', error);
    }
  };

  if (!response) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading insurance portfolio...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  const { insurance = [], summary = {} } = response;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Insurance Portfolio</h2>
          <p className="text-gray-600 mt-1">Manage insurance plans and risk assessment</p>
        </div>
        <Button color="primary" onPress={onOpen} startContent={<Plus className="h-4 w-4" />}>
          New Insurance Plan
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <div className="text-sm text-gray-600">Total Plans</div>
            </div>
            <div className="text-2xl font-bold mt-1">{summary.totalCompanies || insurance.length}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <div className="text-sm text-gray-600">Total Members</div>
            </div>
            <div className="text-2xl font-bold mt-1">{(summary.totalMembers || 0).toLocaleString()}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              <div className="text-sm text-gray-600">Premium Revenue</div>
            </div>
            <div className="text-2xl font-bold mt-1">${(summary.totalPremiumRevenue || 0).toLocaleString()}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div className="text-sm text-gray-600">Avg Claim Ratio</div>
            </div>
            <div className="text-2xl font-bold mt-1">{(summary.averageClaimRatio || 0).toFixed(1)}%</div>
            {(summary.averageClaimRatio || 0) > 85 && (
              <div className="flex items-center gap-1 mt-1 text-sm text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                High risk
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Insurance Plans Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Insurance Plans</h3>
        </CardHeader>
        <CardBody>
          <Table aria-label="Insurance plans table">
            <TableHeader>
              <TableColumn>PLAN NAME</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>MEMBERS</TableColumn>
              <TableColumn>PREMIUM REVENUE</TableColumn>
              <TableColumn>CLAIM RATIO</TableColumn>
              <TableColumn>QUALITY RATING</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No insurance plans yet. Create your first plan.">
              {insurance.map((plan) => {
                const claimRatio = plan.metrics?.claimRatios || 0;
                return (
                  <TableRow key={plan._id}>
                    <TableCell>
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-sm text-gray-500 capitalize">
                        {plan.marketSegment.replace('_', ' ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" color="primary">
                        {plan.insuranceType}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{(plan.enrollment?.totalMembers || 0).toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      ${(plan.financials?.annualPremiumRevenue || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.min(claimRatio, 100)}
                          className="max-w-[100px]"
                          size="sm"
                          color={
                            claimRatio > 85 ? 'danger' :
                            claimRatio > 75 ? 'warning' : 'success'
                          }
                        />
                        <span className="text-sm">{claimRatio.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`h-4 w-4 ${
                                star <= (plan.quality?.starRating || 0)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {(plan.quality?.starRating || 0).toFixed(1)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Create Insurance Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>Create New Insurance Plan</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Plan Name"
                placeholder="Enter insurance plan name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
              />

              <Select
                label="Insurance Type"
                selectedKeys={[formData.insuranceType]}
                onChange={(e) => setFormData({ ...formData, insuranceType: e.target.value as any })}
                isRequired
              >
                <SelectItem key="HMO">HMO (Health Maintenance Organization)</SelectItem>
                <SelectItem key="PPO">PPO (Preferred Provider Organization)</SelectItem>
                <SelectItem key="EPO">EPO (Exclusive Provider Organization)</SelectItem>
                <SelectItem key="POS">POS (Point of Service)</SelectItem>
                <SelectItem key="Medicare">Medicare</SelectItem>
                <SelectItem key="Medicaid">Medicaid</SelectItem>
                <SelectItem key="ACA">ACA Marketplace</SelectItem>
              </Select>

              <Select
                label="Market Segment"
                selectedKeys={[formData.marketSegment]}
                onChange={(e) => setFormData({ ...formData, marketSegment: e.target.value as any })}
                isRequired
              >
                <SelectItem key="individual">Individual</SelectItem>
                <SelectItem key="group">Group (Employer)</SelectItem>
                <SelectItem key="medicare">Medicare</SelectItem>
                <SelectItem key="medicaid">Medicaid</SelectItem>
                <SelectItem key="exchange">Exchange/Marketplace</SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>Cancel</Button>
            <Button
              color="primary"
              onPress={handleCreateInsurance}
              isDisabled={!formData.name}
            >
              Create Plan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
