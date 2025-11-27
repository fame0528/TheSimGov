/**
 * @fileoverview Name Generator Button Component
 * @module components/shared/NameGeneratorButton
 * 
 * OVERVIEW:
 * Dice icon button that generates random names using @faker-js/faker.
 * Supports first names, last names, and company names with industry targeting.
 * 
 * FEATURES:
 * - Dice icon (🎲) with tooltip
 * - Gender-aware first name generation
 * - Gender-neutral last name generation
 * - Industry-specific company name generation
 * - Updates parent field via callback
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0 with GUARDIAN PROTOCOL
 */

'use client';

import { Dices } from 'lucide-react';
import type { Gender } from '@/lib/types/portraits';
import { 
  generateFirstName, 
  generateLastName, 
  generateCompanyName,
  generateIndustryCompanyName,
} from '@/lib/utils/nameGenerator';

type GeneratorType = 'first' | 'last' | 'company';

interface NameGeneratorButtonProps {
  /** Type of name to generate */
  generatorType: GeneratorType;
  
  /** Gender for first name generation (required if generatorType='first') */
  gender?: Gender;
  
  /** Industry for company name generation (optional) */
  industry?: string;
  
  /** Callback with generated name */
  onGenerate: (name: string) => void;
  
  /** Optional disabled state */
  disabled?: boolean;
}

/**
 * Name Generator Button Component
 * 
 * Generates random names based on type (first, last, company).
 * Uses @faker-js/faker for realistic, diverse name generation.
 * 
 * @example
 * ```tsx
 * // First name generator
 * <NameGeneratorButton
 *   generatorType="first"
 *   gender={formData.gender}
 *   onGenerate={(name) => setFormData({ ...formData, firstName: name })}
 * />
 * 
 * // Company name generator with industry
 * <NameGeneratorButton
 *   generatorType="company"
 *   industry={formData.industry}
 *   onGenerate={(name) => setFormData({ ...formData, companyName: name })}
 * />
 * ```
 */
export default function NameGeneratorButton({
  generatorType,
  gender,
  industry,
  onGenerate,
  disabled = false,
}: NameGeneratorButtonProps) {
  /**
   * Generate name based on type
   */
  const handleGenerate = () => {
    let name = '';
    
    switch (generatorType) {
      case 'first':
        if (!gender) {
          console.error('Gender required for first name generation');
          return;
        }
        name = generateFirstName(gender);
        break;
        
      case 'last':
        name = generateLastName();
        break;
        
      case 'company':
        // Use industry-specific if industry provided, otherwise generic
        if (industry) {
          name = generateIndustryCompanyName(industry);
        } else {
          name = generateCompanyName();
        }
        break;
    }
    
    if (name) {
      onGenerate(name);
    }
  };

  /**
   * Get tooltip text based on generator type
   */
  const getTooltipText = () => {
    switch (generatorType) {
      case 'first':
        return 'Generate random first name';
      case 'last':
        return 'Generate random last name';
      case 'company':
        return industry 
          ? `Generate random ${industry} company name`
          : 'Generate random company name';
      default:
        return 'Generate random name';
    }
  };

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={disabled}
      title={getTooltipText()}
      className={`
        p-2 rounded-lg transition-all duration-200
        ${disabled
          ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
          : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white hover:scale-110 active:scale-95'
        }
      `}
      aria-label={getTooltipText()}
    >
      <Dices className="w-5 h-5" />
    </button>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Generator Type**: Supports three types of generation.
 *    - 'first': Gender-aware first names (requires gender prop)
 *    - 'last': Gender-neutral last names
 *    - 'company': Industry-specific or generic company names
 * 
 * 2. **Industry Targeting**: Company generator uses industry if provided.
 *    Falls back to generic generation for better variety.
 * 
 * 3. **Error Handling**: Logs error if first name requested without gender.
 *    Prevents invalid generation attempts.
 * 
 * 4. **Accessibility**:
 *    - title attribute for tooltip on hover
 *    - aria-label for screen readers
 *    - Proper button semantics (type="button" prevents form submission)
 * 
 * 5. **Visual Feedback**:
 *    - Hover: Background darkens, scale increases
 *    - Active: Scale decreases (click feedback)
 *    - Disabled: Grayed out, cursor-not-allowed
 * 
 * 6. **Integration**: Parent component controls field value.
 *    This button only triggers generation, doesn't manage state.
 */
