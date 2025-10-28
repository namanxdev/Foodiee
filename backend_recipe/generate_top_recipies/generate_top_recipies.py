"""
Top Recipes Generator
=====================
Generates high-quality recipes using Google Gemini AI and stores them in SQLite database.

Features:
- Batch generation (10 recipes per API call)
- Rate limiting with exponential backoff
- Progress tracking and def initialize_gemini():
  
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found in environment variables")
    
    model = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-exp",
        google_api_key=api_key,
        temperature=0.7
    )
    return modelility
- Error handling and retry logic
- SQLite database storage
"""

import os
import json
import time
import sqlite3
import re
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

# Load environment variables
load_dotenv()

# ============================================================
# Configuration
# ============================================================

# Get the directory of this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
DB_PATH = os.path.join(BACKEND_DIR, "data", "top_recipes.db")

RECIPES_PER_REGION = 30
RECIPES_PER_BATCH = 10
DELAY_BETWEEN_BATCHES = 3  # seconds
MAX_RETRIES = 5
INITIAL_RETRY_DELAY = 5  # seconds

# Regions to generate recipes for
REGIONS = [
    "Indian",
    "Chinese", 
    "Italian",
    "Mexican",
    "Japanese",
    "Mediterranean",
    "Thai",
    "Korean"
]

# ============================================================
# Database Helper Functions
# ============================================================

