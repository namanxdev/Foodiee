"""
Image generation related Pydantic models
"""

from pydantic import BaseModel, Field
from typing import Optional


class StepImageRequest(BaseModel):
    """Request for generating step-by-step cooking images"""
    recipe_name: str = Field(..., description="Name of the recipe")
    step_description: str = Field(..., description="Description of the cooking step")


class ImageGenerationResponse(BaseModel):
    """Response for image generation"""
    image_data: Optional[str] = Field(None, description="Base64 encoded image data")
    description: str = Field(..., description="Description of the generated image")
    success: bool = Field(default=True, description="Whether generation was successful")
    generation_type: str = Field(..., description="Type of generation: 'gemini', 'stable_diffusion', 'text_only'")
