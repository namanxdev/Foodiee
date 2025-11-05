/**
 * Cooking Steps API Service
 * ==========================
 * Handles step-by-step cooking guidance and image generation
 */

import { API_CONFIG } from '@/constants';
import type { StepImageResponse } from '@/types';

// ============================================================================
// Base API Configuration
// ============================================================================

const API_BASE_URL = API_CONFIG.BASE_URL;

/**
 * Base fetch wrapper with error handling
 */
async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// ============================================================================
// Step Navigation API
// ============================================================================

export interface NextStepResponse {
  success: boolean;
  current_step?: string;
  step?: string;
  step_number: number;
  total_steps: number;
  completed: boolean;
  tips?: string;
}

export interface RecipeDetailsResponse {
  success: boolean;
  recipe_name: string;
  ingredients: string;
  steps: string[];
  tips: string;
}

/**
 * Get next cooking step
 */
export async function getNextStep(sessionId: string): Promise<NextStepResponse> {
  return fetchAPI<NextStepResponse>(
    `${API_BASE_URL}/api/step/next?session_id=${sessionId}`,
    {
      method: 'POST',
    }
  );
}

/**
 * Get recipe details
 */
export async function getRecipeDetails(
  sessionId: string,
  recipeName: string
): Promise<RecipeDetailsResponse> {
  return fetchAPI<RecipeDetailsResponse>(
    `${API_BASE_URL}/api/recipe/details?session_id=${sessionId}`,
    {
      method: 'POST',
      body: JSON.stringify({ recipe_name: recipeName }),
    }
  );
}

/**
 * Skip remaining steps
 */
export async function skipSteps(sessionId: string): Promise<{ success: boolean }> {
  return fetchAPI<{ success: boolean }>(
    `${API_BASE_URL}/api/step/skip?session_id=${sessionId}`,
    {
      method: 'POST',
    }
  );
}

// ============================================================================
// Image Generation API
// ============================================================================

/**
 * Generate step image using Gemini
 */
export async function generateStepImageGemini(
  sessionId: string,
  userEmail?: string
): Promise<StepImageResponse> {
  const headers: HeadersInit = {};
  if (userEmail) {
    headers['X-User-Email'] = userEmail;
  }
  
  return fetchAPI<StepImageResponse>(
    `${API_BASE_URL}/api/step/gemini_image?session_id=${sessionId}`,
    {
      method: 'POST',
      headers,
    }
  );
}

/**
 * Generate step image using Stable Diffusion
 */
export async function generateStepImageSD(
  sessionId: string
): Promise<StepImageResponse> {
  return fetchAPI<StepImageResponse>(
    `${API_BASE_URL}/api/step/gemini_image?session_id=${sessionId}`,
    {
      method: 'POST',
    }
  );
}

// ============================================================================
// Image Generation Aliases
// ============================================================================

/**
 * Default image generation (uses Gemini)
 */
export const generateStepImage = (sessionId: string, userEmail?: string) => 
  generateStepImageGemini(sessionId, userEmail);

// ============================================================================
// Export all functions
// ============================================================================

export const cookingStepsApi = {
  getNextStep,
  getRecipeDetails,
  skipSteps,
  generateStepImage,
  generateStepImageGemini,
  generateStepImageSD,
};
