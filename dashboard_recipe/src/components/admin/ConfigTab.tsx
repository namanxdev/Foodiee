/**
 * Config Tab Component
 * ====================
 * Manage system configuration, especially image generation limits
 */

'use client';

import { useState, useEffect } from 'react';
import { getConfig, updateConfig, updateUserSpecificLimit, type ConfigItem } from '@/services/recipeAdminAPI';

export function ConfigTab() {
  const [config, setConfig] = useState<ConfigItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [defaultLimit, setDefaultLimit] = useState<number>(10);
  const [userLimits, setUserLimits] = useState<Record<string, number>>({});
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserLimit, setNewUserLimit] = useState<number>(10);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getConfig('max_allowed_image_generation');
      
      if (response.success && response.config) {
        setConfig(response.config);
        const value = response.config.config_value as { default?: number; per_user?: Record<string, number> } | null | undefined;
        setDefaultLimit(value?.default || 10);
        setUserLimits(value?.per_user || {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load config');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDefaultLimit = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const configValue = {
        default: defaultLimit,
        per_user: userLimits,
      };
      
      const response = await updateConfig('max_allowed_image_generation', configValue);
      
      if (response.success) {
        setSuccess('Default limit updated successfully!');
        setConfig(response.config || config);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update config');
    } finally {
      setSaving(false);
    }
  };

  const handleAddUserLimit = async () => {
    if (!newUserEmail || !newUserLimit) {
      setError('Please enter both email and limit');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await updateUserSpecificLimit('max_allowed_image_generation', newUserEmail, newUserLimit);
      
      // Update local state
      setUserLimits({ ...userLimits, [newUserEmail]: newUserLimit });
      setNewUserEmail('');
      setNewUserLimit(10);
      setSuccess(`Limit for ${newUserEmail} set to ${newUserLimit}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user limit');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveUserLimit = async (email: string) => {
    try {
      setSaving(true);
      setError(null);
      
      const updatedLimits = { ...userLimits };
      delete updatedLimits[email];
      
      const configValue = {
        default: defaultLimit,
        per_user: updatedLimits,
      };
      
      await updateConfig('max_allowed_image_generation', configValue);
      setUserLimits(updatedLimits);
      setSuccess(`Limit for ${email} removed (will use default)`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user limit');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 dark:bg-slate-800 rounded-lg p-6 border border-gray-700 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-2">System Configuration</h2>
        <p className="text-gray-400 dark:text-gray-300">
          Manage image generation limits and other system settings
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900/50 border border-green-700 rounded-lg p-4 text-green-200">
          {success}
        </div>
      )}

      {/* Default Limit Section */}
      <div className="bg-gray-800 dark:bg-slate-800 rounded-lg p-6 border border-gray-700 dark:border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">Default Image Generation Limit</h3>
        <p className="text-gray-400 dark:text-gray-300 mb-4">
          Maximum number of images each user can generate per day (default for all users)
        </p>
        
        <div className="flex items-center gap-4">
          <label className="text-white font-medium">Limit:</label>
          <input
            type="number"
            min="1"
            max="100"
            value={defaultLimit}
            onChange={(e) => setDefaultLimit(parseInt(e.target.value) || 10)}
            className="px-4 py-2 rounded-lg bg-gray-700 dark:bg-slate-700 text-white border border-gray-600 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400">images per day</span>
          <button
            onClick={handleSaveDefaultLimit}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            {saving ? 'Saving...' : 'Save Default Limit'}
          </button>
        </div>
      </div>

      {/* Per-User Limits Section */}
      <div className="bg-gray-800 dark:bg-slate-800 rounded-lg p-6 border border-gray-700 dark:border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">Per-User Limits</h3>
        <p className="text-gray-400 dark:text-gray-300 mb-4">
          Set custom image generation limits for specific users (overrides default)
        </p>

        {/* Add New User Limit */}
        <div className="bg-gray-700 dark:bg-slate-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">User Email</label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-2 rounded-lg bg-gray-600 dark:bg-slate-600 text-white border border-gray-500 dark:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-2">Limit</label>
              <input
                type="number"
                min="1"
                max="100"
                value={newUserLimit}
                onChange={(e) => setNewUserLimit(parseInt(e.target.value) || 10)}
                className="w-full px-4 py-2 rounded-lg bg-gray-600 dark:bg-slate-600 text-white border border-gray-500 dark:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddUserLimit}
                disabled={saving || !newUserEmail}
                className="w-full px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
              >
                Add Limit
              </button>
            </div>
          </div>
        </div>

        {/* Existing User Limits */}
        {Object.keys(userLimits).length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-white font-medium mb-2">Current User Limits:</h4>
            {Object.entries(userLimits).map(([email, limit]) => (
              <div
                key={email}
                className="flex items-center justify-between bg-gray-700 dark:bg-slate-700 rounded-lg p-4"
              >
                <div>
                  <span className="text-white font-medium">{email}</span>
                  <span className="text-gray-400 ml-2">→ {limit} images/day</span>
                </div>
                <button
                  onClick={() => handleRemoveUserLimit(email)}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>No custom user limits set. All users will use the default limit.</p>
          </div>
        )}
      </div>

      {/* Last Updated */}
      {config && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Last updated: {new Date(config.updated_at).toLocaleString()} by {config.updated_by || 'system'}
        </div>
      )}
    </div>
  );
}

