"""
Recipe Creation Service
=======================
Creates complete recipes from scratch by leveraging existing regeneration service
"""

import json
import time
from typing import Dict, List, Any
from datetime import datetime

from core.recipe_regeneration_service import RecipeRegenerationService
from prompts.recipe_creation_prompts import (
    RECIPE_NAME_PROMPT,
    RECIPE_DESCRIPTION_PROMPT,
    INGREDIENTS_LIST_PROMPT,
    STEPS_PROMPT,
    RECIPE_METADATA_PROMPT
)


class RecipeCreationService:
    """Service for creating complete recipes from scratch - extends regeneration service"""
    
    def __init__(self, tracker=None):
        """
        Initialize service by reusing existing regeneration service
        
        Args:
            tracker: Optional ProgressTracker instance for logging
        """
        # Create a dummy tracker if none provided
        if tracker is None:
            tracker = DummyTracker()
        
        # Reuse existing regeneration service for all image/content generation
        self.regen_service = RecipeRegenerationService(tracker)
        self.tracker = tracker
    
    def _log(self, message: str, level: str = "INFO"):
        """Safe logging"""
        print(f"[{level}] {message}")
        if hasattr(self.tracker, 'log'):
            try:
                self.tracker.log(message, level, -1, "new_recipe")
            except:
                pass
    
    def _generate_text(self, prompt: str) -> str:
        """Generate text using LLM with retry"""
        def generate():
            response = self.regen_service.get_llm().invoke(prompt)
            return response.content if hasattr(response, 'content') else str(response)
        
        return self.regen_service.retry_with_backoff(generate, max_retries=3, initial_delay=2)
    
    def generate_recipe_name(self, dish_name: str, region: str) -> str:
        """Generate formatted recipe name"""
        self._log(f"Generating recipe name for: {dish_name}")
        prompt = RECIPE_NAME_PROMPT.format(dish_name=dish_name, region=region)
        name = self._generate_text(prompt).strip().strip('"').strip("'")
        self._log(f"✓ Generated name: {name}", "SUCCESS")
        return name
    
    def generate_description(self, recipe_name: str, region: str) -> str:
        """Generate recipe description"""
        self._log(f"Generating description")
        prompt = RECIPE_DESCRIPTION_PROMPT.format(recipe_name=recipe_name, region=region)
        description = self._generate_text(prompt).strip()
        self._log(f"✓ Generated description", "SUCCESS")
        return description
    
    def generate_ingredients(self, recipe_name: str, region: str) -> List[Dict[str, str]]:
        """Generate ingredients list"""
        self._log(f"Generating ingredients")
        
        prompt = INGREDIENTS_LIST_PROMPT.format(recipe_name=recipe_name, region=region)
        content = self._generate_text(prompt)
        
        # Parse JSON
        content = content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()
        
        ingredients = json.loads(content)
        
        # Format ingredients
        formatted = []
        for ing in ingredients:
            if isinstance(ing, dict):
                formatted.append({
                    "ingredient": ing.get("ingredient") or ing.get("name", ""),
                    "quantity": ing.get("quantity", "to taste"),
                    "notes": ing.get("notes", "")
                })
        
        self._log(f"✓ Generated {len(formatted)} ingredients", "SUCCESS")
        return formatted
    
    def generate_steps(self, recipe_name: str, ingredients: List[Dict], level: str) -> List[str]:
        """Generate cooking steps"""
        self._log(f"Generating {level} steps")
        
        ingredients_str = "\n".join([f"- {ing['ingredient']}: {ing['quantity']}" for ing in ingredients])
        prompt = STEPS_PROMPT.format(recipe_name=recipe_name, ingredients=ingredients_str, level=level)
        content = self._generate_text(prompt)
        
        # Parse JSON
        content = content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()
        
        steps = json.loads(content)
        self._log(f"✓ Generated {len(steps)} {level} steps", "SUCCESS")
        return steps
    
    def generate_metadata(self, recipe_name: str, region: str) -> Dict[str, Any]:
        """Generate recipe metadata (times, calories, tags, etc.)"""
        self._log("Generating recipe metadata (times, calories, tags)")
        
        prompt = RECIPE_METADATA_PROMPT.format(recipe_name=recipe_name, region=region)
        content = self._generate_text(prompt)
        
        # Parse JSON
        content = content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()
        
        metadata = json.loads(content)
        
        # Calculate total time
        prep_time = metadata.get('prep_time_minutes', 20)
        cook_time = metadata.get('cook_time_minutes', 30)
        total_time = prep_time + cook_time
        
        # Get rating, ensure it's between 3.5 and 5.0
        rating = metadata.get('rating', 4.0)
        rating = max(3.5, min(5.0, rating))  # Clamp to valid range
        
        self._log(f"✓ Generated metadata: {prep_time}+{cook_time}min, {metadata.get('calories')} cal, {rating}⭐", "SUCCESS")
        return {
            'prep_time_minutes': prep_time,
            'cook_time_minutes': cook_time,
            'total_time_minutes': total_time,
            'calories': metadata.get('calories', 0),
            'rating': rating,
            'tastes': metadata.get('tastes', []),
            'meal_types': metadata.get('meal_types', []),
            'dietary_tags': metadata.get('dietary_tags', [])
        }
    
    def create_recipe_text_only(self, dish_name: str, region: str) -> Dict[str, Any]:
        """
        Generate only text content for a recipe (no images)
        
        Args:
            dish_name: Dish name (e.g., "paneer tikka")
            region: Cuisine region (e.g., "Indian")
        
        Returns:
            Recipe dictionary with text content only (no images)
        """
        try:
            # Step 1: Generate recipe name
            recipe_name = self.generate_recipe_name(dish_name, region)
            
            # Step 2: Generate description
            description = self.generate_description(recipe_name, region)
            
            # Step 3: Generate metadata (times, calories, tags)
            metadata = self.generate_metadata(recipe_name, region)
            
            # Step 4: Generate ingredients
            ingredients = self.generate_ingredients(recipe_name, region)
            
            # Step 5: Generate beginner & advanced steps
            beginner_steps = self.generate_steps(recipe_name, ingredients, "beginner")
            advanced_steps = self.generate_steps(recipe_name, ingredients, "advanced")
            
            # Construct recipe (text only)
            recipe = {
                "name": recipe_name,
                "description": description,
                "region": region,
                "difficulty": "Medium",  # Must match DB constraint: Easy, Medium, Hard
                "prep_time_minutes": metadata['prep_time_minutes'],
                "cook_time_minutes": metadata['cook_time_minutes'],
                "total_time_minutes": metadata['total_time_minutes'],
                "calories": metadata['calories'],
                "rating": metadata['rating'],  # Generated by LLM
                "popularity_score": 0.0,
                "tastes": metadata['tastes'],
                "meal_types": metadata['meal_types'],
                "dietary_tags": metadata['dietary_tags'],
                "ingredients": ingredients,
                "steps_beginner": beginner_steps,
                "steps_advanced": advanced_steps,
            }
            
            self._log(f"✅ Successfully generated text content for: {recipe_name}", "SUCCESS")
            return recipe
            
        except Exception as e:
            self._log(f"❌ Failed to generate recipe text: {e}", "ERROR")
            raise
    
    def generate_recipe_images(
        self,
        recipe_id: int,
        recipe_name: str,
        description: str,
        ingredients: List[Dict],
        steps_beginner: List[str],
        steps_advanced: List[str],
        generate_main_image: bool = True,
        generate_ingredients_image: bool = True,
        generate_step_images: bool = True
    ) -> Dict[str, Any]:
        """
        Generate all images for a recipe using real recipe ID
        
        Args:
            recipe_id: Real recipe ID from database
            recipe_name: Recipe name
            description: Recipe description
            ingredients: List of ingredients
            steps_beginner: Beginner steps
            steps_advanced: Advanced steps
            generate_main_image: Whether to generate main image
            generate_ingredients_image: Whether to generate ingredients image
            generate_step_images: Whether to generate step images
        
        Returns:
            Dictionary with image URLs
        """
        try:
            images = {}
            
            # Generate main image
            if generate_main_image:
                self._log("Generating main image")
                images['main_image'] = self.regen_service.generate_main_image(
                    recipe_id=recipe_id,
                    recipe_name=recipe_name,
                    description=description,
                    current_image=None
                )
            else:
                self._log("Skipping main image generation", "INFO")
                images['main_image'] = None
            
            # Generate ingredients image
            if generate_ingredients_image:
                self._log("Generating ingredients image")
                ingredients_str = ", ".join([ing['ingredient'] for ing in ingredients[:10]])
                images['ingredients_image'] = self.regen_service.generate_ingredients_image(
                    recipe_id=recipe_id,
                    recipe_name=recipe_name,
                    ingredients=ingredients_str,
                    current_ingredients_image=None
                )
            else:
                self._log("Skipping ingredients image generation", "INFO")
                images['ingredients_image'] = None
            
            # Generate step images
            if generate_step_images:
                self._log(f"Generating beginner step images ({len(steps_beginner)} steps)")
                images['beginner_images'] = self.regen_service.generate_step_images(
                    recipe_id=recipe_id,
                    recipe_name=recipe_name,
                    steps=steps_beginner,
                    existing_step_images=[],
                    step_type="beginner"
                )
                
                self._log(f"Generating advanced step images ({len(steps_advanced)} steps)")
                images['advanced_images'] = self.regen_service.generate_step_images(
                    recipe_id=recipe_id,
                    recipe_name=recipe_name,
                    steps=steps_advanced,
                    existing_step_images=[],
                    step_type="advanced"
                )
            else:
                self._log("Skipping step images generation", "INFO")
                images['beginner_images'] = []
                images['advanced_images'] = []
            
            self._log("✅ Successfully generated all images", "SUCCESS")
            return images
            
        except Exception as e:
            self._log(f"❌ Failed to generate images: {e}", "ERROR")
            raise
    
    def create_recipe_from_scratch(
        self, 
        dish_name: str, 
        region: str,
        generate_main_image: bool = True,
        generate_ingredients_image: bool = True,
        generate_step_images: bool = True
    ) -> Dict[str, Any]:
        """
        Generate complete recipe from scratch
        
        Args:
            dish_name: Dish name (e.g., "paneer tikka")
            region: Cuisine region (e.g., "Indian")
            generate_main_image: Whether to generate main cover image (default: True)
            generate_ingredients_image: Whether to generate ingredients image (default: True)
            generate_step_images: Whether to generate step images (default: True)
        
        Returns:
            Complete recipe dictionary ready to save
        """
        try:
            # Step 1: Generate recipe name
            recipe_name = self.generate_recipe_name(dish_name, region)
            
            # Step 2: Generate description
            description = self.generate_description(recipe_name, region)
            
            # Step 3: Generate ingredients
            ingredients = self.generate_ingredients(recipe_name, region)
            
            # Step 4: Generate beginner & advanced steps
            beginner_steps = self.generate_steps(recipe_name, ingredients, "beginner")
            advanced_steps = self.generate_steps(recipe_name, ingredients, "advanced")
            
            # Step 5: Generate images (conditionally based on flags)
            main_image = None
            if generate_main_image:
                self._log("Generating main image")
                main_image = self.regen_service.generate_main_image(
                    recipe_id=-1,
                    recipe_name=recipe_name,
                    description=description,
                    current_image=None
                )
            else:
                self._log("Skipping main image generation", "INFO")
            
            ingredients_image = None
            if generate_ingredients_image:
                self._log("Generating ingredients image")
                ingredients_str = ", ".join([ing['ingredient'] for ing in ingredients[:10]])
                ingredients_image = self.regen_service.generate_ingredients_image(
                    recipe_id=-1,
                    recipe_name=recipe_name,
                    ingredients=ingredients_str,
                    current_ingredients_image=None
                )
            else:
                self._log("Skipping ingredients image generation", "INFO")
            
            # Step 6: Generate step images (conditionally)
            beginner_images = []
            advanced_images = []
            
            if generate_step_images:
                self._log(f"Generating beginner step images ({len(beginner_steps)} steps)")
                beginner_images = self.regen_service.generate_step_images(
                    recipe_id=-1,
                    recipe_name=recipe_name,
                    steps=beginner_steps,
                    existing_step_images=[],
                    step_type="beginner"
                )
                
                self._log(f"Generating advanced step images ({len(advanced_steps)} steps)")
                advanced_images = self.regen_service.generate_step_images(
                    recipe_id=-1,
                    recipe_name=recipe_name,
                    steps=advanced_steps,
                    existing_step_images=[],
                    step_type="advanced"
                )
            else:
                self._log("Skipping step images generation", "INFO")
            
            # Construct complete recipe
            recipe = {
                "name": recipe_name,
                "description": description,
                "region": region,
                "difficulty": "Medium",  # Must match DB constraint: Easy, Medium, Hard
                "ingredients": ingredients,
                "ingredients_image": ingredients_image,
                "steps_beginner": beginner_steps,
                "steps_advanced": advanced_steps,
                "steps_beginner_images": beginner_images,
                "steps_advanced_images": advanced_images,
                "image_url": main_image,
                "validation_status": "pending",
                "created_at": datetime.now().isoformat(),
            }
            
            self._log(f"✅ Successfully generated complete recipe: {recipe_name}", "SUCCESS")
            return recipe
            
        except Exception as e:
            self._log(f"❌ Failed to generate recipe: {e}", "ERROR")
            raise


class DummyTracker:
    """Dummy tracker for when no job tracking is needed"""
    def log(self, message, level, recipe_id, recipe_name, **kwargs):
        pass
