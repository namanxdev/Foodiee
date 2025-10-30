"""
Top Recipes Pydantic models
All models for top recipes CRUD operations and responses
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class IngredientDetail(BaseModel):
    """Single ingredient with quantity and preparation details"""
    quantity: str = Field(..., description="Ingredient quantity (e.g., '2', '1/2')")
    unit: str = Field(..., description="Measurement unit (e.g., 'cups', 'tbsp')")
    name: str = Field(..., description="Ingredient name")
    preparation_note: str = Field(default="", description="Preparation instructions (e.g., 'chopped', 'diced')")


class TasteDetail(BaseModel):
    """Taste profile with intensity level"""
    name: str = Field(..., description="Taste name (e.g., 'Spicy', 'Sweet')")
    intensity: int = Field(..., ge=1, le=5, description="Intensity level (1-5)")


class TopRecipeModel(BaseModel):
    """Complete recipe model with all details"""
    id: int = Field(..., description="Recipe ID")
    name: str = Field(..., description="Recipe name")
    description: Optional[str] = Field(None, description="Recipe description")
    region: Optional[str] = Field(None, description="Cuisine region")
    tastes: List[TasteDetail] = Field(default=[], description="Taste profiles")
    meal_types: List[str] = Field(default=[], description="Meal types (e.g., Breakfast, Lunch)")
    dietary_tags: List[str] = Field(default=[], description="Dietary tags (e.g., Vegan, Gluten-Free)")
    difficulty: Optional[str] = Field(None, description="Difficulty level")
    prep_time_minutes: Optional[int] = Field(None, description="Preparation time in minutes")
    cook_time_minutes: Optional[int] = Field(None, description="Cooking time in minutes")
    total_time_minutes: Optional[int] = Field(None, description="Total time in minutes")
    servings: Optional[int] = Field(None, description="Number of servings")
    calories: Optional[int] = Field(None, description="Calories per serving")
    ingredients: List[IngredientDetail] = Field(default=[], description="List of ingredients")
    steps: List[str] = Field(default=[], description="Cooking steps")
    image_url: Optional[str] = Field(None, description="Main recipe image URL")
    step_image_urls: List[str] = Field(default=[], description="Step-by-step image URLs")
    rating: float = Field(default=0.0, ge=0, le=5, description="Recipe rating (0-5)")
    popularity_score: float = Field(default=0.0, description="Popularity score")
    source: str = Field(default="gemini", description="Recipe source")
    created_at: Optional[str] = Field(None, description="Creation timestamp")
    updated_at: Optional[str] = Field(None, description="Last update timestamp")


class TopRecipeSummaryModel(BaseModel):
    """Lightweight recipe summary for list views"""
    id: int = Field(..., description="Recipe ID")
    name: str = Field(..., description="Recipe name")
    description: Optional[str] = Field(None, description="Recipe description")
    region: Optional[str] = Field(None, description="Cuisine region")
    difficulty: Optional[str] = Field(None, description="Difficulty level")
    total_time_minutes: Optional[int] = Field(None, description="Total time in minutes")
    servings: Optional[int] = Field(None, description="Number of servings")
    calories: Optional[int] = Field(None, description="Calories per serving")
    image_url: Optional[str] = Field(None, description="Main recipe image URL")
    rating: float = Field(default=0.0, ge=0, le=5, description="Recipe rating (0-5)")
    popularity_score: float = Field(default=0.0, description="Popularity score")
    meal_types: List[str] = Field(default=[], description="Meal types")
    dietary_tags: List[str] = Field(default=[], description="Dietary tags")


class TopRecipesResponse(BaseModel):
    """Paginated response for top recipes list"""
    recipes: List[TopRecipeModel] | List[TopRecipeSummaryModel] = Field(..., description="List of recipes")
    total_count: int = Field(..., description="Total number of recipes matching filters")
    page: int = Field(..., ge=1, description="Current page number")
    page_size: int = Field(..., ge=1, description="Number of recipes per page")
    total_pages: int = Field(..., description="Total number of pages")
    success: bool = Field(default=True, description="Whether the request was successful")


class AvailableFiltersResponse(BaseModel):
    """Available filter options for recipes"""
    regions: List[str] = Field(..., description="Available cuisine regions")
    difficulties: List[str] = Field(..., description="Available difficulty levels")
    meal_types: List[str] = Field(..., description="Available meal types")
    dietary_tags: List[str] = Field(..., description="Available dietary tags")
    success: bool = Field(default=True, description="Whether the request was successful")


class CreateRecipeRequest(BaseModel):
    """Request model for creating a new recipe"""
    name: str = Field(..., description="Recipe name")
    description: Optional[str] = Field(None, description="Recipe description")
    region: Optional[str] = Field(None, description="Cuisine region")
    tastes: List[dict] = Field(default=[], description="Taste profiles: [{'name': 'Spicy', 'intensity': 4}]")
    meal_types: List[str] = Field(default=[], description="Meal types")
    dietary_tags: List[str] = Field(default=[], description="Dietary tags")
    difficulty: Optional[str] = Field(None, description="Difficulty level")
    prep_time_minutes: Optional[int] = Field(None, description="Preparation time")
    cook_time_minutes: Optional[int] = Field(None, description="Cooking time")
    total_time_minutes: Optional[int] = Field(None, description="Total time")
    servings: Optional[int] = Field(None, description="Number of servings")
    calories: Optional[int] = Field(None, description="Calories per serving")
    ingredients: List[dict] = Field(default=[], description="Ingredients list")
    steps: List[str] = Field(default=[], description="Cooking steps")
    image_url: Optional[str] = Field(None, description="Main image URL")
    step_image_urls: List[str] = Field(default=[], description="Step image URLs")
    rating: float = Field(default=0.0, ge=0, le=5, description="Rating")
    popularity_score: float = Field(default=0.0, description="Popularity score")
    source: str = Field(default="api", description="Recipe source")


class UpdateRecipeRequest(BaseModel):
    """Request model for updating a recipe (all fields optional)"""
    name: Optional[str] = Field(None, description="Recipe name")
    description: Optional[str] = Field(None, description="Recipe description")
    region: Optional[str] = Field(None, description="Cuisine region")
    tastes: Optional[List[dict]] = Field(None, description="Taste profiles")
    meal_types: Optional[List[str]] = Field(None, description="Meal types")
    dietary_tags: Optional[List[str]] = Field(None, description="Dietary tags")
    difficulty: Optional[str] = Field(None, description="Difficulty level")
    prep_time_minutes: Optional[int] = Field(None, description="Preparation time")
    cook_time_minutes: Optional[int] = Field(None, description="Cooking time")
    total_time_minutes: Optional[int] = Field(None, description="Total time")
    servings: Optional[int] = Field(None, description="Number of servings")
    calories: Optional[int] = Field(None, description="Calories per serving")
    ingredients: Optional[List[dict]] = Field(None, description="Ingredients list")
    steps: Optional[List[str]] = Field(None, description="Cooking steps")
    image_url: Optional[str] = Field(None, description="Main image URL")
    step_image_urls: Optional[List[str]] = Field(None, description="Step image URLs")
    rating: Optional[float] = Field(None, ge=0, le=5, description="Rating")
    popularity_score: Optional[float] = Field(None, description="Popularity score")


class UpdateFieldsRequest(BaseModel):
    """Request model for updating specific recipe fields"""
    steps: Optional[List[str]] = Field(None, description="Updated cooking steps")
    step_image_urls: Optional[List[str]] = Field(None, description="Updated step images")
    ingredients: Optional[List[dict]] = Field(None, description="Updated ingredients")
    image_url: Optional[str] = Field(None, description="Updated main image URL")
