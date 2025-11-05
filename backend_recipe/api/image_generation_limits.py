"""
Image Generation Limits API
===========================
Endpoints for checking and managing image generation limits per user
"""

import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row

load_dotenv()

router = APIRouter(prefix="/api/image-generation", tags=["image-generation-limits"])


# ============================================================================
# Request/Response Models
# ============================================================================

class ImageLimitCheckResponse(BaseModel):
    """Response for image generation limit check"""
    allowed: bool
    remaining_count: int
    total_count: int
    max_allowed: int
    message: Optional[str] = None


class ImageLimitIncrementResponse(BaseModel):
    """Response after incrementing image count"""
    success: bool
    remaining_count: int
    total_count: int
    max_allowed: int


# ============================================================================
# Helper Functions
# ============================================================================

def get_db_connection():
    """Get Supabase database connection"""
    supabase_url = os.getenv("SUPABASE_OG_URL")
    if not supabase_url:
        raise HTTPException(status_code=500, detail="Database not configured")
    return psycopg.connect(supabase_url)


# ============================================================================
# Image Generation Limit Endpoints
# ============================================================================

@router.get("/check-limit", response_model=ImageLimitCheckResponse)
async def check_image_generation_limit(
    user_email: str = Header(..., alias="X-User-Email")
):
    """
    Check if user can generate an image and return remaining credits
    
    Args:
        user_email: User's email address (from header)
        
    Returns:
        Limit check response with remaining credits
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                # Call database function
                cursor.execute("""
                    SELECT * FROM check_image_generation_limit(%s)
                """, (user_email,))
                
                result = cursor.fetchone()
                
                if not result:
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to check image generation limit"
                    )
                
                allowed = result['allowed']
                remaining = result['remaining_count']
                total = result['total_count']
                max_allowed = result['max_allowed']
                
                message = None
                if not allowed:
                    message = f"You have reached your daily limit of {max_allowed} images. Please try again tomorrow."
                
                return ImageLimitCheckResponse(
                    allowed=allowed,
                    remaining_count=remaining,
                    total_count=total,
                    max_allowed=max_allowed,
                    message=message
                )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error checking limit: {str(e)}"
        )


@router.post("/increment", response_model=ImageLimitIncrementResponse)
async def increment_image_generation_count(
    user_email: str = Header(..., alias="X-User-Email")
):
    """
    Increment user's image generation count after successful generation
    
    This should be called AFTER the image is successfully generated and stored.
    
    Args:
        user_email: User's email address (from header)
        
    Returns:
        Updated count information
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                # First check limit
                cursor.execute("""
                    SELECT * FROM check_image_generation_limit(%s)
                """, (user_email,))
                
                check_result = cursor.fetchone()
                
                if not check_result or not check_result['allowed']:
                    raise HTTPException(
                        status_code=403,
                        detail="Image generation limit exceeded. Please check your limit first."
                    )
                
                # Increment count
                cursor.execute("""
                    SELECT increment_image_generation_count(%s) as success
                """, (user_email,))
                
                conn.commit()
                
                # Get updated count
                cursor.execute("""
                    SELECT * FROM check_image_generation_limit(%s)
                """, (user_email,))
                
                updated_result = cursor.fetchone()
                
                return ImageLimitIncrementResponse(
                    success=True,
                    remaining_count=updated_result['remaining_count'],
                    total_count=updated_result['total_count'],
                    max_allowed=updated_result['max_allowed']
                )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error incrementing count: {str(e)}"
        )


@router.get("/status", response_model=ImageLimitCheckResponse)
async def get_image_generation_status(
    user_email: str = Header(..., alias="X-User-Email")
):
    """
    Get current image generation status without checking limit
    
    Args:
        user_email: User's email address (from header)
        
    Returns:
        Current status (this doesn't block generation, just shows info)
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute("""
                    SELECT 
                        image_generation_count_today as total_count,
                        image_generation_last_date as last_date
                    FROM users
                    WHERE email = %s
                """, (user_email,))
                
                result = cursor.fetchone()
                
                if not result:
                    # User doesn't exist yet, return defaults
                    return ImageLimitCheckResponse(
                        allowed=True,
                        remaining_count=10,  # Default limit
                        total_count=0,
                        max_allowed=10,
                        message="No limit tracking found"
                    )
                
                # Get max allowed from config
                cursor.execute("""
                    SELECT config_value->>'default' as default_max,
                           config_value->'per_user'->>%s as user_max
                    FROM admin_config
                    WHERE config_key = 'max_allowed_image_generation'
                """, (user_email,))
                
                config_result = cursor.fetchone()
                
                if config_result:
                    user_max = config_result['user_max']
                    default_max = config_result['default_max']
                    max_allowed = int(user_max) if user_max else int(default_max or 10)
                else:
                    max_allowed = 10  # Default
                
                total = result['total_count'] or 0
                remaining = max(0, max_allowed - total)
                
                return ImageLimitCheckResponse(
                    allowed=remaining > 0,
                    remaining_count=remaining,
                    total_count=total,
                    max_allowed=max_allowed,
                    message=None
                )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting status: {str(e)}"
        )