def get_db_connection():
    """Create and return a database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_region_id(conn, region_name: str) -> Optional[int]:
    """Get region ID from database."""
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM regions WHERE name = ?", (region_name,))
    result = cursor.fetchone()
    return result[0] if result else None


def get_difficulty_id(conn, difficulty_name: str) -> Optional[int]:
    """Get difficulty level ID from database."""
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM difficulty_levels WHERE name = ?", (difficulty_name,))
    result = cursor.fetchone()
    return result[0] if result else None


def get_taste_id(conn, taste_name: str) -> Optional[int]:
    """Get taste ID from database."""
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM tastes WHERE name = ?", (taste_name,))
    result = cursor.fetchone()
    return result[0] if result else None


def get_meal_type_id(conn, meal_type_name: str) -> Optional[int]:
    """Get meal type ID from database."""
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM meal_types WHERE name = ?", (meal_type_name,))
    result = cursor.fetchone()
    return result[0] if result else None


def get_dietary_tag_id(conn, tag_name: str) -> Optional[int]:
    """Get dietary tag ID from database."""
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM dietary_tags WHERE name = ?", (tag_name,))
    result = cursor.fetchone()
    return result[0] if result else None


def get_or_create_ingredient(conn, ingredient_name: str, category: str = None) -> int:
    """Get or create ingredient and return its ID."""
    cursor = conn.cursor()
    
    # Try to get existing ingredient
    cursor.execute("SELECT id FROM ingredients WHERE LOWER(name) = LOWER(?)", (ingredient_name,))
    result = cursor.fetchone()
    
    if result:
        return result[0]
    
    # Create new ingredient
    cursor.execute(
        "INSERT INTO ingredients (name, category) VALUES (?, ?)",
        (ingredient_name.strip(), category)
    )
    conn.commit()
    return cursor.lastrowid


def recipe_exists(conn, recipe_name: str, region_name: str) -> bool:
    """Check if a recipe already exists for a region."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COUNT(*) FROM recipes r
        JOIN recipe_regions rr ON r.id = rr.recipe_id
        JOIN regions reg ON rr.region_id = reg.id
        WHERE LOWER(r.name) = LOWER(?) AND reg.name = ?
    """, (recipe_name, region_name))
    return cursor.fetchone()[0] > 0


def count_recipes_for_region(conn, region_name: str) -> int:
    """Count existing recipes for a region."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COUNT(DISTINCT r.id) FROM recipes r
        JOIN recipe_regions rr ON r.id = rr.recipe_id
        JOIN regions reg ON rr.region_id = reg.id
        WHERE reg.name = ?
    """, (region_name,))
    return cursor.fetchone()[0]


# ============================================================
# Recipe Storage Functions
# ============================================================

def insert_recipe(conn, recipe_data: Dict, region_name: str) -> Optional[int]:
    """
    Insert a complete recipe into the database.
    Returns the recipe ID if successful, None otherwise.
    """
    cursor = conn.cursor()
    
    try:
        # Check if recipe already exists
        if recipe_exists(conn, recipe_data['name'], region_name):
            print(f"  ⚠️  Recipe '{recipe_data['name']}' already exists for {region_name}, skipping...")
            return None
        
        # Get difficulty ID
        difficulty_id = get_difficulty_id(conn, recipe_data.get('difficulty', 'Medium'))
        
        # Insert main recipe
        cursor.execute("""
            INSERT INTO recipes (
                name, description, cuisine, prep_time_minutes, cook_time_minutes,
                total_time_minutes, servings, difficulty_id, calories, rating, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            recipe_data['name'],
            recipe_data.get('description', ''),
            recipe_data.get('cuisine', region_name),
            recipe_data.get('prep_time_minutes', 0),
            recipe_data.get('cook_time_minutes', 0),
            recipe_data.get('total_time_minutes', 0),
            recipe_data.get('servings', 4),
            difficulty_id,
            recipe_data.get('calories', 0),
            recipe_data.get('rating', 4.0),
            'gemini'
        ))
        recipe_id = cursor.lastrowid
        
        # Link to region
        region_id = get_region_id(conn, region_name)
        if region_id:
            cursor.execute(
                "INSERT INTO recipe_regions (recipe_id, region_id) VALUES (?, ?)",
                (recipe_id, region_id)
            )
        
        # Insert tastes
        for taste_name in recipe_data.get('tastes', []):
            taste_id = get_taste_id(conn, taste_name)
            if taste_id:
                cursor.execute(
                    "INSERT OR IGNORE INTO recipe_tastes (recipe_id, taste_id, intensity) VALUES (?, ?, ?)",
                    (recipe_id, taste_id, 3)
                )
        
        # Insert meal types
        for meal_type in recipe_data.get('meal_types', []):
            meal_type_id = get_meal_type_id(conn, meal_type)
            if meal_type_id:
                cursor.execute(
                    "INSERT OR IGNORE INTO recipe_meal_types (recipe_id, meal_type_id) VALUES (?, ?)",
                    (recipe_id, meal_type_id)
                )
        
        # Insert dietary tags
        for tag_name in recipe_data.get('dietary_tags', []):
            tag_id = get_dietary_tag_id(conn, tag_name)
            if tag_id:
                cursor.execute(
                    "INSERT OR IGNORE INTO recipe_dietary_tags (recipe_id, dietary_tag_id) VALUES (?, ?)",
                    (recipe_id, tag_id)
                )
        
        # Insert ingredients
        for ing_data in recipe_data.get('ingredients', []):
            ingredient_id = get_or_create_ingredient(conn, ing_data['name'])
            cursor.execute("""
                INSERT OR IGNORE INTO recipe_ingredients (
                    recipe_id, ingredient_id, quantity, unit, preparation_note
                ) VALUES (?, ?, ?, ?, ?)
            """, (
                recipe_id,
                ingredient_id,
                ing_data.get('quantity', ''),
                ing_data.get('unit', ''),
                ing_data.get('preparation', '')
            ))
        
        # Insert instructions
        for idx, instruction in enumerate(recipe_data.get('instructions', []), 1):
            cursor.execute("""
                INSERT INTO recipe_instructions (recipe_id, step_number, instruction)
                VALUES (?, ?, ?)
            """, (recipe_id, idx, instruction))
        
        conn.commit()
        return recipe_id
        
    except Exception as e:
        conn.rollback()
        print(f"  ❌ Error inserting recipe '{recipe_data.get('name', 'Unknown')}': {e}")
        return None


# ============================================================
# Gemini AI Functions
# ============================================================

def initialize_gemini():
    """Initialize Gemini AI model."""
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found in environment variables")
    
    model = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=0.7
    )
    return model


