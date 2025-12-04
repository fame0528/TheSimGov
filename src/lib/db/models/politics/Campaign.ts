/**
 * @file src/lib/db/models/politics/Campaign.ts
 * @description Campaign Mongoose schema for political campaign tracking
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Campaign model representing political campaigns for various offices.
 * Tracks campaign lifecycle (Draft → Announced → Active → Suspended → Completed),
 * fundraising, events, polling data, volunteer coordination, and platform positions.
 * Supports campaigns for President, Senator, Governor, Mayor, and other offices.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (required, indexed)
 * - playerName: Candidate/player name running the campaign
 * - party: Political party affiliation
 * - office: Office being sought (President, Senator, etc.)
 * - election: Reference to related Election document (optional)
 * - startDate: Campaign launch date
 * - endDate: Campaign end date (election day or withdrawal)
 * - status: Campaign stage (Draft, Announced, Active, Suspended, Completed)
 * 
 * Fundraising:
 * - fundsRaised: Total funds raised ($)
 * - fundsSpent: Total funds spent ($)
 * - volunteers: Number of active volunteers
 * 
 * Events & Polling:
 * - events: Array of campaign events (rallies, town halls, fundraisers, debates)
 * - polls: Array of polling data (poll date, pollster, support %, favorability)
 * 
 * Platform & Online Presence:
 * - platform: Key policy positions and messaging
 * - campaignWebsite: Official campaign website URL
 * - socialMediaHandles: Social media accounts (Twitter, Facebook, etc.)
 * 
 * IMPLEMENTATION NOTES:
 * - Status flow: Draft → Announced → Active → (Suspended) → Completed
 * - Events include: Rally, Town Hall, Fundraiser, Debate, Press Conference, Volunteer Event, Other
 * - Polling tracks support % and favorability over time
 * - Funds raised must be >= funds spent (validated in schema)
 * - Volunteers count represents active campaigners
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  PoliticalParty,
  PoliticalOffice,
  CampaignStatus,
  CampaignEventType,
} from '@/types/politics';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Campaign event interface
 */
export interface CampaignEvent {
  eventType: CampaignEventType;
  eventName: string;
  eventDate: Date;
  location: string;
  attendees?: number;
  fundsRaised?: number;
  description?: string;
}

/**
 * Campaign poll interface
 */
export interface CampaignPoll {
  pollDate: Date;
  pollster: string;
  sampleSize: number;
  support: number;
  favorability: number;
  marginOfError: number;
}

/**
 * Campaign document interface
 */
export interface ICampaign extends Document {
  // Core
  company: Types.ObjectId;
  playerId: string;
  playerName: string;
  party: PoliticalParty;
  office: PoliticalOffice;
  election?: Types.ObjectId;
  startDate: Date;
  endDate?: Date;
  status: CampaignStatus;

  // Fundraising
  fundsRaised: number;
  fundsSpent: number;
  volunteers: number;

  // Events & Polling
  events: CampaignEvent[];
  polls: CampaignPoll[];

  // Platform & Online Presence
  platform: string[];
  campaignWebsite?: string;
  socialMediaHandles?: Record<string, string>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  cashOnHand: number;
  daysActive: number;
  averagePollSupport: number;
  averageFavorability: number;
  isActive: boolean;
}

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

/**
 * Campaign event sub-schema
 */
const CampaignEventSchema = new Schema<CampaignEvent>(
  {
    eventType: {
      type: String,
      required: true,
      enum: {
        values: Object.values(CampaignEventType),
        message: '{VALUE} is not a valid campaign event type',
      },
    },
    eventName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, 'Event name must be at least 2 characters'],
      maxlength: [200, 'Event name cannot exceed 200 characters'],
    },
    eventDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    attendees: {
      type: Number,
      min: [0, 'Attendees cannot be negative'],
    },
    fundsRaised: {
      type: Number,
      min: [0, 'Funds raised cannot be negative'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
  },
  { _id: false }
);

/**
 * Campaign poll sub-schema
 */
const CampaignPollSchema = new Schema<CampaignPoll>(
  {
    pollDate: {
      type: Date,
      required: true,
    },
    pollster: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Pollster name cannot exceed 100 characters'],
    },
    sampleSize: {
      type: Number,
      required: true,
      min: [1, 'Sample size must be at least 1'],
    },
    support: {
      type: Number,
      required: true,
      min: [0, 'Support percentage cannot be negative'],
      max: [100, 'Support percentage cannot exceed 100%'],
    },
    favorability: {
      type: Number,
      required: true,
      min: [0, 'Favorability cannot be negative'],
      max: [100, 'Favorability cannot exceed 100%'],
    },
    marginOfError: {
      type: Number,
      required: true,
      default: 3,
      min: [0, 'Margin of error cannot be negative'],
      max: [20, 'Margin of error cannot exceed 20%'],
    },
  },
  { _id: false }
);

/**
 * Campaign schema definition
 */
