/**
 * @file src/lib/game/tick/politicsProcessor.ts
 * @description Politics tick processor for game tick engine
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Processes time-based political events each game tick:
 * - Bill progression through legislative process
 * - Campaign activity and events
 * - Election cycles and voting
 * - Lobbying influence decay
 * - Voter outreach effectiveness
 * - Union and paramilitary actions
 *
 * GAMEPLAY IMPACT:
 * This drives political progression. Each tick:
 * - Bills advance through committees/votes
 * - Campaigns gain/lose momentum
 * - Elections are held when scheduled
 * - Lobbying efforts decay over time
 * - Political capital fluctuates
 *
 * @author ECHO v1.4.0
 */

import {
  ITickProcessor,
  GameTime,
  TickProcessorResult,
  TickProcessorOptions,
  TickError,
  PoliticsTickSummary,
} from '@/lib/types/gameTick';
import {
  BillStatus,
  VoteType,
  ElectionStatus,
  CampaignEventType,
} from '@/types/politics';
import mongoose from 'mongoose';

// ============================================================================
// CONSTANTS
// ============================================================================

const PROCESSOR_NAME = 'politics';
const PROCESSOR_PRIORITY = 50; // After other industries

// Bill advancement rates (probability per tick)
const BILL_ADVANCE_RATES: Record<string, number> = {
  [BillStatus.DRAFTED]: 0.20,        // 20% to be introduced
  [BillStatus.INTRODUCED]: 0.15,     // 15% to go to committee
  [BillStatus.IN_COMMITTEE]: 0.10,   // 10% to floor debate
  [BillStatus.FLOOR_DEBATE]: 0.12,   // 12% to pass house
  [BillStatus.PASSED_HOUSE]: 0.15,   // 15% to pass senate
  [BillStatus.PASSED_SENATE]: 0.20,  // 20% sent to executive
  [BillStatus.SENT_TO_EXECUTIVE]: 0.25, // 25% signed
};

// Bill failure rates
const BILL_FAIL_RATES: Record<string, number> = {
  [BillStatus.IN_COMMITTEE]: 0.05,
  [BillStatus.FLOOR_DEBATE]: 0.08,
  [BillStatus.PASSED_HOUSE]: 0.03,
  [BillStatus.PASSED_SENATE]: 0.02,
  [BillStatus.SENT_TO_EXECUTIVE]: 0.10, // Veto rate
};

// XP rewards
const XP_PER_BILL_ADVANCED = 50;
const XP_PER_BILL_PASSED = 500;
const XP_PER_ELECTION_WON = 1000;
const XP_PER_CAMPAIGN_EVENT = 25;
const XP_PER_LOBBYING_SUCCESS = 100;

// ============================================================================
// TYPE DEFINITIONS FOR MODELS
// ============================================================================

interface IBillDoc extends mongoose.Document {
  company: mongoose.Types.ObjectId;
  status: string;
  votes: Array<{ legislatorName: string; party: string; district: string; vote: string }>;
  lastAction: string;
  lastActionDate: Date;
}

interface ICampaignDoc extends mongoose.Document {
  company: mongoose.Types.ObjectId;
  status: string;
  fundsRaised: number;
  fundsSpent: number;
  volunteers: number;
  events: Array<{
    eventType: string;
    eventName: string;
    eventDate: Date;
    attendees?: number;
    fundsRaised?: number;
  }>;
}

interface IElectionDoc extends mongoose.Document {
  company: mongoose.Types.ObjectId;
  status: string;
  electionDate: Date;
  candidates: Array<{
    playerId: string;
    candidateName: string;
    party: string;
    votes: number;
    votePercentage: number;
  }>;
  registeredVoters: number;
  results?: {
    totalVotes: number;
    turnoutRate: number;
    winnerId: string;
    winnerName: string;
  };
}

interface ILobbyDoc extends mongoose.Document {
  name: string;
  influencePool: number;
  strength: { influence: number; reputation: number };
  members: Array<{ playerId: string; displayName: string }>;
}

interface IVoterOutreachDoc extends mongoose.Document {
  company: mongoose.Types.ObjectId;
  method: string;
  reach: number;
  effectiveness: number;
  cost: number;
}

interface IUnionDoc extends mongoose.Document {
  company: mongoose.Types.ObjectId;
  memberCount: number;
  status: string;
  monthlyDues: number;
}

