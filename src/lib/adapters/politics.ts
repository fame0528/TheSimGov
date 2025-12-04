import type { ElectionData, VoterOutreachData } from '@/types/politics';

export type ElectionUI = ElectionData & {
  officeName?: string;
  state?: string;
  filingDeadline?: string | Date;
  earlyVotingStart?: string | Date;
  termLength?: number;
  winner?: { playerId?: string; candidateId?: string; candidateName?: string } | null;
  totalVotes?: number;
  turnout?: number;
  margin?: number;
};

export function toElectionUI(e: ElectionData): ElectionUI {
  // Use Record type to safely access extended properties from API response
  const ext = e as unknown as Record<string, unknown>;
  return {
    ...e,
    officeName: (ext.officeName as string | undefined) ?? undefined,
    state: (ext.state as string | undefined) ?? undefined,
    filingDeadline: (ext.filingDeadline as string | Date | undefined) ?? undefined,
    earlyVotingStart: (ext.earlyVotingStart as string | Date | undefined) ?? undefined,
    termLength: (ext.termLength as number | undefined) ?? undefined,
    winner: (ext.winner as ElectionUI['winner']) ?? null,
    totalVotes: (ext.totalVotes as number | undefined) ?? 0,
    turnout: (ext.turnout as number | undefined) ?? 0,
    margin: (ext.margin as number | undefined) ?? 0,
  };
}

export type OutreachUI = VoterOutreachData & {
  name?: string;
  type?: string;
  status?: string;
  scheduledDate?: string | Date;
  targetContacts?: number;
  volunteerCount?: number;
  volunteers?: Array<{
    volunteerId: string;
    assignedContacts: number;
    completedContacts: number;
    completionRate: number;
    hoursWorked: number;
    isCheckedIn?: boolean;
  }>;
  talkingPoints?: string[];
  script?: string;
  metrics?: {
    totalAttempts?: number;
    successfulContacts?: number;
    contactRate?: number;
    supportRate?: number;
    supporterIdentified?: number;
    undecided?: number;
    opposition?: number;
    noAnswer?: number;
  };
};

export function toOutreachUI(o: VoterOutreachData): OutreachUI {
  // Use Record type to safely access extended properties from API response
  const ext = o as unknown as Record<string, unknown>;
  return {
    ...o,
    name: (ext.name as string | undefined) ?? undefined,
    type: (ext.type as string | undefined) ?? undefined,
    status: (ext.status as string | undefined) ?? undefined,
    scheduledDate: (ext.scheduledDate as string | Date | undefined) ?? undefined,
    targetContacts: (ext.targetContacts as number | undefined) ?? 0,
    volunteerCount: (ext.volunteerCount as number | undefined) ?? 0,
    volunteers: Array.isArray(ext.volunteers) ? ext.volunteers as OutreachUI['volunteers'] : [],
    talkingPoints: Array.isArray(ext.talkingPoints) ? ext.talkingPoints as string[] : [],
    script: (ext.script as string | undefined) ?? undefined,
    metrics: (ext.metrics as OutreachUI['metrics']) ?? {
      totalAttempts: (ext.totalAttempts as number | undefined) ?? 0,
      successfulContacts: (ext.successfulContacts as number | undefined) ?? 0,
      contactRate: (ext.contactRate as number | undefined) ?? 0,
      supportRate: (ext.supportRate as number | undefined) ?? 0,
      supporterIdentified: (ext.supporterIdentified as number | undefined) ?? 0,
      undecided: (ext.undecided as number | undefined) ?? 0,
      opposition: (ext.opposition as number | undefined) ?? 0,
      noAnswer: (ext.noAnswer as number | undefined) ?? 0,
    },
  };
}
