/**
 * Specific Generation Tab Component
 * Generate/fix a specific recipe by searching for it
 */

'use client';

import { useState } from 'react';
import { searchRecipes, startSpecificGeneration, getJobLogs } from '@/services/recipeAdminAPI';
import type { Recipe, RegenerationLog } from '@/types/recipeAdmin';

export function SpecificGenerationTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<RegenerationLog[]>([]);
  const [message, setMessage] = useState<{type: 'success' | 'error'; text: string} | null>(null);

  // Fixing options
  const [fixMainImage, setFixMainImage] = useState(false);
  const [fixIngredientsImage, setFixIngredientsImage] = useState(false);
  const [fixStepsImages, setFixStepsImages] = useState(false);
  const [fixStepsText, setFixStepsText] = useState(false);
  const [fixIngredientsText, setFixIngredientsText] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      const response = await searchRecipes(searchQuery);
      setSearchResults(response.recipes);
      if (response.recipes.length === 0) {
        setMessage({ type: 'error', text: 'No recipes found matching your search' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Search failed' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedRecipe) return;

    try {
      setIsGenerating(true);
      setLogs([]);
      setMessage(null);

      await startSpecificGeneration({
        recipe_name: selectedRecipe.name,
        fix_main_image: fixMainImage,
        fix_ingredients_image: fixIngredientsImage,
        fix_steps_images: fixStepsImages,
        fix_steps_text: fixStepsText,
        fix_ingredients_text: fixIngredientsText,
      });

      // Poll for logs
      const interval = setInterval(async () => {
        try {
          const jobs = await fetch('http://localhost:8000/api/recipe-admin/jobs?limit=1', {
            headers: { 'X-Admin-Email': localStorage.getItem('adminEmail') || '' },
          }).then(r => r.json());
          
          if (jobs.jobs && jobs.jobs.length > 0) {
            const latestJob = jobs.jobs[0];
            const logsResponse = await getJobLogs(latestJob.id, 20);
            setLogs(logsResponse.logs);

            if (['completed', 'failed', 'cancelled'].includes(latestJob.status)) {
              clearInterval(interval);
              setIsGenerating(false);
              setMessage({
                type: latestJob.status === 'completed' ? 'success' : 'error',
                text: latestJob.status === 'completed' 
                  ? 'Recipe updated successfully!' 
                  : 'Generation failed. Check logs for details.'
              });
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Generation failed' });
      setIsGenerating(false);
    }
  };

  const atLeastOneOptionSelected = fixMainImage || fixIngredientsImage || fixStepsImages || fixStepsText || fixIngredientsText;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Search & Select */}
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">🎯 Specific Recipe Generation</h2>
          
          {/* Search */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Search Recipe</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter recipe name..."
                className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSearching}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {isSearching ? '⏳' : '🔍'}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Results ({searchResults.length})</label>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {searchResults.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => setSelectedRecipe(recipe)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedRecipe?.id === recipe.id
                        ? 'bg-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-semibold">{recipe.name}</div>
                    <div className="text-sm text-gray-400">{recipe.region || 'Unknown region'}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Recipe Preview */}
        {selectedRecipe && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Selected Recipe</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Name:</strong> {selectedRecipe.name}</div>
              <div><strong>Region:</strong> {selectedRecipe.region || 'N/A'}</div>
              <div><strong>Main Image:</strong> {selectedRecipe.image_url ? '✓' : '✗'}</div>
              <div><strong>Ingredients Image:</strong> {selectedRecipe.ingredients_image ? '✓' : '✗'}</div>
              <div><strong>Step Images:</strong> {selectedRecipe.step_image_urls?.length || 0}</div>
              <div><strong>Beginner Steps:</strong> {selectedRecipe.steps_beginner ? '✓' : '✗'}</div>
              <div><strong>Advanced Steps:</strong> {selectedRecipe.steps_advanced ? '✓' : '✗'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Options & Generate */}
      <div className="space-y-6">
        {selectedRecipe && (
          <>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">What to Fix/Generate:</h3>
              <div className="space-y-2">
                {[
                  { key: 'fixMainImage', label: 'Main Image (only if null)', state: fixMainImage, setter: setFixMainImage },
                  { key: 'fixIngredientsImage', label: 'Ingredients Image (only if null)', state: fixIngredientsImage, setter: setFixIngredientsImage },
                  { key: 'fixStepsImages', label: 'Steps Images (resume if incomplete)', state: fixStepsImages, setter: setFixStepsImages },
                  { key: 'fixStepsText', label: 'Generate Beginner/Advanced Steps', state: fixStepsText, setter: setFixStepsText },
                  { key: 'fixIngredientsText', label: 'Validate & Fix Ingredients', state: fixIngredientsText, setter: setFixIngredientsText },
                ].map((option) => (
                  <label key={option.key} className="flex items-start gap-2 cursor-pointer bg-gray-700 p-3 rounded-lg hover:bg-gray-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={option.state}
                      onChange={(e) => option.setter(e.target.checked)}
                      disabled={isGenerating}
                      className="w-4 h-4 mt-0.5"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
              {!atLeastOneOptionSelected && (
                <p className="text-yellow-400 text-sm mt-3">⚠️ Please select at least one option</p>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !atLeastOneOptionSelected}
                className="w-full mt-4 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {isGenerating ? '⏳ Generating...' : '🚀 Start Generation'}
              </button>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            {/* Logs */}
            {logs.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">📝 Logs</h3>
                <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className={`text-sm p-2 rounded ${
                      log.log_level === 'ERROR' ? 'bg-red-900/30 text-red-400' :
                      log.log_level === 'SUCCESS' ? 'bg-green-900/30 text-green-400' :
                      log.log_level === 'WARNING' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-gray-800 text-gray-300'
                    }`}>
                      <span className="font-mono text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                      {' '}
                      <span className="font-semibold">[{log.log_level}]</span>
                      {' '}
                      {log.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
