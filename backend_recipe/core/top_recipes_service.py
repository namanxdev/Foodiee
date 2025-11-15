"""
Top Recipes Supabase Service
============================
Database operations for top_recipes table in Supabase PostgreSQL
"""

import os
import json
import psycopg
from psycopg.rows import dict_row
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class TopRecipe:
    """Complete recipe data structure"""
    id: int
    name: str
    description: Optional[str]
    region: Optional[str]
    tastes: List[Dict[str, int]]
    meal_types: List[str]
    dietary_tags: List[str]
    difficulty: Optional[str]
    prep_time_minutes: Optional[int]
    cook_time_minutes: Optional[int]
    total_time_minutes: Optional[int]
    servings: Optional[int]
    calories: Optional[int]
    ingredients: List[Dict[str, str]]
    steps: List[str]
    image_url: Optional[str]
    step_image_urls: List[str]
    rating: float
    popularity_score: float
    source: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    # New fields for recipe regeneration
    ingredients_image: Optional[str] = None
    steps_beginner: Optional[List[str]] = None
    steps_advanced: Optional[List[str]] = None
    steps_beginner_images: Optional[List[Dict[str, any]]] = None  # [{url, step_index, generated_at}]
    steps_advanced_images: Optional[List[Dict[str, any]]] = None  # [{url, step_index, generated_at}]
    ingredient_image_urls: Optional[List[Dict[str, any]]] = None  # [{url, ingredient_index, ingredient_name}]
    validation_status: Optional[str] = None
    data_quality_score: Optional[int] = None
    is_complete: Optional[bool] = None
    last_validated_at: Optional[str] = None


@dataclass
class TopRecipeSummary:
    """Lightweight recipe summary for list views"""
    id: int
    name: str
    description: Optional[str]
    region: Optional[str]
    difficulty: Optional[str]
    total_time_minutes: Optional[int]
    servings: Optional[int]
    calories: Optional[int]
    image_url: Optional[str]
    rating: float
    popularity_score: float
    meal_types: List[str]
    dietary_tags: List[str]


def get_supabase_connection():
    """Get Supabase PostgreSQL connection"""
    supabase_url = os.environ.get("SUPABASE_OG_URL")
    if not supabase_url:
        raise ValueError("SUPABASE_OG_URL not found in environment variables")
    return psycopg.connect(supabase_url, row_factory=dict_row)


def row_to_recipe(row: dict) -> TopRecipe:
    """Convert database row dict to TopRecipe object"""
    try:
        # Helper function to safely get values
        def safe_get(key, default=None):
            value = row.get(key, default)
            # Handle JSON string conversion if needed
            if isinstance(value, str) and (value.startswith('[') or value.startswith('{')):
                try:
                    return json.loads(value)
                except:
                    pass
            return value
        
        # Parse JSON fields if they're strings
        tastes = safe_get('tastes', [])
        if isinstance(tastes, str):
            try:
                tastes = json.loads(tastes)
            except:
                tastes = []
        
        meal_types = safe_get('meal_types', [])
        if isinstance(meal_types, str):
            try:
                meal_types = json.loads(meal_types)
            except:
                meal_types = []
        
        dietary_tags = safe_get('dietary_tags', [])
        if isinstance(dietary_tags, str):
            try:
                dietary_tags = json.loads(dietary_tags)
            except:
                dietary_tags = []
        
        ingredients = safe_get('ingredients', [])
        if isinstance(ingredients, str):
            try:
                ingredients = json.loads(ingredients)
            except:
                ingredients = []
        
        steps = safe_get('steps', [])
        if isinstance(steps, str):
            try:
                steps = json.loads(steps)
            except:
                steps = []
        
        step_image_urls = safe_get('step_image_urls', [])
        if isinstance(step_image_urls, str):
            try:
                step_image_urls = json.loads(step_image_urls)
            except:
                step_image_urls = []
        
        # Parse step-by-step guide fields
        steps_beginner = safe_get('steps_beginner', None)
        if isinstance(steps_beginner, str):
            try:
                steps_beginner = json.loads(steps_beginner)
            except:
                steps_beginner = None
        
        steps_advanced = safe_get('steps_advanced', None)
        if isinstance(steps_advanced, str):
            try:
                steps_advanced = json.loads(steps_advanced)
            except:
                steps_advanced = None
        
        steps_beginner_images = safe_get('steps_beginner_images', None)
        if isinstance(steps_beginner_images, str):
            try:
                steps_beginner_images = json.loads(steps_beginner_images)
            except:
                steps_beginner_images = None
        
        steps_advanced_images = safe_get('steps_advanced_images', None)
        if isinstance(steps_advanced_images, str):
            try:
                steps_advanced_images = json.loads(steps_advanced_images)
            except:
                steps_advanced_images = None
        
        return TopRecipe(
            id=row['id'],
            name=row.get('name', 'Unknown Recipe'),
            description=row.get('description'),
            region=row.get('region'),
            tastes=tastes if tastes else [],
            meal_types=meal_types if meal_types else [],
            dietary_tags=dietary_tags if dietary_tags else [],
            difficulty=row.get('difficulty'),
            prep_time_minutes=row.get('prep_time_minutes'),
            cook_time_minutes=row.get('cook_time_minutes'),
            total_time_minutes=row.get('total_time_minutes'),
            servings=row.get('servings'),
            calories=row.get('calories'),
            ingredients=ingredients if ingredients else [],
            steps=steps if steps else [],
            image_url=row.get('image_url'),
            step_image_urls=step_image_urls if step_image_urls else [],
            popularity_score=float(row.get('popularity_score', 0) or 0),
            rating=float(row.get('rating', 0) or 0),
            source=row.get('source', 'api'),
            created_at=str(row['created_at']) if row.get('created_at') else None,
            updated_at=str(row['updated_at']) if row.get('updated_at') else None,
            # New fields
            ingredients_image=row.get('ingredients_image'),
            steps_beginner=steps_beginner,
            steps_advanced=steps_advanced,
            steps_beginner_images=steps_beginner_images,
            steps_advanced_images=steps_advanced_images,
            ingredient_image_urls=row.get('ingredient_image_urls') if row.get('ingredient_image_urls') else None,
            validation_status=row.get('validation_status'),
            data_quality_score=row.get('data_quality_score'),
            is_complete=row.get('is_complete'),
            last_validated_at=str(row['last_validated_at']) if row.get('last_validated_at') else None
        )
    except Exception as e:
        raise


