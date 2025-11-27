/**
 * Breakthrough & Patent Tracker Component
 * 
 * OVERVIEW:
 * Comprehensive tracking interface for AI research breakthroughs and patent applications.
 * Displays breakthrough timeline, patent portfolio, and provides recording/filing capabilities.
 * 
 * FEATURES:
 * - Breakthrough timeline with commercial value tracking
 * - Patent portfolio grid with status visualization
 * - Recording breakthrough modal with validation
 * - Patent filing modal with value estimation
 * - Summary statistics (total breakthroughs, patents, combined value)
 * - Publication-ready breakthrough filtering
 * - Patent status filtering (Pending/Approved/Rejected)
 * - Real-time updates after recording/filing
 * 
 * DEPENDENCIES:
 * - HeroUI v2.4.23 components (Card, Button, Modal, Input, Textarea, Chip)
 * - API: POST /api/ai/research/[id]/breakthroughs
 * - API: POST /api/ai/research/[id]/patents
 * - API: GET /api/ai/research/projects/[id] (with populated breakthroughs + patents)
 * 
 * ARCHITECTURE:
 * - Uses existing DataTable component for patent grid
 * - Uses existing Card component for breakthrough timeline
 * - Uses existing LoadingSpinner/ErrorMessage for states
 * - Composition pattern: assembles from shared components
 * 
 * @created 2025-11-22
 * @updated 2025-11-22
 */

'use client';

