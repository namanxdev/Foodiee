/**
 * Jobs Management Tab Component
 * View all running and completed jobs, with ability to stop running jobs
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getJobs, getJobLogs, cancelJob } from '@/services/recipeAdminAPI';
import type { RegenerationJob, RegenerationLog } from '@/types/recipeAdmin';

export function JobsTab() {
  const [jobs, setJobs] = useState<RegenerationJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<RegenerationJob | null>(null);
  const [logs, setLogs] = useState<RegenerationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getJobs(
        filter === 'all' ? undefined : filter,
        100
      );
      setJobs(response.jobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadJobLogs = useCallback(async (jobId: number) => {
    try {
      const response = await getJobLogs(jobId);
      setLogs(response.logs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Auto-refresh every 5 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadJobs();
      if (selectedJob) {
        loadJobLogs(selectedJob.id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedJob, loadJobs, loadJobLogs]);

  const handleSelectJob = async (job: RegenerationJob) => {
    setSelectedJob(job);
    await loadJobLogs(job.id);
  };

  const handleCancelJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to stop this job? This action cannot be undone.')) {
      return;
    }

    try {
      await cancelJob(jobId);
      alert('Job cancellation requested. The job will stop gracefully.');
      await loadJobs();
      if (selectedJob?.id === jobId) {
        await loadJobLogs(jobId);
      }
    } catch (error) {
      alert(`Failed to cancel job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-400 bg-blue-900/30';
      case 'completed': return 'text-green-400 bg-green-900/30';
      case 'failed': return 'text-red-400 bg-red-900/30';
      case 'cancelled': return 'text-orange-400 bg-orange-900/30';
      default: return 'text-gray-400 bg-gray-900/30';
    }
  };

  const getJobTypeIcon = (jobType: string) => {
    switch (jobType) {
      case 'mass_generation': return '🏭';
      case 'specific_generation': return '🎯';
      case 'validation': return '✅';
      default: return '📋';
    }
  };

  const formatDuration = (start: string, end: string | null) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">📊 Jobs Management</h2>
            <p className="text-gray-400 text-sm mt-1">
              Monitor and control recipe generation jobs
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-gray-300">Auto-refresh (5s)</span>
            </label>
            <button
              onClick={loadJobs}
              disabled={loading}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['all', 'running', 'completed', 'failed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'running' && jobs.filter(j => j.status === 'running').length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500 text-xs">
                  {jobs.filter(j => j.status === 'running').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Jobs List */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">Jobs List</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {jobs.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No jobs found
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleSelectJob(job)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedJob?.id === job.id
                      ? 'bg-blue-900/30 border-2 border-blue-600'
                      : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getJobTypeIcon(job.job_type)}</span>
                      <div>
                        <div className="font-semibold text-sm">
                          {job.job_type.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-400">ID: {job.id}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>

                  {job.recipe_name && (
                    <div className="text-sm text-gray-300 mb-1">
                      Recipe: <span className="text-blue-400">{job.recipe_name}</span>
                    </div>
                  )}

                  {job.recipe_count && (
                    <div className="text-sm text-gray-300 mb-1">
                      Count: <span className="text-green-400">{job.recipe_count}</span>
                    </div>
                  )}

                  <div className="text-xs text-gray-400 mt-2">
                    Started: {new Date(job.started_at).toLocaleString()}
                  </div>

                  {job.status === 'running' && (
                    <div className="mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelJob(job.id);
                        }}
                        className="w-full px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-semibold"
                      >
                        ⛔ Stop Job
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Job Details & Logs */}
        <div className="bg-gray-800 rounded-lg p-6">
          {selectedJob ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Job Details</h3>
                <span className={`px-3 py-1 rounded font-medium ${getStatusColor(selectedJob.status)}`}>
                  {selectedJob.status}
                </span>
              </div>

              {/* Job Info */}
              <div className="bg-gray-700 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Job ID:</span>
                  <span className="text-white font-mono">{selectedJob.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white">{selectedJob.job_type}</span>
                </div>
                {selectedJob.recipe_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Recipe:</span>
                    <span className="text-blue-400">{selectedJob.recipe_name}</span>
                  </div>
                )}
                {selectedJob.recipe_count && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Recipe Count:</span>
                    <span className="text-green-400">{selectedJob.recipe_count}</span>
                  </div>
                )}
                {selectedJob.cuisine_filter && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cuisine:</span>
                    <span className="text-yellow-400">{selectedJob.cuisine_filter}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Started:</span>
                  <span className="text-white">{new Date(selectedJob.started_at).toLocaleString()}</span>
                </div>
                {selectedJob.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Completed:</span>
                    <span className="text-white">{new Date(selectedJob.completed_at).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white font-mono">
                    {formatDuration(selectedJob.started_at, selectedJob.completed_at)}
                  </span>
                </div>
              </div>

              {/* Generation Options */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2">Generation Options</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedJob.fix_main_image && (
                    <div className="flex items-center gap-1 text-green-400">
                      <span>✓</span> Main Image
                    </div>
                  )}
                  {selectedJob.fix_ingredients_image && (
                    <div className="flex items-center gap-1 text-green-400">
                      <span>✓</span> Ingredients Image
                    </div>
                  )}
                  {selectedJob.fix_steps_images && (
                    <div className="flex items-center gap-1 text-green-400">
                      <span>✓</span> Steps Images
                    </div>
                  )}
                  {selectedJob.fix_steps_text && (
                    <div className="flex items-center gap-1 text-green-400">
                      <span>✓</span> Steps Text
                    </div>
                  )}
                  {selectedJob.fix_ingredients_text && (
                    <div className="flex items-center gap-1 text-green-400">
                      <span>✓</span> Ingredients Text
                    </div>
                  )}
                </div>
              </div>

              {/* Logs */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Logs ({logs.length})</h4>
                <div className="bg-gray-900 rounded-lg p-3 max-h-[350px] overflow-y-auto space-y-1 text-xs font-mono">
                  {logs.length === 0 ? (
                    <div className="text-gray-400 text-center py-4">No logs yet</div>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-2 rounded ${
                          log.log_level === 'ERROR' ? 'bg-red-900/30 text-red-400' :
                          log.log_level === 'SUCCESS' ? 'bg-green-900/30 text-green-400' :
                          log.log_level === 'WARNING' ? 'bg-yellow-900/30 text-yellow-400' :
                          'bg-gray-800 text-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <span className="text-gray-500">
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
                                if (log.metadata && log.metadata.prompt) {
                                  navigator.clipboard.writeText(log.metadata.prompt as string);
                                  alert('Prompt copied to clipboard!');
                                }
                              }}
                              className="px-2 py-0.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors whitespace-nowrap"
                              title="Copy full prompt"
                            >
                              📋 Copy
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-20">
              Select a job to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
