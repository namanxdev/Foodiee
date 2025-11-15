/**
 * Export Tab Component
 * Export recipes data in JSON or CSV format
 */

'use client';

import { useState } from 'react';
import { exportRecipes, downloadFile } from '@/services/recipeAdminAPI';

export function ExportTab() {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setMessage(null);

      const data = await exportRecipes(format);

      if (format === 'csv') {
        // Download CSV file
        downloadFile(data as Blob, `recipes_${new Date().toISOString().split('T')[0]}.csv`);
        setMessage({ type: 'success', text: 'CSV file downloaded successfully!' });
      } else {
        // Download JSON file
        const exportData = data as { data: unknown; count: number };
        const blob = new Blob([JSON.stringify(exportData.data, null, 2)], { type: 'application/json' });
        downloadFile(blob, `recipes_${new Date().toISOString().split('T')[0]}.json`);
        setMessage({ type: 'success', text: `Exported ${exportData.count} recipes as JSON!` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Export failed' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">💾 Export Database</h2>
        <p className="text-gray-400 mb-6">
          Export all recipe data in your preferred format
        </p>

        {/* Format Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">Export Format</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="json"
                checked={format === 'json'}
                onChange={(e) => setFormat(e.target.value as 'json' | 'csv')}
                className="w-4 h-4"
              />
              <span>JSON (structured data)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="csv"
                checked={format === 'csv'}
                onChange={(e) => setFormat(e.target.value as 'json' | 'csv')}
                className="w-4 h-4"
              />
              <span>CSV (spreadsheet)</span>
            </label>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          {isExporting ? '⏳ Exporting...' : `📥 Export as ${format.toUpperCase()}`}
        </button>

        {/* Message */}
        {message && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">ℹ️ Export Information</h3>
        <ul className="space-y-2 text-gray-400 text-sm">
          <li>• <strong>JSON:</strong> Best for backups and data processing. Preserves all data types and nested structures.</li>
          <li>• <strong>CSV:</strong> Best for spreadsheet analysis. Flattens nested data for Excel/Google Sheets.</li>
          <li>• Files are named with current date for easy organization</li>
          <li>• Export includes all recipes with complete data</li>
        </ul>
      </div>
    </div>
  );
}
