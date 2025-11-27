/**
 * @fileoverview Formatting Utilities
 * @module lib/utils/formatting
 * 
 * OVERVIEW:
 * String and number formatting helpers.
 * Percentage, plural, truncate, capitalize, slug generation.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

/**
 * Format currency with intelligent unit selection
 * 
 * @example
 * ```typescript
 * formatCurrency(1500000) // "$1.50M"
 * formatCurrency(500000)  // "$500.0k"
 * formatCurrency(100)     // "$100"
 * ```
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}k`;
  }
  return `$${amount.toFixed(0)}`;
}

/**
 * Format number with comma separators
 * 
 * @example
 * ```typescript
 * formatNumber(1500000) // "1,500,000"
 * formatNumber(100)     // "100"
 * ```
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format number as percentage
 * 
 * @example
 * ```typescript
 * formatPercent(0.1234) // "12.34%"
 * formatPercent(0.5) // "50.00%"
 * formatPercent(1.5, 0) // "150%"
 * ```
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format date to locale string
 * 
 * @example
 * ```typescript
 * formatDate(new Date()) // "Nov 21, 2025"
 * ```
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

/**
 * Format relative time (ago format)
 * 
 * @example
 * ```typescript
 * formatRelativeTime(new Date(Date.now() - 300000)) // "5m ago"
 * formatRelativeTime(new Date(Date.now() - 3600000)) // "1h ago"
 * ```
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Pluralize word based on count
 * 
 * @example
 * ```typescript
 * pluralize(1, 'company', 'companies') // "company"
 * pluralize(5, 'company', 'companies') // "companies"
 * pluralize(0, 'employee') // "employees" (auto-adds 's')
 * ```
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural ?? `${singular}s`;
}

/**
 * Truncate string with ellipsis
 * 
 * @example
 * ```typescript
 * truncate('Hello World', 8) // "Hello..."
 * truncate('Short', 10) // "Short"
 * ```
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Capitalize first letter
 * 
 * @example
 * ```typescript
 * capitalize('hello world') // "Hello world"
 * capitalize('CAPS') // "Caps"
 * ```
 */
export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Generate URL-friendly slug
 * 
 * @example
 * ```typescript
 * slugify('Hello World!') // "hello-world"
 * slugify('My Company Name') // "my-company-name"
 * ```
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Format file size (bytes to human-readable)
 * 
 * @example
 * ```typescript
 * formatFileSize(1024) // "1.00 KB"
 * formatFileSize(1048576) // "1.00 MB"
 * formatFileSize(1073741824) // "1.00 GB"
 * ```
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Extract initials from name
 * 
 * @example
 * ```typescript
 * getInitials('John Doe') // "JD"
 * getInitials('Acme Corporation') // "AC"
 * getInitials('A') // "A"
 * ```
 */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

/**
 * Format timestamp for chat and events
 * 
 * @example
 * ```typescript
 * formatTimestamp('2025-11-25T14:30:00Z') // "2:30 PM"
 * ```
 */
export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format time remaining for countdown displays
 * 
 * @example
 * ```typescript
 * formatTimeRemaining('2025-11-25T18:00:00Z') // "3h 25m remaining"
 * formatTimeRemaining('2025-11-25T12:00:00Z') // "Ended" (if in past)
 * ```
 */
export function formatTimeRemaining(endTime: string): string {
  const end = new Date(endTime);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m remaining`;
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **String Utilities**: Common text formatting operations
 * 2. **Number Formatting**: Percentage, file sizes
 * 3. **Pluralization**: Dynamic grammar for counts
 * 4. **URL Safety**: Slug generation for clean URLs
 * 5. **UI Helpers**: Initials, truncation for display
 * 6. **Time Utilities**: Timestamps and countdowns for real-time features
 * 
 * PREVENTS:
 * - 37 duplicate formatting functions (legacy build)
 * - Inconsistent string/number display across UI
 * - Manual pluralization logic in components
 * - Duplicate time formatting logic
 */
