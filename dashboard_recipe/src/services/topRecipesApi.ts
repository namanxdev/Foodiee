/**
 * Top Recipes API Service
 * ========================
 * TypeScript service layer for interacting with the top recipes API
 */

import { API_CONFIG } from '@/constants';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface IngredientDetail {
  name: string;
  quantity: string;
  unit: string;
  preparation?: string;
}

export interface TasteDetail {
  name: string;
  intensity: number;
}

export interface StepImage {
  url: string;
  step_index: number;
  generated_at?: string;
}

export interface TopRecipe {
  id: number;
  name: string;
  description: string;
  region: string;
  tastes: TasteDetail[];
  meal_types: string[];
  dietary_tags: string[];
  difficulty: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  total_time_minutes: number;
  servings: number;
  calories: number;
  ingredients: IngredientDetail[];
  steps: string[];
  image_url: string;
  step_image_urls: string[];
  rating: number;
  popularity_score: number;
  source: string;
  created_at: string;
  updated_at: string;
  // Step-by-step guide fields
  steps_beginner?: string[];
  steps_advanced?: string[];
  steps_beginner_images?: StepImage[];
  steps_advanced_images?: StepImage[];
  ingredients_image?: string;
}

export interface TopRecipeSummary {
  id: number;
  name: string;
  description: string;
  region: string;
  difficulty: string;
  total_time_minutes: number;
  servings: number;
  calories: number;
  image_url: string;
  rating: number;
  popularity_score: number;
  meal_types: string[];
  dietary_tags: string[];
}

export interface TopRecipesResponse {
  recipes: (TopRecipe | TopRecipeSummary)[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  success: boolean;
}

export interface AvailableFilters {
  regions: string[];
  difficulties: string[];
  meal_types: string[];
  dietary_tags: string[];
  success: boolean;
}

export interface RecipeFilters {
  region?: string;
  difficulty?: string;
  meal_types?: string[];
  dietary_tags?: string[];
  max_time?: number;
  min_rating?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  page_size?: number;
  detailed?: boolean;
}

// ============================================================================
// API Configuration
// ============================================================================

const API_BASE_URL = API_CONFIG.BASE_URL;
const TOP_RECIPES_ENDPOINT = `${API_BASE_URL}/api/top-recipes`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch top recipes with filters, pagination, and sorting
 */
export async function fetchTopRecipes(
  filters: RecipeFilters = {}
): Promise<TopRecipesResponse> {
  const params = new URLSearchParams();

  // Add all filter parameters
  if (filters.region) params.append('region', filters.region);
  if (filters.difficulty) params.append('difficulty', filters.difficulty);
  if (filters.meal_types?.length) params.append('meal_types', filters.meal_types.join(','));
  if (filters.dietary_tags?.length) params.append('dietary_tags', filters.dietary_tags.join(','));
  if (filters.max_time) params.append('max_time', filters.max_time.toString());
  if (filters.min_rating) params.append('min_rating', filters.min_rating.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.sort_by) params.append('sort_by', filters.sort_by);
  if (filters.sort_order) params.append('sort_order', filters.sort_order);
  
  // Pagination
  params.append('page', (filters.page || 1).toString());
  params.append('page_size', (filters.page_size || 12).toString());
  
  // Detail level
  params.append('detailed', (filters.detailed !== undefined ? filters.detailed : false).toString());

  const url = `${TOP_RECIPES_ENDPOINT}?${params.toString()}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control for development
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Failed to fetch recipes: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  } catch (error) {
    // Handle network errors (CORS, connection refused, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error:', error);
      throw new Error(
        `Unable to connect to API at ${TOP_RECIPES_ENDPOINT}. ` +
        `Please ensure the backend server is running and accessible. ` +
        `Check your NEXT_PUBLIC_API_URL environment variable.`
      );
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Fetch a single recipe by ID with full details
 */
export async function fetchRecipeById(id: number): Promise<TopRecipe> {
  const url = `${TOP_RECIPES_ENDPOINT}/${id}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || response.statusText;
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || response.statusText;
      }
      
      if (response.status === 404) {
        throw new Error(`Recipe not found (ID: ${id})`);
      }
      throw new Error(`Failed to fetch recipe: ${response.status} ${response.statusText} - ${errorMessage}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error:', error);
      throw new Error(
        `Unable to connect to API at ${TOP_RECIPES_ENDPOINT}. ` +
        `Please ensure the backend server is running and accessible.`
      );
    }
    throw error;
  }
}

/**
 * Fetch available filter options
 */
export async function fetchAvailableFilters(): Promise<AvailableFilters> {
  const url = `${TOP_RECIPES_ENDPOINT}/filters/available`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Failed to fetch filters: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error:', error);
      throw new Error(
        `Unable to connect to API at ${TOP_RECIPES_ENDPOINT}. ` +
        `Please ensure the backend server is running and accessible.`
      );
    }
    throw error;
  }
}

/**
 * Fetch database statistics
 */
export async function fetchRecipeStats(): Promise<unknown> {
  const url = `${TOP_RECIPES_ENDPOINT}/stats/summary`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Failed to fetch stats: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error:', error);
      throw new Error(
        `Unable to connect to API at ${TOP_RECIPES_ENDPOINT}. ` +
        `Please ensure the backend server is running and accessible.`
      );
    }
    throw error;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format time in minutes to readable string
 */
export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Get difficulty color for badge
 */
export function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    'Easy': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Hard': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[difficulty] || 'bg-gray-100 text-gray-800';
}

/**
 * Get rating stars display
 */
export function getRatingStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  return '⭐'.repeat(fullStars) + (halfStar ? '✨' : '') + '☆'.repeat(emptyStars);
}
