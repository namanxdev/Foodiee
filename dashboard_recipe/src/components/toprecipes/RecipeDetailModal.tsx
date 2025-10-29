/**
 * RecipeDetailModal Component
 * ============================
 * Full-screen modal showing complete recipe details with ingredients and steps
 */

import { useEffect, useState } from 'react';
import { FaTimes, FaClock, FaFire, FaUsers, FaStar, FaCheckCircle } from 'react-icons/fa';
import { TopRecipe, fetchRecipeById, formatTime, getDifficultyColor } from '@/services/topRecipesApi';

interface RecipeDetailModalProps {
  recipeId: number | null;
  onClose: () => void;
}

export default function RecipeDetailModal({ recipeId, onClose }: RecipeDetailModalProps) {
  const [recipe, setRecipe] = useState<TopRecipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (recipeId) {
      setLoading(true);
      setError(null);
      fetchRecipeById(recipeId)
        .then((data) => {
          setRecipe(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [recipeId]);

  const toggleStepCompletion = (stepIndex: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepIndex)
        ? prev.filter((i) => i !== stepIndex)
        : [...prev, stepIndex]
    );
  };

  if (!recipeId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative">
          {recipe?.image_url && (
            <div className="h-64 overflow-hidden">
              <img
                src={recipe.image_url}
                alt={recipe.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FaTimes className="text-gray-700 dark:text-gray-300" />
          </button>

          {/* Recipe Title Overlay */}
          {recipe && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
              <h2 className="text-3xl font-bold text-white mb-2">{recipe.name}</h2>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getDifficultyColor(recipe.difficulty)}`}>
                  {recipe.difficulty}
                </span>
                <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-bold">
                  {recipe.region}
                </span>
                {recipe.rating > 0 && (
                  <span className="px-3 py-1 bg-white text-gray-800 rounded-full text-sm font-bold flex items-center gap-1">
                    <FaStar className="text-yellow-500" />
                    {recipe.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <span className="loading loading-spinner loading-lg text-orange-500"></span>
            </div>
          )}

          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg">
              Error: {error}
            </div>
          )}

          {recipe && (
            <>
              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 mb-6">{recipe.description}</p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
                  <FaClock className="text-orange-500 text-2xl mx-auto mb-2" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Time</div>
                  <div className="text-lg font-bold text-gray-800 dark:text-white">
                    {formatTime(recipe.total_time_minutes)}
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                  <FaUsers className="text-blue-500 text-2xl mx-auto mb-2" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">Servings</div>
                  <div className="text-lg font-bold text-gray-800 dark:text-white">{recipe.servings}</div>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                  <FaFire className="text-red-500 text-2xl mx-auto mb-2" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">Calories</div>
                  <div className="text-lg font-bold text-gray-800 dark:text-white">{recipe.calories}</div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Prep + Cook</div>
                  <div className="text-lg font-bold text-gray-800 dark:text-white">
                    {formatTime(recipe.prep_time_minutes)} + {formatTime(recipe.cook_time_minutes)}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {recipe.meal_types.map((type) => (
                    <span
                      key={type}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                    >
                      {type}
                    </span>
                  ))}
                  {recipe.dietary_tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('ingredients')}
                  className={`pb-3 px-4 font-medium transition-colors ${
                    activeTab === 'ingredients'
                      ? 'text-orange-500 border-b-2 border-orange-500'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  Ingredients ({recipe.ingredients.length})
                </button>
                <button
                  onClick={() => setActiveTab('steps')}
                  className={`pb-3 px-4 font-medium transition-colors ${
                    activeTab === 'steps'
                      ? 'text-orange-500 border-b-2 border-orange-500'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  Steps ({recipe.steps.length})
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'ingredients' ? (
                <div className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-800 dark:text-white">
                          {ingredient.name}
                        </span>
                        {' - '}
                        <span className="text-gray-600 dark:text-gray-400">
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                        {ingredient.preparation && (
                          <span className="text-gray-500 dark:text-gray-500 italic">
                            {' '}({ingredient.preparation})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recipe.steps.map((step, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        completedSteps.includes(index)
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleStepCompletion(index)}
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            completedSteps.includes(index)
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {completedSteps.includes(index) ? (
                            <FaCheckCircle />
                          ) : (
                            <span className="text-sm font-bold">{index + 1}</span>
                          )}
                        </button>
                        
                        <div className="flex-1">
                          <p className={`text-gray-800 dark:text-white ${
                            completedSteps.includes(index) ? 'line-through' : ''
                          }`}>
                            {step}
                          </p>
                          
                          {recipe.step_image_urls[index] && (
                            <img
                              src={recipe.step_image_urls[index]}
                              alt={`Step ${index + 1}`}
                              className="mt-3 rounded-lg max-w-sm"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {completedSteps.length === recipe.steps.length && recipe.steps.length > 0 && (
                    <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-4 rounded-lg text-center font-bold">
                      🎉 Congratulations! You've completed all steps!
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
