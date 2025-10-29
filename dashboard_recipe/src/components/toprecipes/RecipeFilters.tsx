/**
 * RecipeFilters Component
 * =======================
 * Advanced filtering UI for top recipes
 */

import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaTimes, FaSlidersH } from 'react-icons/fa';
import { RecipeFilters, AvailableFilters, fetchAvailableFilters } from '@/services/topRecipesApi';

interface RecipeFiltersProps {
  filters: RecipeFilters;
  onChange: (filters: RecipeFilters) => void;
}

export default function RecipeFiltersComponent({ filters, onChange }: RecipeFiltersProps) {
  const [availableFilters, setAvailableFilters] = useState<AvailableFilters | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  // Load available filters on mount
  useEffect(() => {
    fetchAvailableFilters()
      .then(setAvailableFilters)
      .catch(console.error);
  }, []);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    // Debounce search - update filters after user stops typing
    const timeoutId = setTimeout(() => {
      onChange({ ...filters, search: value || undefined, page: 1 });
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const toggleMealType = (mealType: string) => {
    const current = filters.meal_types || [];
    const updated = current.includes(mealType)
      ? current.filter((t) => t !== mealType)
      : [...current, mealType];
    onChange({ ...filters, meal_types: updated.length > 0 ? updated : undefined, page: 1 });
  };

  const toggleDietaryTag = (tag: string) => {
    const current = filters.dietary_tags || [];
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    onChange({ ...filters, dietary_tags: updated.length > 0 ? updated : undefined, page: 1 });
  };

  const clearFilters = () => {
    setLocalSearch('');
    onChange({
      page: 1,
      page_size: filters.page_size,
      detailed: filters.detailed,
    });
  };

  const hasActiveFilters = 
    filters.region || 
    filters.difficulty || 
    (filters.meal_types && filters.meal_types.length > 0) ||
    (filters.dietary_tags && filters.dietary_tags.length > 0) ||
    filters.max_time ||
    filters.min_rating ||
    filters.search;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search recipes, ingredients, or cooking steps..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Quick Filters Row */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Region Filter */}
        <select
          value={filters.region || ''}
          onChange={(e) => onChange({ ...filters, region: e.target.value || undefined, page: 1 })}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Cuisines</option>
          {availableFilters?.regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>

        {/* Difficulty Filter */}
        <select
          value={filters.difficulty || ''}
          onChange={(e) => onChange({ ...filters, difficulty: e.target.value || undefined, page: 1 })}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Difficulties</option>
          {availableFilters?.difficulties.map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficulty}
            </option>
          ))}
        </select>

        {/* Sorting */}
        <select
          value={filters.sort_by || 'popularity_score'}
          onChange={(e) => onChange({ ...filters, sort_by: e.target.value, page: 1 })}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500"
        >
          <option value="popularity_score">Most Popular</option>
          <option value="rating">Highest Rated</option>
          <option value="total_time_minutes">Quickest</option>
          <option value="name">Alphabetical</option>
          <option value="created_at">Newest</option>
        </select>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            showAdvanced
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <FaSlidersH />
          Advanced
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
          >
            <FaTimes />
            Clear Filters
          </button>
        )}
      </div>

      {/* Advanced Filters Section */}
      {showAdvanced && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          {/* Meal Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meal Types
            </label>
            <div className="flex flex-wrap gap-2">
              {availableFilters?.meal_types.map((mealType) => (
                <button
                  key={mealType}
                  onClick={() => toggleMealType(mealType)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filters.meal_types?.includes(mealType)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {mealType}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dietary Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {availableFilters?.dietary_tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleDietaryTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filters.dietary_tags?.includes(tag)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Time and Rating Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Max Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Cooking Time: {filters.max_time ? `${filters.max_time} min` : 'Any'}
              </label>
              <input
                type="range"
                min="15"
                max="180"
                step="15"
                value={filters.max_time || 180}
                onChange={(e) => onChange({ ...filters, max_time: parseInt(e.target.value), page: 1 })}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>15 min</span>
                <span>3 hours</span>
              </div>
            </div>

            {/* Min Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Rating: {filters.min_rating ? `${filters.min_rating.toFixed(1)} ⭐` : 'Any'}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={filters.min_rating || 0}
                onChange={(e) => onChange({ ...filters, min_rating: parseFloat(e.target.value), page: 1 })}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>0 ⭐</span>
                <span>5 ⭐</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
