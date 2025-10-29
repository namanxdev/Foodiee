"""
Recipe-related Pydantic models
All models for recipe recommendations, details, and generation
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class UserPreferencesRequest(BaseModel):
    """User preferences for recipe recommendations"""
    region: str = Field(..., description="Cuisine region (e.g., Indian, Italian)")
    taste_preferences: List[str] = Field(..., description="Taste preferences (e.g., Spicy, Sweet)")
    meal_type: str = Field(..., description="Meal type (e.g., Breakfast, Lunch, Dinner)")
    time_available: str = Field(..., description="Available cooking time")
    allergies: Optional[List[str]] = Field(default=[], description="Food allergies")
    dislikes: Optional[List[str]] = Field(default=[], description="Food dislikes")
    available_ingredients: List[str] = Field(..., description="Available ingredients")


class RecipeRecommendationResponse(BaseModel):
    """Response for recipe recommendations"""
    recommendations: str = Field(..., description="Recipe recommendations text")
    success: bool = Field(default=True, description="Whether the request was successful")
    message: str = Field(default="", description="Status message")
    session_id: str = Field(..., description="Session ID for tracking")


class RecipeDetailRequest(BaseModel):
    """Request for detailed recipe information"""
    recipe_name: str = Field(..., description="Name of the recipe")


class RecipeDetailResponse(BaseModel):
    """Detailed recipe information"""
    recipe_name: str = Field(..., description="Name of the recipe")
    ingredients: str = Field(..., description="List of ingredients")
    steps: List[str] = Field(..., description="Cooking steps")
    tips: str = Field(..., description="Cooking tips and suggestions")
    success: bool = Field(default=True, description="Whether the request was successful")


class IngredientAlternativesRequest(BaseModel):
    """Request for ingredient alternatives"""
    missing_ingredient: str = Field(..., description="The missing ingredient")
    recipe_context: str = Field(..., description="Recipe context for better alternatives")


class IngredientAlternativesResponse(BaseModel):
    """Response with ingredient alternatives"""
    alternatives: str = Field(..., description="Suggested alternatives")
    success: bool = Field(default=True, description="Whether the request was successful")
