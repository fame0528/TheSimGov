/**
 * @fileoverview Research Lab Dashboard Component
 * @description Clinical trial management, research tracking, and publication metrics
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
import { Plus, Microscope, Users, FileText, TrendingUp, CheckCircle, Clock, DollarSign } from 'lucide-react';

interface ResearchProject {
  _id: string;
  projectName: string;
  researchType: 'clinical_trial' | 'basic_research' | 'translational' | 'drug_discovery' | 'device_development' | 'biomarker_research';
  therapeuticArea: string;
  phase: 'preclinical' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'post_market';
  status: 'planning' | 'recruiting' | 'active' | 'completed' | 'terminated' | 'suspended';
  funding: {
    totalBudget: number;
    fundingSource: 'government' | 'private' | 'venture_capital' | 'pharma' | 'foundation' | 'internal';
  };
  participants?: {
    targetCount: number;
    currentCount: number;
  };
  regulatory?: {
    irbApproval: boolean;
    fdaApproval: boolean;
  };
  outcomes?: {
    publications: number;
    patents: number;
  };
  metrics?: {
    successProbability: number;
    trialTimeline: number;
    fundingEfficiency: number;
    patentValue: number;
  };
}

interface ResearchLabDashboardProps {
  companyId: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * ResearchLabDashboard Component
 * Comprehensive research and clinical trial management
 * 
 * Features:
 * - Clinical trial tracking
 * - Research project management
 * - Participant enrollment monitoring
 * - Publication and patent metrics
 * - Funding allocation analysis
 * 
 * @param companyId - ID of the company conducting research
 */
