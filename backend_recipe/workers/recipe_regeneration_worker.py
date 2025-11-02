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
    any_changes = False
    updates = {}
    
    tracker.log(
        f"Processing recipe: {recipe_name}",
        "INFO",
        recipe_id,
        recipe_name
    )
    
    try:
        # 1. Fix Main Image (only if null)
        if fix_main_image:
            current_image = recipe.get('image_url')
            new_image = service.generate_main_image(
                recipe_id,
                recipe_name,
                recipe.get('description', ''),
                current_image
            )
            if new_image and new_image != current_image:
                updates['image_url'] = new_image
                any_changes = True
        
        # 2. Fix Ingredients Image (only if null)
        if fix_ingredients_image:
            # Convert ingredients to JSON string if it's a list/dict
            ingredients = recipe.get('ingredients', '')
            if isinstance(ingredients, (list, dict)):
                ingredients = json.dumps(ingredients)
            
            current_ingredients_image = recipe.get('ingredients_image')
            new_ingredients_image = service.generate_ingredients_image(
                recipe_id,
                recipe_name,
                ingredients,
                current_ingredients_image
            )
            if new_ingredients_image and new_ingredients_image != current_ingredients_image:
                updates['ingredients_image'] = new_ingredients_image
                any_changes = True
        
        # 3. Fix Ingredients Text
        if fix_ingredients_text:
            # Convert ingredients to JSON string if it's a list/dict
            ingredients = recipe.get('ingredients', '')
            if isinstance(ingredients, (list, dict)):
                ingredients = json.dumps(ingredients)
            
            validation_result = service.validate_and_fix_ingredients(
                recipe_id,
                recipe_name,
                recipe.get('region', ''),  # Use 'region' instead of 'cuisine'
                ingredients
            )
            if validation_result and not validation_result.get('is_valid'):
                updates['ingredients'] = validation_result.get('corrected_ingredients')
                any_changes = True
        
        # 4. Fix Steps Text (beginner + advanced) - WITH RESUME LOGIC
        if fix_steps_text:
            # Convert ingredients and steps to JSON strings if they're lists/dicts
            ingredients = recipe.get('ingredients', '')
            if isinstance(ingredients, (list, dict)):
                ingredients = json.dumps(ingredients)
            
            steps = recipe.get('steps', '')
            if isinstance(steps, (list, dict)):
                steps = json.dumps(steps)
            
            # Generate beginner steps (resume if partially complete)
            existing_beginner = recipe.get('steps_beginner') if recipe.get('steps_beginner') else None
            desired_beginner_count = 10  # Default target
            
            # Only generate if not complete
            if not existing_beginner or len(existing_beginner) < desired_beginner_count:
                beginner_steps = service.generate_beginner_steps(
                    recipe_id,
                    recipe_name,
                    recipe.get('description', ''),
                    ingredients,
                    steps,
                    existing_steps=existing_beginner,
                    desired_count=desired_beginner_count
                )
                if beginner_steps:
                    updates['steps_beginner'] = json.dumps(beginner_steps)
                    any_changes = True
            
            # Generate advanced steps (resume if partially complete)
            existing_advanced = recipe.get('steps_advanced') if recipe.get('steps_advanced') else None
            desired_advanced_count = 8  # Default target (fewer than beginner)
            
            # Only generate if not complete
            if not existing_advanced or len(existing_advanced) < desired_advanced_count:
                advanced_steps = service.generate_advanced_steps(
                    recipe_id,
                    recipe_name,
                    recipe.get('description', ''),
                    ingredients,
                    steps,
                    existing_steps=existing_advanced,
                    desired_count=desired_advanced_count
                )
                if advanced_steps:
                    updates['steps_advanced'] = json.dumps(advanced_steps)
                    any_changes = True
        
        # 5. Fix Steps Images (STRICT 1:1 INDEX MATCHING with resume logic)
        # Process beginner first, then advanced - never overwrite, never mismatch
        if fix_steps_images:
            # BEGINNER STEP IMAGES - strict 1:1 matching
            beginner_steps = None
            if 'steps_beginner' in updates:
                beginner = updates['steps_beginner']
                beginner_steps = json.loads(beginner) if isinstance(beginner, str) else beginner
            elif recipe.get('steps_beginner'):
                beginner_steps = recipe['steps_beginner']
            
            if beginner_steps and len(beginner_steps) > 0:
                existing_beginner_images = recipe.get('steps_beginner_images', []) or []
                existing_count = len(existing_beginner_images)
                required_count = len(beginner_steps)
                
                # Only generate if images are missing (existing < required)
                if existing_count < required_count:
                    tracker.log(
                        f"Beginner step images: have {existing_count}, need {required_count}. Generating {required_count - existing_count} missing images.",
                        "INFO",
                        recipe_id,
                        recipe_name,
                        operation="step_images_beginner"
                    )
                    
                    # Generate images for missing indices only
                    new_beginner_images = service.generate_step_images(
                        recipe_id,
                        recipe_name,
                        beginner_steps,
                        existing_beginner_images
                    )
                    
                    if len(new_beginner_images) > existing_count:
                        updates['steps_beginner_images'] = json.dumps(new_beginner_images)
                        any_changes = True
                        tracker.log(
                            f"Successfully generated {len(new_beginner_images) - existing_count} beginner step images. Total: {len(new_beginner_images)}/{required_count}",
                            "SUCCESS",
                            recipe_id,
                            recipe_name,
                            operation="step_images_beginner"
                        )
                elif existing_count == required_count:
                    tracker.log(
                        f"Beginner step images already complete ({existing_count}/{required_count}), skipping",
                        "INFO",
                        recipe_id,
                        recipe_name,
                        operation="step_images_beginner"
                    )
            
            # ADVANCED STEP IMAGES - strict 1:1 matching
            advanced_steps = None
            if 'steps_advanced' in updates:
                advanced = updates['steps_advanced']
                advanced_steps = json.loads(advanced) if isinstance(advanced, str) else advanced
            elif recipe.get('steps_advanced'):
                advanced_steps = recipe['steps_advanced']
            
            if advanced_steps and len(advanced_steps) > 0:
                existing_advanced_images = recipe.get('steps_advanced_images', []) or []
                existing_count = len(existing_advanced_images)
                required_count = len(advanced_steps)
                
                # Only generate if images are missing (existing < required)
                if existing_count < required_count:
                    tracker.log(
                        f"Advanced step images: have {existing_count}, need {required_count}. Generating {required_count - existing_count} missing images.",
                        "INFO",
                        recipe_id,
                        recipe_name,
                        operation="step_images_advanced"
                    )
                    
                    # Generate images for missing indices only
                    new_advanced_images = service.generate_step_images(
                        recipe_id,
                        recipe_name,
                        advanced_steps,
                        existing_advanced_images
                    )
                    
                    if len(new_advanced_images) > existing_count:
                        updates['steps_advanced_images'] = json.dumps(new_advanced_images)
                        any_changes = True
                        tracker.log(
                            f"Successfully generated {len(new_advanced_images) - existing_count} advanced step images. Total: {len(new_advanced_images)}/{required_count}",
                            "SUCCESS",
                            recipe_id,
                            recipe_name,
                            operation="step_images_advanced"
                        )
                elif existing_count == required_count:
                    tracker.log(
                        f"Advanced step images already complete ({existing_count}/{required_count}), skipping",
                        "INFO",
                        recipe_id,
                        recipe_name,
                        operation="step_images_advanced"
                    )
        
        # Update recipe if any changes
        if updates:
            conn = tracker._get_connection()
            with conn.cursor() as cur:
                # Build UPDATE query dynamically with JSONB casting for JSONB columns
                jsonb_columns = {
                    'steps_beginner', 'steps_advanced', 
                    'step_image_urls', 'steps_beginner_images', 'steps_advanced_images',
                    'ingredient_image_urls'
                }
                set_parts = []
                for key in updates.keys():
                    if key in jsonb_columns:
                        set_parts.append(f"{key} = %s::jsonb")
                    else:
                        set_parts.append(f"{key} = %s")
                set_clause = ', '.join(set_parts)
                
                values = list(updates.values())
                values.append(recipe_id)
                
                cur.execute(f"""
                    UPDATE top_recipes
                    SET {set_clause}
                    WHERE id = %s
                """, values)
                conn.commit()
                
                # Verify the update
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
            
            tracker.log(
                f"Successfully updated recipe with {len(updates)} changes",
                "SUCCESS",
                recipe_id,
                recipe_name,
                metadata={"fields_updated": list(updates.keys())}
            )
        else:
            tracker.log(
                f"No changes needed, skipping",
                "INFO",
                recipe_id,
                recipe_name
            )
        
        return any_changes
        
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
        from dataclasses import asdict, is_dataclass
        
        # Get recipes to process
        if recipe_ids:
            # Specific recipes
            recipes = []
            for rid in recipe_ids:
                recipe = get_recipe_by_id(rid)
                if recipe:
                    # Convert dataclass to dict
                    if is_dataclass(recipe):
                        recipes.append(asdict(recipe))
                    elif isinstance(recipe, dict):
                        recipes.append(recipe)
                    else:
                        recipes.append(recipe.__dict__)
        elif recipe_name:
            # Single recipe by name
            all_recipes_list, _ = get_top_recipes(limit=10000, detailed=True)
            # Convert all to dicts
            recipes = []
            for r in all_recipes_list:
                r_dict = asdict(r) if is_dataclass(r) else (r if isinstance(r, dict) else r.__dict__)
                if r_dict['name'].lower() == recipe_name.lower():
                    recipes.append(r_dict)
        elif cuisine_filter:
            # Filter by cuisine/region
            all_recipes_list, _ = get_top_recipes(limit=10000, detailed=True)
            recipes = []
            for r in all_recipes_list:
                r_dict = asdict(r) if is_dataclass(r) else (r if isinstance(r, dict) else r.__dict__)
                if r_dict.get('region', '').lower() == cuisine_filter.lower():
                    recipes.append(r_dict)
            if recipe_count:
                recipes = recipes[:recipe_count]
        else:
            # All recipes
            all_recipes_list, _ = get_top_recipes(limit=10000, detailed=True)
            recipes = []
            for r in all_recipes_list:
                r_dict = asdict(r) if is_dataclass(r) else (r if isinstance(r, dict) else r.__dict__)
                recipes.append(r_dict)
            if recipe_count:
                recipes = recipes[:recipe_count]
        
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
    """Get job status"""
    tracker = RecipeRegenerationTracker(job_id)
    try:
        return tracker.get_job_status()
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