def row_to_recipe_summary(row: dict) -> TopRecipeSummary:
    """Convert database row dict to TopRecipeSummary object"""
    return TopRecipeSummary(
        id=row['id'],
        name=row['name'],
        description=row['description'],
        region=row['region'],
        difficulty=row['difficulty'],
        total_time_minutes=row['total_time_minutes'],
        servings=row['servings'],
        calories=row['calories'],
        image_url=row['image_url'],
        rating=float(row['rating']) if row['rating'] else 0.0,
        popularity_score=float(row['popularity_score']) if row['popularity_score'] else 0.0,
        meal_types=row['meal_types'] if row['meal_types'] else [],
        dietary_tags=row['dietary_tags'] if row['dietary_tags'] else []
    )


def get_top_recipes(
    region: Optional[str] = None,
    difficulty: Optional[str] = None,
    meal_types: Optional[List[str]] = None,
    dietary_tags: Optional[List[str]] = None,
    max_time: Optional[int] = None,
    min_rating: Optional[float] = None,
    search: Optional[str] = None,
    sort_by: str = 'popularity_score',
    sort_order: str = 'DESC',
    limit: int = 30,
    offset: int = 0,
    detailed: bool = True
) -> Tuple[List[TopRecipe] | List[TopRecipeSummary], int]:
    """Get top recipes with flexible filtering and pagination"""
    conn = get_supabase_connection()
    cursor = conn.cursor()
    
    conditions = []
    params = []
    
    if region:
        conditions.append("region = %s")
        params.append(region)
    
    if difficulty:
        conditions.append("difficulty = %s")
        params.append(difficulty)
    
    if meal_types:
        conditions.append("meal_types @> %s")
        params.append(meal_types)
    
    if dietary_tags:
        conditions.append("dietary_tags @> %s")
        params.append(dietary_tags)
    
    if max_time:
        conditions.append("total_time_minutes <= %s")
        params.append(max_time)
    
    if min_rating:
        conditions.append("rating >= %s")
        params.append(min_rating)
    
    if search:
        conditions.append("name ILIKE %s")
        params.append(f"%{search}%")
    
    where_clause = " AND ".join(conditions) if conditions else "TRUE"
    
    count_query = f"SELECT COUNT(*) FROM top_recipes WHERE {where_clause}"
    cursor.execute(count_query, params)
    result = cursor.fetchone()
    total_count = result['count'] if result else 0
    
    allowed_sort_columns = [
        'popularity_score', 'rating', 'total_time_minutes', 
        'calories', 'servings', 'created_at', 'name'
    ]
    if sort_by not in allowed_sort_columns:
        sort_by = 'popularity_score'
    
    sort_order = sort_order.upper()
    if sort_order not in ['ASC', 'DESC']:
        sort_order = 'DESC'
    
    if detailed:
        select_query = f"""
            SELECT * FROM top_recipes
            WHERE {where_clause}
            ORDER BY {sort_by} {sort_order}
            LIMIT %s OFFSET %s
        """
    else:
        select_query = f"""
            SELECT id, name, description, region, difficulty, total_time_minutes,
                   servings, calories, image_url, rating, popularity_score,
                   meal_types, dietary_tags
            FROM top_recipes
            WHERE {where_clause}
            ORDER BY {sort_by} {sort_order}
            LIMIT %s OFFSET %s
        """
    
    params.extend([limit, offset])
    cursor.execute(select_query, params)
    rows = cursor.fetchall()
    conn.close()
    
    if detailed:
        recipes = [row_to_recipe(row) for row in rows]
    else:
        recipes = [row_to_recipe_summary(row) for row in rows]
    
    return recipes, total_count


