/**
 * @file src/lib/game/tick/bankingProcessor.ts
 * @description Banking tick processor for game tick engine
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Processes time-based banking events each game tick:
 * - Loan payments due and collection
 * - Interest accrual on active loans
 * - Deposit interest payouts
 * - Delinquency and default detection
 * - Late fee application
 * - XP awards for successful operations
 *
 * GAMEPLAY IMPACT:
 * This is where the bank makes (or loses) money. Each tick:
 * - Loans accrue interest → bank revenue
 * - Payments come in → cash flow
 * - Defaults happen → losses
 * - Deposits pay interest → bank expense
 *
 * @author ECHO v1.4.0
 */

import {
  ITickProcessor,
  GameTime,
  TickProcessorResult,
  TickProcessorOptions,
  TickError,
  LoanTickResult,
  DepositTickResult,
  BankingTickSummary,
} from '@/lib/types/gameTick';
import BankLoan, { BankLoanStatus, IBankLoan } from '@/lib/db/models/banking/BankLoan';
import BankDeposit, { DepositStatus, IBankDeposit } from '@/lib/db/models/banking/BankDeposit';
import BankSettings, { IBankSettings } from '@/lib/db/models/banking/BankSettings';
import { PlayerTickState } from '@/lib/db/models/system/GameTick';
import { shouldDefaultThisMonth, annualToMonthlyDefaultRate } from '@/lib/game/banking/defaultCalculator';

// ============================================================================
// CONSTANTS
// ============================================================================

const PROCESSOR_NAME = 'banking';
const PROCESSOR_PRIORITY = 10; // Run early (banking affects other systems)

// XP rewards
const XP_PER_PAYMENT_RECEIVED = 5;
const XP_PER_LOAN_PAID_OFF = 50;
const XP_PER_DEPOSIT_INTEREST_PAID = 2;
const XP_BONUS_NO_DEFAULTS = 25; // Bonus if no defaults this tick

// Late fee settings
const DAYS_BEFORE_LATE_FEE = 15;
const LATE_FEE_PERCENTAGE = 0.05; // 5% of payment amount

// Default thresholds
const DAYS_TO_DELINQUENT = 30;
const DAYS_TO_DEFAULT = 90;

// ============================================================================
// BANKING PROCESSOR
// ============================================================================

/**
 * Banking tick processor
 * Handles all time-based banking operations
 */
export class BankingProcessor implements ITickProcessor {
  name = PROCESSOR_NAME;
  priority = PROCESSOR_PRIORITY;
  enabled = true;
  
  /**
   * Validate processor is ready
   */
  async validate(): Promise<true | string> {
    // Check required models are accessible
    try {
      await BankLoan.findOne().limit(1);
      await BankDeposit.findOne().limit(1);
      return true;
    } catch (error) {
      return `Database connection error: ${error instanceof Error ? error.message : 'Unknown'}`;
    }
  }
  
