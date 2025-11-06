"""
Optional Persistence Layer for Cumulative Recipe State
Allows saving state to database for analysis and debugging
"""

import json
from typing import Optional, Dict
import psycopg
from psycopg.rows import dict_row

from core.cumulative_state import CumulativeRecipeState


class CumulativeStatePersistence:
    """Handles database persistence of cumulative recipe states"""
    
    def __init__(self, connection_string: str):
        """
        Initialize persistence layer
        
        Args:
            connection_string: Database connection string
        """
        self.connection_string = connection_string
    
    def save_state(self, session_id: str, state: CumulativeRecipeState) -> Optional[str]:
        """
        Save cumulative state to database
        
        Args:
            session_id: Session identifier
            state: CumulativeRecipeState instance
            
        Returns:
            State ID if saved successfully
        """
        try:
            state_summary = state.get_state_summary()
            
            with psycopg.connect(self.connection_string, row_factory=dict_row) as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT save_cumulative_state(
                            %s, %s, %s, %s, %s, %s
                        ) as state_id
                    """, (
                        session_id,
                        state_summary["recipe_name"],
                        state_summary["current_visual_state"],
                        state_summary["ingredients_added"],
                        state_summary["steps_completed"],
                        json.dumps(state_summary["step_history"])
                    ))
                    
                    result = cursor.fetchone()
                    conn.commit()
                    
                    return str(result["state_id"]) if result else None
                    
        except Exception as e:
            print(f"Failed to save cumulative state: {e}")
            return None
    
    def load_state(self, session_id: str) -> Optional[Dict]:
        """
        Load cumulative state from database
        
        Args:
            session_id: Session identifier
            
        Returns:
            State data dictionary or None
        """
        try:
            with psycopg.connect(self.connection_string, row_factory=dict_row) as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT * FROM get_cumulative_state(%s)
                    """, (session_id,))
                    
                    result = cursor.fetchone()
                    
                    if result:
                        return {
                            "id": str(result["id"]),
                            "recipe_name": result["recipe_name"],
                            "current_visual_state": result["current_visual_state"],
                            "ingredients_added": result["ingredients_added"],
                            "steps_completed": result["steps_completed"],
                            "step_history": result["step_history"]
                        }
                    
                    return None
                    
        except Exception as e:
            print(f"Failed to load cumulative state: {e}")
            return None
    
    def cleanup_old_states(self, days_to_keep: int = 7):
        """
        Clean up old cumulative states
        
        Args:
            days_to_keep: Number of days to keep states
        """
        try:
            with psycopg.connect(self.connection_string) as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        DELETE FROM recipe_cumulative_states
                        WHERE created_at < NOW() - INTERVAL '%s days'
                    """, (days_to_keep,))
                    
                    deleted_count = cursor.rowcount
                    conn.commit()
                    
                    print(f"Cleaned up {deleted_count} old cumulative states")
                    
        except Exception as e:
            print(f"Failed to cleanup old states: {e}")
