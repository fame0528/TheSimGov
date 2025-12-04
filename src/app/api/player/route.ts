/**
 * @file src/app/api/player/route.ts
 * @description Player Profile API Endpoint
 * @created 2025-12-03
 * 
 * OVERVIEW:
 * GET endpoint to fetch the current player's complete profile including
 * business stats, political positions, and electoral history.
 * Requires authentication via session.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import UserModel from '@/lib/db/models/User';
import CompanyModel from '@/lib/db/models/Company';
import CampaignModel from '@/lib/db/models/politics/Campaign';
import type {
  PlayerProfile,
  PlayerProfileResponse,
  PlayerBusiness,
  PlayerPolitics,
  ElectoralHistory,
  ElectoralHistoryEntry,
  LobbyAffiliation,
  OwnedCompany,
} from '@/lib/types/player';
import {
  WealthClass,
  SocialPosition,
  EconomicPosition,
  PlayerParty,
  ElectionResult,
  ElectoralOffice,
  getWealthClass,
} from '@/lib/types/player';
import type { StateAbbreviation } from '@/lib/types/state';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convert campaign status to election result
 */
function getElectionResult(status: string, won?: boolean): ElectionResult {
  if (status === 'Completed') {
    return won ? ElectionResult.WON : ElectionResult.LOST;
  }
  if (status === 'Withdrawn' || status === 'Suspended') {
    return ElectionResult.WITHDREW;
  }
  return ElectionResult.PENDING;
}

/**
 * Convert political office string to enum
 */
function mapOffice(office: string): ElectoralOffice {
  const officeMap: Record<string, ElectoralOffice> = {
    'Mayor': ElectoralOffice.MAYOR,
    'City Council': ElectoralOffice.CITY_COUNCIL,
    'State Representative': ElectoralOffice.STATE_REPRESENTATIVE,
    'State Senator': ElectoralOffice.STATE_SENATOR,
    'US Representative': ElectoralOffice.REPRESENTATIVE,
    'US Senator': ElectoralOffice.SENATOR,
    'Governor': ElectoralOffice.GOVERNOR,
    'President': ElectoralOffice.PRESIDENT,
  };
  return officeMap[office] || ElectoralOffice.REPRESENTATIVE;
}

/**
 * Convert party string to PlayerParty enum
 */
function mapParty(party: string): PlayerParty {
  const partyMap: Record<string, PlayerParty> = {
    'Democratic': PlayerParty.DEMOCRATIC,
    'Republican': PlayerParty.REPUBLICAN,
    'Independent': PlayerParty.INDEPENDENT,
    'Libertarian': PlayerParty.LIBERTARIAN,
    'Green': PlayerParty.GREEN,
  };
  return partyMap[party] || PlayerParty.OTHER;
}

/**
 * Get relative date text
 */
