/**
 * Data Manager Tab Component
 * View, edit, and delete recipes with pagination
 * Features: Image gallery, click-to-view, read more, comprehensive editing
 */

'use client';

import { useState, useEffect } from 'react';
import { listRecipes, updateRecipe, getStatistics, searchRecipes, deleteRecipe } from '@/services/recipeAdminAPI';
import type { Recipe, RecipeStatistics, StepImage, Ingredient } from '@/types/recipeAdmin';
import { REGIONS } from '@/constants/regions';

// Image Modal Component
function ImageModal({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="relative max-w-6xl max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-white text-black rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold hover:bg-gray-200"
        >
          ✕
        </button>
        <img
          src={imageUrl}
          alt="Full size"
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

// Image Gallery Component with Navigation
function ImageGallery({ images, title, color = "blue" }: { images: (string | StepImage)[]; title: string; color?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const getImageUrl = (img: string | StepImage): string => {
    return typeof img === 'string' ? img : img.url;
  };

  const getStepIndex = (img: string | StepImage, idx: number): number => {
    return typeof img === 'string' ? idx : (img.step_index !== null ? img.step_index : idx);
  };

  const displayImages = isExpanded ? images : images.slice(0, 6);
  const hasMore = images.length > 6;

  const colorClasses = {
    blue: 'bg-blue-600/90',
    green: 'bg-green-600/90',
    purple: 'bg-purple-600/90',
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-300">{title}</span>
        <span className="text-xs text-green-400">{images.length} images</span>
      </div>

      {images.length > 0 ? (
        <>
          {/* Main display image */}
          <div className="relative mb-3">
            <img
              src={getImageUrl(images[currentIndex])}
              alt={`${title} ${currentIndex + 1}`}
              className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
              onClick={() => setViewingImage(getImageUrl(images[currentIndex]))}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666">Error</text></svg>';
              }}
            />
            <div className="absolute top-2 left-2 bg-black/70 text-white text-sm px-2 py-1 rounded">
              {currentIndex + 1} / {images.length}
            </div>
            
            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentIndex((currentIndex - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white w-10 h-10 rounded-full flex items-center justify-center"
                >
                  ←
                </button>
                <button
                  onClick={() => setCurrentIndex((currentIndex + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white w-10 h-10 rounded-full flex items-center justify-center"
                >
                  →
                </button>
              </>
            )}
          </div>

          {/* Thumbnail grid */}
          <div className="grid grid-cols-6 gap-2">
            {displayImages.map((img, idx) => (
              <div
                key={idx}
                className={`relative cursor-pointer ${currentIndex === idx ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              >
                <img
                  src={getImageUrl(img)}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-16 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666" font-size="10">!</text></svg>';
                  }}
                />
                <span className={`absolute top-1 left-1 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} text-white text-xs px-1 rounded`}>
                  {getStepIndex(img, idx) + 1}
                </span>
              </div>
            ))}
          </div>

          {/* Expand/Collapse button */}
          {hasMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              {isExpanded ? '▲ Show Less' : `▼ Show All (${images.length} images)`}
            </button>
          )}
        </>
      ) : (
        <div className="bg-gray-700 p-4 rounded text-sm text-gray-400 italic text-center">
          No images available
        </div>
      )}

      {viewingImage && <ImageModal imageUrl={viewingImage} onClose={() => setViewingImage(null)} />}
    </div>
  );
}

// Read More Component with Shadow
function ReadMoreSection({ title, content, color = "green" }: { title: string; content: string[]; color?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const showReadMore = content && content.length > 3;

  const colorClasses = {
    green: 'text-green-400',
    orange: 'text-orange-400',
    blue: 'text-blue-400',
  };

  return (
    <div className="mb-4">
      <h4 className={`text-sm font-semibold ${colorClasses[color as keyof typeof colorClasses] || colorClasses.green} mb-2`}>{title}</h4>
      {content && content.length > 0 ? (
        <div className="relative">
          <div
            className={`bg-gray-700 p-3 rounded space-y-2 transition-all duration-300 ${
              isExpanded ? 'max-h-none' : 'max-h-60 overflow-hidden'
            }`}
          >
            {content.map((step, idx) => (
              <div key={idx} className="flex gap-2 text-sm">
                <span className={`${colorClasses[color as keyof typeof colorClasses] || colorClasses.green} font-bold min-w-[24px]`}>
                  {idx + 1}.
                </span>
                <span className="text-gray-300">{step}</span>
              </div>
            ))}
          </div>
          
          {/* Shadow overlay and Read More button */}
          {showReadMore && !isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-700 to-transparent flex items-end justify-center pb-2">
              <button
                onClick={() => setIsExpanded(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold shadow-lg"
              >
                Read More
              </button>
            </div>
          )}
          
          {/* Collapse button */}
          {showReadMore && isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="w-full mt-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
            >
              ▲ Show Less
            </button>
          )}
        </div>
      ) : (
        <div className="bg-gray-700 p-3 rounded text-sm text-gray-400 italic">
          No {title.toLowerCase()} - use Mass Generation to create
        </div>
      )}
    </div>
  );
}

export function DataManagerTab() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [statistics, setStatistics] = useState<RecipeStatistics | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<Partial<Recipe>>({});
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [jumpToPage, setJumpToPage] = useState('');

  useEffect(() => {
    loadRecipes();
    loadStatistics();
  }, [page, pageSize, filter, regionFilter, sortBy, sortOrder]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const response = await listRecipes({
        skip: page * pageSize,
        limit: pageSize,
        validation_status: filter || undefined,
        cuisine: regionFilter || undefined,
        sort_by: sortBy || undefined,
        sort_order: sortOrder || undefined,
      });
      setRecipes(response.recipes);
    } catch (error) {
      console.error('Failed to load recipes:', error);
      alert(`Failed to load recipes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await getStatistics();
      setStatistics(response.statistics);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setLoading(true);
      setIsSearching(true);
      const response = await searchRecipes(searchQuery);
      setSearchResults(response.recipes);
    } catch (error) {
      console.error('Search failed:', error);
      alert(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const clearFilters = () => {
    setFilter('');
    setRegionFilter('');
    setSortBy('');
    setSortOrder('asc');
    setPage(0);
  };

  const handleDelete = async () => {
    if (!selectedRecipe) return;
    
    if (!confirm(`Are you sure you want to delete "${selectedRecipe.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteRecipe(selectedRecipe.id);
      alert('Recipe deleted successfully!');
      setSelectedRecipe(null);
      await loadRecipes();
      await loadStatistics();
    } catch (error) {
      alert(`Failed to delete recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSave = async () => {
    if (!selectedRecipe || Object.keys(editedFields).length === 0) return;

    try {
      await updateRecipe(selectedRecipe.id, editedFields);
      alert('Recipe updated successfully!');
      setIsEditing(false);
      setEditedFields({});
      await loadRecipes();
      // Update selected recipe with new data
      const response = await listRecipes({ skip: 0, limit: 1000 });
      const updated = response.recipes.find(r => r.id === selectedRecipe.id);
      if (updated) setSelectedRecipe(updated);
    } catch (error) {
      alert(`Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold">{statistics.total_recipes}</div>
            <div className="text-sm text-gray-400">Total</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">{statistics.missing_data.main_images}</div>
            <div className="text-sm text-gray-400">No Main Image</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-400">{statistics.missing_data.ingredients_images}</div>
            <div className="text-sm text-gray-400">No Ingredient Image</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400">{statistics.missing_data.steps_images}</div>
            <div className="text-sm text-gray-400">No Step Images</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{statistics.missing_data.steps_beginner}</div>
            <div className="text-sm text-gray-400">No Beginner Steps</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recipe List */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-3">📊 Recipes</h2>
            
            {/* Search Bar */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search recipes by name..."
                className="flex-1 px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500 outline-none"
              />
              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm font-semibold"
              >
                🔍 Search
              </button>
              {isSearching && (
                <button
                  onClick={clearSearch}
                  className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 text-sm font-semibold"
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {/* Filters Toggle Button */}
            {!isSearching && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm font-semibold flex items-center justify-between border border-gray-600"
              >
                <span>🔍 Filters & Sorting</span>
                <span>{showFilters ? '▲' : '▼'}</span>
              </button>
            )}

            {/* Collapsible Filter Panel */}
            {!isSearching && showFilters && (
              <div className="space-y-3 p-3 bg-gray-750 rounded border border-gray-600">
                {/* Region Filter */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Filter by Region:</label>
                  <select
                    value={regionFilter}
                    onChange={(e) => { setRegionFilter(e.target.value); setPage(0); }}
                    className="w-full px-3 py-2 rounded bg-gray-700 text-sm border border-gray-600"
                  >
                    <option value="">All Regions</option>
                    {REGIONS.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Filter by Status:</label>
                  <select
                    value={filter}
                    onChange={(e) => { setFilter(e.target.value); setPage(0); }}
                    className="w-full px-3 py-2 rounded bg-gray-700 text-sm border border-gray-600"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="validated">Validated</option>
                    <option value="needs_fixing">Needs Fixing</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Sort By:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
                    className="w-full px-3 py-2 rounded bg-gray-700 text-sm border border-gray-600"
                  >
                    <option value="">Default</option>
                    <option value="name">Recipe Name</option>
                    <option value="id">Recipe ID</option>
                    <option value="region">Region</option>
                  </select>
                </div>

                {/* Sort Order */}
                {sortBy && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Sort Order:</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSortOrder('asc')}
                        className={`flex-1 px-3 py-2 rounded text-sm font-semibold ${
                          sortOrder === 'asc' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        ↑ Ascending
                      </button>
                      <button
                        onClick={() => setSortOrder('desc')}
                        className={`flex-1 px-3 py-2 rounded text-sm font-semibold ${
                          sortOrder === 'desc' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        ↓ Descending
                      </button>
                    </div>
                  </div>
                )}

                {/* Clear Filters Button */}
                {(filter || regionFilter || sortBy) && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-sm font-semibold"
                  >
                    ✕ Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(isSearching ? searchResults : recipes).length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {isSearching ? 'No recipes found' : 'No recipes'}
                </div>
              ) : (
                (isSearching ? searchResults : recipes).map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => setSelectedRecipe(recipe)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedRecipe?.id === recipe.id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-semibold">{recipe.name}</div>
                    <div className="text-xs text-gray-400 flex gap-2 mt-1">
                      <span>{recipe.region}</span>
                      <span>•</span>
                      <span>{recipe.validation_status || 'pending'}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {!isSearching && (
            <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
              {/* Page size selector */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Show per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(0); // Reset to first page when changing page size
                  }}
                  className="px-3 py-1 rounded bg-gray-700 text-white border border-gray-600"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Navigation controls */}
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  ← Previous
                </button>
                
                {/* Current page indicator */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Page</span>
                  <span className="px-3 py-1 bg-blue-600 rounded font-semibold min-w-[40px] text-center">
                    {page + 1}
                  </span>
                </div>

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={recipes.length < pageSize}
                  className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next →
                </button>
              </div>

              {/* Jump to page */}
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-gray-400">Jump to:</span>
                <input
                  type="number"
                  min="1"
                  value={jumpToPage}
                  onChange={(e) => setJumpToPage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && jumpToPage) {
                      const targetPage = parseInt(jumpToPage) - 1;
                      if (targetPage >= 0) {
                        setPage(targetPage);
                        setJumpToPage('');
                      }
                    }
                  }}
                  placeholder="Page #"
                  className="w-20 px-2 py-1 rounded bg-gray-700 text-white border border-gray-600 text-center"
                />
                <button
                  onClick={() => {
                    if (jumpToPage) {
                      const targetPage = parseInt(jumpToPage) - 1;
                      if (targetPage >= 0) {
                        setPage(targetPage);
                        setJumpToPage('');
                      }
                    }
                  }}
                  disabled={!jumpToPage}
                  className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  Go
                </button>
              </div>
            </div>
          )}
          {isSearching && (
            <div className="mt-4 pt-4 border-t border-gray-700 text-center text-sm text-gray-400">
              Found {searchResults.length} recipe(s)
            </div>
          )}
        </div>

        {/* Recipe Details/Edit */}
        {selectedRecipe && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">✏️ Recipe Details</h2>
                <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs font-mono border border-gray-600">
                  ID: #{selectedRecipe.id}
                </span>
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditedFields({
                          name: selectedRecipe.name,
                          description: selectedRecipe.description,
                          region: selectedRecipe.region,
                          difficulty: selectedRecipe.difficulty,
                          prep_time_minutes: selectedRecipe.prep_time_minutes,
                          cook_time_minutes: selectedRecipe.cook_time_minutes,
                          servings: selectedRecipe.servings,
                          calories: selectedRecipe.calories,
                          rating: selectedRecipe.rating,
                          image_url: selectedRecipe.image_url,
                          ingredients_image: selectedRecipe.ingredients_image,
                          ingredients: selectedRecipe.ingredients,
                          steps_beginner: selectedRecipe.steps_beginner,
                          steps_advanced: selectedRecipe.steps_advanced,
                          steps_beginner_images: selectedRecipe.steps_beginner_images,
                          steps_advanced_images: selectedRecipe.steps_advanced_images,
                        });
                      }}
                      className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-sm font-semibold"
                    >
                      📝 Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-sm font-semibold"
                    >
                      🗑️ Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-sm font-semibold"
                    >
                      ✓ Save
                    </button>
                    <button
                      onClick={() => { setIsEditing(false); setEditedFields({}); }}
                      className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 text-sm font-semibold"
                    >
                      ✕ Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">Name *</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedFields.name ?? selectedRecipe.name}
                      onChange={(e) => setEditedFields({...editedFields, name: e.target.value})}
                      className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none"
                    />
                  ) : (
                    <div className="text-gray-300">{selectedRecipe.name}</div>
                  )}
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Region</label>
                  {isEditing ? (
                    <select
                      value={editedFields.region ?? selectedRecipe.region}
                      onChange={(e) => setEditedFields({...editedFields, region: e.target.value})}
                      className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
                    >
                      <option value="North Indian">North Indian</option>
                      <option value="South Indian">South Indian</option>
                      <option value="East Indian">East Indian</option>
                      <option value="West Indian">West Indian</option>
                      <option value="International">International</option>
                    </select>
                  ) : (
                    <div className="text-gray-300">{selectedRecipe.region}</div>
                  )}
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Difficulty</label>
                  {isEditing ? (
                    <select
                      value={editedFields.difficulty ?? selectedRecipe.difficulty}
                      onChange={(e) => setEditedFields({...editedFields, difficulty: e.target.value})}
                      className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  ) : (
                    <div className="text-gray-300">{selectedRecipe.difficulty}</div>
                  )}
                </div>

                {/* Prep Time */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Prep Time (min)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedFields.prep_time_minutes ?? selectedRecipe.prep_time_minutes}
                      onChange={(e) => setEditedFields({...editedFields, prep_time_minutes: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
                    />
                  ) : (
                    <div className="text-gray-300">{selectedRecipe.prep_time_minutes} min</div>
                  )}
                </div>

                {/* Cook Time */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Cook Time (min)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedFields.cook_time_minutes ?? selectedRecipe.cook_time_minutes}
                      onChange={(e) => setEditedFields({...editedFields, cook_time_minutes: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
                    />
                  ) : (
                    <div className="text-gray-300">{selectedRecipe.cook_time_minutes} min</div>
                  )}
                </div>

                {/* Servings */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Servings</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedFields.servings ?? selectedRecipe.servings}
                      onChange={(e) => setEditedFields({...editedFields, servings: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
                    />
                  ) : (
                    <div className="text-gray-300">{selectedRecipe.servings}</div>
                  )}
                </div>

                {/* Calories */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Calories</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedFields.calories ?? selectedRecipe.calories}
                      onChange={(e) => setEditedFields({...editedFields, calories: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
                    />
                  ) : (
                    <div className="text-gray-300">{selectedRecipe.calories} kcal</div>
                  )}
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Rating</label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={editedFields.rating ?? selectedRecipe.rating}
                      onChange={(e) => setEditedFields({...editedFields, rating: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
                    />
                  ) : (
                    <div className="text-gray-300">⭐ {selectedRecipe.rating?.toFixed(1) || 'N/A'}</div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                {isEditing ? (
                  <textarea
                    value={editedFields.description ?? selectedRecipe.description ?? ''}
                    onChange={(e) => setEditedFields({...editedFields, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none"
                  />
                ) : (
                  <div className="text-gray-300 text-sm">{selectedRecipe.description || 'N/A'}</div>
                )}
              </div>

              {/* Ingredients Editor */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold">🥘 Ingredients</label>
                  {isEditing && (
                    <button
                      onClick={() => {
                        const currentIngredients = editedFields.ingredients ?? selectedRecipe.ingredients ?? [];
                        setEditedFields({
                          ...editedFields,
                          ingredients: [...currentIngredients, { name: '', ingredient: '', quantity: '', unit: '' }]
                        });
                      }}
                      className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 rounded"
                    >
                      + Add Ingredient
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {(editedFields.ingredients ?? selectedRecipe.ingredients ?? []).map((ing: Ingredient | string, idx: number) => {
                      const ingObj = typeof ing === 'string' ? { name: ing, quantity: '', unit: '' } : ing;
                      return (
                      <div key={idx} className="flex gap-2 items-start bg-gray-700 p-2 rounded">
                        <span className="text-gray-400 text-sm mt-2 min-w-[24px]">{idx + 1}.</span>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Ingredient name"
                            value={ingObj.name || ''}
                            onChange={(e) => {
                              const currentIngredients = editedFields.ingredients ?? selectedRecipe.ingredients ?? [];
                              const ingredientsArray = Array.isArray(currentIngredients) ? currentIngredients : [];
                              const newIngredients = [...ingredientsArray];
                              const currentIng = typeof newIngredients[idx] === 'string' 
                                ? { name: newIngredients[idx] as string, quantity: '', unit: '' } 
                                : (newIngredients[idx] as Ingredient);
                              newIngredients[idx] = { ...currentIng, name: e.target.value };
                              setEditedFields({ ...editedFields, ingredients: newIngredients });
                            }}
                            className="px-2 py-1 rounded bg-gray-800 text-white border border-gray-600 text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Quantity"
                            value={ingObj.quantity || ''}
                            onChange={(e) => {
                              const currentIngredients = editedFields.ingredients ?? selectedRecipe.ingredients ?? [];
                              const ingredientsArray = Array.isArray(currentIngredients) ? currentIngredients : [];
                              const newIngredients = [...ingredientsArray];
                              const currentIng = typeof newIngredients[idx] === 'string' 
                                ? { name: newIngredients[idx] as string, quantity: '', unit: '' } 
                                : (newIngredients[idx] as Ingredient);
                              newIngredients[idx] = { ...currentIng, quantity: e.target.value };
                              setEditedFields({ ...editedFields, ingredients: newIngredients });
                            }}
                            className="px-2 py-1 rounded bg-gray-800 text-white border border-gray-600 text-sm"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const currentIngredients = editedFields.ingredients ?? selectedRecipe.ingredients ?? [];
                            const ingredientsArray = Array.isArray(currentIngredients) ? currentIngredients : [];
                            const newIngredients = ingredientsArray.filter((_, i: number) => i !== idx);
                            setEditedFields({ ...editedFields, ingredients: newIngredients });
                          }}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                          title="Delete ingredient"
                        >
                          🗑️
                        </button>
                      </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-gray-700 p-3 rounded space-y-1 max-h-60 overflow-y-auto">
                    {(Array.isArray(selectedRecipe.ingredients) ? selectedRecipe.ingredients : []).map((ing: Ingredient | string, idx: number) => {
                      const ingName = typeof ing === 'string' ? ing : (ing.name || 'N/A');
                      return (
                      <div key={idx} className="flex gap-2 text-sm">
                        <span className="text-blue-400 font-bold min-w-[24px]">{idx + 1}.</span>
                        <span className="text-gray-300 flex-1">{ingName}</span>
                        {typeof ing === 'object' && (
                          <span className="text-green-400">{ing.quantity || ''}</span>
                        )}
                      </div>
                      );
                    })}
                    {(!selectedRecipe.ingredients || !Array.isArray(selectedRecipe.ingredients) || selectedRecipe.ingredients.length === 0) && (
                      <div className="text-gray-400 italic text-sm">No ingredients listed</div>
                    )}
                  </div>
                )}
              </div>

              {/* Images Section */}
              <div className="border-t border-gray-700 pt-4">
                <label className="block text-sm font-semibold mb-3">📸 Images</label>

                {/* Main Image */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-300">Main Cover Image</span>
                    <span className={`text-xs ${selectedRecipe.image_url ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedRecipe.image_url ? '✓ Set' : '✗ Not Set'}
                    </span>
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="https://example.com/image.jpg"
                        value={editedFields.image_url ?? selectedRecipe.image_url ?? ''}
                        onChange={(e) => setEditedFields({ ...editedFields, image_url: e.target.value })}
                        className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 text-sm"
                      />
                      {(editedFields.image_url ?? selectedRecipe.image_url) && (
                        <div className="flex gap-2">
                          <img
                            src={editedFields.image_url ?? selectedRecipe.image_url}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded cursor-pointer"
                            onClick={() => setViewingImage(editedFields.image_url ?? selectedRecipe.image_url)}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666">Invalid URL</text></svg>';
                            }}
                          />
                          <button
                            onClick={() => setEditedFields({ ...editedFields, image_url: '' })}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm h-fit"
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    selectedRecipe.image_url ? (
                      <img
                        src={selectedRecipe.image_url}
                        alt={selectedRecipe.name}
                        className="w-full h-40 object-cover rounded cursor-pointer hover:opacity-90 transition"
                        onClick={() => setViewingImage(selectedRecipe.image_url!)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666">Error Loading</text></svg>';
                        }}
                      />
                    ) : (
                      <div className="bg-gray-700 p-3 rounded text-sm text-gray-400 italic text-center">
                        No image URL set
                      </div>
                    )
                  )}
                </div>

                {/* Ingredients Image */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-300">Ingredients Image</span>
                    <span className={`text-xs ${selectedRecipe.ingredients_image ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedRecipe.ingredients_image ? '✓ Set' : '✗ Not Set'}
                    </span>
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="https://example.com/ingredients.jpg"
                        value={editedFields.ingredients_image ?? selectedRecipe.ingredients_image ?? ''}
                        onChange={(e) => setEditedFields({ ...editedFields, ingredients_image: e.target.value })}
                        className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 text-sm"
                      />
                      {(editedFields.ingredients_image ?? selectedRecipe.ingredients_image) && (
                        <div className="flex gap-2">
                          <img
                            src={editedFields.ingredients_image ?? selectedRecipe.ingredients_image}
                            alt="Ingredients Preview"
                            className="w-32 h-32 object-cover rounded cursor-pointer"
                            onClick={() => setViewingImage(editedFields.ingredients_image ?? selectedRecipe.ingredients_image!)}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666">Invalid URL</text></svg>';
                            }}
                          />
                          <button
                            onClick={() => setEditedFields({ ...editedFields, ingredients_image: '' })}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm h-fit"
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    selectedRecipe.ingredients_image ? (
                      <img
                        src={selectedRecipe.ingredients_image}
                        alt="Ingredients"
                        className="w-full h-40 object-cover rounded cursor-pointer hover:opacity-90 transition"
                        onClick={() => setViewingImage(selectedRecipe.ingredients_image!)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666">Error Loading</text></svg>';
                        }}
                      />
                    ) : (
                      <div className="bg-gray-700 p-3 rounded text-sm text-gray-400 italic text-center">
                        No ingredients image URL set
                      </div>
                    )
                  )}
                </div>

                {/* Step Images - Beginner */}
                {!isEditing && selectedRecipe.steps_beginner_images && selectedRecipe.steps_beginner_images.length > 0 && (
                  <ImageGallery
                    images={selectedRecipe.steps_beginner_images}
                    title="Step Images (Beginner)"
                    color="green"
                  />
                )}

                {/* Step Images - Advanced */}
                {!isEditing && selectedRecipe.steps_advanced_images && selectedRecipe.steps_advanced_images.length > 0 && (
                  <ImageGallery
                    images={selectedRecipe.steps_advanced_images}
                    title="Step Images (Advanced)"
                    color="purple"
                  />
                )}

                {/* Edit mode for step images */}
                {isEditing && (
                  <div className="space-y-4">
                    <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3 text-sm text-yellow-200">
                      <strong>Note:</strong> Step images are managed by step_index. Edit the JSON structure carefully.
                    </div>
                    {/* TODO: Add advanced editor for step images if needed */}
                  </div>
                )}
              </div>

              {/* Steps Section with Read More */}
              <div className="border-t border-gray-700 pt-4">
                <label className="block text-sm font-semibold mb-3">📝 Steps Content</label>

                {/* Beginner Steps */}
                {isEditing ? (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-green-400">Beginner Steps</h4>
                      <button
                        onClick={() => {
                          const current = editedFields.steps_beginner ?? selectedRecipe.steps_beginner ?? [];
                          setEditedFields({ ...editedFields, steps_beginner: [...current, ''] });
                        }}
                        className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 rounded"
                      >
                        + Add Step
                      </button>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {(editedFields.steps_beginner ?? selectedRecipe.steps_beginner ?? []).map((step: string, idx: number) => (
                        <div key={idx} className="flex gap-2 items-start bg-gray-700 p-2 rounded">
                          <span className="text-green-400 text-sm mt-2 min-w-[24px] font-bold">{idx + 1}.</span>
                          <textarea
                            value={step}
                            onChange={(e) => {
                              const newSteps = [...(editedFields.steps_beginner ?? selectedRecipe.steps_beginner ?? [])];
                              newSteps[idx] = e.target.value;
                              setEditedFields({ ...editedFields, steps_beginner: newSteps });
                            }}
                            rows={2}
                            className="flex-1 px-2 py-1 rounded bg-gray-800 text-white border border-gray-600 text-sm"
                            placeholder="Enter step description..."
                          />
                          <button
                            onClick={() => {
                              const newSteps = (editedFields.steps_beginner ?? selectedRecipe.steps_beginner ?? []).filter((_: string, i: number) => i !== idx);
                              setEditedFields({ ...editedFields, steps_beginner: newSteps });
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs mt-1"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <ReadMoreSection
                    title="Beginner Steps"
                    content={selectedRecipe.steps_beginner || []}
                    color="green"
                  />
                )}

                {/* Advanced Steps */}
                {isEditing ? (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-orange-400">Advanced Steps</h4>
                      <button
                        onClick={() => {
                          const current = editedFields.steps_advanced ?? selectedRecipe.steps_advanced ?? [];
                          setEditedFields({ ...editedFields, steps_advanced: [...current, ''] });
                        }}
                        className="px-2 py-1 text-xs bg-orange-600 hover:bg-orange-700 rounded"
                      >
                        + Add Step
                      </button>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {(editedFields.steps_advanced ?? selectedRecipe.steps_advanced ?? []).map((step: string, idx: number) => (
                        <div key={idx} className="flex gap-2 items-start bg-gray-700 p-2 rounded">
                          <span className="text-orange-400 text-sm mt-2 min-w-[24px] font-bold">{idx + 1}.</span>
                          <textarea
                            value={step}
                            onChange={(e) => {
                              const newSteps = [...(editedFields.steps_advanced ?? selectedRecipe.steps_advanced ?? [])];
                              newSteps[idx] = e.target.value;
                              setEditedFields({ ...editedFields, steps_advanced: newSteps });
                            }}
                            rows={2}
                            className="flex-1 px-2 py-1 rounded bg-gray-800 text-white border border-gray-600 text-sm"
                            placeholder="Enter step description..."
                          />
                          <button
                            onClick={() => {
                              const newSteps = (editedFields.steps_advanced ?? selectedRecipe.steps_advanced ?? []).filter((_: string, i: number) => i !== idx);
                              setEditedFields({ ...editedFields, steps_advanced: newSteps });
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs mt-1"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <ReadMoreSection
                    title="Advanced Steps"
                    content={selectedRecipe.steps_advanced || []}
                    color="orange"
                  />
                )}
              </div>

              {/* Data Completeness */}
              <div className="border-t border-gray-700 pt-4">
                <label className="block text-sm font-semibold mb-2">📊 Data Completeness</label>
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Validation:</span>
                      <span className={`font-semibold ${
                        selectedRecipe.validation_status === 'validated' ? 'text-green-400' :
                        selectedRecipe.validation_status === 'needs_fixing' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {selectedRecipe.validation_status || 'pending'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Quality Score:</span>
                      <span className="text-blue-400">{selectedRecipe.data_quality_score || 0}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Complete:</span>
                      <span className={selectedRecipe.is_complete ? 'text-green-400' : 'text-red-400'}>
                        {selectedRecipe.is_complete ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3 text-sm text-yellow-200">
                  <strong>Note:</strong> You can edit basic info, ingredients, and steps text. To regenerate images, use Mass Generation or Specific Generation tabs.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Viewing Modal */}
      {viewingImage && <ImageModal imageUrl={viewingImage} onClose={() => setViewingImage(null)} />}
    </div>
  );
}