  /**
   * Process one tick for banking
   */
  async process(
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<TickProcessorResult> {
    const startTime = Date.now();
    const errors: TickError[] = [];
    const loanResults: LoanTickResult[] = [];
    const depositResults: DepositTickResult[] = [];
    
    try {
      // Get all banks to process (or specific one if playerId provided)
      const bankQuery: Record<string, unknown> = {};
      if (options?.playerId) {
        bankQuery.ownerId = options.playerId;
      }
      if (options?.companyId) {
        bankQuery._id = options.companyId;
      }
      
      const banks = await BankSettings.find(bankQuery).lean();
      
      // Process each bank
      for (const bank of banks) {
        try {
          // Process loans for this bank
          const bankLoanResults = await this.processLoans(bank._id!.toString(), gameTime, options);
          loanResults.push(...bankLoanResults.results);
          errors.push(...bankLoanResults.errors);
          
          // Process deposits for this bank
          const bankDepositResults = await this.processDeposits(bank._id!.toString(), gameTime, options);
          depositResults.push(...bankDepositResults.results);
          errors.push(...bankDepositResults.errors);
          
          // Update bank-level stats
          await this.updateBankStats(bank._id!.toString(), bankLoanResults, bankDepositResults);
          
          // Mark player as processed for this tick
          if (bank.ownerId) {
            await PlayerTickState.markProcessed(bank.ownerId, gameTime, 'banking');
          }
        } catch (error) {
          errors.push({
            entityId: bank._id!.toString(),
            entityType: 'BankSettings',
            message: error instanceof Error ? error.message : 'Unknown error processing bank',
            stack: error instanceof Error ? error.stack : undefined,
            recoverable: true,
          });
        }
      }
      
      // Build summary
      const summary = this.buildSummary(loanResults, depositResults);
      
      return {
        processor: PROCESSOR_NAME,
        success: errors.filter(e => !e.recoverable).length === 0,
        itemsProcessed: loanResults.length + depositResults.length,
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
          entityType: 'BankingProcessor',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: false,
        }],
        summary: {},
        durationMs: Date.now() - startTime,
      };
    }
  }
  
  // ==========================================================================
  // LOAN PROCESSING
  // ==========================================================================
  
  /**
   * Process all active loans for a bank
   */
  private async processLoans(
    bankId: string,
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<{ results: LoanTickResult[]; errors: TickError[] }> {
    const results: LoanTickResult[] = [];
    const errors: TickError[] = [];
    
    // Get active and delinquent loans
    const loans = await BankLoan.find({
      bankId,
      status: { $in: [BankLoanStatus.ACTIVE, BankLoanStatus.DELINQUENT] },
    });
    
    for (const loan of loans) {
      try {
        const result = await this.processLoan(loan, gameTime, options);
        results.push(result);
        
        // Save changes if not dry run
        if (!options?.dryRun && result.action !== 'NO_ACTION') {
          await loan.save();
        }
      } catch (error) {
        errors.push({
          entityId: loan._id!.toString(),
          entityType: 'BankLoan',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: true,
        });
      }
    }
    
    return { results, errors };
  }
  
  /**
   * Process a single loan
   */
  private async processLoan(
    loan: IBankLoan,
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<LoanTickResult> {
    const now = new Date();
    const result: LoanTickResult = {
      loanId: loan._id!.toString(),
      bankId: loan.bankId,
      action: 'NO_ACTION',
    };
    
    // 1. Accrue interest for this month
    const monthlyRate = loan.interestRate / 12;
    const interestThisMonth = loan.principalBalance * monthlyRate;
    loan.interestAccrued += interestThisMonth;
    result.interestAccrued = interestThisMonth;
    
    // 2. Check if payment is due
    const nextPayment = loan.payments.find(p => p.status === 'SCHEDULED');
    
    if (nextPayment && new Date(nextPayment.dueDate) <= now) {
      // Payment is due - simulate borrower payment behavior
      const willPay = this.simulateBorrowerPayment(loan);
      
      if (willPay) {
        // Payment received
        const paymentAmount = nextPayment.amount;
        
        nextPayment.status = 'PAID';
        nextPayment.paidDate = now;
        nextPayment.paidAmount = paymentAmount;
        
        loan.principalBalance -= nextPayment.principalPortion;
        loan.totalPaid += paymentAmount;
        loan.lastPaymentDate = now;
        loan.daysDelinquent = 0;
        
        result.action = 'PAYMENT_RECEIVED';
        result.amountProcessed = paymentAmount;
        result.xpEarned = XP_PER_PAYMENT_RECEIVED;
        
        // Update next payment due
        const nextScheduled = loan.payments.find(p => p.status === 'SCHEDULED');
        if (nextScheduled) {
          loan.nextPaymentDue = nextScheduled.dueDate;
        }
        
        // Check if loan is paid off
        if (loan.principalBalance <= 0) {
          loan.status = BankLoanStatus.PAID_OFF;
          loan.paidOffAt = now;
          result.action = 'PAID_OFF';
          result.xpEarned = XP_PER_LOAN_PAID_OFF;
          result.newStatus = BankLoanStatus.PAID_OFF;
        }
        
      } else {
        // Payment missed
        nextPayment.status = 'MISSED';
        loan.missedPayments += 1;
        loan.daysDelinquent += 30; // Add a month of delinquency
        
        // Apply late fee
        if (loan.daysDelinquent >= DAYS_BEFORE_LATE_FEE) {
          const lateFee = nextPayment.amount * LATE_FEE_PERCENTAGE;
          nextPayment.lateFee = lateFee;
          loan.totalLateFees += lateFee;
          result.action = 'LATE_FEE';
          result.amountProcessed = lateFee;
        }
        
        // Check for status changes
        if (loan.daysDelinquent >= DAYS_TO_DEFAULT) {
          // Trigger default
          loan.status = BankLoanStatus.DEFAULTED;
          loan.defaultedAt = now;
          result.action = 'DEFAULT';
          result.newStatus = BankLoanStatus.DEFAULTED;
        } else if (loan.daysDelinquent >= DAYS_TO_DELINQUENT && loan.status === BankLoanStatus.ACTIVE) {
          loan.status = BankLoanStatus.DELINQUENT;
          result.newStatus = BankLoanStatus.DELINQUENT;
        }
      }
    }
    
    return result;
  }
  
  /**
   * Simulate whether a borrower makes their payment
   * Uses credit score and economic factors
   */
  private simulateBorrowerPayment(loan: IBankLoan): boolean {
    // Convert annual default rate to monthly probability
    const baseAnnualRate = this.getDefaultRateForRiskTier(loan.riskTier);
    const monthlyDefaultProb = annualToMonthlyDefaultRate(baseAnnualRate);
    
    // Increase probability if already delinquent
    const adjustedProb = monthlyDefaultProb * (1 + loan.missedPayments * 0.5);
    
    // Random check
    return !shouldDefaultThisMonth(adjustedProb, loan.missedPayments);
  }
  
  /**
   * Get base default rate by risk tier
   */
  private getDefaultRateForRiskTier(riskTier: string): number {
    const rates: Record<string, number> = {
      'PRIME': 0.02,
      'NEAR_PRIME': 0.05,
      'SUBPRIME': 0.12,
      'DEEP_SUBPRIME': 0.25,
    };
    return rates[riskTier] ?? 0.10;
  }
  
  // ==========================================================================
  // DEPOSIT PROCESSING
  // ==========================================================================
  
  /**
   * Process all active deposits for a bank
   */
  private async processDeposits(
    bankId: string,
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<{ results: DepositTickResult[]; errors: TickError[] }> {
    const results: DepositTickResult[] = [];
    const errors: TickError[] = [];
    
    // Get active deposits
    const deposits = await BankDeposit.find({
      bankId,
      status: DepositStatus.ACTIVE,
    });
    
    for (const deposit of deposits) {
      try {
        const result = await this.processDeposit(deposit, gameTime, options);
        results.push(result);
        
        if (!options?.dryRun && result.action !== 'NO_ACTION') {
          await deposit.save();
        }
      } catch (error) {
        errors.push({
          entityId: deposit._id!.toString(),
          entityType: 'BankDeposit',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: true,
        });
      }
    }
    
    return { results, errors };
  }
  
  /**
   * Process a single deposit
   */
  private async processDeposit(
    deposit: IBankDeposit,
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<DepositTickResult> {
    const now = new Date();
    const result: DepositTickResult = {
      depositId: deposit._id!.toString(),
      bankId: deposit.bankId,
      action: 'NO_ACTION',
    };
    
    // Calculate monthly interest
    const monthlyRate = deposit.interestRate / 12;
    const interestThisMonth = deposit.balance * monthlyRate;
    
    // Add interest to balance (compound monthly)
    deposit.balance += interestThisMonth;
    deposit.interestAccrued += interestThisMonth;
    deposit.lastInterestDate = now;
    
    result.action = 'INTEREST_PAID';
    result.interestPaid = interestThisMonth;
    result.newBalance = deposit.balance;
    
    // Check for maturity (for term deposits)
    if (deposit.maturityDate && new Date(deposit.maturityDate) <= now) {
      deposit.status = DepositStatus.MATURED;
      result.action = 'MATURED';
    }
    
    return result;
  }
  
  // ==========================================================================
  // BANK STATS UPDATE
  // ==========================================================================
  
  /**
   * Update bank-level statistics after processing
   */
  private async updateBankStats(
    bankId: string,
    loanResults: { results: LoanTickResult[]; errors: TickError[] },
    depositResults: { results: DepositTickResult[]; errors: TickError[] }
  ): Promise<void> {
    // Calculate totals
    const paymentsReceived = loanResults.results
      .filter(r => r.action === 'PAYMENT_RECEIVED')
      .reduce((sum, r) => sum + (r.amountProcessed ?? 0), 0);
    
    const lateFeesCollected = loanResults.results
      .filter(r => r.action === 'LATE_FEE')
      .reduce((sum, r) => sum + (r.amountProcessed ?? 0), 0);
    
    const interestPaid = depositResults.results
      .filter(r => r.action === 'INTEREST_PAID')
      .reduce((sum, r) => sum + (r.interestPaid ?? 0), 0);
    
    const xpEarned = loanResults.results
      .reduce((sum, r) => sum + (r.xpEarned ?? 0), 0);
    
    const defaults = loanResults.results
      .filter(r => r.action === 'DEFAULT').length;
    
    // Award bonus XP if no defaults
    const bonusXp = defaults === 0 && loanResults.results.length > 0 ? XP_BONUS_NO_DEFAULTS : 0;
    
    // Update bank settings
    await BankSettings.findByIdAndUpdate(bankId, {
      $inc: {
        'stats.totalLoansIssued': 0, // Don't increment, just for tracking
        'stats.totalInterestEarned': paymentsReceived - loanResults.results
          .filter(r => r.action === 'PAYMENT_RECEIVED')
          .reduce((sum, r) => sum + (r.interestAccrued ?? 0), 0),
        'stats.totalLateFees': lateFeesCollected,
        'stats.totalDefaults': defaults,
        'xp': xpEarned + bonusXp,
      },
      $set: {
        'stats.lastTickProcessed': new Date(),
      },
    });
  }
  
  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  
  /**
   * Build processing summary
   */
  private buildSummary(
    loanResults: LoanTickResult[],
    depositResults: DepositTickResult[]
  ): BankingTickSummary {
    const paymentsReceived = loanResults.filter(r => r.action === 'PAYMENT_RECEIVED');
    const defaults = loanResults.filter(r => r.action === 'DEFAULT');
    const paidOff = loanResults.filter(r => r.action === 'PAID_OFF');
    const lateFees = loanResults.filter(r => r.action === 'LATE_FEE');
    const interestPaid = depositResults.filter(r => r.action === 'INTEREST_PAID');
    const matured = depositResults.filter(r => r.action === 'MATURED');
    
    const totalPaymentAmount = paymentsReceived.reduce((sum, r) => sum + (r.amountProcessed ?? 0), 0);
    const lateFeesCollected = lateFees.reduce((sum, r) => sum + (r.amountProcessed ?? 0), 0);
    const totalInterestPaid = interestPaid.reduce((sum, r) => sum + (r.interestPaid ?? 0), 0);
    const totalXp = loanResults.reduce((sum, r) => sum + (r.xpEarned ?? 0), 0);
    
    return {
      loansProcessed: loanResults.length,
      paymentsReceived: paymentsReceived.length,
      totalPaymentAmount,
      lateFeesCollected,
      defaultsTriggered: defaults.length,
      loansPaidOff: paidOff.length,
      
      depositsProcessed: depositResults.length,
      interestPaidOut: totalInterestPaid,
      depositsMatured: matured.length,
      
      totalXpEarned: totalXp,
      totalRevenueGenerated: totalPaymentAmount + lateFeesCollected,
      totalExpenses: totalInterestPaid,
      netProfit: totalPaymentAmount + lateFeesCollected - totalInterestPaid,
    };
  }
}

// Export singleton instance
export const bankingProcessor = new BankingProcessor();

export default bankingProcessor;