def create_recipe_generation_prompt(region: str, batch_num: int, existing_count: int) -> str:
    """Create a detailed prompt for recipe generation."""
    
    prompt = f"""Generate exactly 10 unique, authentic, and popular {region} recipes.

IMPORTANT REQUIREMENTS:
1. Each recipe MUST be genuinely traditional or popular in {region} cuisine
2. Ensure variety in cooking methods, ingredients, and dish types
3. Include both classic favorites and some lesser-known authentic dishes
4. Make descriptions engaging and informative (100-150 words)
5. All data must be realistic and accurate

This is batch {batch_num}, we already have {existing_count} recipes, so generate DIFFERENT recipes.

Return ONLY a valid JSON array with NO additional text or markdown. Use this exact structure:

[
  {{
    "name": "Exact recipe name",
    "description": "Detailed, engaging description of the dish, its origin, cultural significance, and flavor profile (100-150 words)",
    "cuisine": "{region}",
    "prep_time_minutes": 20,
    "cook_time_minutes": 30,
    "total_time_minutes": 50,
    "servings": 4,
    "difficulty": "Easy|Medium|Hard",
    "tastes": ["Primary", "Secondary"],
    "meal_types": ["Breakfast|Lunch|Dinner|Snack|Dessert"],
    "dietary_tags": ["Vegetarian", "Vegan", "Non-Vegetarian", "Gluten-Free", etc.],
    "ingredients": [
      {{
        "name": "ingredient name",
        "quantity": "2",
        "unit": "cups",
        "preparation": "chopped, diced, minced, etc."
      }}
    ],
    "instructions": [
      "Step 1: Clear, detailed instruction...",
      "Step 2: Clear, detailed instruction...",
      "Step 3: Clear, detailed instruction..."
    ],
    "calories": 350,
    "rating": 4.5
  }}
]

Available tastes: Sweet, Spicy, Savory, Sour, Tangy, Mild, Rich
Available meal types: Breakfast, Lunch, Dinner, Snack, Dessert
Available difficulty levels: Easy, Medium, Hard

Ensure ingredients have proper quantities and units. Instructions should be clear and sequential.
Return ONLY the JSON array, no other text."""

    return prompt


