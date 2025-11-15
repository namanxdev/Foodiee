/**
 * Utility Functions
 * =================
 * Reusable helper functions
 */

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Parse recipe names from recommendation text
 */
export function parseRecipeNames(recommendations: string): string[] {
  const lines = recommendations.split('\n');
  const recipes: string[] = [];
  
  lines.forEach(line => {
    // Match patterns like: "1. Recipe Name", "Recipe 1: Name", "**1. Name**"
    const match = line.match(/^\*?\*?(?:\d+\.|Recipe \d+:?)\s*\*?\*?\s*(.+?)(?:\*\*)?$/i);
    if (match && match[1]) {
      recipes.push(match[1].trim().replace(/\*\*/g, ''));
    }
  });
  
  return recipes;
}

/**
 * Clean recipe name (remove numbering and extra formatting)
 */
export function cleanRecipeName(name: string): string {
  return name
    .replace(/^\d+\.\s*/, '') // Remove "1. "
    .replace(/^Recipe\s+\d+:?\s*/i, '') // Remove "Recipe 1:"
    .replace(/\*\*/g, '') // Remove markdown bold
    .trim();
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// ============================================================================
// Array Utilities
// ============================================================================

/**
 * Remove duplicates from array
 */
export function uniqueArray<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Split comma-separated string into array and trim
 */
export function splitAndTrim(input: string): string[] {
  if (!input) return [];
  return input
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

// ============================================================================
// Time Formatting
// ============================================================================

/**
 * Format minutes to human-readable time
 */
export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} mins`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Parse time string to minutes
 */
export function parseTimeToMinutes(timeStr: string): number {
  const hourMatch = timeStr.match(/(\d+)\s*h/i);
  const minMatch = timeStr.match(/(\d+)\s*m/i);
  
  const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
  const minutes = minMatch ? parseInt(minMatch[1]) : 0;
  
  return hours * 60 + minutes;
}

// ============================================================================
// Rating Utilities
// ============================================================================

/**
 * Generate array of star ratings (for display)
 */
export function generateStarRatings(rating: number, maxRating: number = 5): boolean[] {
  return Array.from({ length: maxRating }, (_, i) => i < Math.round(rating));
}

// ============================================================================
// Image Utilities
// ============================================================================

/**
 * Check if base64 string is valid
 */
export function isValidBase64(str: string): boolean {
  if (!str) return false;
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}

/**
 * Get image data URL from base64
 */
export function getImageDataUrl(base64: string, mimeType: string = 'image/jpeg'): string {
  if (!base64) return '';
  // Check if already has data URL prefix
  if (base64.startsWith('data:')) return base64;
  return `data:${mimeType};base64,${base64}`;
}

// ============================================================================
// URL Utilities
// ============================================================================

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        searchParams.append(key, value.join(','));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Check if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if form data is complete
 */
export function isFormDataComplete(data: Record<string, unknown>, requiredFields: string[]): boolean {
  return requiredFields.every(field => {
    const value = data[field];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== '' && value !== null && value !== undefined;
  });
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

/**
 * Check if error is network error
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('network') || 
         message.includes('fetch') || 
         message.includes('connection');
}

// ============================================================================
// Local Storage Utilities
// ============================================================================

/**
 * Safely get item from localStorage
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Safely set item in localStorage
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage:`, error);
    return false;
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage:`, error);
    return false;
  }
}
