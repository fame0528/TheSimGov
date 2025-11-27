/**
 * @file components/departments/BudgetAllocation.tsx
 * @description Budget allocation component with 4-slider interface
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Visual budget allocation interface using rc-slider for distributing budget
 * percentages across Finance, HR, Marketing, and R&D departments. Ensures
 * total allocation equals 100%.
 */

'use client';

import { useState, useEffect } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

interface BudgetAllocationProps {
  allocations: Record<string, number>; // { finance: 40, hr: 20, marketing: 25, rd: 15 }
  onChange: (allocations: Record<string, number>) => void;
}

const DEPARTMENTS = [
  { key: 'finance', label: 'Finance', icon: '💰', color: '#10b981' },
  { key: 'hr', label: 'HR', icon: '👥', color: '#3b82f6' },
  { key: 'marketing', label: 'Marketing', icon: '📊', color: '#a855f7' },
  { key: 'rd', label: 'R&D', icon: '🔬', color: '#f97316' },
];

export default function BudgetAllocation({ allocations, onChange }: BudgetAllocationProps) {
  const [localAllocations, setLocalAllocations] = useState(allocations);
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    setLocalAllocations(allocations);
  }, [allocations]);

  const handleSliderChange = (key: string, value: number) => {
    setAdjusting(true);
    
    // Calculate remaining budget after this slider
    const otherKeys = DEPARTMENTS.map((d) => d.key).filter((k) => k !== key);
    const otherTotal = otherKeys.reduce((sum, k) => sum + (localAllocations[k] || 0), 0);
    const remaining = 100 - value;

    // If remaining budget is positive, redistribute proportionally
    if (remaining >= 0 && otherTotal > 0) {
      const newAllocations = { ...localAllocations, [key]: value };
      
      // Redistribute remaining budget proportionally
      otherKeys.forEach((k) => {
        const proportion = (localAllocations[k] || 0) / otherTotal;
        newAllocations[k] = Math.max(0, proportion * remaining);
      });

      setLocalAllocations(newAllocations);
    }
  };

  const handleSliderChangeComplete = () => {
    setAdjusting(false);
    onChange(localAllocations);
  };

  const total = Object.values(localAllocations).reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-6">
      {/* Total Allocation Indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold">
          Total Allocation:{' '}
          <span className={total === 100 ? 'text-green-500' : 'text-red-500'}>
            {total.toFixed(1)}%
          </span>
        </div>
        {adjusting && (
          <div className="text-xs text-gray-500">
            Adjusting... (release to apply)
          </div>
        )}
      </div>

      {/* Sliders */}
      <div className="space-y-6">
        {DEPARTMENTS.map(({ key, label, icon, color }) => {
          const value = localAllocations[key] || 0;
          
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{icon}</span>
                  <span className="font-semibold">{label}</span>
                </div>
                <span className="font-bold" style={{ color }}>
                  {value.toFixed(1)}%
                </span>
              </div>
              
              <Slider
                min={0}
                max={100}
                step={0.5}
                value={value}
                onChange={(val) => handleSliderChange(key, val as number)}
                onChangeComplete={handleSliderChangeComplete}
                railStyle={{ backgroundColor: '#e5e7eb', height: 8 }}
                trackStyle={{ backgroundColor: color, height: 8 }}
                handleStyle={{
                  borderColor: color,
                  backgroundColor: color,
                  width: 20,
                  height: 20,
                  marginTop: -6,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Visual Bar Chart */}
      <div className="mt-6">
        <div className="flex h-8 rounded overflow-hidden">
          {DEPARTMENTS.map(({ key, color }) => {
            const value = localAllocations[key] || 0;
            return (
              <div
                key={key}
                style={{
                  width: `${value}%`,
                  backgroundColor: color,
                }}
                className="transition-all duration-300"
                title={`${key}: ${value.toFixed(1)}%`}
              />
            );
          })}
        </div>
      </div>

      {/* Warning if not 100% */}
      {Math.abs(total - 100) > 0.1 && !adjusting && (
        <div className="text-xs text-red-500 font-semibold">
          ⚠️ Budget allocation must total exactly 100%
        </div>
      )}
    </div>
  );
}
