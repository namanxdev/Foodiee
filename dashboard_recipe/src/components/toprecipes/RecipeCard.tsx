/**
 * RecipeCard Component
 * ====================
 * Displays individual recipe summary in a card format
 */

import { TopRecipeSummary, formatTime, getDifficultyColor } from '@/services/topRecipesApi';
import { FaClock, FaFire, FaUsers, FaStar } from 'react-icons/fa';

interface RecipeCardProps {
  recipe: TopRecipeSummary;
  onClick: (recipe: TopRecipeSummary) => void;
}

export default function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <div
      onClick={() => onClick(recipe)}
      className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            <FaFire className="text-6xl" />
          </div>
        )}
        
        {/* Difficulty Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(recipe.difficulty)}`}>
            {recipe.difficulty}
          </span>
        </div>

        {/* Rating Badge */}
        {recipe.rating > 0 && (
          <div className="absolute bottom-3 left-3 bg-white dark:bg-gray-800 px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
            <FaStar className="text-yellow-500" />
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
              {recipe.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Recipe Name */}
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors">
          {recipe.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {recipe.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded-full">
            {recipe.region}
          </span>
          {recipe.meal_types.slice(0, 2).map((type) => (
            <span
              key={type}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
            >
              {type}
            </span>
          ))}
          {recipe.dietary_tags.slice(0, 1).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1">
            <FaClock className="text-orange-500" />
            <span>{formatTime(recipe.total_time_minutes)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <FaUsers className="text-blue-500" />
            <span>{recipe.servings} servings</span>
          </div>
          
          <div className="flex items-center gap-1">
            <FaFire className="text-red-500" />
            <span>{recipe.calories} cal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
