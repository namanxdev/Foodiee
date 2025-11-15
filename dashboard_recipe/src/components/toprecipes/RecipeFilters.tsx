/**
 * RecipeFilters Component
 * =======================
 * Advanced filtering UI for top recipes
 */

import { useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { RecipeFilters, AvailableFilters, fetchAvailableFilters } from '@/services/topRecipesApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
        <Input
          type="text"
          placeholder="Search recipes, ingredients, or cooking steps..."
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-12 rounded-2xl border border-white/20 bg-white/[0.08] pl-11 pr-4 text-base text-white placeholder:text-white/40 shadow-lg shadow-black/40 backdrop-blur-2xl transition-all hover:bg-white/[0.12] hover:border-white/30 focus:bg-white/[0.12] focus:border-white/30"
        />
      </div>

      {/* Quick Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Region Filter */}
        <select
          value={filters.region || ''}
          onChange={(e) => onChange({ ...filters, region: e.target.value || undefined, page: 1 })}
          aria-label="Filter by cuisine region"
          className="h-10 rounded-2xl border border-white/20 bg-white/[0.08] px-4 py-2 text-sm text-white backdrop-blur-2xl transition-all hover:bg-white/[0.12] hover:border-white/30 focus:bg-white/[0.12] focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
        >
          <option value="" className="bg-[#050505]">All Cuisines</option>
          {availableFilters?.regions.map((region) => (
            <option key={region} value={region} className="bg-[#050505]">
              {region}
            </option>
          ))}
        </select>

        {/* Difficulty Filter */}
        <select
          value={filters.difficulty || ''}
          onChange={(e) => onChange({ ...filters, difficulty: e.target.value || undefined, page: 1 })}
          aria-label="Filter by difficulty level"
          className="h-10 rounded-2xl border border-white/20 bg-white/[0.08] px-4 py-2 text-sm text-white backdrop-blur-2xl transition-all hover:bg-white/[0.12] hover:border-white/30 focus:bg-white/[0.12] focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
        >
          <option value="" className="bg-[#050505]">All Difficulties</option>
          {availableFilters?.difficulties.map((difficulty) => (
            <option key={difficulty} value={difficulty} className="bg-[#050505]">
              {difficulty}
            </option>
          ))}
        </select>

        {/* Sorting */}
        <select
          value={filters.sort_by || 'popularity_score'}
          onChange={(e) => onChange({ ...filters, sort_by: e.target.value, page: 1 })}
          aria-label="Sort recipes"
          className="h-10 rounded-2xl border border-white/20 bg-white/[0.08] px-4 py-2 text-sm text-white backdrop-blur-2xl transition-all hover:bg-white/[0.12] hover:border-white/30 focus:bg-white/[0.12] focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
        >
          <option value="popularity_score" className="bg-[#050505]">Most Popular</option>
          <option value="rating" className="bg-[#050505]">Highest Rated</option>
          <option value="total_time_minutes" className="bg-[#050505]">Quickest</option>
          <option value="name" className="bg-[#050505]">Alphabetical</option>
          <option value="created_at" className="bg-[#050505]">Newest</option>
        </select>

        {/* Advanced Filters Toggle */}
        <Button
          type="button"
          variant={showAdvanced ? "gradient" : "ghost"}
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`gap-2 rounded-full ${
            showAdvanced
              ? ""
              : "border border-white/20 bg-white/[0.08] text-white/80 hover:bg-white/[0.15] hover:border-white/30 hover:text-white backdrop-blur-2xl"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Advanced
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="gap-2 rounded-full border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:border-red-400/60"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Advanced Filters Section */}
      {showAdvanced && (
        <div className="pt-4 border-t border-white/10 space-y-6">
          {/* Meal Types */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              Meal Types
            </label>
            <div className="flex flex-wrap gap-2">
              {availableFilters?.meal_types.map((mealType) => {
                const isSelected = filters.meal_types?.includes(mealType);
                return (
                  <Button
                    key={mealType}
                    type="button"
                    variant={isSelected ? "gradient" : "ghost"}
                    size="sm"
                    onClick={() => toggleMealType(mealType)}
                    className={`rounded-full ${
                      isSelected
                        ? ""
                        : "border border-white/20 bg-white/[0.08] text-white/80 hover:bg-white/[0.15] hover:border-white/30 hover:text-white backdrop-blur-2xl"
                    }`}
                  >
                    {mealType}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Dietary Tags */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              Dietary Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {availableFilters?.dietary_tags.map((tag) => {
                const isSelected = filters.dietary_tags?.includes(tag);
                return (
                  <Button
                    key={tag}
                    type="button"
                    variant={isSelected ? "gradient" : "ghost"}
                    size="sm"
                    onClick={() => toggleDietaryTag(tag)}
                    className={`rounded-full ${
                      isSelected
                        ? ""
                        : "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200/90 hover:bg-emerald-500/20 hover:border-emerald-400/50 hover:text-emerald-200 backdrop-blur-2xl"
                    }`}
                  >
                    {tag}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Time and Rating Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Max Time */}
            <div>
              <label htmlFor="max-time-slider" className="block text-sm font-medium text-white/80 mb-3">
                Max Cooking Time: {filters.max_time ? `${filters.max_time} min` : 'Any'}
              </label>
              <input
                id="max-time-slider"
                type="range"
                min="15"
                max="180"
                step="15"
                value={filters.max_time || 180}
                onChange={(e) => onChange({ ...filters, max_time: parseInt(e.target.value), page: 1 })}
                aria-label="Maximum cooking time in minutes"
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-xs text-white/50 mt-2">
                <span>15 min</span>
                <span>3 hours</span>
              </div>
            </div>

            {/* Min Rating */}
            <div>
              <label htmlFor="min-rating-slider" className="block text-sm font-medium text-white/80 mb-3">
                Minimum Rating: {filters.min_rating ? `${filters.min_rating.toFixed(1)} ⭐` : 'Any'}
              </label>
              <input
                id="min-rating-slider"
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={filters.min_rating || 0}
                onChange={(e) => onChange({ ...filters, min_rating: parseFloat(e.target.value), page: 1 })}
                aria-label="Minimum recipe rating"
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-xs text-white/50 mt-2">
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
