"use client";

import { FaArrowLeft, FaPlay, FaListUl, FaLightbulb } from "react-icons/fa";

interface RecipeDetailsProps {
  recipeName: string;
  recipeData: {
    ingredients: string;
    steps: string[];
    tips: string;
  };
  onStartCooking: () => void;
  onBack: () => void;
}

export default function RecipeDetails({ recipeName, recipeData, onStartCooking, onBack }: RecipeDetailsProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={onBack}
        className="btn btn-ghost mb-6 hover:bg-orange-100 transition-all group"
      >
        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
        Back to Recipes
      </button>

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 p-8 text-white">
          <h2 className="text-4xl font-bold mb-2">{recipeName}</h2>
          <p className="text-green-100">Let's cook something amazing!</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Ingredients Section */}
          <div className="card bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-2xl flex items-center gap-3 text-green-700">
                <div className="bg-gradient-to-r from-green-500 to-teal-500 p-3 rounded-full">
                  <FaListUl className="text-white" />
                </div>
                Ingredients
              </h3>
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed mt-4 space-y-2">
                {recipeData.ingredients.split('\n').map((line, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-white rounded-lg hover:bg-green-50 transition-all transform hover:translate-x-2 duration-200"
                  >
                    <span className="text-green-500 font-bold">•</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Steps Preview */}
          <div className="card bg-gradient-to-br from-blue-50 to-cyan-50 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-2xl flex items-center gap-3 text-blue-700">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-full">
                  <FaPlay className="text-white" />
                </div>
                Cooking Steps ({recipeData.steps.length} steps)
              </h3>
              <div className="mt-4 space-y-3">
                {recipeData.steps.slice(0, 3).map((step, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-white rounded-xl hover:shadow-md transition-all"
                  >
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 leading-relaxed">{step}</p>
                  </div>
                ))}
                
                {recipeData.steps.length > 3 && (
                  <div className="text-center p-4 bg-blue-100 rounded-xl">
                    <p className="text-blue-700 font-medium">
                      + {recipeData.steps.length - 3} more steps...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tips Section */}
          {recipeData.tips && (
            <div className="card bg-gradient-to-br from-yellow-50 to-amber-50 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-2xl flex items-center gap-3 text-amber-700">
                  <div className="bg-gradient-to-r from-yellow-500 to-amber-500 p-3 rounded-full">
                    <FaLightbulb className="text-white" />
                  </div>
                  Cooking Tips
                </h3>
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed mt-4 p-4 bg-white rounded-xl">
                  {recipeData.tips}
                </div>
              </div>
            </div>
          )}

          {/* Start Cooking Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={onStartCooking}
              className="btn btn-lg bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white border-none hover:from-orange-600 hover:via-red-600 hover:to-pink-600 shadow-2xl transform hover:scale-110 transition-all duration-300 px-12"
            >
              <FaPlay className="text-xl" />
              Start Cooking! 👨‍🍳
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
