/**
 * @fileoverview Portrait Selector Component
 * @module components/shared/PortraitSelector
 * 
 * OVERVIEW:
 * Grid display of pre-generated congressional-style portraits.
 * Filters by gender/ethnicity, shows thumbnails, handles selection.
 * 
 * FEATURES:
 * - Auto-filter portraits when gender/ethnicity changes
 * - Grid layout with thumbnails (150×150px)
 * - Visual selection feedback (checkmark overlay)
 * - Responsive design (2-5 columns based on screen size)
 * - Empty state when no portraits match filter
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0 with GUARDIAN PROTOCOL
 */

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import type { Gender, Ethnicity, PresetPortrait } from '@/lib/types/portraits';
import { getPortraitsByFilter } from '@/lib/utils/portraitCatalog';

interface PortraitSelectorProps {
  /** Selected gender (filters portraits) */
  selectedGender: Gender;
  
  /** Optional selected ethnicity (filters portraits further) */
  selectedEthnicity?: Ethnicity;
  
  /** Currently selected portrait ID */
  currentSelection?: string;
  
  /** Callback when portrait selected */
  onSelect: (portrait: PresetPortrait) => void;
}

/**
 * Portrait Selector Component
 * 
 * Displays grid of pre-generated portraits filtered by gender/ethnicity.
 * Users click to select their avatar for registration.
 * 
 * @example
 * ```tsx
 * const [selectedPortrait, setSelectedPortrait] = useState<PresetPortrait | null>(null);
 * 
 * <PortraitSelector
 *   selectedGender={formData.gender}
 *   selectedEthnicity={formData.ethnicity}
 *   currentSelection={selectedPortrait?.id}
 *   onSelect={(portrait) => {
 *     setSelectedPortrait(portrait);
 *     setFormData({ ...formData, imageUrl: portrait.fullUrl });
 *   }}
 * />
 * ```
 */
export default function PortraitSelector({
  selectedGender,
  selectedEthnicity,
  currentSelection,
  onSelect,
}: PortraitSelectorProps) {
  const [portraits, setPortraits] = useState<PresetPortrait[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter portraits when gender/ethnicity changes
  useEffect(() => {
    setIsLoading(true);
    
    const filtered = getPortraitsByFilter({
      gender: selectedGender,
      ethnicity: selectedEthnicity,
    });
    
    setPortraits(filtered);
    setIsLoading(false);
  }, [selectedGender, selectedEthnicity]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (portraits.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">
          No portraits available for this combination.
          <br />
          Portraits will be added after generation (Phase 6).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {portraits.length} {portraits.length === 1 ? 'portrait' : 'portraits'} available
        </p>
        {selectedEthnicity && (
          <p className="text-xs text-gray-500">
            Showing: {selectedGender} × {selectedEthnicity}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {portraits.map((portrait) => {
          const isSelected = currentSelection === portrait.id;
          
          return (
            <button
              key={portrait.id}
              type="button"
              onClick={() => onSelect(portrait)}
              className={`
                relative aspect-square rounded-lg overflow-hidden
                border-2 transition-all duration-200
                hover:scale-105 hover:shadow-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${isSelected 
                  ? 'border-blue-500 shadow-lg ring-2 ring-blue-500' 
                  : 'border-gray-700 hover:border-gray-500'
                }
              `}
              aria-label={`Select ${portrait.gender} ${portrait.ethnicity} portrait ${portrait.id}`}
            >
              <Image
                src={portrait.thumbnailUrl}
                alt={`${portrait.gender} ${portrait.ethnicity} portrait`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              />
              
              {isSelected && (
                <div className="absolute inset-0 bg-blue-600 bg-opacity-30 flex items-center justify-center">
                  <div className="bg-blue-600 rounded-full p-2">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Auto-Filtering**: useEffect re-runs when selectedGender or selectedEthnicity changes.
 *    Ensures portraits always match user's current selections.
 * 
 * 2. **Performance**: Uses Image component with proper sizing hints.
 *    Thumbnails (150×150px) load fast, full images only loaded when selected.
 * 
 * 3. **Accessibility**:
 *    - Keyboard navigable (button elements)
 *    - Proper ARIA labels describing each portrait
 *    - Focus states with ring indicators
 *    - High contrast selection state (blue border + overlay)
 * 
 * 4. **Responsive Design**:
 *    - Mobile: 2 columns (50% width each)
 *    - Tablet: 3-4 columns
 *    - Desktop: 5 columns (20% width each)
 *    - Aspect-square ensures consistent grid layout
 * 
 * 5. **Visual Feedback**:
 *    - Hover: Scale up + shadow
 *    - Selected: Blue border + checkmark overlay
 *    - Focus: Ring outline for keyboard navigation
 * 
 * 6. **Empty State**: Shows friendly message when no portraits match filter.
 *    Explains this is temporary until Phase 6 (portrait generation).
 * 
 * 7. **Loading State**: Shows spinner while filtering (prevents flash of wrong content).
 */
