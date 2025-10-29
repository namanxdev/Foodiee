"""
Image Generation Module - Shared utilities for image generation
Supports both Gemini and Stable Diffusion (local) image generation
"""

import base64
import gc
import os
import platform
from io import BytesIO
from typing import Optional, Tuple, Literal
from PIL import Image

import torch
from google import genai
from google.genai import types
from langchain_core.output_parsers import StrOutputParser


ImageGenerationType = Literal["gemini", "stable_diffusion"]


class ImageGenerator:
    """
    Unified image generation interface supporting multiple backends:
    - Gemini API (remote)
    - Stable Diffusion (local)
    """
    
    def __init__(self, llm, sd_image_prompt):
        """
        Args:
            llm: Language model for prompt generation
            sd_image_prompt: Prompt template for image generation
        """
        self.llm = llm
        self.sd_image_prompt = sd_image_prompt
    
    # ========================================================
    # Common Methods
    # ========================================================
    
    def generate_image_prompt(self, recipe_name: str, step_description: str) -> str:
        """
        Generate optimized image prompt for any image generation backend
        
        Args:
            recipe_name: Name of the recipe
            step_description: Description of the cooking step
            
        Returns:
            Optimized prompt string for image generation
        """
        chain = self.sd_image_prompt | self.llm | StrOutputParser()
        return chain.invoke({
            "recipe_name": recipe_name,
            "step_description": step_description
        }).strip()
    
    def generate_image(
        self,
        recipe_name: str,
        step_description: str,
        backend: ImageGenerationType = "gemini"
    ) -> Tuple[Optional[str], str]:
        """
        Generate image using specified backend
        
        Args:
            recipe_name: Name of the recipe
            step_description: Description of the cooking step
            backend: Image generation backend ("gemini" or "stable_diffusion")
            
        Returns:
            Tuple of (base64_image_string, prompt_used)
            Note: Returns base64 string for consistency across backends
        """
        # Generate the optimized prompt
        image_prompt = self.generate_image_prompt(recipe_name, step_description)
        
        # Route to appropriate backend
        if backend == "gemini":
            return self._generate_with_gemini(image_prompt)
        elif backend == "stable_diffusion":
            return self._generate_with_stable_diffusion(image_prompt)
        else:
            raise ValueError(f"Unknown backend: {backend}")
    
    # ========================================================
    # Backend-Specific Methods
    # ========================================================
    
    def _generate_with_gemini(self, prompt: str) -> Tuple[Optional[str], str]:
        """
        Generate image using Gemini API
        
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
            result = client.models.generate_content(
                model="gemini-2.0-flash-preview-image-generation",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["TEXT", "IMAGE"]
                ),
            )
        except Exception as exc:
            raise ValueError(f"Gemini image generation failed: {exc}") from exc
        
        # Extract image from response
        image_base64 = self._extract_image_from_gemini_response(result)
        
        if not image_base64:
            print(f"   ⚠️  No image data found in Gemini response")
        else:
            print(f"   ✅ Successfully generated image with Gemini")
        
        return image_base64, prompt
    
    def _generate_with_stable_diffusion(self, prompt: str) -> Tuple[Optional[str], str]:
        """
        Generate image using Stable Diffusion (local)
        
        Args:
            prompt: Image generation prompt
            
        Returns:
            Tuple of (base64_image_string, prompt_used)
        """
        from config import get_image_generation_enabled, get_stable_diffusion_pipe
        
        IMAGE_GENERATION_ENABLED = get_image_generation_enabled()
        stable_diffusion_pipe = get_stable_diffusion_pipe()
        
        if not IMAGE_GENERATION_ENABLED or stable_diffusion_pipe is None:
            print("⚠️  Stable Diffusion not enabled or not initialized")
            return None, prompt
        
        try:
            print(f"   🎨 Generating image with Stable Diffusion...")
            
            with torch.inference_mode():
                with torch.autocast(device_type="cpu"):
                    pil_image = stable_diffusion_pipe(
                        prompt,
                        num_inference_steps=30,
                        guidance_scale=7.5,
                        height=512,
                        width=512
                    ).images[0]
            
            # Convert PIL Image to base64 for consistency
            image_base64 = self._pil_to_base64(pil_image)
            
            # Clear memory
            self._clear_gpu_memory()
            
            print(f"   ✅ Successfully generated image with Stable Diffusion")
            return image_base64, prompt
            
        except Exception as e:
            print(f"   ❌ Stable Diffusion generation failed: {e}")
            import traceback
            traceback.print_exc()
            return None, prompt
    
    # ========================================================
    # Helper Methods
    # ========================================================
    
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
    
    def _pil_to_base64(self, pil_image: Image.Image) -> str:
        """
        Convert PIL Image to base64 string
        
        Args:
            pil_image: PIL Image object
            
        Returns:
            Base64 encoded image string
        """
        buffered = BytesIO()
        pil_image.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    def _clear_gpu_memory(self):
        """Clear GPU memory after image generation"""
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        if platform.system() == "Darwin" and torch.backends.mps.is_available():
            torch.mps.empty_cache()
        gc.collect()
