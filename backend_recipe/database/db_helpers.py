"""
Database helper functions for recipe operations
"""

import json
from typing import List, Dict, Optional, Tuple
import psycopg
from psycopg.rows import dict_row

class RecipeDatabase:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
    
    def get_connection(self):
        """Get a database connection"""
        return psycopg.connect(self.connection_string, row_factory=dict_row)
    
    # ========================================================
    # Recipe Search & Filtering
    # ========================================================
    
    def find_recipes(
        self,
        cuisine: str,
        meal_type: str,
        max_time_minutes: int = 120,
        exclude_allergens: List[str] = None,
        taste_preferences: List[str] = None,
        limit: int = 20
    ) -> List[Dict]:
        """
        Find recipes matching user preferences using database filters
        This is MUCH faster than LLM generation
        """
        exclude_allergens = exclude_allergens or []
        taste_preferences = taste_preferences or []
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Build dynamic query
            query = """
                SELECT 
                    id,
                    name,
                    cuisine_type,
                    meal_type,
                    prep_time_minutes,
                    cooking_time_minutes,
                    total_time_minutes,
                    difficulty,
                    servings,
                    taste_profile,
                    allergens,
                    dietary_tags,
                    ingredients,
                    popularity_score,
                    -- Calculate match score
                    (
                        CASE WHEN cuisine_type = %s THEN 2 ELSE 0 END +
                        CASE WHEN %s = ANY(meal_type) THEN 2 ELSE 0 END +
                        CASE WHEN total_time_minutes <= %s THEN 1 ELSE 0 END +
                        (
                            SELECT COUNT(*)::float 
                            FROM unnest(taste_profile) t 
                            WHERE t = ANY(%s)
                        ) / GREATEST(array_length(%s::text[], 1), 1) +
                        popularity_score / 100
                    ) as match_score
                FROM recipes
                WHERE 
                    cuisine_type = %s
                    AND %s = ANY(meal_type)
                    AND total_time_minutes <= %s
                    AND NOT (allergens && %s)
                ORDER BY match_score DESC, popularity_score DESC
                LIMIT %s
            """
            
            cursor.execute(query, (
                cuisine, meal_type, max_time_minutes, taste_preferences, taste_preferences,
                cuisine, meal_type, max_time_minutes, exclude_allergens, limit
            ))
            
            return cursor.fetchall()
    
    def get_recipe_by_name(self, recipe_name: str) -> Optional[Dict]:
        """Get full recipe details by name"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    id, name, cuisine_type, meal_type,
                    prep_time_minutes, cooking_time_minutes, total_time_minutes,
                    difficulty, servings, taste_profile, allergens, dietary_tags,
                    ingredients, steps, tips
                FROM recipes
                WHERE name ILIKE %s
                LIMIT 1
            """, (recipe_name,))
            
            return cursor.fetchone()
    
    def get_recipe_by_id(self, recipe_id: str) -> Optional[Dict]:
        """Get full recipe details by ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    id, name, cuisine_type, meal_type,
                    prep_time_minutes, cooking_time_minutes, total_time_minutes,
                    difficulty, servings, taste_profile, allergens, dietary_tags,
                    ingredients, steps, tips
                FROM recipes
                WHERE id = %s
            """, (recipe_id,))
            
            return cursor.fetchone()
    
    def semantic_search(self, query_embedding: List[float], limit: int = 10) -> List[Dict]:
        """
        Semantic search using vector similarity
        Find recipes similar to the query embedding
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    id, name, cuisine_type, meal_type,
                    prep_time_minutes, cooking_time_minutes, total_time_minutes,
                    difficulty, servings, taste_profile, allergens, dietary_tags,
                    ingredients, steps, tips,
                    1 - (embedding <=> %s::vector) as similarity
                FROM recipes
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> %s::vector
                LIMIT %s
            """, (query_embedding, query_embedding, limit))
            
            return cursor.fetchall()
    
    # ========================================================
    # Recipe Images
    # ========================================================
    
    def get_recipe_image(
        self, 
        recipe_id: str, 
        image_type: str = "hero"
    ) -> Optional[str]:
        """Get cached image URL for a recipe"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT image_url
                FROM recipe_images
                WHERE recipe_id = %s AND image_type = %s
                LIMIT 1
            """, (recipe_id, image_type))
            
            result = cursor.fetchone()
            return result['image_url'] if result else None
    
    def save_recipe_image(
        self,
        recipe_id: str,
        image_type: str,
        image_url: str,
        prompt_used: str = None
    ):
        """Save a generated image to the database"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO recipe_images (recipe_id, image_type, image_url, prompt_used)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (recipe_id, image_type) 
                DO UPDATE SET 
                    image_url = EXCLUDED.image_url,
                    generated_at = NOW()
            """, (recipe_id, image_type, image_url, prompt_used))
            
            conn.commit()
    
    # ========================================================
    # Session Management
    # ========================================================
    
    def save_session(
        self,
        session_id: str,
        user_preferences: Dict,
        current_recipe_id: str = None,
        current_step_index: int = 0,
        completed_steps: List[str] = None
    ):
        """Save or update a user session"""
        completed_steps = completed_steps or []
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO user_sessions (
                    session_id, user_preferences, current_recipe_id, 
                    current_step_index, completed_steps, last_accessed
                )
                VALUES (%s, %s, %s, %s, %s, NOW())
                ON CONFLICT (session_id) 
                DO UPDATE SET 
                    user_preferences = EXCLUDED.user_preferences,
                    current_recipe_id = EXCLUDED.current_recipe_id,
                    current_step_index = EXCLUDED.current_step_index,
                    completed_steps = EXCLUDED.completed_steps,
                    last_accessed = NOW()
            """, (
                session_id,
                json.dumps(user_preferences),
                current_recipe_id,
                current_step_index,
                completed_steps
            ))
            
            conn.commit()
    
    def get_session(self, session_id: str) -> Optional[Dict]:
        """Retrieve a user session"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    session_id, user_preferences, current_recipe_id,
                    current_step_index, completed_steps, 
                    created_at, last_accessed
                FROM user_sessions
                WHERE session_id = %s
            """, (session_id,))
            
            result = cursor.fetchone()
            
            if result:
                # Update last accessed time
                cursor.execute("""
                    UPDATE user_sessions 
                    SET last_accessed = NOW()
                    WHERE session_id = %s
                """, (session_id,))
                conn.commit()
            
            return result
    
    def delete_session(self, session_id: str):
        """Delete a user session"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                DELETE FROM user_sessions
                WHERE session_id = %s
            """, (session_id,))
            
            conn.commit()
    
    # ========================================================
    # Analytics
    # ========================================================
    
    def track_event(
        self,
        recipe_id: str,
        event_type: str,
        session_id: str = None,
        user_preferences: Dict = None
    ):
        """Track recipe interactions for analytics"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO recipe_analytics (
                    recipe_id, event_type, session_id, user_preferences
                )
                VALUES (%s, %s, %s, %s)
            """, (
                recipe_id, 
                event_type, 
                session_id,
                json.dumps(user_preferences) if user_preferences else None
            ))
            
            # Update popularity score
            if event_type == 'selected':
                cursor.execute("""
                    UPDATE recipes 
                    SET popularity_score = popularity_score + 1
                    WHERE id = %s
                """, (recipe_id,))
            elif event_type == 'completed':
                cursor.execute("""
                    UPDATE recipes 
                    SET popularity_score = popularity_score + 2
                    WHERE id = %s
                """, (recipe_id,))
            
            conn.commit()
    
    def get_popular_recipes(
        self,
        cuisine: str = None,
        limit: int = 10
    ) -> List[Dict]:
        """Get most popular recipes"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            if cuisine:
                cursor.execute("""
                    SELECT 
                        id, name, cuisine_type, total_time_minutes,
                        difficulty, popularity_score
                    FROM recipes
                    WHERE cuisine_type = %s
                    ORDER BY popularity_score DESC
                    LIMIT %s
                """, (cuisine, limit))
            else:
                cursor.execute("""
                    SELECT 
                        id, name, cuisine_type, total_time_minutes,
                        difficulty, popularity_score
                    FROM recipes
                    ORDER BY popularity_score DESC
                    LIMIT %s
                """, (limit,))
            
            return cursor.fetchall()
    
    # ========================================================
    # Statistics
    # ========================================================
    
    def get_stats(self) -> Dict:
        """Get database statistics"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_recipes,
                    COUNT(DISTINCT cuisine_type) as cuisines,
                    AVG(total_time_minutes) as avg_cook_time,
                    SUM(CASE WHEN difficulty = 'easy' THEN 1 ELSE 0 END) as easy_count,
                    SUM(CASE WHEN difficulty = 'medium' THEN 1 ELSE 0 END) as medium_count,
                    SUM(CASE WHEN difficulty = 'hard' THEN 1 ELSE 0 END) as hard_count
                FROM recipes
            """)
            
            return cursor.fetchone()
