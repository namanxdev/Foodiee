"""
Session Storage Service
=======================
Hybrid approach: Supabase primary storage with in-memory cache
Manages user sessions, chat history, and image URLs
"""

import os
import json
from typing import Dict, Optional, List
from datetime import datetime
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

load_dotenv()

# In-memory cache for active sessions (for quick access)
_session_cache: Dict[str, dict] = {}


class SessionStorageService:
    """Service for managing user sessions in Supabase with in-memory caching"""
    
    def __init__(self, connection_string: str):
        """Initialize with Supabase connection string"""
        self.connection_string = connection_string
    
    def get_connection(self):
        """Get database connection"""
        return psycopg.connect(self.connection_string)
    
    def get_session(self, session_id: str, use_cache: bool = True) -> Optional[Dict]:
        """
        Get session from cache or database
        
        Args:
            session_id: Session identifier
            use_cache: Whether to use in-memory cache
            
        Returns:
            Session dict or None if not found
        """
        # Check cache first
        if use_cache and session_id in _session_cache:
            return _session_cache[session_id]
        
        # Fetch from database
        with self.get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute("""
                    SELECT 
                        session_id,
                        user_email,
                        user_preferences,
                        current_recipe_id,
                        current_step_index,
                        completed_steps,
                        viewed_recipes,
                        selected_recipe_name,
                        chat_history,
                        image_urls,
                        created_at,
                        last_accessed,
                        expires_at
                    FROM user_sessions
                    WHERE session_id = %s
                """, (session_id,))
                
                row = cursor.fetchone()
                
                if row:
                    session = dict(row)
                    # Parse JSONB fields
                    if isinstance(session.get('user_preferences'), str):
                        session['user_preferences'] = json.loads(session['user_preferences'])
                    
                    # Handle chat_history - ensure it's always a list
                    chat_history = session.get('chat_history')
                    if isinstance(chat_history, str):
                        session['chat_history'] = json.loads(chat_history)
                    elif chat_history is None:
                        session['chat_history'] = []
                    elif not isinstance(chat_history, list):
                        session['chat_history'] = []
                    
                    # Handle image_urls - ensure it's always a list
                    image_urls = session.get('image_urls')
                    if isinstance(image_urls, str):
                        session['image_urls'] = json.loads(image_urls)
                    elif image_urls is None:
                        session['image_urls'] = []
                    elif not isinstance(image_urls, list):
                        session['image_urls'] = []
                    
                    # Update cache
                    _session_cache[session_id] = session
                    return session
        
        return None
    
    def save_session(
        self,
        session_id: str,
        user_email: Optional[str] = None,
        user_preferences: Optional[Dict] = None,
        current_recipe_id: Optional[str] = None,
        current_step_index: int = 0,
        completed_steps: Optional[List[str]] = None,
        selected_recipe_name: Optional[str] = None,
        chat_history: Optional[List[Dict]] = None,
        image_urls: Optional[List[Dict]] = None,
        update_last_accessed: bool = True
    ) -> bool:
        """
        Save or update session in database and cache
        
        Args:
            session_id: Session identifier
            user_email: User email
            user_preferences: User preferences dict
            current_recipe_id: Current recipe UUID
            current_step_index: Current step index
            completed_steps: List of completed step texts
            selected_recipe_name: Selected recipe name
            chat_history: List of chat messages
            image_urls: List of image metadata
            update_last_accessed: Whether to update last_accessed timestamp
            
        Returns:
            True if successful
        """
        try:
            # Get existing session to preserve values if not provided
            existing_session = self.get_session(session_id, use_cache=False)
            
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    # Prepare data - use existing values if not provided
                    if user_preferences is None and existing_session:
                        user_preferences = existing_session.get('user_preferences')
                    if user_email is None and existing_session:
                        user_email = existing_session.get('user_email')
                    if current_recipe_id is None and existing_session:
                        current_recipe_id = existing_session.get('current_recipe_id')
                    if selected_recipe_name is None and existing_session:
                        selected_recipe_name = existing_session.get('selected_recipe_name')
                    if completed_steps is None and existing_session:
                        completed_steps = existing_session.get('completed_steps')
                    if chat_history is None and existing_session:
                        chat_history = existing_session.get('chat_history')
                    if image_urls is None and existing_session:
                        image_urls = existing_session.get('image_urls')
                    
                    # Use empty dict for user_preferences if still None (required field)
                    if user_preferences is None:
                        user_preferences = {}
                    
                    # Prepare JSON
                    prefs_json = json.dumps(user_preferences) if user_preferences else '{}'
                    chat_json = json.dumps(chat_history) if chat_history else '[]'
                    images_json = json.dumps(image_urls) if image_urls else '[]'
                    
                    # Update last_accessed if requested
                    last_accessed_clause = "last_accessed = TIMEZONE('utc', NOW())," if update_last_accessed else ""
                    
                    cursor.execute(f"""
                        INSERT INTO user_sessions (
                            session_id, user_email, user_preferences,
                            current_recipe_id, current_step_index, completed_steps,
                            selected_recipe_name, chat_history, image_urls,
                            created_at, last_accessed, expires_at
                        )
                        VALUES (
                            %s, %s, %s::jsonb, %s, %s, %s, %s, %s::jsonb, %s::jsonb,
                            COALESCE((SELECT created_at FROM user_sessions WHERE session_id = %s), TIMEZONE('utc', NOW())),
                            TIMEZONE('utc', NOW()),
                            TIMEZONE('utc', NOW()) + INTERVAL '24 hours'
                        )
                        ON CONFLICT (session_id) DO UPDATE SET
                            user_email = COALESCE(EXCLUDED.user_email, user_sessions.user_email),
                            user_preferences = COALESCE(EXCLUDED.user_preferences, user_sessions.user_preferences),
                            current_recipe_id = COALESCE(EXCLUDED.current_recipe_id, user_sessions.current_recipe_id),
                            current_step_index = COALESCE(EXCLUDED.current_step_index, user_sessions.current_step_index),
                            completed_steps = COALESCE(EXCLUDED.completed_steps, user_sessions.completed_steps),
                            selected_recipe_name = COALESCE(EXCLUDED.selected_recipe_name, user_sessions.selected_recipe_name),
                            chat_history = COALESCE(EXCLUDED.chat_history, user_sessions.chat_history),
                            image_urls = COALESCE(EXCLUDED.image_urls, user_sessions.image_urls),
                            {last_accessed_clause}
                            expires_at = TIMEZONE('utc', NOW()) + INTERVAL '24 hours'
                    """, (
                        session_id, user_email, prefs_json, current_recipe_id,
                        current_step_index, completed_steps, selected_recipe_name,
                        chat_json, images_json, session_id
                    ))
                    
                    conn.commit()
                    
                    # Update cache
                    session = self.get_session(session_id, use_cache=False)
                    if session:
                        _session_cache[session_id] = session
                    
                    return True
        except Exception as e:
            print(f"❌ Error saving session {session_id}: {e}")
            return False
    
    def add_chat_message(
        self,
        session_id: str,
        message_type: str,
        content: str,
        user_email: Optional[str] = None
    ) -> bool:
        """
        Add a message to chat history
        
        Args:
            session_id: Session identifier
            message_type: 'user_message', 'chatbot_message', or 'generated_image'
            content: Message content or image URL
            user_email: User email (for user_message type)
            
        Returns:
            True if successful
        """
        session = self.get_session(session_id)
        if not session:
            return False
        
        chat_history = session.get('chat_history') or []
        if not isinstance(chat_history, list):
            chat_history = []
        
        # Create message object
        message = {
            "type": message_type,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if message_type == "user_message" and user_email:
            message["user"] = user_email
        
        chat_history.append(message)
        
        # Save updated session
        return self.save_session(
            session_id=session_id,
            chat_history=chat_history,
            update_last_accessed=True
        )
    
    def add_image_url(
        self,
        session_id: str,
        image_url: str,
        step_index: int,
        step_description: Optional[str] = None
    ) -> bool:
        """
        Add image URL to session
        
        Args:
            session_id: Session identifier
            image_url: S3 URL of the image
            step_index: Step number (1-based)
            step_description: Optional step description
            
        Returns:
            True if successful
        """
        session = self.get_session(session_id)
        if not session:
            return False
        
        image_urls = session.get('image_urls') or []
        if not isinstance(image_urls, list):
            image_urls = []
        
        image_entry = {
            "url": image_url,
            "step_index": step_index,
            "step_description": step_description,
            "generated_at": datetime.utcnow().isoformat()
        }
        
        image_urls.append(image_entry)
        
        # Save updated session
        return self.save_session(
            session_id=session_id,
            image_urls=image_urls,
            update_last_accessed=True
        )
    
    def get_user_sessions(
        self,
        user_email: str,
        limit: int = 10,
        offset: int = 0
    ) -> List[Dict]:
        """
        Get user's session history with pagination
        
        Args:
            user_email: User email
            limit: Number of sessions to return
            offset: Offset for pagination
            
        Returns:
            List of session summaries
        """
        with self.get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute("""
                    SELECT * FROM get_user_session_history(%s, %s, %s)
                """, (user_email, limit, offset))
                
                rows = cursor.fetchall()
                return [dict(row) for row in rows]
    
    def get_user_session_count(self, user_email: str) -> int:
        """Get total number of sessions for a user"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT get_user_session_count(%s) as count
                """, (user_email,))
                
                result = cursor.fetchone()
                return result[0] if result else 0
    
    def is_session_owner(self, session_id: str, user_email: str) -> bool:
        """
        Check if user is the owner of a session
        
        Args:
            session_id: Session identifier
            user_email: User email to check
            
        Returns:
            True if user owns the session
        """
        session = self.get_session(session_id)
        if not session:
            return False
        
        return session.get('user_email') == user_email


# Global instance
_session_storage_service = None

def get_session_storage_service() -> SessionStorageService:
    """Get or create session storage service instance"""
    global _session_storage_service
    
    if _session_storage_service is None:
        supabase_url = os.getenv("SUPABASE_OG_URL")
        if not supabase_url:
            raise ValueError("SUPABASE_OG_URL not found in environment")
        _session_storage_service = SessionStorageService(supabase_url)
    
    return _session_storage_service

