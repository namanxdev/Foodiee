"""
Centralized Step Image Prompt Generator
========================================
Unified prompt generation for step images across all flows:
- Preferences section (user flow with session)
- Mass generation (bulk recipe generation)
- Batch image generation

Uses CumulativeRecipeState for consistent, high-quality prompts with visual continuity.
"""

from typing import List, Optional, Dict, Tuple
from core.cumulative_state import CumulativeRecipeState


class StepImagePromptGenerator:
    """
    Centralized generator for step image prompts
    Ensures all flows use the same prompt structure with cumulative state
    """
    
    def __init__(self, recipe_name: str, ingredients: Optional[List[str]] = None, llm=None):
        """
        Initialize prompt generator for a recipe
        
        Args:
            recipe_name: Name of the recipe
            ingredients: Optional list of all ingredients (for state tracking)
            llm: Language model instance (lazy-loaded if not provided)
        """
        self.recipe_name = recipe_name
        self.ingredients = ingredients or []
        
        # Lazy load LLM if not provided
        if llm is None:
            from config import llm as config_llm
            if config_llm is None:
                raise RuntimeError("LLM not initialized. Make sure the app has started properly.")
            llm = config_llm
        
        self.cumulative_state = CumulativeRecipeState(
            llm=llm,
            recipe_name=recipe_name,
            total_ingredients=self.ingredients
        )
    
    def generate_prompt(
        self,
        step_index: int,
        step_description: str,
        use_cumulative_state: bool = True
    ) -> Tuple[str, Dict]:
        """
        Generate prompt for a step image
        
        Args:
            step_index: 0-based index of the step
            step_description: Description of the cooking step
            use_cumulative_state: Whether to use cumulative state (default: True)
            
        Returns:
            Tuple of (prompt_string, metadata_dict)
        """
        if use_cumulative_state:
            # Add step to cumulative state
            visual_state = self.cumulative_state.add_step(step_index, step_description)
            
            # Get cumulative prompt with positive/negative
            prompt_data = self.cumulative_state.get_cumulative_prompt(step_description)
            
            # Format for Gemini (concatenate positive and negative)
            # Note: Gemini doesn't have separate negative prompt field,
            # so we include it in the main prompt
            prompt = (
                f"{prompt_data['positive']}\n\n"
                f"IMPORTANT CONSTRAINTS:\n{prompt_data['negative']}\n\n"
                f"CRITICAL REQUIREMENTS (STRICTLY ENFORCE):\n"
                f"1. IMAGE SIZE & ORIENTATION: MUST be HORIZONTAL format, aspect ratio 1024x680 pixels (landscape orientation)\n"
                f"2. NO TEXT RULE: ABSOLUTELY NO text, step numbers, labels, captions, watermarks, or any written elements\n"
                f"3. Show the cooking action clearly and unambiguously\n"
                f"4. Professional food photography style with warm lighting\n"
                f"5. Output: Horizontal landscape image (1024x680), completely text-free."
            )
            
            metadata = prompt_data.get("metadata", {})
            return prompt, metadata
        else:
            # Fallback to simple prompt (for backward compatibility)
            prompt = f"""Generate a clear instructional cooking photo for {self.recipe_name}.

Step: {step_description}

CRITICAL REQUIREMENTS (STRICTLY ENFORCE):
1. IMAGE SIZE & ORIENTATION: MUST be HORIZONTAL format, aspect ratio 1024x680 pixels (landscape orientation)
2. NO TEXT RULE: ABSOLUTELY NO text, step numbers, labels, captions, watermarks, or any written elements
3. INSTRUCTIONAL CLARITY: Show the cooking action clearly and unambiguously

The image should:
- Clearly demonstrate the action described in the step
- Show hands/tools performing the action in a natural way
- Use good lighting to show details clearly
- Have an instructional, how-to photography style
- Be shot from an angle that shows the process clearly
- Include relevant ingredients/tools in frame
- Frame composition should be HORIZONTAL (wider than tall)

STRICTLY FORBIDDEN: Any text, step numbers, labels, ingredient names, measurements, captions, UI elements, overlays, watermarks, or written elements of any kind.

Output: Horizontal landscape image (1024x680), instructional photography style, clear and practical, completely text-free."""
            
            return prompt, {"fallback": True, "step_index": step_index}
    
    def reset(self):
        """Reset cumulative state (useful when starting a new recipe)"""
        self.cumulative_state.reset()


def create_prompt_generator_for_recipe(
    recipe_name: str,
    ingredients: Optional[List[str]] = None,
    llm=None
) -> StepImagePromptGenerator:
    """
    Create a prompt generator instance for a recipe
    Useful when generating multiple steps for the same recipe
    
    Args:
        recipe_name: Name of the recipe
        ingredients: Optional list of all ingredients
        llm: Optional LLM instance (will be lazy-loaded if not provided)
        
    Returns:
        StepImagePromptGenerator instance
    """
    return StepImagePromptGenerator(recipe_name, ingredients, llm=llm)

