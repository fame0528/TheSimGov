/**
 * @fileoverview Employee Skill Decay API Route
 * @module app/api/employees/decay/route
 *
 * OVERVIEW:
 * API endpoint for applying weekly skill decay to all employees. Reduces unused skills by 1% per week.
 * Intended to be called by the time engine or a scheduled serverless function.
 *
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import EmployeeModel, { EmployeeDocument, EmployeeSkills } from '@/lib/db/models/Employee';
import { EMPLOYEE_PARAMETERS } from '@/lib/utils/constants';

/**
 * POST /api/employees/decay
 * Applies weekly skill decay to all active employees.
 * RULES:
 * - Base decay: 1% of each skill above minimum threshold
 * - Recent activity: If employee.lastSkillUsed < 7 days, decay halved to 0.5%
 * - Active training skill: skipped entirely (protected while improving)
 * - Never reduces below EMPLOYEE_PARAMETERS.SKILL_MIN
 * RETURNS: Summary of updated employees with new skill values.
 */
export async function POST(req: NextRequest) {
  try {
    // Find all active employees
    const employees: EmployeeDocument[] = await EmployeeModel.find({ status: 'active' });
    let updated = 0;
    let decayResults: any[] = [];

    const now = new Date();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    for (const emp of employees) {
      let skillsChanged = false;
      const trainingSkill = emp.currentTraining?.skill as string | undefined;
      const skillCategories = EMPLOYEE_PARAMETERS.SKILL_CATEGORIES as readonly (keyof EmployeeSkills)[];
      for (const skill of skillCategories) {
        if (trainingSkill === skill) continue; // Skip skill actively training
        const current = emp.skills[skill];
        if (current <= EMPLOYEE_PARAMETERS.SKILL_MIN) continue;
        // If lastSkillUsed within a week, apply lighter decay (0.5%) else full 1%
        const recentUse = !!emp.lastSkillUsed && (now.getTime() - emp.lastSkillUsed.getTime() < oneWeekMs);
        const decayRate = recentUse ? EMPLOYEE_PARAMETERS.SKILL_DECAY_PER_WEEK / 2 : EMPLOYEE_PARAMETERS.SKILL_DECAY_PER_WEEK;
        const decayed = Math.max(
          EMPLOYEE_PARAMETERS.SKILL_MIN,
          Math.floor(current * (1 - decayRate))
        );
        if (decayed < current) {
          emp.skills[skill] = decayed;
          skillsChanged = true;
        }
      }
      if (skillsChanged) {
        await emp.save();
        updated++;
        decayResults.push({ employeeId: emp._id, skills: emp.skills });
      }
    }

    return NextResponse.json({
      ok: true,
      updated,
      decayResults,
      message: 'Employee skill decay applied.'
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * IMPLEMENTATION NOTES:
 * - Called by time engine or cron to apply weekly skill decay
 * - Reduces skills by 1% weekly (0.5% if recently used); skips skill in active training
 * - Uses lastSkillUsed to modulate decay intensity
 * - Batch processes all employees
 */
