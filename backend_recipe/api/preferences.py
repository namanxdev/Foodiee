"""
Preferences API routes
"""

import uuid
from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from models import UserPreferencesRequest, RecipeRecommendationResponse
from config import user_sessions
from core import RecipeRecommender
from database.session_storage_service import get_session_storage_service

router = APIRouter(prefix="/api", tags=["preferences"])

# Global recommender instance (will be initialized in main.py)
recommender: RecipeRecommender = None

def set_recommender(rec: RecipeRecommender):
    """Set the global recommender instance"""
    global recommender
    recommender = rec

@router.post("/preferences", response_model=RecipeRecommendationResponse)
async def submit_preferences(
    preferences: UserPreferencesRequest,
    user_email: Optional[str] = Header(None, alias="X-User-Email")
):
    """
    Submit user preferences and get recipe recommendations
    
    Stores session in Supabase and returns session_id for URL parameter
    """
    try:
        if recommender is None:
            raise HTTPException(status_code=500, detail="Recommender not initialized. Please restart the server.")
        
        # Create unique session ID
        session_id = f"session_{uuid.uuid4().hex[:8]}"
        
        # Format preferences
        dietary_preference = ""
        if preferences.is_vegetarian:
            dietary_preference = "\n- Dietary Preference: Pure Vegetarian (ONLY vegetarian recipes, no meat, fish, or eggs)"
        
        preferences_str = f"""
User Preferences:
- Region/Cuisine: {preferences.region}
- Taste Preferences: {', '.join(preferences.taste_preferences)}
- Meal Type: {preferences.meal_type}
- Time Available: {preferences.time_available}
- Allergies: {', '.join(preferences.allergies) if preferences.allergies else 'None'}
- Dislikes: {', '.join(preferences.dislikes) if preferences.dislikes else 'None'}
- Available Ingredients: {', '.join(preferences.available_ingredients)}{dietary_preference}
"""
        
        # Prepare preferences dict for storage
        preferences_dict = {
            "region": preferences.region,
            "taste_preferences": preferences.taste_preferences,
            "meal_type": preferences.meal_type,
            "time_available": preferences.time_available,
            "allergies": preferences.allergies,
            "dislikes": preferences.dislikes,
            "available_ingredients": preferences.available_ingredients,
            "is_vegetarian": preferences.is_vegetarian
        }
        
        # Store in-memory (for backward compatibility)
        user_sessions[session_id] = {
            "preferences": preferences_str,
            "current_recipe": None,
            "current_step_index": 0,
            "recipe_steps": [],
            "recipe_history": [],  # ✨ Track all completed steps
            "recipe_mapping": {}  # Map "Recipe 1" -> actual database name
        }
        
        # Store in Supabase
        try:
            session_storage = get_session_storage_service()
            session_storage.save_session(
                session_id=session_id,
                user_email=user_email,
                user_preferences=preferences_dict,
                update_last_accessed=True
            )
            
            # Add initial chat message with recommendations request
            session_storage.add_chat_message(
                session_id=session_id,
                message_type="user_message",
                content="Get my recipe recommendations",
                user_email=user_email
            )
        except Exception as db_error:
            print(f"⚠️  Warning: Failed to save to Supabase: {db_error}")
            # Continue with in-memory only

        # Get recommendations
        recommendations_result = recommender.recommend_recipes(preferences_str)
        
        # Handle both old (string) and new (dict) return formats
        if isinstance(recommendations_result, dict):
            recommendations = recommendations_result["response"]
            user_sessions[session_id]["recipe_mapping"] = recommendations_result.get("recipe_mapping", {})
            print(f"   💾 Stored recipe mapping: {recommendations_result.get('recipe_mapping', {})}")
        else:
            recommendations = recommendations_result  # Legacy string format
        
        # Add recommendations to chat history
        try:
            session_storage = get_session_storage_service()
            session_storage.add_chat_message(
                session_id=session_id,
                message_type="chatbot_message",
                content=recommendations,
                user_email=user_email
            )
        except Exception as db_error:
            print(f"⚠️  Warning: Failed to save recommendations to chat history: {db_error}")

        return RecipeRecommendationResponse(
            recommendations=recommendations,
            success=True,
            message=f"Recommendations generated successfully! Use the session_id below for all subsequent requests.",
            session_id=session_id  # Return session_id as separate field!
        )
    
    except Exception as e:
        print(f"❌ Error in submit_preferences: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")