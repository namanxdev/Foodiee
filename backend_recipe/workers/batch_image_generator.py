"""
Batch Image Generator
=====================
Main worker for generating images for multiple recipes
Includes retry logic, rate limiting, and progress tracking
"""

import time
import traceback
from typing import Optional, Dict, List
from datetime import datetime

from core.top_recipes_service import get_recipe_by_id, get_top_recipes, update_recipe
from core.s3_service import get_s3_service
from workers.progress_tracker import ProgressTracker
from workers.monitoring import get_active_job, count_recipes_without_images


# ============================================================================
# Retry Logic with Exponential Backoff
# ============================================================================

def retry_with_backoff(func, max_retries=3, initial_delay=15, *args, **kwargs):
    """
    Retry a function with exponential backoff
    
    Args:
        func: Function to retry
        max_retries: Maximum number of retry attempts (reduced to 3)
        initial_delay: Initial delay in seconds (15s as per requirements)
        *args, **kwargs: Arguments to pass to function
        
    Returns:
        Function result if successful
        
    Raises:
        Last exception if all retries fail
    """
    for attempt in range(1, max_retries + 1):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            error_msg = str(e)
            
            if attempt == max_retries:
                print(f"   ❌ Failed after {max_retries} attempts: {error_msg}")
                raise
            
            # Check if it's a rate limit error
            if "429" in error_msg or "rate limit" in error_msg.lower() or "quota" in error_msg.lower():
                wait_time = initial_delay * (attempt ** 1.5)  # Exponential backoff
                print(f"   ⚠️  Rate limit hit. Retry {attempt}/{max_retries} in {wait_time:.1f}s...")
            else:
                wait_time = initial_delay
                print(f"   ⚠️  Error: {error_msg}. Retry {attempt}/{max_retries} in {wait_time:.1f}s...")
            
            time.sleep(wait_time)


# ============================================================================
# Image Generation Functions
# ============================================================================

def generate_main_image_with_retry(
    recipe_id: int,
    recipe_name: str,
    description: str,
    region: str,
    tracker: ProgressTracker
) -> Optional[str]:
    """
    Generate main recipe image with retry logic
    
    Args:
        recipe_id: Recipe ID
        recipe_name: Recipe name
        description: Recipe description
        region: Recipe region/cuisine
        tracker: Progress tracker for logging
        
    Returns:
        S3 public URL if successful, None if failed
    """
    from core.image_generator import ImageGenerator
    from config import llm
    
    try:
        # Initialize image generator (sd_image_prompt is optional for Gemini)
        image_gen = ImageGenerator(llm)
        
        # Create optimized prompt for main image
        prompt = f"""Generate a high-quality, appetizing photo of {recipe_name}.

Description: {description}
Cuisine: {region}

Style: Professional food photography with natural lighting and styled presentation.
Focus: Show the final plated dish with vibrant colors and appetizing appearance.
Composition: Clean background, properly plated, restaurant-quality presentation."""
        
        # Generate image with Gemini (with retry logic)
        def generate_image():
            image_base64, _ = image_gen._generate_with_imagen(prompt)
            if not image_base64:
                raise Exception("No image data returned from Gemini")
            return image_base64
        
        tracker.log(f"Generating main image for: {recipe_name}", "INFO", recipe_id, recipe_name)
        image_base64 = retry_with_backoff(generate_image, max_retries=3, initial_delay=15)
        
        # Upload to S3 (with retry logic)
        def upload_to_s3():
            s3_service = get_s3_service()
            return s3_service.upload_recipe_main_image(
                recipe_id=recipe_id,
                recipe_name=recipe_name,
                image_base64=image_base64,
                archive_existing=True
            )
        
        tracker.log(f"Uploading image to S3...", "INFO", recipe_id, recipe_name)
        s3_url = retry_with_backoff(upload_to_s3, max_retries=3, initial_delay=5)
        
        tracker.log(
            f"Successfully generated and uploaded image",
            "SUCCESS",
            recipe_id,
            recipe_name,
            metadata={"s3_url": s3_url}
        )
        
        return s3_url
        
    except Exception as e:
        error_msg = str(e)
        tracker.log(
            f"Failed to generate image: {error_msg}",
            "ERROR",
            recipe_id,
            recipe_name,
            error_details={"error": error_msg, "traceback": traceback.format_exc()}
        )
        return None