def parse_gemini_response(response_text: str) -> Optional[List[Dict]]:
    """Parse Gemini response and extract JSON array."""
    try:
        # Remove markdown code blocks if present
        text = response_text.strip()
        text = re.sub(r'^```json\s*', '', text)
        text = re.sub(r'^```\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        text = text.strip()
        
        # Parse JSON
        recipes = json.loads(text)
        
        if not isinstance(recipes, list):
            print("  ⚠️  Response is not a JSON array")
            return None
        
        return recipes
        
    except json.JSONDecodeError as e:
        print(f"  ❌ JSON parsing error: {e}")
        print(f"  Response preview: {response_text[:200]}...")
        return None


def generate_recipes_batch(model, region: str, batch_num: int, existing_count: int, retry_count: int = 0) -> Optional[List[Dict]]:
    """
    Generate a batch of recipes with retry logic.
    """
    try:
        prompt = create_recipe_generation_prompt(region, batch_num, existing_count)
        
        print(f"  📝 Generating batch {batch_num} for {region}...")
        response = model.invoke(prompt)
        
        # Extract text content from response
        if hasattr(response, 'content'):
            response_text = response.content
        else:
            response_text = str(response)
        
        if not response_text:
            raise Exception("Empty response from Gemini")
        
        recipes = parse_gemini_response(response_text)
        
        if recipes and len(recipes) > 0:
            print(f"  ✅ Successfully generated {len(recipes)} recipes")
            return recipes
        else:
            raise Exception("No valid recipes in response")
            
    except Exception as e:
        error_msg = str(e)
        print(f"  ⚠️  Error: {error_msg}")
        
        # Check for rate limit errors
        if "429" in error_msg or "quota" in error_msg.lower() or "rate" in error_msg.lower():
            if retry_count < MAX_RETRIES:
                delay = INITIAL_RETRY_DELAY * (2 ** retry_count)
                print(f"  ⏳ Rate limit hit. Waiting {delay} seconds before retry {retry_count + 1}/{MAX_RETRIES}...")
                time.sleep(delay)
                return generate_recipes_batch(model, region, batch_num, existing_count, retry_count + 1)
        
        # Generic retry for other errors
        if retry_count < MAX_RETRIES:
            delay = INITIAL_RETRY_DELAY
            print(f"  🔄 Retrying in {delay} seconds... (Attempt {retry_count + 1}/{MAX_RETRIES})")
            time.sleep(delay)
            return generate_recipes_batch(model, region, batch_num, existing_count, retry_count + 1)
        
        print(f"  ❌ Failed after {MAX_RETRIES} retries")
        return None


# ============================================================
# Main Generation Logic
# ============================================================

def generate_recipes_for_region(model, conn, region: str):
    """Generate all recipes for a specific region."""
    print(f"\n{'='*60}")
    print(f"🍳 Generating recipes for: {region}")
    print(f"{'='*60}")
    
    # Check existing recipes
    existing_count = count_recipes_for_region(conn, region)
    print(f"📊 Existing recipes: {existing_count}/{RECIPES_PER_REGION}")
    
    if existing_count >= RECIPES_PER_REGION:
        print(f"✅ Already have {existing_count} recipes for {region}, skipping...")
        return
    
    recipes_needed = RECIPES_PER_REGION - existing_count
    batches_needed = (recipes_needed + RECIPES_PER_BATCH - 1) // RECIPES_PER_BATCH
    
    print(f"🎯 Need to generate: {recipes_needed} more recipes ({batches_needed} batches)")
    
    successful_recipes = 0
    
    for batch_num in range(1, batches_needed + 1):
        print(f"\n--- Batch {batch_num}/{batches_needed} ---")
        
        # Generate batch
        recipes = generate_recipes_batch(model, region, batch_num, existing_count + successful_recipes)
        
        if not recipes:
            print(f"  ❌ Batch {batch_num} failed, continuing to next batch...")
            time.sleep(DELAY_BETWEEN_BATCHES)
            continue
        
        # Insert recipes into database
        print(f"  💾 Inserting {len(recipes)} recipes into database...")
        for recipe in recipes:
            recipe_id = insert_recipe(conn, recipe, region)
            if recipe_id:
                successful_recipes += 1
                print(f"    ✅ [{successful_recipes}] {recipe['name']}")
        
        # Check if we have enough recipes
        current_total = existing_count + successful_recipes
        print(f"  📊 Progress: {current_total}/{RECIPES_PER_REGION}")
        
        if current_total >= RECIPES_PER_REGION:
            print(f"  🎉 Reached target of {RECIPES_PER_REGION} recipes!")
            break
        
        # Delay before next batch
        if batch_num < batches_needed:
            print(f"  ⏳ Waiting {DELAY_BETWEEN_BATCHES} seconds before next batch...")
            time.sleep(DELAY_BETWEEN_BATCHES)
    
    final_count = count_recipes_for_region(conn, region)
    print(f"\n✅ Completed {region}: {final_count} total recipes")


def generate_all_recipes():
    """Main function to generate recipes for all regions."""
    print("╔" + "═"*58 + "╗")
    print("║" + " "*15 + "TOP RECIPES GENERATOR" + " "*22 + "║")
    print("╚" + "═"*58 + "╝")
    print(f"\n📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Target: {RECIPES_PER_REGION} recipes per region")
    print(f"🌍 Regions: {', '.join(REGIONS)}")
    print(f"📦 Total recipes to generate: {len(REGIONS) * RECIPES_PER_REGION}")
    
    # Initialize
    print("\n🔧 Initializing...")
    model = initialize_gemini()
    conn = get_db_connection()
    
    print("✅ Initialization complete!")
    
    # Generate for each region
    total_start_time = time.time()
    
    for region in REGIONS:
        try:
            generate_recipes_for_region(model, conn, region)
        except Exception as e:
            print(f"\n❌ Error processing {region}: {e}")
            print("Continuing to next region...")
    
    # Final summary
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print("\n" + "="*60)
    print("📊 FINAL SUMMARY")
    print("="*60)
    
    for region in REGIONS:
        count = count_recipes_for_region(conn, region)
        status = "✅" if count >= RECIPES_PER_REGION else "⚠️"
        print(f"{status} {region:15} : {count:3}/{RECIPES_PER_REGION} recipes")
    
    cursor.execute("SELECT COUNT(*) FROM recipes")
    total_recipes = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM ingredients")
    total_ingredients = cursor.fetchone()[0]
    
    elapsed_time = time.time() - total_start_time
    
    print(f"\n📊 Total recipes generated: {total_recipes}")
    print(f"🥘 Unique ingredients: {total_ingredients}")
    print(f"⏱️  Total time: {elapsed_time/60:.2f} minutes")
    print(f"📅 Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    conn.close()
    print("\n✅ All done! 🎉")


# ============================================================
# Entry Point
# ============================================================

if __name__ == "__main__":
    generate_all_recipes()
