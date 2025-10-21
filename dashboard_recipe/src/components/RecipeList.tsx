"use client";

import { useState } from "react";
import { FaClock, FaArrowLeft, FaChevronRight } from "react-icons/fa";

interface RecipeListProps {
  recommendations: string;
  sessionId: string;
  onSelectRecipe: (recipeName: string, data: any) => void;
  onBack: () => void;
}

export default function RecipeList({ recommendations, sessionId, onSelectRecipe, onBack }: RecipeListProps) {
  const [loading, setLoading] = useState(false);
  const [selectedRecipeName, setSelectedRecipeName] = useState("");

  // Parse recommendations to extract recipe names
  const parseRecipes = () => {
    const lines = recommendations.split('\n');
    const recipes: string[] = [];
    
    lines.forEach(line => {
      const match = line.match(/^\*?\*?(?:\d+\.|Recipe \d+:?)\s*\*?\*?\s*(.+?)(?:\*\*)?$/i);
      if (match && match[1]) {
        recipes.push(match[1].trim().replace(/\*\*/g, ''));
      }
    });
    
    return recipes;
  };

  const recipes = parseRecipes();

  const handleSelectRecipe = async (recipeName: string) => {
    setLoading(true);
    setSelectedRecipeName(recipeName);

    try {
      const response = await fetch(`http://localhost:8000/api/recipe/details?session_id=${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_name: recipeName }),
      });

      const data = await response.json();
      
      if (data.success) {
        onSelectRecipe(recipeName, data);
      } else {
        alert("Error getting recipe details");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to get recipe details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={onBack}
        className="btn btn-ghost mb-6 hover:bg-orange-100 transition-all group"
      >
        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
        Back to Preferences
      </button>

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-8 text-white">
          <h2 className="text-4xl font-bold mb-2">Your Recipe Recommendations</h2>
          <p className="text-pink-100">Pick a recipe that catches your eye!</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Full Recommendations */}
          <div className="prose max-w-none mb-8 p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {recommendations}
            </div>
          </div>

          {/* Recipe Cards */}
          {recipes.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6">
              {recipes.map((recipe, index) => (
                <div
                  key={index}
                  className="card bg-gradient-to-br from-white to-orange-50 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-orange-300"
                  onClick={() => handleSelectRecipe(recipe)}
                >
                  <div className="card-body">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg">
                        {index + 1}
                      </div>
                      <h3 className="card-title text-lg flex-1">{recipe}</h3>
                    </div>
                    
                    <button
                      disabled={loading && selectedRecipeName === recipe}
                      className="btn bg-gradient-to-r from-orange-500 to-red-500 text-white border-none hover:from-orange-600 hover:to-red-600 mt-4 group"
                    >
                      {loading && selectedRecipeName === recipe ? (
                        <span className="loading loading-spinner"></span>
                      ) : (
                        <>
                          View Recipe
                          <FaChevronRight className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {recipes.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🍳</div>
              <p className="text-gray-500 text-lg">Select a recipe from the recommendations above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
