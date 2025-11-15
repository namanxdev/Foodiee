/**
 * Services Index
 * ==============
 * Centralized export of all API services
 */

// Recipe recommendation services
export * from './recipeApi';

// Cooking steps services - exclude getRecipeDetails to avoid conflict with recipeApi
export {
  getNextStep,
  skipSteps,
  generateStepImage,
  generateStepImageGemini,
  generateStepImageSD,
  cookingStepsApi,
} from './cookingStepsApi';

// Top recipes services
export * from './topRecipesApi';

// Re-export commonly used functions with shorter names
export { recipeApi } from './recipeApi';
export {
  fetchTopRecipes,
  fetchRecipeById,
  fetchAvailableFilters,
} from './topRecipesApi';
