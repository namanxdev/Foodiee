"use client";

import { useVegetarian } from "@/contexts/VegetarianContext";
import { FaLeaf } from "react-icons/fa";

interface VegetarianToggleProps {
  variant?: "navbar" | "filter";
  className?: string;
}

export default function VegetarianToggle({ variant = "filter", className = "" }: VegetarianToggleProps) {
  const { isVegetarian, toggleVegetarian } = useVegetarian();

  if (variant === "navbar") {
    return (
      <button
        onClick={toggleVegetarian}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
          isVegetarian
            ? "bg-green-500 text-white shadow-lg hover:bg-green-600"
            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        } ${className}`}
        title={isVegetarian ? "Vegetarian mode ON - Click to turn off" : "Click to enable vegetarian mode"}
      >
        <FaLeaf className={isVegetarian ? "text-white" : "text-green-600 dark:text-green-400"} />
        <span className="hidden sm:inline">{isVegetarian ? "Pure Veg" : "Veg Mode (off)"}</span>
      </button>
    );
  }

  // Filter variant (above advanced filters)
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 mb-4 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <FaLeaf className={`text-xl sm:text-2xl flex-shrink-0 ${isVegetarian ? "text-green-500" : "text-gray-400"}`} />
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200">
              Pure Vegetarian Mode
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {isVegetarian 
                ? "Showing only vegetarian recipes" 
                : "Enable to view only vegetarian recipes"}
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
          <input
            type="checkbox"
            checked={isVegetarian}
            onChange={toggleVegetarian}
            className="sr-only peer"
          />
          <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
        </label>
      </div>
      {isVegetarian && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
            <FaLeaf className="text-xs flex-shrink-0" />
            <span>Vegetarian filter is active. Only recipes with &quot;Vegetarian&quot; dietary tag will be shown.</span>
          </p>
        </div>
      )}
    </div>
  );
}

