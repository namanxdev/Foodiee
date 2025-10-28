"""
Foodiee Final Database Helper Functions
========================================
Helper functions for working with the denormalized top_recipes_final.db database.

Author: AI Assistant
Date: October 28, 2025
"""

import sqlite3
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass


# Constants
STEP_DELIMITER = '<STEP_DELIMITER>'
DB_PATH = '/Users/chetanr/internship/Foodiee/backend_recipe/data/top_recipes_final.db'


@dataclass
class Recipe:
    """Recipe data structure"""
    id: Optional[int]
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


# ============================================================================
# Validation Functions
# ============================================================================

def validate_step_images_length(steps: List[str], step_image_urls: List[str]) -> bool:
    """
    Validate that steps and step_image_urls have equal length.
    
    Args:
        steps: List of cooking steps
        step_image_urls: List of image URLs (empty strings allowed)
    
    Returns:
        True if valid
    
    Raises:
        ValueError: If lengths don't match
    """
    # Empty state is valid
    if len(steps) == 0 and len(step_image_urls) == 0:
        return True
    
    # Both must have same length
    if len(steps) != len(step_image_urls):
        raise ValueError(
            f"Steps count ({len(steps)}) must equal step_image_urls count ({len(step_image_urls)})"
        )
    
    return True


def validate_difficulty(difficulty: str) -> bool:
    """Validate difficulty level"""
    valid_difficulties = ['Easy', 'Medium', 'Hard']
    if difficulty not in valid_difficulties:
        raise ValueError(f"Difficulty must be one of {valid_difficulties}, got '{difficulty}'")
    return True


def validate_rating(rating: float) -> bool:
    """Validate rating range"""
    if not (0 <= rating <= 5):
        raise ValueError(f"Rating must be 0-5, got {rating}")
    return True


def validate_taste_intensity(intensity: int) -> bool:
    """Validate taste intensity range"""
    if not (1 <= intensity <= 5):
        raise ValueError(f"Taste intensity must be 1-5, got {intensity}")
    return True


# ============================================================================
# Serialization Functions (Python → Database)
# ============================================================================

def serialize_tastes(tastes: List[Tuple[str, int]]) -> str:
    """
    Convert tastes list to database format.
    
    Args:
        tastes: [(taste_name, intensity), ...]
    
    Returns:
        "taste_name:intensity|taste_name:intensity"
    
    Example:
        [('Spicy', 4), ('Savory', 5)] → "Spicy:4|Savory:5"
    """
    for name, intensity in tastes:
        validate_taste_intensity(intensity)
    return '|'.join([f"{name}:{intensity}" for name, intensity in tastes])


def serialize_list(items: List[str]) -> str:
    """
    Convert list to pipe-delimited string.
    
    Example:
        ['Lunch', 'Dinner'] → "Lunch|Dinner"
    """
    return '|'.join(items)


def serialize_ingredients(ingredients: List[Dict[str, str]]) -> str:
    """
    Convert ingredients list to database format.
    
    Args:
        ingredients: [{'quantity', 'unit', 'name', 'preparation_note'}, ...]
    
    Returns:
        Multi-line string with pipe-delimited fields
    
    Example:
        [{'quantity': '750', 'unit': 'grams', 'name': 'Chicken', 'preparation_note': 'cut into pieces'}]
        → "750|grams|Chicken|cut into pieces"
    """
    lines = []
    for ing in ingredients:
        line = f"{ing['quantity']}|{ing['unit']}|{ing['name']}|{ing.get('preparation_note', '')}"
        lines.append(line)
    return '\n'.join(lines)


def serialize_steps(steps: List[str]) -> str:
    """
    Convert steps list to database format using special delimiter.
    
    Args:
        steps: List of step instructions
    
    Returns:
        Steps joined with <STEP_DELIMITER>
    
    Example:
        ['Mix flour, sugar', 'Add eggs, milk'] → "Mix flour, sugar<STEP_DELIMITER>Add eggs, milk"
    """
    return STEP_DELIMITER.join(steps)


def serialize_step_images(step_image_urls: List[str]) -> str:
    """
    Convert step image URLs to database format.
    
    Args:
        step_image_urls: List of image URLs (empty strings for steps without images)
    
    Returns:
        URLs joined with <STEP_DELIMITER>
    """
    return STEP_DELIMITER.join(step_image_urls)


# ============================================================================
# Deserialization Functions (Database → Python)
# ============================================================================

def deserialize_tastes(tastes_str: str) -> List[Tuple[str, int]]:
    """
    Parse tastes string from database.
    
    Args:
        tastes_str: "taste_name:intensity|taste_name:intensity"
    
    Returns:
        [(taste_name, intensity), ...]
    
    Example:
        "Spicy:4|Savory:5" → [('Spicy', 4), ('Savory', 5)]
    """
    if not tastes_str:
        return []
    
    tastes = []
    for entry in tastes_str.split('|'):
        name, intensity = entry.split(':')
        tastes.append((name, int(intensity)))
    return tastes


