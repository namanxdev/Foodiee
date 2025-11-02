/**
 * Application Constants
 * =====================
 * Centralized constants for better maintainability
 */

// ============================================================================
// API Configuration
// ============================================================================

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  TIMEOUT: 30000, // 30 seconds
} as const;

// ============================================================================
// Form Options
// ============================================================================

export const FORM_OPTIONS = {
  // Dietary preferences
  dietary: [
    { value: "Vegetarian", label: "Vegetarian" },
    { value: "Vegan", label: "Vegan" },
    { value: "Non-Vegetarian", label: "Non-Vegetarian" },
    { value: "Pescatarian", label: "Pescatarian" },
    { value: "Keto", label: "Keto" },
    { value: "Paleo", label: "Paleo" },
    { value: "Gluten-Free", label: "Gluten-Free" },
  ],

  // Allergies
  allergies: [
    { value: "Nuts", label: "Nuts" },
    { value: "Dairy", label: "Dairy" },
    { value: "Eggs", label: "Eggs" },
    { value: "Soy", label: "Soy" },
    { value: "Shellfish", label: "Shellfish" },
    { value: "Wheat", label: "Wheat" },
    { value: "Fish", label: "Fish" },
  ],

  // Cooking skills
  cookingSkills: [
    { value: "Beginner", label: "Beginner" },
    { value: "Intermediate", label: "Intermediate" },
    { value: "Advanced", label: "Advanced" },
  ],

  // Spice levels
  spiceLevels: [
    { value: "Mild", label: "Mild" },
    { value: "Medium", label: "Medium" },
    { value: "Hot", label: "Hot" },
    { value: "Extra Hot", label: "Extra Hot" },
  ],

  // Cooking times
  cookingTimes: [
    { value: "Under 15 mins", label: "Under 15 mins" },
    { value: "15-30 mins", label: "15-30 mins" },
    { value: "30-45 mins", label: "30-45 mins" },
    { value: "45-60 mins", label: "45-60 mins" },
    { value: "Over 1 hour", label: "Over 1 hour" },
  ],

  // Meal types
  mealTypes: [
    { value: "Breakfast", label: "Breakfast" },
    { value: "Lunch", label: "Lunch" },
    { value: "Dinner", label: "Dinner" },
    { value: "Snack", label: "Snack" },
    { value: "Dessert", label: "Dessert" },
  ],

  // Legacy support (used in TopRecipes components)
  regions: [
    "Indian",
    "Chinese",
    "Italian",
    "Mexican",
    "Japanese",
    "Mediterranean",
    "Thai",
    "Korean",
  ],
  tastes: ["Sweet", "Spicy", "Savory", "Sour", "Tangy", "Mild", "Rich"],
  timeOptions: ["15-30 mins", "30-45 mins", "45-60 mins", "1+ hour"],
  difficulties: ["Easy", "Medium", "Hard"],
} as const;

// ============================================================================
// Pagination
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 100,
} as const;

// ============================================================================
// Sorting
// ============================================================================

export const SORT_OPTIONS = {
  DEFAULT_SORT_BY: "popularity_score",
  DEFAULT_SORT_ORDER: "DESC" as const,
  AVAILABLE_SORTS: [
    { value: "popularity_score", label: "Most Popular" },
    { value: "rating", label: "Highest Rated" },
    { value: "total_time_minutes", label: "Quickest" },
    { value: "name", label: "Name (A-Z)" },
  ],
} as const;

// ============================================================================
// UI Messages
// ============================================================================

export const MESSAGES = {
  errors: {
    GENERIC: "Something went wrong. Please try again.",
    NETWORK: "Network error. Please check your connection.",
    NO_RECIPES: "No recipes found matching your preferences.",
    RECIPE_LOAD_FAILED: "Failed to load recipe details.",
    IMAGE_GENERATION_FAILED: "Failed to generate image.",
  },
  success: {
    RECIPE_LOADED: "Recipe loaded successfully!",
    IMAGE_GENERATED: "Image generated successfully!",
    PREFERENCES_SAVED: "Preferences saved!",
  },
  loading: {
    FETCHING_RECIPES: "Finding perfect recipes for you...",
    LOADING_DETAILS: "Loading recipe details...",
    GENERATING_IMAGE: "Generating cooking image...",
  },
} as const;

// ============================================================================
// Image Generation
// ============================================================================

export const IMAGE_CONFIG = {
  FALLBACK_IMAGE: "/placeholder-recipe.jpg",
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_FORMATS: ["image/jpeg", "image/png", "image/webp"],
} as const;

// ============================================================================
// Recipe Card
// ============================================================================

export const RECIPE_CARD = {
  DEFAULT_IMAGE: "/default-recipe.jpg",
  RATING_MAX: 5,
  DIFFICULTY_COLORS: {
    Easy: "text-green-600 bg-green-50",
    Medium: "text-yellow-600 bg-yellow-50",
    Hard: "text-red-600 bg-red-50",
  },
} as const;

// ============================================================================
// Session Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  SESSION_ID: "recipe_session_id",
  USER_PREFERENCES: "user_preferences",
  LAST_RECIPE: "last_recipe",
} as const;
