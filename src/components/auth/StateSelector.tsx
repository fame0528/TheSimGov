/**
 * @fileoverview State Selector Component
 * @module components/auth/StateSelector
 * 
 * OVERVIEW:
 * Searchable dropdown for selecting US states (50 states + DC)
 * Displays states alphabetically with full names
 * Integrates with HeroUI design system
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { Select, SelectItem } from '@heroui/react';
import { getStatesSortedByName, type StateAbbreviation } from '@/lib/utils/stateHelpers';

interface StateSelectorProps {
  /** Current state abbreviation (e.g., 'CA', 'NY') */
  value: StateAbbreviation | null;
  
  /** Callback when selection changes */
  onChange: (stateAbbr: StateAbbreviation | null) => void;
  
  /** Error message (if validation fails) */
  error?: string;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Optional label override */
  label?: string;
  
  /** Optional placeholder override */
  placeholder?: string;
  
  /** Required field indicator */
  required?: boolean;
}

/**
 * State Selector Component
 * 
 * Searchable dropdown for selecting home state
 * Displays full state names alphabetically
 * Returns state abbreviation for efficient storage
 * 
 * @example
 * ```tsx
 * const [state, setState] = useState<StateAbbreviation | null>(null);
 * 
 * <StateSelector
 *   value={state}
 *   onChange={setState}
 *   error={errors.state}
 *   required
 * />
 * ```
 */
export default function StateSelector({
  value,
  onChange,
  error,
  disabled = false,
  label = 'Home State',
  placeholder = 'Select your state',
  required = false,
}: StateSelectorProps) {
  // Get all states sorted alphabetically
  const states = getStatesSortedByName();
  
  return (
    <Select
      placeholder={placeholder}
      selectedKeys={value ? [value] : []}
      onSelectionChange={(keys) => {
        const selected = Array.from(keys)[0] as StateAbbreviation | undefined;
        onChange(selected ?? null);
      }}
      isRequired={required}
      isDisabled={disabled}
      isInvalid={!!error}
      errorMessage={error}
      description={!error && !value ? 'Start typing to search states...' : !error ? 'Your state determines economic perks for your companies' : undefined}
      variant="bordered"
      classNames={{
        base: 'max-w-full',
        trigger: 'border-white/20 bg-slate-900/50 hover:border-emerald-400/50 data-[focus=true]:border-emerald-400 data-[hover=true]:border-emerald-400/50',
        label: '!text-white',
        value: 'text-white',
        description: '!text-slate-400',
        popoverContent: 'bg-slate-800 border border-white/10',
        listbox: 'bg-slate-800',
      }}
    >
      {states.map((state) => (
        <SelectItem 
          key={state.abbreviation}
          classNames={{
            base: 'data-[hover=true]:bg-emerald-500/10 data-[selectable=true]:focus:bg-emerald-500/20 data-[selected=true]:bg-emerald-500/20',
            title: 'text-white',
          }}
        >
          {state.name}
        </SelectItem>
      ))}
    </Select>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Data Source**: getStatesSortedByName() from stateHelpers
 * 2. **Alphabetical Order**: States sorted by full name
 * 3. **Type Safety**: StateAbbreviation type ensures valid selections
 * 4. **Searchable**: HeroUI Select allows typing to filter
 * 5. **Keyboard Accessible**: Arrow keys + Enter for navigation
 * 
 * PREVENTS:
 * - Invalid state selections (type-safe)
 * - Unsorted state lists (alphabetical by default)
 * - Poor UX (searchable + keyboard accessible)
 * - Missing validation feedback (error display)
 */
