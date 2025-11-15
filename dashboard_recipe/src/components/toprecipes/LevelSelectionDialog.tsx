/**
 * LevelSelectionDialog Component
 * ================================
 * Dialog for selecting cooking skill level (Beginner or Advanced)
 */

"use client";

import { ChefHat, BookOpen, Star } from "lucide-react";
import { useRouter } from "next/navigation";

interface LevelSelectionDialogProps {
  recipeId: number;
  recipeName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function LevelSelectionDialog({
  recipeId,
  recipeName,
  isOpen,
  onClose,
}: LevelSelectionDialogProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleLevelSelect = (level: "beginner" | "advanced") => {
    router.push(`/top-recipes/guide/${recipeId}?level=${level}&step=0`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="relative rounded-3xl border border-white/20 bg-gradient-to-b from-white/[0.12] to-white/[0.06] backdrop-blur-2xl shadow-2xl shadow-black/60 max-w-2xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F] p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <ChefHat className="h-10 w-10 text-[#1E1E1E]" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-[#1E1E1E] mb-2">
            Choose Your Cooking Level
          </h2>
          <p className="text-sm text-[#1E1E1E]/80">
            {recipeName}
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-center text-white/80 mb-8 text-base leading-relaxed">
            Select your cooking experience level to get customized step-by-step
            instructions tailored to your skills.
          </p>

          {/* Level Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Beginner Card */}
            <button
              onClick={() => handleLevelSelect("beginner")}
              className="group relative overflow-hidden rounded-2xl border-2 border-emerald-400/40 bg-emerald-500/10 backdrop-blur-xl p-6 text-left hover:bg-emerald-500/20 hover:border-emerald-400/60 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/30"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-emerald-500/20 text-emerald-200 group-hover:bg-emerald-500/30 transition-colors">
                  <BookOpen className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-200 mb-1">
                    Beginner
                  </h3>
                  <p className="text-xs text-emerald-200/60 uppercase tracking-wider font-medium">
                    New to Cooking
                  </p>
                </div>
              </div>
              
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>Detailed explanations for each step</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>Common mistakes and how to avoid them</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>Temperature and timing guidance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>Visual cues for doneness</span>
                </li>
              </ul>

              <div className="mt-6 text-center py-3 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 font-semibold text-sm group-hover:bg-emerald-500/30 transition-colors">
                Select Beginner Mode
              </div>
            </button>

            {/* Advanced Card */}
            <button
              onClick={() => handleLevelSelect("advanced")}
              className="group relative overflow-hidden rounded-2xl border-2 border-orange-400/40 bg-orange-500/10 backdrop-blur-xl p-6 text-left hover:bg-orange-500/20 hover:border-orange-400/60 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/30"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-orange-500/20 text-orange-200 group-hover:bg-orange-500/30 transition-colors">
                  <Star className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-orange-200 mb-1">
                    Advanced
                  </h3>
                  <p className="text-xs text-orange-200/60 uppercase tracking-wider font-medium">
                    Experienced Cook
                  </p>
                </div>
              </div>
              
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">✓</span>
                  <span>Concise, professional instructions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">✓</span>
                  <span>Technique-focused guidance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">✓</span>
                  <span>Efficient workflow optimization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">✓</span>
                  <span>Professional chef approach</span>
                </li>
              </ul>

              <div className="mt-6 text-center py-3 rounded-xl bg-orange-500/20 border border-orange-400/30 text-orange-200 font-semibold text-sm group-hover:bg-orange-500/30 transition-colors">
                Select Advanced Mode
              </div>
            </button>
          </div>

          {/* Cancel Button */}
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white/90 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

