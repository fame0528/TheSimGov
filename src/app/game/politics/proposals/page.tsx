/**
 * @fileoverview Proposals Page
 * @module app/game/politics/proposals/page
 * 
 * OVERVIEW:
 * Browse, create, and vote on proposals within organizations.
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  Card,
  CardBody,
  Button,
  Tabs,
  Tab,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Select,
  SelectItem,
  useDisclosure,
} from '@heroui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, FileText, Vote, Clock, CheckCircle } from 'lucide-react';
import ProposalsGrid from '@/components/politics/proposals/ProposalsGrid';
import type { ProposalSummary } from '@/lib/types/proposal';
import {
  ProposalStatus,
  ProposalCategory,
  ProposalPriority,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
} from '@/lib/types/proposal';
import { OrganizationType } from '@/lib/types/leadership';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProposalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTab, setSelectedTab] = useState('active');
  const [isCreating, setIsCreating] = useState(false);

  // Form state for creating a proposal
  const [formData, setFormData] = useState({
    organizationType: OrganizationType.LOBBY,
    organizationId: '',
    category: ProposalCategory.POLICY,
    priority: ProposalPriority.NORMAL,
    title: '',
    summary: '',
    body: '',
    rationale: '',
  });

  // Fetch proposals
  const { data: proposalsData, error, isLoading, mutate } = useSWR<{
    success: boolean;
    proposals: ProposalSummary[];
    userVotes?: string[];
    canVoteIn?: string[];
  }>('/api/politics/proposals', fetcher);

  // Fetch user's organizations for the create modal
  const { data: orgsData } = useSWR<{
    success: boolean;
    lobbies?: Array<{ id: string; name: string }>;
    parties?: Array<{ id: string; name: string }>;
  }>('/api/politics/my-organizations', fetcher);

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const proposals = proposalsData?.proposals || [];
  const userVotes = proposalsData?.userVotes || [];
  const canVoteIn = proposalsData?.canVoteIn || [];
  const myLobbies = orgsData?.lobbies || [];
  const myParties = orgsData?.parties || [];

  // Filter proposals by status
  const activeProposals = proposals.filter((p) =>
    [ProposalStatus.SUBMITTED, ProposalStatus.DEBATE, ProposalStatus.VOTING].includes(p.status)
  );
  const draftProposals = proposals.filter((p) => p.status === ProposalStatus.DRAFT);
  const completedProposals = proposals.filter((p) =>
    [ProposalStatus.PASSED, ProposalStatus.FAILED, ProposalStatus.VETOED, ProposalStatus.WITHDRAWN, ProposalStatus.IMPLEMENTED].includes(p.status)
  );

  const handleCreateProposal = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/politics/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        onClose();
        mutate();
        setFormData({
          organizationType: OrganizationType.LOBBY,
          organizationId: '',
          category: ProposalCategory.POLICY,
          priority: ProposalPriority.NORMAL,
          title: '',
          summary: '',
          body: '',
          rationale: '',
        });
      }
    } catch (err) {
      console.error('Failed to create proposal:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleVote = async (proposalId: string) => {
    // Navigate to proposal detail page for voting
    router.push(`/game/politics/proposals/${proposalId}`);
  };

  const availableOrgs = formData.organizationType === OrganizationType.LOBBY ? myLobbies : myParties;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="light"
            onPress={() => router.push('/game/politics')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Proposals</h1>
            <p className="text-default-700">Submit and vote on organizational proposals</p>
          </div>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="w-4 h-4" />}
          onPress={onOpen}
          isDisabled={myLobbies.length === 0 && myParties.length === 0}
        >
          Create Proposal
        </Button>
      </div>

      {/* Tabs */}
      <Card className="mb-6">
        <CardBody>
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
          >
            <Tab
              key="active"
              title={
                <div className="flex items-center gap-2">
                  <Vote className="w-4 h-4" />
                  <span>Active ({activeProposals.length})</span>
                </div>
              }
            />
            <Tab
              key="drafts"
              title={
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Drafts ({draftProposals.length})</span>
                </div>
              }
            />
            <Tab
              key="completed"
              title={
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Completed ({completedProposals.length})</span>
                </div>
              }
            />
          </Tabs>
        </CardBody>
      </Card>

      {/* Content */}
      {error ? (
        <Card>
          <CardBody>
            <p className="text-danger">Failed to load proposals. Please try again.</p>
          </CardBody>
        </Card>
      ) : (
        <ProposalsGrid
          proposals={
            selectedTab === 'active'
              ? activeProposals
              : selectedTab === 'drafts'
              ? draftProposals
              : completedProposals
          }
          isLoading={isLoading}
          userVotes={userVotes}
          canVoteIn={canVoteIn}
          onVote={handleVote}
        />
      )}

      {/* Create Proposal Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>Create a New Proposal</ModalHeader>
          <ModalBody className="gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Organization Type"
                selectedKeys={[formData.organizationType]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as OrganizationType;
                  setFormData({ ...formData, organizationType: value, organizationId: '' });
                }}
              >
                <SelectItem key={OrganizationType.LOBBY}>Lobby</SelectItem>
                <SelectItem key={OrganizationType.PARTY}>Party</SelectItem>
              </Select>
              <Select
                label="Organization"
                selectedKeys={formData.organizationId ? [formData.organizationId] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setFormData({ ...formData, organizationId: value });
                }}
                isDisabled={availableOrgs.length === 0}
              >
                {availableOrgs.map((org) => (
                  <SelectItem key={org.id}>{org.name}</SelectItem>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Category"
                selectedKeys={[formData.category]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as ProposalCategory;
                  setFormData({ ...formData, category: value });
                }}
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value}>{label}</SelectItem>
                ))}
              </Select>
              <Select
                label="Priority"
                selectedKeys={[formData.priority]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as ProposalPriority;
                  setFormData({ ...formData, priority: value });
                }}
              >
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value}>{label}</SelectItem>
                ))}
              </Select>
            </div>
            <Input
              label="Title"
              placeholder="A clear, concise title for your proposal"
              value={formData.title}
              onValueChange={(value) => setFormData({ ...formData, title: value })}
              isRequired
            />
            <Input
              label="Summary"
              placeholder="A brief summary (1-2 sentences)"
              value={formData.summary}
              onValueChange={(value) => setFormData({ ...formData, summary: value })}
              isRequired
            />
            <Textarea
              label="Full Proposal"
              placeholder="The complete text of your proposal"
              value={formData.body}
              onValueChange={(value) => setFormData({ ...formData, body: value })}
              isRequired
              minRows={5}
            />
            <Textarea
              label="Rationale (Optional)"
              placeholder="Why this proposal should be adopted"
              value={formData.rationale}
              onValueChange={(value) => setFormData({ ...formData, rationale: value })}
              minRows={3}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleCreateProposal}
              isLoading={isCreating}
              isDisabled={!formData.organizationId || !formData.title || !formData.summary || !formData.body}
            >
              Create Proposal
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