interface IParamilitaryDoc extends mongoose.Document {
  company: mongoose.Types.ObjectId;
  memberCount: number;
  status: string;
  operationalBudget: number;
}

// ============================================================================
// LAZY MODEL LOADER
// ============================================================================

const getModels = () => ({
  Bill: mongoose.models.Bill as mongoose.Model<IBillDoc> | undefined,
  Campaign: mongoose.models.Campaign as mongoose.Model<ICampaignDoc> | undefined,
  Election: mongoose.models.Election as mongoose.Model<IElectionDoc> | undefined,
  Lobby: mongoose.models.Lobby as mongoose.Model<ILobbyDoc> | undefined,
  VoterOutreach: mongoose.models.VoterOutreach as mongoose.Model<IVoterOutreachDoc> | undefined,
  Union: mongoose.models.Union as mongoose.Model<IUnionDoc> | undefined,
  Paramilitary: mongoose.models.Paramilitary as mongoose.Model<IParamilitaryDoc> | undefined,
});

// ============================================================================
// POLITICS PROCESSOR
// ============================================================================

/**
 * Politics tick processor
 * Handles all time-based political operations
 */
export class PoliticsProcessor implements ITickProcessor {
  name = PROCESSOR_NAME;
  priority = PROCESSOR_PRIORITY;
  enabled = true;
  
  /**
   * Validate processor is ready
   */
  async validate(): Promise<true | string> {
    try {
      const models = getModels();
      // Check at least one politics model exists
      if (models.Bill) {
        await models.Bill.findOne().limit(1);
      }
      return true;
    } catch (error) {
      return `Database connection error: ${error instanceof Error ? error.message : 'Unknown'}`;
    }
  }
  
