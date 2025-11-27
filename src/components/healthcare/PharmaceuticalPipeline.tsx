/**
 * @fileoverview Pharmaceutical Pipeline Management Component
 * @description Drug development tracking, FDA approval workflow, and R&D forecasting
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
import { Plus, Beaker, TrendingUp, DollarSign, FileCheck, Clock, CheckCircle } from 'lucide-react';

interface Drug {
  name: string;
  indication: string;
  developmentStage: 'discovery' | 'preclinical' | 'phase1' | 'phase2' | 'phase3' | 'filing' | 'approved' | 'launched';
  therapeuticArea: string;
  targetLaunchDate?: string;
  successProbability?: number;
  patentValue?: number;
  trialTimeline?: number;
}

interface Pharmaceutical {
  _id: string;
  name: string;
  companyType: 'big_pharma' | 'biotech' | 'generic' | 'specialty';
  therapeuticAreas: string[];
  pipeline: Drug[];
  metrics?: {
    totalPipelineValue: number;
    complianceScore: number;
    revenue: number;
  };
}

interface PharmaceuticalPipelineProps {
  companyId: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * PharmaceuticalPipeline Component
 * Comprehensive drug development and pipeline management
 * 
 * Features:
 * - Drug pipeline stages (Discovery → Launch)
 * - FDA approval tracking
 * - Revenue forecasting
 * - R&D cost monitoring
 * - Success probability analysis
 * 
 * @param companyId - ID of the company owning pharmaceutical operations
 */
