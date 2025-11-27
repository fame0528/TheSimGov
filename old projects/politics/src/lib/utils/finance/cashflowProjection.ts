/**
 * @file src/lib/utils/finance/cashflowProjection.ts
 * @description 12-month cashflow forecasting for financial planning
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Cashflow projection system for forecasting company financial health over 12 months.
 * Calculates monthly revenue, expenses, net cashflow, and cumulative cash position.
 * Accounts for seasonality, growth trends, contract revenue, loan payments, and department budgets.
 * Identifies potential cash shortfalls and recommends financing needs.
 * 
 * USAGE:
 * ```typescript
 * import { projectCashflow, analyzeCashflowHealth } from '@/lib/utils/finance/cashflowProjection';
 * 
 * // Project 12-month cashflow
 * const projection = projectCashflow({
 *   startingCash: 500000,
 *   monthlyRevenue: 150000,
 *   monthlyExpenses: 120000,
 *   loanPayments: [{ amount: 5000, frequency: 'monthly' }],
 *   contracts: [{ value: 300000, duration: 6, monthlyRevenue: 50000 }],
 *   seasonality: { q1: 0.8, q2: 1.1, q3: 1.2, q4: 0.9 },
 *   growthRate: 0.05 // 5% monthly growth
 * });
 * 
 * // Analyze cashflow health
 * const health = analyzeCashflowHealth(projection);
 * // Returns: { healthy: true, runway: 18, warnings: [], recommendations: [] }
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Projection covers 12 months from current date
 * - Monthly calculations include:
 *   - Revenue: Base revenue * seasonality * growth factor + contract revenue
 *   - Expenses: Fixed expenses + variable expenses * revenue factor + department budgets
 *   - Debt service: Loan payments (principal + interest)
 *   - Net cashflow: Revenue - expenses - debt service
 *   - Cumulative cash: Starting cash + cumulative net cashflow
 * - Seasonality factors: Multiply base revenue by seasonal multiplier
 *   - Q1 (Jan-Mar): Typically 0.8-0.9x (post-holiday slowdown)
 *   - Q2 (Apr-Jun): Typically 1.0-1.1x (spring uptick)
 *   - Q3 (Jul-Sep): Typically 1.1-1.3x (summer peak)
 *   - Q4 (Oct-Dec): Typically 0.9-1.0x (holiday variability)
 * - Growth rate: Compound monthly growth applied to base revenue
 * - Contract revenue: One-time or recurring revenue from active contracts
 * - Department budgets: Monthly allocations to Finance, HR, Marketing, R&D
 * - Cash runway: Months until cash reaches zero (if negative trend)
 * - Health indicators:
 *   - Healthy: Positive cashflow, 6+ months runway
 *   - Caution: 3-6 months runway, declining trend
 *   - Critical: <3 months runway, negative cashflow
 * - Recommendations based on forecast:
 *   - Low runway: Seek additional financing or reduce expenses
 *   - Negative trend: Review pricing, cut non-essential costs
 *   - High cash reserves: Consider growth investments or debt paydown
 */

/**
 * Loan payment schedule
 */
export interface LoanPaymentSchedule {
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'annual';
  startMonth?: number; // Month to start payments (0-11)
  endMonth?: number;   // Month to end payments (0-11)
}

/**
 * Contract revenue
 */
export interface ContractRevenue {
  value: number;
  duration: number;          // Months
  monthlyRevenue: number;
  startMonth?: number;       // Month to start (0-11)
}

/**
 * Seasonality factors by quarter
 */
export interface SeasonalityFactors {
  q1: number; // Jan-Mar
  q2: number; // Apr-Jun
  q3: number; // Jul-Sep
  q4: number; // Oct-Dec
}

/**
 * Department budget allocation
 */
export interface DepartmentBudgets {
  finance?: number;
  hr?: number;
  marketing?: number;
  rd?: number;
}

/**
 * Cashflow projection input
 */
export interface CashflowProjectionInput {
  startingCash: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  loanPayments?: LoanPaymentSchedule[];
  contracts?: ContractRevenue[];
  seasonality?: SeasonalityFactors;
  growthRate?: number;          // Monthly growth rate (0.05 = 5%)
  departmentBudgets?: DepartmentBudgets;
  oneTimeExpenses?: { month: number; amount: number; description: string }[];
  oneTimeRevenue?: { month: number; amount: number; description: string }[];
}

/**
 * Monthly cashflow data
 */
export interface MonthlyCashflow {
  month: number;                // 0-11
  date: Date;
  revenue: number;
  expenses: number;
  loanPayments: number;
  netCashflow: number;
  cumulativeCash: number;
  seasonalityFactor: number;
  growthFactor: number;
}

/**
 * Cashflow projection result
 */
