"""
Base Recommender - Shared functionality for all recommender types
"""

from typing import Optional, Tuple
from langchain_core.output_parsers import StrOutputParser

from prompts import RecipePrompts
from core.image_generator import ImageGenerator


class BaseRecommender:
    """
    Base class for all recommender implementations
    Provides shared functionality like image generation, alternative ingredients
    """
    
    def __init__(self):
        """Initialize base recommender with common components"""
        # Prompts
        self.alternative_prompt = RecipePrompts.get_alternative_prompt()
        self.sd_image_prompt = RecipePrompts.get_image_prompt()
        
        # Image generator (lazy loaded)
        self._image_generator = None
    
    # ========================================================
    # Properties (must be implemented by subclasses)
    # ========================================================
    
    @property
    def llm(self):
        """Get current LLM instance - must be implemented by subclass"""
        raise NotImplementedError("Subclass must implement llm property")
    
    @property
    def vision_llm(self):
        """Get current vision LLM instance - must be implemented by subclass"""
        raise NotImplementedError("Subclass must implement vision_llm property")
    
    # ========================================================
    # Image Generation (Shared across all recommenders)
    # ========================================================
    
    @property
    def image_generator(self):
        """Get or create image generator instance"""
        if self._image_generator is None:
            self._image_generator = ImageGenerator(self.llm, self.sd_image_prompt)
        return self._image_generator
    
    def generate_image_with_gemini(
        self, 
        recipe_name: str, 
        step_description: str
    ) -> Tuple[Optional[str], str]:
        """
        Generate image using Gemini API
        
        Args:
            recipe_name: Name of the recipe
            step_description: Description of the cooking step
            
        Returns:
            Tuple of (base64_image_string, prompt_used)
        """
        return self.image_generator.generate_image(
            recipe_name, 
            step_description, 
            backend="gemini"
        )
    
    def generate_image_with_stable_diffusion(
        self, 
        recipe_name: str, 
        step_description: str
    ) -> Tuple[Optional[str], str]:
        """
        Generate image using Stable Diffusion (local)
        
        Args:
            recipe_name: Name of the recipe
            step_description: Description of the cooking step
            
        Returns:
            Tuple of (base64_image_string, prompt_used)
        """
        return self.image_generator.generate_image(
            recipe_name, 
            step_description, 
            backend="stable_diffusion"
        )
    
    def generate_image_prompt(
        self, 
        recipe_name: str, 
        step_description: str
    ) -> str:
        """
        Generate optimized image prompt
        
        Args:
            recipe_name: Name of the recipe
            step_description: Description of the cooking step
            
        Returns:
            Optimized prompt string
        """
        return self.image_generator.generate_image_prompt(recipe_name, step_description)
    
    # ========================================================
    # Ingredient Alternatives (Shared)
    # ========================================================
    
    def get_ingredient_alternatives(
        self, 
        missing_ingredient: str, 
        recipe_context: str
    ) -> str:
        """
        Get ingredient alternatives using LLM
        
        Args:
            missing_ingredient: The ingredient that's missing
            recipe_context: Context about the recipe
            
        Returns:
            Suggested alternatives
        """
        chain = self.alternative_prompt | self.llm | StrOutputParser()
        return chain.invoke({
            "missing_ingredient": missing_ingredient,
            "recipe_context": recipe_context
        })
    
    # ========================================================
    # Abstract Methods (must be implemented by subclasses)
    # ========================================================
    
    def recommend_recipes(self, preferences):
        """Get recipe recommendations - must be implemented by subclass"""
        raise NotImplementedError("Subclass must implement recommend_recipes()")
    
    def get_detailed_recipe(self, recipe_name: str, preferences_str: str = None):
        """Get detailed recipe - must be implemented by subclass"""
        raise NotImplementedError("Subclass must implement get_detailed_recipe()")
    
    def parse_recipe_steps(self, recipe_data):
        """Parse recipe steps - must be implemented by subclass"""
        raise NotImplementedError("Subclass must implement parse_recipe_steps()")
