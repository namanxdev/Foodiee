/**
 * RecipeDetailModal Component
 * ============================
 * Full-screen modal showing complete recipe details with ingredients and steps
 */

import { useEffect, useState } from 'react';
import { X, Clock, Flame, Star, CheckCircle2 } from 'lucide-react';
import { TopRecipe, fetchRecipeById, formatTime } from '@/services/topRecipesApi';
import { Badge } from '@/components/ui/badge';

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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="relative rounded-3xl border border-white/20 bg-white/[0.08] backdrop-blur-2xl shadow-2xl shadow-black/60 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative">
          {recipe?.image_url && (
            <div className="h-64 overflow-hidden bg-white/5">
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
            className="absolute top-4 right-4 rounded-full border border-white/20 bg-white/[0.15] backdrop-blur-md p-3 shadow-lg shadow-black/20 text-white hover:bg-white/[0.25] transition-all"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>

          {/* Recipe Title Overlay */}
          {recipe && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6">
              <h2 className="text-3xl font-semibold text-white mb-3">{recipe.name}</h2>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" size="sm" className="text-xs border-white/20 bg-white/10 text-white/80 font-mono">
                  ID: #{recipe.id}
                </Badge>
                <Badge 
                  variant="glow"
                  className={`rounded-full text-xs font-semibold border ${
                    recipe.difficulty === 'Easy' 
                      ? 'border-green-400/40 bg-green-500/20 text-green-200 shadow-green-500/20' 
                      : recipe.difficulty === 'Medium' 
                      ? 'border-yellow-400/40 bg-yellow-500/20 text-yellow-200 shadow-yellow-500/20'
                      : 'border-red-400/40 bg-red-500/20 text-red-200 shadow-red-500/20'
                  }`}
                >
                  {recipe.difficulty}
                </Badge>
                <Badge variant="glow" className="rounded-full text-xs border-orange-400/40 bg-orange-500/20 text-orange-200 shadow-orange-500/20">
                  {recipe.region}
                </Badge>
                {recipe.rating > 0 && (
                  <Badge variant="glow" className="rounded-full text-xs border-[#FFD07F]/40 bg-[#FFD07F]/20 text-[#FFD07F] shadow-[#FFD07F]/20 flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-[#FFD07F] text-[#FFD07F]" />
                    {recipe.rating.toFixed(1)}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[rgba(5,5,5,0.7)]">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFD07F]"></div>
            </div>
          )}

          {error && (
            <div className="rounded-3xl border border-red-400/40 bg-red-500/10 backdrop-blur-xl px-6 py-8 text-center shadow-lg shadow-red-500/20">
              <h3 className="text-xl font-semibold text-red-200">Error loading recipe</h3>
              <p className="mt-2 text-base text-red-200/80">{error}</p>
            </div>
          )}

          {recipe && (
            <>
              {/* Description */}
              <p className="text-white/80 mb-6 leading-relaxed">{recipe.description}</p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/[0.08] backdrop-blur-2xl p-5 text-center shadow-lg shadow-black/20">
                  <Clock className="h-6 w-6 text-[#FFD07F] mx-auto mb-2" strokeWidth={1.5} />
                  <div className="text-xs text-white/60 mb-1">Total Time</div>
                  <div className="text-lg font-bold text-white">
                    {formatTime(recipe.total_time_minutes)}
                  </div>
                </div>
                
                <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/[0.08] backdrop-blur-2xl p-5 text-center shadow-lg shadow-black/20">
                  <Flame className="h-6 w-6 text-[#FF5A2F] mx-auto mb-2" strokeWidth={1.5} />
                  <div className="text-xs text-white/60 mb-1">Calories</div>
                  <div className="text-lg font-bold text-white">{recipe.calories}</div>
                </div>
                
                <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/[0.08] backdrop-blur-2xl p-5 text-center shadow-lg shadow-black/20">
                  <Clock className="h-6 w-6 text-emerald-400 mx-auto mb-2" strokeWidth={1.5} />
                  <div className="text-xs text-white/60 mb-1">Prep + Cook</div>
                  <div className="text-lg font-bold text-white">
                    {formatTime(recipe.prep_time_minutes)} + {formatTime(recipe.cook_time_minutes)}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {recipe.meal_types.map((type) => (
                    <Badge
                      key={type}
                      variant="outline"
                      size="sm"
                      className="text-xs border-blue-400/40 bg-blue-500/10 text-blue-200"
                    >
                      {type}
                    </Badge>
                  ))}
                  {recipe.dietary_tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      size="sm"
                      className="text-xs border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 mb-6 border-b border-white/10">
                <button
                  onClick={() => setActiveTab('ingredients')}
                  className={`pb-3 px-4 font-medium transition-colors relative ${
                    activeTab === 'ingredients'
                      ? 'text-[#FFD07F]'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  Ingredients ({recipe.ingredients.length})
                  {activeTab === 'ingredients' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F]"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('steps')}
                  className={`pb-3 px-4 font-medium transition-colors relative ${
                    activeTab === 'steps'
                      ? 'text-[#FFD07F]'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  Steps ({recipe.steps.length})
                  {activeTab === 'steps' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F]"></span>
                  )}
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'ingredients' ? (
                <div className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl hover:bg-white/[0.08] transition-all"
                    >
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#FF5A2F] to-[#FFD07F]"></div>
                      <div className="flex-1">
                        <span className="font-medium text-white">
                          {ingredient.name}
                        </span>
                        {' - '}
                        <span className="text-white/70">
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                        {ingredient.preparation && (
                          <span className="text-white/50 italic">
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
                      className={`p-5 rounded-2xl border-2 transition-all ${
                        completedSteps.includes(index)
                          ? 'border-emerald-400/60 bg-emerald-500/10 backdrop-blur-xl'
                          : 'border-white/10 bg-white/[0.05] backdrop-blur-xl hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleStepCompletion(index)}
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            completedSteps.includes(index)
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                              : 'border-2 border-white/20 bg-white/[0.08] text-white/70 hover:bg-white/[0.15]'
                          }`}
                        >
                          {completedSteps.includes(index) ? (
                            <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
                          ) : (
                            <span className="text-sm font-bold">{index + 1}</span>
                          )}
                        </button>
                        
                        <div className="flex-1">
                          <p className={`text-white leading-relaxed ${
                            completedSteps.includes(index) ? 'line-through text-white/50' : ''
                          }`}>
                            {step}
                          </p>
                          
                          {recipe.step_image_urls[index] && (
                            <img
                              src={recipe.step_image_urls[index]}
                              alt={`Step ${index + 1}`}
                              className="mt-4 rounded-2xl max-w-md border border-white/10 shadow-lg"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {completedSteps.length === recipe.steps.length && recipe.steps.length > 0 && (
                    <div className="rounded-3xl border border-emerald-400/40 bg-emerald-500/10 backdrop-blur-xl p-6 text-center font-bold text-emerald-200 shadow-lg shadow-emerald-500/20">
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
