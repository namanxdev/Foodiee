"""
Image generation API routes - Gemini only
Production-optimized for Gemini API image generation
"""

import os
from fastapi import APIRouter, HTTPException, Header, Request

from models import ImageGenerationResponse
from core import RecipeRecommender
from core.s3_service import get_s3_service
from database.session_storage_service import get_session_storage_service
from helpers.image_helpers import validate_session_and_get_context, update_session_history

router = APIRouter(prefix="/api", tags=["images"])

# Global recommender instance (will be initialized in main.py)
recommender: RecipeRecommender = None

def set_recommender(rec: RecipeRecommender):
    """Set the global recommender instance"""
    global recommender
    recommender = rec


@router.post("/step/gemini_image", response_model=ImageGenerationResponse)
async def generate_gemini_image(
    request: Request,
    session_id: str,
    user_email: str = Header(..., alias="X-User-Email")
):
    """
    Generate image for current cooking step using Gemini API
    
    This endpoint:
    1. Checks user's image generation limit
    2. Generates image using Gemini
    3. Uploads to S3 in user_generated/ structure
    4. Stores URL in session
    5. Updates chat history
    
    Requires GOOGLE_API_KEY to be configured.
    """
    try:
        # Skip limit check for localhost testing
        is_localhost = request.client.host in ["127.0.0.1", "localhost", "::1"]
        skip_limit_check = is_localhost or os.getenv("SKIP_IMAGE_LIMIT", "").lower() == "true"
        
        if not skip_limit_check:
            # Check image generation limit first
            import psycopg
            from psycopg.rows import dict_row
            
            supabase_url = os.getenv("SUPABASE_OG_URL")
            if not supabase_url:
                raise HTTPException(status_code=500, detail="Database not configured")
            
            with psycopg.connect(supabase_url, row_factory=dict_row) as conn:
                with conn.cursor() as cursor:
                    # Call database function directly
                    cursor.execute("""
                        SELECT * FROM check_image_generation_limit(%s)
                    """, (user_email,))
                    
                    limit_result = cursor.fetchone()
                    
                    if not limit_result or not limit_result['allowed']:
                        message = f"You have reached your daily limit of {limit_result['max_allowed']} images. Please try again tomorrow."
                        raise HTTPException(
                            status_code=403,
                            detail=message
                        )
        else:
            print(f"   ⚠️  Skipping image generation limit check for localhost testing (client: {request.client.host})")
        
        # Validate session and get context
        session, recipe_name, current_step, current_index = validate_session_and_get_context(session_id)
        
        # Get recipe ingredients for cumulative state tracking
        recipe_ingredients = []
        if "parsed_recipe" in session and session["parsed_recipe"]:
            recipe_data = session["parsed_recipe"]
            # Extract ingredients list from the recipe data
            if "ingredients" in recipe_data:
                ingredients_text = recipe_data["ingredients"]
                # Parse ingredients (simple extraction)
                import re
                ingredients_lines = ingredients_text.strip().split('\n')
                for line in ingredients_lines:
                    # Extract ingredient name (before quantities/measurements)
                    ingredient_match = re.search(r'-\s*([^-\d]+?)(?:\s*[-\d]|$)', line)
                    if ingredient_match:
                        ingredient_name = ingredient_match.group(1).strip()
                        recipe_ingredients.append(ingredient_name)
        
        # Generate image using Gemini with cumulative state
        try:
            # Check if method supports cumulative state parameters
            import inspect
            method = getattr(recommender, 'generate_image_with_gemini')
            sig = inspect.signature(method)
            
            # If method supports the new parameters, use them
            if 'session_id' in sig.parameters:
                image_base64, description = recommender.generate_image_with_gemini(
                    recipe_name, 
                    current_step,
                    session_id=session_id,
                    step_index=current_index,
                    ingredients=recipe_ingredients
                )
                print(f"   ✅ Using cumulative state generation for step {current_index}")
            else:
                # Use standard method if cumulative state not supported
                image_base64, description = recommender.generate_image_with_gemini(
                    recipe_name, 
                    current_step
                )
                print(f"   ℹ️  Using standard generation (cumulative state not available)")
        except Exception as e:
            # Fallback to standard generation if anything fails
            print(f"⚠️  Image generation failed: {str(e)}")
            print(f"   Error type: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            # Try one more time with basic parameters
            try:
                image_base64, description = recommender.generate_image_with_gemini(
                    recipe_name, 
                    current_step
                )
            except Exception as fallback_error:
                print(f"❌ Fallback also failed: {str(fallback_error)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Image generation failed: {str(fallback_error)}"
                )
        
        # Update in-memory session history (for backward compatibility)
        update_session_history(session, current_index, description)
        
        image_url = None
        
        # If image was generated, increment count FIRST (regardless of S3 upload)
        if image_base64 and not skip_limit_check:
            try:
                # Increment generation count - do this FIRST after successful generation
                import psycopg
                supabase_url = os.getenv("SUPABASE_OG_URL")
                with psycopg.connect(supabase_url) as conn:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            SELECT increment_image_generation_count(%s) as success
                        """, (user_email,))
                        conn.commit()
                        print(f"   ✅ Incremented image generation count for {user_email}")
            except Exception as increment_error:
                print(f"⚠️  Failed to increment image count: {increment_error}")
                # Continue anyway - image was generated
        elif image_base64 and skip_limit_check:
            print(f"   ⚠️  Skipping image count increment for localhost testing")
            
            # Then upload to S3 and store in session
            try:
                # Upload to S3 using user_generated/ structure
                s3_service = get_s3_service()
                image_url = s3_service.upload_user_generated_step_image(
                    user_email=user_email,
                    session_id=session_id,
                    dish_name=recipe_name,
                    step_index=current_index,
                    image_base64=image_base64
                )
                
                # Store in Supabase session
                session_storage = get_session_storage_service()
                
                # Add to chat history
                session_storage.add_chat_message(
                    session_id=session_id,
                    message_type="generated_image",
                    content=image_url,
                    user_email=user_email
                )
                
                # Add to image_urls
                session_storage.add_image_url(
                    session_id=session_id,
                    image_url=image_url,
                    step_index=current_index,
                    step_description=current_step
                )
                
            except Exception as s3_error:
                print(f"⚠️  S3 upload failed: {s3_error}")
                # Continue without S3 URL - return base64 instead
                image_url = None
        
        # Return response
        if image_base64:
            return ImageGenerationResponse(
                image_data=image_base64 if not image_url else None,  # Return URL if uploaded
                description=description,
                success=True,
                generation_type="gemini",
                image_url=image_url  # Include S3 URL if available
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

