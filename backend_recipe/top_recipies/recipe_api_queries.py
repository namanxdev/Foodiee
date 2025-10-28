"""
Recipe Query API Functions
===========================
Ready-to-use functions for FastAPI endpoints to query recipes.
"""

import sqlite3
import os
from typing import List, Dict, Optional
from enum import Enum

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
DB_PATH = os.path.join(BACKEND_DIR, "data", "top_recipes.db")


class SortBy(str, Enum):
    """Sort options for recipes."""
    RATING = "rating"
    TIME = "time"
    CALORIES = "calories"
    NAME = "name"


class Region(str, Enum):
    """Available cuisine regions."""
    INDIAN = "Indian"
    CHINESE = "Chinese"
    ITALIAN = "Italian"
    MEXICAN = "Mexican"
    JAPANESE = "Japanese"
    MEDITERRANEAN = "Mediterranean"
    THAI = "Thai"
    KOREAN = "Korean"


def get_db_connection():
    """Create database connection with Row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_recipes_by_region(
    region: str,
    meal_type: Optional[str] = None,
    dietary_tag: Optional[str] = None,
    max_time: Optional[int] = None,
    sort_by: str = "rating",
    limit: int = 20,
    offset: int = 0
) -> Dict:
    """
    Get recipes by region with optional filters.
    Perfect for API endpoint: GET /api/recipes
    
    Args:
        region: Cuisine region (Indian, Chinese, etc.)
        meal_type: Optional meal type filter (Breakfast, Lunch, etc.)
        dietary_tag: Optional dietary filter (Vegetarian, Vegan, etc.)
        max_time: Maximum cooking time in minutes
        sort_by: Sort field (rating, time, calories, name)
        limit: Number of results per page
        offset: Pagination offset
    
    Returns:
        Dict with recipes list and pagination info
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Build query dynamically based on filters
    query = """
    SELECT DISTINCT
        r.id,
        r.name,
        r.description,
        r.cuisine,
        r.prep_time_minutes,
        r.cook_time_minutes,
        r.total_time_minutes,
        r.servings,
        dl.name as difficulty,
        r.calories,
        r.rating,
        r.popularity_score,
        r.image_url
    FROM recipes r
    JOIN recipe_regions rr ON r.id = rr.recipe_id
    JOIN regions reg ON rr.region_id = reg.id
    LEFT JOIN difficulty_levels dl ON r.difficulty_id = dl.id
    """
    
    conditions = ["reg.name = ?"]
    params = [region]
    
    # Add meal type filter
    if meal_type:
        query += """
        JOIN recipe_meal_types rmt ON r.id = rmt.recipe_id
        JOIN meal_types mt ON rmt.meal_type_id = mt.id
        """
        conditions.append("mt.name = ?")
        params.append(meal_type)
    
    # Add dietary filter
    if dietary_tag:
        query += """
        JOIN recipe_dietary_tags rdt ON r.id = rdt.recipe_id
        JOIN dietary_tags dt ON rdt.dietary_tag_id = dt.id
        """
        conditions.append("dt.name = ?")
        params.append(dietary_tag)
    
    # Add time filter
    if max_time:
        conditions.append("r.total_time_minutes <= ?")
        params.append(max_time)
    
    # Add WHERE clause
    query += " WHERE " + " AND ".join(conditions)
    
    # Add sorting
    sort_mapping = {
        "rating": "r.rating DESC, r.popularity_score DESC",
        "time": "r.total_time_minutes ASC",
        "calories": "r.calories ASC",
        "name": "r.name ASC"
    }
    query += f" ORDER BY {sort_mapping.get(sort_by, sort_mapping['rating'])}"
    
    # Add pagination
    query += " LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    cursor.execute(query, params)
    recipes = [dict(row) for row in cursor.fetchall()]
    
    # Get total count for pagination
    count_query = """
    SELECT COUNT(DISTINCT r.id) as total
    FROM recipes r
    JOIN recipe_regions rr ON r.id = rr.recipe_id
    JOIN regions reg ON rr.region_id = reg.id
    """
    
    if meal_type:
        count_query += """
        JOIN recipe_meal_types rmt ON r.id = rmt.recipe_id
        JOIN meal_types mt ON rmt.meal_type_id = mt.id
        """
    
    if dietary_tag:
        count_query += """
        JOIN recipe_dietary_tags rdt ON r.id = rdt.recipe_id
        JOIN dietary_tags dt ON rdt.dietary_tag_id = dt.id
        """
    
    count_query += " WHERE " + " AND ".join(conditions)
    cursor.execute(count_query, params[:len(conditions)])
    total = cursor.fetchone()['total']
    
    conn.close()
    
    return {
        "recipes": recipes,
        "pagination": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + len(recipes)) < total
        }
    }


