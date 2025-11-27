/**
 * Portrait and Avatar Type Definitions
 * 
 * Type definitions for character portrait selection and avatar system.
 * Supports pre-generated portrait catalog and custom image uploads.
 * 
 * @module types/portraits
 * @created 2025-11-26
 */

/**
 * Gender type for character creation
 * 
 * Simplified to Male/Female only per user requirement.
 * Used for:
 * - Name generation (gender-appropriate first names)
 * - Portrait filtering (display matching portraits)
 * - Background narrative pronouns (he/she, his/her)
 */
export type Gender = 'Male' | 'Female';

/**
 * Ethnicity type for character diversity
 * 
 * Seven primary ethnicities plus "Other" option.
 * Used for:
 * - Portrait filtering (display matching portraits)
 * - Background narrative cultural context
 * - Demographic representation
 * 
 * Note: Field is optional in registration (user can skip)
 */
export type Ethnicity = 
  | 'White'
  | 'Black'
  | 'Asian'
  | 'Hispanic'
  | 'Native American'
  | 'Middle Eastern'
  | 'Pacific Islander'
  | 'Other';

/**
 * Pre-generated portrait entry in catalog
 * 
 * Represents one portrait image in the `/public/portraits/` directory.
 * Each combination (gender × ethnicity) has 3-5 variations.
 * 
 * @example
 * ```typescript
 * const portrait: PresetPortrait = {
 *   id: 'male-white-01',
 *   gender: 'Male',
 *   ethnicity: 'White',
 *   filename: 'male-white-01.jpg',
 *   thumbnailUrl: '/portraits/thumbs/male-white-01.jpg',
 *   fullUrl: '/portraits/male-white-01.jpg',
 * };
 * ```
 */
export interface PresetPortrait {
  /** Unique identifier for this portrait (e.g., "male-white-01") */
  id: string;
  
  /** Gender of person in portrait */
  gender: Gender;
  
  /** Ethnicity of person in portrait */
  ethnicity: Ethnicity;
  
  /** Filename in /public/portraits/ directory */
  filename: string;
  
  /** URL to thumbnail (150×150px) for grid display */
  thumbnailUrl: string;
  
  /** URL to full-size portrait (1024×1024px) */
  fullUrl: string;
  
  /** Optional display order for UI (lower = shown first) */
  displayOrder?: number;
}

/**
 * Avatar selection result
 * 
 * Represents user's final avatar choice: either preset portrait OR custom upload.
 * Only one will be populated (mutually exclusive).
 * 
 * @example
 * ```typescript
 * // Preset portrait selection
 * const selection1: AvatarSelection = {
 *   type: 'preset',
 *   portraitId: 'female-asian-02',
 *   imageUrl: '/portraits/female-asian-02.jpg',
 * };
 * 
 * // Custom upload
 * const selection2: AvatarSelection = {
 *   type: 'upload',
 *   uploadUrl: '/avatars/user123-1732627845.jpg',
 *   imageUrl: '/avatars/user123-1732627845.jpg',
 * };
 * ```
 */
export interface AvatarSelection {
  /** Selection type: preset portrait or custom upload */
  type: 'preset' | 'upload';
  
  /** Portrait ID if type='preset' (e.g., "male-black-03") */
  portraitId?: string;
  
  /** Upload URL if type='upload' (e.g., "/avatars/user123.jpg") */
  uploadUrl?: string;
  
  /** Final image URL to display (always populated) */
  imageUrl: string;
}

/**
 * Portrait filter criteria
 * 
 * Used to filter portrait catalog by user's selected gender/ethnicity.
 * Both fields optional to support partial filtering.
 * 
 * @example
 * ```typescript
 * // Filter by both
 * const filter1: PortraitFilter = {
 *   gender: 'Female',
 *   ethnicity: 'Hispanic',
 * };
 * 
 * // Filter by gender only (show all ethnicities)
 * const filter2: PortraitFilter = {
 *   gender: 'Male',
 * };
 * ```
 */
export interface PortraitFilter {
  /** Gender to filter by (optional) */
  gender?: Gender;
  
  /** Ethnicity to filter by (optional) */
  ethnicity?: Ethnicity;
}

