"""
Image Generation Module - Google Imagen 4.0 image generation
Optimized for production use with Imagen 4.0 API
"""

import base64
import os
from typing import Optional, Tuple, Dict

from google import genai
from google.genai import types

from dotenv import load_dotenv
load_dotenv()

class ImageGenerator:
    """
    Image generation using Google Imagen 4.0 API
    Optimized for production with strict format requirements
    """
    
    def __init__(self, llm):
        """
        Args:
            llm: Language model (not used for image gen, kept for compatibility)
        """
        self.llm = llm
    
    # ========================================================
    # Common Methods
    # ========================================================
    
    def generate_image_prompt(self, recipe_name: str, step_description: str) -> str:
        """
        Generate optimized image prompt for Imagen 4.0
        
        Args:
            recipe_name: Name of the recipe
            step_description: Description of the cooking step
            
        Returns:
            Optimized prompt string for Imagen 4.0 image generation
        """
        return f"""Professional food photography of {recipe_name}. 

Step description (FOR REFERENCE ONLY - DO NOT WRITE THIS IN THE IMAGE): {step_description}

⚠️ CRITICAL - READ THIS FIRST ⚠️
The step description above tells you WHAT action/scene to photograph.
DO NOT write the step description, step number, or any text in the image.
Show the cooking action VISUALLY only, with NO text whatsoever.

ABSOLUTE TEXT PROHIBITION - ZERO TOLERANCE:
❌ ZERO text, letters, words, or numbers anywhere in the image
❌ DO NOT write step numbers (like "Step 1", "Step 2")
❌ DO NOT write the step description or instructions
❌ DO NOT write recipe name, ingredient names, or measurements
❌ DO NOT write any labels, captions, or descriptions
❌ NO watermarks, typography, or written symbols of ANY kind
❌ NO letters or characters of any form
✅ ONLY show the cooking action/scene VISUALLY - pure photography

The description is your GUIDE for what to photograph, NOT text to display.

Image requirements:
- High-quality food photography showing the cooking action/result
- Professional lighting and composition
- Appetizing, clear presentation
- Clean, focused shot
- NO text elements of any kind

ABSOLUTE PROHIBITION: Any text, letters, words, step numbers, descriptions, labels, captions, numbers, or typography are 100% FORBIDDEN.

Create a purely visual photograph with ZERO text - show only the cooking scene."""
    
    def generate_image(
        self,
        recipe_name: str,
        step_description: str,
        cumulative_prompt: Optional[str] = None
    ) -> Tuple[Optional[str], str]:
        """
        Generate image using Imagen 4.0 API
        
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
        
        # Generate with Imagen 4.0
        return self._generate_with_imagen(image_prompt)
    
    def _generate_with_imagen(self, prompt: str) -> Tuple[Optional[str], str]:
        """
        Generate image using Imagen 4.0 API with strict size and format requirements
        
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
            # Imagen 4.0 uses generate_images API
            result = client.models.generate_images(
                model=os.getenv("GEMINI_IMAGE_MODEL", "imagen-3.0-generate-001"),
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio="4:3",  # Horizontal format, closest to desired 1024x680 ratio
                    safety_filter_level="block_low_and_above",
                    person_generation="allow_adult"
                ),
            )
        except Exception as exc:
            raise ValueError(f"Imagen image generation failed: {exc}") from exc
        
        # Extract image from response
        image_base64 = self._extract_image_from_imagen_response(result)
        
        if not image_base64:
            print(f"   ⚠️  No image data found in Imagen response")
        else:
            print(f"   ✅ Successfully generated image with Imagen 4.0 (4:3 aspect ratio)")
        
        return image_base64, prompt
    
    def _extract_image_from_imagen_response(self, result) -> Optional[str]:
        """
        Extract image bytes from Imagen API response and convert to base64
        
        Args:
            result: Imagen API response object
            
        Returns:
            Base64 encoded image string or None
        """
        if not result or not hasattr(result, "generated_images") or not result.generated_images:
            return None
        
        # Get first generated image
        image = result.generated_images[0]
        
        # Extract image bytes
        if hasattr(image, "image") and hasattr(image.image, "image_bytes"):
            image_bytes = image.image.image_bytes
            if image_bytes:
                return base64.b64encode(image_bytes).decode("utf-8")
        
        return None
