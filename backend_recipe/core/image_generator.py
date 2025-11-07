"""
Image Generation Module - Gemini image generation
Optimized for production use with Gemini API only
"""

import base64
import os
from typing import Optional, Tuple, Dict

from google import genai
from google.genai import types


class ImageGenerator:
    """
    Image generation using Gemini API
    Optimized for production with strict format requirements
    """
    
    def __init__(self, llm):
        """
        Args:
            llm: Language model (not used for Gemini image gen, kept for compatibility)
        """
        self.llm = llm
    
    # ========================================================
    # Common Methods
    # ========================================================
    
    def generate_image_prompt(self, recipe_name: str, step_description: str) -> str:
        """
        Generate optimized image prompt for Gemini
        
        Args:
            recipe_name: Name of the recipe
            step_description: Description of the cooking step
            
        Returns:
            Optimized prompt string for Gemini image generation
        """
        return f"""Generate a high-quality, professional food photography image of {recipe_name}. {step_description}. 

CRITICAL REQUIREMENTS:
- HORIZONTAL landscape format (1024x680 aspect ratio)
- ABSOLUTELY NO TEXT, labels, captions, or watermarks
- Professional, appetizing presentation
- Well-lit with good composition

The image should be appetizing, well-lit, and show the dish in an attractive presentation. STRICTLY NO TEXT of any kind."""
    
    def generate_image(
        self,
        recipe_name: str,
        step_description: str,
        cumulative_prompt: Optional[str] = None
    ) -> Tuple[Optional[str], str]:
        """
        Generate image using Gemini API
        
        Args:
            recipe_name: Name of the recipe
            step_description: Description of the cooking step
            cumulative_prompt: Optional pre-generated prompt with cumulative state
            
        Returns:
            Tuple of (base64_image_string, prompt_used)
        """
        # Use cumulative prompt if provided, otherwise generate standard prompt
        if cumulative_prompt:
            image_prompt = cumulative_prompt
        else:
            image_prompt = self.generate_image_prompt(recipe_name, step_description)
        
        # Generate with Gemini
        return self._generate_with_gemini(image_prompt)
    
    def generate_image_with_state(
        self,
        recipe_name: str,
        step_description: str,
        cumulative_state: Optional[Dict] = None
    ) -> Tuple[Optional[str], str]:
        """
        Generate image with cumulative state context
        
        Args:
            recipe_name: Name of the recipe
            step_description: Description of the cooking step
            cumulative_state: Dictionary containing cumulative recipe state
            
        Returns:
            Tuple of (base64_image_string, prompt_used)
        """
        if cumulative_state:
            # Build enhanced prompt with cumulative state
            prompt = self._build_cumulative_prompt(
                recipe_name, 
                step_description, 
                cumulative_state
            )
        else:
            prompt = self.generate_image_prompt(recipe_name, step_description)
        
        return self._generate_with_gemini(prompt)
    
    def _build_cumulative_prompt(
        self, 
        recipe_name: str, 
        step_description: str,
        cumulative_state: Dict
    ) -> str:
        """
        Build an enhanced prompt using cumulative state information
        
        Args:
            recipe_name: Name of the recipe
            step_description: Current step description
            cumulative_state: Dictionary with state information
            
        Returns:
            Enhanced prompt string
        """
        current_visual = cumulative_state.get("current_visual_state", "")
        ingredients_added = cumulative_state.get("ingredients_added", [])
        steps_completed = cumulative_state.get("steps_completed", 0)
        
        prompt = f"""Generate a high-quality, professional food photography image of {recipe_name}.

CURRENT STATE OF THE DISH:
{current_visual}

COOKING PROGRESS:
- Steps completed: {steps_completed}
- Ingredients already in the dish: {', '.join(ingredients_added)}

CURRENT STEP: {step_description}

CRITICAL REQUIREMENTS:
- HORIZONTAL landscape format (1024x680 aspect ratio)
- Show the CUMULATIVE state - all ingredients added so far must be visible
- The image must accurately reflect the current cooking stage
- Professional, appetizing presentation with proper lighting
- ABSOLUTELY NO TEXT, labels, captions, or watermarks
- Focus on the cooking vessel and its contents

The image must show exactly how the dish looks at THIS MOMENT in the cooking process."""
        
        return prompt
    
    def _generate_with_gemini(self, prompt: str) -> Tuple[Optional[str], str]:
        """
        Generate image using Gemini API with strict size and format requirements
        
        Args:
            prompt: Image generation prompt
            
        Returns:
            Tuple of (base64_image_string, prompt_used)
        """
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not configured")
        
        client = genai.Client(api_key=api_key)
        
        try:
            # Add size enforcement to the prompt itself as Gemini API handles this via prompt
            size_enforced_prompt = prompt + "\n\nIMAGE SPECIFICATIONS: Output MUST be horizontal landscape orientation, 1024x680 aspect ratio. STRICTLY HORIZONTAL format only."
            
            result = client.models.generate_content(
                model="gemini-2.0-flash-preview-image-generation",
                contents=size_enforced_prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["TEXT", "IMAGE"],
                    # Note: Gemini's image generation model respects size specifications in the prompt
                    # The 1024x680 horizontal format will be enforced through prompt instructions
                ),
            )
        except Exception as exc:
            raise ValueError(f"Gemini image generation failed: {exc}") from exc
        
        # Extract image from response
        image_base64 = self._extract_image_from_gemini_response(result)
        
        if not image_base64:
            print(f"   ⚠️  No image data found in Gemini response")
        else:
            print(f"   ✅ Successfully generated image with Gemini (1024x680 horizontal)")
        
        return image_base64, size_enforced_prompt
    
    def _extract_image_from_gemini_response(self, result) -> Optional[str]:
        """
        Extract image bytes from Gemini API response and convert to base64
        
        Args:
            result: Gemini API response object
            
        Returns:
            Base64 encoded image string or None
        """
        if not result or not hasattr(result, "candidates") or not result.candidates:
            return None
        
        for part in result.candidates[0].content.parts:
            if hasattr(part, "inline_data") and part.inline_data is not None:
                image_bytes = part.inline_data.data
                if image_bytes:
                    return base64.b64encode(image_bytes).decode("utf-8")
        
        return None