def deserialize_list(list_str: str) -> List[str]:
    """
    Parse pipe-delimited string to list.
    
    Example:
        "Lunch|Dinner" → ['Lunch', 'Dinner']
    """
    if not list_str:
        return []
    return list_str.split('|')


def deserialize_ingredients(ingredients_str: str) -> List[Dict[str, str]]:
    """
    Parse ingredients string from database.
    
    Args:
        ingredients_str: Multi-line string with pipe-delimited fields
    
    Returns:
        [{'quantity', 'unit', 'name', 'preparation_note'}, ...]
    """
    if not ingredients_str:
        return []
    
    ingredients = []
    for line in ingredients_str.strip().split('\n'):
        if not line:
            continue
        parts = line.split('|')
        ingredients.append({
            'quantity': parts[0],
            'unit': parts[1],
            'name': parts[2],
            'preparation_note': parts[3] if len(parts) > 3 else ''
        })
    return ingredients


def deserialize_steps(steps_str: str) -> List[str]:
    """
    Parse steps string from database.
    
    Args:
        steps_str: "step1<STEP_DELIMITER>step2<STEP_DELIMITER>step3"
    
    Returns:
        ['step1', 'step2', 'step3']
    """
    if not steps_str:
        return []
    return steps_str.split(STEP_DELIMITER)


def deserialize_step_images(step_image_urls_str: str) -> List[str]:
    """
    Parse step image URLs from database.
    
    Args:
        step_image_urls_str: "url1<STEP_DELIMITER>url2<STEP_DELIMITER>"
    
    Returns:
        ['url1', 'url2', '']
    """
    if not step_image_urls_str:
        return []
    return step_image_urls_str.split(STEP_DELIMITER)


# ============================================================================
# Database Operations
# ============================================================================

def get_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    """Get database connection"""
    return sqlite3.connect(db_path)


def insert_recipe(recipe: Recipe, db_path: str = DB_PATH) -> int:
    """
    Insert a recipe into the database.
    
    Args:
        recipe: Recipe object
        db_path: Path to database file
    
    Returns:
        Recipe ID of inserted record
    
    Raises:
        ValueError: If validation fails
    """
    # Validate
    if recipe.difficulty:
        validate_difficulty(recipe.difficulty)
    validate_rating(recipe.rating)
    validate_step_images_length(recipe.steps, recipe.step_image_urls)
    
    # Serialize
    tastes_str = serialize_tastes(recipe.tastes)
    meal_types_str = serialize_list(recipe.meal_types)
    dietary_tags_str = serialize_list(recipe.dietary_tags)
    ingredients_str = serialize_ingredients(recipe.ingredients)
    steps_str = serialize_steps(recipe.steps)
    step_images_str = serialize_step_images(recipe.step_image_urls)
    
    # Insert
    conn = get_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO top_recipes (
            name, description, region, tastes, meal_types, dietary_tags,
            difficulty, prep_time_minutes, cook_time_minutes, total_time_minutes,
            servings, calories, ingredients, steps, image_url, step_image_urls,
            rating, popularity_score, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        recipe.name, recipe.description, recipe.region, tastes_str,
        meal_types_str, dietary_tags_str, recipe.difficulty,
        recipe.prep_time_minutes, recipe.cook_time_minutes, recipe.total_time_minutes,
        recipe.servings, recipe.calories, ingredients_str, steps_str,
        recipe.image_url, step_images_str, recipe.rating, recipe.popularity_score,
        recipe.source
    ))
    
    recipe_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return recipe_id


def get_recipe_by_id(recipe_id: int, db_path: str = DB_PATH) -> Optional[Recipe]:
    """
    Retrieve a recipe by ID.
    
    Args:
        recipe_id: Recipe ID
        db_path: Path to database file
    
    Returns:
        Recipe object or None if not found
    """
    conn = get_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM top_recipes WHERE id = ?", (recipe_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    # Parse row
    return Recipe(
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
        source=row[19]
    )


def update_step_images(recipe_id: int, step_image_urls: List[str], db_path: str = DB_PATH) -> bool:
    """
    Update step image URLs for a recipe.
    
    Args:
        recipe_id: Recipe ID
        step_image_urls: List of image URLs (must match steps count)
        db_path: Path to database file
    
    Returns:
        True if successful
    
    Raises:
        ValueError: If image count doesn't match steps count
    """
    # Get current steps count
    recipe = get_recipe_by_id(recipe_id, db_path)
    if not recipe:
        raise ValueError(f"Recipe {recipe_id} not found")
    
    # Validate length
    validate_step_images_length(recipe.steps, step_image_urls)
    
    # Update
    step_images_str = serialize_step_images(step_image_urls)
    
    conn = get_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute(
        "UPDATE top_recipes SET step_image_urls = ? WHERE id = ?",
        (step_images_str, recipe_id)
    )
    
    conn.commit()
    conn.close()
    
    return True


