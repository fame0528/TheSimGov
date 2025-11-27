"use client";
/**
 * @file components/contracts/FilterPanel.tsx
 * @created 2025-11-13
 * @overview Filter panel component for marketplace – collects and updates filter criteria.
 */

import { useState } from 'react';
import type { ContractType } from '@/lib/db/models/Contract';

export interface MarketplaceFilters {
  type?: ContractType;
  industry?: string;
  minValue?: number;
  maxValue?: number;
  minDuration?: number;
  maxDuration?: number;
  complexity?: number;
  riskLevel?: string;
  requiredSkill?: string;
  minSkillLevel?: number;
}

interface Props {
  value: MarketplaceFilters;
  onChange: (next: MarketplaceFilters) => void;
}

const contractTypes: ContractType[] = ['Government','Private','Retail','LongTerm','ProjectBased'];
const riskLevels = ['Low','Medium','High','Critical'];
const skills = ['technical','sales','leadership','finance','marketing','operations','research','compliance','communication','creativity','analytical','customerService'];

export default function FilterPanel({ value, onChange }: Props) {
  const [open, setOpen] = useState(true);

  const update = (patch: Partial<MarketplaceFilters>) => {
    onChange({ ...value, ...patch });
  };

  const reset = () => onChange({});

  return (
    <section className="rounded-lg border bg-white p-4 shadow-sm" aria-label="Contract Filters">
      <header className="flex items-center justify-between mb-3">
        <h2 className="font-medium text-sm">Filters</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setOpen(o => !o)}
            className="text-xs px-2 py-1 rounded border"
            aria-expanded={open}
          >{open ? 'Hide' : 'Show'}</button>
          <button
            onClick={reset}
            className="text-xs px-2 py-1 rounded border bg-gray-50"
            disabled={!Object.keys(value).length}
          >Reset</button>
        </div>
      </header>
      {open && (
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600" htmlFor="type">Type</label>
            <select
              id="type"
              value={value.type || ''}
              onChange={e => update({ type: e.target.value as ContractType || undefined })}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="">Any</option>
              {contractTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600" htmlFor="industry">Industry</label>
            <input
              id="industry"
              type="text"
              value={value.industry || ''}
              onChange={e => update({ industry: e.target.value || undefined })}
              placeholder="Construction, Tech..."
              className="px-2 py-1 border rounded text-sm"
            />
          </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600" htmlFor="risk">Risk Level</label>
              <select
                id="risk"
                value={value.riskLevel || ''}
                onChange={e => update({ riskLevel: e.target.value || undefined })}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="">Any</option>
                {riskLevels.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Value Range ($)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                value={value.minValue ?? ''}
                onChange={e => update({ minValue: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Min"
                className="px-2 py-1 border rounded text-xs w-full"
              />
              <input
                type="number"
                min={0}
                value={value.maxValue ?? ''}
                onChange={e => update({ maxValue: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Max"
                className="px-2 py-1 border rounded text-xs w-full"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Duration (days)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                value={value.minDuration ?? ''}
                onChange={e => update({ minDuration: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Min"
                className="px-2 py-1 border rounded text-xs w-full"
              />
              <input
                type="number"
                min={0}
                value={value.maxDuration ?? ''}
                onChange={e => update({ maxDuration: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Max"
                className="px-2 py-1 border rounded text-xs w-full"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600" htmlFor="complexity">Complexity</label>
            <input
              id="complexity"
              type="number"
              min={1}
              max={100}
              value={value.complexity ?? ''}
              onChange={e => update({ complexity: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="1-100"
              className="px-2 py-1 border rounded text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600" htmlFor="skill">Required Skill</label>
            <select
              id="skill"
              value={value.requiredSkill || ''}
              onChange={e => update({ requiredSkill: e.target.value || undefined })}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="">Any</option>
              {skills.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600" htmlFor="skillLevel">Min Skill Level</label>
            <input
              id="skillLevel"
              type="number"
              min={0}
              max={100}
              value={value.minSkillLevel ?? ''}
              onChange={e => update({ minSkillLevel: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="0-100"
              className="px-2 py-1 border rounded text-sm"
            />
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Implementation Notes:
 * - Controlled component pattern: parent owns filter state.
 * - Uses semantic labels for accessibility; small, responsive grid layout.
 * - Reset button disabled when no filters applied.
 * - Future enhancements: debounce numeric inputs, add slider for ranges, persist filters per user.
 */
