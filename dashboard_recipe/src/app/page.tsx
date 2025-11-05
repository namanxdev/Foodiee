"use client";

import { useSession } from "next-auth/react";
import Header from "@/components/layout/Header";
import AuthGate from "@/components/auth/AuthGate";
import { FaUtensils, FaSearch, FaBook } from "react-icons/fa";
import Link from "next/link";

/**
 * Home Page Component
 * ====================
 * Landing page with navigation to main features
 */
export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header session={session} />
      
      <AuthGate status={status}>
        <main className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <FaUtensils className="text-6xl text-orange-500 dark:text-orange-400" />
            </div>
            <h1 className="text-5xl font-bold text-gray-800 dark:text-white mb-4">
              Welcome to Foodiee
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-200 mb-8">
              Discover amazing recipes tailored to your preferences
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Preferences Card */}
            <Link href="/preferences" className="group">
              <div className="bg-white dark:bg-slate-700/90 dark:backdrop-blur-sm rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-orange-500/10 p-8 hover:shadow-2xl dark:hover:shadow-orange-500/30 transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-orange-500 dark:hover:border-orange-400">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mb-6 group-hover:scale-110 transition-transform">
                  <FaSearch className="text-white text-2xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                  Tell Us Your Preferences
                </h2>
                <p className="text-gray-600 dark:text-gray-200 leading-relaxed">
                  Fill out your preferences and get personalized recipe recommendations based on your taste, available ingredients, and dietary needs.
                </p>
                <div className="mt-6 text-orange-500 dark:text-orange-400 font-medium group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors">
                  Get Started →
                </div>
              </div>
            </Link>

            {/* Top Recipes Card */}
            <Link href="/top-recipes" className="group">
              <div className="bg-white dark:bg-slate-700/90 dark:backdrop-blur-sm rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-orange-500/10 p-8 hover:shadow-2xl dark:hover:shadow-orange-500/30 transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-orange-500 dark:hover:border-orange-400">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mb-6 group-hover:scale-110 transition-transform">
                  <FaBook className="text-white text-2xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                  Browse Top Recipes
                </h2>
                <p className="text-gray-600 dark:text-gray-200 leading-relaxed">
                  Explore our curated collection of amazing recipes from around the world. Filter by cuisine, difficulty, dietary preferences, and more.
                </p>
                <div className="mt-6 text-orange-500 dark:text-orange-400 font-medium group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors">
                  Explore Recipes →
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Info */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-600 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-orange-500/20 p-8 text-white max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4 text-white">Find Your Perfect Recipe</h3>
              <p className="text-orange-50 dark:text-orange-100">
                Whether you're looking for a quick weekday meal or planning a special dinner, 
                Foodiee helps you discover recipes that match your preferences and available ingredients.
              </p>
            </div>
          </div>
        </main>
      </AuthGate>
    </div>
  );
}
