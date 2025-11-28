"use strict";
/**
 * Portrait and Avatar Type Definitions
 *
 * Type definitions for character portrait selection and avatar system.
 * Supports pre-generated portrait catalog and custom image uploads.
 *
 * @module types/portraits
 * @created 2025-11-26
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AVATAR_CONSTRAINTS = void 0;
/**
 * Avatar upload constraints
 *
 * Validation rules enforced by upload API.
 */
exports.AVATAR_CONSTRAINTS = {
    /** Allowed file types */
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    /** Allowed file extensions */
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif'],
    /** Maximum file size (5MB) */
    MAX_FILE_SIZE: 5 * 1024 * 1024,
    /** Minimum image dimensions */
    MIN_WIDTH: 200,
    MIN_HEIGHT: 200,
    /** Recommended image dimensions */
    RECOMMENDED_WIDTH: 1024,
    RECOMMENDED_HEIGHT: 1024,
};
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
//# sourceMappingURL=portraits.js.map