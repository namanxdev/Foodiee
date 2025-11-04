/**
 * Recipe Admin Page
 * ==================
 * Complete recipe management dashboard with 5 tabs:
 * 1. Data Manager - View and edit recipes
 * 2. Export - Export database tables
 * 3. Mass Generation - Generate multiple recipes
 * 4. Specific Generation - Generate specific recipe
 * 5. Validator - Validate and fix recipes
 */

'use client';

import { useState, useEffect } from 'react';
import { getAdminEmail, setAdminEmail, clearAdminEmail } from '@/services/recipeAdminAPI';

// Tab components (to be created)
import { DataManagerTab } from '@/components/recipe-admin/DataManagerTab';
import { ExportTab } from '../../../components/recipe-admin/ExportTab';
import { MassGenerationTab } from '../../../components/recipe-admin/MassGenerationTab';
import { SpecificGenerationTab } from '../../../components/recipe-admin/SpecificGenerationTab';
import { ValidatorTab } from '../../../components/recipe-admin/ValidatorTab';
import { JobsTab } from '../../../components/recipe-admin/JobsTab';

type Tab = 'data' | 'export' | 'mass-gen' | 'specific-gen' | 'validator' | 'jobs';

export default function RecipeAdminPage() {
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
          <h1 className="text-3xl font-bold text-white mb-6">Recipe Admin Login</h1>
          <p className="text-gray-400 mb-6">
            Enter your admin email to access the recipe management dashboard
          </p>
          <input
            type="email"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="admin@example.com"
            className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          <button
            onClick={handleLogin}
            className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
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
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🍳 Recipe Admin Dashboard</h1>
            <p className="text-gray-400 text-sm">Manage recipes, generate content, and validate data</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">
              {adminEmail}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white hover:bg-gray-750'
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
      </main>
    </div>
  );
}
