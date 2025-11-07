"""
Base Recommender - Shared functionality for all recommender types
"""

from typing import Optional, Tuple, Dict, List
from langchain_core.output_parsers import StrOutputParser

from prompts import RecipePrompts
from core.image_generator import ImageGenerator
from core.cumulative_state import CumulativeRecipeState


class BaseRecommender:
    """
    Base class for all recommender implementations
    Provides shared functionality like image generation, alternative ingredients
    """
    
    def __init__(self):
        """Initialize base recommender with common components"""
        # Prompts
        self.alternative_prompt = RecipePrompts.get_alternative_prompt()
        
        # Image generator (lazy loaded)
        self._image_generator = None
        
        # Cumulative state tracker (per session)
        self._cumulative_states = {}
    
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
            self._image_generator = ImageGenerator(self.llm)
        return self._image_generator
    
    def generate_image_with_gemini(
        self, 
        recipe_name: str, 
        step_description: str,
        session_id: Optional[str] = None,
        step_index: Optional[int] = None,
        ingredients: Optional[List[str]] = None
    ) -> Tuple[Optional[str], str]:
        """
        Generate image using Gemini API with cumulative state tracking
        
        Args:
            recipe_name: Name of the recipe
            step_description: Description of the cooking step
            session_id: Optional session ID for state tracking
            step_index: Optional current step index
            ingredients: Optional list of all ingredients in recipe
            
        Returns:
            Tuple of (base64_image_string, prompt_used)
        """
        # If session tracking is enabled, use cumulative state
        if session_id and step_index is not None:
            # Get or create cumulative state for this session
            if session_id not in self._cumulative_states:
                self._cumulative_states[session_id] = CumulativeRecipeState(
                    llm=self.llm,
                    recipe_name=recipe_name,
                    total_ingredients=ingredients or []
                )
            
            state = self._cumulative_states[session_id]
            
            # Add current step to state
            visual_state = state.add_step(step_index, step_description)
            
            # Get cumulative prompt with positive/negative
            prompt_data = state.get_cumulative_prompt(step_description)
            
            # Log confidence and state
            metadata = prompt_data.get("metadata", {})
            print(f"   📊 State confidence: {metadata.get('confidence', 0):.2f}")
            print(f"   👁️ Visible ingredients: {metadata.get('visible_count', 0)}")
            print(f"   🚫 Absent ingredients: {metadata.get('absent_count', 0)}")
            
            if metadata.get("fallback"):
                print("   ⚠️ Using conservative fallback due to low confidence")
            
            # Format for Gemini (concatenate positive and negative)
            # Note: Gemini doesn't have separate negative prompt field, 
            # so we include it in the main prompt
            cumulative_prompt = (
                f"{prompt_data['positive']}\n\n"
                f"IMPORTANT CONSTRAINTS:\n{prompt_data['negative']}"
            )
            
            # Generate image with cumulative state
            return self.image_generator.generate_image(
                recipe_name, 
                step_description,
                cumulative_prompt=cumulative_prompt
            )
        else:
            # Standard generation without state tracking
            return self.image_generator.generate_image(recipe_name, step_description)
    
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
    # Cumulative State Management
    # ========================================================
    
    def get_cumulative_state(self, session_id: str) -> Optional[Dict]:
        """
        Get cumulative state for a session
        
        Args:
            session_id: Session identifier
            
        Returns:
            State summary dictionary or None
        """
        if session_id in self._cumulative_states:
            return self._cumulative_states[session_id].get_state_summary()
        return None
    
    def reset_cumulative_state(self, session_id: str):
        """
        Reset cumulative state for a session
        
        Args:
            session_id: Session identifier
        """
        if session_id in self._cumulative_states:
            self._cumulative_states[session_id].reset()
    
    def cleanup_old_states(self, active_sessions: List[str]):
        """
        Clean up states for inactive sessions
        
        Args:
            active_sessions: List of currently active session IDs
        """
        inactive_sessions = set(self._cumulative_states.keys()) - set(active_sessions)
        for session_id in inactive_sessions:
            del self._cumulative_states[session_id]
    
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