def generate_step_images_with_retry(
    recipe_id: int,
    recipe_name: str,
    steps: List[str],
    existing_step_images: List[dict],
    tracker: ProgressTracker,
    step_type: str = "original",
    ingredients: Optional[List[str]] = None
) -> List[dict]:
    """
    Generate step images with cumulative state (unified prompt generator)
    Only generates missing images (when steps.length > step_images.length)
    
    Uses the same unified prompt generator as preferences flow for consistency.
    
    Args:
        recipe_id: Recipe ID
        recipe_name: Recipe name
        steps: List of step descriptions
        existing_step_images: List of existing step image dicts [{url, step_index, generated_at}]
        tracker: Progress tracker for logging
        step_type: Type of step ('original', 'beginner', 'advanced')
        ingredients: Optional list of ingredients (extracted from recipe if not provided)
        
    Returns:
        Complete list of step image dicts (existing + newly generated)
        Format: [{url: str, step_index: int, generated_at: str}]
    """
    from core.image_generator import ImageGenerator
    from core.step_image_prompt_generator import create_prompt_generator_for_recipe
    from core.top_recipes_service import get_recipe_by_id
    from config import llm
    import json
    
    # Check if we need to generate more images
    existing_count = len(existing_step_images)
    total_steps = len(steps)
    
    if existing_count >= total_steps:
        tracker.log(
            f"All step images already exist ({existing_count}/{total_steps})",
            "INFO",
            recipe_id,
            recipe_name
        )
        return existing_step_images
    
    # Extract ingredients if not provided
    if ingredients is None:
        try:
            recipe = get_recipe_by_id(recipe_id)
            if recipe and recipe.ingredients:
                # Parse ingredients from recipe
                if isinstance(recipe.ingredients, str):
                    ingredients_data = json.loads(recipe.ingredients)
                else:
                    ingredients_data = recipe.ingredients
                
                # Extract ingredient names
                if isinstance(ingredients_data, list):
                    ingredients = [ing.get('ingredient', ing.get('name', '')) if isinstance(ing, dict) else str(ing) 
                                 for ing in ingredients_data if ing]
                else:
                    ingredients = []
            else:
                ingredients = []
        except Exception as e:
            tracker.log(
                f"Could not extract ingredients: {e}, continuing without",
                "WARNING",
                recipe_id,
                recipe_name
            )
            ingredients = []
    
    tracker.log(
        f"Generating {total_steps - existing_count} step images (have {existing_count}, need {total_steps}) using unified cumulative state",
        "INFO",
        recipe_id,
        recipe_name
    )
    
    try:
        # Initialize image generator
        image_gen = ImageGenerator(llm)
        s3_service = get_s3_service()
        new_step_images = list(existing_step_images)  # Copy existing step images
        
        # Create unified prompt generator with cumulative state
        # Ensure LLM is initialized before creating generator
        if llm is None:
            raise RuntimeError("LLM not initialized in batch image generator")
        prompt_generator = create_prompt_generator_for_recipe(recipe_name, ingredients, llm=llm)
        
        # Generate missing step images
        for step_idx in range(existing_count, total_steps):
            # Check for job status/cancellation before each step
            try:
                from workers.monitoring import get_active_job
                active_job = get_active_job()
                if active_job and active_job.get('status') == 'cancelled':
                    tracker.log(
                        f"Job cancelled - stopping step image generation at step {step_idx + 1}/{total_steps}",
                        "WARNING",
                        recipe_id,
                        recipe_name
                    )
                    # Return what we have so far (already saved incrementally)
                    return new_step_images
            except:
                pass  # If monitoring check fails, continue
            
            step_num = step_idx + 1  # 1-based indexing
            current_step = steps[step_idx]
            
            # Generate prompt using unified generator with cumulative state
            prompt, metadata = prompt_generator.generate_prompt(
                step_index=step_idx,
                step_description=current_step,
                use_cumulative_state=True
            )
            
            # Generate image
            def generate_step_image():
                image_base64, _ = image_gen._generate_with_imagen(prompt)
                if not image_base64:
                    raise Exception("No image data returned from Gemini")
                return image_base64
            
            tracker.log(
                f"Generating step {step_num}/{total_steps} image ({step_type})",
                "INFO",
                recipe_id,
                recipe_name
            )
            
            image_base64 = retry_with_backoff(generate_step_image, max_retries=3, initial_delay=15)
            
            # Upload to S3 with step_type
            def upload_step_to_s3():
                return s3_service.upload_recipe_step_image(
                    recipe_id=recipe_id,
                    recipe_name=recipe_name,
                    step_index=step_num,
                    image_base64=image_base64,
                    archive_existing=True,
                    step_type=step_type
                )
            
            s3_url = retry_with_backoff(upload_step_to_s3, max_retries=3, initial_delay=5)
            
            # Create step image dict with metadata
            from datetime import datetime
            step_image_dict = {
                "url": s3_url,
                "step_index": step_idx,  # 0-based index
                "generated_at": datetime.now().isoformat()
            }
            new_step_images.append(step_image_dict)
            
            # *** CRITICAL: Incrementally save to database after each image ***
            # This prevents data loss if the process is interrupted
            field_name = f'steps_{step_type}_images' if step_type != 'original' else 'step_image_urls'
            try:
                update_recipe(recipe_id=recipe_id, **{field_name: new_step_images})
                tracker.log(
                    f"Incrementally saved {len(new_step_images)} {step_type} step images to database",
                    "INFO",
                    recipe_id,
                    recipe_name
                )
            except Exception as db_error:
                tracker.log(
                    f"Warning: Failed to incrementally save to database: {str(db_error)}",
                    "WARNING",
                    recipe_id,
                    recipe_name
                )
            
            tracker.log(
                f"Successfully generated step {step_num}/{total_steps} image ({step_type})",
                "SUCCESS",
                recipe_id,
                recipe_name,
                metadata={"step": step_num, "step_type": step_type, "s3_url": s3_url}
            )
            
            # Rate limiting: 2 second delay between generations
            if step_num < total_steps:
                time.sleep(2)
        
        return new_step_images
        
    except Exception as e:
        error_msg = str(e)
        tracker.log(
            f"Failed to generate step images: {error_msg}",
            "ERROR",
            recipe_id,
            recipe_name,
            error_details={"error": error_msg, "traceback": traceback.format_exc()}
        )
        # CRITICAL: Re-raise the exception to properly terminate the job
        # Don't silently continue - this was causing infinite loops
        raise


