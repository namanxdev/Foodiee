"""
User-related Pydantic models
All models for user authentication and profile management
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class UserSignInRequest(BaseModel):
    """User sign-in request from NextAuth"""
    email: str = Field(..., description="User's email address")
    name: Optional[str] = Field(None, description="User's full name")
    image: Optional[str] = Field(None, description="User's profile image URL")
    google_id: Optional[str] = Field(None, description="Google OAuth ID")


class UserResponse(BaseModel):
    """Standard user response"""
    success: bool = Field(..., description="Whether the operation was successful")
    message: str = Field(..., description="Status message")
    user: Optional[Dict[str, Any]] = Field(None, description="User data")


class UserPreferencesUpdate(BaseModel):
    """Request to update user preferences"""
    allergies: Optional[List[str]] = Field(None, description="Food allergies")
    dislikes: Optional[List[str]] = Field(None, description="Food dislikes")
    favorite_cuisines: Optional[List[str]] = Field(None, description="Favorite cuisine types")
    dietary_restrictions: Optional[List[str]] = Field(None, description="Dietary restrictions")
