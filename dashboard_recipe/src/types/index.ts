/**
 * Type Definitions for Recipe Application
 * ========================================
 * Centralized type definitions for better maintainability
 */

// ============================================================================
// User Preferences Types
// ============================================================================

export interface UserPreferences {
  region: string;
  taste_preferences: string[];
  meal_type: string;
  time_available: string;
  allergies: string[];
  dislikes: string[];
  available_ingredients: string[];
}

export interface PreferencesResponse {
  success: boolean;
  session_id: string;
  recommendations: string;
  message?: string;
}

// ============================================================================
// Recipe Types
// ============================================================================

export interface RecipeDetails {
  success: boolean;
  recipe_name: string;
  ingredients: string;
  steps: string[];
  tips: string;
}

export interface StepImageResponse {
  success: boolean;
  image_data: string | null;
  description: string;
  generation_type: string;
}

export interface IngredientAlternatives {
  success: boolean;
  alternatives: string;
}

// ============================================================================
// Top Recipes Types
// ============================================================================

export interface IngredientDetail {
  name: string;
  quantity: string;
  unit: string;
  preparation?: string;
}

export interface TasteDetail {
  name: string;
  intensity: number; // 1-5
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
// Component Props Types
// ============================================================================

export interface PreferencesFormProps {
  onSubmit: (sessionId: string, recommendations: string) => void;
}

export interface RecipeListProps {
  recommendations: string;
  sessionId: string;
  onSelectRecipe: (recipeName: string, data: RecipeDetails) => void;
  onBack: () => void;
}

export interface RecipeDetailsProps {
  recipeName: string;
  recipeData: RecipeDetails;
  sessionId: string;
  onStartCooking: () => void;
  onBack: () => void;
}

export interface CookingStepsProps {
  recipeName: string;
  steps: string[];
  sessionId: string;
  onComplete: () => void;
}