def get_recipe_by_id(recipe_id: int) -> Optional[TopRecipe]:
    """Get a single recipe by ID"""
    try:
        conn = get_supabase_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM top_recipes WHERE id = %s", (recipe_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
        
        try:
            recipe = row_to_recipe(row)
            return recipe
        except Exception as convert_err:
            raise
    except Exception as e:
        raise


def insert_recipe(
    name: str,
    description: Optional[str] = None,
    region: Optional[str] = None,
    tastes: List[Dict[str, int]] = None,
    meal_types: List[str] = None,
    dietary_tags: List[str] = None,
    difficulty: Optional[str] = None,
    prep_time_minutes: Optional[int] = None,
    cook_time_minutes: Optional[int] = None,
    total_time_minutes: Optional[int] = None,
    servings: Optional[int] = None,
    calories: Optional[int] = None,
    ingredients: List[Dict[str, str]] = None,
    steps: List[str] = None,
    image_url: Optional[str] = None,
    step_image_urls: List[str] = None,
    rating: float = 0.0,
    popularity_score: float = 0.0,
    source: str = 'api'
) -> int:
    """Insert a new recipe into the database"""
    conn = get_supabase_connection()
    cursor = conn.cursor()
    
    tastes = tastes or []
    meal_types = meal_types or []
    dietary_tags = dietary_tags or []
    ingredients = ingredients or []
    steps = steps or []
    step_image_urls = step_image_urls or []
    
    while len(step_image_urls) < len(steps):
        step_image_urls.append('')
    step_image_urls = step_image_urls[:len(steps)]
    
    cursor.execute("""
        INSERT INTO top_recipes (
            name, description, region, tastes, meal_types, dietary_tags,
            difficulty, prep_time_minutes, cook_time_minutes, total_time_minutes,
            servings, calories, ingredients, steps, image_url, step_image_urls,
            rating, popularity_score, source
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
        RETURNING id
    """, (
        name, description, region,
        json.dumps(tastes),
        meal_types,
        dietary_tags,
        difficulty, prep_time_minutes, cook_time_minutes, total_time_minutes,
        servings, calories,
        json.dumps(ingredients),
        steps,
        image_url,
        step_image_urls,
        rating, popularity_score, source
    ))
    
    result = cursor.fetchone()
    recipe_id = result['id'] if result else None
    conn.commit()
    conn.close()
    
    return recipe_id


def update_recipe(recipe_id: int, **kwargs) -> bool:
    """
    Update specific fields of an existing recipe.
    Accepts any combination of fields as keyword arguments.
    Pass None to clear/remove a field value.
    """
    updates = []
    params = []
    
    # Fields that should be JSON serialized
    json_fields = {
        'tastes', 'ingredients', 'steps_beginner', 'steps_advanced',
        'step_image_urls', 'steps_beginner_images', 'steps_advanced_images',
        'ingredient_image_urls'
    }
    
    # Process each provided field
    for field, value in kwargs.items():
        # Serialize JSON fields
        if field in json_fields and value is not None:
            value = json.dumps(value)
        
        # Add to update query
        updates.append(f"{field} = %s")
        params.append(value)
    
    if not updates:
        return False
    
    params.append(recipe_id)
    
    conn = get_supabase_connection()
    cursor = conn.cursor()
    
    query = f"UPDATE top_recipes SET {', '.join(updates)} WHERE id = %s"
    cursor.execute(query, params)
    
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    
    return rows_affected > 0


def delete_recipe(recipe_id: int) -> bool:
    """Delete a recipe by ID"""
    conn = get_supabase_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM top_recipes WHERE id = %s", (recipe_id,))
    
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    
    return rows_affected > 0


def get_filter_options() -> Dict[str, List[str]]:
    """Get all available filter options"""
    conn = get_supabase_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT DISTINCT region FROM top_recipes WHERE region IS NOT NULL ORDER BY region")
    regions = [row['region'] for row in cursor.fetchall()]
    
    cursor.execute("SELECT DISTINCT difficulty FROM top_recipes WHERE difficulty IS NOT NULL ORDER BY difficulty")
    difficulties = [row['difficulty'] for row in cursor.fetchall()]
    
    cursor.execute("SELECT DISTINCT unnest(meal_types) as meal_type FROM top_recipes ORDER BY meal_type")
    meal_types = [row['meal_type'] for row in cursor.fetchall() if row['meal_type']]
    
    cursor.execute("SELECT DISTINCT unnest(dietary_tags) as dietary_tag FROM top_recipes ORDER BY dietary_tag")
    dietary_tags = [row['dietary_tag'] for row in cursor.fetchall() if row['dietary_tag']]
    
    conn.close()
    
    return {
        'regions': regions,
        'difficulties': difficulties,
        'meal_types': meal_types,
        'dietary_tags': dietary_tags
    }
