/**
 * Admin Dashboard
 * ===============
 * Complete admin dashboard with all tabs:
 * 1. Data Manager - View and edit recipes
 * 2. Export - Export database tables
 * 3. Mass Generation - Generate multiple recipes
 * 4. Specific Generation - Generate specific recipe
 * 5. Validator - Validate and fix recipes
 * 6. Jobs - View and manage jobs
 * 7. Config - Manage system configuration (max image generation limits)
 */

'use client';

import { useState, useEffect } from 'react';
import { getAdminEmail, setAdminEmail, clearAdminEmail } from '@/services/recipeAdminAPI';

// Tab components
import { DataManagerTab } from '@/components/recipe-admin/DataManagerTab';
import { ExportTab } from '@/components/recipe-admin/ExportTab';
import { MassGenerationTab } from '@/components/recipe-admin/MassGenerationTab';
import { SpecificGenerationTab } from '@/components/recipe-admin/SpecificGenerationTab';
import { ValidatorTab } from '@/components/recipe-admin/ValidatorTab';
import { JobsTab } from '@/components/recipe-admin/JobsTab';
import { ConfigTab } from '@/components/admin/ConfigTab';

type Tab = 'data' | 'export' | 'mass-gen' | 'specific-gen' | 'validator' | 'jobs' | 'config';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('data');
  const [adminEmail, setAdminEmailState] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputEmail, setInputEmail] = useState('');

  // Check authentication on mount
  useEffect(() => {
    const email = getAdminEmail();
    if (email) {
      setAdminEmailState(email);
      setIsAuthenticated(true);
    }
  }, []);

  // Handle login
  const handleLogin = () => {
    if (inputEmail) {
      setAdminEmail(inputEmail);
      setAdminEmailState(inputEmail);
      setIsAuthenticated(true);
    }
  };

  // Handle logout
  const handleLogout = () => {
    clearAdminEmail();
    setAdminEmailState('');
    setIsAuthenticated(false);
    setInputEmail('');
  };

  // Login UI
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-gray-800 dark:bg-slate-800 p-8 rounded-lg shadow-xl max-w-md w-full border border-gray-700 dark:border-slate-700">
          <h1 className="text-3xl font-bold text-white dark:text-white mb-6">Admin Login</h1>
          <p className="text-gray-400 dark:text-gray-300 mb-6">
            Enter your admin email to access the admin dashboard
          </p>
          <input
            type="email"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="admin@example.com"
            className="w-full px-4 py-3 rounded-lg bg-gray-700 dark:bg-slate-700 text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 mb-4"
          />
          <button
            onClick={handleLogin}
            className="w-full px-4 py-3 rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // Tabs configuration
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'data', label: 'Data Manager', icon: '📊' },
    { id: 'export', label: 'Export', icon: '💾' },
    { id: 'mass-gen', label: 'Mass Generation', icon: '🔄' },
    { id: 'specific-gen', label: 'Specific Generation', icon: '🎯' },
    { id: 'validator', label: 'Validator', icon: '✅' },
    { id: 'jobs', label: 'Jobs', icon: '⚙️' },
    { id: 'config', label: 'Config', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-gray-800 dark:bg-slate-800 border-b border-gray-700 dark:border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white dark:text-white">🍳 Admin Dashboard</h1>
            <p className="text-gray-400 dark:text-gray-300 text-sm">Manage recipes, generate content, and configure system</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 dark:text-gray-300 text-sm">
              {adminEmail}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 transition-colors text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-gray-800 dark:bg-slate-800 border-b border-gray-700 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 dark:bg-blue-500 text-white border-b-[3px] border-blue-400 dark:border-blue-300 shadow-lg shadow-blue-500/30 scale-105 ring-2 ring-blue-400/30'
                    : 'text-gray-400 dark:text-gray-400 hover:text-white dark:hover:text-white hover:bg-gray-700 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'data' && <DataManagerTab />}
        {activeTab === 'export' && <ExportTab />}
        {activeTab === 'mass-gen' && <MassGenerationTab />}
        {activeTab === 'specific-gen' && <SpecificGenerationTab />}
        {activeTab === 'validator' && <ValidatorTab />}
        {activeTab === 'jobs' && <JobsTab />}
        {activeTab === 'config' && <ConfigTab />}
      </main>
    </div>
  );
}

