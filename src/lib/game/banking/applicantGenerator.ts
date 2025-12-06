/**
 * @file src/lib/game/banking/applicantGenerator.ts
 * @description Random loan applicant generation for banking gameplay
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Generates realistic NPC loan applicants with varying profiles.
 * Quality and quantity of applicants scales with bank level.
 *
 * FEATURES:
 * - Realistic name generation
 * - Credit score distribution matching real data
 * - Income based on employment type
 * - Loan amounts appropriate to income/purpose
 * - Bank level affects applicant quality
 *
 * GAMEPLAY:
 * - Higher level banks attract better applicants
 * - Marketing spend increases applicant flow
 * - Reputation affects applicant quality
 *
 * USAGE:
 * import { generateApplicants, generateSingleApplicant } from '@/lib/game/banking/applicantGenerator';
 */

import { 
  LoanPurpose, 
  EmploymentType, 
  RiskTier,
  ApplicantStatus 
} from '@/lib/db/models/banking/LoanApplicant';
import { calculateDefaultProbability, determineRiskTier } from './defaultCalculator';

/**
 * Generated applicant data (ready for model creation)
 */
export interface GeneratedApplicant {
  name: string;
  age: number;
  employmentType: EmploymentType;
  employer?: string;
  yearsEmployed: number;
  creditScore: number;
  annualIncome: number;
  monthlyDebt: number;
  assets: number;
  bankruptcyHistory: boolean;
  latePaymentHistory: number;
  requestedAmount: number;
  purpose: LoanPurpose;
  requestedTermMonths: number;
  collateralOffered?: string;
  riskTier: RiskTier;
  defaultProbability: number;
  recommendedRate: number;
}

/**
 * Bank profile affecting generation
 */
export interface BankProfile {
  level: number;
  reputation: number;      // 1-100
  marketingBudget: number; // Daily spend
}

/**
 * First names pool (diverse)
 */