const CampaignSchema = new Schema<ICampaign>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    playerId: {
      type: String,
      required: [true, 'Player ID is required'],
      index: true,
    },
    playerName: {
      type: String,
      required: [true, 'Player name is required'],
      trim: true,
      minlength: [2, 'Player name must be at least 2 characters'],
      maxlength: [100, 'Player name cannot exceed 100 characters'],
    },
    party: {
      type: String,
      required: [true, 'Party is required'],
      enum: {
        values: Object.values(PoliticalParty),
        message: '{VALUE} is not a valid political party',
      },
      index: true,
    },
    office: {
      type: String,
      required: [true, 'Office is required'],
      enum: {
        values: Object.values(PoliticalOffice),
        message: '{VALUE} is not a valid political office',
      },
      index: true,
    },
    election: {
      type: Schema.Types.ObjectId,
      ref: 'Election',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: Object.values(CampaignStatus),
        message: '{VALUE} is not a valid campaign status',
      },
      default: CampaignStatus.ANNOUNCED,
      index: true,
    },

    // Fundraising
    fundsRaised: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Funds raised cannot be negative'],
    },
    fundsSpent: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Funds spent cannot be negative'],
    },
    volunteers: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Volunteers cannot be negative'],
    },

    // Events & Polling
    events: {
      type: [CampaignEventSchema],
      default: [],
    },
    polls: {
      type: [CampaignPollSchema],
      default: [],
    },

    // Platform & Online Presence
    platform: {
      type: [String],
      default: [],
    },
    campaignWebsite: {
      type: String,
      trim: true,
    },
    socialMediaHandles: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
    collection: 'campaigns',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================================
// INDEXES
// ============================================================================

CampaignSchema.index({ company: 1, status: 1 });
CampaignSchema.index({ company: 1, party: 1 });
CampaignSchema.index({ company: 1, office: 1 });
CampaignSchema.index({ playerName: 1, office: 1 });
CampaignSchema.index({ startDate: -1 });

// ============================================================================
// VIRTUAL FIELDS
// ============================================================================

/**
 * Virtual: cashOnHand
 */
CampaignSchema.virtual('cashOnHand').get(function (this: ICampaign): number {
  return Math.max(0, this.fundsRaised - this.fundsSpent);
});

/**
 * Virtual: daysActive
 */
CampaignSchema.virtual('daysActive').get(function (this: ICampaign): number {
  const now = this.endDate || new Date();
  const startDate = new Date(this.startDate);
  const diffTime = now.getTime() - startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

/**
 * Virtual: averagePollSupport
 */
CampaignSchema.virtual('averagePollSupport').get(function (this: ICampaign): number {
  if (this.polls.length === 0) return 0;
  const total = this.polls.reduce((sum, poll) => sum + poll.support, 0);
  return total / this.polls.length;
});

/**
 * Virtual: averageFavorability
 */
CampaignSchema.virtual('averageFavorability').get(function (this: ICampaign): number {
  if (this.polls.length === 0) return 0;
  const total = this.polls.reduce((sum, poll) => sum + poll.favorability, 0);
  return total / this.polls.length;
});

/**
 * Virtual: isActive
 */
CampaignSchema.virtual('isActive').get(function (this: ICampaign): boolean {
  return this.status === CampaignStatus.ACTIVE || this.status === CampaignStatus.ANNOUNCED;
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Add an event to the campaign
 */
CampaignSchema.methods.addEvent = function (this: ICampaign, event: CampaignEvent): void {
  this.events.push(event);
  
  // Add fundraising from event to total
  if (event.fundsRaised) {
    this.fundsRaised += event.fundsRaised;
  }
};

/**
 * Add a poll to the campaign
 */
CampaignSchema.methods.addPoll = function (this: ICampaign, poll: CampaignPoll): void {
  this.polls.push(poll);
};

/**
 * Spend campaign funds
 */
CampaignSchema.methods.spendFunds = function (this: ICampaign, amount: number): boolean {
  if (amount < 0) return false;
  if (this.cashOnHand < amount) return false;
  
  this.fundsSpent += amount;
  return true;
};

/**
 * Add volunteers
 */
CampaignSchema.methods.addVolunteers = function (this: ICampaign, count: number): void {
  this.volunteers = Math.max(0, this.volunteers + count);
};

// ============================================================================
// PRE-SAVE HOOKS
// ============================================================================

/**
 * Pre-save hook: Validate funds spent <= funds raised, update status
 */
CampaignSchema.pre<ICampaign>('save', function (next) {
  // Ensure funds spent doesn't exceed funds raised
  if (this.fundsSpent > this.fundsRaised) {
    const error = new Error('Funds spent cannot exceed funds raised');
    return next(error);
  }

  // Auto-complete campaign if end date has passed
  if (this.endDate && new Date(this.endDate) < new Date() && this.status !== CampaignStatus.COMPLETED) {
    this.status = CampaignStatus.COMPLETED;
  }

  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);

export default Campaign;