def get_recipe_by_id(recipe_id: int) -> Optional[Dict]:
    """
    Get complete recipe details by ID.
    Perfect for API endpoint: GET /api/recipes/{recipe_id}
    
    Args:
        recipe_id: Recipe ID
    
    Returns:
        Complete recipe dict or None if not found
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get basic recipe info
    cursor.execute("""
        SELECT 
            r.*,
            dl.name as difficulty
        FROM recipes r
        LEFT JOIN difficulty_levels dl ON r.difficulty_id = dl.id
        WHERE r.id = ?
    """, (recipe_id,))
    
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    
    recipe = dict(row)
    
    # Get regions
    cursor.execute("""
        SELECT reg.name
        FROM recipe_regions rr
        JOIN regions reg ON rr.region_id = reg.id
        WHERE rr.recipe_id = ?
    """, (recipe_id,))
    recipe['regions'] = [row['name'] for row in cursor.fetchall()]
    
    # Get ingredients
    cursor.execute("""
        SELECT 
            i.name,
            ri.quantity,
            ri.unit,
            ri.preparation_note,
            i.category
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = ?
        ORDER BY ri.id
    """, (recipe_id,))
    recipe['ingredients'] = [dict(row) for row in cursor.fetchall()]
    
    # Get instructions
    cursor.execute("""
        SELECT 
            step_number,
            instruction
        FROM recipe_instructions
        WHERE recipe_id = ?
        ORDER BY step_number
    """, (recipe_id,))
    recipe['instructions'] = [dict(row) for row in cursor.fetchall()]
    
    # Get tastes
    cursor.execute("""
        SELECT 
            t.name,
            rt.intensity
        FROM recipe_tastes rt
        JOIN tastes t ON rt.taste_id = t.id
        WHERE rt.recipe_id = ?
    """, (recipe_id,))
    recipe['tastes'] = [dict(row) for row in cursor.fetchall()]
    
    # Get meal types
    cursor.execute("""
        SELECT mt.name
        FROM recipe_meal_types rmt
        JOIN meal_types mt ON rmt.meal_type_id = mt.id
        WHERE rmt.recipe_id = ?
    """, (recipe_id,))
    recipe['meal_types'] = [row['name'] for row in cursor.fetchall()]
    
    # Get dietary tags
    cursor.execute("""
        SELECT dt.name
        FROM recipe_dietary_tags rdt
        JOIN dietary_tags dt ON rdt.dietary_tag_id = dt.id
        WHERE rdt.recipe_id = ?
    """, (recipe_id,))
    recipe['dietary_tags'] = [row['name'] for row in cursor.fetchall()]
    
    conn.close()
    return recipe


def search_recipes(
    query: str,
    region: Optional[str] = None,
    limit: int = 20
) -> List[Dict]:
    """
    Search recipes by keyword in name or description.
    Perfect for API endpoint: GET /api/recipes/search
    
    Args:
        query: Search keyword
        region: Optional region filter
        limit: Maximum results
    
    Returns:
        List of matching recipes
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    sql = """
    SELECT DISTINCT
        r.id,
        r.name,
        r.description,
        r.cuisine,
        r.total_time_minutes,
        dl.name as difficulty,
        r.rating,
        r.image_url
    FROM recipes r
    LEFT JOIN difficulty_levels dl ON r.difficulty_id = dl.id
    """
    
    conditions = ["(r.name LIKE ? OR r.description LIKE ?)"]
    params = [f"%{query}%", f"%{query}%"]
    
    if region:
        sql += """
        JOIN recipe_regions rr ON r.id = rr.recipe_id
        JOIN regions reg ON rr.region_id = reg.id
        """
        conditions.append("reg.name = ?")
        params.append(region)
    
    sql += " WHERE " + " AND ".join(conditions)
    sql += " ORDER BY r.rating DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(sql, params)
    recipes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return recipes


