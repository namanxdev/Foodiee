"""
Models Package
===============
Organized Pydantic models for the Recipe Recommender API

Structure:
- recipe.py: Recipe-related request/response models
- image.py: Image generation models
- user.py: User authentication and profile models
- top_recipe.py: Top recipes CRUD models
"""

# Recipe models
from .recipe import (
    UserPreferencesRequest,
    RecipeRecommendationResponse,
    RecipeDetailRequest,
    RecipeDetailResponse,
    IngredientAlternativesRequest,
    IngredientAlternativesResponse
)

# Image models
from .image import (
    StepImageRequest,
    ImageGenerationResponse
)

# User models
from .user import (
    UserSignInRequest,
    UserResponse,
    UserPreferencesUpdate
)

# Top recipe models
from .top_recipe import (
    IngredientDetail,
    TasteDetail,
    TopRecipeModel,
    TopRecipeSummaryModel,
    TopRecipesResponse,
    AvailableFiltersResponse,
    CreateRecipeRequest,
    UpdateRecipeRequest,
    UpdateFieldsRequest
)

__all__ = [
    # Recipe models
    "UserPreferencesRequest",
    "RecipeRecommendationResponse",
    "RecipeDetailRequest",
    "RecipeDetailResponse",
    "IngredientAlternativesRequest",
    "IngredientAlternativesResponse",
    
    # Image models
    "StepImageRequest",
    "ImageGenerationResponse",
    
    # User models
    "UserSignInRequest",
    "UserResponse",
    "UserPreferencesUpdate",
    
    # Top recipe models
    "IngredientDetail",
    "TasteDetail",
    "TopRecipeModel",
    "TopRecipeSummaryModel",
    "TopRecipesResponse",
    "AvailableFiltersResponse",
    "CreateRecipeRequest",
    "UpdateRecipeRequest",
    "UpdateFieldsRequest"
]