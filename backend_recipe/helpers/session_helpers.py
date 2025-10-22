"""
Session management helper functions
"""

from typing import List, Dict

def get_session_history(session_id: str) -> List[Dict]:
    """
    Retrieve complete step history for a session.
    Returns list of step objects from start to current position.
    
    Example:
        history = get_session_history("session_abc123")
        # Returns: [
        #     {"step_number": 1, "step_text": "STEP 1: ...", "timestamp": "2025-10-22T...", "image_generated": false, "image_prompt": null},
        #     {"step_number": 2, "step_text": "STEP 2: ...", "timestamp": "2025-10-22T...", "image_generated": true, "image_prompt": "..."},
        # ]
    """
    # Import here to avoid circular import
    from config import user_sessions
    
    if session_id not in user_sessions:
        return []
    
    session = user_sessions[session_id]
    return session.get("recipe_history", [])

def get_session_history_text(session_id: str) -> str:
    """
    Get formatted text of all completed steps for context (useful for prompts).
    """
    history = get_session_history(session_id)
    if not history:
        return "No steps completed yet."
    
    text_parts = ["Previously completed steps:"]
    for entry in history:
        text_parts.append(f"- {entry['step_text']}")
    
    return "\n".join(text_parts)