"use strict";

export type RecipeDifficulty = "Easy" | "Medium" | "Hard";

export type RecipeDietaryTag =
  | "Vegetarian"
  | "Vegan"
  | "Gluten-Free"
  | "Dairy-Free"
  | "Keto"
  | "Pescatarian"
  | "Low-Carb"
  | "High-Protein";

export type RecipeMealType =
  | "Breakfast"
  | "Brunch"
  | "Lunch"
  | "Dinner"
  | "Snack"
  | "Dessert"
  | "Drink";

export interface RecipeIngredient {
  name: string;
  amount: string;
  preparation?: string;
  optional?: boolean;
  group?: string;
}

export interface RecipeStep {
  id: string;
  title: string;
  instruction: string;
  durationMinutes?: number;
  tip?: string;
  media?: {
    type: "image" | "video";
    url: string;
    alt?: string;
  };
}

export interface RecipeNutrition {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface RecipeAuthor {
  name: string;
  avatarUrl?: string;
  title?: string;
}

export interface RecipeSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  cuisine: string;
  mealType: RecipeMealType;
  difficulty: RecipeDifficulty;
  tags: string[];
  dietary: RecipeDietaryTag[];
  totalTimeMinutes: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  rating: number;
  ratingCount: number;
  favorite?: boolean;
  image: string;
  createdAt: string;
  updatedAt: string;
  lastCookedAt?: string;
  isTrending?: boolean;
}

export interface RecipeDetail extends RecipeSummary {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  equipment: string[];
  nutrition: RecipeNutrition;
  author: RecipeAuthor;
  relatedIds: string[];
  sourceUrl?: string;
  videoUrl?: string;
}

export type RecipeSort =
  | "relevance"
  | "rating"
  | "time"
  | "new"
  | "difficulty"
  | "favorites";

export type RecipeViewMode = "grid" | "list";

export interface RecipeQueryParams {
  search?: string;
  cuisine?: string;
  mealTypes?: RecipeMealType[];
  dietary?: RecipeDietaryTag[];
  difficulty?: RecipeDifficulty[];
  maxTimeMinutes?: number;
  favoritesOnly?: boolean;
  vegetarianOnly?: boolean;
  sort?: RecipeSort;
  page?: number;
  pageSize?: number;
}

export interface FacetEntry {
  value: string;
  count: number;
  selected: boolean;
}

export interface RecipeFacets {
  cuisines: FacetEntry[];
  mealTypes: FacetEntry[];
  dietary: FacetEntry[];
  difficulty: FacetEntry[];
  tags: FacetEntry[];
}

export interface RecipeSuggestion {
  id: string;
  title: string;
  highlight?: string;
  icon?: string;
}

export interface RecipeCollectionResponse {
  items: RecipeSummary[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  suggestions: RecipeSuggestion[];
  facets: RecipeFacets;
}

export interface ToggleFavoritePayload {
  recipeId: string;
  favorite: boolean;
}

export interface UpdateRatingPayload {
  recipeId: string;
  rating: number;
  note?: string;
}




