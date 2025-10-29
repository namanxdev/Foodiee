"""
Image API Helpers - Shared utilities for image generation endpoints
"""

from typing import Dict, Tuple
from fastapi import HTTPException

from config import user_sessions


def validate_session_and_get_context(session_id: str) -> Tuple[Dict, str, str, int]:
    """
    Validate session and extract image generation context
    
    Args:
        session_id: Session identifier
        
    Returns:
        Tuple of (session, recipe_name, current_step, current_index)
        
    Raises:
        HTTPException: If session is invalid or no recipe is loaded
    """
    # Check if session exists
    if session_id not in user_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = user_sessions[session_id]
    
    # Check if recipe is loaded
    if not session["recipe_steps"]:
        raise HTTPException(status_code=400, detail="No recipe loaded")
    
    # Get current step index
    current_index = session["current_step_index"]
    if current_index == 0:
        current_index = 1  # If they haven't called next yet, show first step
    
    # Validate step exists
    steps = session["recipe_steps"]
    if current_index > len(steps):
        raise HTTPException(status_code=400, detail="No more steps")
    
    # Extract context
    current_step = steps[current_index - 1]
    recipe_name = session["current_recipe"]
    
    return session, recipe_name, current_step, current_index


def update_session_history(session: Dict, current_index: int, description: str):
    """
    Update session history with image generation info
    
    Args:
        session: User session dictionary
        current_index: Current step number
        description: Image generation prompt/description
    """
    if session["recipe_history"] and session["recipe_history"][-1]["step_number"] == current_index:
        session["recipe_history"][-1]["image_generated"] = True
        session["recipe_history"][-1]["image_prompt"] = description