def get_random_recipes(region: Optional[str] = None, limit: int = 10) -> List[Dict]:
    """
    Get random recipes for discovery.
    Perfect for API endpoint: GET /api/recipes/random
    
    Args:
        region: Optional region filter
        limit: Number of random recipes
    
    Returns:
        List of random recipes
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        r.id,
        r.name,
        r.description,
        r.cuisine,
        r.total_time_minutes,
        dl.name as difficulty,
        r.rating,
        r.image_url
    FROM recipes r
    LEFT JOIN difficulty_levels dl ON r.difficulty_id = dl.id
    """
    
    params = []
    if region:
        query += """
        JOIN recipe_regions rr ON r.id = rr.recipe_id
        JOIN regions reg ON rr.region_id = reg.id
        WHERE reg.name = ?
        """
        params.append(region)
    
    query += " ORDER BY RANDOM() LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    recipes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return recipes


def get_filter_options() -> Dict:
    """
    Get all available filter options.
    Perfect for API endpoint: GET /api/recipes/filters
    
    Returns:
        Dict with all available filters
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    filters = {}
    
    # Get regions
    cursor.execute("SELECT name FROM regions ORDER BY name")
    filters['regions'] = [row['name'] for row in cursor.fetchall()]
    
    # Get meal types
    cursor.execute("SELECT name FROM meal_types ORDER BY name")
    filters['meal_types'] = [row['name'] for row in cursor.fetchall()]
    
    # Get dietary tags
    cursor.execute("SELECT name FROM dietary_tags ORDER BY name")
    filters['dietary_tags'] = [row['name'] for row in cursor.fetchall()]
    
    # Get tastes
    cursor.execute("SELECT name FROM tastes ORDER BY name")
    filters['tastes'] = [row['name'] for row in cursor.fetchall()]
    
    # Get difficulty levels
    cursor.execute("SELECT name FROM difficulty_levels ORDER BY name")
    filters['difficulty_levels'] = [row['name'] for row in cursor.fetchall()]
    
    conn.close()
    return filters


# ============================================================
# Example Usage
# ============================================================

if __name__ == "__main__":
    print("🔍 Testing Recipe Query API Functions\n")
    
    # Test 1: Get Indian recipes
    print("1. Get top 5 Indian recipes:")
    result = get_recipes_by_region("Indian", limit=5)
    for recipe in result['recipes']:
        print(f"  • {recipe['name']} - ⭐ {recipe['rating']}")
    print(f"  Total: {result['pagination']['total']} recipes\n")
    
    # Test 2: Get vegetarian Indian breakfast
    print("2. Get vegetarian Indian breakfast:")
    result = get_recipes_by_region(
        "Indian",
        meal_type="Breakfast",
        dietary_tag="Vegetarian",
        limit=3
    )
    for recipe in result['recipes']:
        print(f"  • {recipe['name']} - {recipe['total_time_minutes']} min")
    print()
    
    # Test 3: Search for chicken recipes
    print("3. Search for 'chicken' in Indian cuisine:")
    results = search_recipes("chicken", region="Indian", limit=3)
    for recipe in results:
        print(f"  • {recipe['name']}")
    print()
    
    # Test 4: Get recipe details
    print("4. Get full details of first recipe:")
    if result['recipes']:
        recipe_id = result['recipes'][0]['id']
        full_recipe = get_recipe_by_id(recipe_id)
        if full_recipe:
            print(f"  Name: {full_recipe['name']}")
            print(f"  Ingredients: {len(full_recipe['ingredients'])}")
            print(f"  Steps: {len(full_recipe['instructions'])}")
            print(f"  Tastes: {', '.join([t['name'] for t in full_recipe['tastes']])}")
    print()
    
    # Test 5: Get filter options
    print("5. Available filters:")
    filters = get_filter_options()
    print(f"  Regions: {', '.join(filters['regions'][:4])}...")
    print(f"  Meal Types: {', '.join(filters['meal_types'])}")
    print()
    
    # Test 6: Get random recipes
    print("6. Get 3 random Indian recipes:")
    random_recipes = get_random_recipes("Indian", limit=3)
    for recipe in random_recipes:
        print(f"  • {recipe['name']}")
    
    print("\n✅ All API functions tested successfully!")
