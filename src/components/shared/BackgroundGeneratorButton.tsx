/**
 * @fileoverview Background Generator Button Component
 * @module components/shared/BackgroundGeneratorButton
 * 
 * OVERVIEW:
 * Dice icon button that generates random character backgrounds.
 * Uses 18 narrative templates with dynamic substitution.
 * 
 * FEATURES:
 * - Dice icon (🎲) with tooltip
 * - Gender-aware pronoun matching
 * - Ethnicity-based narrative variation
 * - 200-400 character backgrounds
 * - Dynamic substitution (city, job, industry, achievement, cause)
 * - Updates parent field via callback
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0 with GUARDIAN PROTOCOL
 */

'use client';

import { Dices } from 'lucide-react';
import type { Gender, Ethnicity } from '@/lib/types/portraits';
import { generateBackground } from '@/lib/utils/backgroundGenerator';

interface BackgroundGeneratorButtonProps {
  /** Gender for pronoun matching (required) */
  gender: Gender;
  
  /** Optional ethnicity for narrative variation */
  ethnicity?: Ethnicity;
  
  /** Callback with generated background */
  onGenerate: (background: string) => void;
  
  /** Optional disabled state */
  disabled?: boolean;
}

/**
 * Background Generator Button Component
 * 
 * Generates random character backgrounds with compelling narratives.
 * Uses 18 templates covering various political backgrounds.
 * 
 * @example
 * ```tsx
 * <BackgroundGeneratorButton
 *   gender={formData.gender}
 *   ethnicity={formData.ethnicity}
 *   onGenerate={(background) => {
 *     setFormData({ ...formData, background });
 *   }}
 * />
 * ```
 */
export default function BackgroundGeneratorButton({
  gender,
  ethnicity,
  onGenerate,
  disabled = false,
}: BackgroundGeneratorButtonProps) {
  /**
   * Generate background narrative
   */
  const handleGenerate = () => {
    const background = generateBackground(gender, ethnicity);
    onGenerate(background);
  };

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={disabled}
      title="Generate random background"
      className={`
        p-2 rounded-lg transition-all duration-200
        ${disabled
          ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
          : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white hover:scale-110 active:scale-95'
        }
      `}
      aria-label="Generate random background"
    >
      <Dices className="w-5 h-5" />
    </button>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Template Variety**: 18 different narrative templates.
 *    Ensures diverse, compelling character backgrounds.
 * 
 * 2. **Pronoun Matching**: Gender prop ensures correct pronouns.
 *    He/she, him/her, his/her automatically matched.
 * 
 * 3. **Dynamic Substitution**: Placeholders replaced with realistic data.
 *    {city}, {job}, {industry}, {achievement}, {cause} all varied.
 * 
 * 4. **Character Limit**: All backgrounds 200-400 chars.
 *    Fits within 500 char database limit with room to spare.
 * 
 * 5. **Accessibility**:
 *    - title attribute for tooltip
 *    - aria-label for screen readers
 *    - Proper button semantics (type="button")
 * 
 * 6. **Visual Feedback**: Same hover/active states as NameGeneratorButton.
 *    Consistent UI/UX across all generator buttons.
 */
