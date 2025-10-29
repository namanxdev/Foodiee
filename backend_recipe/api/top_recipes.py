"""
Top Recipes API Routes (Supabase)
==================================
API endpoints for managing top recipes in Supabase PostgreSQL
Includes full CRUD operations
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel
import math

from models.schemas import (
    TopRecipeModel,
    TopRecipeSummaryModel,
    TopRecipesResponse,
    AvailableFiltersResponse,
    IngredientDetail,
    TasteDetail
)
from core.top_recipes_service import (
    get_top_recipes,
    get_recipe_by_id,
    insert_recipe,
    update_recipe,
    delete_recipe,
    get_filter_options,
    TopRecipe,
    TopRecipeSummary
)

router = APIRouter(prefix="/api/top-recipes", tags=["top-recipes"])


# ============================================================================
# Request/Response Models for CRUD
# ============================================================================

class CreateRecipeRequest(BaseModel):
    """Request model for creating a new recipe"""
    name: str
    description: Optional[str] = None
    region: Optional[str] = None
    tastes: List[dict] = []  # [{"name": "Spicy", "intensity": 4}]
    meal_types: List[str] = []
    dietary_tags: List[str] = []
    difficulty: Optional[str] = None
    prep_time_minutes: Optional[int] = None
    cook_time_minutes: Optional[int] = None
    total_time_minutes: Optional[int] = None
    servings: Optional[int] = None
    calories: Optional[int] = None
    ingredients: List[dict] = []  # [{"quantity": "2", "unit": "cups", "name": "Rice", "preparation": ""}]
    steps: List[str] = []
    image_url: Optional[str] = None
    step_image_urls: List[str] = []
    rating: float = 0.0
    popularity_score: float = 0.0
    source: str = "api"


class UpdateRecipeRequest(BaseModel):
    """Request model for updating a recipe (all fields optional)"""
    name: Optional[str] = None
    description: Optional[str] = None
    region: Optional[str] = None
    tastes: Optional[List[dict]] = None
    meal_types: Optional[List[str]] = None
    dietary_tags: Optional[List[str]] = None
    difficulty: Optional[str] = None
    prep_time_minutes: Optional[int] = None
    cook_time_minutes: Optional[int] = None
    total_time_minutes: Optional[int] = None
    servings: Optional[int] = None
    calories: Optional[int] = None
    ingredients: Optional[List[dict]] = None
    steps: Optional[List[str]] = None
    image_url: Optional[str] = None
    step_image_urls: Optional[List[str]] = None
    rating: Optional[float] = None
    popularity_score: Optional[float] = None


class UpdateFieldsRequest(BaseModel):
    """Request model for updating specific fields"""
    steps: Optional[List[str]] = None
    step_image_urls: Optional[List[str]] = None
    ingredients: Optional[List[dict]] = None
    image_url: Optional[str] = None


# ============================================================================
# Helper Functions
# ============================================================================

def convert_recipe_to_model(recipe: TopRecipe) -> TopRecipeModel:
    """Convert TopRecipe dataclass to TopRecipeModel Pydantic model"""
    return TopRecipeModel(
        id=recipe.id,
        name=recipe.name,
        description=recipe.description,
        region=recipe.region,
        tastes=[TasteDetail(**taste) for taste in recipe.tastes],
        meal_types=recipe.meal_types,
        dietary_tags=recipe.dietary_tags,
        difficulty=recipe.difficulty,
        prep_time_minutes=recipe.prep_time_minutes,
        cook_time_minutes=recipe.cook_time_minutes,
        total_time_minutes=recipe.total_time_minutes,
        servings=recipe.servings,
        calories=recipe.calories,
        ingredients=[IngredientDetail(**ing) for ing in recipe.ingredients],
        steps=recipe.steps,
        image_url=recipe.image_url,
        step_image_urls=recipe.step_image_urls,
        rating=recipe.rating,
        popularity_score=recipe.popularity_score,
        source=recipe.source
    )


def convert_summary_to_model(summary: TopRecipeSummary) -> TopRecipeSummaryModel:
    """Convert TopRecipeSummary dataclass to TopRecipeSummaryModel Pydantic model"""
    return TopRecipeSummaryModel(
        id=summary.id,
        name=summary.name,
        description=summary.description,
        region=summary.region,
        difficulty=summary.difficulty,
        total_time_minutes=summary.total_time_minutes,
        servings=summary.servings,
        calories=summary.calories,
        image_url=summary.image_url,
        rating=summary.rating,
        popularity_score=summary.popularity_score,
        meal_types=summary.meal_types,
        dietary_tags=summary.dietary_tags
    )


# ============================================================================
# READ Endpoints
# ============================================================================

@router.get("/", response_model=TopRecipesResponse)
async def list_top_recipes(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(30, ge=1, le=100, description="Recipes per page"),
    region: Optional[str] = Query(None, description="Filter by region"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    meal_types: Optional[str] = Query(None, description="Comma-separated meal types"),
    dietary_tags: Optional[str] = Query(None, description="Comma-separated dietary tags"),
    max_time: Optional[int] = Query(None, ge=1, description="Maximum time in minutes"),
    min_rating: Optional[float] = Query(None, ge=0, le=5, description="Minimum rating"),
    search: Optional[str] = Query(None, description="Search recipe name"),
    sort_by: str = Query("popularity_score", description="Sort column"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)"),
    detailed: bool = Query(False, description="Return full recipe details")
):
    """
    Get a paginated list of top recipes with filtering and sorting.
    """
    try:
        # Parse comma-separated values
        meal_types_list = [mt.strip() for mt in meal_types.split(',')] if meal_types else None
        dietary_tags_list = [dt.strip() for dt in dietary_tags.split(',')] if dietary_tags else None
        
        # Calculate offset
        offset = (page - 1) * page_size
        
        # Get recipes from database
        recipes, total_count = get_top_recipes(
            region=region,
            difficulty=difficulty,
            meal_types=meal_types_list,
            dietary_tags=dietary_tags_list,
            max_time=max_time,
            min_rating=min_rating,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order.upper(),
            limit=page_size,
            offset=offset,
            detailed=detailed
        )
        
        # Convert to Pydantic models
        if detailed:
            recipe_models = [convert_recipe_to_model(r) for r in recipes]
        else:
            recipe_models = [convert_summary_to_model(r) for r in recipes]
        
        # Calculate pagination metadata
        total_pages = math.ceil(total_count / page_size) if total_count > 0 else 0
        
        return TopRecipesResponse(
            recipes=recipe_models,
            total_count=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recipes: {str(e)}")


@router.get("/{recipe_id}", response_model=TopRecipeModel)
async def get_single_recipe(recipe_id: int):
    """
    Get a single recipe by ID with full details.
    """
    try:
        recipe = get_recipe_by_id(recipe_id)
        
        if not recipe:
            raise HTTPException(status_code=404, detail=f"Recipe {recipe_id} not found")
        
        return convert_recipe_to_model(recipe)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recipe: {str(e)}")


@router.get("/filters/available", response_model=AvailableFiltersResponse)
async def get_available_filters():
    """
    Get all available filter options (regions, difficulties, meal types, dietary tags).
    """
    try:
        filters = get_filter_options()
        
        return AvailableFiltersResponse(
            regions=filters['regions'],
            difficulties=filters['difficulties'],
            meal_types=filters['meal_types'],
            dietary_tags=filters['dietary_tags']
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching filters: {str(e)}")


# ============================================================================
# CREATE Endpoint
# ============================================================================

@router.post("/", response_model=dict)
async def create_recipe(recipe_data: CreateRecipeRequest):
    """
    Create a new recipe in the database.
    
    Returns the ID of the newly created recipe.
    """
    try:
        recipe_id = insert_recipe(
            name=recipe_data.name,
            description=recipe_data.description,
            region=recipe_data.region,
            tastes=recipe_data.tastes,
            meal_types=recipe_data.meal_types,
            dietary_tags=recipe_data.dietary_tags,
            difficulty=recipe_data.difficulty,
            prep_time_minutes=recipe_data.prep_time_minutes,
            cook_time_minutes=recipe_data.cook_time_minutes,
            total_time_minutes=recipe_data.total_time_minutes,
            servings=recipe_data.servings,
            calories=recipe_data.calories,
            ingredients=recipe_data.ingredients,
            steps=recipe_data.steps,
            image_url=recipe_data.image_url,
            step_image_urls=recipe_data.step_image_urls,
            rating=recipe_data.rating,
            popularity_score=recipe_data.popularity_score,
            source=recipe_data.source
        )
        
        return {
            "message": "Recipe created successfully",
            "recipe_id": recipe_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating recipe: {str(e)}")


# ============================================================================
# UPDATE Endpoints
# ============================================================================

@router.put("/{recipe_id}", response_model=dict)
async def update_full_recipe(recipe_id: int, recipe_data: UpdateRecipeRequest):
    """
    Update specific fields of an existing recipe.
    Only provided fields will be updated.
    """
    try:
        success = update_recipe(
            recipe_id=recipe_id,
            name=recipe_data.name,
            description=recipe_data.description,
            region=recipe_data.region,
            tastes=recipe_data.tastes,
            meal_types=recipe_data.meal_types,
            dietary_tags=recipe_data.dietary_tags,
            difficulty=recipe_data.difficulty,
            prep_time_minutes=recipe_data.prep_time_minutes,
            cook_time_minutes=recipe_data.cook_time_minutes,
            total_time_minutes=recipe_data.total_time_minutes,
            servings=recipe_data.servings,
            calories=recipe_data.calories,
            ingredients=recipe_data.ingredients,
            steps=recipe_data.steps,
            image_url=recipe_data.image_url,
            step_image_urls=recipe_data.step_image_urls,
            rating=recipe_data.rating,
            popularity_score=recipe_data.popularity_score
        )
        
        if not success:
            raise HTTPException(status_code=404, detail=f"Recipe {recipe_id} not found")
        
        return {
            "message": "Recipe updated successfully",
            "recipe_id": recipe_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating recipe: {str(e)}")


@router.patch("/{recipe_id}/fields", response_model=dict)
async def update_recipe_fields(recipe_id: int, fields: UpdateFieldsRequest):
    """
    Update specific fields like steps, step_image_urls, ingredients, or image_url.
    Useful for updating generated content after recipe creation.
    """
    try:
        success = update_recipe(
            recipe_id=recipe_id,
            steps=fields.steps,
            step_image_urls=fields.step_image_urls,
            ingredients=fields.ingredients,
            image_url=fields.image_url
        )
        
        if not success:
            raise HTTPException(status_code=404, detail=f"Recipe {recipe_id} not found")
        
        return {
            "message": "Recipe fields updated successfully",
            "recipe_id": recipe_id,
            "updated_fields": [k for k, v in fields.dict().items() if v is not None]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating recipe fields: {str(e)}")


# ============================================================================
# DELETE Endpoint
# ============================================================================

@router.delete("/{recipe_id}", response_model=dict)
async def delete_single_recipe(recipe_id: int):
    """
    Delete a recipe by ID.
    """
    try:
        success = delete_recipe(recipe_id)
        
        if not success:
            raise HTTPException(status_code=404, detail=f"Recipe {recipe_id} not found")
        
        return {
            "message": "Recipe deleted successfully",
            "recipe_id": recipe_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting recipe: {str(e)}")
