"""
Top Recipes API Routes
======================
API endpoints for fetching top recipes from top_recipes_final.db
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
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
    get_available_filters,
    TopRecipe,
    TopRecipeSummary
)

router = APIRouter(prefix="/api/top-recipes", tags=["top-recipes"])


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
        tastes=[TasteDetail(name=name, intensity=intensity) for name, intensity in recipe.tastes],
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
        source=recipe.source,
        created_at=recipe.created_at,
        updated_at=recipe.updated_at
    )


def convert_summary_to_model(summary: TopRecipeSummary) -> TopRecipeSummaryModel:
    """Convert TopRecipeSummary dataclass to TopRecipeSummaryModel"""
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
# API Endpoints
# ============================================================================

@router.get("/", response_model=TopRecipesResponse)
async def get_recipes(
    # Filtering parameters
    region: Optional[str] = Query(None, description="Filter by cuisine region (e.g., 'Indian', 'Chinese')"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty: 'Easy', 'Medium', 'Hard'"),
    meal_types: Optional[str] = Query(None, description="Comma-separated meal types (e.g., 'Lunch,Dinner')"),
    dietary_tags: Optional[str] = Query(None, description="Comma-separated dietary tags (e.g., 'Vegetarian,Gluten-Free')"),
    max_time: Optional[int] = Query(None, description="Maximum total time in minutes"),
    min_rating: Optional[float] = Query(None, description="Minimum rating (0-5)", ge=0, le=5),
    search: Optional[str] = Query(None, description="Search in name, description, ingredients, or steps"),
    
    # Sorting parameters
    sort_by: str = Query(
        'popularity_score',
        description="Sort by: id, name, region, difficulty, prep_time_minutes, cook_time_minutes, total_time_minutes, servings, calories, rating, popularity_score, created_at, updated_at"
    ),
    sort_order: str = Query('DESC', description="Sort order: 'ASC' or 'DESC'", regex="^(ASC|DESC|asc|desc)$"),
    
    # Pagination parameters
    page: int = Query(1, description="Page number (1-indexed)", ge=1),
    page_size: int = Query(30, description="Number of results per page", ge=1, le=100),
    
    # Detail level
    detailed: bool = Query(True, description="Return full recipe details (True) or summary (False)")
):
    """
    Get top recipes with flexible filtering, sorting, and pagination.
    
    **Filters:**
    - `region`: Cuisine type (Indian, Chinese, Italian, etc.)
    - `difficulty`: Easy, Medium, Hard
    - `meal_types`: Breakfast, Lunch, Dinner, Snack, Dessert (comma-separated)
    - `dietary_tags`: Vegetarian, Vegan, Gluten-Free, etc. (comma-separated)
    - `max_time`: Maximum cooking time in minutes
    - `min_rating`: Minimum rating (0-5)
    - `search`: Search text (searches name, description, ingredients, steps)
    
    **Sorting:**
    - `sort_by`: Column to sort by (default: popularity_score)
    - `sort_order`: ASC or DESC (default: DESC)
    
    **Pagination:**
    - `page`: Page number starting from 1
    - `page_size`: Results per page (max 100)
    
    **Detail Level:**
    - `detailed=true`: Full recipe with ingredients, steps, images (default)
    - `detailed=false`: Summary view with basic info only
    
    **Examples:**
    - Get top 10 Indian recipes: `?region=Indian&page_size=10`
    - Vegetarian breakfast under 30 min: `?meal_types=Breakfast&dietary_tags=Vegetarian&max_time=30`
    - Search for chicken recipes: `?search=chicken`
    - High-rated easy recipes: `?difficulty=Easy&min_rating=4.5&sort_by=rating`
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
        
        # Calculate total pages
        total_pages = math.ceil(total_count / page_size) if total_count > 0 else 0
        
        return TopRecipesResponse(
            recipes=recipe_models,
            total_count=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            success=True
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recipes: {str(e)}")


@router.get("/{recipe_id}", response_model=TopRecipeModel)
async def get_recipe_detail(recipe_id: int):
    """
    Get detailed information for a specific recipe by ID.
    
    **Parameters:**
    - `recipe_id`: Unique recipe identifier
    
    **Returns:**
    Complete recipe details including ingredients, steps, and images.
    """
    try:
        recipe = get_recipe_by_id(recipe_id)
        
        if not recipe:
            raise HTTPException(status_code=404, detail=f"Recipe with ID {recipe_id} not found")
        
        return convert_recipe_to_model(recipe)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recipe: {str(e)}")


@router.get("/filters/available", response_model=AvailableFiltersResponse)
async def get_filters():
    """
    Get all available filter options from the database.
    
    **Returns:**
    Lists of available regions, difficulties, meal types, and dietary tags.
    
    Useful for populating filter dropdowns in the frontend.
    """
    try:
        filters = get_available_filters()
        
        return AvailableFiltersResponse(
            regions=filters['regions'],
            difficulties=filters['difficulties'],
            meal_types=filters['meal_types'],
            dietary_tags=filters['dietary_tags'],
            success=True
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching filters: {str(e)}")


# ============================================================================
# Additional Utility Endpoints
# ============================================================================

@router.get("/stats/summary")
async def get_stats_summary():
    """
    Get database statistics summary.
    
    **Returns:**
    - Total recipes count
    - Recipes per region
    - Average rating
    - Average cooking time
    """
    try:
        from core.top_recipes_service import get_connection
        
        conn = get_connection()
        cursor = conn.cursor()
        
        # Total count
        cursor.execute("SELECT COUNT(*) FROM top_recipes")
        total_count = cursor.fetchone()[0]
        
        # Count by region
        cursor.execute("""
            SELECT region, COUNT(*) as count
            FROM top_recipes
            WHERE region IS NOT NULL
            GROUP BY region
            ORDER BY count DESC
        """)
        recipes_by_region = {row[0]: row[1] for row in cursor.fetchall()}
        
        # Average rating
        cursor.execute("SELECT AVG(rating) FROM top_recipes WHERE rating > 0")
        avg_rating = cursor.fetchone()[0] or 0
        
        # Average time
        cursor.execute("SELECT AVG(total_time_minutes) FROM top_recipes WHERE total_time_minutes IS NOT NULL")
        avg_time = cursor.fetchone()[0] or 0
        
        # Top rated
        cursor.execute("""
            SELECT name, rating
            FROM top_recipes
            WHERE rating > 0
            ORDER BY rating DESC, popularity_score DESC
            LIMIT 5
        """)
        top_rated = [{'name': row[0], 'rating': row[1]} for row in cursor.fetchall()]
        
        conn.close()
        
        return {
            'success': True,
            'total_recipes': total_count,
            'recipes_by_region': recipes_by_region,
            'average_rating': round(avg_rating, 2),
            'average_time_minutes': round(avg_time, 1),
            'top_rated_recipes': top_rated
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")
