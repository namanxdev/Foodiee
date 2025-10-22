"""
Pydantic models for Recipe Recommender API
"""

from pydantic import BaseModel
from typing import List, Optional

class UserPreferencesRequest(BaseModel):
    region: str
    taste_preferences: List[str]
    meal_type: str
    time_available: str
    allergies: Optional[List[str]] = []
    dislikes: Optional[List[str]] = []
    available_ingredients: List[str]

class RecipeRecommendationResponse(BaseModel):
    recommendations: str
    success: bool
    message: str
    session_id: str  # Add session_id as separate field for easy access

class RecipeDetailRequest(BaseModel):
    recipe_name: str

class RecipeDetailResponse(BaseModel):
    recipe_name: str
    ingredients: str
    steps: List[str]
    tips: str
    success: bool

class StepImageRequest(BaseModel):
    recipe_name: str
    step_description: str

class ImageGenerationResponse(BaseModel):
    image_data: Optional[str] = None  # Base64 encoded image
    description: str
    success: bool
    generation_type: str  # "gpu", "text_only"

class IngredientAlternativesRequest(BaseModel):
    missing_ingredient: str
    recipe_context: str

class IngredientAlternativesResponse(BaseModel):
    alternatives: str
    success: bool