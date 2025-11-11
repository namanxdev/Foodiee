"use client";

import Link from "next/link";
import {
  FancyFadeIn,
  FancyParticleLayer,
  FancySlideIn,
  FancySpotlight,
  FancyStagger,
} from "@/components/animations/FancyComponents";
import { GlowingButton } from "@/components/ui/GlowingButton";

const statCards = [
  {
    title: "Regenerations today",
    value: "128",
    sublabel: "+38% vs yesterday",
  },
  {
    title: "Active sessions",
    value: "42",
    sublabel: "Across web + mobile",
  },
  {
    title: "Gallery queue",
    value: "16",
    sublabel: "Awaiting diffusion polish",
  },
];

const pulses = [
  { label: "Paneer Ember - 66%", status: "glowing" },
  { label: "Midnight Ramen - 38%", status: "warming" },
  { label: "Saffron Basque - 22%", status: "cooling" },
];

export default function AdminPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,90,47,0.2)_0%,_rgba(30,30,30,0.92)_40%,_rgba(10,10,10,1)_100%)] text-white">
      <FancyParticleLayer density={9} />
      <FancySpotlight size={420} blur={120} />

      <header className="relative z-20 mx-auto max-w-6xl px-6 pb-12 pt-16 sm:px-10 md:px-12 lg:px-16">
        <Link href="/" className="text-xs uppercase tracking-[0.4em] text-[#FFD07F]/80">
          ← Back to cinematic landing
        </Link>
        <FancyFadeIn className="mt-6 space-y-4">
          <p className="text-xs uppercase tracking-[0.45em] text-[#FFD07F]/75">Admin console</p>
          <h1 className="text-4xl font-semibold sm:text-5xl md:text-6xl">
            Keep the AI kitchen humming.
          </h1>
          <p className="max-w-3xl text-sm text-white/70 sm:text-base">
            Monitor image regeneration, tune AI prompts, and spotlight top performers — all wrapped
            in Foodiee’s cinematic glow. The control room for neon-crisp dishes.
          </p>
        </FancyFadeIn>
      </header>

      <main className="relative z-20 mx-auto grid max-w-6xl gap-10 px-6 pb-24 sm:px-10 md:px-12 lg:px-16">
        <FancyStagger className="grid gap-6 md:grid-cols-3">
          {statCards.map((card, index) => (
            <FancyFadeIn
              key={card.title}
              delay={index * 0.1}
              className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur-2xl"
            >
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">{card.title}</p>
              <p className="mt-4 text-4xl font-semibold text-[#FFD07F]">{card.value}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.35em] text-white/55">
                {card.sublabel}
              </p>
            </FancyFadeIn>
          ))}
        </FancyStagger>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <FancyFadeIn className="rounded-[2.25rem] border border-white/10 bg-white/10 p-8 backdrop-blur-3xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#FFD07F]/80">
                  Prompt tuning
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Gemini + LangChain Orchestration
                </h2>
              </div>
              <GlowingButton label="Update prompts" />
            </div>
            <div className="mt-8 space-y-6 text-sm text-white/70">
              <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                  Current temperature curves
                </p>
                <p className="mt-3 text-base text-white">
                  Headline imagery leaning 22% toward ember reds; plating instructions balanced for
                  medium heat with citrus shimmer overlays.
                </p>
              </div>
              <div className="grid gap-4 text-xs uppercase tracking-[0.35em] text-white/55 md:grid-cols-2">
                <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Pantry embeddings · Last rebuild: 2h ago
                </span>
                <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Supabase sync · 98% coverage
                </span>
              </div>
            </div>
          </FancyFadeIn>

          <FancyFadeIn className="rounded-[2.25rem] border border-white/10 bg-white/10 p-8 backdrop-blur-3xl">
            <p className="text-xs uppercase tracking-[0.4em] text-[#FFD07F]/80">
              Regeneration queue
            </p>
            <div className="mt-6 space-y-4">
              {pulses.map((pulse, index) => (
                <FancySlideIn
                  key={pulse.label}
                  delay={index * 0.1}
                  className="flex items-center justify-between rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs uppercase tracking-[0.35em] text-white/70"
                >
                  <span>{pulse.label}</span>
                  <span className="text-[#FFD07F]">{pulse.status}</span>
                </FancySlideIn>
              ))}
            </div>
            <div className="mt-8 rounded-3xl border border-white/10 bg-black/40 p-6 text-xs uppercase tracking-[0.35em] text-white/55">
              Next GPU slot available in 6m · 2 diffusion workers active
            </div>
          </FancyFadeIn>
        </div>

        <FancyFadeIn className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-sm text-white/70">
          <p className="text-xs uppercase tracking-[0.35em] text-white/55">
            Export & maintenance
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <button className="rounded-2xl border border-white/15 bg-black/40 px-5 py-4 text-left text-xs uppercase tracking-[0.35em] text-white/65 transition hover:border-[#FFD07F]/45 hover:text-white">
              Export top recipes CSV
            </button>
            <button className="rounded-2xl border border-white/15 bg-black/40 px-5 py-4 text-left text-xs uppercase tracking-[0.35em] text-white/65 transition hover:border-[#FFD07F]/45 hover:text-white">
              Refresh FAISS embeddings
            </button>
            <button className="rounded-2xl border border-white/15 bg-black/40 px-5 py-4 text-left text-xs uppercase tracking-[0.35em] text-white/65 transition hover:border-[#FFD07F]/45 hover:text-white">
              Manage admin access
            </button>
          </div>
        </FancyFadeIn>
      </main>
    </div>
  );
}
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
                className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gray-700 dark:bg-slate-700 text-white border-b-2 border-blue-500 dark:border-blue-400'
                    : 'text-gray-400 dark:text-gray-400 hover:text-white dark:hover:text-white hover:bg-gray-750 dark:hover:bg-slate-700'
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