function getRelativeDateText(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Generate mock lobby affiliations based on player state
 * In production, this would come from actual lobby membership data
 */
function generateLobbyAffiliations(): LobbyAffiliation[] {
  const lobbies: LobbyAffiliation[] = [
    { lobbyId: 'healthcare', lobbyName: 'Health Care Lobby', influencePercent: 2.69 },
    { lobbyId: 'gun-control', lobbyName: 'Gun Control Lobby', influencePercent: 0.37 },
    { lobbyId: 'civil-rights', lobbyName: 'Civil Rights Lobby', influencePercent: 0.32 },
    { lobbyId: 'technology', lobbyName: 'Technology Lobby', influencePercent: 0.28 },
    { lobbyId: 'lgbtq', lobbyName: 'LGBTQ+ Rights Lobby', influencePercent: 0.28 },
    { lobbyId: 'womens-rights', lobbyName: "Women's Rights Lobby", influencePercent: 0.27 },
    { lobbyId: 'manufacturing', lobbyName: 'Manufacturing Lobby', influencePercent: 0.24 },
    { lobbyId: 'agriculture', lobbyName: 'Agriculture Lobby', influencePercent: 0.24 },
    { lobbyId: 'media', lobbyName: 'Media Lobby', influencePercent: 0.22 },
    { lobbyId: 'automotive', lobbyName: 'Automotive Lobby', influencePercent: 0.18 },
    { lobbyId: 'financial', lobbyName: 'Financial Services Lobby', influencePercent: 0.13 },
    { lobbyId: 'mining', lobbyName: 'Mining Lobby', influencePercent: 0.12 },
    { lobbyId: 'retail', lobbyName: 'Retail Lobby', influencePercent: 0.12 },
    { lobbyId: 'oil-gas', lobbyName: 'Oil & Gas Lobby', influencePercent: 0.11 },
  ];
  return lobbies;
}

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(): Promise<NextResponse<PlayerProfileResponse>> {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Fetch user
    const user = await UserModel.findById(session.user.id).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch companies owned by user
    const companies = await CompanyModel.find({ userId: session.user.id }).lean();

    // Calculate business stats - Company model uses cash and revenue/expenses, not netWorth directly
    // Calculate net worth as: cash + revenue - expenses (simplified)
    const calculateCompanyNetWorth = (c: any): number => {
      return (c.cash || 0) + (c.revenue || 0) - (c.expenses || 0);
    };

    const totalWealth = companies.reduce((sum, c) => sum + calculateCompanyNetWorth(c), 0) + (user.cash || 0);
    const liquidCapital = user.cash || 0;
    const stocksValue = totalWealth - liquidCapital;

    const ownedCompanies: OwnedCompany[] = companies.map(c => ({
      id: c._id.toString(),
      name: c.name,
      industry: c.industry,
      level: c.level || 1,
      netWorth: calculateCompanyNetWorth(c),
      logoUrl: c.logoUrl,
    }));

    // Find CEO position (if any)
    const ceoCompany = companies.find(c => c.level >= 5);
    const ceoPosition = ceoCompany ? {
      companyId: ceoCompany._id.toString(),
      companyName: ceoCompany.name,
      since: ceoCompany.createdAt instanceof Date 
        ? ceoCompany.createdAt.toISOString() 
        : new Date().toISOString(),
    } : undefined;

    const business: PlayerBusiness = {
      totalWealth,
      liquidCapital,
      wealthClass: getWealthClass(totalWealth),
      stocksValue,
      ceoPosition,
      ownedCompanies,
    };

    // Fetch campaigns for electoral history
    const campaigns = await CampaignModel.find({
      $or: [
        { company: { $in: companies.map(c => c._id) } },
        { playerId: session.user.id }
      ]
    }).sort({ startDate: -1 }).lean();

    // Build electoral history
    const entries: ElectoralHistoryEntry[] = campaigns.map((c, index) => ({
      id: c._id.toString(),
      office: mapOffice(c.office),
      state: (user.state || 'CA') as StateAbbreviation,
      party: mapParty(c.party),
      votePercent: c.polls?.length > 0 
        ? c.polls[c.polls.length - 1].support 
        : Math.random() * 30 + 35, // Mock vote percent if no polls
      result: getElectionResult(c.status, index === 0), // First campaign won for demo
      electionDate: c.endDate || c.startDate || new Date(),
      relativeDateText: getRelativeDateText(new Date(c.endDate || c.startDate || new Date())),
    }));

    const wins = entries.filter(e => e.result === ElectionResult.WON).length;
    const losses = entries.filter(e => e.result === ElectionResult.LOST).length;

    const electoralHistory: ElectoralHistory = {
      totalRaces: entries.length,
      wins,
      losses,
      winRate: entries.length > 0 ? (wins / entries.length) * 100 : 0,
      entries,
    };

    // Build politics stats
    // In production, these would come from political engagement models
    const activeCampaign = campaigns.find(c => c.status === 'Active');
    const partyPower = campaigns.reduce((sum, c) => sum + (c.fundsRaised || 0), 0) / 5000;

    const politics: PlayerPolitics = {
      location: (user.state || 'CA') as StateAbbreviation,
      citizenship: 'USA',
      citizenshipFlag: '/flags/usa.png',
      gender: user.gender as 'Male' | 'Female',
      race: user.ethnicity || 'Other',
      power: Math.min(100, (totalWealth / 100000) + (campaigns.length * 2)),
      campaignFinances: campaigns.reduce((sum, c) => sum + (c.fundsRaised || 0), 0),
      nationalInfluence: campaigns.length > 5 ? (campaigns.length - 5) * 2 : 0,
      homeStateInfluence: Math.min(100, 20 + (campaigns.length * 5)),
      politicalReputation: Math.min(100, wins * 10 + campaigns.length * 2),
      seniority: campaigns.length * 2,
      party: activeCampaign ? mapParty(activeCampaign.party) : PlayerParty.INDEPENDENT,
      partyPower: Math.min(500, partyPower),
      socialPosition: SocialPosition.CENTRIST,
      economicPosition: EconomicPosition.CENTER_LEFT,
      lobbies: generateLobbyAffiliations(),
      currentOffice: entries.length > 0 && entries[0].result === ElectionResult.WON
        ? entries[0].office
        : undefined,
    };

    // Build complete profile
    const profile: PlayerProfile = {
      identity: {
        id: user._id.toString(),
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl || '/portraits/default.png',
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        lastLogin: user.lastLogin?.toISOString(),
      },
      business,
      politics,
      electoralHistory,
    };

    return NextResponse.json({ success: true, profile });

  } catch (error) {
    console.error('[API] Player profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch player profile' },
      { status: 500 }
    );
  }
}
