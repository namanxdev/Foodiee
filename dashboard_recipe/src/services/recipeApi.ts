/**
 * Recipe Recommendation API Service
 * ==================================
 * Handles all recipe recommendation and details API calls
 */

import { API_CONFIG } from '@/constants';
import type {
  UserPreferences,
  PreferencesResponse,
  RecipeDetails,
  IngredientAlternatives,
} from '@/types';

// ============================================================================
// Base API Configuration
// ============================================================================

const API_BASE_URL = API_CONFIG.BASE_URL;

/**
 * Base fetch wrapper with error handling
 */
async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// ============================================================================
// Preferences API
// ============================================================================

/**
 * Submit user preferences and get recipe recommendations
 */
export async function submitPreferences(
  preferences: UserPreferences
): Promise<PreferencesResponse> {
  return fetchAPI<PreferencesResponse>(`${API_BASE_URL}/api/preferences`, {
    method: 'POST',
    body: JSON.stringify(preferences),
  });
}

// ============================================================================
// Recipe Details API
// ============================================================================

/**
 * Get detailed recipe information
 */
export async function getRecipeDetails(
  sessionId: string,
  recipeName: string
): Promise<RecipeDetails> {
  return fetchAPI<RecipeDetails>(
    `${API_BASE_URL}/api/recipe/details?session_id=${sessionId}`,
    {
      method: 'POST',
      body: JSON.stringify({ recipe_name: recipeName }),
    }
  );
}

// ============================================================================
// Ingredient Alternatives API
// ============================================================================

/**
 * Get alternative ingredients for missing ingredients
 */
export async function getIngredientAlternatives(
  sessionId: string,
  missingIngredient: string,
  recipeContext: string
): Promise<IngredientAlternatives> {
  return fetchAPI<IngredientAlternatives>(
    `${API_BASE_URL}/api/ingredients/alternatives?session_id=${sessionId}`,
    {
      method: 'POST',
      body: JSON.stringify({
        missing_ingredient: missingIngredient,
        recipe_context: recipeContext,
      }),
    }
  );
}

// ============================================================================
// Export all functions
// ============================================================================

export const recipeApi = {
  submitPreferences,
  getRecipeDetails,
  getIngredientAlternatives,
};