export default function ResearchLabDashboard({ companyId }: ResearchLabDashboardProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { data: response, error, mutate } = useSWR<{ research: ResearchProject[]; summary: any }>(
    `/api/healthcare/research?company=${companyId}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const [formData, setFormData] = useState({
    projectName: '',
    researchType: 'clinical_trial' as const,
    therapeuticArea: '',
    phase: 'phase1' as const,
    fundingSource: 'government' as const,
    totalBudget: 1000000
  });

  const handleCreateResearch = async () => {
    try {
      const apiResponse = await fetch('/api/healthcare/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          company: companyId,
          status: 'planning',
          funding: {
            totalBudget: formData.totalBudget,
            fundingSource: formData.fundingSource
          },
          participants: {
            targetCount: 0,
            currentCount: 0
          },
          regulatory: {
            irbApproval: false,
            fdaApproval: false
          },
          outcomes: {
            publications: 0,
            patents: 0
          }
        })
      });

      if (apiResponse.ok) {
        mutate();
        onClose();
        setFormData({
          projectName: '',
          researchType: 'clinical_trial',
          therapeuticArea: '',
          phase: 'phase1',
          fundingSource: 'government',
          totalBudget: 1000000
        });
      }
    } catch (error) {
      console.error('Error creating research project:', error);
    }
  };

  if (!response) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading research projects...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  const { research = [], summary = {} } = response;

  /**
   * Get status chip color
   */
  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'primary';
      case 'recruiting': return 'secondary';
      case 'suspended': return 'warning';
      case 'terminated': return 'danger';
      default: return 'default';
    }
  };

  /**
   * Get phase chip color
   */
  const getPhaseColor = (phase: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' => {
    switch (phase) {
      case 'phase4':
      case 'post_market': return 'success';
      case 'phase3': return 'primary';
      case 'phase2': return 'secondary';
      case 'phase1': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Research Lab Dashboard</h2>
          <p className="text-gray-600 mt-1">Manage clinical trials and research projects</p>
        </div>
        <Button color="primary" onPress={onOpen} startContent={<Plus className="h-4 w-4" />}>
          New Research Project
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-blue-500" />
              <div className="text-sm text-gray-600">Total Projects</div>
            </div>
            <div className="text-2xl font-bold mt-1">{summary.totalProjects || research.length}</div>
            <div className="text-sm text-gray-500 mt-1">
              {summary.activeProjects || 0} active
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-2xl font-bold mt-1">{summary.completedProjects || 0}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div className="text-sm text-gray-600">Total Funding</div>
            </div>
            <div className="text-2xl font-bold mt-1">${(summary.totalFunding || 0).toLocaleString()}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-2xl font-bold mt-1">
              {(summary.averageSuccessProbability || 0).toFixed(1)}%
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Research Projects Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Active Research Projects</h3>
        </CardHeader>
        <CardBody>
          <Table aria-label="Research projects table">
            <TableHeader>
              <TableColumn>PROJECT NAME</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>PHASE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>PARTICIPANTS</TableColumn>
              <TableColumn>FUNDING</TableColumn>
              <TableColumn>SUCCESS RATE</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No research projects yet. Create your first project.">
              {research.map((project) => (
                <TableRow key={project._id}>
                  <TableCell>
                    <div className="font-medium">{project.projectName}</div>
                    <div className="text-sm text-gray-500">{project.therapeuticArea}</div>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat">
                      {project.researchType.replace('_', ' ').toUpperCase()}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" color={getPhaseColor(project.phase)} variant="flat">
                      {project.phase.replace('phase', 'Phase ').toUpperCase()}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={getStatusColor(project.status)}
                      variant="flat"
                      startContent={
                        project.status === 'completed' ? <CheckCircle className="h-3 w-3" /> :
                        project.status === 'active' ? <Clock className="h-3 w-3" /> : undefined
                      }
                    >
                      {project.status.toUpperCase()}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>
                        {project.participants?.currentCount || 0} / {project.participants?.targetCount || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">${(project.funding?.totalBudget || 0).toLocaleString()}</div>
                      <div className="text-xs text-gray-500 capitalize">
                        {project.funding?.fundingSource.replace('_', ' ')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.metrics?.successProbability ? (
                      <div className="flex items-center gap-2">
                        <Progress
                          value={project.metrics.successProbability}
                          className="max-w-[100px]"
                          size="sm"
                          color={
                            project.metrics.successProbability > 75 ? 'success' :
                            project.metrics.successProbability > 50 ? 'primary' : 'warning'
                          }
                        />
                        <span className="text-sm">{project.metrics.successProbability.toFixed(0)}%</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">N/A</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Create Research Project Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>Create New Research Project</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Project Name"
                placeholder="Enter research project name"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                isRequired
              />

              <Select
                label="Research Type"
                selectedKeys={[formData.researchType]}
                onChange={(e) => setFormData({ ...formData, researchType: e.target.value as typeof formData.researchType })}
                isRequired
              >
                <SelectItem key="clinical_trial">Clinical Trial</SelectItem>
                <SelectItem key="basic_research">Basic Research</SelectItem>
                <SelectItem key="translational">Translational Research</SelectItem>
                <SelectItem key="drug_discovery">Drug Discovery</SelectItem>
                <SelectItem key="device_development">Device Development</SelectItem>
                <SelectItem key="biomarker_research">Biomarker Research</SelectItem>
              </Select>

              <Input
                label="Therapeutic Area"
                placeholder="e.g., Oncology, Cardiology"
                value={formData.therapeuticArea}
                onChange={(e) => setFormData({ ...formData, therapeuticArea: e.target.value })}
                isRequired
              />

              <Select
                label="Phase"
                selectedKeys={[formData.phase]}
                onChange={(e) => setFormData({ ...formData, phase: e.target.value as typeof formData.phase })}
                isRequired
              >
                <SelectItem key="preclinical">Preclinical</SelectItem>
                <SelectItem key="phase1">Phase 1</SelectItem>
                <SelectItem key="phase2">Phase 2</SelectItem>
                <SelectItem key="phase3">Phase 3</SelectItem>
                <SelectItem key="phase4">Phase 4</SelectItem>
                <SelectItem key="post_market">Post-Market</SelectItem>
              </Select>

              <Select
                label="Funding Source"
                selectedKeys={[formData.fundingSource]}
                onChange={(e) => setFormData({ ...formData, fundingSource: e.target.value as typeof formData.fundingSource })}
                isRequired
              >
                <SelectItem key="government">Government Grant</SelectItem>
                <SelectItem key="private">Private Foundation</SelectItem>
                <SelectItem key="venture_capital">Venture Capital</SelectItem>
                <SelectItem key="pharma">Pharmaceutical Sponsor</SelectItem>
                <SelectItem key="foundation">Medical Foundation</SelectItem>
                <SelectItem key="internal">Internal Funding</SelectItem>
              </Select>

              <Input
                label="Total Budget"
                type="number"
                placeholder="1000000"
                value={formData.totalBudget.toString()}
                onChange={(e) => setFormData({ ...formData, totalBudget: parseInt(e.target.value) || 1000000 })}
                startContent={<DollarSign className="h-4 w-4 text-gray-400" />}
                isRequired
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>Cancel</Button>
            <Button
              color="primary"
              onPress={handleCreateResearch}
              isDisabled={!formData.projectName || !formData.therapeuticArea}
            >
              Create Project
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
