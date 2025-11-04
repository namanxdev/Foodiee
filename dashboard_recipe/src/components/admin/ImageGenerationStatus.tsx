/**
 * Image Generation Status Card
 * =============================
 * Displays current job status with progress bar
 */

'use client';

import { ImageGenerationJob } from '@/types/imageGeneration';

interface Props {
  job: ImageGenerationJob | null;
  progressPercentage: number;
}

export function ImageGenerationStatus({ job, progressPercentage }: Props) {
  if (!job) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">No Active Job</h2>
        <p className="text-gray-600 dark:text-gray-400">
          No image generation job is currently running. Start a new job to begin generating images.
        </p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500 text-white';
      case 'completed':
        return 'bg-green-500 text-white';
      case 'failed':
        return 'bg-red-500 text-white';
      case 'stopped':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return '🔄';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'stopped':
        return '⏸️';
      default:
        return '⏳';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Job Status</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
          {getStatusIcon(job.status)} {job.status.toUpperCase()}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Current Recipe */}
      {job.current_recipe_name && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Currently Processing:</p>
          <p className="font-medium text-blue-700 dark:text-blue-300">
            #{job.current_recipe_id}: {job.current_recipe_name}
          </p>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {job.completed_count}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Failed</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            {job.failed_count}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Skipped</p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {job.skipped_count}
          </p>
        </div>
      </div>

      {/* Total Progress */}
      <div className="text-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {job.completed_count + job.failed_count + job.skipped_count} / {job.total_recipes} recipes processed
        </p>
      </div>

      {/* Error Message */}
      {job.error_message && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">Error:</p>
          <p className="text-sm text-red-700 dark:text-red-400">{job.error_message}</p>
        </div>
      )}

      {/* Stop Signal */}
      {job.should_stop && job.status === 'running' && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            ⏸️ Stop signal received. Job will finish current recipe and then stop.
          </p>
        </div>
      )}
    </div>
  );
}