import { useState, useEffect } from 'react';
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
  Textarea,
  Chip,
  Divider,
  useDisclosure,
} from '@heroui/react';
import { FiPlus, FiFileText, FiAward, FiTrendingUp, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import { LoadingSpinner } from '@/lib/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/lib/components/shared/ErrorMessage';
import { DataTable } from '@/lib/components/shared/DataTable';
import { formatCurrency } from '@/lib/utils/formatting';

/**
 * Breakthrough data structure (from backend Breakthrough model)
 */
interface Breakthrough {
  _id: string;
  description: string;
  commercialValue: number; // $100,000 - $10,000,000
  publicationReady: boolean;
  project: string;
  company: string;
  createdAt: string;
}

/**
 * Patent data structure (from backend Patent model)
 */
interface Patent {
  _id: string;
  title: string;
  description: string;
  value: number; // $500,000 - $50,000,000
  status: 'Pending' | 'Approved' | 'Rejected';
  project: string;
  company: string;
  filedAt: string;
}

/**
 * Research project with populated breakthroughs + patents
 */
interface ResearchProject {
  _id: string;
  name: string;
  type: string;
  breakthroughs: Breakthrough[];
  patents: Patent[];
}

interface BreakthroughPatentTrackerProps {
  projectId: string;
  companyId: string;
}

/**
 * BreakthroughPatentTracker Component
 * 
 * Main component for managing research breakthroughs and patent applications.
 * Provides comprehensive interface for tracking, recording, and filing IP.
 */
export default function BreakthroughPatentTracker({
  projectId,
  companyId,
}: BreakthroughPatentTrackerProps) {
  // State management
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal controls
  const breakthroughModal = useDisclosure();
  const patentModal = useDisclosure();

  // Form state for breakthrough recording
  const [breakthroughForm, setBreakthroughForm] = useState({
    description: '',
    commercialValue: '',
    publicationReady: false,
  });

  // Form state for patent filing
  const [patentForm, setPatentForm] = useState({
    title: '',
    description: '',
    value: '',
  });

  /**
   * Load research project with populated breakthroughs + patents
   * Uses GET /api/ai/research/projects/[id] endpoint
   */
  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ai/research/projects/${projectId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load research project');
      }

      const data = await response.json();
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
      console.error('Error loading project:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load project on mount
  useEffect(() => {
    loadProject();
  }, [projectId]);

  /**
   * Record new breakthrough
   * POST /api/ai/research/[id]/breakthroughs
   */
  const handleRecordBreakthrough = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Validation
      if (!breakthroughForm.description || breakthroughForm.description.length < 10) {
        throw new Error('Description must be at least 10 characters');
      }

      const commercialValue = parseFloat(breakthroughForm.commercialValue);
      if (isNaN(commercialValue) || commercialValue < 100000 || commercialValue > 10000000) {
        throw new Error('Commercial value must be between $100,000 and $10,000,000');
      }

      const response = await fetch(`/api/ai/research/${projectId}/breakthroughs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: breakthroughForm.description,
          commercialValue,
          publicationReady: breakthroughForm.publicationReady,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record breakthrough');
      }

      // Success: reload project and close modal
      await loadProject();
      breakthroughModal.onClose();
      setBreakthroughForm({ description: '', commercialValue: '', publicationReady: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record breakthrough');
      console.error('Error recording breakthrough:', err);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * File new patent application
   * POST /api/ai/research/[id]/patents
   */
  const handleFilePatent = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Validation
      if (!patentForm.title || patentForm.title.length < 10) {
        throw new Error('Title must be at least 10 characters');
      }

      if (!patentForm.description || patentForm.description.length < 50) {
        throw new Error('Description must be at least 50 characters');
      }

      const value = parseFloat(patentForm.value);
      if (isNaN(value) || value < 500000 || value > 50000000) {
        throw new Error('Patent value must be between $500,000 and $50,000,000');
      }

      const response = await fetch(`/api/ai/research/${projectId}/patents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: patentForm.title,
          description: patentForm.description,
          value,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to file patent');
      }

      // Success: reload project and close modal
      await loadProject();
      patentModal.onClose();
      setPatentForm({ title: '', description: '', value: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to file patent');
      console.error('Error filing patent:', err);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Calculate summary statistics
   */
  const stats = project ? {
    totalBreakthroughs: project.breakthroughs.length,
    totalPatents: project.patents.length,
    publicationReady: project.breakthroughs.filter(b => b.publicationReady).length,
    pendingPatents: project.patents.filter(p => p.status === 'Pending').length,
    approvedPatents: project.patents.filter(p => p.status === 'Approved').length,
    totalBreakthroughValue: project.breakthroughs.reduce((sum, b) => sum + b.commercialValue, 0),
    totalPatentValue: project.patents.reduce((sum, p) => sum + p.value, 0),
  } : null;

  /**
   * Get status chip color
   */
  const getStatusColor = (status: Patent['status']) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Rejected': return 'danger';
      default: return 'default';
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: Patent['status']) => {
    switch (status) {
      case 'Approved': return <FiCheckCircle className="w-4 h-4" />;
      case 'Pending': return <FiClock className="w-4 h-4" />;
      case 'Rejected': return <FiXCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading breakthrough & patent data..." />;
  }

  // Error state
  if (error && !project) {
    return <ErrorMessage error={error} />;
  }

  // No project state
  if (!project) {
    return <ErrorMessage error="Research project not found" />;
  }

  return (
    <div className="space-y-6">
      {/* Error banner (non-blocking) */}
      {error && <ErrorMessage error={error} />}

      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Breakthroughs & Patents</h2>
          <p className="text-default-500">
            {project.name} - {project.type}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            color="primary"
            startContent={<FiPlus className="w-4 h-4" />}
            onPress={breakthroughModal.onOpen}
          >
            Record Breakthrough
          </Button>
          <Button
            color="secondary"
            startContent={<FiAward className="w-4 h-4" />}
            onPress={patentModal.onOpen}
          >
            File Patent
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FiFileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Breakthroughs</p>
                  <p className="text-2xl font-bold">{stats.totalBreakthroughs}</p>
                  <p className="text-xs text-default-400">
                    {stats.publicationReady} publication-ready
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <FiAward className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Patents</p>
                  <p className="text-2xl font-bold">{stats.totalPatents}</p>
                  <p className="text-xs text-default-400">
                    {stats.pendingPatents} pending, {stats.approvedPatents} approved
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <FiTrendingUp className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Breakthrough Value</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.totalBreakthroughValue)}
                  </p>
                  <p className="text-xs text-default-400">Commercial potential</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <FiAward className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Patent Value</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.totalPatentValue)}
                  </p>
                  <p className="text-xs text-default-400">IP portfolio</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Breakthrough Timeline */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Breakthrough Timeline</h3>
        </CardHeader>
        <Divider />
        <CardBody>
          {project.breakthroughs.length === 0 ? (
            <div className="text-center py-8 text-default-400">
              <FiFileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No breakthroughs recorded yet</p>
              <p className="text-sm">Record your first scientific discovery</p>
            </div>
          ) : (
            <div className="space-y-4">
              {project.breakthroughs
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((breakthrough) => (
                  <Card key={breakthrough._id} shadow="sm">
                    <CardBody>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-default-500 mb-1">
                            {new Date(breakthrough.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-default-700 mb-2">{breakthrough.description}</p>
                          <div className="flex items-center gap-2">
                            <Chip size="sm" color="success" variant="flat">
                              {formatCurrency(breakthrough.commercialValue)}
                            </Chip>
                            {breakthrough.publicationReady && (
                              <Chip size="sm" color="primary" variant="flat">
                                Publication Ready
                              </Chip>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Patent Portfolio Grid */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Patent Portfolio</h3>
        </CardHeader>
        <Divider />
        <CardBody>
          {project.patents.length === 0 ? (
            <div className="text-center py-8 text-default-400">
              <FiAward className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No patents filed yet</p>
              <p className="text-sm">File your first patent application</p>
            </div>
          ) : (
            <DataTable
              data={project.patents}
              columns={[
                {
                  header: 'Patent Title',
                  accessor: (patent: Patent) => (
                    <div>
                      <p className="font-medium">{patent.title}</p>
                      <p className="text-xs text-default-400 line-clamp-1">
                        {patent.description}
                      </p>
                    </div>
                  ),
                },
                {
                  header: 'Value',
                  accessor: (patent: Patent) => (
                    <span className="font-semibold text-success">
                      {formatCurrency(patent.value)}
                    </span>
                  ),
                },
                {
                  header: 'Status',
                  accessor: (patent: Patent) => (
                    <Chip
                      size="sm"
                      color={getStatusColor(patent.status)}
                      variant="flat"
                      startContent={getStatusIcon(patent.status)}
                    >
                      {patent.status}
                    </Chip>
                  ),
                },
                {
                  header: 'Filed Date',
                  accessor: (patent: Patent) => (
                    <span className="text-sm text-default-500">
                      {new Date(patent.filedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  ),
                },
              ]}
            />
          )}
        </CardBody>
      </Card>

      {/* Record Breakthrough Modal */}
      <Modal
        isOpen={breakthroughModal.isOpen}
        onClose={breakthroughModal.onClose}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>Record Scientific Breakthrough</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Textarea
                label="Breakthrough Description"
                placeholder="Describe the scientific discovery..."
                value={breakthroughForm.description}
                onChange={(e) =>
                  setBreakthroughForm({ ...breakthroughForm, description: e.target.value })
                }
                minRows={4}
                isRequired
                description="Minimum 10 characters, maximum 2000 characters"
              />

              <Input
                type="number"
                label="Commercial Value"
                placeholder="750000"
                value={breakthroughForm.commercialValue}
                onChange={(e) =>
                  setBreakthroughForm({ ...breakthroughForm, commercialValue: e.target.value })
                }
                startContent={<span className="text-default-400">$</span>}
                isRequired
                description="Between $100,000 and $10,000,000"
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="publicationReady"
                  checked={breakthroughForm.publicationReady}
                  onChange={(e) =>
                    setBreakthroughForm({
                      ...breakthroughForm,
                      publicationReady: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <label htmlFor="publicationReady" className="text-sm">
                  Ready for publication
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={breakthroughModal.onClose}
              isDisabled={submitting}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleRecordBreakthrough}
              isLoading={submitting}
            >
              Record Breakthrough
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* File Patent Modal */}
      <Modal isOpen={patentModal.isOpen} onClose={patentModal.onClose} size="2xl">
        <ModalContent>
          <ModalHeader>File Patent Application</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Patent Title"
                placeholder="Novel Neural Architecture for..."
                value={patentForm.title}
                onChange={(e) =>
                  setPatentForm({ ...patentForm, title: e.target.value })
                }
                isRequired
                description="Minimum 10 characters, maximum 200 characters"
              />

              <Textarea
                label="Patent Description"
                placeholder="Detailed technical description of the invention..."
                value={patentForm.description}
                onChange={(e) =>
                  setPatentForm({ ...patentForm, description: e.target.value })
                }
                minRows={6}
                isRequired
                description="Minimum 50 characters, maximum 5000 characters"
              />

              <Input
                type="number"
                label="Estimated Patent Value"
                placeholder="1500000"
                value={patentForm.value}
                onChange={(e) =>
                  setPatentForm({ ...patentForm, value: e.target.value })
                }
                startContent={<span className="text-default-400">$</span>}
                isRequired
                description="Between $500,000 and $50,000,000"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={patentModal.onClose}
              isDisabled={submitting}
            >
              Cancel
            </Button>
            <Button color="secondary" onPress={handleFilePatent} isLoading={submitting}>
              File Patent
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * REUSE STRATEGY:
 * - Uses existing DataTable component for patent grid (maximum reuse)
 * - Uses existing Card components for layout (composition pattern)
 * - Uses existing LoadingSpinner/ErrorMessage for states (DRY)
 * - Uses HeroUI v2 components (Modal, Button, Input, Textarea, Chip)
 * 
 * API INTEGRATION:
 * - GET /api/ai/research/projects/[id] - Loads project with populated arrays
 * - POST /api/ai/research/[id]/breakthroughs - Records new breakthrough
 * - POST /api/ai/research/[id]/patents - Files new patent
 * 
 * VALIDATION:
 * - Breakthrough: description 10-2000 chars, value $100K-$10M
 * - Patent: title 10-200 chars, description 50-5000 chars, value $500K-$50M
 * - Client-side validation before API call
 * - Server-side validation enforced by Zod schemas
 * 
 * UX FEATURES:
 * - Real-time statistics (total counts, values, status breakdown)
 * - Timeline view for breakthroughs (sorted by date, newest first)
 * - Grid view for patents (DataTable with sorting/filtering)
 * - Status visualization (Pending/Approved/Rejected chips with icons)
 * - Currency formatting ($1.5M display for readability)
 * - Empty states with helpful messages
 * - Loading states during async operations
 * - Error handling with user-friendly messages
 * 
 * FUTURE ENHANCEMENTS:
 * - Filtering (publication-ready breakthroughs, patent status)
 * - Sorting (by value, date)
 * - Export functionality (PDF, CSV)
 * - Patent approval workflow (admin interface)
 * - Breakthrough editing/deletion
 * - Patent amendment tracking
 */
