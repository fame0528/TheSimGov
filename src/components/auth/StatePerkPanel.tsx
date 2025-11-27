/**
 * @fileoverview State Perk Display Panel
 * @module components/auth/StatePerkPanel
 * 
 * OVERVIEW:
 * Information panel showing economic advantages of selected state
 * Displays population, GDP, tax environment, unemployment, calculated perks
 * Color-coded indicators for bonuses (green) and penalties (red)
 * Conditional rendering based on state selection
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { Card, CardBody, CardHeader, Chip } from '@heroui/react';
import { getStateByAbbr, type StateAbbreviation } from '@/lib/utils/stateHelpers';
import { formatNumber, formatCurrency, formatPercent } from '@/lib/utils/formatting';

interface StatePerkPanelProps {
  /** State abbreviation (null = no selection, hide panel) */
  stateAbbr: StateAbbreviation | null;
}

/**
 * Get color for perk value (green=bonus, red=penalty, gray=neutral)
 */
function getPerkColor(value: number): 'success' | 'danger' | 'default' {
  if (value > 0) return 'success';
  if (value < 0) return 'danger';
  return 'default';
}

/**
 * State Perk Display Panel
 * 
 * Shows comprehensive economic data and calculated perks for selected state
 * Renders only when a state is selected
 * 
 * @example
 * ```tsx
 * const [state, setState] = useState<StateAbbreviation | null>(null);
 * 
 * <StateSelector value={state} onChange={setState} />
 * <StatePerkPanel stateAbbr={state} />
 * ```
 */
export default function StatePerkPanel({ stateAbbr }: StatePerkPanelProps) {
  // No selection = don't render
  if (!stateAbbr) {
    return null;
  }
  
  const state = getStateByAbbr(stateAbbr);
  
  // Shouldn't happen (type safety), but defensive
  if (!state) {
    return null;
  }
  
  const {
    name,
    population,
    gdpPerCapita,
    unemploymentRate,
    hasStateIncomeTax,
    taxBurden,
    salesTaxRate,
    profitMarginBonus,
    hiringDifficultyMultiplier,
    wageMultiplier,
    industryBonuses,
  } = state;
  
  return (
    <Card className="w-full bg-slate-900/50 border border-white/10">
      <CardHeader className="pb-2">
        <div>
          <h3 className="text-lg font-semibold text-white">{name} Economic Profile</h3>
          <p className="text-sm text-slate-400">
            Your companies will receive these bonuses when headquartered here
          </p>
        </div>
      </CardHeader>
      
      <CardBody className="space-y-4">
        {/* Basic Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Population</p>
            <p className="text-sm font-medium text-white">{formatNumber(population)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-400">GDP per Capita</p>
            <p className="text-sm font-medium text-white">{formatCurrency(gdpPerCapita)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Unemployment</p>
            <p className="text-sm font-medium text-white">{formatPercent(unemploymentRate)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Income Tax</p>
            <p className="text-sm font-medium text-white">
              {hasStateIncomeTax ? `Yes (${formatCurrency(taxBurden)} per capita)` : 'None (+15%)'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Sales Tax</p>
            <p className="text-sm font-medium text-white">{formatPercent(salesTaxRate)}</p>
          </div>
        </div>
        
        {/* Perks Section */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-white">Economic Perks</p>
          
          <div className="flex flex-wrap gap-2">
            {/* Profit Bonus */}
            {profitMarginBonus !== 0 && (
              <Chip
                color={getPerkColor(profitMarginBonus)}
                variant="flat"
                size="sm"
                classNames={{
                  content: 'text-white',
                }}
              >
                Profit: {formatPercent(profitMarginBonus)}
              </Chip>
            )}
            
            {/* Hiring Multiplier */}
            {hiringDifficultyMultiplier !== 1 && (
              <Chip
                color={getPerkColor((1 - hiringDifficultyMultiplier) * 100)} // Inverted (easier hiring = good)
                variant="flat"
                size="sm"
                classNames={{
                  content: 'text-white',
                }}
              >
                Hiring Speed: {hiringDifficultyMultiplier.toFixed(2)}x
              </Chip>
            )}
            
            {/* Wage Multiplier */}
            {wageMultiplier !== 1 && (
              <Chip
                color={getPerkColor((1 - wageMultiplier) * 100)} // Inverted (lower wages = good)
                variant="flat"
                size="sm"
                classNames={{
                  content: 'text-white',
                }}
              >
                Wages: {wageMultiplier.toFixed(2)}x
              </Chip>
            )}
            
            {/* Industry Specializations */}
            {industryBonuses && Object.keys(industryBonuses).length > 0 && (
              <>
                {Object.entries(industryBonuses).map(([industry, bonus]) => (
                  <Chip
                    key={industry}
                    color="primary"
                    variant="flat"
                    size="sm"
                    classNames={{
                      content: 'text-white',
                    }}
                  >
                    {industry.charAt(0).toUpperCase() + industry.slice(1)}: {formatPercent(bonus as number)}
                  </Chip>
                ))}
              </>
            )}
          </div>
          
          {/* No Perks Message */}
          {profitMarginBonus === 0 && 
           hiringDifficultyMultiplier === 1 && 
           wageMultiplier === 1 && 
           (!industryBonuses || Object.keys(industryBonuses).length === 0) && (
            <p className="text-sm text-slate-400 italic">
              This state has balanced economics with no special bonuses or penalties
            </p>
          )}
        </div>
        
        {/* Explanatory Text */}
        <div className="pt-2 border-t border-white/10">
          <p className="text-xs text-slate-400">
            <strong className="text-white">Note:</strong> These perks apply to all companies you create while registered in this state. 
            Choose strategically based on your preferred industries and business strategy.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Conditional Rendering**: Only shows when state selected
 * 2. **Data Source**: getStateByAbbr() for complete state data
 * 3. **Color Coding**: Green (bonuses), Red (penalties), Blue (specializations)
 * 4. **Responsive Grid**: 2-column layout for basic stats
 * 5. **Educational**: Explains how perks work
 * 
 * PREVENTS:
 * - Confusing perk display (clear labels + colors)
 * - Information overload (organized sections)
 * - Poor UX on mobile (responsive grid)
 * - Misunderstanding mechanics (explanatory text)
 */
