"""
User Management API Routes
Handles user authentication and profile management
"""

from fastapi import APIRouter, HTTPException
from models import UserSignInRequest, UserResponse
from database.user_db import user_db_service

router = APIRouter(prefix="/api/user", tags=["users"])

@router.post("/signin", response_model=UserResponse)
async def user_signin(user_data: UserSignInRequest):
    """
    Create or update user when they sign in with NextAuth
    Call this endpoint from your NextAuth callback
    """
    try:
        result = user_db_service.create_or_update_user({
            "email": user_data.email,
            "name": user_data.name,
            "image": user_data.image,
            "google_id": user_data.google_id
        })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{email}")
async def get_user(email: str):
    """Get user information by email"""
    try:
        user = user_db_service.get_user_by_email(email)
        if user:
            return {"success": True, "user": user}
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{email}/preferences")
async def get_user_preferences_endpoint(email: str):
    """Get user's saved preferences"""
    try:
        preferences = user_db_service.get_user_preferences(email)
        if preferences:
            return {"success": True, "preferences": preferences}
        else:
            return {"success": False, "message": "No preferences found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
