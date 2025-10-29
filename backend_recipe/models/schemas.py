"""
Pydantic models for Recipe Recommender API
"""

from pydantic import BaseModel
from typing import List, Optional, Dict

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

# ============================================================
# User Management Models
# ============================================================

class UserSignInRequest(BaseModel):
    email: str
    name: Optional[str] = None
    image: Optional[str] = None
    google_id: Optional[str] = None

class UserResponse(BaseModel):
    success: bool
    message: str
    user: Optional[Dict] = None


# ============================================================
# Top Recipes Models (for top_recipes_final.db)
# ============================================================

class IngredientDetail(BaseModel):
    """Single ingredient detail"""
    quantity: str
    unit: str
    name: str
    preparation_note: str = ""


class TasteDetail(BaseModel):
    """Taste with intensity"""
    name: str
    intensity: int  # 1-5


class TopRecipeModel(BaseModel):
    """Complete recipe model matching TopRecipe dataclass"""
    id: int
    name: str
    description: Optional[str] = None
    region: Optional[str] = None
    tastes: List[TasteDetail] = []
    meal_types: List[str] = []
    dietary_tags: List[str] = []
    difficulty: Optional[str] = None
    prep_time_minutes: Optional[int] = None
    cook_time_minutes: Optional[int] = None
    total_time_minutes: Optional[int] = None
    servings: Optional[int] = None
    calories: Optional[int] = None
    ingredients: List[IngredientDetail] = []
    steps: List[str] = []
    image_url: Optional[str] = None
    step_image_urls: List[str] = []
    rating: float = 0.0
    popularity_score: float = 0.0
    source: str = "gemini"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class TopRecipeSummaryModel(BaseModel):
    """Lightweight recipe summary for list views"""
    id: int
    name: str
    description: Optional[str] = None
    region: Optional[str] = None
    difficulty: Optional[str] = None
    total_time_minutes: Optional[int] = None
    servings: Optional[int] = None
    calories: Optional[int] = None
    image_url: Optional[str] = None
    rating: float = 0.0
    popularity_score: float = 0.0
    meal_types: List[str] = []
    dietary_tags: List[str] = []


class TopRecipesResponse(BaseModel):
    """Response for get top recipes endpoint"""
    recipes: List[TopRecipeModel] | List[TopRecipeSummaryModel]
    total_count: int
    page: int
    page_size: int
    total_pages: int
    success: bool = True


class AvailableFiltersResponse(BaseModel):
    """Available filter options"""
    regions: List[str]
    difficulties: List[str]
    meal_types: List[str]
    dietary_tags: List[str]
    success: bool = True
