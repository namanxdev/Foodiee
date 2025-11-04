/**
 * Image Generation Admin Page
 * ============================
 * Complete monitoring dashboard with real-time polling
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { imageGenerationAPI } from '@/services/imageGenerationAPI';
import { ImageGenerationStatus } from '@/components/admin/ImageGenerationStatus';
import { ImageGenerationControls } from '@/components/admin/ImageGenerationControls';
import { ImageGenerationLogs } from '@/components/admin/ImageGenerationLogs';
import { ImageGenerationStats } from '@/components/admin/ImageGenerationStats';
import type {
  ImageGenerationJob,
  ImageGenerationLog,
  JobStatistics,
} from '@/types/imageGeneration';

const POLL_INTERVAL = 15000; // 15 seconds

export default function ImageGenerationAdminPage() {
  // State
  const [job, setJob] = useState<ImageGenerationJob | null>(null);
  const [logs, setLogs] = useState<ImageGenerationLog[]>([]);
  const [statistics, setStatistics] = useState<JobStatistics | null>(null);
  const [recipesWithoutImages, setRecipesWithoutImages] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    const email = localStorage.getItem('adminEmail');
    if (email) {
      setAdminEmail(email);
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Fetch status
      const statusResponse = await imageGenerationAPI.getStatus();
      setJob(statusResponse.job);

      // Fetch logs
      const logsResponse = await imageGenerationAPI.getLogs(
        statusResponse.job?.id ? { job_id: statusResponse.job.id } : {}
      );
      setLogs(logsResponse.logs);

      // Fetch statistics
      const statsResponse = await imageGenerationAPI.getStatistics();
      setStatistics(statsResponse);

      // Fetch recipes without images
      const recipesResponse = await imageGenerationAPI.getRecipesWithoutImages();
      setRecipesWithoutImages(recipesResponse.count);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    }
  }, []);

  // Start polling
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial fetch
    fetchData();

    // Set up polling
    setIsPolling(true);
    const intervalId = setInterval(fetchData, POLL_INTERVAL);

    return () => {
      clearInterval(intervalId);
      setIsPolling(false);
    };
  }, [isAuthenticated, fetchData]);

  // Handle start job
  const handleStartJob = async (
    imageType: 'main' | 'steps' | 'all',
    recipeId?: number
  ) => {
    try {
      setError(null);
      await imageGenerationAPI.startJob({
        image_type: imageType,
        start_from_recipe_id: recipeId,
      });
      // Immediately fetch updated data
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to start job');
      throw err;
    }
  };

  // Handle stop job
  const handleStopJob = async () => {
    if (!job?.id) {
      setError('No active job to stop');
      return;
    }

    try {
      setError(null);
      await imageGenerationAPI.stopJob({ job_id: job.id });
      // Immediately fetch updated data
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to stop job');
      throw err;
    }
  };

  // Handle authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail.trim()) {
      localStorage.setItem('adminEmail', adminEmail);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminEmail');
    setAdminEmail('');
    setIsAuthenticated(false);
  };

  // Calculate progress percentage
  const progressPercentage = job
    ? ((job.completed_count + job.failed_count + job.skipped_count) / job.total_recipes) * 100
    : 0;

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Authentication</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
            Enter your admin email to access the image generation dashboard
          </p>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Image Generation Admin</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Monitor and control recipe image generation
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isPolling && (
                  <span className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Live (polling every 15s)
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Sign Out ({adminEmail})
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Status and Controls */}
          <div className="lg:col-span-2 space-y-6">
            <ImageGenerationStatus job={job} progressPercentage={progressPercentage} />
            <ImageGenerationLogs logs={logs} />
          </div>

          {/* Right Column - Controls and Stats */}
          <div className="space-y-6">
            <ImageGenerationControls
              onStart={handleStartJob}
              onStop={handleStopJob}
              isJobRunning={job?.status === 'running'}
              recipesWithoutImages={recipesWithoutImages}
            />
            <ImageGenerationStats statistics={statistics} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Image Generation Admin Dashboard v1.0</p>
          <p className="mt-1">
            Powered by Google Gemini AI & AWS S3
          </p>
        </div>
      </div>
    </div>
  );
}
