"""
Query Script: Get Top Indian Recipes
=====================================
Various ways to query and retrieve Indian cuisine recipes from the database.
"""

import sqlite3
import os
from typing import List, Dict, Optional

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
DB_PATH = os.path.join(BACKEND_DIR, "data", "top_recipes.db")


def get_db_connection():
    """Create database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn


def get_all_indian_recipes(limit: int = None) -> List[Dict]:
    """
    Get all Indian recipes with basic information.
    
    Args:
        limit: Optional limit on number of results
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
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
        r.popularity_score
    FROM recipes r
    JOIN recipe_regions rr ON r.id = rr.recipe_id
    JOIN regions reg ON rr.region_id = reg.id
    LEFT JOIN difficulty_levels dl ON r.difficulty_id = dl.id
    WHERE reg.name = 'Indian'
    ORDER BY r.rating DESC, r.popularity_score DESC
    """
    
    if limit:
        query += f" LIMIT {limit}"
    
    cursor.execute(query)
    recipes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return recipes


def get_indian_recipes_by_meal_type(meal_type: str, limit: int = 10) -> List[Dict]:
    """
    Get Indian recipes filtered by meal type.
    
    Args:
        meal_type: Breakfast, Lunch, Dinner, Snack, or Dessert
        limit: Number of results to return
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT DISTINCT
        r.id,
        r.name,
        r.description,
        r.total_time_minutes,
        r.servings,
        dl.name as difficulty,
        r.calories,
        r.rating
    FROM recipes r
    JOIN recipe_regions rr ON r.id = rr.recipe_id
    JOIN regions reg ON rr.region_id = reg.id
    JOIN recipe_meal_types rmt ON r.id = rmt.recipe_id
    JOIN meal_types mt ON rmt.meal_type_id = mt.id
    LEFT JOIN difficulty_levels dl ON r.difficulty_id = dl.id
    WHERE reg.name = 'Indian' AND mt.name = ?
    ORDER BY r.rating DESC
    LIMIT ?
    """
    
    cursor.execute(query, (meal_type, limit))
    recipes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return recipes


def get_indian_recipes_by_taste(taste: str, limit: int = 10) -> List[Dict]:
    """
    Get Indian recipes filtered by taste profile.
    
    Args:
        taste: Sweet, Spicy, Savory, Sour, Tangy, Mild, or Rich
        limit: Number of results to return
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT DISTINCT
        r.id,
        r.name,
        r.description,
        r.total_time_minutes,
        dl.name as difficulty,
        r.rating,
        rt.intensity as taste_intensity
    FROM recipes r
    JOIN recipe_regions rr ON r.id = rr.recipe_id
    JOIN regions reg ON rr.region_id = reg.id
    JOIN recipe_tastes rt ON r.id = rt.recipe_id
    JOIN tastes t ON rt.taste_id = t.id
    LEFT JOIN difficulty_levels dl ON r.difficulty_id = dl.id
    WHERE reg.name = 'Indian' AND t.name = ?
    ORDER BY rt.intensity DESC, r.rating DESC
    LIMIT ?
    """
    
    cursor.execute(query, (taste, limit))
    recipes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return recipes


def get_indian_recipes_by_dietary(dietary_tag: str, limit: int = 10) -> List[Dict]:
    """
    Get Indian recipes filtered by dietary restriction.
    
    Args:
        dietary_tag: Vegetarian, Vegan, Non-Vegetarian, Gluten-Free, etc.
        limit: Number of results to return
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT DISTINCT
        r.id,
        r.name,
        r.description,
        r.total_time_minutes,
        r.servings,
        dl.name as difficulty,
        r.calories,
        r.rating
    FROM recipes r
    JOIN recipe_regions rr ON r.id = rr.recipe_id
    JOIN regions reg ON rr.region_id = reg.id
    JOIN recipe_dietary_tags rdt ON r.id = rdt.recipe_id
    JOIN dietary_tags dt ON rdt.dietary_tag_id = dt.id
    LEFT JOIN difficulty_levels dl ON r.difficulty_id = dl.id
    WHERE reg.name = 'Indian' AND dt.name = ?
    ORDER BY r.rating DESC
    LIMIT ?
    """
    
    cursor.execute(query, (dietary_tag, limit))
    recipes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return recipes


def get_indian_recipes_by_time(max_minutes: int, limit: int = 10) -> List[Dict]:
    """
    Get Indian recipes that can be made within a time limit.
    
    Args:
        max_minutes: Maximum total time in minutes
        limit: Number of results to return
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        r.id,
        r.name,
        r.description,
        r.total_time_minutes,
        r.servings,
        dl.name as difficulty,
        r.rating
    FROM recipes r
    JOIN recipe_regions rr ON r.id = rr.recipe_id
    JOIN regions reg ON rr.region_id = reg.id
    LEFT JOIN difficulty_levels dl ON r.difficulty_id = dl.id
    WHERE reg.name = 'Indian' AND r.total_time_minutes <= ?
    ORDER BY r.total_time_minutes ASC, r.rating DESC
    LIMIT ?
    """
    
    cursor.execute(query, (max_minutes, limit))
    recipes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return recipes


def get_recipe_details(recipe_id: int) -> Dict:
    """
    Get complete details for a specific recipe including ingredients and instructions.
    
    Args:
        recipe_id: ID of the recipe
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
    
    recipe = dict(cursor.fetchone())
    
    # Get ingredients
    cursor.execute("""
        SELECT 
            i.name,
            ri.quantity,
            ri.unit,
            ri.preparation_note
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


def search_indian_recipes(search_term: str, limit: int = 10) -> List[Dict]:
    """
    Search Indian recipes by name or description.
    
    Args:
        search_term: Search keyword
        limit: Number of results to return
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        r.id,
        r.name,
        r.description,
        r.total_time_minutes,
        dl.name as difficulty,
        r.rating
    FROM recipes r
    JOIN recipe_regions rr ON r.id = rr.recipe_id
    JOIN regions reg ON rr.region_id = reg.id
    LEFT JOIN difficulty_levels dl ON r.difficulty_id = dl.id
    WHERE reg.name = 'Indian' 
    AND (r.name LIKE ? OR r.description LIKE ?)
    ORDER BY r.rating DESC
    LIMIT ?
    """
    
    search_pattern = f"%{search_term}%"
    cursor.execute(query, (search_pattern, search_pattern, limit))
    recipes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return recipes


def get_top_rated_indian_recipes(limit: int = 10) -> List[Dict]:
    """
    Get top-rated Indian recipes.
    
    Args:
        limit: Number of results to return
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        r.id,
        r.name,
        r.description,
        r.total_time_minutes,
        r.servings,
        dl.name as difficulty,
        r.calories,
        r.rating,
        r.popularity_score
    FROM recipes r
    JOIN recipe_regions rr ON r.id = rr.recipe_id
    JOIN regions reg ON rr.region_id = reg.id
    LEFT JOIN difficulty_levels dl ON r.difficulty_id = dl.id
    WHERE reg.name = 'Indian'
    ORDER BY r.rating DESC, r.popularity_score DESC
    LIMIT ?
    """
    
    cursor.execute(query, (limit,))
    recipes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return recipes


# ============================================================
# Display Functions
# ============================================================

def print_recipe_summary(recipe: Dict):
    """Print a nice summary of a recipe."""
    print(f"\n{'='*60}")
    print(f"📖 {recipe['name']}")
    print(f"{'='*60}")
    print(f"⏱️  Time: {recipe.get('total_time_minutes', 'N/A')} minutes")
    print(f"🍽️  Servings: {recipe.get('servings', 'N/A')}")
    print(f"📊 Difficulty: {recipe.get('difficulty', 'N/A')}")
    print(f"⭐ Rating: {recipe.get('rating', 'N/A')}/5.0")
    if recipe.get('calories'):
        print(f"🔥 Calories: {recipe['calories']}")
    print(f"\n📝 Description:")
    print(f"{recipe.get('description', 'No description')[:200]}...")


def print_recipe_list(recipes: List[Dict], title: str):
    """Print a list of recipes."""
    print(f"\n{'='*60}")
    print(f"🍛 {title}")
    print(f"{'='*60}")
    print(f"Found {len(recipes)} recipes\n")
    
    for idx, recipe in enumerate(recipes, 1):
        time_str = f"{recipe.get('total_time_minutes', '?')} min"
        rating_str = f"⭐ {recipe.get('rating', 'N/A')}"
        print(f"{idx:2}. {recipe['name']:40} | {time_str:10} | {rating_str}")


# ============================================================
# Example Usage / Main
# ============================================================

def main():
    """Demonstrate various query examples."""
    
    print("\n" + "="*60)
    print("🍛 INDIAN CUISINE RECIPE QUERIES")
    print("="*60)
    
    # Example 1: Get all Indian recipes
    print("\n\n1️⃣  ALL INDIAN RECIPES")
    recipes = get_all_indian_recipes(limit=10)
    print_recipe_list(recipes, "Top 10 Indian Recipes")
    
    # Example 2: Get by meal type
    print("\n\n2️⃣  INDIAN BREAKFAST RECIPES")
    breakfast = get_indian_recipes_by_meal_type("Breakfast", limit=5)
    print_recipe_list(breakfast, "Top 5 Indian Breakfast Recipes")
    
    # Example 3: Get by taste
    print("\n\n3️⃣  SPICY INDIAN RECIPES")
    spicy = get_indian_recipes_by_taste("Spicy", limit=5)
    print_recipe_list(spicy, "Top 5 Spicy Indian Recipes")
    
    # Example 4: Get vegetarian
    print("\n\n4️⃣  VEGETARIAN INDIAN RECIPES")
    veg = get_indian_recipes_by_dietary("Vegetarian", limit=5)
    print_recipe_list(veg, "Top 5 Vegetarian Indian Recipes")
    
    # Example 5: Quick recipes (under 30 minutes)
    print("\n\n5️⃣  QUICK INDIAN RECIPES (Under 30 min)")
    quick = get_indian_recipes_by_time(30, limit=5)
    print_recipe_list(quick, "Quick Indian Recipes")
    
    # Example 6: Search
    print("\n\n6️⃣  SEARCH: 'Chicken'")
    search_results = search_indian_recipes("chicken", limit=5)
    print_recipe_list(search_results, "Indian Chicken Recipes")
    
    # Example 7: Get full details of first recipe
    if recipes:
        print("\n\n7️⃣  FULL RECIPE DETAILS")
        recipe_id = recipes[0]['id']
        full_recipe = get_recipe_details(recipe_id)
        print_recipe_summary(full_recipe)
        
        print(f"\n🥘 Ingredients ({len(full_recipe['ingredients'])}):")
        for ing in full_recipe['ingredients'][:5]:  # Show first 5
            qty = f"{ing['quantity']} {ing['unit']}".strip()
            prep = f" ({ing['preparation_note']})" if ing['preparation_note'] else ""
            print(f"  • {qty} {ing['name']}{prep}")
        
        if len(full_recipe['ingredients']) > 5:
            print(f"  ... and {len(full_recipe['ingredients']) - 5} more")
        
        print(f"\n👨‍🍳 Instructions ({len(full_recipe['instructions'])} steps):")
        for inst in full_recipe['instructions'][:3]:  # Show first 3
            print(f"  {inst['step_number']}. {inst['instruction'][:80]}...")
        
        if len(full_recipe['instructions']) > 3:
            print(f"  ... and {len(full_recipe['instructions']) - 3} more steps")
        
        if full_recipe.get('tastes'):
            print(f"\n👅 Taste Profile: {', '.join([t['name'] for t in full_recipe['tastes']])}")
        
        if full_recipe.get('dietary_tags'):
            print(f"🏷️  Dietary: {', '.join(full_recipe['dietary_tags'])}")
    
    print("\n" + "="*60)
    print("✅ Query examples complete!")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