export interface CashflowProjection {
  months: MonthlyCashflow[];
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    totalLoanPayments: number;
    netCashflow: number;
    endingCash: number;
    averageMonthlyRevenue: number;
    averageMonthlyExpenses: number;
    peakCash: number;
    lowestCash: number;
  };
}

/**
 * Cashflow health analysis
 */
export interface CashflowHealth {
  healthy: boolean;
  runway: number;               // Months until cash reaches zero
  warnings: string[];
  recommendations: string[];
  trends: {
    revenueGrowing: boolean;
    expensesIncreasing: boolean;
    cashflowPositive: boolean;
  };
}

/**
 * Project 12-month cashflow forecast
 * 
 * @param input - Cashflow projection input data
 * @returns 12-month cashflow projection
 * 
 * @example
 * ```typescript
 * const projection = projectCashflow({
 *   startingCash: 750000,
 *   monthlyRevenue: 200000,
 *   monthlyExpenses: 150000,
 *   loanPayments: [{ amount: 8000, frequency: 'monthly' }],
 *   growthRate: 0.03,
 *   seasonality: { q1: 0.9, q2: 1.0, q3: 1.2, q4: 1.0 }
 * });
 * ```
 */
export function projectCashflow(input: CashflowProjectionInput): CashflowProjection {
  const {
    startingCash,
    monthlyRevenue,
    monthlyExpenses,
    loanPayments = [],
    contracts = [],
    seasonality,
    growthRate = 0,
    departmentBudgets = {},
    oneTimeExpenses = [],
    oneTimeRevenue = [],
  } = input;

  const months: MonthlyCashflow[] = [];
  let cumulativeCash = startingCash;

  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const quarter = Math.floor((monthDate.getMonth() % 12) / 3) + 1;

    // Seasonality factor
    let seasonalityFactor = 1.0;
    if (seasonality) {
      switch (quarter) {
        case 1:
          seasonalityFactor = seasonality.q1;
          break;
        case 2:
          seasonalityFactor = seasonality.q2;
          break;
        case 3:
          seasonalityFactor = seasonality.q3;
          break;
        case 4:
          seasonalityFactor = seasonality.q4;
          break;
      }
    }

    // Growth factor (compound)
    const growthFactor = Math.pow(1 + growthRate, i);

    // Calculate revenue
    let revenue = monthlyRevenue * seasonalityFactor * growthFactor;

    // Add contract revenue
    for (const contract of contracts) {
      const contractStart = contract.startMonth || 0;
      if (i >= contractStart && i < contractStart + contract.duration) {
        revenue += contract.monthlyRevenue;
      }
    }

    // Add one-time revenue
    const oneTimeRev = oneTimeRevenue.find((r) => r.month === i);
    if (oneTimeRev) {
      revenue += oneTimeRev.amount;
    }

    // Calculate expenses
    let expenses = monthlyExpenses;

    // Add department budgets
    expenses += (departmentBudgets.finance || 0);
    expenses += (departmentBudgets.hr || 0);
    expenses += (departmentBudgets.marketing || 0);
    expenses += (departmentBudgets.rd || 0);

    // Add one-time expenses
    const oneTimeExp = oneTimeExpenses.find((e) => e.month === i);
    if (oneTimeExp) {
      expenses += oneTimeExp.amount;
    }

    // Calculate loan payments
    let monthLoanPayments = 0;
    for (const payment of loanPayments) {
      const paymentStart = payment.startMonth || 0;
      const paymentEnd = payment.endMonth ?? 11;

      if (i >= paymentStart && i <= paymentEnd) {
        if (payment.frequency === 'monthly') {
          monthLoanPayments += payment.amount;
        } else if (payment.frequency === 'quarterly' && i % 3 === 0) {
          monthLoanPayments += payment.amount;
        } else if (payment.frequency === 'annual' && i === 0) {
          monthLoanPayments += payment.amount;
        }
      }
    }

    // Net cashflow
    const netCashflow = revenue - expenses - monthLoanPayments;
    cumulativeCash += netCashflow;

    months.push({
      month: i,
      date: monthDate,
      revenue,
      expenses,
      loanPayments: monthLoanPayments,
      netCashflow,
      cumulativeCash,
      seasonalityFactor,
      growthFactor,
    });
  }

  // Calculate summary
  const totalRevenue = months.reduce((sum, m) => sum + m.revenue, 0);
  const totalExpenses = months.reduce((sum, m) => sum + m.expenses, 0);
  const totalLoanPayments = months.reduce((sum, m) => sum + m.loanPayments, 0);
  const netCashflow = totalRevenue - totalExpenses - totalLoanPayments;
  const endingCash = months[11].cumulativeCash;
  const peakCash = Math.max(...months.map((m) => m.cumulativeCash));
  const lowestCash = Math.min(...months.map((m) => m.cumulativeCash));

  return {
    months,
    summary: {
      totalRevenue,
      totalExpenses,
      totalLoanPayments,
      netCashflow,
      endingCash,
      averageMonthlyRevenue: totalRevenue / 12,
      averageMonthlyExpenses: totalExpenses / 12,
      peakCash,
      lowestCash,
    },
  };
}

