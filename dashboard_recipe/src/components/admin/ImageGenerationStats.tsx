/**
 * Image Generation Statistics
 * ============================
 * Overall statistics and recent jobs history
 */

'use client';

import { JobStatistics } from '@/types/imageGeneration';

interface Props {
  statistics: JobStatistics | null;
}

export function ImageGenerationStats({ statistics }: Props) {
  if (!statistics) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Statistics</h2>
        <p className="text-gray-600 dark:text-gray-400">Loading statistics...</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-blue-600 dark:text-blue-400';
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'stopped':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">Statistics</h2>

      {/* Overall Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Jobs</p>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
            {statistics.total_jobs}
          </p>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Images</p>
          <p className="text-3xl font-bold text-green-700 dark:text-green-300">
            {statistics.total_images_generated}
          </p>
        </div>

        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Failed Images</p>
          <p className="text-3xl font-bold text-red-700 dark:text-red-300">
            {statistics.total_images_failed}
          </p>
        </div>

        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Running Jobs</p>
          <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
            {statistics.running_jobs}
          </p>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-bold mb-4">Recent Jobs</h3>

        {statistics.recent_jobs.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No recent jobs found
          </p>
        ) : (
          <div className="space-y-3">
            {statistics.recent_jobs.map((job) => (
              <div
                key={job.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">
                      Job #{job.id}
                      <span className={`ml-2 text-sm ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(job.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {job.completed_count} / {job.total_recipes}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">recipes</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <p className="font-medium text-green-700 dark:text-green-300">
                      {job.completed_count}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Completed</p>
                  </div>
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <p className="font-medium text-red-700 dark:text-red-300">
                      {job.failed_count}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Failed</p>
                  </div>
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    <p className="font-medium text-yellow-700 dark:text-yellow-300">
                      {job.skipped_count}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Skipped</p>
                  </div>
                </div>

                {job.error_message && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs">
                    <p className="text-red-700 dark:text-red-400 line-clamp-2">
                      {job.error_message}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Last Updated */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Statistics refreshed every 15 seconds
        </p>
      </div>
    </div>
  );
}
