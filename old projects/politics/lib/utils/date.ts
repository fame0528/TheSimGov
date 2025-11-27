/**
 * @file lib/utils/date.ts
 * @description Date formatting utilities using DayJS
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Centralized date formatting utilities with consistent MM-DD-YYYY hh:mm a format.
 * 
 * USAGE:
 * import { formatDate, formatDateTime, formatTime } from '@/lib/utils/date';
 * formatDateTime(new Date()); // "11-13-2025 03:45 PM"
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

/**
 * Standard date format: MM-DD-YYYY
 */
export const DATE_FORMAT = 'MM-DD-YYYY';

/**
 * Standard time format: hh:mm a (12-hour with AM/PM)
 */
export const TIME_FORMAT = 'hh:mm a';

/**
 * Standard datetime format: MM-DD-YYYY hh:mm a
 */
export const DATETIME_FORMAT = 'MM-DD-YYYY hh:mm a';

/**
 * Format date as MM-DD-YYYY
 * @param date - Date to format (Date object, string, or timestamp)
 * @returns Formatted date string (e.g., "11-13-2025")
 */
export const formatDate = (date: Date | string | number): string => {
  return dayjs(date).format(DATE_FORMAT);
};

/**
 * Format time as hh:mm a
 * @param date - Date to format (Date object, string, or timestamp)
 * @returns Formatted time string (e.g., "03:45 PM")
 */
export const formatTime = (date: Date | string | number): string => {
  return dayjs(date).format(TIME_FORMAT);
};

/**
 * Format datetime as MM-DD-YYYY hh:mm a
 * @param date - Date to format (Date object, string, or timestamp)
 * @returns Formatted datetime string (e.g., "11-13-2025 03:45 PM")
 */
export const formatDateTime = (date: Date | string | number): string => {
  return dayjs(date).format(DATETIME_FORMAT);
};

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 * @param date - Date to compare
 * @param baseDate - Base date for comparison (defaults to now)
 * @returns Relative time string
 */
export const formatRelative = (
  date: Date | string | number,
  baseDate?: Date | string | number
): string => {
  return dayjs(date).from(baseDate || dayjs());
};

/**
 * Check if date is in the past
 * @param date - Date to check
 * @returns True if date is before now
 */
export const isPast = (date: Date | string | number): boolean => {
  return dayjs(date).isBefore(dayjs());
};

/**
 * Check if date is in the future
 * @param date - Date to check
 * @returns True if date is after now
 */
export const isFuture = (date: Date | string | number): boolean => {
  return dayjs(date).isAfter(dayjs());
};

/**
 * Get current timestamp in MM-DD-YYYY hh:mm a format
 * @returns Current datetime string
 */
export const now = (): string => {
  return dayjs().format(DATETIME_FORMAT);
};

/**
 * Parse date string in MM-DD-YYYY hh:mm a format
 * @param dateString - Date string to parse
 * @returns DayJS object
 */
export const parseDateTime = (dateString: string) => {
  return dayjs(dateString, DATETIME_FORMAT);
};

/**
 * Convert UTC date to local timezone with format
 * @param date - UTC date
 * @returns Formatted local datetime string
 */
export const formatUTCToLocal = (date: Date | string | number): string => {
  return dayjs.utc(date).local().format(DATETIME_FORMAT);
};

/**
 * Get start of day (00:00:00)
 * @param date - Date to use (defaults to today)
 * @returns Date at start of day
 */
export const startOfDay = (date?: Date | string | number): Date => {
  return dayjs(date).startOf('day').toDate();
};

/**
 * Get end of day (23:59:59)
 * @param date - Date to use (defaults to today)
 * @returns Date at end of day
 */
export const endOfDay = (date?: Date | string | number): Date => {
  return dayjs(date).endOf('day').toDate();
};
