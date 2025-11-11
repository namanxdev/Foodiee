"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FaAllergies,
  FaClock,
  FaGlobe,
  FaShoppingBasket,
  FaThumbsDown,
  FaUtensils,
} from "react-icons/fa";
import clsx from "clsx";
import { API_CONFIG } from "@/constants";
import { useVegetarian } from "@/contexts/VegetarianContext";
import { GlowingButton } from "@/components/ui/GlowingButton";

interface PreferencesFormProps {
  onSubmit: (sessionId: string, recommendations: string) => void;
  prefillIngredient?: string;
}

export default function CinematicPreferencesForm({
  onSubmit,
  prefillIngredient,
}: PreferencesFormProps) {
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

  const regions = [
    "Indian",
    "Chinese",
    "Italian",
    "Mexican",
    "Japanese",
    "Mediterranean",
    "Thai",
    "Korean",
  ];
  const tastes = ["Sweet", "Spicy", "Savory", "Sour", "Tangy", "Mild", "Rich"];
  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];
  const timeOptions = ["15-30 mins", "30-45 mins", "45-60 mins", "1+ hour"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalAllergies = [...formData.allergies];
      const finalDislikes = [...formData.dislikes];
      const finalIngredients = [...formData.available_ingredients];

      if (tempInput.allergies.trim() && !finalAllergies.includes(tempInput.allergies.trim())) {
        finalAllergies.push(tempInput.allergies.trim());
      }
      if (tempInput.dislikes.trim() && !finalDislikes.includes(tempInput.dislikes.trim())) {
        finalDislikes.push(tempInput.dislikes.trim());
      }
      if (tempInput.ingredients.trim() && !finalIngredients.includes(tempInput.ingredients.trim())) {
        finalIngredients.push(tempInput.ingredients.trim());
      }

      const payload = {
        ...formData,
        allergies: finalAllergies,
        dislikes: finalDislikes,
        available_ingredients: finalIngredients,
        is_vegetarian: isVegetarian,
      };

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

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
        router.push(`/chat?session_id=${data.session_id}`);
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

  const toggleSelection = (value: string) => {
    setFormData((prev) => {
      const list = prev.taste_preferences;
      const exists = list.includes(value);
      return {
        ...prev,
        taste_preferences: exists ? list.filter((item) => item !== value) : [...list, value],
      };
    });
  };

  const addTag = (
    field: "allergies" | "dislikes" | "available_ingredients",
    value: string,
  ) => {
    const trimmedValue = value.trim();
    if (trimmedValue && !formData[field].includes(trimmedValue)) {
      setFormData({
        ...formData,
        [field]: [...formData[field], trimmedValue],
      });
      setTempInput((prev) => ({
        ...prev,
        [field === "available_ingredients" ? "ingredients" : field]: "",
      }));
    }
  };

  const removeTag = (
    field: "allergies" | "dislikes" | "available_ingredients",
    index: number,
  ) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  const renderTagTray = (
    field: "allergies" | "dislikes" | "available_ingredients",
    color: string,
  ) => {
    const source =
      field === "allergies"
        ? formData.allergies
        : field === "dislikes"
          ? formData.dislikes
          : formData.available_ingredients;

    if (source.length === 0) return null;

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {source.map((item, index) => (
          <button
            key={`${item}-${index}`}
            type="button"
            onClick={() => removeTag(field, index)}
            className={clsx(
              "group inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition-all",
              "hover:-translate-y-1 hover:shadow-[0_18px_40px_-25px_rgba(255,90,47,0.55)]",
              color,
            )}
          >
            {item}
            <span className="text-white/70 group-hover:text-white">✕</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 backdrop-blur-3xl lg:p-12">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[rgba(10,10,10,0.7)] p-10">
          <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-[#FF5A2F]/30 blur-[120px]" />
          <div className="absolute -right-24 top-10 h-64 w-64 rounded-full bg-[#FFD07F]/25 blur-[120px]" />
          <div className="relative space-y-5">
            <p className="text-xs uppercase tracking-[0.5em] text-[#FFD07F]/80">
              Tell Foodiee your cravings
            </p>
            <h2 className="text-4xl font-semibold text-white sm:text-5xl">
              How do you want tonight to taste?
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-white/70">
              Paint the mood, we&apos;ll choreograph the menu with AI-powered intuition, sizzling
              visuals, and chef-grade taste curves.
            </p>
            {isVegetarian && (
              <span className="inline-flex items-center gap-3 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-6 py-3 text-xs uppercase tracking-[0.35em] text-emerald-200">
                🌱 Vegetarian mode ignited — Foodiee will keep it green and vibrant.
              </span>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-12"
          autoComplete="off"
        >
          <div className="space-y-12">
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm uppercase tracking-[0.45em] text-[#FFD07F]/80">
                <FaGlobe className="text-[#FFD07F]" />
                Cuisine playground
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                {regions.map((region) => {
                  const active = formData.region === region;
                  return (
                    <button
                      key={region}
                      type="button"
                      onClick={() => setFormData({ ...formData, region })}
                      className={clsx(
                        "group relative overflow-hidden rounded-3xl border border-white/10 p-6 text-left transition-all duration-300",
                        "hover:-translate-y-1 hover:shadow-[0_25px_55px_-22px_rgba(255,90,47,0.55)]",
                        active
                          ? "bg-gradient-to-br from-[#FF5A2F]/35 via-[#FF7A45]/25 to-[#FFD07F]/20"
                          : "bg-white/5",
                      )}
                    >
                      <span className="text-lg font-semibold text-white">{region}</span>
                      <p className="mt-2 text-xs uppercase tracking-[0.35em] text-white/55">
                        Aromas + textures
                      </p>
                      {active && (
                        <span className="absolute bottom-4 right-4 text-xl text-[#FFD07F]">
                          ✧
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm uppercase tracking-[0.45em] text-[#FFD07F]/80">
                <FaUtensils className="text-[#FFD07F]" />
                Taste palette
              </label>
              <div className="flex flex-wrap gap-3">
                {tastes.map((taste) => {
                  const active = formData.taste_preferences.includes(taste);
                  return (
                    <button
                      key={taste}
                      type="button"
                      onClick={() => toggleSelection(taste)}
                      className={clsx(
                        "rounded-full px-5 py-2 text-sm font-semibold uppercase tracking-[0.25em] transition-all duration-300",
                        "hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD07F]/60",
                        active
                          ? "bg-gradient-to-r from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F] text-[#1E1E1E] shadow-[0_18px_38px_-20px_rgba(255,90,47,0.7)]"
                          : "border border-white/15 bg-white/10 text-white/80 hover:border-[#FFD07F]/50",
                      )}
                    >
                      {taste}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm uppercase tracking-[0.45em] text-[#FFD07F]/80">
                🥣 Meal rhythm
              </label>
              <div className="grid gap-4 md:grid-cols-3">
                {mealTypes.map((meal) => {
                  const active = formData.meal_type === meal;
                  return (
                    <button
                      key={meal}
                      type="button"
                      onClick={() => setFormData({ ...formData, meal_type: meal })}
                      className={clsx(
                        "rounded-3xl border border-white/10 p-6 text-left transition-all duration-300",
                        "hover:-translate-y-1 hover:shadow-[0_25px_55px_-22px_rgba(255,90,47,0.55)]",
                        active
                          ? "bg-gradient-to-br from-[#FF5A2F]/40 via-[#FF7A45]/25 to-[#FFD07F]/20"
                          : "bg-white/5",
                      )}
                    >
                      <p className="text-lg font-semibold text-white">{meal}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.35em] text-white/55">
                        Plating mood
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm uppercase tracking-[0.45em] text-[#FFD07F]/80">
                <FaClock className="text-[#FFD07F]" />
                Time to crave
              </label>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                {timeOptions.map((time) => {
                  const active = formData.time_available === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setFormData({ ...formData, time_available: time })}
                      className={clsx(
                        "rounded-3xl border border-white/10 px-4 py-5 text-sm font-semibold uppercase tracking-[0.35em] transition-all duration-300",
                        active
                          ? "bg-gradient-to-br from-[#FF5A2F]/35 via-[#FF7A45]/20 to-[#FFD07F]/15"
                          : "bg-white/5 text-white/75 hover:text-white",
                      )}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div>
                <label className="flex items-center gap-3 text-sm uppercase tracking-[0.45em] text-[#FFD07F]/80">
                  <FaAllergies className="text-[#FFD07F]" />
                  Allergies
                </label>
                <p className="mt-2 text-xs text-white/50">
                  Tap enter or the plus to add. Click a tag to remove from your list.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <input
                  type="text"
                  placeholder="Sesame, peanuts..."
                  className="flex-1 rounded-full border border-white/15 bg-black/40 px-5 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#FFD07F]/60 focus:outline-none"
                  value={tempInput.allergies}
                  onChange={(e) => setTempInput({ ...tempInput, allergies: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag("allergies", tempInput.allergies);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addTag("allergies", tempInput.allergies)}
                  className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:border-[#FFD07F]/60 hover:text-white"
                >
                  Add +
                </button>
              </div>
              {renderTagTray("allergies", "bg-red-500/20 text-red-100 border border-red-400/30")}
            </div>

            <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div>
                <label className="flex items-center gap-3 text-sm uppercase tracking-[0.45em] text-[#FFD07F]/80">
                  <FaThumbsDown className="text-[#FFD07F]" />
                  Dislikes
                </label>
                <p className="mt-2 text-xs text-white/50">
                  Ingredients to keep away from your plate tonight.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <input
                  type="text"
                  placeholder="No cilantro, no olives..."
                  className="flex-1 rounded-full border border-white/15 bg-black/40 px-5 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#FFD07F]/60 focus:outline-none"
                  value={tempInput.dislikes}
                  onChange={(e) => setTempInput({ ...tempInput, dislikes: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag("dislikes", tempInput.dislikes);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addTag("dislikes", tempInput.dislikes)}
                  className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:border-[#FFD07F]/60 hover:text-white"
                >
                  Add +
                </button>
              </div>
              {renderTagTray("dislikes", "bg-orange-500/20 text-orange-100 border border-orange-400/30")}
            </div>

            <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div>
                <label className="flex items-center gap-3 text-sm uppercase tracking-[0.45em] text-[#FFD07F]/80">
                  <FaShoppingBasket className="text-[#FFD07F]" />
                  Pantry treasures
                </label>
                <p className="mt-2 text-xs text-white/50">
                  What&apos;s sizzling in your kitchen right now? Foodiee matches it to bold moves.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <input
                  type="text"
                  placeholder="Garlic, paneer, jasmine rice..."
                  className="flex-1 rounded-full border border-white/15 bg-black/40 px-5 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#FFD07F]/60 focus:outline-none"
                  value={tempInput.ingredients}
                  onChange={(e) => setTempInput({ ...tempInput, ingredients: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag("available_ingredients", tempInput.ingredients);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addTag("available_ingredients", tempInput.ingredients)}
                  className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:border-[#FFD07F]/60 hover:text-white"
                >
                  Add +
                </button>
              </div>
              {renderTagTray(
                "available_ingredients",
                "bg-emerald-500/20 text-emerald-100 border border-emerald-400/30",
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-white/65">
              <p>
                Foodiee will craft three cinematic recipes tuned to your cravings, complete with
                AI visuals and guided steps.
              </p>
            </div>
            <GlowingButton
              type="submit"
              label={loading ? "Simmering..." : "Serve my menu"}
              glow
            />
          </div>
        </form>
      </div>
    </div>
  );
}