  /**
   * Process one tick for politics
   */
  async process(
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<TickProcessorResult> {
    const startTime = Date.now();
    const errors: TickError[] = [];
    
    // Initialize summary counters
    const summary: PoliticsTickSummary = {
      billsProcessed: 0,
      billsAdvanced: 0,
      billsPassed: 0,
      billsFailed: 0,
      billsVetoed: 0,
      billsSigned: 0,
      campaignsProcessed: 0,
      electionsHeld: 0,
      electionsWon: 0,
      electionsLost: 0,
      votesReceived: 0,
      lobbyingActionsProcessed: 0,
      lobbyingSuccessful: 0,
      lobbyingInfluenceSpent: 0,
      donationsProcessed: 0,
      donationsReceived: 0,
      totalFundsRaised: 0,
      unionsProcessed: 0,
      membershipChanges: 0,
      strikesStarted: 0,
      strikesEnded: 0,
      paramilitariesProcessed: 0,
      outreachActionsProcessed: 0,
      votersReached: 0,
      supportGained: 0,
      campaignSpending: 0,
      lobbyingSpending: 0,
      totalPoliticalSpending: 0,
    };
    
    try {
      const models = getModels();
      
      // Build query filter
      const baseQuery: Record<string, unknown> = {};
      if (options?.companyId) {
        baseQuery.company = options.companyId;
      }
      
      // Process bills
      if (models.Bill) {
        const billResults = await this.processBills(
          models.Bill,
          baseQuery,
          gameTime,
          options
        );
        summary.billsProcessed = billResults.processed;
        summary.billsAdvanced = billResults.advanced;
        summary.billsPassed = billResults.passed;
        summary.billsFailed = billResults.failed;
        summary.billsVetoed = billResults.vetoed;
        summary.billsSigned = billResults.signed;
        errors.push(...billResults.errors);
      }
      
      // Process campaigns
      if (models.Campaign) {
        const campaignResults = await this.processCampaigns(
          models.Campaign,
          baseQuery,
          gameTime,
          options
        );
        summary.campaignsProcessed = campaignResults.processed;
        summary.totalFundsRaised += campaignResults.fundsRaised;
        summary.campaignSpending = campaignResults.spent;
        errors.push(...campaignResults.errors);
      }
      
      // Process elections
      if (models.Election) {
        const electionResults = await this.processElections(
          models.Election,
          baseQuery,
          gameTime,
          options
        );
        summary.electionsHeld = electionResults.held;
        summary.electionsWon = electionResults.won;
        summary.electionsLost = electionResults.lost;
        summary.votesReceived = electionResults.totalVotes;
        errors.push(...electionResults.errors);
      }
      
      // Process lobbying
      if (models.Lobby) {
        const lobbyResults = await this.processLobbying(
          models.Lobby,
          options
        );
        summary.lobbyingActionsProcessed = lobbyResults.processed;
        summary.lobbyingSuccessful = lobbyResults.successful;
        summary.lobbyingInfluenceSpent = lobbyResults.influenceSpent;
        summary.lobbyingSpending = lobbyResults.moneySpent;
        errors.push(...lobbyResults.errors);
      }
      
      // Process voter outreach
      if (models.VoterOutreach) {
        const outreachResults = await this.processVoterOutreach(
          models.VoterOutreach,
          baseQuery,
          options
        );
        summary.outreachActionsProcessed = outreachResults.processed;
        summary.votersReached = outreachResults.reached;
        summary.supportGained = outreachResults.supportGained;
        errors.push(...outreachResults.errors);
      }
      
      // Process unions
      if (models.Union) {
        const unionResults = await this.processUnions(
          models.Union,
          baseQuery,
          options
        );
        summary.unionsProcessed = unionResults.processed;
        summary.membershipChanges = unionResults.membershipChanges;
        summary.strikesStarted = unionResults.strikesStarted;
        summary.strikesEnded = unionResults.strikesEnded;
        errors.push(...unionResults.errors);
      }
      
      // Process paramilitaries
      if (models.Paramilitary) {
        const paramResults = await this.processParamilitaries(
          models.Paramilitary,
          baseQuery,
          options
        );
        summary.paramilitariesProcessed = paramResults.processed;
        errors.push(...paramResults.errors);
      }
      
      // Calculate totals
      summary.totalPoliticalSpending = summary.campaignSpending + summary.lobbyingSpending;
      
      const itemsProcessed = 
        summary.billsProcessed +
        summary.campaignsProcessed +
        summary.electionsHeld +
        summary.lobbyingActionsProcessed +
        summary.unionsProcessed +
        summary.paramilitariesProcessed;
      
      return {
        processor: PROCESSOR_NAME,
        success: errors.filter(e => !e.recoverable).length === 0,
        itemsProcessed,
        errors,
        summary,
        durationMs: Date.now() - startTime,
      };
      
    } catch (error) {
      return {
        processor: PROCESSOR_NAME,
        success: false,
        itemsProcessed: 0,
        errors: [{
          entityId: 'system',
          entityType: 'PoliticsProcessor',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: false,
        }],
        summary,
        durationMs: Date.now() - startTime,
      };
    }
  }
  
  // ==========================================================================
  // BILL PROCESSING
  // ==========================================================================
  
  /**
   * Process all active bills
   */
  private async processBills(
    model: mongoose.Model<IBillDoc>,
    baseQuery: Record<string, unknown>,
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<{
    processed: number;
    advanced: number;
    passed: number;
    failed: number;
    vetoed: number;
    signed: number;
    errors: TickError[];
  }> {
    const errors: TickError[] = [];
    let processed = 0;
    let advanced = 0;
    let passed = 0;
    let failed = 0;
    let vetoed = 0;
    let signed = 0;
    
    try {
      // Get active bills (not yet signed, vetoed, or failed)
      const activeBills = await model.find({
        ...baseQuery,
        status: { 
          $nin: [
            BillStatus.SIGNED, 
            BillStatus.VETOED, 
            BillStatus.FAILED
          ] 
        },
      }).limit(options?.limit || 500);
      
      for (const bill of activeBills) {
        try {
          processed++;
          
          const currentStatus = bill.status as BillStatus;
          const advanceRate = BILL_ADVANCE_RATES[currentStatus] || 0.05;
          const failRate = BILL_FAIL_RATES[currentStatus] || 0.02;
          
          const roll = Math.random();
          
          if (roll < failRate) {
            // Bill fails or is vetoed
            if (currentStatus === BillStatus.SENT_TO_EXECUTIVE) {
              if (!options?.dryRun) {
                bill.status = BillStatus.VETOED;
                bill.lastAction = 'Bill vetoed by executive';
                bill.lastActionDate = new Date();
                await bill.save();
              }
              vetoed++;
            } else {
              if (!options?.dryRun) {
                bill.status = BillStatus.FAILED;
                bill.lastAction = 'Bill failed to advance';
                bill.lastActionDate = new Date();
                await bill.save();
              }
              failed++;
            }
          } else if (roll < failRate + advanceRate) {
            // Bill advances
            const nextStatus = this.getNextBillStatus(currentStatus);
            
            if (nextStatus === BillStatus.SIGNED) {
              signed++;
              passed++;
            } else {
              advanced++;
            }
            
            if (!options?.dryRun) {
              bill.status = nextStatus;
              bill.lastAction = `Bill advanced to ${nextStatus}`;
              bill.lastActionDate = new Date();
              await bill.save();
            }
          }
          // else: No change this tick
          
        } catch (error) {
          errors.push({
            entityId: bill._id?.toString() || 'unknown',
            entityType: 'Bill',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            recoverable: true,
          });
        }
      }
      
      return { processed, advanced, passed, failed, vetoed, signed, errors };
      
    } catch (error) {
      errors.push({
        entityId: 'system',
        entityType: 'Bill',
        message: error instanceof Error ? error.message : 'Failed to query bills',
        recoverable: true,
      });
      return { processed, advanced, passed, failed, vetoed, signed, errors };
    }
  }
  
  /**
   * Get next bill status in legislative process
   */
  private getNextBillStatus(current: BillStatus): BillStatus {
    const progression: Record<BillStatus, BillStatus> = {
      [BillStatus.DRAFTED]: BillStatus.INTRODUCED,
      [BillStatus.INTRODUCED]: BillStatus.IN_COMMITTEE,
      [BillStatus.IN_COMMITTEE]: BillStatus.FLOOR_DEBATE,
      [BillStatus.FLOOR_DEBATE]: BillStatus.PASSED_HOUSE,
      [BillStatus.PASSED_HOUSE]: BillStatus.PASSED_SENATE,
      [BillStatus.PASSED_SENATE]: BillStatus.SENT_TO_EXECUTIVE,
      [BillStatus.SENT_TO_EXECUTIVE]: BillStatus.SIGNED,
      [BillStatus.SIGNED]: BillStatus.SIGNED,
      [BillStatus.VETOED]: BillStatus.VETOED,
      [BillStatus.FAILED]: BillStatus.FAILED,
    };
    return progression[current] || current;
  }
  
  // ==========================================================================
  // CAMPAIGN PROCESSING
  // ==========================================================================
  
  /**
   * Process active campaigns
   */
  private async processCampaigns(
    model: mongoose.Model<ICampaignDoc>,
    baseQuery: Record<string, unknown>,
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<{
    processed: number;
    fundsRaised: number;
    spent: number;
    errors: TickError[];
  }> {
    const errors: TickError[] = [];
    let processed = 0;
    let fundsRaised = 0;
    let spent = 0;
    
    try {
      const campaigns = await model.find({
        ...baseQuery,
        status: 'Active',
      }).limit(options?.limit || 200);
      
      for (const campaign of campaigns) {
        try {
          processed++;
          
          // Calculate monthly fundraising based on campaign activities
          const eventCount = campaign.events?.length || 0;
          const volunteerMultiplier = 1 + (campaign.volunteers || 0) / 100;
          const baseFundraising = 10000;
          const monthlyFundraising = baseFundraising * volunteerMultiplier * (1 + eventCount * 0.1);
          fundsRaised += monthlyFundraising;
          
          // Calculate monthly spending
          const monthlySpending = (campaign.volunteers || 0) * 500 + eventCount * 5000;
          spent += monthlySpending;
          
          if (!options?.dryRun) {
            campaign.fundsRaised = (campaign.fundsRaised || 0) + monthlyFundraising;
            campaign.fundsSpent = (campaign.fundsSpent || 0) + monthlySpending;
            await campaign.save();
          }
          
        } catch (error) {
          errors.push({
            entityId: campaign._id?.toString() || 'unknown',
            entityType: 'Campaign',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            recoverable: true,
          });
        }
      }
      
      return { processed, fundsRaised, spent, errors };
      
    } catch (error) {
      errors.push({
        entityId: 'system',
        entityType: 'Campaign',
        message: error instanceof Error ? error.message : 'Failed to query campaigns',
        recoverable: true,
      });
      return { processed, fundsRaised, spent, errors };
    }
  }
  
  // ==========================================================================
  // ELECTION PROCESSING
  // ==========================================================================
  
  /**
   * Process elections (check if any should be held this tick)
   */
  private async processElections(
    model: mongoose.Model<IElectionDoc>,
    baseQuery: Record<string, unknown>,
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<{
    held: number;
    won: number;
    lost: number;
    totalVotes: number;
    errors: TickError[];
  }> {
    const errors: TickError[] = [];
    let held = 0;
    let won = 0;
    let lost = 0;
    let totalVotes = 0;
    
    try {
      // Find elections that should be held (Active status and date has passed)
      const now = new Date();
      const electionsToHold = await model.find({
        ...baseQuery,
        status: ElectionStatus.ACTIVE,
        electionDate: { $lte: now },
      }).limit(options?.limit || 50);
      
      for (const election of electionsToHold) {
        try {
          held++;
          
          // Simulate election results
          const candidates = election.candidates || [];
          const registeredVoters = election.registeredVoters || 100000;
          const turnoutRate = 0.4 + Math.random() * 0.3; // 40-70% turnout
          const totalElectionVotes = Math.floor(registeredVoters * turnoutRate);
          totalVotes += totalElectionVotes;
          
          // Distribute votes among candidates
          let remainingVotes = totalElectionVotes;
          const candidatesWithVotes = candidates.map((candidate, index) => {
            const isLast = index === candidates.length - 1;
            const share = isLast ? remainingVotes : Math.floor(Math.random() * remainingVotes * 0.6);
            remainingVotes -= share;
            return {
              ...candidate,
              votes: share,
              votePercentage: (share / totalElectionVotes) * 100,
            };
          });
          
          // Determine winner
          const winner = candidatesWithVotes.reduce((a, b) => a.votes > b.votes ? a : b);
          won++; // Track that an election was won (by someone)
          
          if (!options?.dryRun) {
            election.status = ElectionStatus.COMPLETED;
            election.candidates = candidatesWithVotes;
            election.results = {
              totalVotes: totalElectionVotes,
              turnoutRate: turnoutRate * 100,
              winnerId: winner.playerId,
              winnerName: winner.candidateName,
            };
            await election.save();
          }
          
        } catch (error) {
          errors.push({
            entityId: election._id?.toString() || 'unknown',
            entityType: 'Election',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            recoverable: true,
          });
        }
      }
      
      return { held, won, lost, totalVotes, errors };
      
    } catch (error) {
      errors.push({
        entityId: 'system',
        entityType: 'Election',
        message: error instanceof Error ? error.message : 'Failed to query elections',
        recoverable: true,
      });
      return { held, won, lost, totalVotes, errors };
    }
  }
  
  // ==========================================================================
  // LOBBYING PROCESSING
  // ==========================================================================
  
  /**
   * Process lobbying activities
   */
  private async processLobbying(
    model: mongoose.Model<ILobbyDoc>,
    options?: TickProcessorOptions
  ): Promise<{
    processed: number;
    successful: number;
    influenceSpent: number;
    moneySpent: number;
    errors: TickError[];
  }> {
    const errors: TickError[] = [];
    let processed = 0;
    let successful = 0;
    let influenceSpent = 0;
    let moneySpent = 0;
    
    try {
      const lobbies = await model.find({}).limit(options?.limit || 200);
      
      for (const lobby of lobbies) {
        try {
          processed++;
          
          // Calculate monthly influence decay
          const currentInfluence = lobby.influencePool || 0;
          const decayRate = 0.05; // 5% decay per tick
          const influenceDecay = currentInfluence * decayRate;
          influenceSpent += influenceDecay;
          
          // Calculate operational costs
          const memberCount = lobby.members?.length || 0;
          const monthlyOperatingCost = memberCount * 100;
          moneySpent += monthlyOperatingCost;
          
          // Random lobbying success (if influence available)
          if (currentInfluence > 10 && Math.random() < 0.1) {
            successful++;
          }
          
          if (!options?.dryRun) {
            lobby.influencePool = Math.max(0, currentInfluence - influenceDecay);
            await lobby.save();
          }
          
        } catch (error) {
          errors.push({
            entityId: lobby._id?.toString() || 'unknown',
            entityType: 'Lobby',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            recoverable: true,
          });
        }
      }
      
      return { processed, successful, influenceSpent, moneySpent, errors };
      
    } catch (error) {
      errors.push({
        entityId: 'system',
        entityType: 'Lobby',
        message: error instanceof Error ? error.message : 'Failed to query lobbies',
        recoverable: true,
      });
      return { processed, successful, influenceSpent, moneySpent, errors };
    }
  }
  
  // ==========================================================================
  // VOTER OUTREACH PROCESSING
  // ==========================================================================
  
  /**
   * Process voter outreach campaigns
   */
  private async processVoterOutreach(
    model: mongoose.Model<IVoterOutreachDoc>,
    baseQuery: Record<string, unknown>,
    options?: TickProcessorOptions
  ): Promise<{
    processed: number;
    reached: number;
    supportGained: number;
    errors: TickError[];
  }> {
    const errors: TickError[] = [];
    let processed = 0;
    let reached = 0;
    let supportGained = 0;
    
    try {
      const outreachEfforts = await model.find({
        ...baseQuery,
      }).limit(options?.limit || 500);
      
      for (const outreach of outreachEfforts) {
        try {
          processed++;
          
          // Calculate reach and effectiveness
          const baseReach = outreach.reach || 1000;
          const effectiveness = outreach.effectiveness || 0.1;
          reached += baseReach;
          
          // Convert some reached voters to supporters
          const converted = Math.floor(baseReach * effectiveness);
          supportGained += converted;
          
        } catch (error) {
          errors.push({
            entityId: outreach._id?.toString() || 'unknown',
            entityType: 'VoterOutreach',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            recoverable: true,
          });
        }
      }
      
      return { processed, reached, supportGained, errors };
      
    } catch (error) {
      errors.push({
        entityId: 'system',
        entityType: 'VoterOutreach',
        message: error instanceof Error ? error.message : 'Failed to query voter outreach',
        recoverable: true,
      });
      return { processed, reached, supportGained, errors };
    }
  }
  
  // ==========================================================================
  // UNION PROCESSING
  // ==========================================================================
  
  /**
   * Process union activities
   */
  private async processUnions(
    model: mongoose.Model<IUnionDoc>,
    baseQuery: Record<string, unknown>,
    options?: TickProcessorOptions
  ): Promise<{
    processed: number;
    membershipChanges: number;
    strikesStarted: number;
    strikesEnded: number;
    errors: TickError[];
  }> {
    const errors: TickError[] = [];
    let processed = 0;
    let membershipChanges = 0;
    let strikesStarted = 0;
    let strikesEnded = 0;
    
    try {
      const unions = await model.find({
        ...baseQuery,
      }).limit(options?.limit || 200);
      
      for (const union of unions) {
        try {
          processed++;
          
          // Random membership fluctuation
          const currentMembers = union.memberCount || 0;
          const fluctuation = Math.floor((Math.random() - 0.5) * currentMembers * 0.02);
          membershipChanges += Math.abs(fluctuation);
          
          // Random strike events
          if (union.status === 'active' && Math.random() < 0.02) {
            strikesStarted++;
          }
          if (union.status === 'striking' && Math.random() < 0.1) {
            strikesEnded++;
          }
          
          if (!options?.dryRun) {
            union.memberCount = Math.max(0, currentMembers + fluctuation);
            await union.save();
          }
          
        } catch (error) {
          errors.push({
            entityId: union._id?.toString() || 'unknown',
            entityType: 'Union',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            recoverable: true,
          });
        }
      }
      
      return { processed, membershipChanges, strikesStarted, strikesEnded, errors };
      
    } catch (error) {
      errors.push({
        entityId: 'system',
        entityType: 'Union',
        message: error instanceof Error ? error.message : 'Failed to query unions',
        recoverable: true,
      });
      return { processed, membershipChanges, strikesStarted, strikesEnded, errors };
    }
  }
  
  // ==========================================================================
  // PARAMILITARY PROCESSING
  // ==========================================================================
  
  /**
   * Process paramilitary organizations
   */
  private async processParamilitaries(
    model: mongoose.Model<IParamilitaryDoc>,
    baseQuery: Record<string, unknown>,
    options?: TickProcessorOptions
  ): Promise<{
    processed: number;
    errors: TickError[];
  }> {
    const errors: TickError[] = [];
    let processed = 0;
    
    try {
      const paramilitaries = await model.find({
        ...baseQuery,
      }).limit(options?.limit || 100);
      
      for (const para of paramilitaries) {
        try {
          processed++;
          
          // Process operational costs and recruitment
          // Basic processing for now - can be expanded
          
        } catch (error) {
          errors.push({
            entityId: para._id?.toString() || 'unknown',
            entityType: 'Paramilitary',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            recoverable: true,
          });
        }
      }
      
      return { processed, errors };
      
    } catch (error) {
      errors.push({
        entityId: 'system',
        entityType: 'Paramilitary',
        message: error instanceof Error ? error.message : 'Failed to query paramilitaries',
        recoverable: true,
      });
      return { processed, errors };
    }
  }
}

// Export singleton instance
export const politicsProcessor = new PoliticsProcessor();

export default PoliticsProcessor;
