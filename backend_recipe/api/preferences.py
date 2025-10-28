"""
Preferences API routes
"""

import uuid
from fastapi import APIRouter, HTTPException

from models import UserPreferencesRequest, RecipeRecommendationResponse
from config import user_sessions
from core import RecipeRecommender

router = APIRouter(prefix="/api", tags=["preferences"])

# Global recommender instance (will be initialized in main.py)
recommender: RecipeRecommender = None

def set_recommender(rec: RecipeRecommender):
    """Set the global recommender instance"""
    global recommender
    recommender = rec

@router.post("/preferences", response_model=RecipeRecommendationResponse)
async def submit_preferences(preferences: UserPreferencesRequest):
    """
    Submit user preferences and get recipe recommendations
    """
    try:
        if recommender is None:
            raise HTTPException(status_code=500, detail="Recommender not initialized. Please restart the server.")
        
        # Create unique session ID
        session_id = f"session_{uuid.uuid4().hex[:8]}"
        
        # Format preferences
        preferences_str = f"""
User Preferences:
- Region/Cuisine: {preferences.region}
- Taste Preferences: {', '.join(preferences.taste_preferences)}
- Meal Type: {preferences.meal_type}
- Time Available: {preferences.time_available}
- Allergies: {', '.join(preferences.allergies) if preferences.allergies else 'None'}
- Dislikes: {', '.join(preferences.dislikes) if preferences.dislikes else 'None'}
- Available Ingredients: {', '.join(preferences.available_ingredients)}
"""
        
        # Store in session
        user_sessions[session_id] = {
            "preferences": preferences_str,
            "current_recipe": None,
            "current_step_index": 0,
            "recipe_steps": [],
            "recipe_history": [],  # ✨ Track all completed steps
            "recipe_mapping": {}  # Map "Recipe 1" -> actual database name
        }

        # Get recommendations
        recommendations_result = recommender.recommend_recipes(preferences_str)
        
        # Handle both old (string) and new (dict) return formats
        if isinstance(recommendations_result, dict):
            recommendations = recommendations_result["response"]
            user_sessions[session_id]["recipe_mapping"] = recommendations_result.get("recipe_mapping", {})
            print(f"   💾 Stored recipe mapping: {recommendations_result.get('recipe_mapping', {})}")
        else:
            recommendations = recommendations_result  # Legacy string format

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