/**
 * @fileoverview Server-safe HTML Sanitization Utility
 * @module lib/utils/sanitizeHtml
 * 
 * OVERVIEW:
 * Simple HTML sanitizer that works in both server and client environments.
 * Avoids jsdom dependency issues with Next.js App Router.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

// Allowed HTML tags for message content
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'a', 'ul', 'ol', 'li', 'blockquote', 'span',
]);

// Allowed attributes per tag
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel']),
  span: new Set(['class']),
};

// Patterns for dangerous content
const DANGEROUS_PATTERNS = [
  /javascript:/gi,
  /vbscript:/gi,
  /data:/gi,
  /on\w+\s*=/gi,
  /<script/gi,
  /<\/script/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<form/gi,
];

/**
 * Sanitize HTML content for safe display
 * Removes dangerous tags, attributes, and protocols
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // First pass: Remove dangerous patterns
  let sanitized = html;
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Second pass: Parse and rebuild with only allowed tags
  // Simple regex-based approach that works on server
  sanitized = sanitized
    // Remove all tags except allowed ones
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, tag, attrs) => {
      const tagLower = tag.toLowerCase();
      
      // Check if tag is allowed
      if (!ALLOWED_TAGS.has(tagLower)) {
        return ''; // Remove disallowed tags entirely
      }
      
      // Check if closing tag
      if (match.startsWith('</')) {
        return `</${tagLower}>`;
      }
      
      // Filter attributes
      const allowedAttrs = ALLOWED_ATTRS[tagLower];
      if (!allowedAttrs || !attrs.trim()) {
        return `<${tagLower}>`;
      }
      
      // Parse and filter attributes
      const attrMatches = attrs.match(/([a-zA-Z-]+)\s*=\s*["']([^"']*)["']/g) || [];
      const filteredAttrs = attrMatches
        .map((attr: string) => {
          const [, name, value] = attr.match(/([a-zA-Z-]+)\s*=\s*["']([^"']*)["']/) || [];
          if (name && allowedAttrs.has(name.toLowerCase())) {
            // Extra check for href - no javascript:
            if (name.toLowerCase() === 'href') {
              const valueLower = value.toLowerCase().trim();
              if (valueLower.startsWith('javascript:') || valueLower.startsWith('vbscript:')) {
                return '';
              }
            }
            return `${name.toLowerCase()}="${value}"`;
          }
          return '';
        })
        .filter(Boolean)
        .join(' ');
      
      return filteredAttrs ? `<${tagLower} ${filteredAttrs}>` : `<${tagLower}>`;
    });

  // Third pass: Fix link targets for security
  sanitized = sanitized.replace(
    /<a\s+([^>]*href\s*=\s*["'][^"']*["'][^>]*)>/gi,
    (match, attrs) => {
      // Add target="_blank" and rel="noopener noreferrer" to external links
      if (!attrs.includes('target=')) {
        attrs += ' target="_blank"';
      }
      if (!attrs.includes('rel=')) {
        attrs += ' rel="noopener noreferrer"';
      }
      return `<a ${attrs}>`;
    }
  );

  return sanitized.trim();
}

/**
 * Strip all HTML tags and return plain text
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  return html
    // Remove HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitize and process message content
 * Returns both sanitized HTML and plain text version
 */
export function sanitizeMessageContent(html: string): { sanitized: string; plainText: string } {
  const sanitized = sanitizeHtml(html);
  const plainText = stripHtml(sanitized);
  
  return { sanitized, plainText };
}
