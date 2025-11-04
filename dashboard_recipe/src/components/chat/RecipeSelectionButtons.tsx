"use client";

interface RecipeSelectionButtonsProps {
  onSelectRecipe: (recipeName: string) => void;
  disabled?: boolean;
}

export default function RecipeSelectionButtons({ 
  onSelectRecipe, 
  disabled = false 
}: RecipeSelectionButtonsProps) {
  const recipes = ["Recipe 1", "Recipe 2", "Recipe 3"];

  return (
    <div className="mt-4 space-y-2 text-left">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Select a recipe to start:
      </p>
      {recipes.map((recipe, i) => (
        <button
          key={i}
          onClick={() => onSelectRecipe(recipe)}
          disabled={disabled}
          className="block w-full text-left bg-orange-100 hover:bg-orange-200 p-3 rounded-lg transition dark:text-gray-900 dark:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Select {recipe}
        </button>
      ))}
    </div>
  );
}
