"""
User Database Service
Handles user authentication and profile data storage with Supabase
"""

import os
from supabase import create_client, Client
from datetime import datetime
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()


class UserDatabaseService:
    """
    User database service for Supabase operations
    Handles user CRUD operations and preferences management
    """
    
    def __init__(self):
        """Initialize Supabase client"""
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_ANON_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables")
        
        self.client: Client = create_client(supabase_url, supabase_key)
        self.table_name = "users"
    
    def create_or_update_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new user or update existing user
        
        Args:
            user_data: User information from NextAuth
                - email (required): User's email
                - name (optional): User's full name
                - image (optional): User's profile image URL
                - google_id (optional): Google OAuth ID
        
        Returns:
            Dictionary with user data and success status
        """
        try:
            email = user_data.get("email")
            if not email:
                return {"success": False, "error": "Email is required"}
            
            # Check if user already exists
            existing_user = self.get_user_by_email(email)
            
            user_record = {
                "email": email,
                "name": user_data.get("name"),
                "image": user_data.get("image"),
                "google_id": user_data.get("google_id"),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            if existing_user:
                # Update existing user
                result = self.client.table(self.table_name).update(user_record).eq("email", email).execute()
                return {
                    "success": True,
                    "message": "User updated successfully",
                    "user": result.data[0] if result.data else None
                }
            else:
                # Create new user
                user_record["created_at"] = datetime.utcnow().isoformat()
                result = self.client.table(self.table_name).insert(user_record).execute()
                return {
                    "success": True,
                    "message": "User created successfully",
                    "user": result.data[0] if result.data else None
                }
        
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve user by email
        
        Args:
            email: User's email address
        
        Returns:
            User data dictionary or None if not found
        """
        try:
            result = self.client.table(self.table_name).select("*").eq("email", email).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error fetching user by email: {e}")
            return None
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve user by ID
        
        Args:
            user_id: User's database ID
        
        Returns:
            User data dictionary or None if not found
        """
        try:
            result = self.client.table(self.table_name).select("*").eq("id", user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error fetching user by ID: {e}")
            return None
    
    def update_user_preferences(self, email: str, preferences: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update user's food preferences
        
        Args:
            email: User's email
            preferences: Dictionary of preferences (allergies, dislikes, etc.)
        
        Returns:
            Success status and updated user data
        """
        try:
            update_data = {
                "preferences": preferences,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            result = self.client.table(self.table_name).update(update_data).eq("email", email).execute()
            return {
                "success": True,
                "message": "Preferences updated successfully",
                "user": result.data[0] if result.data else None
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_user_preferences(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get user's saved preferences
        
        Args:
            email: User's email
        
        Returns:
            User preferences or None
        """
        user = self.get_user_by_email(email)
        return user.get("preferences") if user else None
    
    def delete_user(self, email: str) -> Dict[str, Any]:
        """
        Delete user from database
        
        Args:
            email: User's email
        
        Returns:
            Success status
        """
        try:
            self.client.table(self.table_name).delete().eq("email", email).execute()
            return {"success": True, "message": "User deleted successfully"}
        except Exception as e:
            return {"success": False, "error": str(e)}


# Global instance for easy access
user_db_service = UserDatabaseService()
