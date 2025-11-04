/**
 * Image Generation Logs Viewer
 * =============================
 * Real-time log display with filtering and auto-scroll
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { ImageGenerationLog } from '@/types/imageGeneration';

interface Props {
  logs: ImageGenerationLog[];
}

export function ImageGenerationLogs({ logs }: Props) {
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Detect manual scrolling to disable auto-scroll
  const handleScroll = () => {
    if (logsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
      setAutoScroll(isAtBottom);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (levelFilter === 'all') return true;
    return log.level.toLowerCase() === levelFilter;
  });

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'success':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      default:
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const clearLogs = () => {
    // Optional: Add clear logs functionality later
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Logs</h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Filter:</label>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded"
          />
          Auto-scroll
        </label>

        {logs.length > 0 && (
          <button
            onClick={() => {
              if (logsEndRef.current) {
                logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Jump to Latest
          </button>
        )}
      </div>

      {/* Logs Container */}
      <div
        ref={logsContainerRef}
        onScroll={handleScroll}
        className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">📋</p>
            <p>No logs available</p>
            {levelFilter !== 'all' && (
              <p className="text-sm mt-2">Try changing the filter</p>
            )}
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`p-3 rounded-lg border ${getLevelColor(log.level)} border-current/20`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">{getLevelIcon(log.level)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-xs uppercase tracking-wide">
                      {log.level}
                    </span>
                    <span className="text-xs opacity-75">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    {log.recipe_id && (
                      <span className="text-xs opacity-75">
                        Recipe #{log.recipe_id}
                      </span>
                    )}
                  </div>
                  <p className="text-sm break-words">{log.message}</p>
                  {(log.error_details || log.metadata) && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer opacity-75 hover:opacity-100">
                        Show Details
                      </summary>
                      <pre className="mt-2 text-xs bg-black/5 dark:bg-white/5 p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.error_details || log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Status Indicator */}
      {!autoScroll && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 text-center">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Auto-scroll disabled. New logs are arriving. 
            <button
              onClick={() => setAutoScroll(true)}
              className="ml-2 underline font-medium hover:no-underline"
            >
              Enable auto-scroll
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
