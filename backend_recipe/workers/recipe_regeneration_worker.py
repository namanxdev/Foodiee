"""
Recipe Regeneration Worker
===========================
Background worker for recipe content regeneration
Handles selective fixing with resume capability
"""

import time
import traceback
import json
from typing import Optional, Dict, List
from datetime import datetime
import psycopg
from psycopg.rows import dict_row
import os
from dotenv import load_dotenv

from core.top_recipes_service import get_recipe_by_id, get_top_recipes, update_recipe
from core.recipe_regeneration_service import RecipeRegenerationService

load_dotenv()


class RecipeRegenerationTracker:
    """Track recipe regeneration progress"""
    
    def __init__(self, job_id: int = None):
        self.job_id = job_id
        self.conn = None
    
    def _get_connection(self):
        """Get database connection"""
        if self.conn is None or self.conn.closed:
            supabase_url = os.environ.get("SUPABASE_OG_URL")
            if not supabase_url:
                raise ValueError("SUPABASE_OG_URL not found in environment variables")
            self.conn = psycopg.connect(supabase_url, row_factory=dict_row)
        return self.conn
    
    def create_job(
        self,
        job_type: str,
        started_by: str,
        fix_main_image: bool = False,
        fix_ingredients_image: bool = False,
        fix_steps_images: bool = False,
        fix_steps_text: bool = False,
        fix_ingredients_text: bool = False,
        cuisine_filter: Optional[str] = None,
        recipe_name: Optional[str] = None,
        recipe_count: Optional[int] = None,
        total_recipes: int = 0
    ) -> int:
        """Create new regeneration job"""
        conn = self._get_connection()
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO recipe_regeneration_jobs 
                (job_type, status, fix_main_image, fix_ingredients_image, 
                 fix_steps_images, fix_steps_text, fix_ingredients_text,
                 cuisine_filter, recipe_name, recipe_count, total_recipes, 
                 started_by, started_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                job_type, 'running', fix_main_image, fix_ingredients_image,
                fix_steps_images, fix_steps_text, fix_ingredients_text,
                cuisine_filter, recipe_name, recipe_count, total_recipes,
                started_by, datetime.now()
            ))
            
            self.job_id = cur.fetchone()['id']
            conn.commit()
        
        return self.job_id
    
    def update_progress(
        self,
        processed: int = 0,
        successful: int = 0,
        failed: int = 0,
        skipped: int = 0,
        last_processed_recipe_id: Optional[int] = None
    ):
        """Update job progress"""
        if not self.job_id:
            return
        
        conn = self._get_connection()
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE recipe_regeneration_jobs
                SET processed_recipes = processed_recipes + %s,
                    successful_recipes = successful_recipes + %s,
                    failed_recipes = failed_recipes + %s,
                    skipped_recipes = skipped_recipes + %s,
                    last_processed_recipe_id = %s
                WHERE id = %s
            """, (processed, successful, failed, skipped, last_processed_recipe_id, self.job_id))
            conn.commit()
    
    def complete_job(self, status: str = 'completed', error_message: Optional[str] = None):
        """Mark job as completed"""
        if not self.job_id:
            return
        
        conn = self._get_connection()
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE recipe_regeneration_jobs
                SET status = %s,
                    completed_at = %s,
                    error_message = %s
                WHERE id = %s
            """, (status, datetime.now(), error_message, self.job_id))
            conn.commit()
    
    def log(
        self,
        message: str,
        log_level: str,
        recipe_id: Optional[int] = None,
        recipe_name: Optional[str] = None,
        operation: Optional[str] = None,
        metadata: Optional[Dict] = None,
        error_details: Optional[Dict] = None
    ):
        """Add log entry"""
        if not self.job_id:
            return
        
        details = {}
        if metadata:
            details.update(metadata)
        if error_details:
            details.update(error_details)
        
        conn = self._get_connection()
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO recipe_regeneration_logs
                (job_id, recipe_id, recipe_name, log_level, message, operation, details)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                self.job_id, recipe_id, recipe_name, log_level.upper(),
                message, operation, psycopg.types.json.Jsonb(details) if details else None
            ))
            conn.commit()
        
        # Also print to console
        print(f"[{log_level.upper()}] {message}")
    
    def get_job_status(self) -> Optional[Dict]:
        """Get current job status"""
        if not self.job_id:
            return None
        
        conn = self._get_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT * FROM recipe_regeneration_jobs WHERE id = %s
            """, (self.job_id,))
            return cur.fetchone()
    
    def close(self):
        """Close database connection"""
        if self.conn and not self.conn.closed:
            self.conn.close()


# ============================================================================
# Worker Functions
# ============================================================================

def process_single_recipe(
    recipe: Dict,
    service: RecipeRegenerationService,
    tracker: RecipeRegenerationTracker,
    fix_main_image: bool,
    fix_ingredients_image: bool,
    fix_steps_images: bool,
    fix_steps_text: bool,
    fix_ingredients_text: bool
) -> bool:
    """
    Process a single recipe with selective fixing
    
    Returns:
        True if any changes were made, False if skipped
    """
    recipe_id = recipe['id']
    recipe_name = recipe['name']
    updates = {}
    
    tracker.log(f"Processing recipe: {recipe_name}", "INFO", recipe_id, recipe_name)
    
    try:
        # Apply fixes
        if fix_main_image:
            _fix_main_image(recipe, service, updates)
        
        if fix_ingredients_image:
            _fix_ingredients_image(recipe, service, updates)
        
        if fix_ingredients_text:
            _fix_ingredients_text(recipe, service, updates)
        
        if fix_steps_text:
            _fix_steps_text(recipe, service, updates)
        
        if fix_steps_images:
            _fix_steps_images(recipe, service, tracker, updates)
        
        # Update database if any changes
        if updates:
            _update_recipe_in_db(recipe_id, recipe_name, updates, tracker)
            tracker.log(
                f"Successfully updated recipe with {len(updates)} changes",
                "SUCCESS",
                recipe_id,
                recipe_name,
                metadata={"fields_updated": list(updates.keys())}
            )
            return True
        else:
            tracker.log(f"No changes needed, skipping", "INFO", recipe_id, recipe_name)
            return False
        
    except Exception as e:
        error_msg = str(e)
        tracker.log(
            f"Failed to process recipe: {error_msg}",
            "ERROR",
            recipe_id,
            recipe_name,
            error_details={"error": error_msg, "traceback": traceback.format_exc()}
        )
        return False


# ============================================================================
# Helper Functions for process_single_recipe
# ============================================================================

def _fix_main_image(recipe: Dict, service: RecipeRegenerationService, updates: Dict):
    """Fix main image if null"""
    current_image = recipe.get('image_url')
    new_image = service.generate_main_image(
        recipe['id'],
        recipe['name'],
        recipe.get('description', ''),
        current_image
    )
    if new_image and new_image != current_image:
        updates['image_url'] = new_image


def _fix_ingredients_image(recipe: Dict, service: RecipeRegenerationService, updates: Dict):
    """Fix ingredients image if null"""
    ingredients = recipe.get('ingredients', '')
    if isinstance(ingredients, (list, dict)):
        ingredients = json.dumps(ingredients)
    
    current_ingredients_image = recipe.get('ingredients_image')
    new_ingredients_image = service.generate_ingredients_image(
        recipe['id'],
        recipe['name'],
        ingredients,
        current_ingredients_image
    )
    if new_ingredients_image and new_ingredients_image != current_ingredients_image:
        updates['ingredients_image'] = new_ingredients_image


def _fix_ingredients_text(recipe: Dict, service: RecipeRegenerationService, updates: Dict):
    """Validate and fix ingredients text"""
    ingredients = recipe.get('ingredients', '')
    if isinstance(ingredients, (list, dict)):
        ingredients = json.dumps(ingredients)
    
    validation_result = service.validate_and_fix_ingredients(
        recipe['id'],
        recipe['name'],
        recipe.get('region', ''),
        ingredients
    )
    if validation_result and not validation_result.get('is_valid'):
        updates['ingredients'] = validation_result.get('corrected_ingredients')


def _fix_steps_text(recipe: Dict, service: RecipeRegenerationService, updates: Dict):
    """Generate or complete beginner and advanced steps"""
    ingredients = recipe.get('ingredients', '')
    if isinstance(ingredients, (list, dict)):
        ingredients = json.dumps(ingredients)
    
    steps = recipe.get('steps', '')
    if isinstance(steps, (list, dict)):
        steps = json.dumps(steps)
    
    # Beginner steps
    existing_beginner = recipe.get('steps_beginner')
    if not existing_beginner or len(existing_beginner) < 10:
        beginner_steps = service.generate_beginner_steps(
            recipe['id'],
            recipe['name'],
            recipe.get('description', ''),
            ingredients,
            steps,
            existing_steps=existing_beginner,
            desired_count=10
        )
        if beginner_steps:
            updates['steps_beginner'] = json.dumps(beginner_steps)
    
    # Advanced steps
    existing_advanced = recipe.get('steps_advanced')
    if not existing_advanced or len(existing_advanced) < 8:
        advanced_steps = service.generate_advanced_steps(
            recipe['id'],
            recipe['name'],
            recipe.get('description', ''),
            ingredients,
            steps,
            existing_steps=existing_advanced,
            desired_count=8
        )
        if advanced_steps:
            updates['steps_advanced'] = json.dumps(advanced_steps)


def _fix_steps_images(recipe: Dict, service: RecipeRegenerationService, tracker: RecipeRegenerationTracker, updates: Dict):
    """Generate missing step images for beginner and advanced steps"""
    recipe_id = recipe['id']
    recipe_name = recipe['name']
    
    # Beginner step images
    beginner_steps = _get_steps_from_recipe_or_updates(recipe, updates, 'steps_beginner')
    if beginner_steps:
        _generate_step_images_if_needed(
            recipe_id, recipe_name, beginner_steps,
            recipe.get('steps_beginner_images', []) or [],
            "beginner", service, tracker, updates
        )
    
    # Advanced step images
    advanced_steps = _get_steps_from_recipe_or_updates(recipe, updates, 'steps_advanced')
    if advanced_steps:
        _generate_step_images_if_needed(
            recipe_id, recipe_name, advanced_steps,
            recipe.get('steps_advanced_images', []) or [],
            "advanced", service, tracker, updates
        )


def _get_steps_from_recipe_or_updates(recipe: Dict, updates: Dict, key: str) -> Optional[List[str]]:
    """Get steps from updates or recipe"""
    if key in updates:
        steps = updates[key]
        return json.loads(steps) if isinstance(steps, str) else steps
    return recipe.get(key)


def _generate_step_images_if_needed(
    recipe_id: int,
    recipe_name: str,
    steps: List[str],
    existing_images: List[dict],
    step_type: str,
    service: RecipeRegenerationService,
    tracker: RecipeRegenerationTracker,
    updates: Dict
):
    """Generate step images if missing"""
    existing_count = len(existing_images)
    required_count = len(steps)
    
    if existing_count < required_count:
        tracker.log(
            f"{step_type.capitalize()} step images: have {existing_count}, need {required_count}. "
            f"Generating {required_count - existing_count} missing images.",
            "INFO",
            recipe_id,
            recipe_name,
            operation=f"step_images_{step_type}"
        )
        
        new_images = service.generate_step_images(
            recipe_id, recipe_name, steps, existing_images, step_type=step_type
        )
        
        if len(new_images) > existing_count:
            updates[f'steps_{step_type}_images'] = json.dumps(new_images)
            tracker.log(
                f"Successfully generated {len(new_images) - existing_count} {step_type} step images. "
                f"Total: {len(new_images)}/{required_count}",
                "SUCCESS",
                recipe_id,
                recipe_name,
                operation=f"step_images_{step_type}"
            )
    elif existing_count == required_count:
        tracker.log(
            f"{step_type.capitalize()} step images already complete ({existing_count}/{required_count}), skipping",
            "INFO",
            recipe_id,
            recipe_name,
            operation=f"step_images_{step_type}"
        )


def _update_recipe_in_db(recipe_id: int, recipe_name: str, updates: Dict, tracker: RecipeRegenerationTracker):
    """Update recipe in database"""
    conn = tracker._get_connection()
    with conn.cursor() as cur:
        # Build UPDATE query with JSONB casting
        jsonb_columns = {
            'steps_beginner', 'steps_advanced',
            'step_image_urls', 'steps_beginner_images', 'steps_advanced_images',
            'ingredient_image_urls'
        }
        set_parts = [f"{key} = %s::jsonb" if key in jsonb_columns else f"{key} = %s" 
                     for key in updates.keys()]
        set_clause = ', '.join(set_parts)
        
        values = list(updates.values()) + [recipe_id]
        
        cur.execute(f"UPDATE top_recipes SET {set_clause} WHERE id = %s", values)
        conn.commit()
        
        # Verify
        cur.execute("""
            SELECT steps_beginner, steps_advanced 
            FROM top_recipes 
            WHERE id = %s
        """, (recipe_id,))
        result = cur.fetchone()
        if result:
            tracker.log(
                f"Verification: steps_beginner has {len(result[0]) if result[0] else 0} steps, "
                f"steps_advanced has {len(result[1]) if result[1] else 0} steps",
                "INFO",
                recipe_id,
                recipe_name
            )


def _to_dict(obj) -> Dict:
    """Convert dataclass/object to dict"""
    from dataclasses import asdict, is_dataclass
    
    if is_dataclass(obj):
        return asdict(obj)
    elif isinstance(obj, dict):
        return obj
    else:
        return obj.__dict__


def _fetch_recipes_for_processing(
    recipe_ids: Optional[List[int]] = None,
    recipe_name: Optional[str] = None,
    cuisine_filter: Optional[str] = None,
    recipe_count: Optional[int] = None
) -> List[Dict]:
    """
    Fetch recipes based on criteria
    
    Args:
        recipe_ids: Specific recipe IDs
        recipe_name: Recipe name to search for
        cuisine_filter: Filter by cuisine/region
        recipe_count: Limit number of recipes
    
    Returns:
        List of recipe dictionaries
    """
    recipes = []
    
    if recipe_ids:
        # Fetch specific recipes by ID
        for rid in recipe_ids:
            recipe = get_recipe_by_id(rid)
            if recipe:
                recipes.append(_to_dict(recipe))
    
    elif recipe_name:
        # Search by recipe name
        all_recipes_list, _ = get_top_recipes(limit=10000, detailed=True)
        for r in all_recipes_list:
            r_dict = _to_dict(r)
            if r_dict['name'].lower() == recipe_name.lower():
                recipes.append(r_dict)
    
    elif cuisine_filter:
        # Filter by cuisine/region
        all_recipes_list, _ = get_top_recipes(limit=10000, detailed=True)
        for r in all_recipes_list:
            r_dict = _to_dict(r)
            if r_dict.get('region', '').lower() == cuisine_filter.lower():
                recipes.append(r_dict)
        if recipe_count:
            recipes = recipes[:recipe_count]
    
    else:
        # All recipes
        all_recipes_list, _ = get_top_recipes(limit=10000, detailed=True)
        recipes = [_to_dict(r) for r in all_recipes_list]
        if recipe_count:
            recipes = recipes[:recipe_count]
    
    return recipes


def start_recipe_regeneration(
    job_type: str,
    started_by: str,
    fix_main_image: bool = False,
    fix_ingredients_image: bool = False,
    fix_steps_images: bool = False,
    fix_steps_text: bool = False,
    fix_ingredients_text: bool = False,
    cuisine_filter: Optional[str] = None,
    recipe_name: Optional[str] = None,
    recipe_count: Optional[int] = None,
    recipe_ids: Optional[List[int]] = None
) -> Dict:
    """
    Start recipe regeneration job
    
    Args:
        job_type: 'mass_generation', 'specific_generation', 'validation'
        started_by: Admin email
        fix_*: Boolean flags for what to fix
        cuisine_filter: Filter by cuisine (for mass generation)
        recipe_name: Specific recipe name (for specific generation)
        recipe_count: Number of recipes to generate (for mass generation)
        recipe_ids: Specific recipe IDs to process (for validation)
        
    Returns:
        Job status dictionary
    """
    tracker = RecipeRegenerationTracker()
    
    try:
        # Get recipes to process
        recipes = _fetch_recipes_for_processing(
            recipe_ids, recipe_name, cuisine_filter, recipe_count
        )
        
        if not recipes:
            return {
                "success": False,
                "message": "No recipes found matching criteria"
            }
        
        # Create job
        job_id = tracker.create_job(
            job_type=job_type,
            started_by=started_by,
            fix_main_image=fix_main_image,
            fix_ingredients_image=fix_ingredients_image,
            fix_steps_images=fix_steps_images,
            fix_steps_text=fix_steps_text,
            fix_ingredients_text=fix_ingredients_text,
            cuisine_filter=cuisine_filter,
            recipe_name=recipe_name,
            recipe_count=recipe_count,
            total_recipes=len(recipes)
        )
        
        tracker.log(
            f"Starting {job_type} for {len(recipes)} recipes",
            "INFO",
            metadata={
                "total_recipes": len(recipes),
                "fix_main_image": fix_main_image,
                "fix_ingredients_image": fix_ingredients_image,
                "fix_steps_images": fix_steps_images,
                "fix_steps_text": fix_steps_text,
                "fix_ingredients_text": fix_ingredients_text
            }
        )
        
        # Initialize service
        service = RecipeRegenerationService(tracker)
        
        # Process recipes
        successful = 0
        failed = 0
        skipped = 0
        
        for i, recipe in enumerate(recipes):
            # Check if job was cancelled
            job_status = tracker.get_job_status()
            if job_status and job_status.get('status') == 'cancelled':
                tracker.log(
                    f"Job cancelled - stopping after processing {i} recipes",
                    "WARNING",
                    metadata={"processed": i}
                )
                break
            
            tracker.log(
                f"Processing recipe {i+1}/{len(recipes)}",
                "INFO",
                metadata={"progress": f"{i+1}/{len(recipes)}"}
            )
            
            changed = process_single_recipe(
                recipe,
                service,
                tracker,
                fix_main_image,
                fix_ingredients_image,
                fix_steps_images,
                fix_steps_text,
                fix_ingredients_text
            )
            
            if changed:
                successful += 1
            else:
                skipped += 1
            
            tracker.update_progress(
                processed=1,
                successful=successful,
                skipped=skipped,
                last_processed_recipe_id=recipe['id']
            )
            
            # Small delay between recipes
            time.sleep(1)
        
        # Complete job
        tracker.complete_job('completed')
        tracker.log(
            f"Job completed: {successful} successful, {skipped} skipped, {failed} failed",
            "SUCCESS",
            metadata={
                "successful": successful,
                "skipped": skipped,
                "failed": failed
            }
        )
        
        return {
            "success": True,
            "job_id": job_id,
            "message": f"Job completed successfully",
            "stats": {
                "total": len(recipes),
                "successful": successful,
                "skipped": skipped,
                "failed": failed
            }
        }
        
    except Exception as e:
        error_msg = str(e)
        tracker.complete_job('failed', error_msg)
        tracker.log(
            f"Job failed: {error_msg}",
            "ERROR",
            error_details={"error": error_msg, "traceback": traceback.format_exc()}
        )
        
        return {
            "success": False,
            "message": f"Job failed: {error_msg}",
            "error": error_msg
        }
    
    finally:
        tracker.close()


def get_job_status(job_id: int) -> Optional[Dict]:
    """Get job status with logs"""
    tracker = RecipeRegenerationTracker(job_id)
    try:
        job = tracker.get_job_status()
        if not job:
            return None
        
        # Add logs to job status
        conn = tracker._get_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT * FROM recipe_regeneration_logs
                WHERE job_id = %s
                ORDER BY created_at ASC
                LIMIT 100
            """, (job_id,))
            job['logs'] = cur.fetchall()
        
        return job
    finally:
        tracker.close()


def get_job_logs(job_id: int, limit: int = 100) -> List[Dict]:
    """Get job logs"""
    tracker = RecipeRegenerationTracker(job_id)
    try:
        conn = tracker._get_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT * FROM recipe_regeneration_logs
                WHERE job_id = %s
                ORDER BY created_at DESC
                LIMIT %s
            """, (job_id, limit))
            return cur.fetchall()
    finally:
        tracker.close()
