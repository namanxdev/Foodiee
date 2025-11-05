"""
Session management API routes
"""

from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from config import user_sessions
from helpers import get_session_history
from database.session_storage_service import get_session_storage_service

router = APIRouter(prefix="/api", tags=["sessions"])

@router.get("/session/{session_id}")
async def get_session_info(
    session_id: str,
    user_email: Optional[str] = Header(None, alias="X-User-Email")
):
    """
    Get current session information
    
    Tries Supabase first, falls back to in-memory
    """
    # Try Supabase first
    try:
        session_storage = get_session_storage_service()
        session = session_storage.get_session(session_id)
        
        if session:
            # Convert Supabase session to expected format
            completed_steps = session.get("completed_steps") or []
            if not isinstance(completed_steps, list):
                completed_steps = []
            
            return {
                "session_id": session_id,
                "current_recipe": session.get("selected_recipe_name"),
                "current_step": session.get("current_step_index", 0),
                "total_steps": len(completed_steps),
                "has_recipe": session.get("selected_recipe_name") is not None,
                "is_owner": session_storage.is_session_owner(session_id, user_email) if user_email else False,
                "user_email": session.get("user_email")
            }
    except Exception as e:
        print(f"⚠️  Supabase session lookup failed: {e}")
    
    # Fallback to in-memory
    if session_id not in user_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = user_sessions[session_id]
    
    recipe_steps = session.get("recipe_steps") or []
    if not isinstance(recipe_steps, list):
        recipe_steps = []
    
    return {
        "session_id": session_id,
        "current_recipe": session.get("current_recipe"),
        "current_step": session.get("current_step_index", 0),
        "total_steps": len(recipe_steps),
        "has_recipe": session.get("current_recipe") is not None,
        "is_owner": True,  # In-memory sessions are always owned
        "user_email": None
    }

@router.get("/session/{session_id}/history")
async def get_session_step_history(
    session_id: str,
    user_email: Optional[str] = Header(None, alias="X-User-Email")
):
    """
    Get complete step history for a session.
    Returns all steps completed from start to current position with metadata.
    
    Also returns chat history from Supabase if available.
    """
    # Try Supabase first
    try:
        session_storage = get_session_storage_service()
        session = session_storage.get_session(session_id)
        
        if session:
            chat_history = session.get('chat_history') or []
            # Ensure it's a list, not None
            if chat_history is None:
                chat_history = []
            if not isinstance(chat_history, list):
                chat_history = []
            
            return {
                "session_id": session_id,
                "history": get_session_history(session_id) if session_id in user_sessions else [],
                "chat_history": chat_history,
                "total_completed_steps": len(get_session_history(session_id)) if session_id in user_sessions else 0,
                "total_chat_messages": len(chat_history),
                "success": True
            }
    except Exception as e:
        print(f"⚠️  Supabase history lookup failed: {e}")
    
    # Fallback to in-memory
    if session_id not in user_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    history = get_session_history(session_id)
    
    return {
        "session_id": session_id,
        "history": history,
        "chat_history": [],
        "total_completed_steps": len(history),
        "total_chat_messages": 0,
        "success": True
    }

@router.get("/history/{session_id}")
async def get_recipe_history(
    session_id: str,
    user_email: Optional[str] = Header(None, alias="X-User-Email")
):
    """
    API endpoint to retrieve the complete step history for a session.
    Includes chat history from Supabase.
    """
    # Try Supabase first
    try:
        session_storage = get_session_storage_service()
        session = session_storage.get_session(session_id)
        
        if session:
            chat_history = session.get('chat_history') or []
            image_urls = session.get('image_urls') or []
            # Ensure they're lists, not None
            if chat_history is None:
                chat_history = []
            if image_urls is None:
                image_urls = []
            if not isinstance(chat_history, list):
                chat_history = []
            if not isinstance(image_urls, list):
                image_urls = []
            
            return {
                "session_id": session_id,
                "history": get_session_history(session_id) if session_id in user_sessions else [],
                "chat_history": chat_history,
                "image_urls": image_urls,
                "total_steps": len(get_session_history(session_id)) if session_id in user_sessions else 0,
                "success": True
            }
    except Exception as e:
        print(f"⚠️  Supabase history lookup failed: {e}")
    
    # Fallback to in-memory
    if session_id not in user_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    history = get_session_history(session_id)
    
    return {
        "session_id": session_id,
        "history": history,
        "chat_history": [],
        "image_urls": [],
        "total_steps": len(history),
        "success": True
    }

@router.delete("/session/{session_id}")
async def delete_session(
    session_id: str,
    user_email: Optional[str] = Header(None, alias="X-User-Email")
):
    """
    Delete a session
    
    Only the owner can delete their session
    """
    # Check ownership in Supabase
    try:
        session_storage = get_session_storage_service()
        if user_email and not session_storage.is_session_owner(session_id, user_email):
            raise HTTPException(status_code=403, detail="You can only delete your own sessions")
        
        # Delete from Supabase
        import psycopg
        import os
        supabase_url = os.getenv("SUPABASE_OG_URL")
        if supabase_url:
            with psycopg.connect(supabase_url) as conn:
                with conn.cursor() as cursor:
                    cursor.execute("DELETE FROM user_sessions WHERE session_id = %s", (session_id,))
                    conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️  Supabase delete failed: {e}")
    
    # Delete from in-memory
    if session_id in user_sessions:
        del user_sessions[session_id]
    
    return {
        "message": "Session deleted successfully",
        "success": True
    }


# ============================================================================
# Session History Endpoints (for history page)
# ============================================================================

@router.get("/user/history")
async def get_user_session_history(
    page: int = 1,
    page_size: int = 10,
    user_email: str = Header(..., alias="X-User-Email")
):
    """
    Get user's session history with pagination
    
    Query params:
    - page: Page number (default: 1)
    - page_size: Items per page (default: 10)
    """
    try:
        session_storage = get_session_storage_service()
        
        offset = (page - 1) * page_size
        sessions = session_storage.get_user_sessions(user_email, limit=page_size, offset=offset)
        total_count = session_storage.get_user_session_count(user_email)
        total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 0
        
        return {
            "success": True,
            "sessions": [dict(s) for s in sessions],
            "total_count": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")