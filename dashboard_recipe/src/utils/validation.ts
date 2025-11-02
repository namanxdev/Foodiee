/**
 * Validation Utilities
 * ====================
 * Form validation and data validation helpers
 */

import { UserPreferences } from '@/types';
import { FORM_OPTIONS } from '@/constants';

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if value is a valid string
 */
export function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if value is a valid number
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Check if value is a non-empty array
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

// ============================================================================
// Preference Validation
// ============================================================================

/**
 * Validate user preferences data
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateUserPreferences(
  preferences: Partial<UserPreferences>
): ValidationResult {
  const errors: Record<string, string> = {};

  // Validate region
  if (!preferences.region || !isValidString(preferences.region)) {
    errors.region = 'Please select a region';
  } else if (!FORM_OPTIONS.regions.includes(preferences.region as any)) {
    errors.region = 'Invalid region selected';
  }

  // Validate taste preferences
  if (!preferences.taste_preferences || preferences.taste_preferences.length === 0) {
    errors.taste_preferences = 'Please select at least one taste preference';
  }

  // Validate meal type
  if (preferences.meal_type && !FORM_OPTIONS.mealTypes.some(opt => opt.value === preferences.meal_type)) {
    errors.meal_type = 'Invalid meal type';
  }

  // Validate time available
  if (preferences.time_available && !FORM_OPTIONS.timeOptions.includes(preferences.time_available as any)) {
    errors.time_available = 'Invalid time selection';
  }

  // Validate allergies (optional, so only check if provided)
  if (preferences.allergies && !Array.isArray(preferences.allergies)) {
    errors.allergies = 'Allergies must be an array';
  }

  // Validate dislikes (optional, so only check if provided)
  if (preferences.dislikes && !Array.isArray(preferences.dislikes)) {
    errors.dislikes = 'Dislikes must be an array';
  }

  // Validate available ingredients (optional, so only check if provided)
  if (preferences.available_ingredients && !Array.isArray(preferences.available_ingredients)) {
    errors.available_ingredients = 'Available ingredients must be an array';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============================================================================
// Form Field Validation
// ============================================================================

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate recipe name
 */
export function validateRecipeName(name: string): boolean {
  return isValidString(name) && name.length >= 2 && name.length <= 100;
}

/**
 * Validate ingredient string
 */
export function validateIngredient(ingredient: string): boolean {
  return isValidString(ingredient) && ingredient.length >= 2;
}

/**
 * Validate time format (e.g., "30 mins", "1 hour")
 */
export function validateTimeFormat(time: string): boolean {
  const timeRegex = /^\d+\s*(min|mins|minute|minutes|hr|hrs|hour|hours)$/i;
  return timeRegex.test(time);
}

// ============================================================================
// Range Validation
// ============================================================================

/**
 * Check if number is within range
 */
export function isInRange(
  value: number,
  min: number,
  max: number
): boolean {
  return isValidNumber(value) && value >= min && value <= max;
}

/**
 * Validate percentage (0-100)
 */
export function validatePercentage(value: number): boolean {
  return isInRange(value, 0, 100);
}

// ============================================================================
// Sanitization
// ============================================================================

/**
 * Sanitize string input (remove dangerous characters)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();
}

/**
 * Sanitize array of strings
 */
export function sanitizeStringArray(input: string[]): string[] {
  return input
    .filter(isValidString)
    .map(sanitizeString)
    .filter(s => s.length > 0);
}

/**
 * Clean and validate user preferences
 */
export function sanitizeUserPreferences(
  preferences: Partial<UserPreferences>
): Partial<UserPreferences> {
  const sanitized: Partial<UserPreferences> = {};

  if (preferences.region && isValidString(preferences.region)) {
    sanitized.region = sanitizeString(preferences.region);
  }

  if (preferences.taste_preferences) {
    sanitized.taste_preferences = sanitizeStringArray(preferences.taste_preferences);
  }

  if (preferences.meal_type && isValidString(preferences.meal_type)) {
    sanitized.meal_type = sanitizeString(preferences.meal_type);
  }

  if (preferences.time_available && isValidString(preferences.time_available)) {
    sanitized.time_available = sanitizeString(preferences.time_available);
  }

  if (preferences.allergies) {
    sanitized.allergies = sanitizeStringArray(preferences.allergies);
  }

  if (preferences.dislikes) {
    sanitized.dislikes = sanitizeStringArray(preferences.dislikes);
  }

  if (preferences.available_ingredients) {
    sanitized.available_ingredients = sanitizeStringArray(preferences.available_ingredients);
  }

  return sanitized;
}
