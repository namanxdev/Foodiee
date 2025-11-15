/**
 * Mass Generation Tab Component
 * Generate/fix multiple recipes with selective options
 */

'use client';

import { useState, useEffect } from 'react';
import { startMassGeneration, getJobLogs, getStatistics } from '@/services/recipeAdminAPI';
import type { RegenerationJob, RegenerationLog, RecipeStatistics } from '@/types/recipeAdmin';
import { API_CONFIG } from '@/constants';
import { ExistingImagesModal } from './ExistingImagesModal';

export function MassGenerationTab() {
  const [statistics, setStatistics] = useState<RecipeStatistics | null>(null);
  const [cuisine, setCuisine] = useState<string>('');
  const [recipeCount, setRecipeCount] = useState<number>(10);
  const [job, setJob] = useState<RegenerationJob | null>(null);
  const [logs, setLogs] = useState<RegenerationLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  // Fixing options
  const [fixMainImage, setFixMainImage] = useState(false);
  const [fixIngredientsImage, setFixIngredientsImage] = useState(false);
  const [fixStepsImages, setFixStepsImages] = useState(false);
  const [fixStepsText, setFixStepsText] = useState(false);
  const [fixIngredientsText, setFixIngredientsText] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [existingImages, setExistingImages] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Load statistics on mount
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

  const checkExistingImages = async () => {
    console.log('🔍 Checking for existing S3 images...');
    setIsChecking(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/check-existing-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Email': localStorage.getItem('adminEmail') || '',
        },
        body: JSON.stringify({
          cuisine_filter: cuisine || undefined,
          recipe_count: recipeCount,
          fix_main_image: fixMainImage,
          fix_ingredients_image: fixIngredientsImage,
          fix_steps_images: fixStepsImages,
          fix_steps_text: fixStepsText,
          fix_ingredients_text: fixIngredientsText,
        }),
      });
      
      const data = await response.json();
      console.log('✅ Check response:', data);
      setIsChecking(false);
      
      if (data.has_existing_images && data.recipes && data.recipes.length > 0) {
        // Show modal with existing images
        console.log(`📸 Found ${data.count} recipes with existing images, showing modal...`);
        setExistingImages(data);
        setShowModal(true);
      } else {
        // No existing images, proceed with generation
        console.log('🆕 No existing images found, proceeding with generation...');
        startGeneration('generate');
      }
    } catch (error) {
      console.error('❌ Failed to check existing images:', error);
      setIsChecking(false);
      // On error, proceed with generation
      console.log('⚠️ Error occurred, proceeding with generation as fallback...');
      startGeneration('generate');
    }
  };

  const startGeneration = async (mode: 'generate' | 'load_from_s3') => {
    try {
      setShowModal(false);
      setIsRunning(true);
      setLogs([]);
      setJob(null);

      const response = await startMassGeneration({
        cuisine_filter: cuisine || undefined,
        recipe_count: recipeCount,
        fix_main_image: fixMainImage,
        fix_ingredients_image: fixIngredientsImage,
        fix_steps_images: fixStepsImages,
        fix_steps_text: fixStepsText,
        fix_ingredients_text: fixIngredientsText,
        mode,
      });

      // Start polling for status
      if (response.success) {
        // Fetch job details periodically
        const interval = setInterval(async () => {
          try {
            const jobs = await fetch(`${API_CONFIG.BASE_URL}/api/admin/jobs?limit=1`, {
              headers: { 'X-Admin-Email': localStorage.getItem('adminEmail') || '' },
            }).then(r => r.json());
            
            if (jobs.jobs && jobs.jobs.length > 0) {
              const latestJob = jobs.jobs[0];
              setJob(latestJob);

              // Get logs
              const logsResponse = await getJobLogs(latestJob.id, 50);
              setLogs(logsResponse.logs);

              // Stop polling if job is done
              if (['completed', 'failed', 'cancelled'].includes(latestJob.status)) {
                clearInterval(interval);
                setIsRunning(false);
                await loadStatistics(); // Reload stats
              }
            }
          } catch (error) {
            console.error('Polling error:', error);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to start generation:', error);
      setIsRunning(false);
    }
  };

  const handleStart = async () => {
    // Check for existing images first
    await checkExistingImages();
  };

  const atLeastOneOptionSelected = fixMainImage || fixIngredientsImage || fixStepsImages || fixStepsText || fixIngredientsText;

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-400">{statistics.total_recipes}</div>
            <div className="text-sm text-gray-400">Total Recipes</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-yellow-400">{statistics.missing_data.main_images}</div>
            <div className="text-sm text-gray-400">Missing Main Images</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-orange-400">{statistics.missing_data.ingredients_images}</div>
            <div className="text-sm text-gray-400">Missing Ingredient Images</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-red-400">{statistics.missing_data.steps_images}</div>
            <div className="text-sm text-gray-400">Missing Step Images</div>
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🔄 Mass Generation</h2>
        
        {/* Filters */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Cuisine Filter (optional)</label>
            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isRunning}
            >
              <option value="">All Cuisines</option>
              {statistics?.cuisines.list.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Recipe Count</label>
            <input
              type="number"
              value={recipeCount}
              onChange={(e) => setRecipeCount(parseInt(e.target.value))}
              
              max="500"
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isRunning}
            />
          </div>
        </div>

        {/* Fixing Options */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-3">What to Fix/Generate:</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: 'fixMainImage', label: 'Main Image', state: fixMainImage, setter: setFixMainImage },
              { key: 'fixIngredientsImage', label: 'Ingredients Image', state: fixIngredientsImage, setter: setFixIngredientsImage },
              { key: 'fixStepsImages', label: 'Steps Images', state: fixStepsImages, setter: setFixStepsImages },
              { key: 'fixStepsText', label: 'Beginner/Advanced Steps', state: fixStepsText, setter: setFixStepsText },
              { key: 'fixIngredientsText', label: 'Validate Ingredients', state: fixIngredientsText, setter: setFixIngredientsText },
            ].map((option) => (
              <label key={option.key} className="flex items-center gap-2 cursor-pointer bg-gray-700 p-3 rounded-lg hover:bg-gray-600 transition-colors">
                <input
                  type="checkbox"
                  checked={option.state}
                  onChange={(e) => option.setter(e.target.checked)}
                  disabled={isRunning}
                  className="w-4 h-4"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
          {!atLeastOneOptionSelected && (
            <p className="text-yellow-400 text-sm mt-2">⚠️ Please select at least one option</p>
          )}
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={isRunning || isChecking || !atLeastOneOptionSelected}
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          {isChecking ? '🔍 Checking for existing images...' : isRunning ? '⏳ Running...' : '🚀 Start Generation'}
        </button>
      </div>

      {/* Progress */}
      {job && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📊 Progress</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                job.status === 'completed' ? 'bg-green-900 text-green-400' :
                job.status === 'running' ? 'bg-blue-900 text-blue-400' :
                job.status === 'failed' ? 'bg-red-900 text-red-400' :
                'bg-gray-700 text-gray-400'
              }`}>
                {job.status.toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Progress: {job.processed_recipes} / {job.total_recipes}</span>
                <span>{Math.round((job.processed_recipes / job.total_recipes) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(job.processed_recipes / job.total_recipes) * 100}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-green-400">✓ Success:</span> {job.successful_recipes}
              </div>
              <div>
                <span className="text-yellow-400">⊘ Skipped:</span> {job.skipped_recipes}
              </div>
              <div>
                <span className="text-red-400">✗ Failed:</span> {job.failed_recipes}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📝 Logs (Latest {logs.length})</h3>
          <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
            {logs.map((log) => (
              <div key={log.id} className={`text-sm p-2 rounded ${
                log.log_level === 'ERROR' ? 'bg-red-900/30 text-red-400' :
                log.log_level === 'SUCCESS' ? 'bg-green-900/30 text-green-400' :
                log.log_level === 'WARNING' ? 'bg-yellow-900/30 text-yellow-400' :
                'bg-gray-800 text-gray-300'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="font-mono text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                    {' '}
                    <span className="font-semibold">[{log.log_level}]</span>
                    {' '}
                    {log.recipe_name && <span className="text-blue-400">{log.recipe_name}:</span>}
                    {' '}
                    {log.message}
                  </div>
                  {log.metadata && typeof log.metadata === 'object' && 'prompt' in log.metadata && log.metadata.prompt && (
                    <button
                      onClick={() => {
                        if (log.metadata && typeof log.metadata === 'object' && 'prompt' in log.metadata && log.metadata.prompt) {
                          navigator.clipboard.writeText(log.metadata.prompt as string);
                          alert('Prompt copied to clipboard!');
                        } else {
                          alert('No prompt available to copy.');
                        }
                      }}
                      className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors whitespace-nowrap"
                      title="Copy full prompt"
                    >
                      📋 Copy Prompt
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Images Modal */}
      {showModal && existingImages && (
        <ExistingImagesModal
          recipes={existingImages.recipes}
          onChoice={startGeneration}
          onCancel={() => {
            setShowModal(false);
            setIsRunning(false);
          }}
        />
      )}
    </div>
  );
}
