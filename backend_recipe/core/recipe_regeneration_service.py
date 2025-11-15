"""
Recipe Regeneration Service
===========================
Handles regeneration of recipe data including:
- Main images (only if null)
- Ingredients images (only if null)  
- Step images (resume from where stopped)
- Beginner steps text
- Advanced steps text
- Ingredient validation and fixing
"""

import json
import time
import traceback
from typing import Optional, Dict, List, Tuple
from datetime import datetime

from core.top_recipes_service import get_recipe_by_id, get_top_recipes, update_recipe
from core.s3_service import get_s3_service
from core.image_generator import ImageGenerator
from core.step_image_prompt_generator import create_prompt_generator_for_recipe
from prompts.recipe_regeneration_prompts import (
    INGREDIENTS_IMAGE_PROMPT,
    BEGINNER_STEPS_PROMPT,
    ADVANCED_STEPS_PROMPT,
    INGREDIENT_VALIDATION_PROMPT,
    MAIN_IMAGE_PROMPT
)


class RecipeRegenerationService:
    """Service for regenerating recipe content with smart skip logic"""
    
    def __init__(self, tracker):
        """
        Initialize service
        
        Args:
            tracker: ProgressTracker instance for logging
        """
        self.tracker = tracker
        self.s3_service = get_s3_service()
        self._llm = None
        self._image_gen = None
    
    def get_llm(self):
        """Get LLM instance (lazy load)"""
        if self._llm is None:
            from config import llm
            if llm is None:
                raise RuntimeError("LLM not initialized. Make sure the app has started properly.")
            self._llm = llm
        return self._llm
    
    def get_image_generator(self):
        """Get ImageGenerator instance (lazy load)"""
        if self._image_gen is None:
            self._image_gen = ImageGenerator(self.get_llm())
        return self._image_gen
    
    def retry_with_backoff(self, func, max_retries=3, initial_delay=15, *args, **kwargs):
        """Retry function with exponential backoff"""
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
                    wait_time = initial_delay * (attempt ** 1.5)
                    print(f"   ⚠️  Rate limit hit. Retry {attempt}/{max_retries} in {wait_time:.1f}s...")
                else:
                    wait_time = initial_delay
                    print(f"   ⚠️  Error: {error_msg}. Retry {attempt}/{max_retries} in {wait_time:.1f}s...")
                
                time.sleep(wait_time)
    
    # ========================================================================
    # Main Image Generation
    # ========================================================================
    
    def generate_main_image(
        self,
        recipe_id: int,
        recipe_name: str,
        description: str,
        current_image: Optional[str]
    ) -> Optional[str]:
        """
        Generate main recipe image (only if current_image is null)
        
        Args:
            recipe_id: Recipe ID
            recipe_name: Recipe name
            description: Recipe description
            current_image: Current image URL (if any)
            
        Returns:
            S3 URL if generated, current_image if skipped, None if failed
        """
        # CRITICAL: Skip if image already exists
        if current_image:
            self.tracker.log(
                f"Main image already exists, skipping",
                "INFO",
                recipe_id,
                recipe_name,
                operation="main_image"
            )
            return current_image
        
        try:
            # Create prompt
            prompt = MAIN_IMAGE_PROMPT.format(
                recipe_name=recipe_name,
                description=description
            )
            
            # Generate image
            def generate_image():
                image_base64, _ = self.get_image_generator()._generate_with_imagen(prompt)
                if not image_base64:
                    raise Exception("No image data returned from Gemini")
                return image_base64
            
            self.tracker.log(
                f"Generating main image",
                "INFO",
                recipe_id,
                recipe_name,
                operation="main_image",
                metadata={"prompt": prompt}
            )
            
            image_base64 = self.retry_with_backoff(generate_image)
            
            # Upload to S3
            def upload_to_s3():
                return self.s3_service.upload_recipe_main_image(
                    recipe_id=recipe_id,
                    recipe_name=recipe_name,
                    image_base64=image_base64,
                    archive_existing=True
                )
            
            s3_url = self.retry_with_backoff(upload_to_s3, max_retries=3, initial_delay=5)
            
            self.tracker.log(
                f"Successfully generated main image",
                "SUCCESS",
                recipe_id,
                recipe_name,
                operation="main_image",
                metadata={"s3_url": s3_url}
            )
            
            return s3_url
            
        except Exception as e:
            error_msg = str(e)
            self.tracker.log(
                f"Failed to generate main image: {error_msg}",
                "ERROR",
                recipe_id,
                recipe_name,
                operation="main_image",
                error_details={"error": error_msg, "traceback": traceback.format_exc()}
            )
            return None
    
    # ========================================================================
    # Ingredients Image Generation
    # ========================================================================
    
    def generate_ingredients_image(
        self,
        recipe_id: int,
        recipe_name: str,
        ingredients: str,
        current_ingredients_image: Optional[str]
    ) -> Optional[str]:
        """
        Generate ingredients image (only if current_ingredients_image is null)
        
        Args:
            recipe_id: Recipe ID
            recipe_name: Recipe name
            ingredients: Ingredients list
            current_ingredients_image: Current ingredients image URL (if any)
            
        Returns:
            S3 URL if generated, current_ingredients_image if skipped, None if failed
        """
        # CRITICAL: Skip if ingredients image already exists
        if current_ingredients_image:
            self.tracker.log(
                f"Ingredients image already exists, skipping",
                "INFO",
                recipe_id,
                recipe_name,
                operation="ingredients_image"
            )
            return current_ingredients_image
        
        try:
            # Create prompt
            prompt = INGREDIENTS_IMAGE_PROMPT.format(
                recipe_name=recipe_name,
                ingredients=ingredients
            )
            
            # Generate image
            def generate_image():
                image_base64, _ = self.get_image_generator()._generate_with_imagen(prompt)
                if not image_base64:
                    raise Exception("No image data returned from Gemini")
                return image_base64
            
            self.tracker.log(
                f"Generating ingredients image",
                "INFO",
                recipe_id,
                recipe_name,
                operation="ingredients_image",
                metadata={"prompt": prompt}
            )
            
            image_base64 = self.retry_with_backoff(generate_image)
            
            # Upload to S3 (using step image method with index 0 to distinguish)
            def upload_to_s3():
                return self.s3_service.upload_recipe_step_image(
                    recipe_id=recipe_id,
                    recipe_name=recipe_name,
                    step_index=0,  # Use 0 for ingredients image
                    image_base64=image_base64,
                    archive_existing=True
                )
            
            # Modify path to be ingredients-specific
            s3_url = self.retry_with_backoff(upload_to_s3, max_retries=3, initial_delay=5)
            # Replace "step-0" with "ingredients" in the URL
            s3_url = s3_url.replace("step-0", "ingredients")
            
            self.tracker.log(
                f"Successfully generated ingredients image",
                "SUCCESS",
                recipe_id,
                recipe_name,
                operation="ingredients_image",
                metadata={"s3_url": s3_url}
            )
            
            return s3_url
            
        except Exception as e:
            error_msg = str(e)
            self.tracker.log(
                f"Failed to generate ingredients image: {error_msg}",
                "ERROR",
                recipe_id,
                recipe_name,
                operation="ingredients_image",
                error_details={"error": error_msg, "traceback": traceback.format_exc()}
            )
            return None
    
    # ========================================================================
    # Step Images Generation (with Resume Logic)
    # ========================================================================
    
    def _update_step_images_in_db(self, recipe_id: int, step_type: str, step_images: List[dict]):
        """
        Incrementally update step images in database (Supabase)
        This is called after each individual image generation to prevent data loss
        
        Args:
            recipe_id: Recipe ID
            step_type: 'beginner', 'advanced', or 'original'
            step_images: Complete list of step images to save
        """
        try:
            field_name = f'steps_{step_type}_images' if step_type != 'original' else 'step_image_urls'
            update_recipe(recipe_id=recipe_id, **{field_name: step_images})
            self.tracker.log(
                f"Incrementally saved {len(step_images)} {step_type} step images to database",
                "INFO",
                recipe_id,
                operation="incremental_save"
            )
        except Exception as e:
            # Log but don't fail - we'll retry on next generation
            self.tracker.log(
                f"Warning: Failed to incrementally save to database: {str(e)}",
                "WARNING",
                recipe_id,
                operation="incremental_save"
            )
    
    def generate_step_images(
        self,
        recipe_id: int,
        recipe_name: str,
        steps: List[str],
        existing_step_images: List[dict],
        step_type: str = "original",
        ingredients: Optional[List[str]] = None
    ) -> List[dict]:
        """
        Generate step images with resume capability and cumulative state
        Only generates missing images (when len(steps) > len(step_images))
        
        Uses unified prompt generator with cumulative state for consistent, high-quality prompts.
        
        Args:
            recipe_id: Recipe ID
            recipe_name: Recipe name
            steps: List of step descriptions
            existing_step_images: List of existing step image dicts [{url, step_index, generated_at}]
            step_type: Type of step ('original', 'beginner', 'advanced') for S3 folder organization
            ingredients: Optional list of ingredients (extracted from recipe if not provided)
            
        Returns:
            Complete list of step image dicts (existing + newly generated)
            Format: [{url: str, step_index: int, generated_at: str}]
        """
        # Check if we need to generate more images
        existing_count = len(existing_step_images) if existing_step_images else 0
        total_steps = len(steps)
        
        # CRITICAL: Skip if all step images already exist
        if existing_count >= total_steps:
            self.tracker.log(
                f"All step images already exist ({existing_count}/{total_steps}), skipping",
                "INFO",
                recipe_id,
                recipe_name,
                operation="steps_images"
            )
            return existing_step_images
        
        # Extract ingredients if not provided
        if ingredients is None:
            try:
                recipe = get_recipe_by_id(recipe_id)
                if recipe and recipe.ingredients:
                    # Parse ingredients from recipe
                    import json
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
                self.tracker.log(
                    f"Could not extract ingredients: {e}, continuing without",
                    "WARNING",
                    recipe_id,
                    recipe_name
                )
                ingredients = []
        
        self.tracker.log(
            f"Generating {total_steps - existing_count} step images (have {existing_count}, need {total_steps}) using cumulative state",
            "INFO",
            recipe_id,
            recipe_name,
            operation="steps_images"
        )
        
        try:
            new_step_images = list(existing_step_images) if existing_step_images else []
            
            # Create unified prompt generator with cumulative state
            # Pass LLM from service to ensure it's initialized
            prompt_generator = create_prompt_generator_for_recipe(
                recipe_name, 
                ingredients, 
                llm=self.get_llm()
            )
            
            # Generate missing step images (RESUME LOGIC HERE)
            for step_idx in range(existing_count, total_steps):
                # Check for job cancellation before each step
                if hasattr(self.tracker, 'get_job_status'):
                    job_status = self.tracker.get_job_status()
                    if job_status and job_status.get('status') == 'cancelled':
                        self.tracker.log(
                            f"Job cancelled - stopping step image generation at step {step_idx + 1}/{total_steps}",
                            "WARNING",
                            recipe_id,
                            recipe_name,
                            operation="steps_images"
                        )
                        # Return what we have so far (already saved incrementally)
                        return new_step_images
                
                step_num = step_idx + 1
                current_step = steps[step_idx]
                
                # Generate prompt using unified generator with cumulative state
                prompt, metadata = prompt_generator.generate_prompt(
                    step_index=step_idx,
                    step_description=current_step,
                    use_cumulative_state=True
                )
                
                # Generate image
                def generate_step_image():
                    image_base64, _ = self.get_image_generator()._generate_with_imagen(prompt)
                    if not image_base64:
                        raise Exception("No image data returned from Gemini")
                    return image_base64
                
                self.tracker.log(
                    f"Generating step {step_num}/{total_steps} image ({step_type}) with cumulative state",
                    "INFO",
                    recipe_id,
                    recipe_name,
                    operation="steps_images",
                    metadata={
                        "step": step_num,
                        "step_type": step_type,
                        "prompt": prompt[:200] + "..." if len(prompt) > 200 else prompt,
                        "cumulative_state": metadata
                    }
                )
                
                image_base64 = self.retry_with_backoff(generate_step_image)
                
                # Upload to S3 with step_type
                def upload_step_to_s3():
                    return self.s3_service.upload_recipe_step_image(
                        recipe_id=recipe_id,
                        recipe_name=recipe_name,
                        step_index=step_num,
                        image_base64=image_base64,
                        archive_existing=True,
                        step_type=step_type
                    )
                
                s3_url = self.retry_with_backoff(upload_step_to_s3, max_retries=3, initial_delay=5)
                
                # Create step image dict with metadata
                step_image_dict = {
                    "url": s3_url,
                    "step_index": step_idx,  # 0-based index
                    "generated_at": datetime.now().isoformat()
                }
                new_step_images.append(step_image_dict)
                
                # *** CRITICAL: Incrementally save to database after each image ***
                # This prevents data loss if the process is interrupted
                self._update_step_images_in_db(recipe_id, step_type, new_step_images)
                
                self.tracker.log(
                    f"Successfully generated step {step_num}/{total_steps} image ({step_type})",
                    "SUCCESS",
                    recipe_id,
                    recipe_name,
                    operation="steps_images",
                    metadata={"step": step_num, "step_type": step_type, "s3_url": s3_url}
                )
                
                # Rate limiting: 2 second delay between generations
                if step_num < total_steps:
                    time.sleep(2)
            
            return new_step_images
            
        except Exception as e:
            error_msg = str(e)
            self.tracker.log(
                f"Failed to generate step images: {error_msg}",
                "ERROR",
                recipe_id,
                recipe_name,
                operation="steps_images",
                error_details={"error": error_msg, "traceback": traceback.format_exc()}
            )
            # CRITICAL: Re-raise the exception to properly terminate the job
            # Don't silently continue - this was causing infinite loops
            raise
    
    # ========================================================================
    # Steps Text Generation
    # ========================================================================
    
    def generate_beginner_steps(
        self,
        recipe_id: int,
        recipe_name: str,
        description: str,
        ingredients: str,
        original_steps: Optional[str],
        existing_steps: Optional[List[str]] = None,
        desired_count: int = 10
    ) -> Optional[List[str]]:
        """
        Generate beginner-friendly steps (supports partial/resume generation)
        
        Args:
            existing_steps: Previously generated steps (for resume)
            desired_count: Target number of steps (default 10)
        
        Returns:
            List of step strings or None if failed
        """
        try:
            # Calculate what's needed
            existing_len = len(existing_steps) if existing_steps else 0
            missing_count = max(0, desired_count - existing_len)
            
            if missing_count == 0:
                self.tracker.log(
                    f"Beginner steps already complete ({existing_len}/{desired_count})",
                    "INFO",
                    recipe_id,
                    recipe_name,
                    operation="steps_text"
                )
                return existing_steps
            
            # Create prompt with context for partial generation
            context = ""
            if existing_steps and len(existing_steps) > 0:
                context = f"\n\nEXISTING STEPS (already generated):\n" + "\n".join([f"{i+1}. {step}" for i, step in enumerate(existing_steps)])
                context += f"\n\nGenerate ONLY the next {missing_count} steps, continuing from step {existing_len + 1}. Do not repeat or modify existing steps."
            
            prompt = BEGINNER_STEPS_PROMPT.format(
                recipe_name=recipe_name,
                description=description,
                ingredients=ingredients,
                original_steps=original_steps or "No original steps available"
            ) + context
            
            # Generate with LLM
            def generate_steps():
                response = self.get_llm().invoke(prompt)
                content = response.content if hasattr(response, 'content') else str(response)
                
                # Parse JSON response
                # Remove markdown code blocks if present
                content = content.strip()
                if content.startswith("```"):
                    content = content.split("```")[1]
                    if content.startswith("json"):
                        content = content[4:]
                content = content.strip()
                
                new_steps = json.loads(content)
                if not isinstance(new_steps, list):
                    raise Exception(f"Expected list of steps, got {type(new_steps)}")
                
                # Validate count for partial generation
                if existing_len > 0:
                    # For resume, accept the new steps generated
                    if len(new_steps) < 1 or len(new_steps) > missing_count + 3:
                        raise Exception(f"Invalid number of new steps: {len(new_steps)}. Expected ~{missing_count}")
                else:
                    # For full generation, expect 5-15 steps
                    if len(new_steps) < 5 or len(new_steps) > 15:
                        raise Exception(f"Invalid number of steps: {len(new_steps)}. Expected 5-15")
                
                return new_steps
            
            log_msg = f"Generating beginner steps ({existing_len} existing, {missing_count} needed)"
            self.tracker.log(
                log_msg,
                "INFO",
                recipe_id,
                recipe_name,
                operation="steps_text"
            )
            
            new_steps = self.retry_with_backoff(generate_steps)
            
            # Merge with existing
            final_steps = (existing_steps or []) + new_steps
            
            self.tracker.log(
                f"Successfully generated {len(new_steps)} beginner steps (total: {len(final_steps)})",
                "SUCCESS",
                recipe_id,
                recipe_name,
                operation="steps_text",
                metadata={"new_steps": len(new_steps), "total_steps": len(final_steps)}
            )
            
            return final_steps
            
        except Exception as e:
            error_msg = str(e)
            self.tracker.log(
                f"Failed to generate beginner steps: {error_msg}",
                "ERROR",
                recipe_id,
                recipe_name,
                operation="steps_text",
                error_details={"error": error_msg, "traceback": traceback.format_exc()}
            )
            return None
    
    def generate_advanced_steps(
        self,
        recipe_id: int,
        recipe_name: str,
        description: str,
        ingredients: str,
        original_steps: Optional[str],
        existing_steps: Optional[List[str]] = None,
        desired_count: int = 8
    ) -> Optional[List[str]]:
        """
        Generate advanced/experienced cook steps (supports partial/resume generation)
        
        Args:
            existing_steps: Previously generated steps (for resume)
            desired_count: Target number of steps (default 8, typically fewer than beginner)
        
        Returns:
            List of step strings or None if failed
        """
        try:
            # Calculate what's needed
            existing_len = len(existing_steps) if existing_steps else 0
            missing_count = max(0, desired_count - existing_len)
            
            if missing_count == 0:
                self.tracker.log(
                    f"Advanced steps already complete ({existing_len}/{desired_count})",
                    "INFO",
                    recipe_id,
                    recipe_name,
                    operation="steps_text"
                )
                return existing_steps
            
            # Create prompt with context for partial generation
            context = ""
            if existing_steps and len(existing_steps) > 0:
                context = f"\n\nEXISTING STEPS (already generated):\n" + "\n".join([f"{i+1}. {step}" for i, step in enumerate(existing_steps)])
                context += f"\n\nGenerate ONLY the next {missing_count} steps, continuing from step {existing_len + 1}. Do not repeat or modify existing steps."
            
            prompt = ADVANCED_STEPS_PROMPT.format(
                recipe_name=recipe_name,
                description=description,
                ingredients=ingredients,
                original_steps=original_steps or "No original steps available"
            ) + context
            
            # Generate with LLM
            def generate_steps():
                response = self.get_llm().invoke(prompt)
                content = response.content if hasattr(response, 'content') else str(response)
                
                # Parse JSON response
                content = content.strip()
                if content.startswith("```"):
                    content = content.split("```")[1]
                    if content.startswith("json"):
                        content = content[4:]
                content = content.strip()
                
                new_steps = json.loads(content)
                if not isinstance(new_steps, list):
                    raise Exception(f"Expected list of steps, got {type(new_steps)}")
                
                # Validate count for partial generation
                if existing_len > 0:
                    if len(new_steps) < 1 or len(new_steps) > missing_count + 3:
                        raise Exception(f"Invalid number of new steps: {len(new_steps)}. Expected ~{missing_count}")
                else:
                    if len(new_steps) < 5 or len(new_steps) > 15:
                        raise Exception(f"Invalid number of steps: {len(new_steps)}. Expected 5-15")
                
                return new_steps
            
            log_msg = f"Generating advanced steps ({existing_len} existing, {missing_count} needed)"
            self.tracker.log(
                log_msg,
                "INFO",
                recipe_id,
                recipe_name,
                operation="steps_text"
            )
            
            new_steps = self.retry_with_backoff(generate_steps)
            
            # Merge with existing
            final_steps = (existing_steps or []) + new_steps
            
            self.tracker.log(
                f"Successfully generated {len(new_steps)} advanced steps (total: {len(final_steps)})",
                "SUCCESS",
                recipe_id,
                recipe_name,
                operation="steps_text",
                metadata={"new_steps": len(new_steps), "total_steps": len(final_steps)}
            )
            
            return final_steps
            
        except Exception as e:
            error_msg = str(e)
            self.tracker.log(
                f"Failed to generate advanced steps: {error_msg}",
                "ERROR",
                recipe_id,
                recipe_name,
                operation="steps_text",
                error_details={"error": error_msg, "traceback": traceback.format_exc()}
            )
            return None
    
    # ========================================================================
    # Ingredient Validation
    # ========================================================================
    
    def validate_and_fix_ingredients(
        self,
        recipe_id: int,
        recipe_name: str,
        cuisine: str,
        current_ingredients: str
    ) -> Optional[Dict]:
        """
        Validate and fix recipe ingredients
        
        Returns:
            Dict with validation results or None if failed
        """
        try:
            # Create prompt
            prompt = INGREDIENT_VALIDATION_PROMPT.format(
                recipe_name=recipe_name,
                cuisine=cuisine,
                ingredients=current_ingredients
            )
            
            # Validate with LLM
            def validate_ingredients():
                response = self.get_llm().invoke(prompt)
                content = response.content if hasattr(response, 'content') else str(response)
                
                # Parse JSON response
                content = content.strip()
                if content.startswith("```"):
                    content = content.split("```")[1]
                    if content.startswith("json"):
                        content = content[4:]
                content = content.strip()
                
                result = json.loads(content)
                return result
            
            self.tracker.log(
                f"Validating ingredients",
                "INFO",
                recipe_id,
                recipe_name,
                operation="ingredients_text"
            )
            
            validation_result = self.retry_with_backoff(validate_ingredients)
            
            status = "SUCCESS" if validation_result.get("is_valid") else "WARNING"
            self.tracker.log(
                f"Ingredients validation: {'valid' if validation_result.get('is_valid') else 'needs fixing'}",
                status,
                recipe_id,
                recipe_name,
                operation="ingredients_text",
                metadata=validation_result
            )
            
            return validation_result
            
        except Exception as e:
            error_msg = str(e)
            self.tracker.log(
                f"Failed to validate ingredients: {error_msg}",
                "ERROR",
                recipe_id,
                recipe_name,
                operation="ingredients_text",
                error_details={"error": error_msg, "traceback": traceback.format_exc()}
            )
            return None