/**
 * Image upload validation result
 * 
 * Returned from avatar upload API after validation.
 * 
 * @example
 * ```typescript
 * const result: UploadValidation = {
 *   isValid: true,
 *   uploadUrl: '/avatars/user123-1732627845.jpg',
 *   errors: [],
 * };
 * ```
 */
export interface UploadValidation {
  /** Whether upload passed all validation checks */
  isValid: boolean;
  
  /** URL to uploaded image if valid */
  uploadUrl?: string;
  
  /** Validation error messages if invalid */
  errors: string[];
  
  /** Original filename */
  originalFilename?: string;
  
  /** File size in bytes */
  fileSize?: number;
  
  /** Image dimensions */
  dimensions?: {
    width: number;
    height: number;
  };
}

/**
 * Avatar upload constraints
 * 
 * Validation rules enforced by upload API.
 */
export const AVATAR_CONSTRAINTS = {
  /** Allowed file types */
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'] as const,
  
  /** Allowed file extensions */
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif'] as const,
  
  /** Maximum file size (5MB) */
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  
  /** Minimum image dimensions */
  MIN_WIDTH: 200,
  MIN_HEIGHT: 200,
  
  /** Recommended image dimensions */
  RECOMMENDED_WIDTH: 1024,
  RECOMMENDED_HEIGHT: 1024,
} as const;

/**
 * Portrait catalog statistics
 * 
 * Summary of available portraits by combination.
 * Useful for admin/debugging.
 * 
 * @example
 * ```typescript
 * const stats: PortraitCatalogStats = {
 *   totalPortraits: 56,
 *   combinationsCovered: 14,
 *   combinationsExpected: 14,
 *   averageVariations: 4,
 *   minVariations: 3,
 *   maxVariations: 5,
 * };
 * ```
 */
export interface PortraitCatalogStats {
  /** Total number of portraits in catalog */
  totalPortraits: number;
  
  /** Number of gender×ethnicity combinations covered */
  combinationsCovered: number;
  
  /** Expected combinations (14 = 7 ethnicities × 2 genders) */
  combinationsExpected: number;
  
  /** Average number of variations per combination */
  averageVariations: number;
  
  /** Minimum variations in any combination */
  minVariations: number;
  
  /** Maximum variations in any combination */
  maxVariations: number;
  
  /** Combinations missing portraits */
  missingCombinations?: Array<{ gender: Gender; ethnicity: Ethnicity }>;
}

/**
 * IMPLEMENTATION NOTES
 * 
 * Design Decisions:
 * 1. Gender simplified to Male/Female only (user requirement)
 * 2. Ethnicity optional (user can skip, defaults to "Other")
 * 3. Preset vs Upload mutually exclusive (user picks one OR the other)
 * 4. All portrait images in /public/portraits/ (static serving)
 * 5. User uploads in /public/avatars/ (separate directory)
 * 
 * Usage Patterns:
 * - Registration: User selects gender → portraits auto-filter
 * - Portrait selection: Grid shows only matching gender/ethnicity
 * - Upload: User drags image → validation → save to /avatars/
 * - Database: Store imageUrl (either /portraits/ or /avatars/ path)
 * 
 * Validation Flow:
 * 1. Client: File type/size validation before upload
 * 2. Server: Re-validate type, size, dimensions
 * 3. Server: Verify image is person (future: ML detection)
 * 4. Server: Save to /public/avatars/[userId]-[timestamp].jpg
 * 5. Server: Return uploadUrl for database storage
 * 
 * Portrait Catalog Structure:
 * - 7 ethnicities × 2 genders = 14 combinations
 * - 3-5 variations per combination = 42-70 total images
 * - File naming: {gender}-{ethnicity}-{number}.jpg
 * - Thumbnails: /portraits/thumbs/ (150×150px for grid performance)
 * 
 * Future Enhancements:
 * - ML-based person detection (reject non-person images)
 * - Face cropping/centering automation
 * - Brightness/contrast normalization
 * - Background removal option
 * - Avatar accessories (frames, badges, VIP indicators)
 * - Animated avatars for premium users
 */