export default function PharmaceuticalPipeline({ companyId }: PharmaceuticalPipelineProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeTab, setActiveTab] = useState('pipeline');

  const { data: response, error, mutate } = useSWR<{ pharmaceuticals: Pharmaceutical[] }>(
    `/api/healthcare/pharmaceuticals?company=${companyId}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const [formData, setFormData] = useState({
    name: '',
    companyType: 'biotech' as const,
    therapeuticAreas: ''
  });

  const handleCreatePharma = async () => {
    try {
      const apiResponse = await fetch('/api/healthcare/pharmaceuticals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          company: companyId,
          therapeuticAreas: formData.therapeuticAreas.split(',').map(a => a.trim()).filter(Boolean),
          pipeline: [],
          regulatory: {
            fdaApprovals: 0,
            complianceScore: 0
          }
        })
      });

      if (apiResponse.ok) {
        mutate();
        onClose();
        setFormData({
          name: '',
          companyType: 'biotech',
          therapeuticAreas: ''
        });
      }
    } catch (error) {
      console.error('Error creating pharmaceutical:', error);
    }
  };

  if (!response) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading pharmaceutical pipeline...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  const { pharmaceuticals = [] } = response;

  // Calculate pipeline metrics
  const totalDrugs = pharmaceuticals.reduce((sum, p) => sum + (p.pipeline?.length || 0), 0);
  const approvedDrugs = pharmaceuticals.reduce((sum, p) => 
    sum + (p.pipeline?.filter(d => d.developmentStage === 'approved' || d.developmentStage === 'launched').length || 0), 0
  );
  const totalPipelineValue = pharmaceuticals.reduce((sum, p) => sum + (p.metrics?.totalPipelineValue || 0), 0);
  const totalRevenue = pharmaceuticals.reduce((sum, p) => sum + (p.metrics?.revenue || 0), 0);

  // Group drugs by stage across all companies
  const drugsByStage: Record<string, Drug[]> = {};
  pharmaceuticals.forEach(pharma => {
    pharma.pipeline?.forEach(drug => {
      if (!drugsByStage[drug.developmentStage]) {
        drugsByStage[drug.developmentStage] = [];
      }
      drugsByStage[drug.developmentStage].push(drug);
    });
  });

  /**
   * Get stage progress percentage
   */
  const getStageProgress = (stage: string): number => {
    const stages = ['discovery', 'preclinical', 'phase1', 'phase2', 'phase3', 'filing', 'approved', 'launched'];
    const index = stages.indexOf(stage);
    return ((index + 1) / stages.length) * 100;
  };

  /**
   * Get stage color
   */
  const getStageColor = (stage: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' => {
    switch (stage) {
      case 'launched':
      case 'approved': return 'success';
      case 'filing':
      case 'phase3': return 'primary';
      case 'phase2':
      case 'phase1': return 'secondary';
      default: return 'warning';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pharmaceutical Pipeline</h2>
          <p className="text-gray-600 mt-1">Track drug development and FDA approvals</p>
        </div>
        <Button color="primary" onPress={onOpen} startContent={<Plus className="h-4 w-4" />}>
          New Pharmaceutical
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-blue-500" />
              <div className="text-sm text-gray-600">Total Drugs</div>
            </div>
            <div className="text-2xl font-bold mt-1">{totalDrugs}</div>
            <div className="text-sm text-gray-500 mt-1">
              {approvedDrugs} approved/launched
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-2xl font-bold mt-1">
              {totalDrugs > 0 ? ((approvedDrugs / totalDrugs) * 100).toFixed(1) : 0}%
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              <div className="text-sm text-gray-600">Pipeline Value</div>
            </div>
            <div className="text-2xl font-bold mt-1">${totalPipelineValue.toLocaleString()}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div className="text-sm text-gray-600">Annual Revenue</div>
            </div>
            <div className="text-2xl font-bold mt-1">${totalRevenue.toLocaleString()}</div>
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
            <Tab key="pipeline" title="Pipeline Overview" />
            <Tab key="companies" title="Companies" />
            <Tab key="stages" title="By Stage" />
          </Tabs>
        </CardHeader>
        <CardBody>
          {activeTab === 'pipeline' && (
            <div>
              {pharmaceuticals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pharmaceutical companies yet. Create your first one.
                </div>
              ) : (
                <div className="space-y-6">
                  {pharmaceuticals.map((pharma) => (
                    <Card key={pharma._id}>
                      <CardBody>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">{pharma.name}</h4>
                            <div className="flex gap-2 mt-1">
                              <Chip size="sm" variant="flat" color="primary">
                                {pharma.companyType.replace('_', ' ').toUpperCase()}
                              </Chip>
                              {pharma.therapeuticAreas?.slice(0, 3).map((area, idx) => (
                                <Chip key={idx} size="sm" variant="flat">
                                  {area}
                                </Chip>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{pharma.pipeline?.length || 0}</div>
                            <div className="text-sm text-gray-500">Drugs in pipeline</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {pharma.pipeline?.slice(0, 3).map((drug, idx) => (
                            <Card key={idx} shadow="sm">
                              <CardBody>
                                <div className="font-medium mb-2">{drug.name}</div>
                                <div className="text-sm text-gray-600 mb-2">{drug.indication}</div>
                                <Chip
                                  size="sm"
                                  color={getStageColor(drug.developmentStage)}
                                  variant="flat"
                                >
                                  {drug.developmentStage.replace('phase', 'Phase ').toUpperCase()}
                                </Chip>
                                {drug.successProbability && (
                                  <div className="mt-2">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>Success Probability</span>
                                      <span>{drug.successProbability.toFixed(0)}%</span>
                                    </div>
                                    <Progress value={drug.successProbability} size="sm" />
                                  </div>
                                )}
                              </CardBody>
                            </Card>
                          ))}
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'companies' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pharmaceuticals.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No pharmaceutical companies yet.
                </div>
              ) : (
                pharmaceuticals.map((pharma) => (
                  <Card key={pharma._id}>
                    <CardBody>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-lg">{pharma.name}</h4>
                          <div className="flex gap-2 mt-2">
                            <Chip size="sm" variant="flat" color="primary">
                              {pharma.companyType.replace('_', ' ').toUpperCase()}
                            </Chip>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold">{pharma.pipeline?.length || 0}</div>
                            <div className="text-xs text-gray-500">Drugs in Pipeline</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              {pharma.pipeline?.filter(d => d.developmentStage === 'approved' || d.developmentStage === 'launched').length || 0}
                            </div>
                            <div className="text-xs text-gray-500">Approved</div>
                          </div>
                        </div>
                        {pharma.metrics && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Pipeline Value</span>
                              <span>${(pharma.metrics.totalPipelineValue || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Compliance Score</span>
                              <span>{(pharma.metrics.complianceScore || 0).toFixed(0)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'stages' && (
            <div className="space-y-4">
              {Object.keys(drugsByStage).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No drugs in pipeline yet.
                </div>
              ) : (
                Object.entries(drugsByStage).map(([stage, drugs]) => (
                  <Card key={stage}>
                    <CardBody>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Chip color={getStageColor(stage)} variant="flat">
                            {stage.replace('phase', 'Phase ').toUpperCase()}
                          </Chip>
                          <span className="text-sm text-gray-600">{drugs.length} drugs</span>
                        </div>
                        <Progress
                          value={getStageProgress(stage)}
                          className="max-w-[200px]"
                          size="sm"
                          color={getStageColor(stage)}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {drugs.map((drug, idx) => (
                          <div key={idx} className="p-2 border rounded">
                            <div className="font-medium text-sm">{drug.name}</div>
                            <div className="text-xs text-gray-500">{drug.indication}</div>
                            {drug.successProbability && (
                              <div className="text-xs text-gray-600 mt-1">
                                Success: {drug.successProbability.toFixed(0)}%
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create Pharmaceutical Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>Create New Pharmaceutical Company</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Company Name"
                placeholder="Enter pharmaceutical company name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
              />

              <Select
                label="Company Type"
                selectedKeys={[formData.companyType]}
                onChange={(e) => setFormData({ ...formData, companyType: e.target.value as any })}
                isRequired
              >
                <SelectItem key="big_pharma">Big Pharma</SelectItem>
                <SelectItem key="biotech">Biotech</SelectItem>
                <SelectItem key="generic">Generic Manufacturer</SelectItem>
                <SelectItem key="specialty">Specialty Pharma</SelectItem>
              </Select>

              <Input
                label="Therapeutic Areas"
                placeholder="Oncology, Cardiology, Neurology (comma-separated)"
                value={formData.therapeuticAreas}
                onChange={(e) => setFormData({ ...formData, therapeuticAreas: e.target.value })}
                description="Enter therapeutic areas separated by commas"
                isRequired
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>Cancel</Button>
            <Button
              color="primary"
              onPress={handleCreatePharma}
              isDisabled={!formData.name || !formData.therapeuticAreas}
            >
              Create Company
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
