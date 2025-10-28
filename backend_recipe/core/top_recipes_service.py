"""
Top Recipes Database Service
============================
Database operations for the denormalized top_recipes_final.db
"""

import sqlite3
import os
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict


# Constants
STEP_DELIMITER = '<STEP_DELIMITER>'
DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), 
    'data', 
    'top_recipes_final.db'
)


@dataclass
class TopRecipe:
    """Recipe data structure matching top_recipes table"""
    id: int
    name: str
    description: Optional[str]
    region: Optional[str]
    tastes: List[Tuple[str, int]]  # [(taste_name, intensity)]
    meal_types: List[str]
    dietary_tags: List[str]
    difficulty: Optional[str]
    prep_time_minutes: Optional[int]
    cook_time_minutes: Optional[int]
    total_time_minutes: Optional[int]
    servings: Optional[int]
    calories: Optional[int]
    ingredients: List[Dict[str, str]]  # [{'quantity', 'unit', 'name', 'preparation_note'}]
    steps: List[str]
    image_url: Optional[str]
    step_image_urls: List[str]
    rating: float
    popularity_score: float
    source: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


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


# ============================================================================
# Deserialization Functions
# ============================================================================

def deserialize_tastes(tastes_str: Optional[str]) -> List[Tuple[str, int]]:
    """Parse tastes string: 'Spicy:4|Savory:5' → [('Spicy', 4), ('Savory', 5)]"""
    if not tastes_str:
        return []
    
    tastes = []
    for entry in tastes_str.split('|'):
        if ':' in entry:
            name, intensity = entry.split(':')
            tastes.append((name, int(intensity)))
    return tastes


def deserialize_list(list_str: Optional[str]) -> List[str]:
    """Parse pipe-delimited string: 'Lunch|Dinner' → ['Lunch', 'Dinner']"""
    if not list_str:
        return []
    return [item.strip() for item in list_str.split('|') if item.strip()]


def deserialize_ingredients(ingredients_str: Optional[str]) -> List[Dict[str, str]]:
    """
    Parse ingredients multi-line format:
    '750|grams|Chicken|cut into pieces\\n2|tbsp|Garam Masala|'
    → [{'quantity': '750', 'unit': 'grams', 'name': 'Chicken', 'preparation_note': 'cut into pieces'}, ...]
    """
    if not ingredients_str:
        return []
    
    ingredients = []
    for line in ingredients_str.strip().split('\n'):
        if not line:
            continue
        parts = line.split('|')
        if len(parts) >= 3:
            ingredients.append({
                'quantity': parts[0].strip(),
                'unit': parts[1].strip(),
                'name': parts[2].strip(),
                'preparation_note': parts[3].strip() if len(parts) > 3 else ''
            })
    return ingredients


def deserialize_steps(steps_str: Optional[str]) -> List[str]:
    """Parse steps: 'step1<STEP_DELIMITER>step2' → ['step1', 'step2']"""
    if not steps_str:
        return []
    return [step.strip() for step in steps_str.split(STEP_DELIMITER) if step.strip()]


def deserialize_step_images(step_image_urls_str: Optional[str]) -> List[str]:
    """Parse step images: 'url1<STEP_DELIMITER>url2' → ['url1', 'url2']"""
    if not step_image_urls_str:
        return []
    return step_image_urls_str.split(STEP_DELIMITER)


# ============================================================================
# Database Operations
# ============================================================================

def get_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    """Get database connection"""
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database not found at: {db_path}")
    return sqlite3.connect(db_path)


def row_to_recipe(row: tuple) -> TopRecipe:
    """Convert database row to TopRecipe object"""
    return TopRecipe(
        id=row[0],
        name=row[1],
        description=row[2],
        region=row[3],
        tastes=deserialize_tastes(row[4]),
        meal_types=deserialize_list(row[5]),
        dietary_tags=deserialize_list(row[6]),
        difficulty=row[7],
        prep_time_minutes=row[8],
        cook_time_minutes=row[9],
        total_time_minutes=row[10],
        servings=row[11],
        calories=row[12],
        ingredients=deserialize_ingredients(row[13]),
        steps=deserialize_steps(row[14]),
        image_url=row[15],
        step_image_urls=deserialize_step_images(row[16]),
        popularity_score=row[17],
        rating=row[18],
        source=row[19],
        created_at=row[20] if len(row) > 20 else None,
        updated_at=row[21] if len(row) > 21 else None
    )


