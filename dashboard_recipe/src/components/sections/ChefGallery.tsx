"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { fetchTopRecipes, type TopRecipeSummary } from "@/services/topRecipesApi";
import RecipeDetailModal from "@/components/toprecipes/RecipeDetailModal";

interface GalleryItem {
  title: string;
  description: string;
  media: string;
  id: number;
}

const FALLBACK_IMAGE = "https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=900";

export function ChefGallery() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);

  useEffect(() => {
    async function loadRecipes() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch top recipes sorted by popularity
        const response = await fetchTopRecipes({
          page: 1,
          page_size: 12, // Fetch 12 recipes for the gallery
          sort_by: "popularity_score",
          sort_order: "DESC",
          detailed: false, // We only need summary data for the gallery
        });

        // Transform API response to gallery format
        const items: GalleryItem[] = response.recipes.map((recipe: TopRecipeSummary) => ({
          title: recipe.name,
          description: recipe.description || `${recipe.region} cuisine • ${recipe.difficulty}`,
          media: recipe.image_url || FALLBACK_IMAGE,
          id: recipe.id,
        }));

        setGalleryItems(items);
      } catch (err) {
        console.error("Failed to load gallery recipes:", err);
        setError("Failed to load recipes. Please try again later.");
        // Set empty array on error to show empty state
        setGalleryItems([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadRecipes();
  }, []);

  const handleRecipeClick = (recipeId: number) => {
    setSelectedRecipeId(recipeId);
  };

  return (
    <section className="relative overflow-hidden px-6 py-24 sm:px-10 md:px-12 lg:px-16">
      <div className="mx-auto max-w-4xl text-center text-balance">
        <p className="text-xs uppercase tracking-[0.45em] text-[#FFD07F]/75">Chef&apos;s Gallery</p>
        <h2 className="mt-4 text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
          Hover to feel the heat.
        </h2>
        <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-white/70 sm:text-lg">
          AI-generated dishes that shimmer, steam, and glow. Each tile responds to your curiosity
          with tilt-to-zoom, aroma cues, and instant recipe access.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-16 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#FFD07F]/30 border-t-[#FFD07F]"></div>
            <p className="text-sm text-white/70">Loading delicious recipes...</p>
          </div>
        </div>
      ) : error ? (
        <div className="mt-16 flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-red-400 mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-[#FFD07F]/80 hover:text-[#FFD07F] underline"
            >
              Try again
            </button>
          </div>
        </div>
      ) : galleryItems.length === 0 ? (
        <div className="mt-16 flex items-center justify-center py-20">
          <p className="text-white/70">No recipes available at the moment.</p>
        </div>
      ) : (
        <div className="mt-16 columns-1 gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3">
          {galleryItems.map((item, index) => (
            <figure
              key={item.id || item.title}
              onClick={() => handleRecipeClick(item.id)}
              className="mb-4 break-inside-avoid rounded-3xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur-2xl transition duration-500 hover:-translate-y-2 hover:shadow-[0_25px_55px_-22px_rgba(255,90,47,0.55)] cursor-pointer"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={item.media}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-[1000ms] hover:scale-[1.08]"
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  onError={(e) => {
                    // Fallback to default image if image fails to load
                    const target = e.target as HTMLImageElement;
                    if (target.src !== FALLBACK_IMAGE) {
                      target.src = FALLBACK_IMAGE;
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <span className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs uppercase tracking-[0.35em] text-[#FFD07F]/85">
                  Shot {index + 1}
                </span>
              </div>
              <figcaption className="space-y-2 px-6 pb-6 pt-5 text-white">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-sm text-white/70">{item.description}</p>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-[#FFD07F]/80">
                  <span>View Recipe</span>
                  <span className="text-sm">⟳</span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {/* Recipe Detail Modal */}
      <RecipeDetailModal 
        recipeId={selectedRecipeId} 
        onClose={() => setSelectedRecipeId(null)} 
      />
    </section>
  );
}