# ============================================================================
# Main Batch Generation Function
# ============================================================================

def start_batch_image_generation(
    image_type: str = "main",
    start_from_recipe_id: Optional[int] = None
) -> Dict:
    """
    Start batch image generation job
    
    Args:
        image_type: Type of images to generate ('main', 'steps', 'all')
        start_from_recipe_id: Optional starting recipe ID
        
    Returns:
        Job information dictionary
    """
    # Check if there's already a running job
    active_job = get_active_job()
    if active_job:
        return {
            "success": False,
            "message": "Another job is already running",
            "job_id": active_job['id']
        }
    
    # Count recipes that need images
    total_without_images = count_recipes_without_images()
    
    # Create new job
    tracker = ProgressTracker()
    job_id = tracker.create_job(
        image_type=image_type,
        start_from_recipe_id=start_from_recipe_id,
        total_recipes=total_without_images
    )
    
    tracker.log(
        f"Started batch image generation job (type: {image_type})",
        "INFO",
        metadata={
            "image_type": image_type,
            "start_from_recipe_id": start_from_recipe_id,
            "total_recipes": total_without_images
        }
    )
    
    try:
        # Get recipes without images
        if start_from_recipe_id:
            # Start from specific recipe
            recipes, _ = get_top_recipes(
                detailed=True,
                limit=10000,  # Large limit to get all
                sort_by="id",
                sort_order="ASC"
            )
            # Filter recipes >= start_from_recipe_id and without images
            recipes_to_process = [
                r for r in recipes
                if r.id >= start_from_recipe_id and (not r.image_url or r.image_url == '')
            ]
        else:
            # Auto-detect: get all recipes without images
            recipes, _ = get_top_recipes(
                detailed=True,
                limit=10000,
                sort_by="id",
                sort_order="ASC"
            )
            recipes_to_process = [r for r in recipes if not r.image_url or r.image_url == '']
        
        if not recipes_to_process:
            tracker.log("No recipes found that need images", "INFO")
            tracker.update_job_status("completed")
            tracker.close()
            return {
                "success": True,
                "message": "No recipes need images",
                "job_id": job_id
            }
        
        # Update total count
        tracker.update_progress(completed_count=0, failed_count=0, skipped_count=0)
        
        # Log starting point
        first_recipe = recipes_to_process[0]
        tracker.log(
            f"Starting from Recipe #{first_recipe.id}: {first_recipe.name}",
            "INFO",
            first_recipe.id,
            first_recipe.name
        )
        
        # Process each recipe
        completed = 0
        failed = 0
        skipped = 0
        consecutive_rate_limit_failures = 0
        MAX_CONSECUTIVE_RATE_LIMIT_FAILURES = 3
        
        for recipe in recipes_to_process:
            # Check if should stop
            if tracker.check_should_stop():
                tracker.log("Stop requested - finishing current recipe and stopping", "WARNING")
                tracker.update_job_status("stopped", recipe.id, recipe.name)
                break
            
            # Check if too many consecutive rate limit failures
            if consecutive_rate_limit_failures >= MAX_CONSECUTIVE_RATE_LIMIT_FAILURES:
                tracker.log(
                    f"Terminating job: Hit rate limits {consecutive_rate_limit_failures} times consecutively",
                    "ERROR"
                )
                tracker.update_job_status("failed", error_message=f"Rate limit exceeded after {consecutive_rate_limit_failures} consecutive failures")
                tracker.close()
                return {
                    "success": False,
                    "message": f"Job terminated due to repeated rate limit errors",
                    "job_id": job_id,
                    "completed": completed,
                    "failed": failed,
                    "skipped": skipped
                }
            
            # Update current recipe
            tracker.update_job_status("running", recipe.id, recipe.name)
            tracker.log(
                f"Processing Recipe #{recipe.id}: {recipe.name}",
                "INFO",
                recipe.id,
                recipe.name
            )
            
            try:
                # Generate main image
                if image_type in ["main", "all"]:
                    if recipe.image_url and recipe.image_url != '':
                        tracker.log(f"Main image already exists, skipping", "INFO", recipe.id, recipe.name)
                        skipped += 1
                    else:
                        s3_url = generate_main_image_with_retry(
                            recipe.id,
                            recipe.name,
                            recipe.description or "",
                            recipe.region or "",
                            tracker
                        )
                        
                        if s3_url:
                            # Update database
                            update_recipe(recipe_id=recipe.id, image_url=s3_url)
                            completed += 1
                            tracker.log(
                                f"Updated database with main image URL",
                                "SUCCESS",
                                recipe.id,
                                recipe.name
                            )
                        else:
                            failed += 1
                
                # Generate step images (using new format)
                if image_type in ["steps", "all"]:
                    # Convert old format to new if needed
                    existing_step_images = []
                    if recipe.step_image_urls:
                        if isinstance(recipe.step_image_urls, list) and len(recipe.step_image_urls) > 0:
                            if isinstance(recipe.step_image_urls[0], str):
                                # Old format: convert to new format
                                from datetime import datetime
                                existing_step_images = [
                                    {"url": url, "step_index": idx, "generated_at": datetime.now().isoformat()}
                                    for idx, url in enumerate(recipe.step_image_urls)
                                ]
                            else:
                                # Already new format
                                existing_step_images = recipe.step_image_urls
                    
                    step_images = generate_step_images_with_retry(
                        recipe.id,
                        recipe.name,
                        recipe.steps,
                        existing_step_images,
                        tracker,
                        step_type="original"
                    )
                    
                    # Update database if new images were generated
                    if len(step_images) > len(existing_step_images):
                        update_recipe(recipe_id=recipe.id, step_image_urls=step_images)
                        completed += 1
                
                # Reset consecutive failure counter on success
                consecutive_rate_limit_failures = 0
                
                # Update progress
                tracker.update_progress(
                    completed_count=completed,
                    failed_count=failed,
                    skipped_count=skipped,
                    last_processed_recipe_id=recipe.id
                )
                
                # Rate limiting: 2 second delay between recipes
                time.sleep(2)
                
            except Exception as e:
                error_msg = str(e)
                is_rate_limit_error = "429" in error_msg or "rate limit" in error_msg.lower() or "quota" in error_msg.lower()
                
                tracker.log(
                    f"Unexpected error processing recipe: {error_msg}",
                    "ERROR",
                    recipe.id,
                    recipe.name,
                    error_details={"error": error_msg, "traceback": traceback.format_exc(), "is_rate_limit": is_rate_limit_error}
                )
                failed += 1
                tracker.update_progress(failed_count=failed)
                
                # Track consecutive rate limit failures
                if is_rate_limit_error:
                    consecutive_rate_limit_failures += 1
                    tracker.log(
                        f"Rate limit error detected ({consecutive_rate_limit_failures}/{MAX_CONSECUTIVE_RATE_LIMIT_FAILURES})",
                        "WARNING",
                        recipe.id,
                        recipe.name
                    )
                else:
                    # Reset counter if it's not a rate limit error
                    consecutive_rate_limit_failures = 0
        
        # Complete job
        tracker.update_job_status("completed")
        tracker.log(
            f"Job completed: {completed} succeeded, {failed} failed, {skipped} skipped",
            "SUCCESS",
            metadata={
                "completed": completed,
                "failed": failed,
                "skipped": skipped
            }
        )
        tracker.close()
        
        return {
            "success": True,
            "message": "Job completed",
            "job_id": job_id,
            "completed": completed,
            "failed": failed,
            "skipped": skipped
        }
        
    except Exception as e:
        error_msg = str(e)
        tracker.log(
            f"Job failed with error: {error_msg}",
            "ERROR",
            error_details={"error": error_msg, "traceback": traceback.format_exc()}
        )
        tracker.update_job_status("failed", error_message=error_msg)
        tracker.close()
        
        return {
            "success": False,
            "message": f"Job failed: {error_msg}",
            "job_id": job_id
        }


