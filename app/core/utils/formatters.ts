// ============================================================================
// Formatters - Data Formatting Utilities
// ============================================================================
//
// This module provides utilities for formatting various types of data
// including time, dates, numbers, text, and social media specific content.
//

import { formatDistanceToNowStrict } from 'date-fns';

// ============================================================================
// LEGACY FUNCTIONS (Maintaining backward compatibility)
// ============================================================================

/**
 * Formats a number into a compact, human-readable string.
 * e.g., 1000 -> 1k, 1500 -> 1.5k, 1000000 -> 1M
 * @param num The number to format.
 * @returns A compact string representation of the number.
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

/**
 * Formats a date into a compact, relative time string.
 * e.g., "1 minute ago" -> "1 min ago", "7 days ago" -> "7 day ago"
 * @param date The date to format.
 * @returns A compact string representation of the relative time.
 */
export function formatCompactDate(date: Date | string | number): string {
  if (!date) return '';
  const dateObj = new Date(date);
  // Using `formatDistanceToNowStrict` to avoid "about", "almost", etc.
  const result = formatDistanceToNowStrict(dateObj, { addSuffix: true });
  
  // Apply custom shortening rules based on user examples
  return result
    .replace(/ seconds? ago/, ' sec ago')
    .replace(/ minutes? ago/, ' min ago')
    .replace(/ hours? ago/, ' h ago')
    .replace(/ days? ago/, ' day ago')
    .replace(/ weeks? ago/, ' week ago')
    .replace(/ months? ago/, ' month ago')
    .replace(/ years? ago/, ' year ago');
}

// ============================================================================
// ENHANCED FORMATTERS
// ============================================================================

// Time and Date Formatters
export const timeFormatters = {
  // Enhanced relative time formatting
  formatRelativeTime: (date: Date | string | number): string => {
    return formatCompactDate(date); // Use existing function
  },

  // Format absolute time (e.g., "Mar 15, 2024 at 3:30 PM")
  formatAbsoluteTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
    const targetDate = new Date(date);
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };

    return targetDate.toLocaleDateString('en-US', { ...defaultOptions, ...options });
  },

  // Check if date is today
  isToday: (date: Date | string | number): boolean => {
    const today = new Date();
    const targetDate = new Date(date);
    return today.toDateString() === targetDate.toDateString();
  },

  // Check if date is yesterday
  isYesterday: (date: Date | string | number): boolean => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const targetDate = new Date(date);
    return yesterday.toDateString() === targetDate.toDateString();
  },
};

// Number Formatters
export const numberFormatters = {
  // Enhanced number formatting (uses existing function)
  formatCount: formatCompactNumber,

  // Format percentage
  formatPercentage: (value: number, decimals: number = 1): string => {
    return `${(value * 100).toFixed(decimals)}%`;
  },

  // Format file size
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  },
};

// Text Formatters
export const textFormatters = {
  // Truncate text with ellipsis
  truncate: (text: string, maxLength: number, suffix: string = '...'): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length) + suffix;
  },

  // Capitalize first letter
  capitalize: (text: string): string => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  // Extract mentions from text
  extractMentions: (text: string): string[] => {
    const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  },

  // Extract hashtags from text
  extractHashtags: (text: string): string[] => {
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const hashtags = [];
    let match;
    while ((match = hashtagRegex.exec(text)) !== null) {
      hashtags.push(match[1]);
    }
    return hashtags;
  },
};

// Social Media Formatters
export const socialFormatters = {
  // Format handle (ensure it starts with @)
  formatHandle: (handle: string): string => {
    if (!handle) return '';
    return handle.startsWith('@') ? handle : `@${handle}`;
  },

  // Format DID (Decentralized Identifier)
  formatDid: (did: string): string => {
    if (!did) return '';
    if (did.length <= 20) return did;
    return `${did.slice(0, 8)}...${did.slice(-8)}`;
  },

  // Format engagement metrics
  formatEngagement: (likes: number, reposts: number, replies: number): string => {
    const metrics = [];
    if (likes > 0) metrics.push(`${formatCompactNumber(likes)} likes`);
    if (reposts > 0) metrics.push(`${formatCompactNumber(reposts)} reposts`);
    if (replies > 0) metrics.push(`${formatCompactNumber(replies)} replies`);
    return metrics.join(' • ');
  },

  // Format follower count
  formatFollowerCount: (count: number): string => {
    return count === 1 ? '1 follower' : `${formatCompactNumber(count)} followers`;
  },
};

// ============================================================================
// COMBINED FORMATTERS EXPORT
// ============================================================================

export const formatters = {
  time: timeFormatters,
  number: numberFormatters,
  text: textFormatters,
  social: socialFormatters,
};

export default formatters;
