/**
 * TopRecipes Component
 * ====================
 * Main component for browsing and filtering top recipes
 */

'use client';

import { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaUtensils } from 'react-icons/fa';
import RecipeCard from './RecipeCard';
import RecipeFilters from './RecipeFilters';
import RecipeDetailModal from './RecipeDetailModal';
import {
  RecipeFilters as IRecipeFilters,
  TopRecipeSummary,
  fetchTopRecipes,
} from '@/services/topRecipesApi';

export default function TopRecipes() {
  const [filters, setFilters] = useState<IRecipeFilters>({
    page: 1,
    page_size: 12,
    detailed: false,
    sort_by: 'popularity_score',
    sort_order: 'DESC',
  });

  const [recipes, setRecipes] = useState<TopRecipeSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);

  // Fetch recipes whenever filters change
  useEffect(() => {
    loadRecipes();
  }, [filters]);

  const loadRecipes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchTopRecipes(filters);
      setRecipes(response.recipes as TopRecipeSummary[]);
      setTotalCount(response.total_count);
      setTotalPages(response.total_pages);
    } catch (err: any) {
      setError(err.message || 'Failed to load recipes');
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: IRecipeFilters) => {
    setFilters(newFilters);
  };

  const handleRecipeClick = (recipe: TopRecipeSummary) => {
    setSelectedRecipeId(recipe.id);
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center gap-4 mb-3">
          <FaUtensils className="text-4xl" />
          <h2 className="text-4xl font-bold">Top Recipes</h2>
        </div>
        <p className="text-orange-100 text-lg">
          Discover our curated collection of {totalCount.toLocaleString()} amazing recipes from around the world
        </p>
      </div>

      {/* Filters */}
      <RecipeFilters filters={filters} onChange={handleFilterChange} />

      {/* Results Count */}
      {!loading && recipes.length > 0 && (
        <div className="text-gray-600 dark:text-gray-400">
          Showing {((filters.page || 1) - 1) * (filters.page_size || 12) + 1} -{' '}
          {Math.min((filters.page || 1) * (filters.page_size || 12), totalCount)} of{' '}
          {totalCount.toLocaleString()} recipes
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg text-orange-500"></span>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading delicious recipes...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-100 dark:bg-red-900 border-2 border-red-500 text-red-800 dark:text-red-200 p-6 rounded-xl text-center">
          <p className="font-bold text-lg mb-2">Oops! Something went wrong</p>
          <p>{error}</p>
          <button
            onClick={loadRecipes}
            className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* No Results */}
      {!loading && !error && recipes.length === 0 && (
        <div className="bg-gray-100 dark:bg-gray-800 p-12 rounded-xl text-center">
          <FaUtensils className="text-6xl text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
            No recipes found
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your filters or search terms
          </p>
        </div>
      )}

      {/* Recipe Grid */}
      {!loading && recipes.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={handleRecipeClick}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-8">
              <button
                onClick={() => handlePageChange((filters.page || 1) - 1)}
                disabled={filters.page === 1}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaChevronLeft />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {/* First page */}
                {filters.page && filters.page > 3 && (
                  <>
                    <button
                      onClick={() => handlePageChange(1)}
                      className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      1
                    </button>
                    <span className="text-gray-500">...</span>
                  </>
                )}

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    const currentPage = filters.page || 1;
                    return page >= currentPage - 2 && page <= currentPage + 2;
                  })
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        page === filters.page
                          ? 'bg-orange-500 text-white border-2 border-orange-500'
                          : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                {/* Last page */}
                {filters.page && filters.page < totalPages - 2 && (
                  <>
                    <span className="text-gray-500">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => handlePageChange((filters.page || 1) + 1)}
                disabled={filters.page === totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <FaChevronRight />
              </button>
            </div>
          )}
        </>
      )}

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        recipeId={selectedRecipeId}
        onClose={() => setSelectedRecipeId(null)}
      />
    </div>
  );
}
