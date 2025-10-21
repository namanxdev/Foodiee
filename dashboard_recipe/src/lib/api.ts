const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = {
  async submitPreferences(data: any) {
    const response = await fetch(`${API_BASE_URL}/api/preferences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getRecipeDetails(sessionId: string, recipeName: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/recipe/details?session_id=${sessionId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_name: recipeName }),
      }
    );
    return response.json();
  },

  async getNextStep(sessionId: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/step/next?session_id=${sessionId}`,
      {
        method: "POST",
      }
    );
    return response.json();
  },

  async generateStepImage(sessionId: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/step/image?session_id=${sessionId}`,
      {
        method: "POST",
      }
    );
    return response.json();
  },

  async getIngredientAlternatives(
    sessionId: string,
    missingIngredient: string,
    recipeContext: string
  ) {
    const response = await fetch(
      `${API_BASE_URL}/api/ingredients/alternatives?session_id=${sessionId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missing_ingredient: missingIngredient,
          recipe_context: recipeContext,
        }),
      }
    );
    return response.json();
  },
};
