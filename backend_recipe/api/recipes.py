"""
Recipe API routes
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Header

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
async def get_recipe_details(
    request: RecipeDetailRequest, 
    session_id: str,
    user_email: Optional[str] = Header(None, alias="X-User-Email")
):
    """
    Get detailed recipe instructions
    """
    try:
        if session_id not in user_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = user_sessions[session_id]
        preferences_str = session["preferences"]
        
        # 🔥 Check if user sent a placeholder name like "Recipe 1", "Recipe 2"
        # Map it to the actual database recipe name
        recipe_name = request.recipe_name
        recipe_mapping = session.get("recipe_mapping", {})
        
        if recipe_name in recipe_mapping:
            actual_name = recipe_mapping[recipe_name]
            print(f"   🔄 Mapped '{recipe_name}' → '{actual_name}'")
            recipe_name = actual_name
        
        print(f"   📤 Calling get_detailed_recipe with: '{recipe_name}'")  # Debug log
        
        # Get detailed recipe
        detailed_recipe = recommender.get_detailed_recipe(recipe_name, preferences_str)
        
        # Parse recipe
        parsed = recommender.parse_recipe_steps(detailed_recipe)
        
        # Update session
        session["current_recipe"] = recipe_name
        session["current_recipe_id"] = detailed_recipe.get('id', 'unknown')  # Store recipe ID
        session["recipe_steps"] = parsed["steps"]
        session["current_step_index"] = 0
        session["ingredients"] = parsed["ingredients"]
        session["tips"] = parsed["tips"]
        session["recipe_history"] = []  # Reset history for new recipe
        
        # Save to Supabase
        try:
            from database.session_storage_service import get_session_storage_service
            session_storage = get_session_storage_service()
            
            # Add user message to chat history
            session_storage.add_chat_message(
                session_id=session_id,
                message_type="user_message",
                content=f"Show me how to make {recipe_name}",
                user_email=user_email
            )
            
            # Add assistant response
            assistant_response = f"Great choice! Let's cook {recipe_name}.\n\n**Ingredients:**\n{parsed['ingredients']}\n\n**Tips:**\n{parsed['tips']}\n\nClick \"Next Step\" to start cooking!"
            session_storage.add_chat_message(
                session_id=session_id,
                message_type="chatbot_message",
                content=assistant_response,
                user_email=user_email
            )
            
            # Update selected_recipe_name
            session_storage.save_session(
                session_id=session_id,
                selected_recipe_name=recipe_name,
                update_last_accessed=True
            )
        except Exception as db_error:
            print(f"⚠️  Warning: Failed to save to Supabase: {db_error}")
        
        return RecipeDetailResponse(
            recipe_name=recipe_name,
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
async def next_step(
    session_id: str,
    user_email: Optional[str] = Header(None, alias="X-User-Email")
):
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
            # Save completion message
            completion_message = "🎉 Congratulations! You've completed all steps!" + (f"\n\n{session.get('tips', '')}" if session.get('tips') else "")
            try:
                from database.session_storage_service import get_session_storage_service
                session_storage = get_session_storage_service()
                session_storage.add_chat_message(
                    session_id=session_id,
                    message_type="chatbot_message",
                    content=completion_message,
                    user_email=user_email
                )
            except Exception as db_error:
                print(f"⚠️  Warning: Failed to save completion message: {db_error}")
            
            return {
                "step": None,
                "current_step": None,
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
        
        # Save step to chat history
        step_message = f"**Step {current_index + 1}/{len(steps)}:**\n{current_step}"
        try:
            from database.session_storage_service import get_session_storage_service
            session_storage = get_session_storage_service()
            session_storage.add_chat_message(
                session_id=session_id,
                message_type="chatbot_message",
                content=step_message,
                user_email=user_email
            )
        except Exception as db_error:
            print(f"⚠️  Warning: Failed to save step to chat history: {db_error}")
        
        return {
            "step": current_step,
            "current_step": current_step,
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