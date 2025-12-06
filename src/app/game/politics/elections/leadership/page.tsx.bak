/**
 * @fileoverview Leadership Elections Page
 * @module app/game/politics/elections/leadership/page
 * 
 * OVERVIEW:
 * View and participate in internal leadership elections for lobbies and parties.
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
} from '@heroui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Vote, Clock, CheckCircle } from 'lucide-react';
import LeadershipElectionsGrid from '@/components/politics/elections/LeadershipElectionsGrid';
import type { LeadershipElectionSummary } from '@/lib/types/leadership';
import { LeadershipElectionStatus } from '@/lib/types/leadership';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LeadershipElectionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('active');

  // Fetch elections
  const { data: electionsData, error, isLoading } = useSWR<{
    success: boolean;
    elections: LeadershipElectionSummary[];
    userVotes?: string[];
    canVoteIn?: string[];
  }>('/api/politics/elections/leadership', fetcher);

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

  const elections = electionsData?.elections || [];
  const userVotes = electionsData?.userVotes || [];
  const canVoteIn = electionsData?.canVoteIn || [];

  // Filter elections by status
  const activeElections = elections.filter((e) =>
    [LeadershipElectionStatus.FILING, LeadershipElectionStatus.VOTING, LeadershipElectionStatus.RUNOFF].includes(e.status)
  );
  const upcomingElections = elections.filter((e) => e.status === LeadershipElectionStatus.SCHEDULED);
  const completedElections = elections.filter((e) =>
    [LeadershipElectionStatus.COMPLETED, LeadershipElectionStatus.CANCELLED].includes(e.status)
  );

  const handleVote = async (electionId: string) => {
    // Navigate to election detail page for voting
    router.push(`/game/politics/elections/leadership/${electionId}`);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          isIconOnly
          variant="light"
          onPress={() => router.push('/game/politics')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Leadership Elections</h1>
          <p className="text-default-500">Vote for leaders in your organizations</p>
        </div>
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
                  <span>Active ({activeElections.length})</span>
                </div>
              }
            />
            <Tab
              key="upcoming"
              title={
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Upcoming ({upcomingElections.length})</span>
                </div>
              }
            />
            <Tab
              key="completed"
              title={
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Completed ({completedElections.length})</span>
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
            <p className="text-danger">Failed to load elections. Please try again.</p>
          </CardBody>
        </Card>
      ) : (
        <LeadershipElectionsGrid
          elections={
            selectedTab === 'active'
              ? activeElections
              : selectedTab === 'upcoming'
              ? upcomingElections
              : completedElections
          }
          isLoading={isLoading}
          userVotes={userVotes}
          canVoteIn={canVoteIn}
          onVote={handleVote}
        />
      )}
    </div>
  );
}
