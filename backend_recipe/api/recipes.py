"""
Recipe API routes
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException

from models import (
    RecipeDetailRequest, 
    RecipeDetailResponse,
    IngredientAlternativesRequest,
    IngredientAlternativesResponse
)
from config import user_sessions
from core import RecipeRecommender

router = APIRouter(prefix="/api", tags=["recipes"])

# Global recommender instance (will be initialized in main.py)
recommender: RecipeRecommender = None

def set_recommender(rec: RecipeRecommender):
    """Set the global recommender instance"""
    global recommender
    recommender = rec

@router.post("/recipe/details", response_model=RecipeDetailResponse)
async def get_recipe_details(request: RecipeDetailRequest, session_id: str):
    """
    Get detailed recipe instructions
    """
    try:
        if session_id not in user_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = user_sessions[session_id]
        preferences_str = session["preferences"]
        
        # Get detailed recipe
        detailed_recipe = recommender.get_detailed_recipe(request.recipe_name, preferences_str)
        
        # Parse recipe
        parsed = recommender.parse_recipe_steps(detailed_recipe)
        
        # Update session
        session["current_recipe"] = request.recipe_name
        session["recipe_steps"] = parsed["steps"]
        session["current_step_index"] = 0
        session["ingredients"] = parsed["ingredients"]
        session["tips"] = parsed["tips"]
        session["recipe_history"] = []  # Reset history for new recipe
        
        return RecipeDetailResponse(
            recipe_name=request.recipe_name,
            ingredients=parsed["ingredients"],
            steps=parsed["steps"],
            tips=parsed["tips"],
            success=True
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/step/next")
async def next_step(session_id: str):
    """
    Move to the next cooking step
    """
    try:
        if session_id not in user_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = user_sessions[session_id]
        
        if not session["recipe_steps"]:
            raise HTTPException(status_code=400, detail="No recipe loaded")
        
        current_index = session["current_step_index"]
        steps = session["recipe_steps"]
        
        if current_index >= len(steps):
            return {
                "step": None,
                "step_number": current_index,
                "total_steps": len(steps),
                "completed": True,
                "message": "All steps completed!",
                "tips": session.get("tips", "")
            }
        
        current_step = steps[current_index]
        session["current_step_index"] = current_index + 1
        
        # Add to history
        history_entry = {
            "step_number": current_index + 1,
            "step_text": current_step,
            "timestamp": datetime.now().isoformat(),
            "image_generated": False,
            "image_prompt": None
        }
        session["recipe_history"].append(history_entry)
        
        return {
            "step": current_step,
            "step_number": current_index + 1,
            "total_steps": len(steps),
            "completed": False,
            "message": "Success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/step/skip")
async def skip_to_alternatives(session_id: str):
    """
    Skip remaining steps and go to ingredient alternatives
    """
    try:
        if session_id not in user_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = user_sessions[session_id]
        steps = session["recipe_steps"]
        
        # Mark as completed
        session["current_step_index"] = len(steps) + 1
        
        return {
            "message": "Skipped to ingredient alternatives section",
            "success": True,
            "tips": session.get("tips", "")
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/ingredients/alternatives", response_model=IngredientAlternativesResponse)
async def get_alternatives(request: IngredientAlternativesRequest, session_id: str):
    """
    Get alternatives for missing ingredients
    """
    try:
        if session_id not in user_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = user_sessions[session_id]
        recipe_name = session.get("current_recipe", request.recipe_context)
        
        alternatives = recommender.get_ingredient_alternatives(
            request.missing_ingredient,
            recipe_name
        )
        
        return IngredientAlternativesResponse(
            alternatives=alternatives,
            success=True
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")