/**
 * @fileoverview Payroll Automation API Route
 * @module app/api/payroll/route
 *
 * OVERVIEW:
 * API endpoint for running weekly payroll automation. Deducts weekly salary from all companies,
 * updates employee morale, and tracks payment history for credit scoring. Intended to be called
 * by the time engine or a scheduled serverless function.
 *
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import CompanyModel from '@/lib/db/models/Company';
import EmployeeModel from '@/lib/db/models/Employee';
import { GAME_TIME } from '@/lib/utils/constants';
import type { Types } from 'mongoose';

/** Payroll result for a single company */
interface PayrollResult {
  companyId: Types.ObjectId;
  payroll: number;
  payrollSuccess: boolean;
  employees: number;
}

/**
 * POST /api/payroll
 * Runs payroll for all companies (weekly automation)
 */
export async function POST(req: NextRequest) {
  try {
    // Find all companies
    const companies = await CompanyModel.find({});
    let totalPayroll = 0;
    const payrollResults: PayrollResult[] = [];

    for (const company of companies) {
      // Find all active employees for this company
      const employees = await EmployeeModel.find({ companyId: company._id, status: 'active' });
      const weeklyPayroll = employees.reduce((sum, emp) => sum + (emp.salary / 52), 0);
      let payrollSuccess = true;

      // Deduct payroll from company cash
      if (company.cash >= weeklyPayroll) {
        company.cash -= weeklyPayroll;
        payrollSuccess = true;
      } else {
        payrollSuccess = false;
      }
      // Push payroll history entry - payrollHistory is defined on CompanyDocument
      if (!company.payrollHistory) {
        company.payrollHistory = [];
      }
      company.payrollHistory.push({
        date: new Date(),
        amount: Math.round(weeklyPayroll),
        success: payrollSuccess,
      });
      await company.save();
      totalPayroll += weeklyPayroll;

      // Update employee morale based on payroll success
      for (const emp of employees) {
        if (payrollSuccess) {
          emp.morale = Math.min(100, emp.morale + 5); // Paid: morale boost
        } else {
          emp.morale = Math.max(1, emp.morale - 20); // Missed: morale penalty
        }
        await emp.save();
      }

      payrollResults.push({
        companyId: company._id,
        payroll: weeklyPayroll,
        payrollSuccess,
        employees: employees.length,
      });
    }

    return NextResponse.json({
      ok: true,
      totalPayroll,
      payrollResults,
      message: 'Payroll automation complete.'
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * IMPLEMENTATION NOTES:
 * - Called by time engine or cron to automate weekly payroll
 * - Deducts weekly salary, updates morale, and saves results
 * - Can be extended to track payment history for credit scoring
 * - Handles all companies and employees in one batch
 */
