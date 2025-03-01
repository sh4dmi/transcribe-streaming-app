// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Utility module for consistent formatting functions.
 * This provides centralized formatting functionality for the application.
 */

/**
 * Format a timestamp in a human-readable way
 * 
 * @param {string|number|Date} timestamp - The timestamp to format
 * @param {boolean} includeSeconds - Whether to include seconds
 * @returns {string} Formatted time string
 */
export function formatTimestamp(timestamp, includeSeconds = false) {
  if (!timestamp) return "";
  
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  
  const options = {
    hour: '2-digit',
    minute: '2-digit'
  };
  
  if (includeSeconds) {
    options.second = '2-digit';
  }
  
  return date.toLocaleTimeString([], options);
}

/**
 * Format date in a locale-specific way
 * 
 * @param {string|number|Date} date - The date to format
 * @param {string} locale - The locale to use (default: 'he-IL')
 * @returns {string} Formatted date string
 */
export function formatDate(date, locale = 'he-IL') {
  if (!date) return "";
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format time in a human-readable way
 * 
 * @param {string} time - The time to format (e.g., "14:30")
 * @returns {string} Formatted time string
 */
export function formatTime(time) {
  if (!time) return "";
  
  // Try to parse in 24-hour format
  const [hours, minutes] = time.split(':').map(part => parseInt(part, 10));
  if (isNaN(hours) || isNaN(minutes)) return time;
  
  // Create date object for today with the specific time
  const date = new Date();
  date.setHours(hours, minutes, 0);
  
  // Return formatted time
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Highlight specific keywords in a text
 * 
 * @param {string} text - The text to process
 * @param {string[]} keywords - Array of keywords to highlight
 * @param {string} highlightClass - CSS class to apply (default: 'highlight-keyword')
 * @returns {string} HTML with highlighted keywords
 */
export function highlightKeywords(text, keywords, highlightClass = 'highlight-keyword') {
  if (!text || !keywords || keywords.length === 0) return text;
  
  let result = text;
  
  keywords.forEach(keyword => {
    if (!keyword) return;
    
    const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'gi');
    result = result.replace(regex, `<span class="${highlightClass}">$&</span>`);
  });
  
  return result;
}

/**
 * Truncate text to a maximum length with ellipsis
 * 
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  
  // Truncate at word boundary when possible
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Escape special characters in a string for use in RegExp
 * 
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
export function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Format a number with thousands separators
 * 
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

/**
 * Convert plain text to HTML with line breaks
 * 
 * @param {string} text - Plain text
 * @returns {string} HTML with line breaks
 */
export function textToHtml(text) {
  if (!text) return '';
  
  // Convert line breaks to <br> tags
  return text.replace(/\n/g, '<br>');
}

/**
 * Format a duration in milliseconds to a readable string
 * 
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
} 