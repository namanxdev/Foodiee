"""
Session management API routes
"""

from fastapi import APIRouter, HTTPException

from config import user_sessions
from helpers import get_session_history

router = APIRouter(prefix="/api", tags=["sessions"])

@router.get("/session/{session_id}")
async def get_session_info(session_id: str):
    """
    Get current session information
    """
    if session_id not in user_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = user_sessions[session_id]
    
    return {
        "session_id": session_id,
        "current_recipe": session.get("current_recipe"),
        "current_step": session.get("current_step_index", 0),
        "total_steps": len(session.get("recipe_steps", [])),
        "has_recipe": session.get("current_recipe") is not None
    }

@router.get("/session/{session_id}/history")
async def get_session_step_history(session_id: str):
    """
    Get complete step history for a session.
    Returns all steps completed from start to current position with metadata.
    """
    if session_id not in user_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    history = get_session_history(session_id)
    
    return {
        "session_id": session_id,
        "history": history,
        "total_completed_steps": len(history),
        "success": True
    }

@router.get("/history/{session_id}")
async def get_recipe_history(session_id: str):
    """
    API endpoint to retrieve the complete step history for a session.
    """
    if session_id not in user_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    history = get_session_history(session_id)
    
    return {
        "session_id": session_id,
        "history": history,
        "total_steps": len(history),
        "success": True
    }

@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """
    Delete a session
    """
    if session_id not in user_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    del user_sessions[session_id]
    
    return {
        "message": "Session deleted successfully",
        "success": True
    }