/**
 * Analyze cashflow health and generate warnings/recommendations
 * 
 * @param projection - Cashflow projection
 * @returns Cashflow health analysis
 * 
 * @example
 * ```typescript
 * const health = analyzeCashflowHealth(projection);
 * // Returns: { healthy: false, runway: 4, warnings: ['Low cash runway'], ... }
 * ```
 */
export function analyzeCashflowHealth(projection: CashflowProjection): CashflowHealth {
  const { months, summary } = projection;
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Calculate runway (months until cash runs out)
  let runway = 12;
  for (let i = 0; i < months.length; i++) {
    if (months[i].cumulativeCash <= 0) {
      runway = i;
      break;
    }
  }

  // Check if cash is declining
  const firstHalfAvg = months.slice(0, 6).reduce((sum, m) => sum + m.cumulativeCash, 0) / 6;
  const secondHalfAvg = months.slice(6, 12).reduce((sum, m) => sum + m.cumulativeCash, 0) / 6;
  const cashDeclining = secondHalfAvg < firstHalfAvg;

  // Check revenue trend
  const firstHalfRevenue = months.slice(0, 6).reduce((sum, m) => sum + m.revenue, 0);
  const secondHalfRevenue = months.slice(6, 12).reduce((sum, m) => sum + m.revenue, 0);
  const revenueGrowing = secondHalfRevenue > firstHalfRevenue;

  // Check expense trend
  const firstHalfExpenses = months.slice(0, 6).reduce((sum, m) => sum + m.expenses, 0);
  const secondHalfExpenses = months.slice(6, 12).reduce((sum, m) => sum + m.expenses, 0);
  const expensesIncreasing = secondHalfExpenses > firstHalfExpenses;

  // Check average cashflow
  const avgCashflow = summary.netCashflow / 12;
  const cashflowPositive = avgCashflow > 0;

  // Generate warnings
  if (runway < 3) {
    warnings.push('CRITICAL: Less than 3 months cash runway');
    recommendations.push('Seek immediate financing or implement cost reductions');
  } else if (runway < 6) {
    warnings.push('CAUTION: Less than 6 months cash runway');
    recommendations.push('Consider additional financing or expense optimization');
  }

  if (!cashflowPositive) {
    warnings.push('Negative average monthly cashflow');
    recommendations.push('Increase revenue or reduce expenses to achieve positive cashflow');
  }

  if (cashDeclining && cashflowPositive) {
    warnings.push('Cash position declining despite positive cashflow');
    recommendations.push('Review large one-time expenses or loan payments');
  }

  if (!revenueGrowing) {
    warnings.push('Revenue not growing in second half of forecast');
    recommendations.push('Focus on sales, marketing, or pricing strategies');
  }

  if (expensesIncreasing && !revenueGrowing) {
    warnings.push('Expenses increasing while revenue stagnant');
    recommendations.push('Review cost structure and identify areas for optimization');
  }

  if (summary.lowestCash < summary.endingCash * 0.5) {
    warnings.push('Significant cashflow volatility detected');
    recommendations.push('Build larger cash reserves or smooth out seasonal expenses');
  }

  // Positive indicators
  if (runway >= 12 && cashflowPositive && summary.endingCash > summary.peakCash * 0.8) {
    recommendations.push('Strong cash position - consider growth investments or debt paydown');
  }

  const healthy = runway >= 6 && cashflowPositive;

  return {
    healthy,
    runway,
    warnings,
    recommendations,
    trends: {
      revenueGrowing,
      expensesIncreasing,
      cashflowPositive,
    },
  };
}

/**
 * Calculate cash burn rate (monthly cash consumed)
 * 
 * @param projection - Cashflow projection
 * @returns Monthly burn rate (negative = burning cash, positive = generating cash)
 */
export function calculateBurnRate(projection: CashflowProjection): number {
  const { summary } = projection;
  return summary.netCashflow / 12;
}

/**
 * Find month with lowest cash position
 * 
 * @param projection - Cashflow projection
 * @returns Month index (0-11) with lowest cash
 */
export function findLowestCashMonth(projection: CashflowProjection): number {
  const { months } = projection;
  let lowestIndex = 0;
  let lowestCash = months[0].cumulativeCash;

  for (let i = 1; i < months.length; i++) {
    if (months[i].cumulativeCash < lowestCash) {
      lowestCash = months[i].cumulativeCash;
      lowestIndex = i;
    }
  }

  return lowestIndex;
}
