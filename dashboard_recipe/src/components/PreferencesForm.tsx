"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FaGlobe, FaUtensils, FaClock, FaAllergies, FaThumbsDown, FaShoppingBasket } from "react-icons/fa";
import { API_CONFIG } from "@/constants";
import { useVegetarian } from "@/contexts/VegetarianContext";

interface PreferencesFormProps {
  onSubmit: (sessionId: string, recommendations: string) => void;
  prefillIngredient?: string;
}

export default function PreferencesForm({ onSubmit, prefillIngredient }: PreferencesFormProps) {
  const { isVegetarian } = useVegetarian();
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    region: "",
    taste_preferences: [] as string[],
    meal_type: "",
    time_available: "",
    allergies: [] as string[],
    dislikes: [] as string[],
    available_ingredients: prefillIngredient ? [prefillIngredient] : ([] as string[]),
  });

  const [tempInput, setTempInput] = useState({
    allergies: "",
    dislikes: "",
    ingredients: "",
  });

  useEffect(() => {
    const trimmed = prefillIngredient?.trim();
    if (trimmed) {
      setFormData((prev) => {
        if (prev.available_ingredients.includes(trimmed)) {
          return prev;
        }
        return {
          ...prev,
          available_ingredients: [...prev.available_ingredients, trimmed],
        };
      });
    }
  }, [prefillIngredient]);

  const regions = ["Indian", "Chinese", "Italian", "Mexican", "Japanese", "Mediterranean", "Thai", "Korean"];
  const tastes = ["Sweet", "Spicy", "Savory", "Sour", "Tangy", "Mild", "Rich"];
  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];
  const timeOptions = ["15-30 mins", "30-45 mins", "45-60 mins", "1+ hour"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure we're using the arrays, not the temp input values
      // Also handle any remaining text in input fields (if user typed but didn't click Add)
      const finalAllergies = [...formData.allergies];
      const finalDislikes = [...formData.dislikes];
      const finalIngredients = [...formData.available_ingredients];
      
      // Add any remaining text in input fields (if user forgot to click Add)
      if (tempInput.allergies.trim() && !finalAllergies.includes(tempInput.allergies.trim())) {
        finalAllergies.push(tempInput.allergies.trim());
      }
      if (tempInput.dislikes.trim() && !finalDislikes.includes(tempInput.dislikes.trim())) {
        finalDislikes.push(tempInput.dislikes.trim());
      }
      if (tempInput.ingredients.trim() && !finalIngredients.includes(tempInput.ingredients.trim())) {
        finalIngredients.push(tempInput.ingredients.trim());
      }

      // Add vegetarian preference to form data if toggle is on
      const payload = {
        ...formData,
        allergies: finalAllergies,
        dislikes: finalDislikes,
        available_ingredients: finalIngredients,
        is_vegetarian: isVegetarian, // Pass vegetarian preference to backend
      };

      const headers: HeadersInit = { 
        "Content-Type": "application/json",
      };
      
      // Add user email if available
      if (session?.user?.email) {
        headers["X-User-Email"] = session.user.email;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/preferences`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.success) {
        // Redirect to chat page with session_id in URL
        router.push(`/chat?session_id=${data.session_id}`);
        // Also call onSubmit for backward compatibility
        onSubmit(data.session_id, data.recommendations);
      } else {
        alert("Error getting recommendations");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  const addTag = (field: "allergies" | "dislikes" | "available_ingredients", value: string) => {
    const trimmedValue = value.trim();
    if (trimmedValue && !formData[field].includes(trimmedValue)) {
      setFormData({
        ...formData,
        [field]: [...formData[field], trimmedValue],
      });
      // Clear the input after adding
      if (field === "allergies") {
        setTempInput({ ...tempInput, allergies: "" });
      } else if (field === "dislikes") {
        setTempInput({ ...tempInput, dislikes: "" });
      } else if (field === "available_ingredients") {
        setTempInput({ ...tempInput, ingredients: "" });
      }
    }
  };

  const removeTag = (field: "allergies" | "dislikes" | "available_ingredients", index: number) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:via-gray-850 dark:to-orange-900/20 rounded-3xl shadow-2xl overflow-hidden transform hover:scale-[1.01] transition-all duration-300 dark:shadow-orange-900/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-8 text-white">
          <h2 className="text-4xl font-bold mb-2">Tell Us Your Preferences</h2>
          <p className="text-orange-100">Let&apos;s find the perfect recipe for you!</p>
          {isVegetarian && (
            <div className="mt-4 flex items-center gap-2 bg-green-500/30 backdrop-blur-sm rounded-lg p-3 border border-green-300/50">
              <span className="text-green-100">🌱</span>
              <span className="text-green-50 font-medium">Pure Vegetarian mode is active - Only vegetarian recipes will be recommended</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6" style={{
          color: 'var(--foreground)',
          backgroundColor: 'var(--background)'
        }}>
          {/* Region */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg font-semibold flex items-center gap-2 text-black dark:text-white">
                <FaGlobe className="text-orange-500" /> Cuisine Preference
              </span>
            </label>
            <select
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white hover:shadow-lg transition-all focus:border-orange-500 focus:outline-none"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              required
              title="Select your preferred cuisine"
            >
              <option value="">Select cuisine...</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Taste Preferences */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg font-semibold flex items-center gap-2 text-black dark:text-white">
                <FaUtensils className="text-orange-500" /> Taste Preferences
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {tastes.map((taste) => (
                <button
                  key={taste}
                  type="button"
                  onClick={() => {
                    const newTastes = formData.taste_preferences.includes(taste)
                      ? formData.taste_preferences.filter((t) => t !== taste)
                      : [...formData.taste_preferences, taste];
                    setFormData({ ...formData, taste_preferences: newTastes });
                  }}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-300 transform hover:scale-105 ${
                    formData.taste_preferences.includes(taste)
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                      : "bg-gray-200 dark:bg-slate-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600 border border-gray-300 dark:border-slate-500"
                  }`}
                >
                  {taste}
                </button>
              ))}
            </div>
          </div>

          {/* Meal Type */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg font-semibold text-black dark:text-white">Meal Type</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {mealTypes.map((meal) => (
                <button
                  key={meal}
                  type="button"
                  onClick={() => setFormData({ ...formData, meal_type: meal })}
                  className={`p-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                    formData.meal_type === meal
                      ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg"
                      : "bg-gray-200 dark:bg-gradient-to-br dark:from-gray-600 dark:to-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:from-orange-600/20 dark:hover:to-orange-700/20 border border-gray-300 dark:border-orange-500/30"
                  }`}
                >
                  {meal}
                </button>
              ))}
            </div>
          </div>

          {/* Time Available */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg font-semibold flex items-center gap-2 text-black dark:text-white">
                <FaClock className="text-orange-500" /> Time Available
              </span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {timeOptions.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setFormData({ ...formData, time_available: time })}
                  className={`p-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    formData.time_available === time
                      ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg"
                      : "bg-gray-200 dark:bg-gradient-to-br dark:from-gray-600 dark:to-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:from-orange-600/20 dark:hover:to-orange-700/20 border border-gray-300 dark:border-orange-500/30"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg font-semibold flex items-center gap-2 text-black dark:text-white">
                <FaAllergies className="text-red-500" /> Allergies (Optional)
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add allergy..."
                className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:border-orange-500 focus:outline-none"
                value={tempInput.allergies}
                onChange={(e) => setTempInput({ ...tempInput, allergies: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag("allergies", tempInput.allergies);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => addTag("allergies", tempInput.allergies)}
                className="btn bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
              >
                Add
              </button>
            </div>
            {formData.allergies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.allergies.map((allergy, index) => (
                  <span
                    key={index}
                    className="badge badge-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 gap-2 p-3 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all cursor-pointer"
                    onClick={() => removeTag("allergies", index)}
                    title="Click to remove"
                  >
                    {allergy} ✕
                  </span>
                ))}
              </div>
            )}
            {formData.allergies.length === 0 && tempInput.allergies.trim() && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">💡 Press Enter or click &quot;Add&quot; to add this item</p>
            )}
          </div>

          {/* Dislikes */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg font-semibold flex items-center gap-2 text-black dark:text-white">
                <FaThumbsDown className="text-orange-500" /> Dislikes (Optional)
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add disliked ingredient..."
                className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:border-orange-500 focus:outline-none"
                value={tempInput.dislikes}
                onChange={(e) => setTempInput({ ...tempInput, dislikes: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag("dislikes", tempInput.dislikes);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => addTag("dislikes", tempInput.dislikes)}
                className="btn bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
              >
                Add
              </button>
            </div>
            {formData.dislikes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.dislikes.map((dislike, index) => (
                  <span
                    key={index}
                    className="badge badge-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 gap-2 p-3 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-all cursor-pointer"
                    onClick={() => removeTag("dislikes", index)}
                    title="Click to remove"
                  >
                    {dislike} ✕
                  </span>
                ))}
              </div>
            )}
            {formData.dislikes.length === 0 && tempInput.dislikes.trim() && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">💡 Press Enter or click &quot;Add&quot; to add this item</p>
            )}
          </div>

          {/* Available Ingredients */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg font-semibold flex items-center gap-2 text-black dark:text-white">
                <FaShoppingBasket className="text-green-500" /> Available Ingredients
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add ingredient..."
                className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:border-orange-500 focus:outline-none"
                value={tempInput.ingredients}
                onChange={(e) => setTempInput({ ...tempInput, ingredients: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag("available_ingredients", tempInput.ingredients);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => addTag("available_ingredients", tempInput.ingredients)}
                className="btn bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
              >
                Add
              </button>
            </div>
            {formData.available_ingredients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.available_ingredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className="badge badge-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 gap-2 p-3 hover:bg-green-200 dark:hover:bg-green-900/50 transition-all cursor-pointer"
                    onClick={() => removeTag("available_ingredients", index)}
                    title="Click to remove"
                  >
                    {ingredient} ✕
                  </span>
                ))}
              </div>
            )}
            {formData.available_ingredients.length === 0 && tempInput.ingredients.trim() && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">💡 Press Enter or click &quot;Add&quot; to add this ingredient</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="space-y-2">
            {/* Helper text to guide users */}
            {(!formData.region || formData.taste_preferences.length === 0 || !formData.meal_type || !formData.time_available || (formData.available_ingredients.length === 0 && !tempInput.ingredients.trim())) && (
              <div className="text-sm text-gray-600 dark:text-gray-400 text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                {!formData.region && "Please select a cuisine preference. "}
                {formData.taste_preferences.length === 0 && "Please select at least one taste preference. "}
                {!formData.meal_type && "Please select a meal type. "}
                {!formData.time_available && "Please select available time. "}
                {formData.available_ingredients.length === 0 && !tempInput.ingredients.trim() && "Please add at least one available ingredient (click 'Add' after typing)."}
                {formData.available_ingredients.length === 0 && tempInput.ingredients.trim() && "💡 Tip: Click 'Add' to add your ingredient to the list, or it will be added automatically when you submit."}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading || !formData.region || formData.taste_preferences.length === 0 || !formData.meal_type || !formData.time_available || (formData.available_ingredients.length === 0 && !tempInput.ingredients.trim())}
              className="btn btn-lg w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white border-none hover:from-orange-600 hover:via-red-600 hover:to-pink-600 shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="loading loading-spinner loading-md"></span>
              ) : (
                "🔍 Find My Perfect Recipe!"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
