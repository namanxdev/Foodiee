/**
 * Data Manager Tab Component
 * View and edit recipes with pagination
 */

'use client';

import { useState, useEffect } from 'react';
import { listRecipes, updateRecipe, getStatistics, searchRecipes } from '@/services/recipeAdminAPI';
import type { Recipe, RecipeStatistics } from '@/types/recipeAdmin';

export function DataManagerTab() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [statistics, setStatistics] = useState<RecipeStatistics | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<any>({});
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const PAGE_SIZE = 20;

  useEffect(() => {
    loadRecipes();
    loadStatistics();
  }, [page, filter]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      console.log('Loading recipes...', { page, pageSize: PAGE_SIZE, filter });
      const response = await listRecipes({
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
        validation_status: filter || undefined,
      });
      console.log('Recipes loaded:', response);
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

  const handleSave = async () => {
    if (!selectedRecipe || Object.keys(editedFields).length === 0) return;

    try {
      await updateRecipe(selectedRecipe.id, editedFields);
      alert('Recipe updated successfully!');
      setIsEditing(false);
      setEditedFields({});
      await loadRecipes();
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
                � Search
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

            {/* Filter */}
            {!isSearching && (
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
            <div className="flex justify-between mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="py-2 text-gray-400">Page {page + 1}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={recipes.length < PAGE_SIZE}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
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
              <h2 className="text-xl font-bold">✏️ Recipe Details</h2>
              {!isEditing ? (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    // Initialize editedFields with current recipe data
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
                    });
                  }}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-sm font-semibold"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-sm font-semibold"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setEditedFields({}); }}
                    className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              )}
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
                    {(editedFields.ingredients ?? selectedRecipe.ingredients ?? []).map((ing: any, idx: number) => (
                      <div key={idx} className="flex gap-2 items-start bg-gray-700 p-2 rounded">
                        <span className="text-gray-400 text-sm mt-2 min-w-[24px]">{idx + 1}.</span>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Ingredient name"
                            value={ing.name || ing.ingredient || ''}
                            onChange={(e) => {
                              const newIngredients = [...(editedFields.ingredients ?? selectedRecipe.ingredients ?? [])];
                              newIngredients[idx] = { ...newIngredients[idx], name: e.target.value, ingredient: e.target.value };
                              setEditedFields({ ...editedFields, ingredients: newIngredients });
                            }}
                            className="px-2 py-1 rounded bg-gray-800 text-white border border-gray-600 text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Quantity"
                            value={ing.quantity || ''}
                            onChange={(e) => {
                              const newIngredients = [...(editedFields.ingredients ?? selectedRecipe.ingredients ?? [])];
                              newIngredients[idx] = { ...newIngredients[idx], quantity: e.target.value };
                              setEditedFields({ ...editedFields, ingredients: newIngredients });
                            }}
                            className="px-2 py-1 rounded bg-gray-800 text-white border border-gray-600 text-sm"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const newIngredients = (editedFields.ingredients ?? selectedRecipe.ingredients ?? []).filter((_: any, i: number) => i !== idx);
                            setEditedFields({ ...editedFields, ingredients: newIngredients });
                          }}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                          title="Delete ingredient"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-700 p-3 rounded space-y-1 max-h-60 overflow-y-auto">
                    {(Array.isArray(selectedRecipe.ingredients) ? selectedRecipe.ingredients : []).map((ing: any, idx: number) => (
                      <div key={idx} className="flex gap-2 text-sm">
                        <span className="text-blue-400 font-bold min-w-[24px]">{idx + 1}.</span>
                        <span className="text-gray-300 flex-1">{ing.name || ing.ingredient || 'N/A'}</span>
                        <span className="text-green-400">{ing.quantity || ''}</span>
                      </div>
                    ))}
                    {(!selectedRecipe.ingredients || !Array.isArray(selectedRecipe.ingredients) || selectedRecipe.ingredients.length === 0) && (
                      <div className="text-gray-400 italic text-sm">No ingredients listed</div>
                    )}
                  </div>
                )}
              </div>

              {/* Image URL Management */}
              <div className="border-t border-gray-700 pt-4">
                <label className="block text-sm font-semibold mb-3">🖼️ Image URL Management</label>

                {/* Main Image URL */}
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
                            className="w-32 h-32 object-cover rounded"
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
                        className="w-full h-40 object-cover rounded"
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

                {/* Ingredients Image URL */}
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
                            className="w-32 h-32 object-cover rounded"
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
                        className="w-full h-40 object-cover rounded"
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

                {/* Step Images URL Array */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-300">Step Images (Original)</span>
                    <span className={`text-xs ${selectedRecipe.step_image_urls?.length ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedRecipe.step_image_urls?.length || 0} images
                    </span>
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      {(editedFields.step_image_urls ?? selectedRecipe.step_image_urls ?? []).map((url: string, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center bg-gray-700 p-2 rounded">
                          <span className="text-gray-400 text-sm min-w-[32px]">#{idx + 1}</span>
                          <input
                            type="text"
                            placeholder="https://example.com/step.jpg"
                            value={url}
                            onChange={(e) => {
                              const newUrls = [...(editedFields.step_image_urls ?? selectedRecipe.step_image_urls ?? [])];
                              newUrls[idx] = e.target.value;
                              setEditedFields({ ...editedFields, step_image_urls: newUrls });
                            }}
                            className="flex-1 px-2 py-1 rounded bg-gray-800 text-white border border-gray-600 text-sm"
                          />
                          {url && (
                            <img
                              src={url}
                              alt={`Step ${idx + 1}`}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666" font-size="10">!</text></svg>';
                              }}
                            />
                          )}
                          <button
                            onClick={() => {
                              const newUrls = (editedFields.step_image_urls ?? selectedRecipe.step_image_urls ?? []).filter((_: string, i: number) => i !== idx);
                              setEditedFields({ ...editedFields, step_image_urls: newUrls });
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                            title="Delete image URL"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const currentUrls = editedFields.step_image_urls ?? selectedRecipe.step_image_urls ?? [];
                          setEditedFields({
                            ...editedFields,
                            step_image_urls: [...currentUrls, '']
                          });
                        }}
                        className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                      >
                        + Add Step Image URL
                      </button>
                    </div>
                  ) : (
                    selectedRecipe.step_image_urls && selectedRecipe.step_image_urls.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2">
                        {selectedRecipe.step_image_urls.map((url: string, idx: number) => (
                          <div key={idx} className="relative">
                            <img
                              src={url}
                              alt={`Step ${idx + 1}`}
                              className="w-full h-20 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666">!</text></svg>';
                              }}
                            />
                            <span className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                              {idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-700 p-3 rounded text-sm text-gray-400 italic text-center">
                        No step images
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Images Status */}
              <div className="border-t border-gray-700 pt-4">
                <label className="block text-sm font-semibold mb-2">📸 Images</label>
                
                {/* Main Image */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-400">Main Image:</span>
                    <span className={`text-sm ${selectedRecipe.image_url ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedRecipe.image_url ? '✓ Present' : '✗ Missing'}
                    </span>
                  </div>
                  {selectedRecipe.image_url && (
                    <div className="bg-gray-700 p-2 rounded">
                      <img 
                        src={selectedRecipe.image_url} 
                        alt={selectedRecipe.name}
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666">No Image</text></svg>';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Ingredients Image */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-400">Ingredients Image:</span>
                    <span className={`text-sm ${selectedRecipe.ingredients_image ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedRecipe.ingredients_image ? '✓ Present' : '✗ Missing'}
                    </span>
                  </div>
                  {selectedRecipe.ingredients_image && (
                    <div className="bg-gray-700 p-2 rounded">
                      <img 
                        src={selectedRecipe.ingredients_image} 
                        alt="Ingredients"
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666">No Image</text></svg>';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Step Images */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-400">Step Images:</span>
                    <span className={`text-sm ${selectedRecipe.step_image_urls?.length ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedRecipe.step_image_urls?.length || 0} images
                    </span>
                  </div>
                  {selectedRecipe.step_image_urls && selectedRecipe.step_image_urls.length > 0 && (
                    <div className="bg-gray-700 p-2 rounded">
                      <div className="grid grid-cols-3 gap-2">
                        {selectedRecipe.step_image_urls.slice(0, 6).map((url, idx) => (
                          <img 
                            key={idx}
                            src={url} 
                            alt={`Step ${idx + 1}`}
                            className="w-full h-16 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666">Error</text></svg>';
                            }}
                          />
                        ))}
                      </div>
                      {selectedRecipe.step_image_urls.length > 6 && (
                        <div className="text-xs text-gray-400 mt-1 text-center">
                          +{selectedRecipe.step_image_urls.length - 6} more images
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Steps Status */}
              <div className="border-t border-gray-700 pt-4">
                <label className="block text-sm font-semibold mb-2">📝 Steps Status</label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-700 p-2 rounded">
                    <span className="text-gray-400">Beginner:</span>
                    <span className={`ml-2 ${selectedRecipe.steps_beginner ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedRecipe.steps_beginner ? `✓ ${selectedRecipe.steps_beginner.length} steps` : '✗ Missing'}
                    </span>
                  </div>
                  <div className="bg-gray-700 p-2 rounded">
                    <span className="text-gray-400">Advanced:</span>
                    <span className={`ml-2 ${selectedRecipe.steps_advanced ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedRecipe.steps_advanced ? `✓ ${selectedRecipe.steps_advanced.length} steps` : '✗ Missing'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Steps Viewer */}
              <div className="border-t border-gray-700 pt-4">
                <label className="block text-sm font-semibold mb-3">👁️ View Steps Content</label>
                
                {/* Original Steps */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">Original Steps</h4>
                  {selectedRecipe.steps && selectedRecipe.steps.length > 0 ? (
                    <div className="bg-gray-700 p-3 rounded space-y-2 max-h-60 overflow-y-auto">
                      {selectedRecipe.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-2 text-sm">
                          <span className="text-blue-400 font-bold min-w-[24px]">{idx + 1}.</span>
                          <span className="text-gray-300">{step}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-700 p-3 rounded text-sm text-gray-400 italic">
                      No original steps available
                    </div>
                  )}
                </div>

                {/* Beginner Steps */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-green-400 mb-2">Beginner Steps</h4>
                  {selectedRecipe.steps_beginner && selectedRecipe.steps_beginner.length > 0 ? (
                    <div className="bg-gray-700 p-3 rounded space-y-2 max-h-60 overflow-y-auto">
                      {selectedRecipe.steps_beginner.map((step, idx) => (
                        <div key={idx} className="flex gap-2 text-sm">
                          <span className="text-green-400 font-bold min-w-[24px]">{idx + 1}.</span>
                          <span className="text-gray-300">{step}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-700 p-3 rounded text-sm text-gray-400 italic">
                      No beginner steps - use Mass Generation to create
                    </div>
                  )}
                </div>

                {/* Advanced Steps */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-orange-400 mb-2">Advanced Steps</h4>
                  {selectedRecipe.steps_advanced && selectedRecipe.steps_advanced.length > 0 ? (
                    <div className="bg-gray-700 p-3 rounded space-y-2 max-h-60 overflow-y-auto">
                      {selectedRecipe.steps_advanced.map((step, idx) => (
                        <div key={idx} className="flex gap-2 text-sm">
                          <span className="text-orange-400 font-bold min-w-[24px]">{idx + 1}.</span>
                          <span className="text-gray-300">{step}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-700 p-3 rounded text-sm text-gray-400 italic">
                      No advanced steps - use Mass Generation to create
                    </div>
                  )}
                </div>
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
                  <strong>Note:</strong> This editor updates basic recipe metadata only. To regenerate images or steps, use the Mass Generation or Specific Generation tabs.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
