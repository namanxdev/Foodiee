import type {
  RecipeDietaryTag,
  RecipeDifficulty,
  RecipeMealType,
  RecipeQueryParams,
  RecipeSort,
  RecipeViewMode,
} from "@/types/library";

export interface LibraryFiltersState
  extends Pick<
      RecipeQueryParams,
      | "search"
      | "cuisine"
      | "mealTypes"
      | "dietary"
      | "difficulty"
      | "maxTimeMinutes"
      | "favoritesOnly"
      | "vegetarianOnly"
      | "sort"
      | "pageSize"
    > {
  viewMode: RecipeViewMode;
}

export interface LibraryFilterChange {
  cuisine?: string;
  mealTypes?: RecipeMealType[];
  dietary?: RecipeDietaryTag[];
  difficulty?: RecipeDifficulty[];
  maxTimeMinutes?: number;
  favoritesOnly?: boolean;
  vegetarianOnly?: boolean;
  sort?: RecipeSort;
  viewMode?: RecipeViewMode;
  search?: string;
}




