/**
 * Recipe Admin Types
 * TypeScript interfaces for recipe administration
 */

// Image metadata types
export interface StepImage {
  url: string;
  step_index: number | null;
  generated_at?: string;
}

export interface IngredientImage {
  url: string;
  ingredient_index: number | null;
  ingredient_name?: string;
}

// Recipe Model
export interface Recipe {
  id: number;
  name: string;
  description: string | null;
  region: string | null;
  tastes: Taste[] | null;
  meal_types: string[] | null;
  dietary_tags: string[] | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  total_time_minutes: number | null;
  servings: number | null;
  calories: number | null;
  ingredients: Ingredient[] | string | null;
  steps: string[] | null;
  image_url: string | null;
  step_image_urls: string[] | null;
  ingredients_image: string | null;
  steps_beginner: string[] | null;
  steps_advanced: string[] | null;
  steps_beginner_images: StepImage[] | null;
  steps_advanced_images: StepImage[] | null;
  ingredient_image_urls: IngredientImage[] | null;
  popularity_score: number | null;
  rating: number | null;
  source: string | null;
  created_at: string | null;
  updated_at: string | null;
  validation_status: 'pending' | 'validated' | 'needs_fixing' | null;
  data_quality_score: number | null;
  is_complete: boolean | null;
  last_validated_at: string | null;
}

export interface Taste {
  name: string;
  intensity: number;
}

export interface Ingredient {
  quantity: string;
  unit: string;
  name: string;
  preparation?: string;
}

// Regeneration Job
export interface RegenerationJob {
  id: number;
  job_type: 'mass_generation' | 'specific_generation' | 'validation';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  
  // Generation parameters
  cuisine_filter: string | null;
  recipe_name: string | null;
  recipe_count: number | null;
  
  // Selective fixing options
  fix_main_image: boolean;
  fix_ingredients_image: boolean;
  fix_steps_images: boolean;
  fix_steps_text: boolean;
  fix_ingredients_text: boolean;
  
  // Progress
  total_recipes: number;
  processed_recipes: number;
  successful_recipes: number;
  failed_recipes: number;
  skipped_recipes: number;
  
  // Metadata
  started_by: string;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  
  // Resume capability
  last_processed_recipe_id: number | null;
  can_resume: boolean;
}

// Regeneration Log
export interface RegenerationLog {
  id: number;
  job_id: number;
  recipe_id: number | null;
  recipe_name: string | null;
  log_level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  message: string;
  operation: 'main_image' | 'ingredients_image' | 'steps_images' | 'steps_text' | 'ingredients_text' | 'step_images_beginner' | 'step_images_advanced' | null;
  details: any;
  metadata?: {
    prompt?: string;
    step?: number;
    s3_url?: string;
    [key: string]: any;
  };
  created_at: string;
}

// Statistics
export interface RecipeStatistics {
  total_recipes: number;
  missing_data: {
    main_images: number;
    ingredients_images: number;
    steps_images: number;
    steps_beginner: number;
    steps_advanced: number;
  };
  cuisines: {
    total: number;
    list: string[];
  };
  validation_statuses: {
    [key: string]: number;
  };
  completeness: {
    fully_complete: number;
    needs_attention: number;
  };
}

// Request Types
export interface RecipeUpdateRequest {
  name?: string;
  description?: string;
  ingredients?: Array<{ name?: string; ingredient?: string; quantity?: string; unit?: string }>;
  steps?: string[];
  image_url?: string;
  ingredients_image?: string;
  step_image_urls?: string[];
  steps_beginner?: string[];
  steps_advanced?: string[];
  region?: string;
}

export interface MassGenerationRequest {
  cuisine_filter?: string;
  recipe_count?: number;
  fix_main_image: boolean;
  fix_ingredients_image: boolean;
  fix_steps_images: boolean;
  fix_steps_text: boolean;
  fix_ingredients_text: boolean;
  mode?: 'generate' | 'load_from_s3';
}

export interface SpecificGenerationRequest {
  recipe_name: string;
  fix_main_image: boolean;
  fix_ingredients_image: boolean;
  fix_steps_images: boolean;
  fix_steps_text: boolean;
  fix_ingredients_text: boolean;
}

export interface ValidationRequest {
  recipe_ids?: number[];
  fix_main_image: boolean;
  fix_ingredients_image: boolean;
  fix_steps_images: boolean;
  fix_steps_text: boolean;
  fix_ingredients_text: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface ListRecipesResponse {
  success: boolean;
  total: number;
  skip: number;
  limit: number;
  count: number;
  recipes: Recipe[];
  statistics: {
    total: number;
    missing_main_images: number;
    missing_ingredients_images: number;
    missing_steps_images: number;
    missing_steps_text: number;
  };
}

export interface SingleRecipeResponse {
  success: boolean;
  recipe: Recipe;
}

export interface SearchRecipesResponse {
  success: boolean;
  count: number;
  recipes: Recipe[];
}

export interface JobResponse {
  success: boolean;
  message: string;
  job_id?: number;
  stats?: {
    total: number;
    successful: number;
    skipped: number;
    failed: number;
  };
  note?: string;
}

export interface JobStatusResponse {
  success: boolean;
  job: RegenerationJob;
}

export interface JobLogsResponse {
  success: boolean;
  count: number;
  logs: RegenerationLog[];
}

export interface JobsListResponse {
  success: boolean;
  count: number;
  jobs: RegenerationJob[];
}

export interface StatisticsResponse {
  success: boolean;
  statistics: RecipeStatistics;
}