def print_recipe(recipe: Recipe):
    """Pretty print a recipe"""
    print(f"\n{'='*80}")
    print(f"📖 {recipe.name}")
    print(f"{'='*80}")
    
    if recipe.description:
        print(f"\n{recipe.description}")
    
    print(f"\n📍 Region: {recipe.region}")
    print(f"⭐ Rating: {recipe.rating}/5.0")
    print(f"🔥 Difficulty: {recipe.difficulty}")
    print(f"⏱️  Time: {recipe.total_time_minutes} minutes (Prep: {recipe.prep_time_minutes}, Cook: {recipe.cook_time_minutes})")
    print(f"🍽️  Servings: {recipe.servings}")
    print(f"📊 Calories: {recipe.calories} per serving")
    
    if recipe.tastes:
        print(f"\n👅 Tastes:")
        for taste, intensity in recipe.tastes:
            stars = '⭐' * intensity
            print(f"   • {taste}: {stars} ({intensity}/5)")
    
    if recipe.meal_types:
        print(f"\n🍴 Meal Types: {', '.join(recipe.meal_types)}")
    
    if recipe.dietary_tags:
        print(f"🏷️  Dietary: {', '.join(recipe.dietary_tags)}")
    
    if recipe.ingredients:
        print(f"\n🛒 Ingredients ({len(recipe.ingredients)}):")
        for ing in recipe.ingredients:
            prep_note = f" ({ing['preparation_note']})" if ing['preparation_note'] else ""
            print(f"   • {ing['quantity']} {ing['unit']} {ing['name']}{prep_note}")
    
    if recipe.steps:
        print(f"\n📋 Cooking Steps ({len(recipe.steps)}):")
        for i, (step, image_url) in enumerate(zip(recipe.steps, recipe.step_image_urls), 1):
            print(f"\n   Step {i}: {step}")
            if image_url:
                print(f"   📷 {image_url}")
    
    if recipe.image_url:
        print(f"\n🖼️  Main Image: {recipe.image_url}")
    
    print(f"\n{'='*80}\n")


# ============================================================================
# Example Usage
# ============================================================================

if __name__ == "__main__":
    # Example 1: Create and insert a recipe
    print("Example 1: Creating a new recipe...")
    
    paneer_tikka = Recipe(
        id=None,
        name="Paneer Tikka",
        description="Paneer Tikka is a popular Indian appetizer made with marinated paneer cubes grilled to perfection.",
        region="Indian",
        tastes=[('Spicy', 3), ('Savory', 4), ('Tangy', 2)],
        meal_types=['Snack', 'Dinner'],
        dietary_tags=['Vegetarian', 'Gluten-Free'],
        difficulty='Easy',
        prep_time_minutes=120,  # Including marination
        cook_time_minutes=15,
        total_time_minutes=135,
        servings=4,
        calories=280,
        ingredients=[
            {'quantity': '400', 'unit': 'grams', 'name': 'Paneer', 'preparation_note': 'cut into cubes'},
            {'quantity': '1', 'unit': 'cup', 'name': 'Yogurt', 'preparation_note': 'thick'},
            {'quantity': '2', 'unit': 'tablespoons', 'name': 'Ginger-Garlic Paste', 'preparation_note': ''},
            {'quantity': '1', 'unit': 'tablespoon', 'name': 'Red Chili Powder', 'preparation_note': ''},
            {'quantity': '1', 'unit': 'tablespoon', 'name': 'Garam Masala', 'preparation_note': ''},
            {'quantity': '2', 'unit': 'tablespoons', 'name': 'Lemon Juice', 'preparation_note': ''},
            {'quantity': '2', 'unit': 'tablespoons', 'name': 'Oil', 'preparation_note': ''},
        ],
        steps=[
            'Cut paneer into 1-inch cubes and set aside',
            'Mix yogurt, ginger-garlic paste, spices, lemon juice, and salt in a bowl',
            'Add paneer cubes to the marinade, coat well, and refrigerate for 2 hours',
            'Thread marinated paneer onto skewers',
            'Grill in oven or on stovetop until golden brown with charred edges (about 15 minutes)',
            'Serve hot with mint chutney and lemon wedges'
        ],
        image_url='',  # No image yet
        step_image_urls=['', '', '', '', '', ''],  # 6 empty images for 6 steps
        rating=4.5,
        popularity_score=85.0,
        source='gemini'
    )
    
    # Insert
    recipe_id = insert_recipe(paneer_tikka)
    print(f"✅ Recipe inserted with ID: {recipe_id}")
    
    # Example 2: Retrieve and display
    print("\nExample 2: Retrieving recipe from database...")
    retrieved = get_recipe_by_id(recipe_id)
    print_recipe(retrieved)
    
    # Example 3: Update step images
    print("Example 3: Adding step images...")
    step_images = [
        'https://cdn.example.com/paneer-step1.jpg',
        'https://cdn.example.com/paneer-step2.jpg',
        '',  # No image for step 3
        'https://cdn.example.com/paneer-step4.jpg',
        'https://cdn.example.com/paneer-step5.jpg',
        'https://cdn.example.com/paneer-step6.jpg'
    ]
    
    update_step_images(recipe_id, step_images)
    print("✅ Step images updated")
    
    # Retrieve again to show updates
    updated = get_recipe_by_id(recipe_id)
    print_recipe(updated)
    
    print("\n✨ Examples complete!")
