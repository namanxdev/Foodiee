"""
Image generation API routes - Modular & Clean
Supports both Gemini (remote) and Stable Diffusion (local) backends
"""

from fastapi import APIRouter, HTTPException

from models import ImageGenerationResponse
from core import RecipeRecommender
from helpers.image_helpers import validate_session_and_get_context, update_session_history

router = APIRouter(prefix="/api", tags=["images"])

# Global recommender instance (will be initialized in main.py)
recommender: RecipeRecommender = None

def set_recommender(rec: RecipeRecommender):
    """Set the global recommender instance"""
    global recommender
    recommender = rec

@router.post("/step/image", response_model=ImageGenerationResponse)
async def generate_step_image(session_id: str):
    """
    Generate image for current cooking step using Stable Diffusion (local)
    
    This endpoint uses local image generation for more control and privacy.
    Falls back to text-only if Stable Diffusion is not available.
    """
    try:
        # Validate session and get context
        session, recipe_name, current_step, current_index = validate_session_and_get_context(session_id)
        
        # Generate image using Stable Diffusion (local backend)
        image_base64, description = recommender.generate_image_with_stable_diffusion(
            recipe_name, 
            current_step
        )
        
        # Update session history
        update_session_history(session, current_index, description)
        
        # Return response
        if image_base64:
            return ImageGenerationResponse(
                image_data=image_base64,
                description=description,
                success=True,
                generation_type="stable_diffusion"
            )
        else:
            # Stable Diffusion not available - text only
            return ImageGenerationResponse(
                image_data=None,
                description=description,
                success=True,
                generation_type="text_only"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/step/gemini_image", response_model=ImageGenerationResponse)
async def generate_gemini_image(session_id: str):
    """
    Generate image for current cooking step using Gemini API (remote)
    
    This endpoint uses Google's Gemini image generation for high-quality results.
    Requires GOOGLE_API_KEY to be configured.
    """
    try:
        # Validate session and get context
        session, recipe_name, current_step, current_index = validate_session_and_get_context(session_id)
        
        # Generate image using Gemini (remote backend)
        image_base64, description = recommender.generate_image_with_gemini(
            recipe_name, 
            current_step
        )
        
        # Update session history
        update_session_history(session, current_index, description)
        
        # Return response
        if image_base64:
            return ImageGenerationResponse(
                image_data=image_base64,
                description=description,
                success=True,
                generation_type="gemini"
            )
        else:
            # Gemini failed - text only
            return ImageGenerationResponse(
                image_data=None,
                description=description,
                success=True,
                generation_type="text_only"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

