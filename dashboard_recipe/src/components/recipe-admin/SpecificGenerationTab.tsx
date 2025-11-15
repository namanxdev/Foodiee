/**
 * Specific Generation Tab - Create New Recipes
 * Wizard interface: Select region → Search → Confirm uniqueness → Generate → Preview → Save
 */

'use client';

import { useState } from 'react';
import { searchRecipes } from '@/services/recipeAdminAPI';
import type { Recipe, Ingredient, StepImage } from '@/types/recipeAdmin';
import { API_CONFIG } from '@/constants';

// Types for generation process
interface GenerationLog {
  message: string;
  level: string;
  timestamp: string;
}

interface GeneratedRecipe {
  name: string;
  description: string;
  region: string;
  ingredients: Ingredient[];
  steps_beginner: string[];
  steps_advanced: string[];
  ingredients_image: string | null;
  steps_beginner_images: StepImage[];
  steps_advanced_images: StepImage[];
  image_url: string | null;
}

// Region/Cuisine options (matches main app's cuisine preferences)
const REGIONS = [
  'Indian',
  'Chinese',
  'Italian',
  'Mexican',
  'Japanese',
  'Mediterranean',
  'Thai',
  'Korean'
];

export function SpecificGenerationTab() {
  // Wizard steps
  const [currentStep, setCurrentStep] = useState<'region' | 'search' | 'confirm' | 'generate' | 'preview'>('region');
  
  // Form data
  const [selectedRegion, setSelectedRegion] = useState('');
  const [dishName, setDishName] = useState('');
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Generation data
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationLog[]>([]);
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Image generation options (all selected by default)
  const [generateMainImage, setGenerateMainImage] = useState(true);
  const [generateIngredientsImage, setGenerateIngredientsImage] = useState(true);
  const [generateStepImages, setGenerateStepImages] = useState(true);

  // Handle fuzzy search
  const handleSearch = async () => {
    if (!dishName.trim()) return;
    
    try {
      setIsSearching(true);
      const response = await searchRecipes(dishName);
      
      // Filter by selected region for more relevant results
      const filteredResults = response.recipes.filter(
        r => !selectedRegion || r.region?.toLowerCase() === selectedRegion.toLowerCase()
      );
      
      setSearchResults(filteredResults);
      setCurrentStep('confirm');
    } catch (error) {
      console.error('Search failed:', error);
      alert(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Confirm dish is not in results
  const handleConfirmNew = () => {
    setCurrentStep('generate');
    startGeneration();
  };

  // Start generation process with progress tracking
  const startGeneration = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationProgress([]);

    try {
      // Start generation job
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/generate/create-new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Email': localStorage.getItem('adminEmail') || '',
        },
        body: JSON.stringify({
          dish_name: dishName,
          region: selectedRegion,
          generate_main_image: generateMainImage,
          generate_ingredients_image: generateIngredientsImage,
          generate_step_images: generateStepImages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start generation: ${response.statusText}`);
      }

      const result = await response.json();
      const jobId = result.job_id;

      if (!jobId) {
        throw new Error('No job ID returned from server');
      }

      setGenerationProgress([{ message: '🚀 Generation job started...', level: 'INFO', timestamp: new Date().toISOString() }]);

      // Poll for progress
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${API_CONFIG.BASE_URL}/api/admin/jobs/${jobId}`, {
            headers: {
              'X-Admin-Email': localStorage.getItem('adminEmail') || '',
            },
          });

          if (!statusResponse.ok) {
            throw new Error('Failed to fetch job status');
          }

          const statusData = await statusResponse.json();
          const job = statusData.job;

          // Update progress with logs
          if (job.logs && Array.isArray(job.logs)) {
            // Reverse logs to show newest first, then reverse back for chronological order
            const logs = [...job.logs].reverse();
            setGenerationProgress(logs.map((log: { message: string; log_level?: string; created_at: string }) => ({
              message: log.message,
              level: log.log_level || 'INFO',
              timestamp: log.created_at
            })));
          }

          // Check if job is complete
          if (job.status === 'completed') {
            clearInterval(pollInterval);
              setIsGenerating(false);

            // Extract recipe ID from logs - find the REAL ID (not -1 or null)
            let recipeId = null;
            
            if (job.logs && Array.isArray(job.logs)) {
              console.log('All logs:', job.logs); // Debug log
              
              // Search in REVERSE order (newest first) for valid recipe_id
              // Ignore -1 (placeholder during generation) and null
              for (let i = job.logs.length - 1; i >= 0; i--) {
                const log = job.logs[i];
                
                // Check recipe_id field (must be > 0)
                if (log.recipe_id && log.recipe_id > 0) {
                  recipeId = log.recipe_id;
                  console.log('Found valid recipe_id in log:', recipeId, 'at index', i);
                  break;
                }
                
                // Check details.recipe_id (must be > 0)
                if (!recipeId && log.details && log.details.recipe_id && log.details.recipe_id > 0) {
                  recipeId = log.details.recipe_id;
                  console.log('Found valid recipe_id in log.details:', recipeId, 'at index', i);
                  break;
                }
              }
              
              // Fallback: Parse from message if still not found
              if (!recipeId) {
                for (let i = job.logs.length - 1; i >= 0; i--) {
                  const log = job.logs[i];
                  const match = log.message?.match(/ID:\s*(\d+)/);
                  if (match && match[1]) {
                    const parsedId = parseInt(match[1]);
                    if (parsedId > 0) {
                      recipeId = parsedId;
                      console.log('Found recipe_id in message:', recipeId, 'at index', i);
                      break;
                    }
                  }
                }
              }
            }

            if (recipeId && recipeId > 0) {
              setGenerationProgress(prev => [...prev, { 
                message: `✅ Fetching generated recipe (ID: ${recipeId})...`, 
                level: 'SUCCESS', 
                timestamp: new Date().toISOString() 
              }]);

              // Fetch the created recipe
              try {
                const recipeResponse = await fetch(
                  `${API_CONFIG.BASE_URL}/api/admin/recipes/${recipeId}`,
                  {
                    headers: {
                      'X-Admin-Email': localStorage.getItem('adminEmail') || '',
                    },
                  }
                );

                if (recipeResponse.ok) {
                  const recipeData = await recipeResponse.json();
                  setGeneratedRecipe(recipeData.recipe);
                  setCurrentStep('preview');
                } else {
                  const errorText = await recipeResponse.text();
                  console.error('Failed to fetch recipe:', errorText);
                  setGenerationError(`Failed to fetch recipe ${recipeId}: ${recipeResponse.statusText}`);
                }
              } catch (fetchError) {
                console.error('Error fetching recipe:', fetchError);
                setGenerationError(`Error fetching recipe: ${fetchError}`);
              }
            } else {
              console.error('Recipe ID not found in logs:', job.logs);
              setGenerationError('Recipe created but ID not found in logs. Check console for details.');
            }
          } else if (job.status === 'failed') {
            clearInterval(pollInterval);
            setIsGenerating(false);
            setGenerationError(job.error_message || 'Generation failed');
          }
        } catch (pollError) {
          console.error('Polling error:', pollError);
        }
      }, 2000); // Poll every 2 seconds

      // Cleanup interval after 10 minutes (safety timeout)
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isGenerating) {
          setIsGenerating(false);
          setGenerationError('Generation timeout - please check job status manually');
        }
      }, 600000);

    } catch (error) {
      console.error('Generation error:', error);
      setGenerationError(error instanceof Error ? error.message : 'Generation failed');
      setIsGenerating(false);
    }
  };

  // Recipe is already saved by the backend worker, just reset the wizard
  const handleConfirmRecipe = () => {
    alert('✅ Recipe created successfully! You can now view it in the Data Manager.');
    resetWizard();
  };

  // Reset wizard to start
  const resetWizard = () => {
    setCurrentStep('region');
    setSelectedRegion('');
    setDishName('');
    setSearchResults([]);
    setGeneratedRecipe(null);
    setGenerationProgress([]);
    setGenerationError(null);
    // Reset image options to default (all selected)
    setGenerateMainImage(true);
    setGenerateIngredientsImage(true);
    setGenerateStepImages(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with progress indicator */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🎯 Create New Recipe</h2>
        
        {/* Step indicator */}
        <div className="flex items-center justify-between">
          {[
            { key: 'region', label: '1. Region', icon: '🌍' },
            { key: 'search', label: '2. Search', icon: '🔍' },
            { key: 'confirm', label: '3. Confirm', icon: '✓' },
            { key: 'generate', label: '4. Generate', icon: '⚡' },
            { key: 'preview', label: '5. Preview', icon: '👁️' },
          ].map((step, idx, arr) => (
            <div key={step.key} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 ${
                currentStep === step.key ? 'text-blue-400' :
                arr.findIndex(s => s.key === currentStep) > idx ? 'text-green-400' :
                'text-gray-500'
              }`}>
                <span className="text-2xl">{step.icon}</span>
                <span className="text-sm font-semibold hidden md:inline">{step.label}</span>
              </div>
              {idx < arr.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded ${
                  arr.findIndex(s => s.key === currentStep) > idx ? 'bg-green-400' : 'bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Select Region */}
      {currentStep === 'region' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Select Cuisine/Region</h3>
          <p className="text-gray-400 mb-4">Choose the cuisine type for your new recipe</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {REGIONS.map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`p-4 rounded-lg font-semibold transition-all ${
                  selectedRegion === region
                    ? 'bg-blue-600 ring-2 ring-blue-400'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {region}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentStep('search')}
            disabled={!selectedRegion}
            className="mt-6 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed font-semibold w-full"
          >
            Next: Enter Dish Name →
              </button>
            </div>
      )}

      {/* Step 2: Search for existing recipes */}
      {currentStep === 'search' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <button
            onClick={() => setCurrentStep('region')}
            className="mb-4 text-blue-400 hover:text-blue-300"
          >
            ← Back to Region Selection
          </button>
          
          <h3 className="text-xl font-bold mb-2">Enter Dish Name</h3>
          <p className="text-gray-400 mb-4">
            Selected Region: <span className="text-blue-400 font-semibold">{selectedRegion}</span>
          </p>

          <div className="flex gap-3">
            <input
              type="text"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g., Paneer Tikka Masala"
              className="flex-1 px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500 outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !dishName.trim()}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed font-semibold"
            >
              {isSearching ? '⏳ Searching...' : '🔍 Search'}
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-400">
            We&apos;ll search our database to make sure this dish doesn&apos;t already exist
          </div>
        </div>
      )}

      {/* Step 3: Confirm dish is new */}
      {currentStep === 'confirm' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <button
            onClick={() => setCurrentStep('search')}
            className="mb-4 text-blue-400 hover:text-blue-300"
          >
            ← Back to Search
          </button>

          <h3 className="text-xl font-bold mb-4">
            {searchResults.length > 0 ? 'Found Similar Recipes' : 'No Matches Found'}
          </h3>

          {searchResults.length > 0 ? (
            <>
              <p className="text-gray-400 mb-4">
                We found {searchResults.length} similar recipe(s). Is your dish one of these?
              </p>
              
              <div className="max-h-96 overflow-y-auto space-y-2 mb-6">
                {searchResults.map((recipe) => (
                  <div key={recipe.id} className="bg-gray-700 p-4 rounded-lg">
                    <div className="font-semibold text-lg">{recipe.name}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {recipe.region} • {recipe.difficulty || 'N/A'}
                    </div>
                    {recipe.description && (
                      <div className="text-sm text-gray-300 mt-2">{recipe.description}</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-yellow-900/30 border border-yellow-700 rounded p-4 mb-4">
                <p className="text-yellow-200 font-semibold">⚠️ Duplicate Check</p>
                <p className="text-yellow-200 text-sm mt-1">
                  If your dish matches one of the above, please use the Data Manager to edit it instead.
                </p>
              </div>
            </>
          ) : (
            <div className="bg-green-900/30 border border-green-700 rounded p-4 mb-6">
              <p className="text-green-200 font-semibold">✅ No Duplicates Found</p>
              <p className="text-green-200 text-sm mt-1">
                Great! We can proceed with generating a new recipe for <strong>&quot;{dishName}&quot;</strong>
              </p>
            </div>
          )}

          {/* Image Generation Options */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <span>📸</span>
              <span>Image Generation Options</span>
              <span className="text-xs text-gray-400 font-normal">(Optional - All selected by default)</span>
            </h4>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={generateMainImage}
                  onChange={(e) => setGenerateMainImage(e.target.checked)}
                  className="w-5 h-5 rounded cursor-pointer"
                />
                <div className="flex-1">
                  <div className="font-medium group-hover:text-blue-400">Main Cover Image</div>
                  <div className="text-xs text-gray-400">Generate the main recipe cover image</div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={generateIngredientsImage}
                  onChange={(e) => setGenerateIngredientsImage(e.target.checked)}
                  className="w-5 h-5 rounded cursor-pointer"
                />
                <div className="flex-1">
                  <div className="font-medium group-hover:text-blue-400">Ingredients Image</div>
                  <div className="text-xs text-gray-400">Generate image showing all ingredients</div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={generateStepImages}
                  onChange={(e) => setGenerateStepImages(e.target.checked)}
                  className="w-5 h-5 rounded cursor-pointer"
                />
                <div className="flex-1">
                  <div className="font-medium group-hover:text-blue-400">Step Images</div>
                  <div className="text-xs text-gray-400">Generate images for beginner and advanced steps</div>
                </div>
              </label>
            </div>
            <div className="mt-3 text-xs text-gray-400 bg-gray-800 p-2 rounded">
              ℹ️ Note: Unchecking images will speed up generation but the recipe will need images added later
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep('search')}
              className="flex-1 px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 font-semibold"
            >
              ← Search Again
            </button>
            <button
              onClick={handleConfirmNew}
              className="flex-1 px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 font-semibold"
            >
              {searchResults.length > 0 ? 'Not in List - Create New →' : 'Create New Recipe →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Generation in progress */}
      {currentStep === 'generate' && (
          <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">
            {isGenerating ? '⚡ Generating Recipe...' : generationError ? '❌ Generation Failed' : '✅ Generation Complete'}
          </h3>

          {generationError ? (
            <div className="bg-red-900/30 border border-red-700 rounded p-4 mb-4">
              <p className="text-red-200 font-semibold">Error</p>
              <p className="text-red-200 text-sm mt-1">{generationError}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Live progress logs from backend */}
              <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="space-y-2 font-mono text-sm">
                  {generationProgress.length === 0 ? (
                    <div className="text-gray-400 flex items-center gap-2">
                      <span className="animate-pulse">⏳</span>
                      <span>Initializing generation...</span>
                    </div>
                  ) : (
                    generationProgress.map((log, idx) => {
                      // Determine icon and color based on log level
                      const getLogStyle = (level: string) => {
                        switch (level.toUpperCase()) {
                          case 'SUCCESS':
                            return { icon: '✅', color: 'text-green-400' };
                          case 'ERROR':
                            return { icon: '❌', color: 'text-red-400' };
                          case 'WARNING':
                            return { icon: '⚠️', color: 'text-yellow-400' };
                          case 'INFO':
                          default:
                            return { icon: 'ℹ️', color: 'text-blue-400' };
                        }
                      };

                      const style = getLogStyle(log.level);

                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 ${style.color} py-1`}
                        >
                          <span className="flex-shrink-0 mt-0.5">{style.icon}</span>
                          <span className="flex-1">{log.message}</span>
                        </div>
                      );
                    })
                  )}
                  
                  {/* Show spinner if still generating */}
                  {isGenerating && generationProgress.length > 0 && (
                    <div className="text-gray-400 flex items-center gap-2 animate-pulse mt-4">
                      <span>⏳</span>
                      <span>Processing...</span>
          </div>
        )}
      </div>
              </div>
              
              {/* Summary at bottom */}
              {generationProgress.length > 0 && (
                <div className="text-xs text-gray-400 text-center">
                  {generationProgress.length} log entries • Last updated: {new Date().toLocaleTimeString()}
                </div>
              )}
            </div>
          )}

          {generationError && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={resetWizard}
                className="flex-1 px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 font-semibold"
              >
                ← Start Over
              </button>
              <button
                onClick={startGeneration}
                className="flex-1 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold"
              >
                🔄 Retry Generation
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 5: Preview generated recipe */}
      {currentStep === 'preview' && generatedRecipe && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">✅ Recipe Generated Successfully!</h3>
            <p className="text-gray-400">Review the generated content below and save to database</p>
          </div>

          {/* Recipe preview */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="text-lg font-bold mb-2">{generatedRecipe.name}</h4>
            <div className="text-sm text-gray-400 mb-4">{generatedRecipe.region}</div>
            
            {generatedRecipe.description && (
              <p className="text-gray-300 mb-4">{generatedRecipe.description}</p>
            )}

            {/* Main Image */}
            {generatedRecipe.image_url && (
              <div className="mb-4">
                <div className="font-semibold mb-2">Main Image:</div>
                <img 
                  src={generatedRecipe.image_url} 
                  alt={generatedRecipe.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Ingredients */}
            <div className="mb-4">
              <div className="font-semibold mb-2">Ingredients ({generatedRecipe.ingredients.length}):</div>
              <div className="bg-gray-700 p-3 rounded space-y-1">
                {generatedRecipe.ingredients.slice(0, 5).map((ing, idx) => (
                  <div key={idx} className="text-sm">
                    • {ing.name || ing.ingredient} - {ing.quantity}
                  </div>
                ))}
                {generatedRecipe.ingredients.length > 5 && (
                  <div className="text-sm text-gray-400">
                    ... and {generatedRecipe.ingredients.length - 5} more
                  </div>
                )}
              </div>
            </div>

            {/* Ingredients Image */}
            {generatedRecipe.ingredients_image && (
              <div className="mb-4">
                <div className="font-semibold mb-2">Ingredients Image:</div>
                <img 
                  src={generatedRecipe.ingredients_image} 
                  alt="Ingredients"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Beginner Steps */}
            {generatedRecipe.steps_beginner && generatedRecipe.steps_beginner.length > 0 && (
              <div className="mb-4">
                <div className="font-semibold mb-2 text-green-400">
                  Beginner Steps ({generatedRecipe.steps_beginner.length}) + {generatedRecipe.steps_beginner_images?.length || 0} images:
                </div>
                <div className="bg-gray-700 p-3 rounded space-y-1 max-h-48 overflow-y-auto">
                  {generatedRecipe.steps_beginner.slice(0, 3).map((step, idx) => (
                    <div key={idx} className="text-sm flex gap-2">
                      <span className="text-green-400 font-bold">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                  {generatedRecipe.steps_beginner.length > 3 && (
                    <div className="text-sm text-gray-400">
                      ... and {generatedRecipe.steps_beginner.length - 3} more steps
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Advanced Steps */}
            {generatedRecipe.steps_advanced && generatedRecipe.steps_advanced.length > 0 && (
              <div className="mb-4">
                <div className="font-semibold mb-2 text-orange-400">
                  Advanced Steps ({generatedRecipe.steps_advanced.length}) + {generatedRecipe.steps_advanced_images?.length || 0} images:
                </div>
                <div className="bg-gray-700 p-3 rounded space-y-1 max-h-48 overflow-y-auto">
                  {generatedRecipe.steps_advanced.slice(0, 3).map((step, idx) => (
                    <div key={idx} className="text-sm flex gap-2">
                      <span className="text-orange-400 font-bold">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                  {generatedRecipe.steps_advanced.length > 3 && (
                    <div className="text-sm text-gray-400">
                      ... and {generatedRecipe.steps_advanced.length - 3} more steps
                    </div>
                  )}
                </div>
              </div>
        )}
      </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={resetWizard}
              className="flex-1 px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 font-semibold"
            >
              ✕ Discard & Start Over
            </button>
            <button
              onClick={handleConfirmRecipe}
              className="flex-1 px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 font-semibold"
            >
              ✓ Confirm & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
