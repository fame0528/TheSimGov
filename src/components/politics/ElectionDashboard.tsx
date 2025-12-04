/**
 * @file src/components/politics/ElectionDashboard.tsx
 * @description Elections dashboard with list, filtering, and results
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
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';
import { useElections, useElection } from '@/hooks/usePoliticsExpansion';
import { PoliticalParty } from '@/types/politics';
import { toElectionUI, type ElectionUI } from '@/lib/adapters/politics';
import type { ElectionListItem, ElectionData } from '@/types/politics';
// ElectionUI type is imported from adapters; remove local shadow declaration

// ============================================================================
// CONSTANTS
// ============================================================================

const OFFICE_TYPES = [
  { key: 'all', label: 'All Offices' },
  { key: 'PRESIDENT', label: 'President' },
  { key: 'SENATOR', label: 'Senator' },
  { key: 'REPRESENTATIVE', label: 'Representative' },
  { key: 'GOVERNOR', label: 'Governor' },
  { key: 'MAYOR', label: 'Mayor' },
];

const ELECTION_STATUSES = [
  { key: 'all', label: 'All Status' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'FILING_CLOSED', label: 'Filing Closed' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'CALLED', label: 'Called' },
  { key: 'CERTIFIED', label: 'Certified' },
];

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  SCHEDULED: 'default',
  FILING_CLOSED: 'primary',
  ACTIVE: 'warning',
  CALLED: 'success',
  CERTIFIED: 'success',
  CANCELLED: 'danger',
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ElectionCardProps {
  election: ElectionListItem;
  onSelect: (id: string) => void;
}

function ElectionCard({ election, onSelect }: ElectionCardProps) {
  const daysUntil = election.daysUntil ?? 0;
  const daysDisplay = daysUntil > 0
    ? `${daysUntil} days`
    : daysUntil === 0
    ? 'Today'
    : 'Completed';

  return (
    <Card
      isPressable
      onPress={() => onSelect(election._id ?? '')}
      className="w-full"
    >
      <CardBody className="gap-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-lg">{election.officeName ?? ''}</span>
          <Chip color={STATUS_COLORS[election.status]} size="sm" variant="flat">
            {election.status}
          </Chip>
        </div>
        <div className="flex items-center gap-4 text-sm text-default-500">
          <span>{election.state ?? 'National'}</span>
          <span>•</span>
          <span>{election.electionType}</span>
          <span>•</span>
          <span>{new Date(election.electionDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm">
            {election.candidateCount} candidate{election.candidateCount !== 1 ? 's' : ''}
          </span>
          <Chip
            size="sm"
            variant="bordered"
            color={daysUntil > 30 ? 'default' : daysUntil > 7 ? 'warning' : 'danger'}
          >
            {daysDisplay}
          </Chip>
        </div>
      </CardBody>
    </Card>
  );
}

interface ElectionDetailProps {
  election: ElectionData;
  onClose: () => void;
  onRefresh: () => void;
}

function ElectionDetail({ election, onClose, onRefresh }: ElectionDetailProps) {
  const ui: ElectionUI = toElectionUI(election);
  const { updateStatus, callRace } = useElection(election._id);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    await updateStatus(newStatus);
    onRefresh();
    setIsUpdating(false);
  };

  const leadingCandidate = useMemo(() => {
    const results = Array.isArray(election.results) ? election.results : [];
    if (results.length === 0) return null;
    return [...results].sort((a, b) => b.votes - a.votes)[0];
  }, [election.results]);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{ui.officeName ?? ''}</h2>
          <p className="text-default-500">
            {ui.state ?? 'National'} • {election.electionType} •{' '}
            {new Date(election.electionDate).toLocaleDateString()}
          </p>
        </div>
        <Chip color={STATUS_COLORS[election.status]} size="lg">
          {election.status}
        </Chip>
      </div>

      <Divider />

      {/* Key Dates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-sm text-default-500">Filing Deadline</p>
          <p className="font-semibold">
            {ui.filingDeadline
              ? new Date(ui.filingDeadline as Date).toLocaleDateString()
              : '—'}
          </p>
        </div>
        {ui.earlyVotingStart && (
          <div className="text-center">
            <p className="text-sm text-default-500">Early Voting</p>
            <p className="font-semibold">
              {ui.earlyVotingStart
                ? new Date(ui.earlyVotingStart as Date).toLocaleDateString()
                : '—'}
            </p>
          </div>
        )}
        <div className="text-center">
          <p className="text-sm text-default-500">Election Day</p>
          <p className="font-semibold">
            {new Date(election.electionDate).toLocaleDateString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-default-500">Term Length</p>
          <p className="font-semibold">{ui.termLength ?? 0} years</p>
        </div>
      </div>

      <Divider />

      {/* Candidates Table */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Candidates</h3>
        {election.candidates.length > 0 ? (
          <Table aria-label="Candidates">
            <TableHeader>
              <TableColumn>NAME</TableColumn>
              <TableColumn>PARTY</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>VOTES</TableColumn>
              <TableColumn>PERCENTAGE</TableColumn>
            </TableHeader>
            <TableBody>
              {election.candidates.map((candidate, idx) => {
                const resultsArr = Array.isArray(election.results) ? election.results : [];
                const result = resultsArr.find(
                  (r) => r.candidateId === candidate.candidateId
                );
                const isWinner = ui.winner?.candidateId === candidate.candidateId;
                // Extended candidate properties from API
                const candidateExt = candidate as typeof candidate & { isIncumbent?: boolean; withdrawnDate?: Date };
                return (
                  <TableRow key={candidate.candidateId || idx}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isWinner && <span className="text-success">✓</span>}
                        <span className={isWinner ? 'font-bold' : ''}>
                          {candidate.candidateName}
                        </span>
                        {candidateExt.isIncumbent && (
                          <Chip size="sm" variant="flat">Inc</Chip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={
                          candidate.party === PoliticalParty.DEMOCRATIC
                            ? 'primary'
                            : candidate.party === PoliticalParty.REPUBLICAN
                            ? 'danger'
                            : 'default'
                        }
                      >
                        {candidate.party}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {candidateExt.withdrawnDate ? (
                        <Chip size="sm" color="danger" variant="flat">
                          Withdrawn
                        </Chip>
                      ) : (
                        <Chip size="sm" color="success" variant="flat">
                          Active
                        </Chip>
                      )}
                    </TableCell>
                    <TableCell>
                      {result?.votes?.toLocaleString() ?? '-'}
                    </TableCell>
                    <TableCell>
                      {result?.percentage?.toFixed(1) ?? '-'}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-default-500 text-center py-4">
            No candidates filed yet
          </p>
        )}
      </div>

      {/* Results Section (if available) */}
      {(ui.totalVotes ?? 0) > 0 && (
        <>
          <Divider />
          <div>
            <h3 className="text-lg font-semibold mb-3">Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-sm text-default-500">Total Votes</p>
                <p className="text-xl font-bold">
                  {ui.totalVotes?.toLocaleString?.() ?? '0'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-default-500">Turnout</p>
                <p className="text-xl font-bold">{ui.turnout?.toFixed?.(1) ?? '0'}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-default-500">Margin</p>
                <p className="text-xl font-bold">{ui.margin?.toFixed?.(1) ?? '0'}%</p>
              </div>
              {ui.winner && (
                <div className="text-center">
                  <p className="text-sm text-default-500">Winner</p>
                  <p className="text-xl font-bold text-success">
                    {ui.winner?.candidateName ?? ''}
                  </p>
                </div>
              )}
            </div>

            {/* Vote Progress Bars */}
            {Array.isArray(election.results) && election.results.length > 0 && (
              <div className="space-y-3">
                {/* Cast results as array of candidate results for vote bars */}
                {[...(election.results as unknown as Array<{candidateId: string; votes: number; percentage: number}>)]
                  .sort((a, b) => b.votes - a.votes)
                  .map((result, idx) => {
                    const candidate = election.candidates.find(
                      (c) => c.candidateId === result.candidateId
                    );
                    return (
                      <div key={result.candidateId || idx}>
                        <div className="flex justify-between mb-1">
                          <span>{candidate?.candidateName ?? 'Unknown'}</span>
                          <span>
                            {result.votes.toLocaleString()} ({result.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress
                          value={result.percentage}
                          color={
                            candidate?.party === PoliticalParty.DEMOCRATIC
                              ? 'primary'
                              : candidate?.party === PoliticalParty.REPUBLICAN
                              ? 'danger'
                              : 'default'
                          }
                          size="md"
                        />
                      </div>
                    );
                  })}
              </div>
            )}
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
          selectedKeys={[election.status]}
          onChange={(e) => e.target.value && handleStatusChange(e.target.value)}
          isDisabled={isUpdating}
        >
          {ELECTION_STATUSES.filter((s) => s.key !== 'all').map((status) => (
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

export default function ElectionDashboard() {
  // State
  const [selectedTab, setSelectedTab] = useState<string>('upcoming');
  const [officeFilter, setOfficeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Modal
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Data hooks
  const {
    elections,
    total,
    totalPages,
    isLoading,
    refresh,
  } = useElections({
    officeType: officeFilter !== 'all' ? officeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    upcoming: selectedTab === 'upcoming' ? true : undefined,
    limit: 12,
    page,
  });

  const { election: selectedElection, refresh: refreshSelected } = useElection(
    selectedElectionId
  );

  // Handlers
  const handleSelectElection = (id: string) => {
    setSelectedElectionId(id);
    onOpen();
  };

  const handleCloseDetail = () => {
    onClose();
    setSelectedElectionId(null);
    refresh();
  };

  // Filter elections by search query
  const filteredElections = useMemo(() => {
    if (!searchQuery) return elections;
    const query = searchQuery.toLowerCase();
    return elections.filter(
      (e) =>
        (e.officeName ?? '').toLowerCase().includes(query) ||
        e.state?.toLowerCase().includes(query)
    );
  }, [elections, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Elections</h1>
          <p className="text-default-500">Manage elections and track results</p>
        </div>
        <Button color="primary" onPress={() => {}}>
          New Election
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-4 items-end">
            <Input
              label="Search"
              placeholder="Search elections..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="w-64"
              isClearable
            />
            <Select
              label="Office Type"
              selectedKeys={[officeFilter]}
              onChange={(e) => setOfficeFilter(e.target.value)}
              className="w-48"
            >
              {OFFICE_TYPES.map((type) => (
                <SelectItem key={type.key}>{type.label}</SelectItem>
              ))}
            </Select>
            <Select
              label="Status"
              selectedKeys={[statusFilter]}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-48"
            >
              {ELECTION_STATUSES.map((status) => (
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
        <Tab key="upcoming" title="Upcoming" />
        <Tab key="all" title="All Elections" />
      </Tabs>

      {/* Elections Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardBody className="h-32 animate-pulse bg-default-100" />
            </Card>
          ))}
        </div>
      ) : filteredElections.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredElections.map((election) => (
              <ElectionCard
                key={election._id}
                election={election}
                onSelect={handleSelectElection}
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
            <p className="text-default-500">No elections found</p>
          </CardBody>
        </Card>
      )}

      {/* Summary Stats */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-sm text-default-500">Total Elections</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {elections.filter((e) => e.status === 'Active').length}
              </p>
              <p className="text-sm text-default-500">Active Now</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {elections.filter((e) => (e.daysUntil ?? 0) > 0 && (e.daysUntil ?? 0) <= 30).length}
              </p>
              <p className="text-sm text-default-500">Coming in 30 Days</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {elections.reduce((sum, e) => sum + (e.candidateCount ?? 0), 0)}
              </p>
              <p className="text-sm text-default-500">Total Candidates</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Election Detail Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleCloseDetail}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalBody className="p-6">
            {selectedElection ? (
              <ElectionDetail
                election={selectedElection}
                onClose={handleCloseDetail}
                onRefresh={refreshSelected}
              />
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-default-500">Loading election details...</p>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
