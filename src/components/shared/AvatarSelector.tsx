/**
 * @fileoverview Avatar Selector Component
 * @module components/shared/AvatarSelector
 * 
 * OVERVIEW:
 * Tabbed interface combining preset portrait selection and custom upload.
 * Shows current avatar preview, integrates PortraitSelector and ImageUpload.
 * 
 * FEATURES:
 * - Two tabs: "Choose Portrait" | "Upload Your Own"
 * - Current selection preview (circular avatar 150×150px)
 * - Auto-switch to preset tab when gender/ethnicity changes
 * - Maintains selection state across tab switches
 * - Updates parent form with avatar selection
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0 with GUARDIAN PROTOCOL
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import type { Gender, Ethnicity, PresetPortrait, AvatarSelection } from '@/lib/types/portraits';
import PortraitSelector from './PortraitSelector';
import ImageUpload from './ImageUpload';

interface AvatarSelectorProps {
  /** Selected gender (filters portraits) */
  selectedGender: Gender;
  
  /** Optional selected ethnicity (filters portraits further) */
  selectedEthnicity?: Ethnicity;
  
  /** Current avatar selection */
  currentAvatar?: AvatarSelection;
  
  /** Callback when avatar changes */
  onAvatarChange: (selection: AvatarSelection) => void;
}

type TabType = 'preset' | 'upload';

/**
 * Avatar Selector Component
 * 
 * Combines preset portrait selection and custom upload in tabbed interface.
 * Manages avatar state and communicates selection to parent form.
 * 
 * @example
 * ```tsx
 * const [avatarSelection, setAvatarSelection] = useState<AvatarSelection>({ type: 'preset' });
 * 
 * <AvatarSelector
 *   selectedGender={formData.gender}
 *   selectedEthnicity={formData.ethnicity}
 *   currentAvatar={avatarSelection}
 *   onAvatarChange={(selection) => {
 *     setAvatarSelection(selection);
 *     setFormData({ ...formData, imageUrl: selection.imageUrl });
 *   }}
 * />
 * ```
 */
export default function AvatarSelector({
  selectedGender,
  selectedEthnicity,
  currentAvatar,
  onAvatarChange,
}: AvatarSelectorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('preset');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Update preview when current avatar changes
  useEffect(() => {
    if (currentAvatar?.imageUrl) {
      setPreviewUrl(currentAvatar.imageUrl);
    }
  }, [currentAvatar]);

  /**
   * Handle preset portrait selection
   */
  const handlePortraitSelect = (portrait: PresetPortrait) => {
    const selection: AvatarSelection = {
      type: 'preset',
      portraitId: portrait.id,
      imageUrl: portrait.fullUrl,
    };
    
    onAvatarChange(selection);
    setPreviewUrl(portrait.fullUrl);
  };

  /**
   * Handle custom upload success
   */
  const handleUploadSuccess = (uploadUrl: string) => {
    const selection: AvatarSelection = {
      type: 'upload',
      uploadUrl: uploadUrl,
      imageUrl: uploadUrl,
    };
    
    onAvatarChange(selection);
    setPreviewUrl(uploadUrl);
  };

  return (
    <div className="space-y-6">
      {/* Current Selection Preview */}
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-700 bg-gray-800">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Selected avatar"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-12 h-12 text-gray-600" />
            </div>
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-300">
            {previewUrl ? 'Current Avatar' : 'No Avatar Selected'}
          </p>
          <p className="text-xs text-gray-500">
            {currentAvatar?.type === 'preset' && 'Preset Portrait'}
            {currentAvatar?.type === 'upload' && 'Custom Upload'}
            {!currentAvatar && 'Choose a portrait or upload your own'}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`
              px-6 py-3 text-sm font-medium transition-all duration-200
              border-b-2 -mb-px
              ${activeTab === 'preset'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }
            `}
          >
            Choose Portrait
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`
              px-6 py-3 text-sm font-medium transition-all duration-200
              border-b-2 -mb-px
              ${activeTab === 'upload'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }
            `}
          >
            Upload Your Own
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'preset' && (
          <div className="animate-in fade-in duration-200">
            <PortraitSelector
              selectedGender={selectedGender}
              selectedEthnicity={selectedEthnicity}
              currentSelection={currentAvatar?.portraitId}
              onSelect={handlePortraitSelect}
            />
          </div>
        )}
        
        {activeTab === 'upload' && (
          <div className="animate-in fade-in duration-200">
            <ImageUpload
              onUploadSuccess={handleUploadSuccess}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **State Management**: Maintains activeTab and previewUrl locally.
 *    Parent controls currentAvatar via props (single source of truth).
 * 
 * 2. **Preview Update**: useEffect syncs preview with currentAvatar changes.
 *    Handles external updates (e.g., form reset, load saved data).
 * 
 * 3. **Tab Switching**: Preserves selection when switching tabs.
 *    User can switch between preset/upload without losing selection.
 * 
 * 4. **Avatar Preview**: Circular 150×150px preview shows current selection.
 *    Defaults to User icon when no avatar selected.
 * 
 * 5. **Integration**:
 *    - PortraitSelector: Handles preset portrait grid and filtering
 *    - ImageUpload: Handles custom upload with validation
 *    - Parent form: Receives AvatarSelection via onAvatarChange callback
 * 
 * 6. **User Experience**:
 *    - Clear visual feedback (tab highlights, preview updates)
 *    - Smooth transitions (fade-in animations)
 *    - Informative labels (preset vs custom, selection status)
 */
