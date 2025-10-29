"""
Image generation API routes
"""

import base64
from io import BytesIO
from fastapi import APIRouter, HTTPException

from models import ImageGenerationResponse
from config import user_sessions
from core import RecipeRecommender
from helpers import get_session_history_text

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
    Generate image for current cooking step
    """
    try:
        if session_id not in user_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = user_sessions[session_id]
        
        if not session["recipe_steps"]:
            raise HTTPException(status_code=400, detail="No recipe loaded")
        
        current_index = session["current_step_index"]
        if current_index == 0:
            current_index = 1  # If they haven't called next yet, show first step
        
        steps = session["recipe_steps"]
        if current_index > len(steps):
            raise HTTPException(status_code=400, detail="No more steps")
        
        current_step = steps[current_index - 1]
        recipe_name = session["current_recipe"]
        
        # Get recipe ID if using optimized recommender
        recipe_id = session.get("current_recipe_id", "unknown")
        
        # Get history context
        history_text = get_session_history_text(session_id)
        
        # Generate image with proper parameters
        # Check if recommender has the optimized signature (4 params)
        try:
            image, description = recommender.generate_image(
                recipe_id, 
                recipe_name, 
                current_step, 
                current_index
            )
        except TypeError:
            # Fallback to old signature (2 params) for traditional recommender
            image, description = recommender.generate_image(recipe_name, current_step)
        
        # Update history to mark image was generated for this step
        if session["recipe_history"] and session["recipe_history"][-1]["step_number"] == current_index:
            session["recipe_history"][-1]["image_generated"] = True
            session["recipe_history"][-1]["image_prompt"] = description
        
        if image:
            # Convert PIL image to base64
            buffered = BytesIO()
            image.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            return ImageGenerationResponse(
                image_data=img_str,
                description=description,
                success=True,
                generation_type="gpu"
            )
        else:
            # Text description only
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
    Generate image for the current step using Gemini image model
    """
    if session_id not in user_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session = user_sessions[session_id]
        
    if not session["recipe_steps"]:
        raise HTTPException(status_code=400, detail="No recipe loaded")
        
    current_index = session["current_step_index"]
    if current_index == 0:
        current_index = 1  # If they haven't called next yet, show first step
        
    steps = session["recipe_steps"]
    if current_index > len(steps):
        raise HTTPException(status_code=400, detail="No more steps")
        
    current_step = steps[current_index - 1]
    recipe_name = session["current_recipe"]
        
    recipe_id = session.get("current_recipe_id", "unknown")
        
    try:
        image, description = recommender.generate_image(
            recipe_id, 
            recipe_name, 
            current_step, 
            current_index
        )
    # except TypeError:
        # Fallback to old signature (2 params) for traditional recommender
        image, description = recommender.gemini_image_generator(recipe_name, current_step)
        
        # Update history to mark image was generated for this step
        if session["recipe_history"] and session["recipe_history"][-1]["step_number"] == current_index:
            session["recipe_history"][-1]["image_generated"] = True
            session["recipe_history"][-1]["image_prompt"] = description
            
        if image:
            buffered = BytesIO()
            image.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
                
            return ImageGenerationResponse(
                    image_data=img_str,
                    description=description,
                    success=True,
                    generation_type="gpu"
            )
        else:
            return ImageGenerationResponse(
                    image_data=None,
                    description=description,
                    success=True,
                    generation_type="text_only"
            )
        
    except HTTPException:
            raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

