/**
 * Image Credits Component
 * =======================
 * Displays remaining image generation credits for the user
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FaImage, FaExclamationTriangle } from "react-icons/fa";
import { API_CONFIG } from "@/constants";

interface ImageCreditsProps {
  onLimitReached?: () => void;
  refreshTrigger?: number; // Trigger refresh when this changes
}

export default function ImageCredits({ onLimitReached, refreshTrigger }: ImageCreditsProps) {
  const { data: session } = useSession();
  const [credits, setCredits] = useState<{
    allowed: boolean;
    remaining_count: number;
    total_count: number;
    max_allowed: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const checkCredits = async () => {
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/image-generation/check-limit`,
        {
          headers: {
            "X-User-Email": session.user.email,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCredits(data);
        if (!data.allowed && onLimitReached) {
          onLimitReached();
        }
      } else {
        // If error, still show credits but mark as error
        console.warn("Failed to check credits:", response.status);
      }
    } catch (error) {
      console.error("Failed to check credits:", error);
      // Don't fail silently - retry after a short delay
      setTimeout(() => {
        if (session?.user?.email) {
          checkCredits();
        }
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      checkCredits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, refreshTrigger]);

  if (!session?.user?.email || loading) {
    return null;
  }

  if (!credits) {
    return null;
  }

  const percentage = (credits.remaining_count / credits.max_allowed) * 100;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FaImage className="text-purple-500 dark:text-purple-400" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Image Credits
          </span>
        </div>
        {!credits.allowed && (
          <FaExclamationTriangle className="text-red-500 dark:text-red-400" />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {credits.allowed ? "Remaining today" : "Limit reached"}
          </span>
          <span
            className={`font-bold ${
              credits.allowed
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {credits.remaining_count} / {credits.max_allowed}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              credits.allowed
                ? percentage > 50
                  ? "bg-green-500"
                  : percentage > 25
                  ? "bg-yellow-500"
                  : "bg-red-500"
                : "bg-red-600"
            }`}
            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
          />
        </div>

        {!credits.allowed && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            You&apos;ve reached your daily limit. Try again tomorrow!
          </p>
        )}
      </div>
    </div>
  );
}

