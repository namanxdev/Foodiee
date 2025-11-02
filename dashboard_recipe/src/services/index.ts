/**
 * Services Index
 * ==============
 * Centralized export of all API services
 */

// Recipe recommendation services
export * from './recipeApi';

// Cooking steps services
export * from './cookingStepsApi';

// Top recipes services
export * from './topRecipesApi';

// Re-export commonly used functions with shorter names
export { recipeApi } from './recipeApi';
export { cookingStepsApi } from './cookingStepsApi';
export {
  fetchTopRecipes,
  fetchRecipeById,
  fetchAvailableFilters,
} from './topRecipesApi';
