"""
Models package for Recipe Recommender API
"""

from .schemas import (
    UserPreferencesRequest,
    RecipeRecommendationResponse,
    RecipeDetailRequest,
    RecipeDetailResponse,
    StepImageRequest,
    ImageGenerationResponse,
    IngredientAlternativesRequest,
    IngredientAlternativesResponse
)

__all__ = [
    "UserPreferencesRequest",
    "RecipeRecommendationResponse", 
    "RecipeDetailRequest",
    "RecipeDetailResponse",
    "StepImageRequest", 
    "ImageGenerationResponse",
    "IngredientAlternativesRequest",
    "IngredientAlternativesResponse"
]