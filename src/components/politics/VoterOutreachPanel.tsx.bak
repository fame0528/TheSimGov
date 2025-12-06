/**
 * @file src/components/politics/VoterOutreachPanel.tsx
 * @description Ground game management UI with volunteer tracking
 * @created 2025-11-29
 * @author ECHO v1.3.3
 */

'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Input,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Progress,
  Divider,
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure,
} from '@heroui/react';
import { useOutreach, useOutreachOperation } from '@/hooks/usePoliticsExpansion';
import { toOutreachUI, type OutreachUI } from '@/lib/adapters/politics';
import type { VoterOutreachListItem, VoterOutreachData } from '@/types/politics';

// ============================================================================
// CONSTANTS
// ============================================================================

const OUTREACH_TYPES = [
  { key: 'all', label: 'All Types' },
  { key: 'PHONE_BANK', label: 'Phone Bank' },
  { key: 'CANVASSING', label: 'Canvassing' },
  { key: 'TEXT_BANK', label: 'Text Bank' },
  { key: 'RALLY', label: 'Rally' },
  { key: 'TOWN_HALL', label: 'Town Hall' },
  { key: 'GOTV', label: 'GOTV' },
  { key: 'VOTER_REGISTRATION', label: 'Voter Registration' },
];

const OUTREACH_STATUSES = [
  { key: 'all', label: 'All Status' },
  { key: 'PLANNED', label: 'Planned' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  PLANNED: 'default',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

const TYPE_ICONS: Record<string, string> = {
  PHONE_BANK: '📞',
  CANVASSING: '🚶',
  TEXT_BANK: '💬',
  RALLY: '📢',
  TOWN_HALL: '🏛️',
  GOTV: '🗳️',
  VOTER_REGISTRATION: '📝',
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface OutreachCardProps {
  operation: VoterOutreachListItem;
  onSelect: (id: string) => void;
}

function OutreachCard({ operation, onSelect }: OutreachCardProps) {
  const targetContacts = operation.targetContacts ?? 0;
  const totalAttempts = operation.totalAttempts ?? 0;
  const progress = targetContacts > 0 ? (totalAttempts / targetContacts) * 100 : 0;

  return (
    <Card isPressable onPress={() => onSelect(operation._id ?? '')} className="w-full">
      <CardBody className="gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{TYPE_ICONS[operation.type ?? ''] ?? '📋'}</span>
            <span className="font-semibold">{operation.name ?? ''}</span>
          </div>
          <Chip color={STATUS_COLORS[operation.status ?? 'PLANNED']} size="sm" variant="flat">
            {operation.status ?? 'PLANNED'}
          </Chip>
        </div>

        <div className="text-sm text-default-500">
          {(operation.scheduledDate ? new Date(operation.scheduledDate).toLocaleDateString() : '—')} •{' '}
          {(operation.type ?? '').replace('_', ' ')}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>
              {totalAttempts} / {targetContacts} contacts
            </span>
          </div>
          <Progress
            value={progress}
            color={progress >= 100 ? 'success' : progress >= 50 ? 'primary' : 'warning'}
            size="sm"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex gap-4">
            <span className="text-success">
              ✓ {(operation.successfulContacts ?? 0)} successful
            </span>
            <span className="text-default-500">
              {(operation.contactRate ?? 0).toFixed(1)}% rate
            </span>
          </div>
          <span>{operation.volunteerCount ?? 0} volunteers</span>
        </div>
      </CardBody>
    </Card>
  );
}

interface OutreachDetailProps {
  operation: VoterOutreachData;
  onClose: () => void;
  onRefresh: () => void;
}

function OutreachDetail({ operation, onClose, onRefresh }: OutreachDetailProps) {
  const ui: OutreachUI = toOutreachUI(operation);
  const { updateStatus, volunteerCheckIn, recordContact } = useOutreachOperation(
    operation._id
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    await updateStatus(newStatus);
    onRefresh();
    setIsUpdating(false);
  };

  const handleCheckIn = async (volunteerId: string, type: 'in' | 'out') => {
    await volunteerCheckIn(volunteerId, type);
    onRefresh();
  };

  const targetContacts = ui.targetContacts ?? 0;
  const metrics = ui.metrics ?? {};
  const progress = targetContacts > 0
    ? ((metrics.totalAttempts ?? 0) / targetContacts) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{TYPE_ICONS[ui.type ?? ''] ?? '📋'}</span>
            <h2 className="text-2xl font-bold">{ui.name ?? ''}</h2>
          </div>
          <p className="text-default-500 mt-1">
            {(ui.type ?? '').replace('_', ' ')} •{' '}
            {(ui.scheduledDate ? new Date(ui.scheduledDate as Date).toLocaleDateString() : '—')}
          </p>
        </div>
        <Chip color={STATUS_COLORS[ui.status ?? 'PLANNED']} size="lg">
          {ui.status ?? 'PLANNED'}
        </Chip>
      </div>

      <Divider />

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold">{metrics.totalAttempts ?? 0}</p>
            <p className="text-sm text-default-500">Total Attempts</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-success">
              {metrics.successfulContacts ?? 0}
            </p>
            <p className="text-sm text-default-500">Successful</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold">
              {(metrics.contactRate ?? 0).toFixed(1)}%
            </p>
            <p className="text-sm text-default-500">Contact Rate</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold">
              {(metrics.supportRate ?? 0).toFixed(1)}%
            </p>
            <p className="text-sm text-default-500">Support Rate</p>
          </CardBody>
        </Card>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="font-medium">Overall Progress</span>
          <span>
            {(metrics.totalAttempts ?? 0)} / {targetContacts} (
            {progress.toFixed(1)}%)
          </span>
        </div>
        <Progress
          value={progress}
          color={progress >= 100 ? 'success' : 'primary'}
          size="lg"
          showValueLabel
        />
      </div>

      <Divider />

      {/* Detailed Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Contact Results Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-success-50 rounded-lg text-center">
            <p className="text-xl font-bold text-success">
              {(metrics.supporterIdentified ?? 0)}
            </p>
            <p className="text-sm">Supporters</p>
          </div>
          <div className="p-3 bg-warning-50 rounded-lg text-center">
            <p className="text-xl font-bold text-warning">
              {(metrics.undecided ?? 0)}
            </p>
            <p className="text-sm">Undecided</p>
          </div>
          <div className="p-3 bg-danger-50 rounded-lg text-center">
            <p className="text-xl font-bold text-danger">
              {(metrics.opposition ?? 0)}
            </p>
            <p className="text-sm">Opposition</p>
          </div>
          <div className="p-3 bg-default-100 rounded-lg text-center">
            <p className="text-xl font-bold">
              {(metrics.noAnswer ?? 0)}
            </p>
            <p className="text-sm">No Answer</p>
          </div>
        </div>
      </div>

      <Divider />

      {/* Volunteers */}
      <div>
        <h3 className="text-lg font-semibold mb-3">
          Volunteers ({ui.volunteerCount ?? 0})
        </h3>
        {Array.isArray(ui.volunteers) && ui.volunteers.length > 0 ? (
          <Table aria-label="Volunteers">
            <TableHeader>
              <TableColumn>VOLUNTEER</TableColumn>
              <TableColumn>ASSIGNED</TableColumn>
              <TableColumn>COMPLETED</TableColumn>
              <TableColumn>RATE</TableColumn>
              <TableColumn>HOURS</TableColumn>
              <TableColumn>STATUS</TableColumn>
            </TableHeader>
            <TableBody>
              {(ui.volunteers ?? []).map((vol, idx) => (
                <TableRow key={vol.volunteerId || idx}>
                  <TableCell>{vol.volunteerId}</TableCell>
                  <TableCell>{vol.assignedContacts}</TableCell>
                  <TableCell>{vol.completedContacts}</TableCell>
                  <TableCell>{vol.completionRate.toFixed(1)}%</TableCell>
                  <TableCell>{vol.hoursWorked.toFixed(1)}h</TableCell>
                  <TableCell>
                    {vol.isCheckedIn ? (
                      <Chip size="sm" color="success">Checked In</Chip>
                    ) : (
                      <Chip size="sm" variant="flat">Not Checked In</Chip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-default-500 text-center py-4">
            No volunteers assigned yet
          </p>
        )}
      </div>

      {/* Talking Points */}
      {Array.isArray(ui.talkingPoints) && ui.talkingPoints.length > 0 && (
        <>
          <Divider />
          <div>
            <h3 className="text-lg font-semibold mb-3">Talking Points</h3>
            <ul className="list-disc list-inside space-y-1">
              {(ui.talkingPoints ?? []).map((point, idx) => (
                <li key={idx} className="text-default-700">
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Script */}
      {ui.script && (
        <>
          <Divider />
          <div>
            <h3 className="text-lg font-semibold mb-3">Script</h3>
            <Card>
              <CardBody className="whitespace-pre-wrap text-sm">
                {ui.script}
              </CardBody>
            </Card>
          </div>
        </>
      )}

      {/* Actions */}
      <Divider />
          <div className="flex justify-end gap-2">
        <Select
          label="Update Status"
          size="sm"
          className="w-48"
          selectedKeys={[(ui.status ?? 'PLANNED')]}
          onChange={(e) => e.target.value && handleStatusChange(e.target.value)}
          isDisabled={isUpdating}
        >
          {OUTREACH_STATUSES.filter((s) => s.key !== 'all').map((status) => (
            <SelectItem key={status.key}>{status.label}</SelectItem>
          ))}
        </Select>
        <Button variant="light" onPress={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function VoterOutreachPanel() {
  // State
  const [selectedTab, setSelectedTab] = useState<string>('upcoming');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Modal
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Data hooks
  const { operations, total, totalPages, isLoading, refresh } = useOutreach({
    type: typeFilter !== 'all' ? typeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    limit: 12,
    page,
  });

  const { operation: selectedOperation, refresh: refreshSelected } =
    useOutreachOperation(selectedOperationId);

  // Handlers
  const handleSelectOperation = (id: string) => {
    setSelectedOperationId(id);
    onOpen();
  };

  const handleCloseDetail = () => {
    onClose();
    setSelectedOperationId(null);
    refresh();
  };

  // Filter operations
  const filteredOperations = useMemo(() => {
    let filtered = operations;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((o) => (o.name ?? '').toLowerCase().includes(query));
    }

    if (selectedTab === 'upcoming') {
      filtered = filtered.filter((o) => o.isUpcoming);
    } else if (selectedTab === 'active') {
      filtered = filtered.filter((o) => o.status === 'IN_PROGRESS');
    }

    return filtered;
  }, [operations, searchQuery, selectedTab]);

  // Summary stats
  const stats = useMemo(() => {
    return {
      total: operations.length,
      active: operations.filter((o) => o.status === 'IN_PROGRESS').length,
      totalContacts: operations.reduce((sum, o) => sum + (o.totalAttempts ?? 0), 0),
      totalSuccess: operations.reduce((sum, o) => sum + (o.successfulContacts ?? 0), 0),
      totalVolunteers: operations.reduce((sum, o) => sum + (o.volunteerCount ?? 0), 0),
    };
  }, [operations]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Voter Outreach</h1>
          <p className="text-default-500">Ground game operations and volunteer tracking</p>
        </div>
        <Button color="primary" onPress={() => {}}>
          New Operation
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-4 items-end">
            <Input
              label="Search"
              placeholder="Search operations..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="w-64"
              isClearable
            />
            <Select
              label="Type"
              selectedKeys={[typeFilter]}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-48"
            >
              {OUTREACH_TYPES.map((type) => (
                <SelectItem key={type.key}>{type.label}</SelectItem>
              ))}
            </Select>
            <Select
              label="Status"
              selectedKeys={[statusFilter]}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-48"
            >
              {OUTREACH_STATUSES.map((status) => (
                <SelectItem key={status.key}>{status.label}</SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
      >
        <Tab key="all" title="All Operations" />
        <Tab key="upcoming" title="Upcoming" />
        <Tab key="active" title="Active Now" />
      </Tabs>

      {/* Operations Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardBody className="h-40 animate-pulse bg-default-100" />
            </Card>
          ))}
        </div>
      ) : filteredOperations.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOperations.map((op) => (
              <OutreachCard
                key={op._id}
                operation={op}
                onSelect={handleSelectOperation}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                size="sm"
                variant="flat"
                isDisabled={page === 1}
                onPress={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="flat"
                isDisabled={page === totalPages}
                onPress={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-default-500">No operations found</p>
          </CardBody>
        </Card>
      )}

      {/* Summary Stats */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-default-500">Total Operations</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">{stats.active}</p>
              <p className="text-sm text-default-500">Active Now</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats.totalContacts.toLocaleString()}
              </p>
              <p className="text-sm text-default-500">Total Contacts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">
                {stats.totalSuccess.toLocaleString()}
              </p>
              <p className="text-sm text-default-500">Successful</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalVolunteers}</p>
              <p className="text-sm text-default-500">Volunteers</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Operation Detail Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleCloseDetail}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalBody className="p-6">
            {selectedOperation ? (
              <OutreachDetail
                operation={selectedOperation}
                onClose={handleCloseDetail}
                onRefresh={refreshSelected}
              />
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-default-500">Loading operation details...</p>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