def row_to_recipe_summary(row: tuple) -> TopRecipeSummary:
    """Convert database row to TopRecipeSummary object"""
    return TopRecipeSummary(
        id=row[0],
        name=row[1],
        description=row[2],
        region=row[3],
        difficulty=row[7],
        total_time_minutes=row[10],
        servings=row[11],
        calories=row[12],
        image_url=row[15],
        rating=row[18],
        popularity_score=row[17],
        meal_types=deserialize_list(row[5]),
        dietary_tags=deserialize_list(row[6])
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
    detailed: bool = True,
    db_path: str = DB_PATH
) -> Tuple[List[TopRecipe] | List[TopRecipeSummary], int]:
    """
    Get top recipes with flexible filtering and pagination.
    
    Args:
        region: Filter by cuisine region (e.g., 'Indian')
        difficulty: Filter by difficulty level ('Easy', 'Medium', 'Hard')
        meal_types: Filter by meal types (e.g., ['Lunch', 'Dinner'])
        dietary_tags: Filter by dietary tags (e.g., ['Vegetarian'])
        max_time: Maximum total_time_minutes
        min_rating: Minimum rating (0-5)
        search: Search in name, description, ingredients, or steps
        sort_by: Column to sort by (default: 'popularity_score')
        sort_order: 'ASC' or 'DESC' (default: 'DESC')
        limit: Number of results (default: 30)
        offset: Pagination offset (default: 0)
        detailed: Return full TopRecipe or TopRecipeSummary (default: True)
        db_path: Database path
    
    Returns:
        Tuple of (recipes_list, total_count)
    """
    conn = get_connection(db_path)
    cursor = conn.cursor()
    
    # Build WHERE clauses
    where_clauses = []
    params = []
    
    # Region filter
    if region:
        where_clauses.append("region = ?")
        params.append(region)
    
    # Difficulty filter
    if difficulty:
        where_clauses.append("difficulty = ?")
        params.append(difficulty)
    
    # Meal types filter (check if any meal type matches)
    if meal_types:
        meal_type_conditions = []
        for meal_type in meal_types:
            meal_type_conditions.append("meal_types LIKE ?")
            params.append(f"%{meal_type}%")
        where_clauses.append(f"({' OR '.join(meal_type_conditions)})")
    
    # Dietary tags filter (check if all tags match)
    if dietary_tags:
        for tag in dietary_tags:
            where_clauses.append("dietary_tags LIKE ?")
            params.append(f"%{tag}%")
    
    # Max time filter
    if max_time is not None:
        where_clauses.append("total_time_minutes <= ?")
        params.append(max_time)
    
    # Min rating filter
    if min_rating is not None:
        where_clauses.append("rating >= ?")
        params.append(min_rating)
    
    # Search filter (name, description, ingredients, or steps)
    if search:
        search_pattern = f"%{search}%"
        where_clauses.append(
            "(name LIKE ? OR description LIKE ? OR ingredients LIKE ? OR steps LIKE ?)"
        )
        params.extend([search_pattern] * 4)
    
    # Build WHERE clause
    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
    
    # Validate sort_by to prevent SQL injection
    valid_sort_columns = [
        'id', 'name', 'region', 'difficulty', 'prep_time_minutes',
        'cook_time_minutes', 'total_time_minutes', 'servings', 'calories',
        'rating', 'popularity_score', 'created_at', 'updated_at'
    ]
    if sort_by not in valid_sort_columns:
        sort_by = 'popularity_score'
    
    # Validate sort_order
    sort_order = sort_order.upper()
    if sort_order not in ['ASC', 'DESC']:
        sort_order = 'DESC'
    
    # Get total count
    count_query = f"SELECT COUNT(*) FROM top_recipes {where_sql}"
    cursor.execute(count_query, params)
    total_count = cursor.fetchone()[0]
    
    # Get recipes
    query = f"""
        SELECT * FROM top_recipes
        {where_sql}
        ORDER BY {sort_by} {sort_order}
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    # Convert to objects
    if detailed:
        recipes = [row_to_recipe(row) for row in rows]
    else:
        recipes = [row_to_recipe_summary(row) for row in rows]
    
    return recipes, total_count


def get_recipe_by_id(recipe_id: int, db_path: str = DB_PATH) -> Optional[TopRecipe]:
    """
    Get a single recipe by ID.
    
    Args:
        recipe_id: Recipe ID
        db_path: Database path
    
    Returns:
        TopRecipe object or None if not found
    """
    conn = get_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM top_recipes WHERE id = ?", (recipe_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    return row_to_recipe(row)


def get_available_filters(db_path: str = DB_PATH) -> Dict[str, List[str]]:
    """
    Get available filter options from the database.
    
    Returns:
        Dictionary with available regions, difficulties, meal_types, dietary_tags
    """
    conn = get_connection(db_path)
    cursor = conn.cursor()
    
    # Get unique regions
    cursor.execute("SELECT DISTINCT region FROM top_recipes WHERE region IS NOT NULL ORDER BY region")
    regions = [row[0] for row in cursor.fetchall()]
    
    # Get unique difficulties
    cursor.execute("SELECT DISTINCT difficulty FROM top_recipes WHERE difficulty IS NOT NULL ORDER BY difficulty")
    difficulties = [row[0] for row in cursor.fetchall()]
    
    # Get all meal_types (need to parse pipe-delimited)
    cursor.execute("SELECT DISTINCT meal_types FROM top_recipes WHERE meal_types IS NOT NULL AND meal_types != ''")
    meal_types_set = set()
    for row in cursor.fetchall():
        meal_types_set.update(deserialize_list(row[0]))
    meal_types = sorted(list(meal_types_set))
    
    # Get all dietary_tags
    cursor.execute("SELECT DISTINCT dietary_tags FROM top_recipes WHERE dietary_tags IS NOT NULL AND dietary_tags != ''")
    dietary_tags_set = set()
    for row in cursor.fetchall():
        dietary_tags_set.update(deserialize_list(row[0]))
    dietary_tags = sorted(list(dietary_tags_set))
    
    conn.close()
    
    return {
        'regions': regions,
        'difficulties': difficulties,
        'meal_types': meal_types,
        'dietary_tags': dietary_tags
    }
