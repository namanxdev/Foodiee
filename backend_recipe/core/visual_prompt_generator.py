"""
Visual Prompt Generator for Recipe Images
Generates precise prompts with positive and negative constraints
"""

from typing import Dict, Tuple, Optional, List
from .visual_state_models import VisualState, RecipeVisualStateManager


class VisualPromptGenerator:
    """Generate image prompts from visual state with negative prompting"""
    
    # Terms that bias toward final dish
    FORBIDDEN_TERMS = [
        "final dish", "plated", "garnished", "complete dish",
        "fully cooked", "served", "presentation", "finished",
        "restaurant style", "beautifully arranged"
    ]
    
    def __init__(self, recipe_name: str):
        self.recipe_name = recipe_name
    
    def generate_prompts(
        self, 
        visual_state: VisualState,
        step_description: str,
        confidence: float = 1.0
    ) -> Dict[str, str]:
        """
        Generate positive and negative prompts from visual state
        
        Args:
            visual_state: Current visual state
            step_description: Original step text
            confidence: Confidence in the state (0-1)
            
        Returns:
            Dictionary with 'positive' and 'negative' prompts
        """
        if confidence < 0.5:
            # Conservative fallback for low confidence
            return self._generate_conservative_prompts(visual_state, step_description)
        
        # Get prompt components
        prompt_data = visual_state.to_prompt_dict()
        
        # Build positive prompt
        positive_prompt = self._build_positive_prompt(
            visual_state.step_number,
            prompt_data['visible_ingredients'],
            prompt_data['pan_state'],
            prompt_data['utensil'],
            prompt_data['flame_level']
        )
        
        # Build negative prompt
        negative_prompt = self._build_negative_prompt(
            prompt_data['absent_ingredients'],
            self.recipe_name
        )
        
        return {
            "positive": positive_prompt,
            "negative": negative_prompt,
            "style_suffix": self._get_style_suffix()
        }
    
    def _build_positive_prompt(
        self,
        step_number: int,
        visible_ingredients: str,
        pan_state: str,
        utensil: str,
        flame_level: str
    ) -> str:
        """Build the positive prompt focusing on what IS visible"""
        
        # Base prompt structure
        prompt_parts = [
            f"Step {step_number} of cooking process.",
            f"Show a {utensil} with {visible_ingredients} visible.",
            f"Pan state: {pan_state}.",
            f"Gas flame {flame_level}."
        ]
        
        # Add cooking action context if ingredients are visible
        if visible_ingredients != "empty pan":
            prompt_parts.append("Ingredients in active cooking stage, not final presentation.")
        
        # Style directives
        prompt_parts.extend([
            "Natural lighting, slightly top-down angle.",
            "Realistic cooking scene, home kitchen setting.",
            "Focus on the cooking vessel and its contents.",
            "No plating, no garnishing, just the cooking process."
        ])
        
        return " ".join(prompt_parts)
    
    def _build_negative_prompt(
        self,
        absent_ingredients: str,
        recipe_name: str
    ) -> str:
        """Build negative prompt to exclude what should NOT be visible"""
        
        negative_parts = []
        
        # Explicitly exclude absent ingredients
        if absent_ingredients:
            negative_parts.append(f"Do not show: {absent_ingredients}")
        
        # Exclude final dish references
        negative_parts.append(f"Do not show the final {recipe_name}")
        negative_parts.append("No complete dish, no plated food")
        
        # Add forbidden terms
        negative_parts.extend([
            f"No {term}" for term in self.FORBIDDEN_TERMS
        ])
        
        # Additional exclusions
        negative_parts.extend([
            "No garnishing, no herbs on top",
            "No serving plates or bowls",
            "No table setting",
            "No completed gravy or sauce unless specified"
        ])
        
        return ", ".join(negative_parts)
    
    def _generate_conservative_prompts(
        self,
        visual_state: VisualState,
        step_description: str
    ) -> Dict[str, str]:
        """Generate conservative prompts when confidence is low"""
        
        positive = (
            f"Cooking step {visual_state.step_number}. "
            f"Show a {visual_state.utensil} on medium heat. "
            f"Oil in pan, basic cooking preparation. "
            f"Natural lighting, top-down view. "
            f"Simple, realistic cooking scene."
        )
        
        negative = (
            f"No {self.recipe_name}, no final dish, "
            f"no complex ingredients, no garnishing, "
            f"no plating, minimal ingredients visible"
        )
        
        return {
            "positive": positive,
            "negative": negative,
            "style_suffix": self._get_style_suffix(),
            "note": "Low confidence - showing conservative view"
        }
    
    def _get_style_suffix(self) -> str:
        """Get consistent style suffix for all prompts"""
        return (
            "REQUIREMENTS: HORIZONTAL landscape format (1024x680), "
            "professional food photography quality, "
            "ABSOLUTELY NO TEXT or watermarks"
        )


class EnhancedImageGenerator:
    """Enhanced image generator using visual state and negative prompting"""
    
    def __init__(self, base_generator):
        """
        Initialize with base image generator
        
        Args:
            base_generator: The original ImageGenerator instance
        """
        self.base_generator = base_generator
    
    def generate_with_visual_state(
        self,
        recipe_name: str,
        step_description: str,
        visual_state: VisualState,
        confidence: float = 1.0
    ) -> Tuple[Optional[str], str]:
        """
        Generate image using visual state and negative prompting
        
        Args:
            recipe_name: Name of the recipe
            step_description: Text description of the step
            visual_state: Current visual state
            confidence: Parsing confidence
            
        Returns:
            Tuple of (base64_image, full_prompt_used)
        """
        # Generate prompts
        prompt_gen = VisualPromptGenerator(recipe_name)
        prompts = prompt_gen.generate_prompts(visual_state, step_description, confidence)
        
        # Combine prompts for Gemini (which doesn't have separate negative prompt field)
        # We'll embed the negative constraints directly in the prompt
        full_prompt = self._combine_prompts_for_gemini(prompts)
        
        # Use base generator with enhanced prompt
        return self.base_generator._generate_with_imagen(full_prompt)
    
    def _combine_prompts_for_gemini(self, prompts: Dict[str, str]) -> str:
        """Combine positive and negative prompts for Gemini API"""
        
        combined = f"""{prompts['positive']}

STRICT REQUIREMENTS - MUST NOT SHOW:
{prompts['negative']}

{prompts['style_suffix']}
"""
        
        # Add note if present
        if 'note' in prompts:
            combined = f"[{prompts['note']}]\n\n{combined}"
        
        return combined
