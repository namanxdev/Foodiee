/**
 * Validator Tab Component
 * Validate and fix recipe issues
 */

'use client';

import { useState, useEffect } from 'react';
import { startValidation, getStatistics } from '@/services/recipeAdminAPI';
import type { RecipeStatistics } from '@/types/recipeAdmin';

export function ValidatorTab() {
  const [statistics, setStatistics] = useState<RecipeStatistics | null>(null);
  const [selectedRecipes] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  // Fixing options
  const [fixMainImage, setFixMainImage] = useState(false);
  const [fixIngredientsImage, setFixIngredientsImage] = useState(false);
  const [fixStepsImages, setFixStepsImages] = useState(false);
  const [fixStepsText, setFixStepsText] = useState(false);
  const [fixIngredientsText, setFixIngredientsText] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await getStatistics();
      setStatistics(response.statistics);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleValidate = async () => {
    try {
      setIsRunning(true);

      await startValidation({
        recipe_ids: selectedRecipes.length > 0 ? selectedRecipes : undefined,
        fix_main_image: fixMainImage,
        fix_ingredients_image: fixIngredientsImage,
        fix_steps_images: fixStepsImages,
        fix_steps_text: fixStepsText,
        fix_ingredients_text: fixIngredientsText,
      });

      alert('Validation job started! Check Mass Generation tab for progress.');
      
      // Reload stats after a delay
      setTimeout(() => {
        loadStatistics();
        setIsRunning(false);
      }, 3000);
    } catch (error) {
      alert(`Failed to start validation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsRunning(false);
    }
  };

  const atLeastOneOptionSelected = fixMainImage || fixIngredientsImage || fixStepsImages || fixStepsText || fixIngredientsText;

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {statistics && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">✅ Recipe Validation</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-400">{statistics.completeness.fully_complete}</div>
              <div className="text-sm text-gray-400">Fully Complete</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-3xl font-bold text-red-400">{statistics.completeness.needs_attention}</div>
              <div className="text-sm text-gray-400">Needs Attention</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-400">
                {Math.round((statistics.completeness.fully_complete / statistics.total_recipes) * 100)}%
              </div>
              <div className="text-sm text-gray-400">Completion Rate</div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-gray-900 rounded p-3">
              <div className="font-semibold text-yellow-400">{statistics.missing_data.main_images}</div>
              <div className="text-gray-400">Missing Main Images</div>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <div className="font-semibold text-orange-400">{statistics.missing_data.ingredients_images}</div>
              <div className="text-gray-400">Missing Ingredient Images</div>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <div className="font-semibold text-red-400">{statistics.missing_data.steps_images}</div>
              <div className="text-gray-400">Missing Step Images</div>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <div className="font-semibold text-purple-400">{statistics.missing_data.steps_beginner}</div>
              <div className="text-gray-400">Missing Beginner Steps</div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Options */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🔧 Fix Options</h3>
        
        <p className="text-gray-400 text-sm mb-4">
          Select what to fix for all recipes with missing data. This will process all incomplete recipes automatically.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {[
            { key: 'fixMainImage', label: 'Main Image (only if null)', state: fixMainImage, setter: setFixMainImage },
            { key: 'fixIngredientsImage', label: 'Ingredients Image (only if null)', state: fixIngredientsImage, setter: setFixIngredientsImage },
            { key: 'fixStepsImages', label: 'Steps Images (resume incomplete)', state: fixStepsImages, setter: setFixStepsImages },
            { key: 'fixStepsText', label: 'Generate Beginner/Advanced Steps', state: fixStepsText, setter: setFixStepsText },
            { key: 'fixIngredientsText', label: 'Validate & Fix Ingredients', state: fixIngredientsText, setter: setFixIngredientsText },
          ].map((option) => (
            <label key={option.key} className="flex items-start gap-2 cursor-pointer bg-gray-700 p-3 rounded-lg hover:bg-gray-600 transition-colors">
              <input
                type="checkbox"
                checked={option.state}
                onChange={(e) => option.setter(e.target.checked)}
                disabled={isRunning}
                className="w-4 h-4 mt-0.5"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>

        {!atLeastOneOptionSelected && (
          <p className="text-yellow-400 text-sm mb-4">⚠️ Please select at least one option</p>
        )}

        <button
          onClick={handleValidate}
          disabled={isRunning || !atLeastOneOptionSelected}
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          {isRunning ? '⏳ Starting Validation...' : '🚀 Start Bulk Validation'}
        </button>
      </div>

      {/* Info */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">ℹ️ How Validation Works</h3>
        <ul className="space-y-2 text-gray-400 text-sm">
          <li>• <strong>Smart Skip:</strong> Existing images and complete data are never overwritten</li>
          <li>• <strong>Resume Capability:</strong> Step image generation resumes from where it stopped</li>
          <li>• <strong>Background Processing:</strong> Job runs in background, check Mass Generation tab for progress</li>
          <li>• <strong>Logs Available:</strong> All operations are logged with timestamps and details</li>
          <li>• <strong>No Data Loss:</strong> Original data is preserved, only missing fields are filled</li>
        </ul>
      </div>
    </div>
  );
}
