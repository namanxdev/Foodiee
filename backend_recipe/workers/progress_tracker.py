"""
Progress Tracker
================
Track and persist image generation progress in Supabase
"""

import os
from datetime import datetime
from typing import Dict, Optional, List
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

load_dotenv()


class ProgressTracker:
    """
    Manages job progress and logging in Supabase
    Provides real-time updates for monitoring dashboard
    """
    
    def __init__(self, job_id: int = None):
        """
        Initialize progress tracker
        
        Args:
            job_id: Existing job ID, or None to create new job
        """
        self.job_id = job_id
        self.conn = None
    
    def _get_connection(self):
        """Get database connection"""
        if self.conn is None or self.conn.closed:
            supabase_url = os.environ.get("SUPABASE_OG_URL")
            if not supabase_url:
                raise ValueError("SUPABASE_OG_URL not found in environment variables")
            self.conn = psycopg.connect(supabase_url, row_factory=dict_row)
        return self.conn
    
    # ========================================================================
    # Job Management
    # ========================================================================
    
    def create_job(
        self,
        image_type: str = "main",
        start_from_recipe_id: Optional[int] = None,
        total_recipes: int = 0
    ) -> int:
        """
        Create a new image generation job
        
        Args:
            image_type: Type of images to generate ('main', 'steps', 'all')
            start_from_recipe_id: Optional starting recipe ID
            total_recipes: Total number of recipes to process
            
        Returns:
            New job ID
        """
        conn = self._get_connection()
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO image_generation_jobs 
                (status, image_type, start_from_recipe_id, total_recipes, started_at)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, ('running', image_type, start_from_recipe_id, total_recipes, datetime.now()))
            
            self.job_id = cur.fetchone()['id']
            conn.commit()
        
        return self.job_id
    
    def update_job_status(
        self,
        status: str,
        current_recipe_id: Optional[int] = None,
        current_recipe_name: Optional[str] = None,
        error_message: Optional[str] = None
    ):
        """
        Update job status and current recipe
        
        Args:
            status: Job status ('running', 'completed', 'stopped', 'failed')
            current_recipe_id: Currently processing recipe ID
            current_recipe_name: Currently processing recipe name
            error_message: Error message if failed
        """
        if not self.job_id:
            raise ValueError("No job ID set")
        
        conn = self._get_connection()
        with conn.cursor() as cur:
            if status in ['completed', 'stopped', 'failed']:
                cur.execute("""
                    UPDATE image_generation_jobs
                    SET status = %s,
                        current_recipe_id = %s,
                        current_recipe_name = %s,
                        completed_at = %s,
                        error_message = %s
                    WHERE id = %s
                """, (status, current_recipe_id, current_recipe_name, datetime.now(), error_message, self.job_id))
            else:
                cur.execute("""
                    UPDATE image_generation_jobs
                    SET status = %s,
                        current_recipe_id = %s,
                        current_recipe_name = %s
                    WHERE id = %s
                """, (status, current_recipe_id, current_recipe_name, self.job_id))
            conn.commit()
    
    def update_progress(
        self,
        completed_count: Optional[int] = None,
        failed_count: Optional[int] = None,
        skipped_count: Optional[int] = None,
        last_processed_recipe_id: Optional[int] = None
    ):
        """
        Update job progress counters
        
        Args:
            completed_count: Number of successfully completed recipes
            failed_count: Number of failed recipes
            skipped_count: Number of skipped recipes (already have images)
            last_processed_recipe_id: Last successfully processed recipe ID
        """
        if not self.job_id:
            raise ValueError("No job ID set")
        
        conn = self._get_connection()
        with conn.cursor() as cur:
            updates = []
            values = []
            
            if completed_count is not None:
                updates.append("completed_count = %s")
                values.append(completed_count)
            
            if failed_count is not None:
                updates.append("failed_count = %s")
                values.append(failed_count)
            
            if skipped_count is not None:
                updates.append("skipped_count = %s")
                values.append(skipped_count)
            
            if last_processed_recipe_id is not None:
                updates.append("last_processed_recipe_id = %s")
                values.append(last_processed_recipe_id)
            
            if updates:
                values.append(self.job_id)
                query = f"UPDATE image_generation_jobs SET {', '.join(updates)} WHERE id = %s"
                cur.execute(query, values)
                conn.commit()
    
    def increment_counts(self, completed: int = 0, failed: int = 0, skipped: int = 0):
        """
        Increment progress counters
        
        Args:
            completed: Number to add to completed_count
            failed: Number to add to failed_count
            skipped: Number to add to skipped_count
        """
        if not self.job_id:
            raise ValueError("No job ID set")
        
        conn = self._get_connection()
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE image_generation_jobs
                SET completed_count = completed_count + %s,
                    failed_count = failed_count + %s,
                    skipped_count = skipped_count + %s
                WHERE id = %s
            """, (completed, failed, skipped, self.job_id))
            conn.commit()
    
    def check_should_stop(self) -> bool:
        """
        Check if job should be stopped (graceful stop requested)
        
        Returns:
            True if should stop, False otherwise
        """
        if not self.job_id:
            return False
        
        conn = self._get_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT should_stop FROM image_generation_jobs WHERE id = %s
            """, (self.job_id,))
            row = cur.fetchone()
            return row['should_stop'] if row else False
    
    # ========================================================================
    # Logging
    # ========================================================================
    
    def log(
        self,
        message: str,
        level: str = "INFO",
        recipe_id: Optional[int] = None,
        recipe_name: Optional[str] = None,
        error_details: Optional[Dict] = None,
        metadata: Optional[Dict] = None
    ):
        """
        Add a log entry
        
        Args:
            message: Log message
            level: Log level ('INFO', 'WARNING', 'ERROR', 'SUCCESS', 'DEBUG')
            recipe_id: Related recipe ID
            recipe_name: Related recipe name
            error_details: Additional error information (as JSON)
            metadata: Additional metadata (as JSON)
        """
        if not self.job_id:
            print(f"[{level}] {message}")  # Fallback to console if no job
            return
        
        conn = self._get_connection()
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO image_generation_logs
                (job_id, level, message, recipe_id, recipe_name, error_details, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                self.job_id,
                level,
                message,
                recipe_id,
                recipe_name,
                psycopg.types.json.Json(error_details) if error_details else None,
                psycopg.types.json.Json(metadata) if metadata else None
            ))
            conn.commit()
        
        # Also print to console for immediate feedback
        print(f"[{level}] {message}")
    
    def get_logs(self, limit: int = 100, level: Optional[str] = None) -> List[Dict]:
        """
        Get logs for current job
        
        Args:
            limit: Maximum number of logs to return
            level: Filter by log level (optional)
            
        Returns:
            List of log entries
        """
        if not self.job_id:
            return []
        
        conn = self._get_connection()
        with conn.cursor() as cur:
            if level:
                cur.execute("""
                    SELECT * FROM image_generation_logs
                    WHERE job_id = %s AND level = %s
                    ORDER BY timestamp DESC
                    LIMIT %s
                """, (self.job_id, level, limit))
            else:
                cur.execute("""
                    SELECT * FROM image_generation_logs
                    WHERE job_id = %s
                    ORDER BY timestamp DESC
                    LIMIT %s
                """, (self.job_id, limit))
            
            return cur.fetchall()
    
    # ========================================================================
    # Cleanup
    # ========================================================================
    
    def close(self):
        """Close database connection"""
        if self.conn and not self.conn.closed:
            self.conn.close()
    
    def __enter__(self):
        """Context manager support"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager cleanup"""
        self.close()
