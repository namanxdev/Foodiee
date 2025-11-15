/**
 * Step-by-Step Recipe Guide Page
 * ================================
 * Interactive step-by-step cooking guide with beginner/advanced modes
 */

"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ChefHat, Home, AlertCircle, X, ZoomIn } from "lucide-react";
import { TopRecipe, fetchRecipeById, StepImage } from "@/services/topRecipesApi";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface StepGuidePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function StepGuidePage({ params }: StepGuidePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);
  const recipeId = parseInt(id);
  
  const [recipe, setRecipe] = useState<TopRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Get URL params with defaults
  const level = (searchParams.get("level") as "beginner" | "advanced") || "beginner";
  const currentStepNum = parseInt(searchParams.get("step") || "0");

  useEffect(() => {
    if (!recipeId || isNaN(recipeId)) {
      setError("Invalid recipe ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchRecipeById(recipeId)
      .then((data) => {
        console.log("Recipe data loaded:", data);
        console.log("Ingredients image URL:", data.ingredients_image);
        setRecipe(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [recipeId]);

  // Get the appropriate steps and images based on level
  const getStepsData = () => {
    if (!recipe) return { steps: [], images: [] };
    
    if (level === "beginner") {
      return {
        steps: recipe.steps_beginner || [],
        images: recipe.steps_beginner_images || [],
      };
    } else {
      return {
        steps: recipe.steps_advanced || [],
        images: recipe.steps_advanced_images || [],
      };
    }
  };

  const { steps, images } = getStepsData();
  const totalSteps = steps.length;
  // Step 0 = ingredients, Step 1-N = cooking steps
  const currentStep = Math.max(0, Math.min(currentStepNum, totalSteps));

  // Find the image for the current step
  const getCurrentStepImage = (): string | null => {
    if (!images || images.length === 0) return null;
    
    // Find image matching current step index (0-based)
    const stepImage = images.find((img: StepImage) => img.step_index === currentStep - 1);
    return stepImage?.url || null;
  };

  const currentStepImage = getCurrentStepImage();
  const currentStepText = currentStep > 0 ? steps[currentStep - 1] : "";

  // Navigation functions
  const navigateToStep = (stepNum: number) => {
    if (stepNum < 0 || stepNum > totalSteps) return;
    router.push(`/top-recipes/guide/${recipeId}?level=${level}&step=${stepNum}`);
  };

  const goToNextStep = () => navigateToStep(currentStep + 1);
  const goToPrevStep = () => navigateToStep(currentStep - 1);

  // Image preview handlers
  const openImagePreview = (imageUrl: string) => {
    setImagePreview(imageUrl);
  };

  const closeImagePreview = () => {
    setImagePreview(null);
  };

  // Close preview on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && imagePreview) {
        closeImagePreview();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [imagePreview]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] via-[#2A2A2A] to-[#1E1E1E] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#FFD07F] mx-auto mb-4"></div>
          <p className="text-white/60 text-lg">Loading recipe guide...</p>
        </div>
      </div>
    );
  }

  // Error state - No recipe data
  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] via-[#2A2A2A] to-[#1E1E1E] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="rounded-3xl border border-red-400/40 bg-red-500/10 backdrop-blur-xl p-10 text-center shadow-2xl shadow-red-500/20">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-red-200 mb-3">
              Oops! Something went wrong
            </h2>
            <p className="text-red-200/80 text-lg mb-6">
              {error || "Unable to load recipe"}
            </p>
            <Link
              href="/top-recipes"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F] text-[#1E1E1E] font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Home className="h-5 w-5" />
              Back to Recipes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error state - No steps available for selected level
  if (totalSteps === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] via-[#2A2A2A] to-[#1E1E1E] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="rounded-3xl border border-orange-400/40 bg-orange-500/10 backdrop-blur-xl p-10 text-center shadow-2xl shadow-orange-500/20">
            <ChefHat className="h-16 w-16 text-orange-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-orange-200 mb-3">
              {level === "beginner" ? "Beginner" : "Advanced"} Guide Not Available
            </h2>
            <p className="text-orange-200/80 text-lg mb-3">
              Sorry! This recipe doesn&apos;t have {level === "beginner" ? "beginner" : "advanced"}{" "}
              step-by-step instructions yet.
            </p>
            <p className="text-orange-200/60 mb-6">
              The detailed {level === "beginner" ? "beginner-friendly" : "advanced"} guide is
              still being prepared. Please check back later or try the{" "}
              {level === "beginner" ? "advanced" : "beginner"} mode.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/top-recipes/guide/${recipeId}?level=${
                  level === "beginner" ? "advanced" : "beginner"
                }&step=1`}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-orange-400/40 bg-orange-500/20 text-orange-200 font-semibold hover:bg-orange-500/30 transition-all"
              >
                Try {level === "beginner" ? "Advanced" : "Beginner"} Mode
              </Link>
              <Link
                href="/top-recipes"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F] text-[#1E1E1E] font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Home className="h-5 w-5" />
                Back to Recipes
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] via-[#2A2A2A] to-[#1E1E1E] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/top-recipes"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors mb-4 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Recipes
          </Link>
          
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {recipe.name}
              </h1>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge
                  variant="glow"
                  className={`rounded-full text-xs font-semibold ${
                    level === "beginner"
                      ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
                      : "border-orange-400/40 bg-orange-500/20 text-orange-200"
                  }`}
                >
                  {level === "beginner" ? "Beginner Mode" : "Advanced Mode"}
                </Badge>
                <Badge variant="outline" size="sm" className="text-xs border-white/20 bg-white/10 text-white/80">
                  {recipe.difficulty}
                </Badge>
                <Badge variant="outline" size="sm" className="text-xs border-white/20 bg-white/10 text-white/80">
                  {recipe.region}
                </Badge>
              </div>
            </div>
            
            {/* Step Counter */}
            <div className="text-right">
              <div className="text-sm text-white/60 mb-1">Progress</div>
              <div className="text-2xl font-bold text-[#FFD07F]">
                {currentStep === 0 ? "Ingredients" : `${currentStep} / ${totalSteps}`}
              </div>
              <div className="text-xs text-white/50">
                {currentStep === 0 
                  ? "Preparation" 
                  : `${Math.round((currentStep / totalSteps) * 100)}% Complete`
                }
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F] transition-all duration-300"
              style={{ width: `${currentStep === 0 ? 0 : (currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Content Card */}
        <div className="rounded-3xl border border-white/20 bg-white/[0.08] backdrop-blur-2xl shadow-2xl shadow-black/60 overflow-hidden mb-6">
          {currentStep === 0 ? (
            /* Ingredients View */
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F] flex items-center justify-center text-[#1E1E1E] shadow-lg">
                  <ChefHat className="h-6 w-6" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Ingredients You&apos;ll Need
                  </h2>
                  <p className="text-white/60 text-sm">
                    Make sure you have everything ready before starting
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ingredients List - Left Side */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-[#FFD07F] mb-4">
                    Ingredients ({recipe.ingredients.length})
                  </h3>
                  {recipe.ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl hover:bg-white/[0.08] transition-all"
                    >
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#FF5A2F] to-[#FFD07F] mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium text-white">
                          {ingredient.name}
                        </span>
                        {(ingredient.quantity || ingredient.unit) && (
                          <span className="text-white/70">
                            {' - '}
                            {ingredient.quantity} {ingredient.unit}
                          </span>
                        )}
                        {ingredient.preparation && (
                          <span className="text-white/50 italic block text-sm mt-1">
                            ({ingredient.preparation})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ingredients Image - Right Side */}
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold text-[#FFD07F] mb-4">
                    Visual Reference
                  </h3>
                  {recipe?.ingredients_image && recipe.ingredients_image.trim() !== "" ? (
                    <div 
                      className="rounded-2xl overflow-hidden border border-white/10 shadow-lg h-full relative group cursor-pointer transition-all hover:shadow-2xl hover:scale-[1.02]"
                      onClick={() => openImagePreview(recipe.ingredients_image!)}
                    >
                      <img
                        src={recipe.ingredients_image}
                        alt="All ingredients"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error("Failed to load ingredients image:", recipe.ingredients_image);
                          e.currentTarget.style.display = "none";
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.innerHTML = `
                              <div class="rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.03] p-8 flex flex-col items-center justify-center text-center h-full">
                                <p class="text-white/50 text-sm">Image failed to load</p>
                              </div>
                            `;
                          }
                        }}
                      />
                      {/* Zoom overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-sm rounded-full p-3">
                          <ZoomIn className="h-8 w-8 text-white" strokeWidth={2} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.03] p-8 flex flex-col items-center justify-center text-center h-full">
                      <ChefHat className="h-12 w-12 text-white/30 mb-3" strokeWidth={1.5} />
                      <p className="text-white/50 text-sm">
                        No ingredients image available
                      </p>
                      {/* Debug info - remove after testing */}
                      {process.env.NODE_ENV === 'development' && (
                        <p className="text-white/30 text-xs mt-2">
                          Debug: {recipe?.ingredients_image ? `URL: ${recipe.ingredients_image}` : "Field is empty/null"}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 p-4 rounded-2xl border border-blue-400/30 bg-blue-500/10 backdrop-blur-xl">
                <p className="text-blue-200/90 text-sm">
                  <strong>💡 Pro Tip:</strong> Prepare all ingredients before starting to cook. This is called &quot;mise en place&quot; and makes cooking much smoother!
                </p>
              </div>
            </div>
          ) : (
            /* Step Content */
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F] flex items-center justify-center text-[#1E1E1E] font-bold text-xl shadow-lg">
                  {currentStep}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {level === "beginner" ? "Beginner" : "Advanced"} Step {currentStep}
                  </h2>
                  <p className="text-white/60 text-sm">
                    {totalSteps - currentStep} {totalSteps - currentStep === 1 ? "step" : "steps"} remaining
                  </p>
                </div>
              </div>

              {/* Step Description */}
              <div className="mb-6">
                <p className="text-white/90 text-lg leading-relaxed whitespace-pre-line">
                  {currentStepText}
                </p>
              </div>

              {/* Step Image */}
              {currentStepImage && (
                <div 
                  className="rounded-2xl overflow-hidden border border-white/10 shadow-lg relative group cursor-pointer transition-all hover:shadow-2xl hover:scale-[1.01]"
                  onClick={() => openImagePreview(currentStepImage)}
                >
                  <img
                    src={currentStepImage}
                    alt={`Step ${currentStep}`}
                    className="w-full h-auto object-cover"
                  />
                  {/* Zoom overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-sm rounded-full p-3">
                      <ZoomIn className="h-8 w-8 text-white" strokeWidth={2} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button
            onClick={goToPrevStep}
            disabled={currentStep === 0}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold text-lg transition-all ${
              currentStep === 0
                ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/10"
                : "bg-white/10 text-white border border-white/20 hover:bg-white/15 hover:scale-[1.02] shadow-lg"
            }`}
          >
            <ArrowLeft className="h-5 w-5" />
            {currentStep === 1 ? "Back to Ingredients" : "Previous"}
          </button>

          <button
            onClick={goToNextStep}
            disabled={currentStep === totalSteps}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold text-lg transition-all ${
              currentStep === totalSteps
                ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/10"
                : "bg-gradient-to-r from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F] text-[#1E1E1E] hover:scale-[1.02] shadow-lg hover:shadow-xl shadow-orange-500/30"
            }`}
          >
            {currentStep === totalSteps ? "Completed" : currentStep === 0 ? "Start Cooking" : "Next"}
            {currentStep !== totalSteps && <ArrowRight className="h-5 w-5" />}
          </button>
        </div>

        {/* Completion Message */}
        {currentStep === totalSteps && (
          <div className="mt-6 rounded-3xl border border-emerald-400/40 bg-emerald-500/10 backdrop-blur-xl p-8 text-center shadow-lg shadow-emerald-500/20">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-2xl font-bold text-emerald-200 mb-2">
              Congratulations!
            </h3>
            <p className="text-emerald-200/80 mb-6">
              You&apos;ve completed all the steps for {recipe.name}!
            </p>
            <Link
              href="/top-recipes"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F] text-[#1E1E1E] font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Home className="h-5 w-5" />
              Back to Recipes
            </Link>
          </div>
        )}

        {/* Quick Navigation */}
        <div className="mt-6 p-6 rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl">
          <div className="text-sm text-white/60 mb-3 font-medium">Quick Navigation</div>
          <div className="flex flex-wrap gap-2">
            {/* Ingredients Button */}
            <button
              onClick={() => navigateToStep(0)}
              className={`px-4 h-10 rounded-lg font-semibold text-sm transition-all ${
                currentStep === 0
                  ? "bg-gradient-to-br from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F] text-[#1E1E1E] shadow-lg scale-110"
                  : currentStep > 0
                  ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 hover:bg-emerald-500/30"
                  : "bg-white/10 text-white/70 border border-white/20 hover:bg-white/15"
              }`}
            >
              🥘
            </button>
            
            {/* Step Buttons */}
            {steps.map((_, index) => {
              const stepNum = index + 1;
              const isCompleted = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;
              
              return (
                <button
                  key={stepNum}
                  onClick={() => navigateToStep(stepNum)}
                  className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all ${
                    isCurrent
                      ? "bg-gradient-to-br from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F] text-[#1E1E1E] shadow-lg scale-110"
                      : isCompleted
                      ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 hover:bg-emerald-500/30"
                      : "bg-white/10 text-white/70 border border-white/20 hover:bg-white/15"
                  }`}
                >
                  {stepNum}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full-Screen Image Preview Modal */}
      {imagePreview && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={closeImagePreview}
        >
          {/* Close Button */}
          <button
            onClick={closeImagePreview}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all z-10 hover:scale-110"
            aria-label="Close preview"
          >
            <X className="h-6 w-6" strokeWidth={2} />
          </button>

          {/* Image Container */}
          <div 
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imagePreview}
              alt="Full size preview"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Instructions */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white/60 text-sm">
            Press <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">ESC</kbd> or click outside to close
          </div>
        </div>
      )}
    </div>
  );
}

