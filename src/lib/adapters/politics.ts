import type { ElectionData, VoterOutreachData } from '@/types/politics';

export type ElectionUI = ElectionData & {
  officeName?: string;
  state?: string;
  filingDeadline?: string | Date;
  earlyVotingStart?: string | Date;
  termLength?: number;
  winner?: { candidateId?: string; candidateName?: string } | null;
  totalVotes?: number;
  turnout?: number;
  margin?: number;
};

export function toElectionUI(e: ElectionData): ElectionUI {
  return {
    ...e,
    officeName: (e as any).officeName ?? undefined,
    state: (e as any).state ?? undefined,
    filingDeadline: (e as any).filingDeadline ?? undefined,
    earlyVotingStart: (e as any).earlyVotingStart ?? undefined,
    termLength: (e as any).termLength ?? undefined,
    winner: (e as any).winner ?? null,
    totalVotes: (e as any).totalVotes ?? 0,
    turnout: (e as any).turnout ?? 0,
    margin: (e as any).margin ?? 0,
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
  const anyO = o as any;
  return {
    ...o,
    name: anyO.name ?? undefined,
    type: anyO.type ?? undefined,
    status: anyO.status ?? undefined,
    scheduledDate: anyO.scheduledDate ?? undefined,
    targetContacts: anyO.targetContacts ?? 0,
    volunteerCount: anyO.volunteerCount ?? 0,
    volunteers: Array.isArray(anyO.volunteers) ? anyO.volunteers : [],
    talkingPoints: Array.isArray(anyO.talkingPoints) ? anyO.talkingPoints : [],
    script: anyO.script ?? undefined,
    metrics: anyO.metrics ?? {
      totalAttempts: anyO.totalAttempts ?? 0,
      successfulContacts: anyO.successfulContacts ?? 0,
      contactRate: anyO.contactRate ?? 0,
      supportRate: anyO.supportRate ?? 0,
      supporterIdentified: anyO.supporterIdentified ?? 0,
      undecided: anyO.undecided ?? 0,
      opposition: anyO.opposition ?? 0,
      noAnswer: anyO.noAnswer ?? 0,
    },
  };
}