const FIRST_NAMES = {
  male: ['James', 'Michael', 'Robert', 'David', 'William', 'Joseph', 'Charles', 'Thomas', 'Daniel', 'Matthew', 'Jose', 'Carlos', 'Juan', 'Luis', 'Miguel', 'Wei', 'Chen', 'Li', 'Zhang', 'Wang', 'Mohammed', 'Ahmed', 'Ali', 'Omar', 'Hassan', 'Hiroshi', 'Takeshi', 'Kenji', 'Yuki', 'Ryu', 'Raj', 'Amit', 'Pradeep', 'Sanjay', 'Vikram', 'Dmitri', 'Alexei', 'Ivan', 'Sergei', 'Vladimir'],
  female: ['Mary', 'Jennifer', 'Patricia', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Maria', 'Ana', 'Carmen', 'Rosa', 'Gloria', 'Mei', 'Ling', 'Xiu', 'Fang', 'Yan', 'Fatima', 'Aisha', 'Layla', 'Noor', 'Sara', 'Yuki', 'Sakura', 'Hana', 'Mika', 'Emi', 'Priya', 'Anjali', 'Deepa', 'Kavita', 'Sunita', 'Olga', 'Natasha', 'Svetlana', 'Anna', 'Elena'],
};

/**
 * Last names pool (diverse)
 */
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Chen', 'Wang', 'Li', 'Zhang', 'Liu', 'Kim', 'Park', 'Choi', 'Patel', 'Singh', 'Kumar', 'Shah', 'Gupta', 'Sharma', 'Ali', 'Khan', 'Hussein', 'Ahmed', 'Tanaka', 'Yamamoto', 'Sato', 'Suzuki', 'Ivanov', 'Petrov', 'Müller', 'Schmidt', 'Cohen', 'Levy'];

/**
 * Employer names by industry
 */
const EMPLOYERS = {
  tech: ['Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Salesforce', 'Oracle', 'IBM', 'Intel', 'Cisco', 'TechCorp', 'DataSystems', 'CloudBase', 'CodeWorks', 'DigitalFirst'],
  finance: ['JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Citigroup', 'Goldman Sachs', 'Morgan Stanley', 'Capital One', 'American Express', 'Visa', 'Mastercard'],
  healthcare: ['UnitedHealth', 'CVS Health', 'Anthem', 'Cigna', 'Humana', 'HCA Healthcare', 'Kaiser', 'Cleveland Clinic', 'Mayo Clinic', 'Johns Hopkins'],
  retail: ['Walmart', 'Amazon', 'Costco', 'Target', 'Walgreens', 'CVS', 'Home Depot', 'Lowe\'s', 'Best Buy', 'Kroger'],
  manufacturing: ['General Motors', 'Ford', 'Toyota', 'Boeing', 'Lockheed Martin', 'General Electric', 'Caterpillar', '3M', 'Honeywell', 'Johnson & Johnson'],
  general: ['Acme Corp', 'GlobalTech', 'United Industries', 'Prime Services', 'Atlas Group', 'Pinnacle Corp', 'Summit LLC', 'Horizon Inc', 'Apex Systems', 'Vertex Partners'],
};

/**
 * Generate a random name
 */
function generateName(): string {
  const isMale = Math.random() < 0.5;
  const firstNames = isMale ? FIRST_NAMES.male : FIRST_NAMES.female;
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

/**
 * Generate employer name
 */
function generateEmployer(employmentType: EmploymentType): string | undefined {
  if (employmentType === EmploymentType.UNEMPLOYED || employmentType === EmploymentType.RETIRED) {
    return undefined;
  }
  
  if (employmentType === EmploymentType.SELF_EMPLOYED || employmentType === EmploymentType.BUSINESS_OWNER) {
    return 'Self-Employed';
  }
  
  // Pick random industry
  const industries = Object.keys(EMPLOYERS) as (keyof typeof EMPLOYERS)[];
  const industry = industries[Math.floor(Math.random() * industries.length)];
  const companies = EMPLOYERS[industry];
  return companies[Math.floor(Math.random() * companies.length)];
}

/**
 * Generate credit score based on bank level
 * Higher level banks attract better credit scores
 */
function generateCreditScore(bankLevel: number, reputation: number): number {
  // Base distribution (realistic US distribution)
  // 300-579: 16% | 580-669: 17% | 670-739: 21% | 740-799: 25% | 800-850: 21%
  
  // Bank level and reputation shift the distribution upward
  const qualityBonus = (bankLevel * 5) + (reputation * 0.3);
  
  // Generate base score
  const roll = Math.random();
  let baseScore: number;
  
  if (roll < 0.16) {
    baseScore = 300 + Math.random() * 279; // 300-579
  } else if (roll < 0.33) {
    baseScore = 580 + Math.random() * 89;  // 580-669
  } else if (roll < 0.54) {
    baseScore = 670 + Math.random() * 69;  // 670-739
  } else if (roll < 0.79) {
    baseScore = 740 + Math.random() * 59;  // 740-799
  } else {
    baseScore = 800 + Math.random() * 50;  // 800-850
  }
  
  // Apply quality bonus
  const adjustedScore = baseScore + qualityBonus + (Math.random() * 20 - 10);
  
  return Math.min(850, Math.max(300, Math.round(adjustedScore)));
}

/**
 * Generate annual income based on employment type
 */
function generateAnnualIncome(
  employmentType: EmploymentType,
  age: number,
  creditScore: number
): number {
  // Base income by employment type
  let baseIncome: number;
  
  switch (employmentType) {
    case EmploymentType.EMPLOYED:
      baseIncome = 35000 + Math.random() * 100000;
      break;
    case EmploymentType.SELF_EMPLOYED:
      baseIncome = 40000 + Math.random() * 150000;
      break;
    case EmploymentType.BUSINESS_OWNER:
      baseIncome = 60000 + Math.random() * 300000;
      break;
    case EmploymentType.RETIRED:
      baseIncome = 20000 + Math.random() * 60000;
      break;
    case EmploymentType.UNEMPLOYED:
      baseIncome = 5000 + Math.random() * 30000; // Savings, benefits, etc.
      break;
    default:
      baseIncome = 40000 + Math.random() * 80000;
  }
  
  // Age adjustment (peak earning years 35-55)
  let ageMultiplier = 1;
  if (age >= 35 && age <= 55) {
    ageMultiplier = 1.2;
  } else if (age < 25) {
    ageMultiplier = 0.7;
  } else if (age > 65) {
    ageMultiplier = 0.8;
  }
  
  // Credit score correlation (higher credit = higher income tendency)
  const creditMultiplier = 0.7 + (creditScore / 850) * 0.6;
  
  return Math.round(baseIncome * ageMultiplier * creditMultiplier);
}

/**
 * Generate loan amount based on purpose and income
 */
function generateLoanRequest(
  purpose: LoanPurpose,
  annualIncome: number
): { amount: number; termMonths: number; collateral?: string } {
  let amount: number;
  let termMonths: number;
  let collateral: string | undefined;
  
  switch (purpose) {
    case LoanPurpose.HOME_MORTGAGE:
      amount = annualIncome * (2 + Math.random() * 4); // 2-6x income
      termMonths = [180, 240, 360][Math.floor(Math.random() * 3)];
      collateral = 'Property being purchased';
      break;
      
    case LoanPurpose.AUTO_LOAN:
      amount = 15000 + Math.random() * 60000;
      termMonths = [36, 48, 60, 72][Math.floor(Math.random() * 4)];
      collateral = 'Vehicle being purchased';
      break;
      
    case LoanPurpose.BUSINESS_EXPANSION:
      amount = annualIncome * (0.5 + Math.random() * 1.5);
      termMonths = [24, 36, 48, 60][Math.floor(Math.random() * 4)];
      break;
      
    case LoanPurpose.STARTUP:
      amount = 25000 + Math.random() * 200000;
      termMonths = [36, 48, 60][Math.floor(Math.random() * 3)];
      break;
      
    case LoanPurpose.EDUCATION:
      amount = 10000 + Math.random() * 100000;
      termMonths = [60, 120, 180][Math.floor(Math.random() * 3)];
      break;
      
    case LoanPurpose.DEBT_CONSOLIDATION:
      amount = annualIncome * (0.3 + Math.random() * 0.7);
      termMonths = [36, 48, 60][Math.floor(Math.random() * 3)];
      break;
      
    case LoanPurpose.MEDICAL_EMERGENCY:
      amount = 5000 + Math.random() * 50000;
      termMonths = [12, 24, 36, 48][Math.floor(Math.random() * 4)];
      break;
      
    case LoanPurpose.PERSONAL_EXPENSE:
    default:
      amount = 2000 + Math.random() * 30000;
      termMonths = [12, 24, 36][Math.floor(Math.random() * 3)];
  }
  
  return {
    amount: Math.round(amount),
    termMonths,
    collateral,
  };
}

/**
 * Generate a single random applicant
 */
export function generateSingleApplicant(bankProfile: BankProfile): GeneratedApplicant {
  // Basic demographics
  const name = generateName();
  const age = 18 + Math.floor(Math.random() * 62); // 18-80
  
  // Employment
  const employmentRoll = Math.random();
  let employmentType: EmploymentType;
  if (employmentRoll < 0.55) {
    employmentType = EmploymentType.EMPLOYED;
  } else if (employmentRoll < 0.75) {
    employmentType = EmploymentType.SELF_EMPLOYED;
  } else if (employmentRoll < 0.85 + bankProfile.level * 0.01) {
    employmentType = EmploymentType.BUSINESS_OWNER;
  } else if (employmentRoll < 0.92) {
    employmentType = EmploymentType.RETIRED;
  } else {
    employmentType = EmploymentType.UNEMPLOYED;
  }
  
  const employer = generateEmployer(employmentType);
  const yearsEmployed = Math.floor(Math.random() * Math.min(age - 18, 40));
  
  // Financial profile
  const creditScore = generateCreditScore(bankProfile.level, bankProfile.reputation);
  const annualIncome = generateAnnualIncome(employmentType, age, creditScore);
  const monthlyDebt = (annualIncome / 12) * (Math.random() * 0.4); // 0-40% of monthly income
  const assets = annualIncome * Math.random() * 5;
  
  // Credit history
  const bankruptcyHistory = Math.random() < (0.05 * (850 - creditScore) / 550);
  const latePaymentHistory = Math.floor(Math.random() * (11 - creditScore / 100));
  
  // Loan request
  const purposes = Object.values(LoanPurpose);
  const purpose = purposes[Math.floor(Math.random() * purposes.length)];
  const loanRequest = generateLoanRequest(purpose, annualIncome);
  
  // Calculate risk
  const riskResult = calculateDefaultProbability({
    creditScore,
    annualIncome,
    monthlyDebt,
    employmentType,
    yearsEmployed,
    bankruptcyHistory,
    latePaymentHistory,
    loanAmount: loanRequest.amount,
    loanPurpose: purpose,
    hasCollateral: !!loanRequest.collateral,
    collateralValue: loanRequest.collateral ? loanRequest.amount * 1.2 : undefined,
  });
  
  // Calculate recommended rate based on risk
  const baseRate = 0.05;
  const riskPremium = riskResult.adjustedRate * 0.5;
  const recommendedRate = Math.min(0.30, baseRate + riskPremium);
  
  return {
    name,
    age,
    employmentType,
    employer,
    yearsEmployed,
    creditScore,
    annualIncome,
    monthlyDebt: Math.round(monthlyDebt * 100) / 100,
    assets: Math.round(assets * 100) / 100,
    bankruptcyHistory,
    latePaymentHistory,
    requestedAmount: loanRequest.amount,
    purpose,
    requestedTermMonths: loanRequest.termMonths,
    collateralOffered: loanRequest.collateral,
    riskTier: riskResult.riskTier,
    defaultProbability: riskResult.adjustedRate,
    recommendedRate: Math.round(recommendedRate * 10000) / 10000,
  };
}

/**
 * Calculate how many applicants a bank should receive
 */
export function calculateApplicantCount(bankProfile: BankProfile): number {
  // Base: 3 + (level * 0.5) applicants per day
  const baseCount = 3 + bankProfile.level * 0.5;
  
  // Marketing bonus: every $1000 adds ~0.5 applicants
  const marketingBonus = bankProfile.marketingBudget / 2000;
  
  // Reputation bonus: high reputation attracts more
  const reputationBonus = bankProfile.reputation / 50;
  
  const totalFloat = baseCount + marketingBonus + reputationBonus;
  
  // Add some randomness (+/- 30%)
  const randomFactor = 0.7 + Math.random() * 0.6;
  
  return Math.max(1, Math.round(totalFloat * randomFactor));
}

/**
 * Generate multiple applicants for a bank
 */
export function generateApplicants(
  bankProfile: BankProfile,
  count?: number
): GeneratedApplicant[] {
  const applicantCount = count ?? calculateApplicantCount(bankProfile);
  const applicants: GeneratedApplicant[] = [];
  
  for (let i = 0; i < applicantCount; i++) {
    applicants.push(generateSingleApplicant(bankProfile));
  }
  
  return applicants;
}

/**
 * Generate a batch of depositors for a bank
 */
export function generateDepositors(
  bankProfile: BankProfile,
  count?: number
): Array<{
  name: string;
  customerType: 'INDIVIDUAL' | 'SMALL_BUSINESS' | 'CORPORATE' | 'HIGH_NET_WORTH';
  accountType: 'CHECKING' | 'SAVINGS' | 'MONEY_MARKET' | 'CD_3_MONTH' | 'CD_6_MONTH' | 'CD_12_MONTH' | 'CD_24_MONTH';
  initialDeposit: number;
}> {
  const depositorCount = count ?? Math.round(calculateApplicantCount(bankProfile) * 1.5);
  const depositors = [];
  
  for (let i = 0; i < depositorCount; i++) {
    const name = generateName();
    
    // Customer type
    const typeRoll = Math.random();
    let customerType: 'INDIVIDUAL' | 'SMALL_BUSINESS' | 'CORPORATE' | 'HIGH_NET_WORTH';
    if (typeRoll < 0.65) {
      customerType = 'INDIVIDUAL';
    } else if (typeRoll < 0.85) {
      customerType = 'SMALL_BUSINESS';
    } else if (typeRoll < 0.95 + bankProfile.level * 0.005) {
      customerType = 'CORPORATE';
    } else {
      customerType = 'HIGH_NET_WORTH';
    }
    
    // Account type
    const accountRoll = Math.random();
    let accountType: 'CHECKING' | 'SAVINGS' | 'MONEY_MARKET' | 'CD_3_MONTH' | 'CD_6_MONTH' | 'CD_12_MONTH' | 'CD_24_MONTH';
    if (accountRoll < 0.3) {
      accountType = 'CHECKING';
    } else if (accountRoll < 0.55) {
      accountType = 'SAVINGS';
    } else if (accountRoll < 0.7) {
      accountType = 'MONEY_MARKET';
    } else {
      const cds: typeof accountType[] = ['CD_3_MONTH', 'CD_6_MONTH', 'CD_12_MONTH', 'CD_24_MONTH'];
      accountType = cds[Math.floor(Math.random() * cds.length)];
    }
    
    // Initial deposit based on customer type
    let baseDeposit: number;
    switch (customerType) {
      case 'INDIVIDUAL':
        baseDeposit = 500 + Math.random() * 10000;
        break;
      case 'SMALL_BUSINESS':
        baseDeposit = 5000 + Math.random() * 50000;
        break;
      case 'CORPORATE':
        baseDeposit = 50000 + Math.random() * 500000;
        break;
      case 'HIGH_NET_WORTH':
        baseDeposit = 100000 + Math.random() * 1000000;
        break;
    }
    
    depositors.push({
      name,
      customerType,
      accountType,
      initialDeposit: Math.round(baseDeposit * 100) / 100,
    });
  }
  
  return depositors;
}

export default {
  generateSingleApplicant,
  generateApplicants,
  generateDepositors,
  calculateApplicantCount,
};
