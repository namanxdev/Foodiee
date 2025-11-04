"""
Recipe Creation Worker
======================
Background worker for creating new recipes from scratch
"""

import traceback
import psycopg
from psycopg.rows import dict_row

from core.recipe_creation_service import RecipeCreationService
from workers.recipe_regeneration_worker import RecipeRegenerationTracker
from utils.db_helpers import get_supabase_url


def run_recipe_creation(
    job_id: int,
    dish_name: str,
    region: str,
    generate_main_image: bool = True,
    generate_ingredients_image: bool = True,
    generate_step_images: bool = True
):
    """
    Run recipe creation in background
    
    Args:
        job_id: Job ID for tracking
        dish_name: Name of the dish to create
        region: Cuisine region
        generate_main_image: Whether to generate main image
        generate_ingredients_image: Whether to generate ingredients image
        generate_step_images: Whether to generate step images
    """
    result_conn = None
    tracker = RecipeRegenerationTracker(job_id=job_id)
    
    try:
        # Initialize service
        service = RecipeCreationService(tracker=tracker)
        supabase_url = get_supabase_url()
        
        # Log start
        tracker.log(f"Starting new recipe creation: {dish_name} ({region})", "INFO")
        _log_image_options(tracker, generate_main_image, generate_ingredients_image, generate_step_images)
        
        # Step 1: Generate text content
        tracker.log("Generating text content", "INFO")
        text_recipe = service.create_recipe_text_only(
            dish_name=dish_name,
            region=region
        )
        
        # Step 2: Save to database (text only)
        tracker.log("Saving recipe to database (text only)", "INFO")
        new_recipe_id = _save_text_recipe(text_recipe, supabase_url)
        tracker.log(f"Recipe created with ID: {new_recipe_id}", "SUCCESS")
        
        # Step 3: Generate images
        generated_images = service.generate_recipe_images(
            recipe_id=new_recipe_id,
            recipe_name=text_recipe['name'],
            description=text_recipe['description'],
            ingredients=text_recipe['ingredients'],
            steps_beginner=text_recipe['steps_beginner'],
            steps_advanced=text_recipe['steps_advanced'],
            generate_main_image=generate_main_image,
            generate_ingredients_image=generate_ingredients_image,
            generate_step_images=generate_step_images
        )
        
        # Step 4: Update recipe with images
        tracker.log("Updating recipe with generated images", "INFO")
        _update_recipe_images(new_recipe_id, generated_images, supabase_url)
        
        # Step 5: Log success
        tracker.log(
            f"✅ Recipe created successfully with ID: {new_recipe_id}",
            "SUCCESS",
            recipe_id=new_recipe_id,
            recipe_name=text_recipe['name'],
            metadata={
                'recipe_id': new_recipe_id,
                'recipe_name': text_recipe['name']
            }
        )
        
        # Mark job as completed
        tracker.complete_job(status='completed')
        
    except Exception as e:
        error_msg = str(e)
        traceback.print_exc()
        
        # Log error
        tracker.log(f"❌ Recipe creation failed: {error_msg}", "ERROR")
        
        # Mark job as failed
        tracker.complete_job(status='failed', error_message=error_msg)
        
    finally:
        if result_conn and not result_conn.closed:
            result_conn.close()
        tracker.close()


def _log_image_options(tracker, generate_main: bool, generate_ingredients: bool, generate_steps: bool):
    """Log which images will be generated"""
    image_options = []
    if generate_main:
        image_options.append("main image")
    if generate_ingredients:
        image_options.append("ingredients image")
    if generate_steps:
        image_options.append("step images")
    
    if image_options:
        tracker.log(f"Will generate: {', '.join(image_options)}", "INFO")
    else:
        tracker.log("No images will be generated (text only)", "INFO")


def _save_text_recipe(text_recipe: dict, supabase_url: str) -> int:
    """
    Save text-only recipe to database
    
    Args:
        text_recipe: Recipe data dictionary
        supabase_url: Database connection URL
    
    Returns:
        New recipe ID
    """
    conn = psycopg.connect(supabase_url, row_factory=dict_row)
    
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO top_recipes (
                    name, description, region, difficulty,
                    prep_time_minutes, cook_time_minutes, total_time_minutes,
                    calories, tastes, meal_types, dietary_tags,
                    rating, popularity_score,
                    ingredients, ingredients_image,
                    steps_beginner, steps_advanced,
                    steps_beginner_images, steps_advanced_images,
                    image_url, validation_status,
                    source, created_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()
                )
                RETURNING id
            """, (
                text_recipe['name'],
                text_recipe['description'],
                text_recipe['region'],
                text_recipe['difficulty'],
                text_recipe.get('prep_time_minutes', 20),
                text_recipe.get('cook_time_minutes', 30),
                text_recipe.get('total_time_minutes', 50),
                text_recipe.get('calories', 0),
                psycopg.types.json.Json(text_recipe.get('tastes', [])),
                text_recipe.get('meal_types', []),
                text_recipe.get('dietary_tags', []),
                text_recipe.get('rating', 0.0),
                text_recipe.get('popularity_score', 0.0),
                psycopg.types.json.Json(text_recipe['ingredients']),
                None,  # ingredients_image - will be generated later
                psycopg.types.json.Json(text_recipe['steps_beginner']),
                psycopg.types.json.Json(text_recipe['steps_advanced']),
                psycopg.types.json.Json([]),  # steps_beginner_images
                psycopg.types.json.Json([]),  # steps_advanced_images
                None,  # image_url - will be generated later
                'pending',
                'admin_generated'
            ))
            new_recipe_id = cur.fetchone()['id']
            conn.commit()
            return new_recipe_id
    finally:
        conn.close()


def _update_recipe_images(recipe_id: int, generated_images: dict, supabase_url: str):
    """
    Update recipe with generated images
    
    Args:
        recipe_id: Recipe ID
        generated_images: Dictionary with image URLs
        supabase_url: Database connection URL
    """
    conn = psycopg.connect(supabase_url, row_factory=dict_row)
    
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE top_recipes
                SET image_url = %s,
                    ingredients_image = %s,
                    steps_beginner_images = %s,
                    steps_advanced_images = %s,
                    validation_status = 'pending'
                WHERE id = %s
            """, (
                generated_images.get('main_image'),
                generated_images.get('ingredients_image'),
                psycopg.types.json.Json(generated_images.get('beginner_images', [])),
                psycopg.types.json.Json(generated_images.get('advanced_images', [])),
                recipe_id
            ))
            conn.commit()
    finally:
        conn.close()

