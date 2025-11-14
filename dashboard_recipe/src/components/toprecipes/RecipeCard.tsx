/**
 * RecipeCard Component
 * ====================
 * Displays individual recipe summary in a card format
 */

import { TopRecipeSummary, formatTime } from '@/services/topRecipesApi';
import { Clock, Flame, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RecipeCardProps {
  recipe: TopRecipeSummary;
  onClick: (recipe: TopRecipeSummary) => void;
}

export default function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <div
      onClick={() => onClick(recipe)}
      className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/[0.08] backdrop-blur-2xl shadow-lg shadow-black/40 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.12] hover:border-white/30 hover:shadow-2xl hover:shadow-orange-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-orange-400/5 backdrop-blur-sm" />
      </div>

      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-white/5">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30">
            <Flame className="h-16 w-16" strokeWidth={1.5} />
          </div>
        )}
        
        {/* Difficulty Badge */}
        <div className="absolute top-3 right-3">
          <Badge 
            variant="glow"
            className={`rounded-full text-xs font-semibold border ${
              recipe.difficulty === 'Easy' 
                ? 'border-green-400/40 bg-green-500/20 text-green-200 shadow-green-500/20' 
                : recipe.difficulty === 'Medium' 
                ? 'border-yellow-400/40 bg-yellow-500/20 text-yellow-200 shadow-yellow-500/20'
                : 'border-red-400/40 bg-red-500/20 text-red-200 shadow-red-500/20'
            }`}
          >
            {recipe.difficulty}
          </Badge>
        </div>

        {/* Rating Badge */}
        {recipe.rating > 0 && (
          <div className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-white/[0.15] backdrop-blur-md px-3 py-1.5 flex items-center gap-1.5 shadow-lg shadow-black/20">
            <Star className="h-4 w-4 fill-[#FFD07F] text-[#FFD07F]" />
            <span className="text-sm font-bold text-white">
              {recipe.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="relative p-5">
        {/* Recipe Name */}
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-[#FFD07F] transition-colors">
          {recipe.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-white/70 mb-3 line-clamp-2 leading-relaxed">
          {recipe.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <Badge variant="outline" size="sm" className="text-xs border-orange-400/40 bg-orange-500/10 text-orange-200">
            {recipe.region}
          </Badge>
          {recipe.meal_types.slice(0, 2).map((type) => (
            <Badge
              key={type}
              variant="outline"
              size="sm"
              className="text-xs border-blue-400/40 bg-blue-500/10 text-blue-200"
            >
              {type}
            </Badge>
          ))}
          {recipe.dietary_tags.slice(0, 1).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              size="sm"
              className="text-xs border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-white/70 pt-3 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-[#FFD07F]" />
            <span>{formatTime(recipe.total_time_minutes)}</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-[#FF5A2F]" />
            <span>{recipe.calories} cal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
