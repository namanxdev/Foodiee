/**
 * Image Generation Controls
 * ==========================
 * Start/Stop buttons and configuration options
 */

'use client';

import { useState } from 'react';

interface Props {
  onStart: (imageType: 'main' | 'steps' | 'all', recipeId?: number) => Promise<void>;
  onStop: () => Promise<void>;
  isJobRunning: boolean;
  recipesWithoutImages: number | null;
}

export function ImageGenerationControls({
  onStart,
  onStop,
  isJobRunning,
  recipesWithoutImages,
}: Props) {
  const [imageType, setImageType] = useState<'main' | 'steps' | 'all'>('all');
  const [recipeId, setRecipeId] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const parsedRecipeId = recipeId.trim() ? parseInt(recipeId) : undefined;
      await onStart(imageType, parsedRecipeId);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await onStop();
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">Controls</h2>

      {/* Recipes Without Images Counter */}
      {recipesWithoutImages !== null && (
        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Recipes Needing Images:</p>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
            {recipesWithoutImages}
          </p>
        </div>
      )}

      {/* Image Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3">Image Type</label>
        <div className="space-y-2">
          <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <input
              type="radio"
              name="imageType"
              value="main"
              checked={imageType === 'main'}
              onChange={(e) => setImageType(e.target.value as 'main')}
              disabled={isJobRunning}
              className="mr-3"
            />
            <div>
              <p className="font-medium">Main Images Only</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate only recipe main/hero images
              </p>
            </div>
          </label>

          <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <input
              type="radio"
              name="imageType"
              value="steps"
              checked={imageType === 'steps'}
              onChange={(e) => setImageType(e.target.value as 'steps')}
              disabled={isJobRunning}
              className="mr-3"
            />
            <div>
              <p className="font-medium">Step Images Only</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate only cooking step images
              </p>
            </div>
          </label>

          <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <input
              type="radio"
              name="imageType"
              value="all"
              checked={imageType === 'all'}
              onChange={(e) => setImageType(e.target.value as 'all')}
              disabled={isJobRunning}
              className="mr-3"
            />
            <div>
              <p className="font-medium">All Images</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate both main and step images
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Recipe ID (Optional) */}
      <div className="mb-6">
        <label htmlFor="recipeId" className="block text-sm font-medium mb-2">
          Recipe ID (Optional)
        </label>
        <input
          id="recipeId"
          type="number"
          value={recipeId}
          onChange={(e) => setRecipeId(e.target.value)}
          placeholder="Leave empty to process all recipes"
          disabled={isJobRunning}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Enter a specific recipe ID to generate images for that recipe only
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleStart}
          disabled={isJobRunning || isStarting}
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isStarting ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Starting...
            </>
          ) : (
            <>▶️ Start Image Generation</>
          )}
        </button>

        <button
          onClick={handleStop}
          disabled={!isJobRunning || isStopping}
          className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isStopping ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Stopping...
            </>
          ) : (
            <>⏹️ Stop Job (Graceful)</>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Note:</strong> Stop is graceful - it will finish the current recipe before stopping.
          The job processes recipes sequentially with rate limiting.
        </p>
      </div>
    </div>
  );
}
