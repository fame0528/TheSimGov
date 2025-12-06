"use client";

import React, { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Tabs, Tab } from "@heroui/tabs";
import { Divider } from "@heroui/divider";
import { StatusChip } from "@/components/politics/StatusChip";
import { useToast } from "@/lib/hooks/ui/useToast";

function statusColor(status: string): "default" | "success" | "warning" | "danger" | "primary" {
  switch (status) {
    case "Completed":
      return "success";
    case "InProgress":
      return "primary";
    case "Upcoming":
      return "warning";
    default:
      return "default";
  }
}

interface Candidate {
  userId: string;
  party: string;
  status: string; // Active, Withdrawn, Won, Lost
  votes?: number;
  votePercentage?: number;
}

interface ElectionDetail {
  _id: string;
  officeType: string;
  district?: string | null;
  electionDate: string; // ISO
  electionType: string;
  status: string; // Upcoming, InProgress, Completed
  candidates: Candidate[];
  turnout?: number;
  results?: {
    winnerId?: string;
    margin?: number;
    runoffRequired?: boolean;
  };
}

export default function ElectionDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const toast = useToast();

  // Data hook temporarily disabled until Politics hooks are wired
  // Placeholder data to satisfy types until hooks are wired
  const election: ElectionDetail | null = null as unknown as ElectionDetail;
  const isLoading = false;
  const error: any = null;
  const refresh = () => {};
  const updateElectionStatus = async (_id: string, _status: string) => {};

  useEffect(() => {
    if (error) {
      toast.error(`Failed to load election: ${error.message}`);
    }
  }, [error]);

  const onMarkInProgress = async () => {
    try {
      await updateElectionStatus(id, "InProgress");
      toast.success("Election marked In Progress");
      refresh();
    } catch (e: any) {
      toast.error(`Update failed: ${e?.message ?? "Unknown error"}`);
    }
  };

  const onMarkCompleted = async () => {
    try {
      await updateElectionStatus(id, "Completed");
      toast.success("Election marked Completed");
      refresh();
    } catch (e: any) {
      toast.error(`Update failed: ${e?.message ?? "Unknown error"}`);
    }
  };

  const header = useMemo(() => {
    if (!election) return null;
    return (
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {election.officeType} {election.district ? `- ${election.district}` : "(Statewide)"}
          </h1>
          <p className="text-default-700">
            {new Date(election.electionDate).toLocaleDateString()} • {election.electionType}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusChip label={election.status} color={statusColor(election.status)} />
          <Button size="sm" variant="flat" onPress={() => refresh()}>Refresh</Button>
          {election.status === "Upcoming" && (
            <Button size="sm" color="primary" onPress={onMarkInProgress}>Start</Button>
          )}
          {election.status === "InProgress" && (
            <Button size="sm" color="success" onPress={onMarkCompleted}>Complete</Button>
          )}
        </div>
      </div>
    );
  }, [election]);

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          {header ?? <span className="text-default-700">Loading...</span>}
        </CardHeader>
        <Divider />
        <CardBody className="flex flex-col gap-6">
          {/* Summary */}
          {election && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <SummaryStat label="Turnout" value={election.turnout ? `${election.turnout}%` : "—"} />
              <SummaryStat label="Candidates" value={String(election.candidates?.length ?? 0)} />
              <SummaryStat label="Winner" value={election.results?.winnerId ? election.results.winnerId : "—"} />
              <SummaryStat label="Margin" value={election.results?.margin != null ? `${election.results.margin}` : "—"} />
            </div>
          )}

          {/* Tabs: Candidates, Results, Analytics */}
          <Tabs aria-label="Election tabs">
            <Tab key="candidates" title="Candidates">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {election?.candidates?.map((c: Candidate) => (
                  <CandidateCard key={c.userId} c={c} />
                ))}
              </div>
            </Tab>
            <Tab key="results" title="Results">
              <div className="flex flex-col gap-3">
                {election?.status !== "Completed" ? (
                  <p className="text-default-700">Results available after completion.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {election?.candidates?.map((c: Candidate) => (
                      <ResultCard key={c.userId} c={c} />
                    ))}
                  </div>
                )}
              </div>
            </Tab>
            <Tab key="analytics" title="Analytics">
              <p className="text-default-700">Polling trends, district breakdowns, and turnout analytics (Phase 6 later step).</p>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-default-200 p-4">
      <p className="text-default-700 text-sm">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function CandidateCard({ c }: { c: Candidate }) {
  return (
    <div className="rounded-lg border border-default-200 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{c.userId}</span>
        <Chip color={partyColor(c.party)}>{c.party}</Chip>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-default-700">Status</span>
        <StatusChip label={c.status} color={statusColor(c.status)} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-default-700">Votes</span>
        <span>{c.votes ?? "—"}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-default-700">Vote %</span>
        <span>{c.votePercentage != null ? `${c.votePercentage}%` : "—"}</span>
      </div>
    </div>
  );
}

function ResultCard({ c }: { c: Candidate }) {
  return (
    <div className="rounded-lg border border-default-200 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{c.userId}</span>
        <Chip color={partyColor(c.party)}>{c.party}</Chip>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-default-700">Final Votes</span>
        <span>{c.votes ?? "—"}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-default-700">Final %</span>
        <span>{c.votePercentage != null ? `${c.votePercentage}%` : "—"}</span>
      </div>
    </div>
  );
}

function partyColor(party: string): "primary" | "danger" | "secondary" | "warning" | "default" {

  function statusColor(status: string): "default" | "success" | "warning" | "danger" | "primary" {
    switch (status) {
      case "Completed":
        return "success";
      case "InProgress":
        return "primary";
      case "Upcoming":
        return "warning";
      default:
        return "default";
    }
  }
  switch (party?.toLowerCase()) {
    case "democrat":
      return "primary";
    case "republican":
      return "danger";
    case "independent":
      return "secondary";
    case "tossup":
      return "warning";
    default:
      return "default";
  }
}
