/**
 * Modal to preview existing S3 images and choose action
 */

'use client';

import { useState } from 'react';

interface ExistingImage {
  url: string;
  step_index?: number;
  step_number?: number;
}

interface RecipeWithImages {
  recipe_id: number;
  recipe_name: string;
  existing_images: {
    main_image: string | null;
    ingredients_image: string | null;
    beginner_step_images: ExistingImage[];
    advanced_step_images: ExistingImage[];
  };
}

interface ExistingImagesModalProps {
  recipes: RecipeWithImages[];
  onChoice: (choice: 'generate' | 'load_from_s3') => void;
  onCancel: () => void;
}

export function ExistingImagesModal({ recipes, onChoice, onCancel }: ExistingImagesModalProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithImages | null>(
    recipes.length > 0 ? recipes[0] : null
  );
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const totalImages = recipes.reduce((sum, r) => {
    let count = 0;
    if (r.existing_images.main_image) count++;
    if (r.existing_images.ingredients_image) count++;
    count += r.existing_images.beginner_step_images.length;
    count += r.existing_images.advanced_step_images.length;
    return sum + count;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-2">
            🖼️ Existing Images Found on S3
          </h2>
          <p className="text-gray-300">
            Found <span className="text-blue-400 font-semibold">{totalImages} images</span> across{' '}
            <span className="text-blue-400 font-semibold">{recipes.length} recipes</span> already uploaded to S3.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Choose whether to load these existing images to the database or generate fresh images.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recipe List */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Recipes with Existing Images</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recipes.map((recipe) => {
                  const imageCount =
                    (recipe.existing_images.main_image ? 1 : 0) +
                    (recipe.existing_images.ingredients_image ? 1 : 0) +
                    recipe.existing_images.beginner_step_images.length +
                    recipe.existing_images.advanced_step_images.length;

                  return (
                    <button
                      key={recipe.recipe_id}
                      onClick={() => setSelectedRecipe(recipe)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedRecipe?.recipe_id === recipe.recipe_id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <div className="font-semibold">{recipe.recipe_name}</div>
                      <div className="text-sm opacity-80">{imageCount} images found</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Image Preview */}
            <div>
              {selectedRecipe && (
                <>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Preview: {selectedRecipe.recipe_name}
                  </h3>
                  <div className="space-y-4">
                    {/* Main Image */}
                    {selectedRecipe.existing_images.main_image && (
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Main Image</div>
                        <button
                          onClick={() => setPreviewImage(selectedRecipe.existing_images.main_image)}
                          className="w-full aspect-video bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                        >
                          <img
                            src={selectedRecipe.existing_images.main_image!}
                            alt="Main"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      </div>
                    )}

                    {/* Ingredients Image */}
                    {selectedRecipe.existing_images.ingredients_image && (
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Ingredients Image</div>
                        <button
                          onClick={() =>
                            setPreviewImage(selectedRecipe.existing_images.ingredients_image)
                          }
                          className="w-full aspect-video bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                        >
                          <img
                            src={selectedRecipe.existing_images.ingredients_image!}
                            alt="Ingredients"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      </div>
                    )}

                    {/* Beginner Step Images */}
                    {selectedRecipe.existing_images.beginner_step_images.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-400 mb-1">
                          Beginner Steps ({selectedRecipe.existing_images.beginner_step_images.length})
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedRecipe.existing_images.beginner_step_images.map((img) => (
                            <button
                              key={img.step_number}
                              onClick={() => setPreviewImage(img.url)}
                              className="aspect-square bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all relative"
                            >
                              <img src={img.url} alt={`Step ${img.step_number}`} className="w-full h-full object-cover" />
                              <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                                {img.step_number}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Advanced Step Images */}
                    {selectedRecipe.existing_images.advanced_step_images.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-400 mb-1">
                          Advanced Steps ({selectedRecipe.existing_images.advanced_step_images.length})
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedRecipe.existing_images.advanced_step_images.map((img) => (
                            <button
                              key={img.step_number}
                              onClick={() => setPreviewImage(img.url)}
                              className="aspect-square bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all relative"
                            >
                              <img src={img.url} alt={`Step ${img.step_number}`} className="w-full h-full object-cover" />
                              <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                                {img.step_number}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-700 flex gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onChoice('generate')}
            className="flex-1 px-6 py-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-colors"
          >
            ⚡ Generate Fresh Images
          </button>
          <button
            onClick={() => onChoice('load_from_s3')}
            className="flex-1 px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors"
          >
            📥 Load from S3 to Database
          </button>
        </div>
      </div>

      {/* Full-size Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-5xl max-h-full">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-screen object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}