# ============================================================================
# Helper Functions
# ============================================================================

def stop_batch_image_generation(job_id: int) -> Dict:
    """
    Request graceful stop for a running job
    
    Args:
        job_id: Job ID to stop
        
    Returns:
        Status dictionary
    """
    from workers.monitoring import stop_job
    
    success = stop_job(job_id)
    
    if success:
        return {
            "success": True,
            "message": "Stop signal sent. Job will finish current recipe and stop.",
            "job_id": job_id
        }
    else:
        return {
            "success": False,
            "message": "Job not found or not running",
            "job_id": job_id
        }


def get_job_status(job_id: int) -> Dict:
    """
    Get status of a job
    
    Args:
        job_id: Job ID
        
    Returns:
        Job status dictionary
    """
    from workers.monitoring import get_job_by_id
    
    job = get_job_by_id(job_id)
    
    if not job:
        return {
            "success": False,
            "message": "Job not found"
        }
    
    return {
        "success": True,
        "job": job
    }


def get_job_logs(job_id: int, limit: int = 100, level: Optional[str] = None) -> Dict:
    """
    Get logs for a job
    
    Args:
        job_id: Job ID
        limit: Maximum number of logs
        level: Filter by level (optional)
        
    Returns:
        Logs dictionary
    """
    from workers.monitoring import get_job_logs as fetch_logs
    
    logs = fetch_logs(job_id, limit, level)
    
    return {
        "success": True,
        "job_id": job_id,
        "logs": logs,
        "count": len(logs)
    }
